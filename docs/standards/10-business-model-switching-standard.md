# İş-Modeli Geçişi — Anlatı Standardı (aslında CAPABILITY)

**Sürüm:** 1.0 — 2026-07-01
**Statü:** Anlatı dokümanı (ADR-A3 katmanı). **Kod karşılığı:** *mühendislik-standart JSON'u YOK* — bu bir Mode-Profile capability'sidir; makine sözleşmesi `src/schemas/archetype.ts` primitif şeması + `business_model_config` alanıdır, `src/data/standards/*.json` değil.
**Mode-Profile primitifi:** `docs/mode-profile-contract.md` (`k-mode`). Bu doküman onu *anlatır*; kuralı yeniden tanımlamaz.

---

## 1. UYARI — Başlıkta "standard" geçse de bu bir ENGINEERING STANDARD DEĞİLDİR

Bu dosyanın adı `10-business-model-switching-standard.md`'dir ve `docs/standards/` klasöründe durur; ama içeriği reponun 15 mühendislik standardından (`architecture`, `coding-standards`, `i18n-standards`, `observability`, …) biri **değildir**. Bu ayrım bu paketin en kritik kuralıdır (`plan-02` §1, `numeronym-siniflandirma.md` §1) ve şu şekilde uygulanır: bu doküman bir **capability**'yi (iş-modeli yeteneği) anlatır, bir engineering standardı değil.

Fark neden hayati: bir *standart* her ürünün uyması gereken sistem-kuralıdır (i18n gibi — her app çok-dile hazır olmalı). Bir *capability* ise ürünün açıp kapatabildiği bir iş-modeli yeteneğidir (B2B gibi — bir tenant açar, diğeri kapatır). İkisi aynı sınıfa konursa ajan hepsini "feature" sanıp `if b2b else` çorbası üretir; işte bu felaketi engellemek için iş modelleri (B2B/B2C/B2B2B/C2C/B2G/M2M/S2S/D2D) `standards-applicability-matrix`'te 15 standarttan ayrı, "Mode-Profile primitifi" olarak listelenir.

Aşağıdaki tablo bu dokümanın *ne olduğunu* ve *ne olmadığını* tek bakışta ayırır; her satır bir nitelik ve o niteliğin bu doküman için doğru/yanlış değeridir.

| Nitelik | Bu doküman | Gerekçe |
|---|---|---|
| Engineering standard mı (`src/data/standards/<id>.json`) | HAYIR | İş modeli sistem-kuralı değil; ürün açıp kapatır |
| Mode-Profile capability mi | EVET | `business_model_config` ile runtime'da bileşilir |
| Yeni `b2b.json` / `b2c.json` üretilir mi | HAYIR (yasak) | `numeronym-siniflandirma.md` §4 NOT-FEATURE |
| `standardRefs`'e yeni ref anahtarı eklenir mi | HAYIR | Standart değil; primitif şeması taşır |
| Makine sözleşmesi nerede | `k-mode` primitifi + `business_model_config` | `docs/mode-profile-contract.md` |
| Kodda `if b2b else` serbest mi | HAYIR (mutlak yasak) | Config-driven; §8'e bkz. |

Sonuç: bu doküman `docs/mode-profile-contract.md`'nin (`k-mode` sözleşmesi) iş-modeli boyutunu insan-okur biçimde anlatan **kardeş anlatıdır**; çelişki halinde `mode-profile-contract.md` (ve onun üstünde `core-contract-pack.md`) önceliklidir, bu doküman hizalanır.

---

## 2. Bu nedir / ne yapar / ne yapmaz

