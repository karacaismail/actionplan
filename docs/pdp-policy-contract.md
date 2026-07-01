# PDP (Policy Decision Point) — Politika-Karar Sözleşmesi

**Tarih:** 2026-07-01 · **ADR:** ADR-P1 · **WBS düğümü:** `k-policy-pdp` · **Bağlam:** `plan-03 §3.5` yönergesini tam sözleşmeye çevirir. · **Kural:** Bu dosya *sözleşme/mimari tarif* verir — implementasyon kodu değil; kodu ajanlar `plan-01` Dalga-1 promptlarıyla yazar.

Kısa çerçeve: PDP, sistemin en çapraz-kesen çekirdek primitifidir. Bugüne kadar yetki kararı her ArcheType'ın içindeki `accessPolicy` alanına gömülüydü (dağınık, tek doğruluk kaynağı yok). Bu sözleşme onu çıkarıp merkezî, sorgulanabilir, tamper-evident bir karar noktasına dönüştürür. RBAC (rol), ABAC (öznitelik) ve ReBAC (ilişki) tek modelde birleşir.

---

## 1. Amaç

Sistemde "bu **aktör** bu **kaynakta** bu **eylemi** yapabilir mi?" sorusuna **tek merkezden**, deterministik ve denetlenebilir biçimde `allow/deny + gerekçe` cevabı üretmek. Yetki kararını iş kodundan ve ArcheType tanımından ayırıp **policy-as-data** (kural = veri) yapmak; böylece kuralı kod değişmeden güncelleyebilmek, her kararı loglayabilmek ve "kim neyi yapabilir?" sorusuna simülasyonla önceden cevap verebilmek.

## 2. Kapsam

- **Girer:** Yetki *kararı* (allow/deny), karar gerekçesi, karar-logu (tamper-evident), izin-simülasyonu (dry-run yetki sorgusu), policy modeli (RBAC/ABAC/ReBAC hybrid), katman çözümü (system/platform/tenant), karar-cache.
- **Girer (girdi olarak tüketir):** `Party` (aktörün rolü/kimliği), `Capability` (aktörün yeteneği), request-context (tenant, zaman, kaynak öznitelikleri, ilişki grafiği).
- **Çıkmaz:** Kararın *uygulanması* (bu PEP'in işi — bkz. §3), otomasyon tetikleme (ECA/ruleset'in işi — bkz. §11), kimlik doğrulama (authn — `k-identity`), kullanıcı arayüzü iş mantığı.

## 3. Non-goals (ne DEĞİLDİR)

Bu üç ayrım kernelin doğru kalması için normatiftir; ihlali anti-pattern sayılır (§15).

- **PEP (Policy Enforcement Point) değildir.** PDP *karar verir*; PEP (FastAPI endpoint dependency / guard / middleware) kararı *uygular* (isteği 403 ile keser veya geçirir). PDP hiçbir HTTP yanıtı döndürmez, hiçbir isteği bloklamaz — sadece `Decision` nesnesi üretir. Uygulama PEP katmanında olur.
- **ECA/Ruleset değildir.** ECA (`src/schemas/ruleset.ts`, `src/engine/eca.ts`) **otomasyondur**: `event → condition → action` (ör. "SLA aşıldı → yöneticiye bildir"). PDP **yetkidir**: `can(actor, action, resource)`. ECA bir eylemi *tetikler*; PDP bir eylemin *izinli olup olmadığını* söyler. ECA'nın `security-gate` kategorisi bile PDP'yi *çağırır*, PDP'nin yerine geçmez.
- **Authn (kimlik doğrulama) değildir.** PDP aktörün *kim olduğunu* doğrulamaz (bu `k-identity` / oturum katmanı); aktörün kimliğini **verili** kabul edip *ne yapabileceğine* karar verir.

## 4. Tanım — nedir / ne yapar / ne yapmaz

