# 01 — i18n / l10n / g11n Standardı (Anlatı)

Sürüm: 1.0 — 2026-07-01
Durum: Anlatı standardı (`docs/standards/00-standards-index.md` §3, satır 01). Makine sözleşmesini *tamamlar*, yeniden tanımlamaz.
Makine kontratı: `src/data/standards/i18n-standards.json` (`StandardContractSchema`) · Düğüm bağı: `standardRefs.i18nRef` · CI kapısı: `check-i18n` · Boyut: yok (çapraz-kesen standart).

Bu doküman üç katmanı tek çatı altında toplar: i18n (ürünü çok-dile/bölgeye hazırlama), l10n (belirli bölgeye uyarlama) ve g11n (bu ikisini residency/jurisdiction ile birleştiren globalizasyon *stratejisi*). i18n ve l10n kuralları repoda zaten `i18n-standards.json` içinde yaşar; bu anlatı onları kopyalamaz, kural ID'leriyle referans verir ve g11n çatısını YENİ olarak ekler.

---

## 1. Purpose

Global ürün (CRM, HRMS, Ecommerce, Accounting...) çok-dil, çok-bölge, çok-para-birimi ve çok-mevzuat davranışını baştan taşır; bunu sonradan eklemek en pahalı mühendislik işidir. Bu standart, o davranışı tek-kaynak + CI-zorlamalı bir sözleşmeye bağlar ve `check-i18n` ile drift'i imkânsızlaştırır. Anlatının g11n katkısı şudur: locale, currency, tax ve data-residency BAĞIMSIZ (ortogonal) eksenlerdir; biri diğerinden türetilmez.

## 2. Scope

Bu standart backend metin/format katmanını, frontend çeviri katmanını, çevrilebilir DB alanlarını, API hata mesajı çevirisini ve jurisdiction/residency çözümlemesini kapsar. Kapsam sınırı sözleşmenin `appliesTo` alanıyla (boş = tüm yüzeyler) hizalıdır; her katman aynı `i18nRef` sözleşmesine bağlanır.

| Kapsam ekseni | Ne dahil | Referans kural (i18n-standards.json) |
|---|---|---|
| Metin/çeviri | ICU MessageFormat anahtarları, fallback zinciri | `i18n-message-format` |
| Biçimleme | tarih/saat/sayı/para (CLDR), timezone | `i18n-locale-formatting` |
| Düzen | RTL mantıksal CSS, ayna-çeviri | `i18n-rtl-support` |
| Veri | çevrilebilir `i18n-text` alanları, enum alias | `i18n-translatable-fields` |
| Ortogonallik | locale≠jurisdiction≠currency≠tax≠timezone≠residency | `i18n-jurisdiction-orthogonal` |
| Residency | bölge-bağlı veri sorgu-katmanı zorlaması | `i18n-data-residency` |
| İş akışı | taslak→inceleme→yayın, locale çözümleme sırası | `i18n-translation-workflow-and-locale-resolution` |

## 3. Non-goals

Bu standart makine-çevirisi *yapmaz*; çeviri altyapısını tanımlar, içeriği değil. Yeni bir çeviri-yönetim ürünü (TMS) kurmaz; mevcut `s-i18n` iş akışına ve `k-jurisdiction` primitifine bağlanır. l10n içeriğinin kendisini (metin, hukuki şablon) bu doküman üretmez; onların *taşınma sözleşmesini* tanımlar. Kural değerlerini de tekrar yazmaz — değerler `i18n-standards.json` içindedir.

## 4. Backend Requirements

FastAPI katmanında etkin locale bir request-scoped bağlamda taşınır ve çözümleme sırası kilitlidir. Aşağıdaki gereksinimler `i18n-message-format`, `i18n-locale-formatting` ve `i18n-translation-workflow-and-locale-resolution` kurallarının FastAPI karşılığıdır.

Locale çözümleme bir FastAPI dependency ile şu sırayla uygulanır: kullanıcı-tercihi, sonra tenant-varsayılanı, sonra `Accept-Language` header, sonra sistem-varsayılanı. Çeviri anahtarları ICU MessageFormat ile sunulur; ham (hardcoded) kullanıcı metni ve `f-string` ile cümle kurma yasaktır. Tarih/sayı/para biçimleme `babel` (CLDR) ile locale-farkında yapılır; naive datetime yerine timezone-aware datetime taşınır. API hata gövdesi `{code, message, trace_id, details}` biçiminde döner ve `message` etkin locale'e göre çevrilir; hata `code` sabittir (çevrilmez), `message` çevrilir.