**Bu nedir?** Aynı platformdaki bir tenant'ın iş modelini — B2C (son tüketici, sepet, kart), B2B (bayi, RFQ, vadeli, KDV muafiyeti), C2C (peer-to-peer pazar yeri), B2G (ihale/tender), M2M/S2S (servis-servis), D2D (cihaz-cihaz) — runtime'da, **canlı veriyi yıkmadan ve geri-alınabilir biçimde** değiştiren yetenek. Terminoloji (ilk geçişte): **business_model_config** = aktif iş modelini + config-driven fiyat/checkout/sipariş/RFQ/MOQ/approval/account-type/tax-invoice/permission referanslarını toplayan versiyonlu nesne (`mode_profile`'ın iş-modeli izdüşümü); **MOQ** = minimum order quantity (asgari sipariş adedi); **RFQ** = request for quotation (teklif talebi).

**Ne işe yarar?** Bir tenant bugün B2C satarken yarın B2B'ye geçebilmelidir — ayrı deploy yapmadan, mevcut sipariş/faturayı bozmadan. 50+ app'lik portföyde her app'in sıfırdan mod modeli yazması hata yüzeyini portföy sayısı kadar tekrarlar; bu capability o modeli tek, versiyonlanmış, geri-alınabilir bir nesneye bağlar.

**Ne yapar?** İş modelini `business_model_config` üzerinden `preview → validate → publish → rollback` kontrollü geçiş zinciriyle değiştirir; capability bayraklarını ve politika referanslarını değiştirir, şema/kolon değiştirmez.

**Ne yapmaz?** Editions/paketleme varyantı tanımlamaz (o `k-capability` işidir); "tek tık serbest anahtar" sunmaz (validasyon + insan onayı + rollback zorunlu); capability *tanımı* üretmez (girdiyi `k-capability`'den okur); yetki *kararı* vermez (kararı `k-policy-pdp` verir).

---

## 3. Neden capability, neden standart değil (kanıtla)

İş modeli config-driven bir bileşimdir, her üründe aynı olması beklenen bir sistem-kuralı değildir; bu yüzden şu şekilde uygulanır: iş modeli bir engineering standardına değil, Mode-Profile primitifine bağlanır. Aşağıdaki tablo sekiz iş modelini config-anahtarı, öncelik ve stack karşılığıyla listeler; hiçbiri ayrı `*.json` standardı üretmez (`numeronym-siniflandirma.md` §2 ile hizalı).

| İş modeli | Açılım | priority | business_model_config anahtarı | FastAPI karşılığı | React karşılığı | DB karşılığı |
|---|---|---|---|---|---|---|
| B2C | business-to-consumer | P1 | `model=b2c` + consumer checkout | consumer order flow | consumer checkout (config-driven) | `account_type=consumer` |
| B2B | business-to-business | P1 | `model=b2b` + rfq/moq/net-terms | RFQ + vadeli + KDV-muafiyet servisi | mode-aware checkout | `account_type=business`, `company_account` |
| B2B2B | business-to-business-to-business | P1 | `model=b2b2b` + reseller/distributor katmanı | ara-satıcı fiyat + komisyon | çok-kademeli hesap UI | `reseller_tier`, `distributor` tablo |
| C2C | consumer-to-consumer | P2 | `model=c2c` + marketplace/escrow | peer-listing + escrow servisi | peer-listing UI | `listing`, `escrow` tablo |
| B2G | business-to-government | P2 | `model=b2g` + tender/RFQ | ihale/tender akışı | RFQ/tender UI | `tender` tablo |
| M2M | machine-to-machine | P2 | `model=m2m` + service credential | service-token + scope | (yüzey yok) | `api_clients` tablo |
| S2S | server-to-server | P2 | `model=s2s` + mTLS/service-token | service-token doğrulama | (yüzey yok) | `service_registry` tablo |
| D2D | device-to-device | P3 | `model=d2d` + device pairing | device pairing config | (yüzey yok) | `device` tablo |

Kritik gözlem: hepsi aynı `business_model_config` şemasının **değerleridir**; her biri için ayrı kod dalı değil, aynı config'in farklı içeriği vardır. Yeni bir iş modeli eklemek yeni bir `if` dalı değil, yeni bir config değeri eklemektir.

---

## 4. `business_model_config` — config-driven eksenler

`business_model_config`, `mode_profile` nesnesinin iş-modeli izdüşümüdür ve şu şekilde uygulanır: iş-modeline göre değişen her davranış (fiyat, checkout, sipariş, RFQ, MOQ, approval, account-type, tax/invoice, permission) koda gömülmez, config referansından okunur. Aşağıdaki tablo bu eksenleri, hangi iş modelinde nasıl davrandığını ve hangi kernel primitifine bağlandığını verir; hiçbir hücre örnek/mock değer içermez, yalnız davranış eksenini tanımlar.

| Config ekseni | Ne yönetir | B2C davranışı | B2B/B2B2B davranışı | Bağlı primitif |
|---|---|---|---|---|
| `pricing` | Fiyat politikası referansı | liste fiyatı, herkese görünür | müşteriye-özel fiyat listesi, anonime gizli | `k-computation` (pricing profile) |
| `checkout` | Ödeme/checkout akışı | kart/anlık ödeme | vadeli / net-terms / PO ile checkout | `k-computation` (checkout policy) |
| `order` | Sipariş akışı biçimi | doğrudan sepet→sipariş | onaylı sipariş / kredi-limiti kontrolü | `k-mode` runtime |
| `rfq` | Teklif talebi akışı | kapalı | RFQ→teklif→sipariş açık | `k-capability` (rfq) |
| `moq` | Asgari sipariş adedi | yok (1 adet) | ürün/müşteri başına MOQ zorlaması | `k-computation` |
| `approval` | Onay iş akışı | yok | sipariş/kredi onay zinciri | `s-bpm` (Workflow/BPM) |
| `account_type` | Hesap tipi | `consumer` | `business` / `reseller` / `distributor` | `k-party` |
| `tax_invoice` | Vergi/fatura biçimi | perakende, KDV dahil | KDV muafiyeti / e-fatura / ters-yük | `k-computation` (tax profile) |
| `permission` | İş-modeline özel policy override | varsayılan | fiyat-görünürlük kısıtı, RFQ-yetki | `k-policy-pdp` (override girdisi) |

Kural: bu eksenlerin hiçbiri React/servis koduna `if (model === 'b2b')` olarak yazılmaz; hepsi `business_model_config`'ten çözülür ve `k-policy-pdp` yetki kararını verir. Config bir kaynak; kod bir tüketicidir.

---

## 5. Kontrollü geçiş — preview → validate → publish → rollback

İş-modeli geçişi bir konfigürasyon değişimidir, şema göçü değildir; bu yüzden şu şekilde uygulanır: geçiş dört adımlı, insan-onaylı, geri-alınabilir bir kapı zincirinden (`ADMIN_FLOW`) geçer. Aşağıdaki tablo dört adımı, girdisini, çıktısını ve kapı koşulunu sırayla verir.

| Adım | Ne yapar | Girdi | Çıktı | Kapı koşulu |
|---|---|---|---|---|
| `preview` | Kuru bakış: capability/surface/policy farkını gösterir, hiçbir şey uygulamaz | hedef `business_model_config` | fark raporu (diff) | — (yan etkisiz) |
| `validate` | Aktif verilere karşı dry-run; eksik-alan raporu üretir | hedef config + canlı veri | `dry_run_report` + `missing_fields[]` | eksik alan varsa `publish` engellenir |
| `publish` | Profili aktive eder; önceki profili rollback için saklar | onaylı hedef config + `approval_ref` | yeni aktif profil | yalnız insan `approval_ref` ile; yoksa `ApprovalRequiredError` |
| `rollback` | Önceki `business_model_config`'e döner | `rollback_of` referansı | önceki aktif profil | veri kaybı olmadan; her zaman erişilebilir |

`validate` adımının ürettiği `missing_fields[]`, hedef modun gerektirdiği ama tenant'ta henüz olmayan alanları listeler (ör. B2B'ye geçişte şirket cari hesabı, B2B fiyat listesi, MOQ tanımı); bu alanlar tamamlanmadan `publish` reddedilir. Geçiş tek transaction içindedir ve `k-scale-invariant` (outbox + idempotency) taşır — çift-uygulama ve kayıp-event engellenir.

---

## 6. Canlı-veri korunumu (INVARIANT — test zorunlu)

Bu capability'nin en katı kuralı canlı-veri korunumudur ve şu şekilde uygulanır: hiçbir aktör — insan dahil — bir mod geçişinde mevcut sipariş/fatura kayıtlarını silemez veya bozamaz. Aşağıdaki tablo korunum invariant'ının üç yüzünü ve her birinin doğrulama biçimini verir.

| Invariant | Ne garanti eder | Doğrulama |
|---|---|---|
| Sipariş/fatura korunumu | Geçiş öncesi canlı sipariş sayısı = geçiş sonrası | Integration/E2E: öncesi=sonrası sayım |
| Kapatılan surface arşivi | Kapatılan iş-modeli surface'inin verisi silinmez, arşivlenir | Arşiv kaydı testi (silme yok) |
| Rollback bütünlüğü | `rollback` sonrası da veri kaybı yok | Rollback testi: veri sayısı sabit |

Bu invariant bir "iyi-olur" değil, bloklayıcı kabul kriteridir: korunum testi kırmızıysa geçiş capability'si done sayılmaz (bkz. §13, §15).

---

## 7. Backend (config-driven runtime)

Motor tarafı `platform_mode_profile` paketinde yaşar (`core-contract-pack` §3.4) ve şu şekilde uygulanır: geçiş bir servis akışıdır — `preview()` (yan etkisiz fark) → `validate()` (dry-run + eksik-alan) → `publish()` (yalnız `approval_ref` ile) → `rollback()`. Katman SQLAlchemy 2.0 modeli + Alembic expand-contract migration (downgrade zorunlu) + Strawberry GraphQL tipi + REST endpoint (`Depends(require_tenant)` + `RequirePermission("mode_profile:apply")`) taşır. Her adımda `AuditLogger.log()` çağrılır; hata formatı `{code, message, trace_id, details}`; `get_logger()` kullanılır, `print()` yasaktır. Yeni iş modeli eklemek yeni kolon/tablo değil, yeni `business_model_config` değeri + capability referansı eklemektir (Next.js/Supabase/Prisma yasak; üretim DB'si yalnız PostgreSQL).

---

## 8. Frontend (config-driven, mode-aware — `if b2b else` yasak)

Ön yüz aktif iş modelini üç runtime endpoint'inden okur ve şu şekilde uygulanır: davranış koda gömülmez, `business_model_config`'ten türeyen konfigürasyondan gelir. Aşağıdaki tablo tüketici yüzeyinin iş-modelinden neyi türettiğini endpoint bazında verir.

| Endpoint | Ne döndürür | Yüzey tüketimi |
|---|---|---|
| `GET /runtime/tenant-capabilities` | Aktif iş-modelinin capability seti | Aksiyon/alan capability-gate ile gösterilir/gizlenir (RFQ, MOQ, vadeli) |
| `GET /runtime/navigation` | İş-modeline göre gezinme ağacı | B2B'de RFQ menüsü, B2C'de sepet |
| `GET /runtime/forms/{archetype}` | İş-modeline göre form şeması (alan, zorunluluk, MOQ) | RHF/Zod ile projected form render |

Mutlak kural: React kodunda `if (model === 'b2b') ... else ...` **yasaktır**. Yüzey `renderStrategy: projected` (şema-render) kullanır; iş-modeli farkı endpoint konfigürasyonundan gelir. Stack sabittir: Vite + React + TanStack Router/Query + RHF/Zod. Bu, binlerce koşul dalını tek konfigürasyon kaynağına indirger; yeni iş modeli eklerken kod değişimini sıfıra yaklaştırır.

---

## 9. Multi-tenant

Profil ve geçiş tümüyle `tenant_id` kapsamlıdır (fail-closed) ve şu şekilde uygulanır: A tenant B tenant'ın `business_model_config`'ini ne okuyabilir ne değiştirebilir. Profil ayrıca `channel` başına ayrışır — aynı tenant web'de B2C, marketplace'te B2B olabilir. RLS veya schema-per-tenant kararı `adr-0026-tech-profiles`'a uyar. Geçişi yalnız `mode_profile:apply` iznine sahip party tetikleyebilir; izin kararı `k-policy-pdp`'den geçer.

---

## 10. AI guardrail

Dört-aktör iş bölümü burada değiştirilemez biçimde uygulanır ve şu şekilde işler: **AI önerir → insan onaylar → motor uygular.** AI en fazla "bu tenant B2B'ye geçmeye hazır" *önerisi* ve `preview`/`validate` dry-run raporu üretir (`autonomy: draft`); `publish` yalnız insan `approval_ref`'i ile çalışır (`autonomy: none`). AI aktif iş modelini doğrudan değiştiremez, rollback tetikleyemez, `business_model_config` capability tanımı üretemez, main branch'e push edemez. Onay referansı olmayan `publish` çağrısı `ApprovalRequiredError` fırlatır ve audit'lenir.

---

## 11. Bağlama (diğer primitiflerle)

İş-modeli geçişi tek başına çalışmaz; şu şekilde uygulanır: girdilerini dört kernel primitifinden okur ve kararı PDP'ye bırakır. Aşağıdaki tablo bağlantıları ve her birinin bu capability'ye kattığını verir.

| Primitif | Bu capability'ye katkısı | Yön |
|---|---|---|
| `k-capability` | Aktif capability setini besler (mod onları açar/kapar, tanımlamaz) | girdi |
| `k-party` | Şirket cari hesabı / reseller / distributor gibi B2B aktörleri | girdi |
| `k-policy-pdp` | Mod'un `permission` override'ını girdi alır, fiyat-görünürlük kararını verir | karar |
| `k-computation` | pricing/tax/MOQ profillerini `*_policy_ref` üzerinden sağlar | girdi |
| `s-bpm` | Onay iş akışını (`approval`) yürütür | akış |

`plan-01` Dalga 2'de Commerce dikey dilimi bu primitifleri tüketerek B2C→B2B mod anahtarını uçtan uca kanıtlar.

---

## 12. Test stratejisi

Test-önce zorunludur (önce kırmızı, sonra yeşil) ve şu şekilde uygulanır: geçişin her kritik davranışı bir teste bağlanır. Aşağıdaki tablo test kümesini numara, senaryo ve tür ile verir.

| # | Test | Tür |
|---|---|---|
| 1 | `validate` eksik-alan raporunu doğru üretiyor (şirket cari hesabı, B2B fiyat listesi, MOQ) | Integration (pytest) |
| 2 | `publish` capability setini değiştiriyor (RFQ, vadeli ödeme aktif) | Integration |
| 3 | Canlı sipariş sayısı geçiş öncesi = sonrası (korunum invariant) | Integration/E2E |
| 4 | `rollback` önceki iş-modeline dönüyor, veri kaybı yok | Integration |
| 5 | Versiyonlu config: eski `business_model_config` versiyonu erişilebilir | Unit |
| 6 | B2B'de anonim kullanıcı fiyat görmüyor (PDP default-deny) | E2E |
| 7 | Cross-tenant izolasyon: A tenant B'nin config'ini göremiyor | Integration |
| 8 | UI hiçbir `if b2b else` dalı içermiyor (config-driven) | Statik analiz / lint |

E2E katmanı Playwright + axe (WCAG 2.2 AA) ile çalışır.

---

## 13. Acceptance criteria

- AC-1: Bir tenant `preview → validate → publish` zinciriyle B2C'den B2B'ye geçebiliyor; her adım audit'e yazılıyor.
- AC-2: `validate` eksik alanları raporluyor; eksikler tamamlanmadan `publish` reddediliyor.
- AC-3: `publish` sonrası capability seti değişiyor; canlı sipariş/fatura sayısı ve içeriği korunuyor.
- AC-4: `rollback` önceki iş-modeline dönüyor; veri kaybı olmuyor.
- AC-5: Ön yüz üç runtime endpoint'inden konfigürasyon okuyor; kodda iş-modeli koşul dalı yok.
- AC-6: `publish` yalnız insan `approval_ref`'i ile çalışıyor; AI doğrudan uygulayamıyor.
- AC-7: Her iş modeli (B2C/B2B/B2B2B/C2C/B2G/M2M/S2S/D2D) `business_model_config` değeri olarak eklenir; yeni `if` dalı veya yeni `*.json` standardı üretilmez.

---

## 14. Anti-patterns (yasak desenler)

- **"Tek tık serbest anahtar":** Validasyon/onay/rollback olmadan mod değiştirmek — felaket üretir, yasak.
- **`if b2b else` gömme:** İş-modeli farkını React/servis koduna hardcode etmek; config-driven ilkesini bozar.
- **Veri yıkan geçiş:** Kapatılan surface'in verisini silmek; korunum invariant'ını ihlal eder.
- **Şema göçüyle mod:** Geçişi kolon ekleme/silme ile yapmak; iş-modeli konfigürasyondur, göç değildir.
- **AI'ın publish etmesi:** Onay kapısını atlayan otomatik uygulama; fail-closed ilkesini deler.
- **İş modelini standart yapmak:** `b2b.json`/`b2c.json` gibi engineering-standart dosyası üretmek — bu capability, standart değil (§1); mutlak yasak.
- **Capability tanımını mod içinde üretmek:** Capability `k-capability`'nin işidir; mod yalnız aktive eder.

---

## 15. DoD (Definition of Done)

§12'deki 8 testin tamamı yeşil; migration downgrade otomatik test geçti; canlı-veri-korunumu kanıtı üretildi; rollback kanıtlandı; a11y AA geçti; `check-core-contract`, `check-surface`, `check-execution-readiness` yeşil; hiçbir iş-modeli engineering-standart JSON'u olarak üretilmedi (yalnız `business_model_config`); `plan-01` Dalga 2 Commerce dilimi bu capability ile uçtan uca çalışıyor; PR açıldı, insan reviewer merge etti (main'e doğrudan push yok).

---

## 16. Requirement-ID tablosu

Aşağıdaki tablo bu capability'nin izlenebilir gereksinimlerini kimliklendirir; her satır bir gereksinim, katmanı, önceliği, test türü, ilgili acceptance criteria ve sahibiyle eşlenir.

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| BMS-01 | `business_model_config` şeması (iş-modeli + config-driven eksenler, versiyonlu) | Backend | P0 | Unit | AC-1 | Kernel geliştirici |
| BMS-02 | `mode_transition` kaydı (dry-run + eksik-alan + onay + rollback bağı) | Backend | P0 | Unit | AC-2 | Kernel geliştirici |
| BMS-03 | `validate` eksik-alan raporu doğru (cari hesap, fiyat listesi, MOQ) | Backend | P0 | Integration | AC-2 | Kernel geliştirici |
| BMS-04 | `publish` capability setini değiştiriyor (RFQ/vadeli aktif) | Backend | P0 | Integration | AC-3 | Kernel geliştirici |
| BMS-05 | Canlı-veri korunumu invariant (sipariş/fatura öncesi=sonrası) | Backend | P0 | Integration/E2E | AC-3 | Kernel geliştirici |
| BMS-06 | `rollback` önceki iş-modeline dönüyor, veri kaybı yok | Backend | P0 | Integration | AC-4 | Kernel geliştirici |
| BMS-07 | Runtime endpoint'leri iş-modelinden türer (`/runtime/*`) | Backend | P0 | Integration | AC-5 | Kernel geliştirici |
| BMS-08 | Config-driven mode-aware surface (`if b2b else` yok) | Frontend | P0 | Statik analiz | AC-5 | Frontend geliştirici |
| BMS-09 | Cross-tenant izolasyon (config okunamaz/değiştirilemez) | Multi-tenant | P0 | Integration | AC-1 | Kernel geliştirici |
| BMS-10 | `publish` yalnız insan onayı; AI draft ile sınırlı | Governance | P0 | Integration | AC-6 | Kernel geliştirici |
| BMS-11 | Sekiz iş modeli config değeri olarak (yeni `if`/JSON yok) | Backend | P1 | Integration | AC-7 | Kernel geliştirici |
| BMS-12 | B2B/B2B2B anonim fiyat gizleme (PDP default-deny) | Governance | P1 | E2E | AC-3 | Kernel geliştirici |
| BMS-13 | account_type + tax_invoice config-driven (consumer/business/reseller) | Backend | P1 | Integration | AC-1 | Kernel geliştirici |
| BMS-14 | Versiyonlu config; eski `business_model_config` erişilebilir | Backend | P1 | Unit | AC-4 | Kernel geliştirici |
| BMS-15 | approval iş akışı (`s-bpm`) B2B sipariş onayında çalışıyor | Backend | P2 | Integration | AC-1 | Kernel geliştirici |

---

*Kaynak primitif: `docs/mode-profile-contract.md` (`k-mode`). Kardeş anlatı: `numeronym-siniflandirma.md` §1/§4 (iş-modeli = capability, standart değil). İlgili: `capability-entitlement-contract.md`, `pdp-policy-contract.md`, `computation-derivation-contract.md`, `standards-applicability-matrix.md` §2.1. Bu doküman hiçbir kod/şema/JSON dosyasına dokunmaz; yalnız anlatı metnidir. Çelişki halinde `mode-profile-contract.md` (onun üstünde `core-contract-pack.md`) önceliklidir; bu doküman güncellenir. Sözleşmeyi değiştirme yetkisi yalnız insan onayındadır; AI bu dosyayı doğrudan güncelleyemez.*