**Nedir:** Merkezî, çapraz-kesen yetki-karar bileşeni. Policy'ler veri olarak saklanır (`policy` tablosu); motor bir karar isteğini bu policy kümesiyle değerlendirir.

**Ne yapar:**
- `evaluate(actor, action, resource, context) → Decision(effect, reason, matched_policy_id, trace_id)` üretir.
- RBAC + ABAC + ReBAC'ı tek değerlendirme modelinde birleştirir (hybrid).
- Her kararı tamper-evident `decision_log`'a yazar (hash-zinciri).
- İzin-simülasyonu verir: "X kullanıcısı Y kaynağında Z yapabilir mi?" sorusunu *yan-etkisiz* cevaplar.
- Çatışan policy'leri `priority` + `deny-overrides` ile deterministik çözer.

**Ne yapmaz:**
- Kararı uygulamaz (PEP uygular).
- Otomasyon tetiklemez (ECA tetikler).
- Policy'yi AI ile kendiliğinden değiştirmez (`autonomy: none` — §10).
- Eşleşen policy yoksa "izin var" varsaymaz — **default-deny**.
- Karar-logunu silmeyi/değiştirmeyi mümkün kılmaz (append-only).

## 5. Sözleşme şekli — `policy` ve `decision_log`

Sözleşme iki veri yapısından oluşur. Şema-tarifidir; **mock/örnek veri içermez** (değerler tip ve amaçla anlatılır).

**`policy`** — değerlendirilecek yetki kuralı (policy-as-data). Aktör: platform/tenant policy-yöneticisi tanımlar; PDP motoru okur.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | `str` (ULID/UUID) | Policy'nin tekil kimliği; `matched_policy_id` bunu referanslar. |
| `effect` | `enum(allow, deny)` | Kural eşleşirse kararın yönü. |
| `target_actor` | `object` (actor-selector) | Kural hangi aktör(ler)e uygulanır: rol/party-type/capability seçici. |
| `target_action` | `str` (action-verb) | Hangi eylem: `read/create/update/delete/export/approve/...`. |
| `target_resource_type` | `str` | Hangi kaynak tipi (ArcheType id / kaynak sınıfı). |
| `condition` | `object` (yapısal ifade) | ABAC öznitelik + ReBAC ilişki koşulu (attr/op/value, relation). Boş = koşulsuz. |
| `priority` | `int` | Çatışma çözümünde sıralama; büyük öncelikli. |
| `layer` | `enum(system, platform, tenant)` | Policy'nin katmanı; `system` kilitli (§9). |
| `version` | `str` (semver) | Policy sürümü; karar-logunda hangi sürümün karar verdiğini izlemek için. |
| `enabled` | `bool` | Policy aktif mi (default `true`). AI bunu değiştiremez (§10). |

**`decision_log`** — verilen her kararın değiştirilemez kaydı. Aktör: PDP motoru yazar; hiçbir aktör güncelleyemez/silemez (append-only). `plan-01` D4 audit sözleşmesiyle aynı hash-zinciri.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | `str` (ULID) | Log kaydının tekil kimliği (zaman-sıralı). |
| `request_actor` | `object` | Kararı isteyen aktör (party-id, rol, capability özeti). |
| `request_action` | `str` | Sorulan eylem. |
| `request_resource` | `object` | Sorulan kaynak (tip + id + değerlendirilen öznitelikler). |
| `request_context` | `object` | Tenant, zaman, ilişki grafiği anlık görüntüsü. |
| `decision` | `enum(allow, deny)` | Verilen karar. |
| `reason` | `str` | İnsan-okunur gerekçe (hangi kural/neden). |
| `matched_policy_id` | `str \| null` | Kararı belirleyen policy; `null` = default-deny (eşleşme yok). |
| `layer_resolved` | `enum(system, platform, tenant)` | Kararın hangi katmandan geldiği. |
| `trace_id` | `str` | Dağıtık izleme kimliği (PEP isteğiyle korele). |
| `ts` | `datetime (UTC)` | Karar zamanı. |
| `prev_hash` | `str` | Bir önceki log kaydının hash'i (zincir). |
| `entry_hash` | `str` | Bu kaydın içerik hash'i = `hash(payload + prev_hash)`. Tamper-evident. |