## 5. Frontend Requirements

React katmanında çeviri bir translation hook üzerinden okunur; JSX içinde ham string literal yasaktır. Aşağıdaki gereksinimler `i18n-message-format` ve `i18n-rtl-support` kurallarının React karşılığıdır.

Bir `t()` hook'u (ör. `react-intl` / FormatJS ICU tabanlı) mesaj kataloğundan anahtar çözer; eksik anahtarda fallback locale devreye girer ve arayüzde ASLA ham anahtar gösterilmez. Sayı/tarih/para `Intl` API ile biçimlenir. RTL için düzen mantıksal CSS özellikleriyle (`margin-inline-start/end`, `padding-inline`, `dir="auto"`) kurulur; fiziksel `left/right` yerleşim yasaktır. Dil değişimi tam sayfa yeniden yüklemeden uygulanır ve seçilen locale kullanıcı tercihine yazılır.

## 6. Database Requirements

Çok-dilli içerik tek-dil kolonda tutulmaz; `i18n-text` alan tipiyle (locale→değer eşlemesi) saklanır. Bu bölüm `i18n-translatable-fields` ve `i18n-data-residency` kurallarının SQLAlchemy/PostgreSQL karşılığıdır.

ArcheType hangi alanının çevrilebilir olduğunu açıkça beyan eder (bkz. `k-archetype-fieldtypes`); enum değeri ve etiket yerelleştirmesi alias zinciriyle yönetilir. Kişisel veri tablosu bir residency etiketi taşır; residency etiketsiz kişisel veri tablosu yasaktır. Locale-farkında sıralama için PostgreSQL `COLLATE` (ICU collation) kullanılır; sabit `ORDER BY name` global içerikte yanlış sıralar. Unicode metin NFC normalize edilerek saklanır (bkz. `03-n6n` planlı standardı).

## 7. API/OpenAPI Requirements

API sözleşmesi OpenAPI-first üretilir ve her yanıt etkin locale bağlamını taşır. Hata taksonomisi `code` (sabit, makine-okur) ile `message` (çevrilmiş, insan-okur) ayrımını korur; `data-api-contract` standardıyla hizalıdır. `Accept-Language` isteği locale çözümleme zincirinin bir halkasıdır (kullanıcı-tercihi ve tenant-varsayılanının gerisinde). Para tutarları currency kodu ile birlikte döner (`{amount, currency}`); çıplak `float` para yasaktır çünkü currency ekseni locale'den ortogonaldir.

## 8. Security Requirements

Çeviri katmanı bir enjeksiyon yüzeyidir: ICU MessageFormat argümanları HTML/script olarak yorumlanmaz, çıktı kaçışlanır (React varsayılan kaçışı korunur; `dangerouslySetInnerHTML` ile çeviri basmak yasaktır). Kullanıcı-katkılı çeviri (topluluk çevirisi) onaydan geçmeden yayınlanmaz. Residency ihlali bir güvenlik/uyum olayıdır: bölge-bağlı veri failover'da bile hedef bölge dışına sızmaz (`i18n-data-residency`). Locale/jurisdiction değerleri istemciden gelen ham girdi olarak doğrulanır; doğrulanmamış locale ile dosya yolu/SQL kurulmaz.

## 9. Multi-tenant Requirements

Locale çözümleme sırası tenant sınırını korur: tenant-varsayılanı kullanıcı-tercihinin hemen ardından gelir ve bir tenant'ın varsayılan locale/currency/timezone'u diğerine sızmaz. Her tenant kendi desteklenen-locale kümesini ve varsayılan jurisdiction eksenlerini tanımlar. Çeviri kataloğu tenant-özel override taşıyabilir (marka terminolojisi); override yoksa platform kataloğuna düşülür. Residency etiketi tenant'ın jurisdiction konfigürasyonundan türetilir, koddan değil.

## 10. Admin Panel Requirements

