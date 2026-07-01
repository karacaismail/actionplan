# Mode-Profile Sözleşmesi — İş Modelinin Geri-Alınabilir Runtime Bileşimi

**Sürüm:** 1.0 · **Tarih:** 2026-07-01
**Durum:** Taslak sözleşme (kilitlenmeyi bekliyor — bkz. `plan-03` §6 ADR-A3 / `docs/adr-A3-mode-profile.md`).
**Kapsam:** `k-mode` kernel primitifinin (Mode-Profile) normatif sözleşmesi: bir tenant'ın iş modelini (B2C/B2B/C2C/D2C/B4B/hybrid) runtime'da, veri yıkmadan ve geri-alınabilir biçimde değiştiren katman.
**Kaynak/bağlam:** `plan-03-yeni-yonergeler-2026-07-01.md` §3.3 (Mode-Profile yönergesi), `core-contract-pack.md` §3.4 (`platform_mode_profile` primitifi), `plan-01` Dalga 2 (Commerce "B2C→B2B mod anahtarı" dikey dilimi).
**Aktörler:** İş-model yöneticisi (insan), AI öneri motoru (swarm), Motor (platform runtime), CI (GitHub Actions), tüketici uygulama (Commerce/CRM/PMS).

---

## 1. Amaç

Aynı platformdaki bir tenant bugün B2C (son tüketici, sepet, kart ödemesi), yarın B2B (bayi, teklif/RFQ, vadeli ödeme, KDV muafiyeti) çalışabilmelidir — hem de canlı sipariş ve faturaları yıkmadan. Bunu ayrı deploy ile çözmek 16 uygulamalık portföyde sürdürülemez; her yeni uygulama sıfırdan mod modeli yazarsa hata yüzeyi 16 kez tekrarlanır. Bu sözleşme, "hangi capability + hangi surface/workflow versiyonu + hangi policy override aktif" sorusunu tek, versiyonlanmış, geri-alınabilir bir nesneye (`mode_profile`) bağlar. Geçiş bir *konfigürasyon* değişimidir; şema/veri değişimi değildir.

## 2. Kapsam

Bu sözleşme kapsar: (a) `mode_profile` ve `mode_transition` veri modelinin alan yapısını, (b) `preview → validate → publish → rollback` kontrollü geçiş kapı zincirini, (c) canlı-veri korunumu invariant'ını, (d) tüketici uygulamaların moddan türeyen runtime endpoint'lerini (`/runtime/tenant-capabilities`, `/runtime/navigation`, `/runtime/forms/*`). Bu sözleşme bir *yönerge* (mimari tarif) verir; implementasyon kodunu ajanlar `plan-01` Dalga 2 promptuyla yazar.

## 3. Non-goals (kapsam dışı)