## 6. WBS yerleşimi

Kernel primitifi olarak yerleşir; tek bir ArcheType'a ait değildir.

- **Düğüm:** `k-policy-pdp` (yeni), `module` altında archetype-seviyesi kernel düğümü.
- **Bağımlılık (`dependsOn`):** `k-party` (aktör/rol), `k-capability` (yetenek), `k-authz` (yetki temeli). ECA/ruleset düğümüyle **bağımlılık yok** — ayrı katman.
- **Tüketiciler:** Dalga-1'in diğer 4 primitifi ve tüm iş modülleri PDP'yi *çağırır* (dependsOn tersine). `accessPolicy` alanı ArcheType şemasından deprecate edilip PDP policy'lerine göç eder (migration güvenliği: alias + backfill, `wbs-field-semantics` uyumlu).

## 7. Backend sözleşmesi (FastAPI + SQLAlchemy 2.0/SQLModel + Alembic + PostgreSQL)

Çekirdek imza tek bir fonksiyondur; her şey bunun etrafında kurulur.

- **Ana API:** `evaluate(actor: Actor, action: str, resource: Resource, context: Context) -> Decision`. Saf/deterministik: aynı girdi + aynı policy kümesi → aynı karar. `Decision` = `(effect, reason, matched_policy_id, layer_resolved, trace_id)`.
- **Toplu API:** `evaluate_batch([...]) -> [Decision]` — permission-aware UI ve simülasyon için N sorguyu tek turda çözer (N+1 önler).
- **Değerlendirme algoritması (normatif sıra):** (1) İlgili policy'leri layer + target ile filtrele; (2) `condition`'ı context'e karşı çöz (ABAC attr + ReBAC relation); (3) eşleşenler arasında **deny-overrides**, sonra `priority`, sonra `layer` önceliği (system > platform > tenant); (4) hiç eşleşme yoksa **default-deny**; (5) her sonucu `decision_log`'a append-et (hash-zinciri).
- **Persistans:** `policy` ve `decision_log` PostgreSQL tabloları; SQLModel model, Alembic migration. `decision_log` append-only (UPDATE/DELETE için DB-seviyesi tetik/izin reddi + RLS). Tenant izolasyonu RLS (`tenant_id`) ile.
- **PEP entegrasyonu:** FastAPI `Depends(require(action, resource))` dependency PDP'yi çağırır; `deny` → `403`. PDP kodu HTTP bilmez; PEP ayrı katmandır.
- **YASAK:** Next.js, Supabase, Prisma. ORM = SQLAlchemy 2.0/SQLModel; migration = Alembic.

## 8. Frontend sözleşmesi (Vite + React + TanStack)

Frontend iki yetenek sunar: yetki-farkında render ve izin-simülasyonu ekranı.