Yönetici paneli çeviri iş akışını ve locale konfigürasyonunu yönetir; bu, `i18n-translation-workflow-and-locale-resolution` kuralının operatör yüzeyidir. Panel şunları sağlar: desteklenen locale listesi ve tenant-varsayılanı seçimi; eksik/çevrilmemiş anahtarların raporu; taslak→inceleme→yayın kademeli çeviri onayı (AI önerir, insan onaylar, motor yayınlar); jurisdiction ekseni (currency/tax/timezone/residency) ataması. Panelin kendisi de bu standarda uyar: kendi metinleri de çeviri anahtarıyla verilir.

## 11. Test Requirements

Testler `check-i18n` kapısının yeşil olma koşulunu doğrular ve kural ID'leriyle izlenir. Aşağıdaki tablo test tipini kurala bağlar; kural metinleri sözleşmededir, burada tekrar edilmez.

| Test tipi | Neyi doğrular | Bağlı kural |
|---|---|---|
| unit | ICU biçimleme + CLDR sayı/tarih/para çıktısı | `i18n-message-format`, `i18n-locale-formatting` |
| unit | fallback zinciri ham anahtar göstermiyor | `i18n-message-format` |
| integration | locale çözümleme sırası (user→tenant→header→system) | `i18n-translation-workflow-and-locale-resolution` |
| integration | jurisdiction eksen kombinasyonu çakışması yok | `i18n-jurisdiction-orthogonal` |
| conformance | residency: bölge-bağlı veri hedef bölge dışına çıkmıyor | `i18n-data-residency` |
| e2e | RTL render + dil değişimi (tam-yükleme yok) | `i18n-rtl-support` |
| e2e | pseudo-locale render (metin taşması + eksik anahtar tespiti) | `i18n-message-format` |

## 12. Acceptance Criteria

Standart, `check-i18n` kapısı ham-string taramasında, eksik-anahtar taramasında, RTL logical-property lint'inde ve locale-context taşımasında kırmızıdan yeşile geçtiğinde karşılanmış sayılır. Pseudo-locale render testi metin taşması üretmemeli; residency conformance testi bölge sızıntısı bulmamalı; jurisdiction çakışma testi (ör. tr-TR locale + EUR currency + DE tax) yeşil olmalı. Ham anahtarın arayüzde göründüğü tek bir yol bile kabul edilmez.

## 13. Anti-patterns

Aşağıdaki desenler sözleşmenin `banned` listesiyle birebir hizalıdır ve `check-i18n` tarafından reddedilir.

| Anti-pattern | Neden yanlış | Sözleşme `banned` karşılığı |
|---|---|---|
| Kaynak kodda ham kullanıcı metni | Çeviri sürecine giremez | `hardcoded-user-string` |
| Sabit tarih/sayı formatı | Yanlış bölgede yanıltıcı | `fixed-date-number-format` |
| Naive datetime | Çok-bölgede veri bozar | `naive-datetime` |
| Fiziksel left/right RTL'siz düzen | RTL kırılır | `missing-rtl-support` |
| Arayüzde ham çeviri anahtarı | Kullanıcıya teknik sızıntı | `raw-translation-key-shown` |
| Makine-çevirisini doğrudan yayınlamak | Marka/hukuk riski | `machine-translation-direct-publish` |
| Residency etiketsiz kişisel veri | Mevzuat ihlali | `residency-unlabeled-personal-data` |
| Global içerikte tek-dil kolon | Ürünü bloke eder | `single-language-content-column` |

## 14. Examples

Bir düğüm bu standarda içeriği kopyalayarak değil, referansla bağlanır: `standardRefs.i18nRef = "i18n-standards"`. Backend'de doğru desen, cümleyi `f-string` ile kurmak yerine ICU anahtarı çözmektir: `t("cart.items", {count: n})` çoğul kuralını locale'e göre üretir. Frontend'de `Intl.NumberFormat(locale, {style: "currency", currency}).format(amount)` kullanılır; `amount + " ₺"` yasaktır. DB'de ürün adı `name: i18n-text` (locale→değer) olarak modellenir; `name: VARCHAR` global içerikte kabul edilmez. Ortogonallik örneği: bir Alman tenant'ın Türk müşterisi tr-TR arayüz, EUR fiyat ve DE vergi görebilir — üç eksen bağımsız çözülür.

## 15. Definition of Done