Bu sözleşme şunları yapmaz: **(1)** Editions/paketleme varyantı tanımlamaz — o `k-capability` + plan işidir. **(2)** "Tek tık serbest anahtar" sunmaz; validasyon + insan onayı + rollback zorunludur. **(3)** Yeni tablo/şema göçü tetiklemez; capability bayraklarını ve versiyon referanslarını değiştirir, kolon eklemez/silmez. **(4)** Capability *tanımı* üretmez (girdiyi `k-capability`'den okur). **(5)** Yetki *kararı* vermez; kararı `k-policy-pdp` verir, mod yalnızca PDP'ye girdi (policy override) besler.

## 4. Tanım (jargon, ilk geçişte açıklama)

- **Mode / iş-modeli:** Platformun bir tenant için davranış kalıbı (b2c | b2b | c2c | d2c | b4b | hybrid). Rol değil; runtime bileşim.
- **Mode-Profile:** Bir tenant+channel için aktif capability kümesini, fiyat/checkout/vergi politika referanslarını ve surface/workflow versiyonlarını toplayan versiyonlu nesne.
- **Mode-Transition:** İki profil arası kontrollü geçişin kaydı; dry-run raporunu, eksik alan listesini, onaylayanı ve rollback bağını taşır.
- **Kontrollü geçiş (ADMIN_FLOW):** Yönetici işleminin geçmesi zorunlu kapı zinciri: `preview` (kuru bakış) → `validate` (dry-run + eksik-alan raporu) → `publish` (insan onaylı uygulama) → `rollback` (önceki profile dönüş).
- **Canlı-veri korunumu:** Geçiş sırasında mevcut sipariş/fatura kayıtlarının ne silinmesi ne bozulması; kapatılan surface'in verisinin arşivlenmesi (silinmemesi).
- **Config-driven / mode-aware surface:** Ön yüzün davranışı kodda `if b2b else` ile değil, runtime endpoint'lerinden okunan konfigürasyonla belirlenir.

## 5. Sözleşme şekli (alan | tip | amaç)

Aşağıdaki iki tablo Mode-Profile'ın veri modelini alan-alan tanımlar; alan adı + tip + amaç verir, dolu örnek veri (mock) vermez. Tipler SQLAlchemy 2.0 / SQLModel karşılığına eşlenir (`Mapped[...]`).

`mode_profile` tablosu — bir tenant+channel için aktif iş-model bileşimini tutar:

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Profil benzersiz tanımlayıcı |
| `tenant_id` | UUID (index, zorunlu) | Kiracı izolasyonu; v1 §2.1 fail-closed |
| `channel` | string | Kanal kapsamı (web/marketplace/pos); profil kanal başına ayrışır |
| `model` | enum(b2c\|b2b\|c2c\|d2c\|b4b\|hybrid) | Aktif iş modeli kalıbı |
| `active_capabilities` | list[string] | Bu profilde açık capability anahtarları (`k-capability`'den çözülür) |
| `pricing_policy_ref` | string | Fiyat politikası referansı (`k-computation` pricing profiline bağ) |
| `checkout_policy_ref` | string | Checkout/ödeme akışı politika referansı |
| `tax_policy_ref` | string | Vergi politikası referansı (`k-computation` tax profiline bağ) |
| `version` | string | Profil sürümü; rollback ve denetim için monoton |
| `is_active` | bool | Bu profilin tenant+channel için yürürlükte olup olmadığı |
| `created_at` / `updated_at` | datetime | Audit alanları |

`mode_transition` tablosu — iki profil arasındaki kontrollü geçişin denetlenebilir kaydını tutar:

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Geçiş kaydı tanımlayıcı |
| `tenant_id` | UUID (index) | Kiracı kapsamı |
| `from_profile` | UUID (FK → mode_profile) | Geçiş öncesi aktif profil |
| `to_profile` | UUID (FK → mode_profile) | Hedef profil (draft) |
| `dry_run_report` | jsonb | `validate` çıktısı: etkilenen capability/surface/policy farkı + canlı-veri kontrol sonucu |
| `missing_fields` | list[string] | Hedef modun gerektirdiği ama tenant'ta eksik alanlar (ör. şirket cari hesabı, B2B fiyat listesi, min sipariş adedi) |
| `approved_by` | UUID (FK → party) \| null | Onaylayan yetkili; `publish` için zorunlu |
| `applied_at` | datetime \| null | Uygulanma anı; null = henüz publish edilmedi |
| `rollback_of` | UUID (FK → mode_transition) \| null | Bu kayıt bir rollback ise geri aldığı geçiş |

## 6. WBS yerleşimi

Bu sözleşme, `plan-03` §5'teki kernel kümesine `module`-seviyesi bir düğüm olarak girer; altında asıl kod-teslimatını taşıyan en az bir `archetype` düğümü durur. Bir cümle: Mode-Profile en çok bağımlı primitif olduğu için kritik yolun sonunda konumlanır.

| Düğüm | Seviye | dependsOn | Küme |
|---|---|---|---|
| `k-mode` | module | `k-capability`, `k-party`, `k-policy-pdp` | kernel |

`dependsOn` teknik sırayı (kritik yol) verir: capability seti ve party rolleri okunmadan, PDP'ye policy override beslenmeden mod kurulamaz. `related` ile Commerce/CRM/PMS ArcheType ve Surface düğümlerine bağlanır (karar üretmez, yalnız gezinme). `task-to-code-contract` gereği `k-mode` bir `module` düğümü olarak sözleşme/şema taşır; kod alt `archetype` düğümünde yazılır.

## 7. Backend

Motor tarafı `platform_mode_profile` paketinde yaşar (`core-contract-pack` §3.4). Kontrollü geçiş bir servis akışıdır: `preview()` (capability/surface/policy farkını gösterir, hiçbir şey uygulamaz) → `validate()` (aktif verilere karşı dry-run; eksik-alan raporu üretir) → `publish()` (yalnız insan `approval_ref`'i ile; profil aktive edilir, önceki profil rollback için saklanır) → `rollback()` (önceki profile döner). SQLAlchemy 2.0 modeli + Alembic expand-contract migration (downgrade zorunlu) + Strawberry GraphQL tipi + REST endpoint (`Depends(require_tenant)` + `RequirePermission("mode_profile:apply")`). Her adımda `AuditLogger.log()` çağrılır; hata formatı `{code, message, trace_id, details}`; `get_logger()` kullanılır, `print()` yasaktır. Geçiş bir transaction içindedir ve `k-scale-invariant` (outbox + idempotency) taşır — çift-uygulama ve kayıp-event engellenir.

## 8. Frontend (config-driven, mode-aware)

Ön yüz aktif modu üç runtime endpoint'inden okur; davranışı koda gömmez:

Aşağıdaki tablo, tüketici yüzeyinin moddan neyi türettiğini endpoint bazında verir:

| Endpoint | Ne döndürür | Yüzey tüketimi |
|---|---|---|
| `GET /runtime/tenant-capabilities` | Aktif profilin `active_capabilities` seti | Aksiyon/alan capability-gate ile gösterilir/gizlenir |
| `GET /runtime/navigation` | Moda göre gezinme ağacı | Mode-aware menü; B2B'de RFQ, B2C'de sepet |
| `GET /runtime/forms/{archetype}` | Moda göre form şeması (alanlar, zorunluluk) | RHF/Zod ile projected form render |

Kural: React kodunda `if (mode === 'b2b') ... else ...` **yasaktır**. Yüzey `renderStrategy: projected` (şema-render) kullanır; mod farkı endpoint konfigürasyonundan gelir. Vite + React + TanStack Router/Query + RHF/Zod stack'i sabittir. Bu, binlerce koşul dalını tek konfigürasyon kaynağına indirger ve yeni mod eklerken kod değişimini sıfıra yaklaştırır.

## 9. Multi-tenant

Profil ve geçiş tümüyle `tenant_id` kapsamlıdır (v1 §2.1 fail-closed): A tenant B tenant'ın profilini ne okuyabilir ne değiştirebilir. Profil ayrıca `channel` başına ayrışır — aynı tenant web'de B2C, marketplace'te B2B olabilir. RLS veya schema-per-tenant kararı `adr-0026-tech-profiles`'a uyar. Geçişi yalnız `mode_profile:apply` iznine sahip party tetikleyebilir; izin kararı `k-policy-pdp`'den geçer.

## 10. AI guardrail

Dört-aktör iş bölümü (`core-contract-pack` §3.0.1) burada değiştirilemez biçimde uygulanır: **AI önerir → insan onaylar → motor uygular.** AI en fazla "bu tenant B2B'ye geçmeye hazır" *önerisi* ve `preview`/`validate` dry-run raporu üretir (`autonomy: draft`); `publish` yalnız insan `approval_ref`'i ile çalışır (`autonomy: none`). AI aktif profili doğrudan değiştiremez ve rollback tetikleyemez. Onay referansı olmayan `publish` çağrısı `ApprovalRequiredError` fırlatır ve audit'lenir. **Canlı-veri korunumu bir invariant'tır** (test zorunlu): hiçbir aktör — insan dahil — geçişte sipariş/fatura yıkamaz; kapatılan surface verisi arşivlenir, silinmez. AI main branch'e push edemez, app/module düğümü üretemez, ruleset override edemez.

## 11. Bağlama

Mode-Profile diğer primitiflerle şöyle bağlanır: `k-capability` aktif capability setini besler (mod onları açar/kapar, tanımlamaz); `k-party` şirket cari hesabı gibi B2B aktörlerini sağlar; `k-policy-pdp` mod'un `policy_overrides`'ını girdi alır (ör. B2B'de fiyat görünürlüğü kısıtı) ve fiyat görünürlüğü kararını verir; `k-computation` pricing/tax profillerini `*_policy_ref` üzerinden sağlar. `plan-01` Dalga 2'de Commerce dikey dilimi bu dört primitifi tüketerek B2C→B2B mod anahtarını uçtan uca kanıtlar.

## 12. Test stratejisi

Test-önce zorunludur (önce kırmızı, sonra yeşil):

| # | Test | Tür |
|---|---|---|
| 1 | `validate` eksik-alan raporunu doğru üretiyor (şirket cari hesabı, B2B fiyat listesi, min sipariş adedi) | Integration (pytest) |
| 2 | `publish` capability setini değiştiriyor (RFQ, vadeli ödeme aktif) | Integration |
| 3 | Canlı sipariş sayısı geçiş öncesi = sonrası (veri korunumu invariant) | Integration/E2E |
| 4 | `rollback` önceki moda dönüyor, yine veri kaybı yok | Integration |
| 5 | Versiyonlu config: eski profil versiyonu erişilebilir | Unit |
| 6 | B2B'de anonim kullanıcı fiyat görmüyor (PDP default-deny) | E2E |
| 7 | Cross-tenant izolasyon: A tenant B'nin profilini göremiyor | Integration |
| 8 | UI hiçbir `if b2b else` dalı içermiyor (config-driven) | Statik analiz / lint |

E2E katmanı Playwright + axe (WCAG 2.2 AA) ile çalışır.

## 13. Acceptance criteria

- AC-1: Bir tenant `preview → validate → publish` zinciriyle B2C'den B2B'ye geçebiliyor; her adım audit'e yazılıyor.
- AC-2: `validate` eksik alanları raporluyor; eksikler tamamlanmadan `publish` reddediliyor.
- AC-3: `publish` sonrası capability seti değişiyor; canlı sipariş/fatura sayısı ve içeriği korunuyor.
- AC-4: `rollback` önceki profile dönüyor; veri kaybı olmuyor.
- AC-5: Ön yüz üç runtime endpoint'inden konfigürasyon okuyor; kodda mod koşul dalı yok.
- AC-6: `publish` yalnız insan `approval_ref`'i ile çalışıyor; AI doğrudan uygulayamıyor.

## 14. Anti-patterns (yasak desenler)

- **"Tek tık serbest anahtar":** Validasyon/onay/rollback olmadan mod değiştirmek — felaket üretir, yasak.
- **`if b2b else` gömme:** Mod farkını React/servis koduna hardcode etmek; config-driven ilkesini bozar.
- **Veri yıkan geçiş:** Kapatılan surface'in verisini silmek; korunum invariant'ını ihlal eder.
- **Şema göçüyle mod:** Mod geçişini kolon ekleme/silme ile yapmak; mod konfigürasyondur, göç değildir.
- **AI'ın publish etmesi:** Onay kapısını atlayan otomatik uygulama; fail-closed ilkesini deler.
- **Capability tanımını mod içinde üretmek:** Capability `k-capability`'nin işidir; mod yalnız aktive eder.

## 15. DoD (Definition of Done)

§12'deki 8 testin tamamı yeşil; migration downgrade otomatik test geçti; canlı-veri-korunumu kanıtı üretildi; rollback kanıtlandı; a11y AA geçti; `check-core-contract`, `check-surface`, `check-execution-readiness` yeşil; `plan-01` Dalga 2 Commerce dilimi bu sözleşmeyle uçtan uca çalışıyor; PR açıldı, insan reviewer merge etti (main'e doğrudan push yok).

## 16. Requirement-ID tablosu

Aşağıdaki tablo sözleşmenin izlenebilir gereksinimlerini kimliklendirir; her satır bir gereksinim, katmanı, önceliği, test türü, ilgili acceptance criteria ve sahibiyle eşlenir.

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| MP-01 | `mode_profile` şeması (tenant+channel kapsamlı, versiyonlu) | Backend | P0 | Unit | AC-1 | Kernel geliştirici |
| MP-02 | `mode_transition` kaydı (dry-run + eksik-alan + onay + rollback bağı) | Backend | P0 | Unit | AC-2 | Kernel geliştirici |
| MP-03 | `validate` eksik-alan raporu doğru | Backend | P0 | Integration | AC-2 | Kernel geliştirici |
| MP-04 | `publish` capability setini değiştiriyor | Backend | P0 | Integration | AC-3 | Kernel geliştirici |
| MP-05 | Canlı-veri korunumu invariant (sipariş sayısı öncesi=sonrası) | Backend | P0 | Integration/E2E | AC-3 | Kernel geliştirici |
| MP-06 | `rollback` önceki moda dönüyor, veri kaybı yok | Backend | P0 | Integration | AC-4 | Kernel geliştirici |
| MP-07 | Runtime endpoint'leri moddan türer (`/runtime/*`) | Backend | P0 | Integration | AC-5 | Kernel geliştirici |
| MP-08 | Config-driven mode-aware surface (`if b2b else` yok) | Frontend | P0 | Statik analiz | AC-5 | Frontend geliştirici |
| MP-09 | Cross-tenant izolasyon | Multi-tenant | P0 | Integration | AC-1 | Kernel geliştirici |
| MP-10 | `publish` yalnız insan onayı; AI draft ile sınırlı | Governance | P0 | Integration | AC-6 | Kernel geliştirici |
| MP-11 | B2B anonim fiyat gizleme (PDP default-deny) | Governance | P1 | E2E | AC-3 | Kernel geliştirici |
| MP-12 | Versiyonlu config; eski profil erişilebilir | Backend | P1 | Unit | AC-4 | Kernel geliştirici |

---

*Kaynak yönerge: `plan-03` §3.3. Kardeş sözleşmeler: `capability-entitlement-contract.md`, `pdp-policy-contract.md`, `computation-derivation-contract.md`. Bu doküman hiçbir kod/şema/JSON dosyasına dokunmaz; yalnız sözleşme metnidir. Çelişki halinde `core-contract-pack.md` (kernel runtime) önceliklidir; bu doküman güncellenir. Sözleşmeyi değiştirme yetkisi yalnız insan onayındadır; AI bu dosyayı doğrudan güncelleyemez.*
