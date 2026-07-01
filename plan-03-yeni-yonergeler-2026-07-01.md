# Dosya 3 — Yeni Yönergeler: WBS / Core / App / Surface / ArcheType

**Tarih:** 2026-07-01 · **Bağlam:** `plan-01` Dalga 0-1 bu yönergeleri ADR ve şema olarak kilitler. · **Kural:** Bu dosya *sözleşme/mimari tarif* verir — implementasyon kodu değil. Kodu ajanlar `plan-01` promptlarıyla yazar.

**Bu dosya nedir:** Mevcut dokuz yönergenin gözden geçirilmesi + çelişkilerin uzlaştırılması + beş eksik primitif ve Surface v2 için yeni yönerge.
**Ne yapar:** "Ajan neye göre kod yazacak?" sorusunu yeni primitifler için cevaplar.
**Ne yapmaz:** Mevcut canon yönergelerin içeriğini değiştirmez (onlar insan onayıyla güncellenir); yenilerini ekler ve çelişkileri işaretler.

---

## 1. Mevcut yönerge envanteri — neyin üstüne kuruyoruz

Sade özet: repo zaten olgun bir yönerge setine sahip; yeni yönergeler bunların *desenini* (aynı şablon) izler, paralel bir sistem kurmaz. Tablodan önce not: dokuzunun ortak şablonu var (normatif başlık → jargon/metafor → amaç → kural tabloları → AI güvenlik invariantı → faz/kapı/kanıt → CI kapısı → risk keşfi).

| Yönerge | Neyi yönetir | Yeni yönergeye etkisi |
|---|---|---|
| `archetype-uretim-spec.md` | ArcheType üretim/düzenleme akışı, AI sınırı, migration güvenliği | §12'de 5 primitifi "yan-sözleşme" olarak anıyor — bu dosya onları tam yönergeye çeviriyor |
| `claude-ai-archetype-eca-directive.md` | AI'ın yapamayacakları (katı sınır) | Yeni primitiflerin AI guardrail'i buna uyar |
| `core-contract-pack.md` (v1+v2) | Kernel primitifleri (10 v1 + 15 v2) | v2'deki Actor/Capability/Mode/Computation zaten sözleşme; bu dosya WBS+şema yerleşimini veriyor |
| `surface-spec.md` | Surface SDUI sözleşmesi (22 tip) | §4 Surface v2 yönergesi bunu şema ile hizalıyor |
| `task-to-code-contract.md` | WBS düğüm ↔ 7-faz ↔ kod köprüsü | Yeni primitifler kernel-seviyesi düğüm olarak buraya girer |
| `ready-for-dev-gate.md` | DoR (başlanabilir mi?) kapısı | Yeni primitif düğümleri de 10-alan DoR'a uyar |
| `wbs-field-semantics.md` | parentId/dependsOn/blocks/related anlamı | Primitif bağımlılıkları dependsOn ile yazılır |
| `golden-node-examples.md` | 14-boyut dolu örnek düğüm | Primitif düğümleri golden desene uyar |
| `task-export-contract.md` | 3 export modu (brief/agent-prompt/evidence) | `plan-01` promptları bu Mode-2 formatını izler |

---

## 2. Çelişki uzlaştırma tablosu — insan onayına işaretli

Bu, `plan-00 §4`'ün yönerge-düzeyi karşılığıdır. Her satır: çelişki → çözüm → hangi mevcut dokümanın güncelleneceği → sahip. Tablodan önce sade özet: dört çelişki mevcut yönergelerin *içinde* yaşıyor; ikisi insan-eli gerektiriyor (canon), dördü ajan-PR ile kapanabilir.

| Çelişki | Çözüm (yönerge kararı) | Güncellenecek doküman | Sahip |
|---|---|---|---|
| AGENTS.md "Prisma backend" (C1) | "FastAPI + SQLAlchemy 2.0/SQLModel + Alembic" | `AGENTS.md:82` | İnsan (canon) |
| WCAG AAA varsayılan (C3) | Taban AA zorunlu; AAA yüzey-bazlı hedef | `src/schemas/surface.ts` + `surface-spec` ADR-S5'i kilitle | Ajan PR → İnsan |
| Surface i18n alanı yok (C4) | Surface şemasına `i18n{locales,defaultLocale,rtl,messagesRef}` | `src/schemas/surface.ts` | Ajan PR → İnsan |
| Scale opt-in (C5) | Para/sipariş yazan akışta outbox+idempotency zorunlu-invariant | Yeni `scale-invariant-directive` (§5) | Ajan PR → İnsan |
| 5 primitif kodda yok (C6) | §3'teki 5 yönerge + ADR-A1..A4, ADR-P1 | Yeni ADR + `src/schemas/archetype.ts` uzantısı | Ajan draft → İnsan |
| `data-api-contract` Prisma (bilinen) | Prisma→SQLAlchemy (zaten JSON'da "kaldırıldı" notu var; seed'ler bayat) | `tools/agents/seed-*.mjs` | Ajan PR → İnsan |