Standart şu koşullar birlikte sağlandığında tamamlanır: ilgili düğümler `standardRefs.i18nRef` ile bağlı; `check-i18n` kapısı yeşil; §11 test tablosundaki her satır için en az bir test mevcut ve geçiyor; g11n ortogonallik beyanı (locale/currency/tax/residency bağımsızlığı) `i18n-jurisdiction-orthogonal` kuralı üzerinden doğrulanmış; çeviri iş akışı taslak→inceleme→yayın olarak işliyor ve makine-çevirisi doğrudan yayınlanmıyor; hiçbir kural değeri bu anlatıda tekrar tanımlanmamış (drift yok), yalnız `i18n-standards.json`'a referans verilmiş.

---

## Requirement-ID Tablosu

Aşağıdaki tablo bu anlatının gereksinimlerini izlenebilir ID'lere böler. Her satır bir gereksinimi, ait olduğu katmanı, önceliğini (P0 sistemsiz çalışmaz, P1 enterprise zorunlu, P2 global zorunlu, P3 opsiyonel), test tipini, kabul kriterini ve sahibini taşır. "Bağlı kural" olan gereksinimler `i18n-standards.json` sözleşmesine referanstır; kural değeri burada tekrar edilmez.

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| I18N-01 | ICU MessageFormat çeviri, ham-metin yasağı, fallback (ref: `i18n-message-format`) | Backend+Frontend | P2 | unit | Ham anahtar arayüzde asla görünmez | i18n-owner |
| I18N-02 | CLDR locale biçimleme + timezone-aware datetime (ref: `i18n-locale-formatting`) | Backend+Frontend | P2 | unit | tr/ar/de tarih-sayı-para doğru | i18n-owner |
| I18N-03 | RTL mantıksal CSS + ayna-çeviri (ref: `i18n-rtl-support`) | Frontend | P2 | e2e | RTL render kayması yok | frontend-owner |
| I18N-04 | Çevrilebilir `i18n-text` DB alanı + çevrilebilirlik beyanı (ref: `i18n-translatable-fields`) | Database | P2 | conformance | ArcheType alan beyanı geçer | data-owner |
| G11N-01 | Ortogonal eksenler: locale≠currency≠tax≠timezone≠residency (ref: `i18n-jurisdiction-orthogonal`) | Backend+Database | P2 | integration | Eksen-kombinasyon çakışması yok | i18n-owner |
| G11N-02 | Data-residency sorgu-katmanı zorlaması + failover koruması (ref: `i18n-data-residency`) | Backend+Database | P1 | conformance | Bölge sızıntısı yok | security-owner |
| I18N-05 | Çeviri iş akışı (taslak→inceleme→yayın) + locale çözümleme sırası (ref: `i18n-translation-workflow-and-locale-resolution`) | Backend+Admin | P2 | integration | Locale sırası user→tenant→header→system | i18n-owner |
| I18N-06 | API hata mesajı çevirisi (code sabit, message çevrili) | API | P1 | integration | Hata message etkin locale'de döner | api-owner |
| I18N-07 | Çeviri hook (frontend), JSX ham-string yasağı | Frontend | P2 | unit | Katalogtan çözülmeyen metin yok | frontend-owner |
| I18N-08 | Pseudo-locale render testi (taşma + eksik anahtar) | Frontend | P3 | e2e | Pseudo-locale taşma üretmez | frontend-owner |
| I18N-09 | Tenant-default locale/currency izolasyonu | Multi-tenant | P1 | integration | Tenant varsayılanı sızmaz | platform-owner |
| I18N-10 | Admin çeviri onay + locale konfigürasyon paneli | Admin | P2 | e2e | Onaysız çeviri yayınlanamaz | admin-owner |

---

Bağlı: `docs/i18n-standard.md` (15. standart özeti), `src/data/standards/i18n-standards.json` (makine sözleşmesi), `docs/standards/00-standards-index.md` (klasör indeksi), `docs/standards/numeronym-siniflandirma.md` §2 (i18n/l10n/g11n sınıflandırması), `k-jurisdiction` (6-eksen resolver), WBS 13.7 `s-i18n` (çeviri iş akışı düğümü), `docs/standards/03-n6n-standard.md` (planlı — NFC normalizasyon).
