# MD Yönergeleri → JSON Standartları Entegrasyon Gap Raporu

Sürüm: 1.0 — 2026-07-13
Durum: AI-DRAFT — CPO onayı bekler
Soru sahibi: CPO — "docs sayfasındaki yönergelerden hangileri JSON yönergelerine aktarılmalı, hangileri için yeni JSON + yeni sayfa gerekir, hangileri mevcut içerik sayfalarına entegre olmalı, hangileri her yere / her feature'a / her sayfaya entegre olmalı?"

---

## 0. Okuma anahtarı — üç katman, üç entegrasyon yolu

Bu repoda bir kuralın üç yaşam biçimi vardır; rapor bu üçlüye göre sınıflar:

| Katman | Nerede yaşar | Ne işe yarar | Zorlayan |
|---|---|---|---|
| Anlatı yönergesi | `docs/*.md` (Pages'ta görünen dokümanlar) | İnsan-okur gerekçe, karar, kapsam | globalReadiness/urlPolicy vb. kavram testleri |
| Makine sözleşmesi | `src/data/standards/<id>.json` (31 adet) | CI-zorlanabilir kural değerleri; tek kaynak | `check-*` kapıları + `check-standards-coverage` |
| İçerik sayfaları | `public/data/nodes.json` (485 WBS düğümü; "json base content pages") | Her düğümün 17 boyut içeriği + `standardRefs` bağları | `check-dimension-applicability`, `check-standards-coverage` |

Entegrasyon ilkesi (00-standards-index): anlatı kuralı YENİDEN YAZMAZ, makine sözleşmesini işaret eder. Kural değeri yalnız JSON'da değişir. Bir .md'nin "JSON'a aktarılması" = zorlanabilir kurallarının `StandardContractSchema` uyumlu sözleşmeye taşınması + anlatının referansa dönmesi.

"Her yere entegre" mekanizması icat edilmez; üçü zaten var:
1. `standardRefs.<x>Ref` — düğüm → standart bağı (applicability matrisinde Z/Ö/N-A seviye kuralı),
2. 17 boyut (`dimensions`) — her düğümde içerik zorunluluğu,
3. `applicability + waivers` — gerekçeli istisna.

Yani soru "hangi yönerge her feature'a girmeli" değil; "hangi yönerge hangi ref anahtarıyla, hangi seviyede Z(orunlu) olmalı" diye sorulur ve matrise satır olarak yazılır.

---

## 1. YENİ JSON sözleşmesi + yeni sayfa gerekenler

Aşağıdaki anlatı yönergelerinin makine karşılığı YOK. Her biri için: yeni `src/data/standards/<id>.json`, yeni `standardRefs` anahtarı, applicability satırı, WBS 13.x standart düğümü (mevcut ağaca bağlanır; yeni ağaç kurulmaz) ve `docs/standards/` anlatı sayfası (varsa mevcut .md referansa döner) gerekir.

Önce sade özet: en acil beşi, ürünün parayla, kimlikle ve pazarla temas eden kurallarıdır; bunlar bugün yalnız düzyazıda yaşadığı için hiçbir kapı ihlali yakalayamaz.

| # | Kaynak .md | Yeni JSON id | Ref anahtarı önerisi | Öncelik | Aktarılacak zorlanabilir çekirdek |
|---|---|---|---|---|---|
| 1 | `global-market-readiness-directive.md` | `global-market-readiness` | `marketReadinessRef` | P0 | 14 launch sorusu makine-checklist; pazar başına ödeme/destek/moderasyon beyan alanları; IP-geolocation-tek-başına-yasak; kill switch zorunluluğu |
| 2 | `financial-state-model-contract.md` + `standards/10-business-model-switching-standard.md` fiyat bölümü | `finance-money-model` | `financeModelRef` | P0 | 6 finansal durum ayrımı; decimal+ISO 4217+ölçek+yuvarlama-politikası zorunluluğu; iki-ondalık varsayımı yasağı; 3 para birimi ayrımı (faturalandırma/gösterim/muhasebe); kur-dönüşüm-tarihi beyanı |
| 3 | `actor-party-contract.md` §16 | `identity-data` | `identityDataRef` | P1 | displayName serbest + yapılandırılmış hukuki isim ayrımı; isim-regex yasağı; adres şablonu ülke-bazlı (UPU S42); E.164 ayrı saklama; SMS-varsayımı yasağı |
| 4 | `k-search-directive.md` §16 | `search-quality` | `searchQualityRef` | P1 | collation/ICU sürüm kaydı zorunluluğu; transliteration/diakritik tolerans beyanı; alan-bazlı tolerans farkı; Türkçe I/ı case kuralı |
| 5 | `decision-grade-data-contract.md` | `decision-grade-data` | `decisionGradeRef` | P1 | kaynak→onay→mutabakat→dönem kilidi→formül-sürüm zinciri; 11 analitik boyut listesi; event-adı-çevrilmez; orijinal/normalize para ayrımı |
| 6 | `atomic-types-directive.md` §17 | (yeni JSON değil — mevcut `src/data/atom-definition-registry.json`'a kayıt) | mevcut atom mekanizması | P1 | 7 zaman tipi (Instant/ZonedDateTime/LocalDate/LocalTime/Duration/Recurrence/BusinessDay) kanonik atom kaydı; IANA-zorunlu/sabit-offset-yasak validatörü |
| 7 | `capability-entitlement-contract.md` | `capability-entitlement` | `entitlementRef` | P2 | capability→entitlement→PDP zinciri beyanı (authz-rbac-abac.json'ı genişletmek yerine ayrı; gerekçe: paketleme/ticari eksen) |
| 8 | `archetype-venture-core-directive.md` (EVM çekirdeği) | `venture-core` | `ventureCoreRef` | P2 | funding/decision/approval/reporting_period/snapshot şema çekirdeği — EVM app'ine özgü; global değil, Ada #1 kapsamlı |

"Yeni sayfa" karşılığı: docs-viewer standart sayfaları `engineering-standards-index.md` + `standards/00-standards-index.md` kayıtlarından ve WBS 13.x düğümlerinden türediği için her yeni JSON şunları da ister: iki indekse satır, `standards-applicability-matrix.md`'ye Z/Ö/N-A satırı, `check-standards-coverage` çözünürlüğü (anahtar→dosya), tercihen kendi `check-<id>` kapısı. Bu beşli tamamlanmadan yeni JSON "sayfası olan standart" sayılmaz.

---

## 2. Mevcut JSON'lara aktarılması gereken deltalar

Bu yönergeler için yeni JSON AÇILMAZ; 8-9. tur eklemeleri mevcut sözleşmelere kural olarak girer (dün doğrulandı: aşağıdaki kavramların hiçbiri hedef JSON'larda yok).

| Kaynak .md (bölüm) | Hedef JSON | Taşınacak kurallar |
|---|---|---|
| `standards/01-i18n-l10n-g11n-standard.md` — temel ayrım + veri modeli + l10n ops | `i18n-standards.json` (+ `g11n.json` senkron) | dil≠locale≠ülke≠pazar≠yetki≠tz≠para≠veri-bölgesi eşitlik yasağı; UserPreferences/AccountMarketContext alan sözleşmesi; IP/tarayıcı-dili yalnız-öneri kuralı; kritik akışta karışık-dil-fallback yasağı; pseudo-localization + text-expansion + eksik-çeviri-alarmı zorunlulukları |
| `standards/01-...` — font/IME/rendering | `design-system.json` + `ui-components.json` | font-fallback zinciri beyanı; IME composition testi; 11 rendering yüzeyi test matrisi; RTL karma-metin kuralı |
| `privacy-retention-decision-matrix.md` §17 (G1-G12) | `privacy.json` | veri-bölgesi/sınır-ötesi-aktarım beyan alanları; alt-işleyen listesi sürümleme; bağlayıcı-dil ↔ gösterim-dili ayrımı; hukuki-metin ayrı-onay-akışı; kabul kaydı (dil+sürüm+zaman) |
| `standards/03-authn-authz-iam-standard.md` §13-14 | `mfa.json` + `edge-security.json` (identifier kuralları) | UTS #39 confusable/mixed-script denetimi; displayName≠username; locale-bağımlı casefold yasağı; pazar-başına OTP/kurtarma matrisi; "kurtarılamayan pazar desteklenmez" kuralı |
| `standards/02-a11y-accessibility-standard.md` §5.1/§11.1 | `a11y.json` | lang attribute zorunluluğu; dil-başına 9-eksen yeniden-test matrisi; yerelleştirilmiş-PDF erişilebilirlik şartı |
| `standards/12-devops-infrastructure-standard.md` §9.1 | `iac.json` + `observability.json` | bölge-başına 16 ölçüm ekseni; locale lazy-load + offline kritik-mesaj dili; log/telemetry hedef-bölge beyanı; veri-bölgesi-ihlalli replikasyon yasağı |
| `standards/14-enterprise-readiness-checklist.md` §7.1 | `quality-gates.json` | Global launch 14-soru kapısı (graduation koşulu olarak; pazar/dil başına evidence ister) |
| `url-policy.md` (zaten `url-policy.json` + `src/data/url-policy/registry.json` VAR) | — | delta yok; URLP-M1 fazı ayrıca tanımlı (`ci-conformance-gates.md`) |

Not: `10-business-model-switching` fiyatlandırma bölümü §1'deki `finance-money-model`'e gider (c12n/p13n customization eksenine değil — fiyat ticari karardır, kişiselleştirme değildir).

---

## 3. İçerik sayfalarına (nodes.json) entegrasyon — üç yayılım sınıfı

### 3.1 HER DÜĞÜME (485/485) — mevcut mekanizmayla, yeni alan icat etmeden

Bu sınıf zaten iki kanaldan her düğümde yaşıyor; yapılacak iş kanalları YENİ kurallara bağlamaktır:

- `i18nRef` matriste app/module/archetype için zaten Z. 9. tur kuralları `i18n-standards.json`'a girdiğinde (bkz. §2) 485 düğümün i18n bağı otomatik olarak yeni kuralları işaret eder — düğüm düğüm elle yayılım YAPILMAZ (anti-pattern: aynı kuralın 485 kopyası).
- 17 boyuttan `security`, `dataLifecycle`, `featureDefs` içerikleri kişi-verisi/para/zaman dokunan düğümlerde §1-2 sözleşmelerine atıf vermelidir; bu içerik-kalite işi `weak-content` taraması kapsamına alınır.

### 3.2 HER FEATURE'A (feature + component seviyesi) — ref terfileri

| Ref | Bugün (matris) | Öneri | Gerekçe |
|---|---|---|---|
| `i18nRef` | feature: Ö | feature: Z (UI'lı ve kullanıcı-metni üreten düğümlerde) | global-first ürün kararı; KARAR BEKLİYOR — CPO |
| `financeModelRef` (yeni) | — | para dokunan feature: Z; diğerleri N/A+gerekçe | tutar alanı taşıyan her feature yuvarlama/para-birimi beyanı vermeli |
| `identityDataRef` (yeni) | — | kişi/kuruluş verisi dokunan feature: Z | isim/adres/telefon formu olan her feature |
| `urlPolicyRef` | merkezi default | URL üreten feature: Z (zaten böyle) | değişiklik yok |
| `searchQualityRef` (yeni) | — | arama/liste feature'ları: Z | tolerans + collation sürümü beyanı |

### 3.3 HER SAYFAYA (UI yüzeyi olan her düğüm) — boyut üzerinden

`wcag` ve `mobileApps` boyutları UI'lı düğümlerde zaten zorunlu. a11y×i18n kuralları `a11y.json`'a girince (bkz. §2) her UI sayfasının wcag boyutu dil-başına test matrisini miras alır. Ayrıca Surface sözleşmesine (`src/schemas/surface.ts`) `locale/market beyanı` alanı eklenmelidir (bugün 0 eşleşme — surface hangi dil/pazar boyutlarını desteklediğini makinece söyleyemiyor).

### 3.4 HİÇBİR ZAMAN her düğüme yayılmayacaklar (bilinçli sınır)

- `global-market-readiness` launch kapısı: app/pazar SEVİYESİ kararıdır; feature düğümlerine kopyalanması gürültü üretir. Bağ: yalnız app düğümü + release-governance.
- `venture-core`: yalnız EVM app'inin düğümleri; genel korpusa yayılmaz.
- Moderasyon/coğrafya-politik kurallar: yalnız UGC/harita/bölge-verisi dokunan düğümler (classifier sinyaliyle aday tespiti; ui-impact deseninin veri-etki karşılığı).

---

## 4. Uygulama sırası (öneri)

| Faz | İş | Çıktı kapısı |
|---|---|---|
| J1 | §2 deltaları mevcut JSON'lara (i18n-standards, privacy, a11y, mfa/edge-security, iac, quality-gates) — test-önce: her delta için kavram probe'u JSON'a karşı da koşar | check-i18n + check-standards-coverage yeşil; globalReadiness testine JSON-probe grubu eklenir |
| J2 | P0 yeni sözleşmeler: `global-market-readiness.json`, `finance-money-model.json` + iki indeks kaydı + applicability satırları + `check-market-readiness` / `check-finance-model` kapıları | yeni kapılar deploy.yml'de bloklayıcı |
| J3 | P1: `identity-data.json`, `search-quality.json`, `decision-grade-data.json` + atom-registry zaman tipleri | atomDefinitionRegistry testi genişler |
| J4 | Ref terfileri (§3.2) + Surface locale/market beyan alanı + weak-content taramasına yeni eksenler | check-dimension-applicability + surface testleri |
| J5 | P2: `capability-entitlement.json`, `venture-core.json` (ADR-product-boundary onayına bağlı) | — |

KARAR BEKLİYOR (CPO): (1) `i18nRef` feature seviyesinde Ö→Z terfisi; (2) `finance-money-model` ile `venture-core` sınırı (para modeli generic, venture alanları Ada #1); (3) launch-gate evidence'ının hangi release akışına bağlanacağı; (4) yeni ref anahtarlarının `task.ts` şemasına eklenme sırası (şema değişikliği migration gerektirir).

---

## 5. Özet cevaplar (soruya bire bir)

1. Yeni JSON + yeni sayfa gerekenler: §1 tablosundaki 5 P0-P1 sözleşme (`global-market-readiness`, `finance-money-model`, `identity-data`, `search-quality`, `decision-grade-data`) + 2 P2 aday; zaman tipleri yeni JSON değil atom-registry kaydı.
2. Mevcut JSON'lara entegre olacaklar: §2 tablosu — i18n çekirdeği, privacy G1-G12, a11y×i18n, identifier güvenliği, bölgesel altyapı, launch-gate → sırasıyla `i18n-standards/g11n`, `privacy`, `a11y`, `mfa+edge-security`, `iac+observability`, `quality-gates`.
3. Her yere entegre olacaklar: yeni alan icat edilmez — `i18nRef` zaten app..archetype Z; kural JSON'a girince 485 düğüme referansla yayılır (kopyayla değil). Feature-seviyesi terfiler §3.2; UI sayfaları §3.3 (a11y.json + Surface beyan alanı); §3.4'tekiler bilinçli olarak yayılmaz.
