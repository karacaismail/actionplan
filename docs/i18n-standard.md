# i18n / l10n Standardı — 15. Mühendislik Standardı

**Statü:** kanonik standart (ADR-0027 katmanı). **Kod karşılığı:** `src/data/standards/i18n-standards.json` (`StandardContractSchema`) + düğüm bağı `standardRefs.i18nRef` + CI kapısı `check-i18n`.
**Neden var:** Ürünler global; çok-dil / çok-bölge / çok-para-birimi / yerel-mevzuat baştan tasarlanmalı — sonradan eklemek en pahalı i18n işidir. Bu standart olmadan bir app "enterprise-ready" sayılmaz.

---

## 1. Bu nedir / ne yapar / ne yapmaz

**Bu nedir?** i18n (internationalization) = ürünü çok-dile/bölgeye *hazırlama*; l10n (localization) = belirli bölgeye *uyarlama*. Bu doküman, 14 mevcut mühendislik standardına eklenen **15. çapraz-kesen standardı** tanımlar. Terminoloji (ilk geçtiği yerde): **BCP 47** = dil-etiketi (ör. `tr-TR`); **CLDR** = Unicode yerel-veri (tarih/sayı/para biçimi); **ICU MessageFormat** = çoğul/cinsiyet-duyarlı çeviri biçimi; **RTL** = sağdan-sola (Arapça/İbranice/Farsça).

**Ne işe yarar?** Her app'in (CRM, HRMS, CMS, Ecommerce, MRP, Accounting...) çok-dil/locale/RTL/para/vergi/mevzuat davranışını **tek-kaynak, CI-zorlamalı** bir sözleşmeye bağlar; drift'i imkânsızlaştırır.

**Ne yapar?** Düğüm `standardRefs.i18nRef = "i18n-standards"` ile bağlanır; `check-i18n` kapısı uyumu denetler (ham-metin taraması, i18n-text beyanı, RTL logical-property, locale-context, residency).

**Ne yapmaz?** Makine-çevirisi *yapmaz*; çeviri *altyapısını* tanımlar, içeriği değil. AI çeviri **önerir**, insan **onaylar**, motor **yayınlar** — makine-çevirisi doğrudan yayınlanmaz.

---

## 2. Neden ayrı standart (boyut değil, mevcut standarda gömülü değil)

i18n hem frontend, hem backend, hem veritabanı, hem API, hem arama, hem bildirim, hem faturalama tarafını etkiler. Bu yüzden `data-api-contract`'a veya `ui-components`'e gömülmemeli; **ayrı, çapraz-kesen bir standart** olmalı. Böylece her katman aynı i18n sözleşmesine referans verir.

---

## 3. Kurallar (özet — tam metin JSON'da)

Sade özet: yedi kural, i18n'in yedi kritik ekseni. Hepsi `severity: must`; her biri `check-i18n` (veya ilgili conformance testi) ile zorlanır.

1. **ICU MessageFormat çeviri** — ham (hardcoded) kullanıcı metni yasak; çoğul/cinsiyet ICU ile; eksik anahtarda fallback, ham anahtar asla gösterilmez.
2. **CLDR locale biçimleme** — tarih/saat/sayı/para locale-farkında; sabit format ve naive datetime yasak.
3. **RTL tam düzen** — mantıksal CSS (start/end), `dir=auto`, ayna-çeviri, RTL görsel test.
4. **Çevrilebilir DB alanları** — çok-dilli içerik `i18n-text` (locale→değer); ArcheType çevrilebilir alanı açıkça beyan eder; enum/etiket alias ile.
5. **Ortogonal jurisdiction** — Locale ≠ Jurisdiction ≠ Currency ≠ Tax ≠ Timezone ≠ Data-residency; `k-jurisdiction` (6-eksen) ile çözülür; biri diğerinden türetilmez.
6. **Veri-ikamet (residency)** — bölgeye bağlı veri sorgu katmanında zorlanır; failover'da residency kapısı korunur (KVKK/GDPR).
7. **Çeviri iş akışı + locale çözümleme** — taslak→inceleme→yayın; etkin locale = kullanıcı-tercihi ?? tenant-varsayılanı ?? Accept-Language ?? sistem-varsayılanı; her istek locale-context taşır.

---

## 4. Üç katmana dokunuş (kernel / archetype / surface)

- **Archetype**: `i18n-text` alan tipi (bkz. `k-archetype-fieldtypes`) + çevrilebilirlik beyanı + enum/etiket alias.
- **Surface**: locale biçimleme, RTL, çoğul, pseudo-localization testi (bkz. `docs/surface-spec.md` §7).
- **Kernel**: çeviri deposu + fallback + çeviri-iş-akışı; `k-jurisdiction` (6-eksen) + data-residency zorlaması (bkz. `docs/core-contract-pack.md` v2 §3.15).

---

## 5. Aktör açıklığı

*Geliştirici* app'i `i18nRef` ile bağlar; *CI* (`check-i18n`) uyumu zorlar (eksikse merge bloklanır); *AI* eksik çeviri/locale/anahtar önerir; *insan* çeviriyi/politikayı onaylar; *kernel* her isteğe jurisdiction + locale context'ini taşır.

---

## 6. Mevcut varlıklarla ilişki

Bu standart sıfırdan tasarım değildir; mevcut zengin i18n tasarımını **governance katmanına** bağlar: `cc-i18n-standards` (BCP47/CLDR/ICU/RTL teknik standardı), `s-i18n` (çeviri iş akışı + fallback + FX), `cc-jurisdiction-resolver` → `k-jurisdiction` (6-eksen), `l1-misc` (Money/i18n), `cc-privacy`/`s-kvkk` (hukuki yerelleştirme). Eksik olan "tasarım" değil, "zorunlu-standart + kernel-primitifi"ydi; bu doküman + `i18n-standards.json` onu kapatır.

---

*Bağlı: `engineering-standards-index.md` (15 standart hub), `standards-applicability-matrix.md` (i18n × seviye), `adr-0026-tech-profiles.md` (i18n frontend profili), `core-contract-pack.md` v2 §3.15 (jurisdiction primitifi).*