---

## 3. Yeni yönergeler — beş kernel primitifi

Beşi de aynı iskeleti izler: **tanım (nedir/yapar/yapmaz) → sözleşme şekli (alan yapısı, kod değil) → WBS yerleşimi → archetype/surface bağlama → AI guardrail → test stratejisi → DoD.** Sözleşme şekli *alan adı + tip + amaç* verir; dolu örnek veri (mock) vermez.

### 3.1 Actor / Party yönergesi (ADR-A1)

**Nedir:** Aynı kişi veya kurumun, bağlama göre birden çok rol taşıyabildiği polimorfik aktör modeli.
**Ne yapar:** Bir party'yi (person/organization) bir kez tanımlar; buyer/seller/employee/supplier rollerini *bağlam* (tenant/channel/app) filtresiyle çözer.
**Ne yapmaz:** Contact-yönetimi değil (mevcut `l1-party` contact-merkezliydi; bu ondan farklı, kernel-seviyesi). Rolü koda gömmez — rol veridir.

**Sözleşme şekli (alanlar, kod değil):**
- `party`: `id`, `type`(person|organization), `tenant_id`, çekirdek kimlik alanları, audit alanları.
- `party_role`: `party_id`, `role`(buyer|seller|employee|supplier|agent|…), `context`(tenant/channel/app kapsamı), `valid_from`, `valid_to`, `status`. Temporal alanlar rol geçmişi için.
- `party_relation`: `from_party`, `to_party`, `kind`(employs|owns|represents|…).

**WBS yerleşimi:** Kernel primitifi (L0). `l1-party`'den **terfi**: yeni düğüm `k-party`, seviye `module` altında archetype. Bağımlılık: `k-schema`, `k-tenancy`.
**Archetype/Surface bağlama:** ArcheType'lar Customer/Supplier/Employee tablosu yazmaz; `party` + `party_role`'e referans verir. Surface aktörü role göre gösterir.
**AI guardrail:** AI party rol *tanımı* öneremez uygulayamaz (`autonomy: draft`); insan onaylar. PDP kararı party rolüne bakar.
**Test stratejisi:** (1) polimorfizm (3 rol tek party), (2) bağlam-çözümü (rol tenant/channel filtresiyle), (3) temporal (geçmiş rol sorgusu), (4) tenant izolasyonu, (5) audit (rol değişimi loglanıyor).
**DoD:** Yukarıdaki 5 test yeşil; `core-contract-pack` tenant+audit uyumu; migration downgrade çalışıyor.

### 3.2 Capability / Entitlement yönergesi (ADR-A2)

**Nedir:** Bir yeteneğin (rfq, escrow, e_invoice, volume_pricing) bir aktör veya plan için açık/kapalı olmasının modeli — "user ∩ capability ∩ plan".
**Ne yapar:** Feature-gate (özellik kapısı) + lisans/entitlement'ı tek yerde tutar; capability seti Mode-Profile'a girdi olur.
**Ne yapmaz:** RBAC değildir. RBAC = rol→izin (bu kullanıcı silebilir mi?); Capability = plan→yetenek (bu tenant RFQ kullanabilir mi?). İkisi ayrı eksen; karıştırılmaz.

**Sözleşme şekli:**
- `capability`: `id`, `key`(escrow|rfq|net_terms|…), `description`, `category`.
- `plan`: `id`, `name`, `tier`.
- `plan_capability`: `plan_id`, `capability_id`.
- `entitlement`: `subject`(tenant/actor), `capability_id`, `source`(plan|grant|trial), `valid_from`, `valid_to`.

**WBS yerleşimi:** Kernel primitifi. Yeni düğüm `k-capability`, `module` altında archetype. Bağımlılık: `k-party`, `k-tenancy`.
**Bağlama:** Surface ve ArcheType, alan/aksiyonu capability-gate ile gösterir/gizler; PDP capability'ye bakar (yetenek yoksa deny).
**AI guardrail:** AI capability tanımı veya entitlement/lisans değiştiremez (`autonomy: none` lisans için; `draft` yeni capability önerisi için).
**Test stratejisi:** (1) plan→capability çözümü, (2) entitlement süre bitince kapanıyor, (3) capability olmadan aksiyon UI'da yok VE API'da reddediliyor, (4) grant/trial kaynak ayrımı.
**DoD:** 4 test yeşil; Mode-Profile capability setini buradan okuyabiliyor.