- **Permission-aware rendering:** UI, aktörün göremeyeceği/yapamayacağı eylemi **göstermez** (buton/alan gizlenir veya disabled). Karar backend PDP'den gelir (`evaluate_batch` ile sayfa açılışında toplu çözülür), TanStack Query ile cache'lenir. Frontend **yetki hesaplamaz** — sadece backend kararını *yansıtır* (client-side yetki = anti-pattern; her mutasyon yine PEP'te doğrulanır).
- **İzin-simülasyonu ekranı:** Yönetici için "Şu kullanıcı şu kaynakta şunu yapabilir mi?" formu. Girdi: actor + action + resource(+context). Çıktı: `allow/deny` + gerekçe + eşleşen `policy.id` + hangi katman. **Yan-etkisiz** (dry-run — `decision_log`'a `simulation` işareti ile ayrı yazılır veya yazılmaz; üretim kararını değiştirmez). Bu ekran RBAC/ABAC/ReBAC şeffaflığını insanlaştırır.
- **Guardrail görünürlüğü:** Simülasyon ekranı, kararın hangi policy'den ve katmandan geldiğini gösterir; AI önerileri "draft" rozetiyle ayrışır ve yürürlükte değildir.

## 9. Multi-tenant + katman modeli

Policy'ler üç katmanda çözülür; katman hem izolasyon hem override sınırıdır.

| Katman | Kim yönetir | Değiştirilebilirlik | Amaç |
|---|---|---|---|
| `system` | Çekirdek (kilitli) | **Değiştirilemez** — AI ve tenant dokunamaz | Güvenlik tabanı, default-deny, ayrıcalık sınırları. |
| `platform` | Çekirdek ekip | Sadece insan çekirdek ekip | Ürün geneli yetki kuralları. |
| `tenant` | Tenant yöneticisi | Güvenli-param sınırında | Tenant'a özel roller/kurallar. |

- **İzolasyon:** Her karar `tenant_id`-scoped; PostgreSQL RLS ile bir tenant başka tenant'ın policy/log'una erişemez.
- **Override kuralı:** Alt katman üst katmanı **gevşetemez** (tenant, system deny'ini allow yapamaz). `system deny` mutlak. Katman önceliği: system > platform > tenant, ama sadece *daha kısıtlayıcı* yönde birleşir (deny-overrides).

## 10. AI guardrail (GÖMÜLÜ — normatif)

Bu invariant `claude-ai-archetype-eca-directive` ile aynı sertlikte, sözleşmenin ihlal edilemez çekirdeğidir.

- **`autonomy: none`.** AI, PDP policy'sini **override / disable / bypass / silme / `enabled=false` yapma** yetkisine sahip DEĞİLDİR. AI'ın PDP üzerindeki tek eylemi *öneri draft'ı* üretmektir (`status: draft`, yürürlükte değil).
- **İnsan onayı zorunlu:** Hiçbir policy AI eliyle yürürlüğe girmez; platform/tenant insan-yöneticisi onaylar. Draft → önizleme (simülasyonda etkisi gösterilir) → insan onayı → yürürlük.
- **Karar-logu değiştirilemez:** AI (ve hiçbir aktör) `decision_log`'u düzenleyemez/silemez; tamper-evident hash-zinciri kırılırsa doğrulama başarısız olur.
- **System katmanı AI'a kapalı:** `system` layer policy'leri AI için salt-okunur; öneri bile üretemez.

## 11. Bağlama — Party + Capability girdi, her modül PDP'ye sorar, ECA/ruleset ayrımı

PDP tek başına anlamlı değildir; girdisini iki primitiften alır, çıktısını tüm modüller tüketir.

- **Girdi — Party:** Aktörün rolü/kimliği. PDP `target_actor` seçicisini Party'ye göre çözer.
- **Girdi — Capability:** Aktörün yeteneği. Yetenek yoksa ilgili policy eşleşse bile eylem *mümkün değildir* (capability-gate; `plan-03` Surface bağlamıyla uyumlu: "yetenek yoksa deny").
- **Tüketici — her modül:** Commerce (pricing/order), MRP (BOM), Surface (buton görünürlüğü), her ArcheType typed-action — karar için PDP'ye sorar. Kararı kimse kendi içinde yeniden hesaplamaz (tek doğruluk kaynağı).
- **ECA/ruleset ayrımı (kritik):** `ruleset.ts` = adlandırılmış ECA otomasyon paketleri (event→action). PDP = yetki (can X do Y). Bir ECA kuralı bir eylem *tetiklerken*, o eylemin izinli olup olmadığını yine PDP'ye sorar. İki katman ayrıdır ve birbirinin yerine geçmez; `security-gate` ECA kategorisi PDP'yi *çağıran* bir otomasyondur, PDP değildir.

## 12. Performans

Yetki kararı her istekte sıcak yolda olduğundan bütçe serttir.

- **Karar-cache:** Değerlendirme sonucu `(actor, action, resource, context-hash)` anahtarıyla cache'lenir; policy sürümü (`version`) değişince invalidasyon. Cache **kararı** cache'ler, policy'yi değil.
- **Bütçe:** Cache-hit p95 ≤ 5 ms; cache-miss (tam değerlendirme) p95 ≤ 25 ms. Toplu (`evaluate_batch`) tek DB turu (N+1 yok).
- **Simülasyon:** Simülasyon üretim cache'ini kirletmez (ayrı/geçici namespace).
- **Ölçek-değişmez:** Performans bütçesi 100 policy'de de 100k policy'de de aynı hedef (indeksli filtre + katman-daraltma).

## 13. Test stratejisi

`plan-03 §3.5` beş testinin genişletilmiş hali; DoD'un çekirdeği.

1. **Allow/deny doğruluğu:** Bilinen aktör+eylem+kaynak matrisinde beklenen kararlar üretilir (RBAC + ABAC + ReBAC vakaları).
2. **Default-deny:** Eşleşen policy yoksa sonuç **deny**; `matched_policy_id = null` loglanır.
3. **Deny-overrides / öncelik:** Çatışan allow+deny'de deny kazanır; `priority` ve katman önceliği (system>platform>tenant) doğru çözülür.
4. **İzin-simülasyonu doğruluğu:** Simülasyon çıktısı gerçek `evaluate` ile birebir aynı kararı verir; yan-etkisizdir (üretim state'i değişmez).
5. **Tamper-evident log:** Kayıt eklenince hash-zinciri doğrulanır; bir kayıt elle bozulursa doğrulama **başarısız** olur (kanıtlanır).
6. **AI guardrail:** AI'ın policy `enabled=false`/silme/override denemesi reddedilir; sadece `draft` öneri üretilebildiği doğrulanır.
7. **Multi-tenant izolasyon:** Bir tenant başka tenant'ın policy/log'unu okuyamaz/etkileyemez (RLS).
8. **Performans:** Cache-hit/miss p95 bütçeleri (§12) karşılanır.

## 14. Acceptance criteria (kabul kriterleri)

- `evaluate(actor, action, resource, context)` deterministik `Decision` döner; `evaluate_batch` N+1'siz çalışır.
- Eşleşme yoksa **default-deny** ve `matched_policy_id=null` loglanır.
- Her karar `decision_log`'a hash-zinciriyle yazılır; zincir doğrulanabilir.
- İzin-simülasyonu ekranı yan-etkisiz doğru karar + gerekçe + katman gösterir.
- `system` policy AI ve tenant tarafından değiştirilemez; AI yalnız `draft` üretir.
- Dalga-1'in diğer 4 primitifi PDP'yi çağırabiliyor; PDP Commerce diliminde çapraz-kesen çalışıyor.
- 8 test yeşil; `check-core-contract` + PDP-özel grep-check yeşil.

## 15. Anti-patterns (kaçınılacaklar)

- **PDP'yi PEP yapmak:** PDP içinde HTTP kesme/403 döndürmek. → Karar PDP'de, uygulama PEP'te.
- **Yetkiyi ArcheType'a geri gömmek:** `accessPolicy`'yi tekrar düğüm-içi tanımlamak. → Tek doğruluk kaynağı PDP.
- **ECA ile yetki kararı vermek:** Ruleset/ECA kuralında "izin ver/verme" mantığı yazmak. → ECA tetikler, izni PDP'ye sorar.
- **Client-side yetki:** Frontend'de kararı hesaplamak ve backend'de doğrulamamak. → Frontend yansıtır, PEP her mutasyonu yeniden doğrular.
- **Default-allow:** Eşleşme yoksa geçirmek. → Her zaman default-deny.
- **AI'a policy yazdırmak:** AI önerisini otomatik yürürlüğe koymak. → Draft + insan onayı zorunlu.
- **Log'u mutable yapmak:** `decision_log`'a UPDATE/DELETE izni. → Append-only + hash-zinciri.
- **Cache'i policy'ye bağlamamak:** Policy değişince kararı invalidasyon etmemek (bayat karar). → `version`-anahtarlı invalidasyon.

## 16. Definition of Done (DoD)

- `policy` + `decision_log` SQLModel şemaları + Alembic migration mevcut; `decision_log` append-only ve RLS-scoped.
- `evaluate` + `evaluate_batch` implemente; deterministik ve default-deny.
- Tamper-evident hash-zinciri (`plan-01` D4 audit ile aynı) çalışıyor ve doğrulanabiliyor.
- Permission-aware rendering + izin-simülasyonu ekranı çalışıyor (yan-etkisiz).
- AI guardrail (`autonomy: none`) test-kanıtlı; system katmanı AI'a kapalı.
- 8 test yeşil; `check-core-contract`, `check-short-code`, `check-dependency-policy` yeşil.
- Dalga-1 diğer 4 primitifi PDP'yi çağırıyor; Commerce diliminde çapraz-kesen kanıtlı.
- ADR-P1 "Kilitli" statüsünde; `accessPolicy` deprecation + göç yolu belgeli.

## 17. Requirement-ID tablosu

İzlenebilirlik için her normatif gereksinim tekil ID taşır; test ve PR'lar bunları referanslar.

| ID | Gereksinim | Kaynak §  | Doğrulama |
|---|---|---|---|
| PDP-R01 | `evaluate(actor,action,resource,context)` deterministik `Decision` döner | §4, §7 | Test-1 |
| PDP-R02 | Eşleşme yoksa **default-deny** | §7, §13 | Test-2 |
| PDP-R03 | Çatışmada **deny-overrides** + priority + katman-önceliği | §7, §9 | Test-3 |
| PDP-R04 | RBAC+ABAC+ReBAC tek hybrid modelde birleşir | §4, §5 | Test-1 |
| PDP-R05 | Her karar tamper-evident `decision_log`'a yazılır (hash-zinciri) | §5, §7 | Test-5 |
| PDP-R06 | İzin-simülasyonu yan-etkisiz doğru karar verir | §8, §13 | Test-4 |
| PDP-R07 | `policy` policy-as-data; kod değişmeden güncellenir | §5 | Test-1 |
| PDP-R08 | Katman modeli system/platform/tenant; system kilitli | §9 | Test-3 |
| PDP-R09 | Multi-tenant RLS izolasyonu | §9 | Test-7 |
| PDP-R10 | AI `autonomy: none` — override/disable/silme yok, yalnız draft | §10 | Test-6 |
| PDP-R11 | Karar-logu append-only; AI/aktör değiştiremez | §10 | Test-5, Test-6 |
| PDP-R12 | Party + Capability girdi; yetenek yoksa deny | §11 | Test-1 |
| PDP-R13 | Her modül kararı PDP'ye sorar (tek doğruluk kaynağı) | §6, §11 | Acceptance |
| PDP-R14 | ECA/ruleset'ten ayrı katman (yetki ≠ otomasyon) | §3, §11 | Anti-pattern review |
| PDP-R15 | PDP ≠ PEP; PDP karar verir, uygulamaz | §3 | Anti-pattern review |
| PDP-R16 | Karar-cache + p95 bütçesi; version-anahtarlı invalidasyon | §12 | Test-8 |
| PDP-R17 | Permission-aware rendering backend kararını yansıtır (client-side yetki yok) | §8 | Test-4, review |
| PDP-R18 | Stack: FastAPI+SQLAlchemy 2.0/SQLModel+Alembic+PostgreSQL; Next/Supabase/Prisma YASAK | §7 | `check-dependency-policy` |