### 3.3 Mode-Profile yönergesi (ADR-A3)

**Nedir:** İş modelinin (B2C/B2B/C2C/D2C/B4B) *runtime bileşimi*: aktif capability seti + fiyat/checkout/vergi/permission kararları.
**Ne yapar:** Kontrollü mod geçişi sağlar: `preview(dry-run) → validate → publish → rollback`. Geçiş capability bayraklarını değiştirir, veriyi yıkmaz.
**Ne yapmaz:** Editions (paketleme varyantı) değildir. "Tek tık serbest anahtar" değildir — validasyon + insan onayı + rollback zorunludur. Canlı sipariş/faturayı bozmaz.

**Sözleşme şekli:**
- `mode_profile`: `id`, `tenant_id`, `channel`, `model`(b2c|b2b|c2c|d2c|b4b|hybrid), `active_capabilities[]`, `pricing_policy_ref`, `checkout_policy_ref`, `tax_policy_ref`, `version`.
- `mode_transition`: `from_profile`, `to_profile`, `dry_run_report`, `missing_fields[]`, `approved_by`, `applied_at`, `rollback_of`.

**WBS yerleşimi:** Kernel primitifi. Yeni düğüm `k-mode`, `module` altında archetype. Bağımlılık: `k-capability`, `k-party`, `k-policy-pdp`.
**Bağlama:** Runtime endpoint'leri (`/runtime/tenant-capabilities`, `/runtime/navigation`, `/runtime/forms/*`) mode'dan türer; surface config-driven okur — kodda `if b2b else` yasak.
**AI guardrail:** AI mod geçişi öneremez/uygulayamaz (`autonomy: none` publish için; en fazla `draft` dry-run önerisi). Canlı-veri korunumu **invariant** (test zorunlu). İnsan onayı geçişin içinde.
**Test stratejisi:** (1) dry-run eksik-alan raporu doğru, (2) publish capability setini değiştiriyor, (3) canlı sipariş sayısı geçiş öncesi=sonrası, (4) rollback önceki moda dönüyor, (5) versiyonlu config.
**DoD:** 5 test yeşil; `plan-01` Dalga 2 Commerce dilimi bu yönergeyle çalışıyor.

### 3.4 Computation / Derivation yönergesi (ADR-A4)

**Nedir:** Fiyat, vergi, BOM-patlama (ürün ağacı açılımı), bordro gibi *türetilmiş* değerlerin, saf-fonksiyon derivation (türetme) grafiği olarak modellenmesi.
**Ne yapar:** Girdi alanlarından çıktı alanını yeniden-hesaplanabilir ve denetlenebilir biçimde üretir; hesap hattını (derivation graph) görünür kılar.
**Ne yapmaz:** Serbest JS/SQL değildir (yapısaldır — güvenlik ve denetlenebilirlik için). Validation değildir: validation "değer doğru mu?" sorar; computation "değeri üret" der.

**Sözleşme şekli:**
- `computation`: `id`, `output_field`, `inputs[]`, `expr_kind`(formula|lookup-table|graph), `version`, `deterministic`(bool).
- `derivation_edge`: `computation_id`, `depends_on_field_or_computation`. Bütün graf **DAG** (döngüsüz) olmalı; BOM için `graph` kind (çok-seviyeli patlama).

**WBS yerleşimi:** Kernel primitifi. Yeni düğüm `k-computation`, `module` altında archetype. Bağımlılık: `k-schema`.
**Bağlama:** ArcheType "computed field"ları buna referans verir. Tüketiciler: Commerce (pricing), MRP (BOM-patlama + routing maliyeti), Accounting (defter türetme), HRMS (bordro).
**AI guardrail:** AI computation *ekleyebilir* (`autonomy: draft`) ama versiyon + insan onayı zorunlu; döngü (cycle) üretmesi testte engellenir.
**Test stratejisi:** (1) DAG doğrulaması (döngü yok), (2) determinism (aynı girdi → aynı çıktı), (3) yeniden-hesap (girdi değişince çıktı güncelleniyor), (4) versiyon (eski hesap eski değeri koruyor), (5) BOM çok-seviyeli patlama doğru.
**DoD:** 5 test yeşil; MRP BOM ve Commerce pricing bu primitifi tüketiyor.

### 3.5 PDP (Policy Decision Point) yönergesi (ADR-P1)

**Nedir:** Merkezî yetki-karar noktası. PDP = "bu aktör bu kaynakta bu eylemi yapabilir mi?" sorusuna tek yerden karar veren bileşen; policy-as-data (kural = veri).
**Ne yapar:** `actor + action + resource + context → allow/deny + gerekçe + karar-logu`. RBAC/ABAC/ReBAC'ı tek modelde birleştirir; izin-simülasyonu ("şu kullanıcı şunu yapabilir mi?") verir.
**Ne yapmaz:** Tek bir ArcheType'a gömülü değildir (bugün `accessPolicy` ArcheType'a gömülüydü — bu onu çıkarıp çapraz-kesen yapıyor). PEP (Policy Enforcement Point) değildir: PDP *karar verir*, PEP (endpoint/guard) *uygular*. Ruleset/ECA değildir: ECA otomasyondur (event→action), PDP yetkidir (can X do Y).

**Sözleşme şekli:**
- `policy`: `id`, `effect`(allow|deny), `target`(actor-selector, action, resource-type), `condition`(attribute/relation ifadesi), `priority`, `layer`(system|platform|tenant).
- `decision_log`: `request`(actor/action/resource/context), `decision`, `matched_policy_id`, `trace_id`, `ts`. Tamper-evident (hash-zinciri, `plan-01` D4 audit ile aynı).

**WBS yerleşimi:** Kernel primitifi. Yeni düğüm `k-policy-pdp`, `module` altında archetype. Bağımlılık: `k-party`, `k-capability`, `k-authz`.
**Bağlama:** Her modül karar için PDP'ye sorar; Party (rol) + Capability (yetenek) girdidir. Ruleset (`ruleset.ts`) ile ayrı katman: ECA = otomasyon, PDP = yetki.
**AI guardrail:** AI PDP policy'sini override/disable/bypass edemez (`autonomy: none`); yalnız *öneri* draft'ı. Karar-logu değiştirilemez.
**Test stratejisi:** (1) allow/deny doğruluğu, (2) default-deny (eşleşen policy yoksa reddet), (3) izin-simülasyonu doğru, (4) karar-logu tamper-evident, (5) performans (karar-cache; p95 bütçesi).
**DoD:** 5 test yeşil; Dalga 1'in diğer 4 primitifi PDP'yi çağırabiliyor; PDP çapraz-kesen olarak Commerce diliminde çalışıyor.

---

## 4. Surface v2 yönergesi — tüketici yüzeyi + AI-first + WCAG AA + i18n

Surface raporunun (`elestiri-03`) ana bulgusu: mevcut 8-tip katalog admin/CRUD-merkezli; tüketici ve AI-first yüzeyleri yok. `surface-spec.md` bunları tarif ediyor ama şema (`src/schemas/surface.ts`) hâlâ 8 tip + AAA + i18n-yok durumunda. Bu yönerge şemayı spec ile hizalar.

**Ne değişir (nedir/yapar/yapmaz):**
- **Yapar:** Surface taksonomisini ikiye ayırır — **Admin-Surface** (list/detail/form/board/dashboard/wizard/report/timeline) ve **Consumer-Surface** (feed/media-room/map-live/conversation/page-builder/data-grid/storefront-plp/pdp) + **Shop-Surface** (terminal/andon/gantt/kanban/oee/work-instruction).
- **Yapmaz:** Her yüzeyi şema-render'a (SDUI) zorlamaz. `renderStrategy` alanı: `projected` (jenerik şema-render) veya `custom` (elle-yazılan, yönetişimi korunarak) — "Facebook kapsamlı, YouTube stream" cilası `custom` ile mümkün.

**Şema değişiklikleri (alanlar):**
- `SurfaceTypeSchema` enum'ı Consumer + Shop tipleriyle genişler.
- `renderStrategy`: `projected | custom` (varsayılan `projected`).
- `a11y.wcag` varsayılanı `2.2-AA` (AAA yüzey-bazlı opt-in).
- Yeni `i18n`: `locales[]`, `defaultLocale`, `rtl`, `messagesRef`.
- Yeni `perf`: `renderMode`(csr|ssr|prerender), `cachePolicy`, `cwvBudget`(LCP/INP/CLS hedefleri).
- Yeni `aiSurface` (opsiyonel): `kind`(assistant|command-palette|nl-query|generative-view), `pdpGated`(bool, zorunlu true), `humanApproval`(bool).

**AI-first surface guardrail:** AI-first yüzeyler (nl-query, generative-view) PDP-gated + insan-onaylı olmalı; AI doğrudan üretim ayarı değiştiremez (öneri→önizleme→onay). `surface-spec §12` ile aynı.
**Test stratejisi:** (1) her yeni tip şemaya uyuyor, (2) `custom` renderStrategy yönetişim alanlarını (permission, a11y, i18n) yine de zorunlu tutuyor, (3) AI-surface pdpGated=true olmadan geçmiyor, (4) CWV bütçesi beyanı zorunlu.
**DoD:** Şema genişledi + testler yeşil; `surface-spec` ADR-S1..S7 kilitlendi; `check-surface` genişledi.

---

## 5. WBS yönerge güncellemesi + scale-invariant yönergesi

**WBS yerleşimi (yeni primitifler nereye girer):** Mevcut WBS numaralandırması `platform-wbs-plan`'da app=30, modüller=30.1-30.8, archetype=30.x.y. Beş primitif **kernel modülleri** olarak yeni bir küme oluşturur. Öneri: `k-*` önekiyle kernel kümesi (mevcut `k-schema`, `k-tenancy` ile aynı ailede):

Tablodan önce sade özet: beş primitif, mevcut kernel kümesine beş yeni `module`-seviyesi düğüm olarak eklenir; her biri altında en az bir `archetype` düğümü (asıl kod-teslimatı) durur.

| Düğüm | Seviye | Bağımlılık (dependsOn) | Küme |
|---|---|---|---|
| `k-party` | module | k-schema, k-tenancy | kernel |
| `k-capability` | module | k-party, k-tenancy | kernel |
| `k-mode` | module | k-capability, k-party, k-policy-pdp | kernel |
| `k-computation` | module | k-schema | kernel |
| `k-policy-pdp` | module | k-party, k-capability, k-authz | kernel |

Bağımlılıklar `wbs-field-semantics`'e uyar: `dependsOn` = teknik sıra (kritik yol); `k-mode` en çok bağımlı olduğu için en sonda. `related` ile ArcheType/Surface düğümlerine bağlanır (karar üretmez, gezinme).

**Scale-invariant yönergesi (yeni — C5 çözümü):**
- **Nedir:** Para/sipariş/stok yazan her akışın, unutulamaz biçimde outbox + idempotency taşıması kuralı.
- **Yapar:** Bu akışları CI kapısında (`check-scale-invariant`) zorunlu tutar; bayrak değil invariant.
- **Yapmaz:** Her akışa dayatmaz — yalnız "para/sipariş/stok mutasyonu" etiketli akışlara. Salt-okuma akışını yavaşlatmaz.
- **Kural:** Bir mutasyon "financial|order|inventory" etiketliyse ve outbox+idempotency yoksa, PR CI'da reddedilir. `plan-01` Dalga 4 bunu uygular.

---

## 6. Üretilecek yeni yönerge dosyaları (mevcut deseni izler)

Bu dosya *plan*; asıl yönergeler repoda ayrı doküman + ADR olarak yaşamalı (mevcut `docs/` deseni). Sade özet: aşağıdaki dosyalar `plan-01` Dalga 0-1'de ajan-draft + insan-onay ile oluşturulur.

- `docs/adr-K1-kernel-kimlik.md` — kernel = ArcheType motoru; stack FastAPI/SQLAlchemy; `atonota/kernel` (CI/CD repo) rolü ayrı; bayat TS/Prisma dokümanı sil.
- `docs/adr-A1-actor-party.md` + `docs/actor-party-contract.md`
- `docs/adr-A2-capability.md` + `docs/capability-entitlement-contract.md`
- `docs/adr-A3-mode-profile.md` + `docs/mode-profile-contract.md`
- `docs/adr-A4-computation.md` + `docs/computation-derivation-contract.md`
- `docs/adr-P1-pdp.md` + `docs/pdp-policy-contract.md`
- `docs/surface-v2-directive.md` (§4) + `surface-spec` ADR-S kilitleri
- `docs/scale-invariant-directive.md` (§5)
- `docs/ai-governance-master.md` — `claude-ai-archetype-eca-directive` + `task-export-contract` Mode-2 sınırlarını tek çatıda birleştirir; diğer tüm dokümanlar ona referans verir.

Her yeni yönerge, mevcut dokuz yönergenin ortak şablonunu izler: normatif başlık → tanım/jargon → amaç/kapsam → kural tabloları → AI güvenlik invariantı → faz/kapı/kanıt → CI kapısı → risk keşfi. Böylece yeni yönergeler sisteme yabancı durmaz; aynı dille konuşur.

