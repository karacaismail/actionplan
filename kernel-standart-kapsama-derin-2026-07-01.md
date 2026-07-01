# 14 Mühendislik Standardı + i18n — Kernel Kapsama Derin Denetimi

**Soru:** Bu standartlar ve i18n gereksinimleri **kernel tarafında var mı?**
**Tarih:** 2026-07-01 · **Yöntem:** `src/data/standards/*.json`, `engineering-standards-index.md`, `core-contract-pack.md` ve 459 WBS düğümü tarandı (varsayım değil, dosya kanıtı). · **Not:** Bu rapor, önceki `kernel-dokuman-gap` raporundaki "i18n gerçek boşluk" ifademi **düzeltir** — aşağıda gerekçesiyle.

---

## 0. Tek cümlelik cevap

> **14 standart kernel tarafında GERÇEKTEN VAR** (dosya + CI kapısı olarak, tüm düğümlere — kernel dahil — uygulanır). **i18n ise "yok" değil, "zengin biçimde tasarlı ama zorunlu-standart değil":** `cc-i18n-standards` (BCP47/CLDR/ICU/RTL), `s-i18n` (çeviri iş akışı + fallback + FX) ve özellikle `cc-jurisdiction-resolver` (Locale≠Jurisdiction≠Currency≠Tax≠Timezone≠Data-residency 6-eksen ortogonal model) **mevcut** — üstelik ChatGPT'nin düz listesinden mimari olarak daha ileri. Gerçek boşluk: i18n 14 standardın içinde değil, dolayısıyla `standardRefs.i18nRef` + CI kapısı + app-başı zorunlu uyum yok. **Yani sorun eksik-tasarım değil, eksik-enforcement.**

---

## 1. Önce premisi düzeltelim — ChatGPT'nin "14 standart" listesi tahmin, gerçek liste farklı

ChatGPT dokümanı görmeden 14 standardı tahmin etmiş (Architecture, Domain Model, Data/API, Auth/RBAC, Validation, Error Handling, Logging/Audit, Testing, Security, Performance, Observability, Documentation, Enterprise DoD, Deployment). Bu iyi niyetli bir tahmin ama **gerçek 14 farklı**. `src/data/standards/` dizinindeki gerçek 14 dosya:

Sade özet: gerçek liste "kod-üretim disiplini" eksenli (SOLID/kısa-kod/tasarım-sistemi/state), ChatGPT'ninki "kavramsal alan" eksenli. Bazı ChatGPT maddeleri (Auth, Validation, Error) gerçekte *ayrı standart değil*, başka standartların/kernel-primitiflerin içinde.

| # | Gerçek standart (dosya) | Aile | Zorlayan CI kapısı |
|---|---|---|---|
| 1 | `architecture` | engineering | check-standards-coverage |
| 2 | `coding-standards` | engineering | check-standards-coverage |
| 3 | `short-code` | engineering | check-short-code |
| 4 | `quality-gates` | testing | check-standards-coverage |
| 5 | `testing-strategy` | testing | check-standards-coverage |
| 6 | `design-system` | design | check-ui-standards |
| 7 | `ui-components` | design | check-ui-standards |
| 8 | `ux-interaction` | design | check-ui-standards |
| 9 | `data-api-contract` | data | check-standards-coverage |
| 10 | `state-management` | engineering | check-standards-coverage |
| 11 | `observability` | devops | check-standards-coverage |
| 12 | `release-versioning` | devops | check-standards-coverage |
| 13 | `ai-governance` | ai | check-standards-coverage |
| 14 | `dependency-policy` | governance | check-dependency-policy |

(+ `techProfileRef` — ADR-0026 frontend stack manifesti, check-tech-profile.) **i18n bu 14'ün içinde YOK** — bu kısımda ChatGPT haklı.

---

## 2. 14 standart × kernel-tarafı kanıtı (hepsi var mı, nerede zorlanıyor?)

Sade özet: 14 standardın tümü hem **sözleşme dosyası** (`src/data/standards/<id>.json`) hem **CI kapısı** olarak var; kernel düğümleri bunlara `standardRefs` ile bağlanır. Yani "kernel tarafında var mı?" sorusunun cevabı standartlar için net **evet**. Aşağıda her birinin kernel karşılığı + bir uyarı.

| Standart | Kernel tarafı karşılığı (kanıt düğüm/doküman) | Durum |
|---|---|---|
| architecture | `k-terminoloji`, `k-control-planes`, `core-contract-pack §1` (katman sınırı, kernel-dokunma kuralı, engine↔UI) | Var, zorlanıyor |
| coding-standards | biome lint/format + `sus-llm-hata-katalogu` | Var |
| short-code | `check-short-code` kapısı | Var |
| quality-gates | `ci-conformance-gates.md` (typecheck 0, axe 0, kapsam) | Var |
| testing-strategy | test piramidi; `enterprise-dod §2.9-2.11` | Var |
| design-system / ui-components / ux-interaction | `k-surface`, `k-surface-consumer`, `adr-0026` | Var |
| data-api-contract | `platform-graphql-api`, `core-contract-pack §2` | **Var ama BAYAT** (aşağıda) |
| state-management | TanStack Query/Router konvansiyonu | Var |
| observability | `core-contract-pack §2.9`, `cc-obs` | Var |
| release-versioning | `release-policy.md` | Var |
| ai-governance | `k-agent-runtime`, `sus-ai-uretim-sozlesmesi`, `claude-ai-archetype-eca-directive` | Var (güçlü) |
| dependency-policy | `check-dependency-policy` (lisans-katman federasyonu, SBOM) | Var |

**Kritik uyarı (kernel'i doğrudan etkiler):** `data-api-contract` standardı hâlâ **"Prisma model konvansiyonu"** diyor. Ama kernel `core-contract-pack` ve `platform-db-schema` **SQLAlchemy 2.0 + Alembic** kararında. Bu çelişki, kernel'e başlarken yanlış-kod ürettirir → **acil düzeltilmeli** (bkz. `kernel-dokuman-gap` §2, ADR-D5).

---

## 3. ChatGPT'nin saydığı gereksinimler gerçekte nerede yaşıyor?

Sade özet: ChatGPT'nin "ayrı standart" sandığı bazı şeyler gerçekte *kernel-primitifi* veya *boyut* olarak var; biri (Documentation) gerçekten eksik.

- **Auth / RBAC**: ayrı standart değil; **kernel-primitifi** — `k-authz` (ReBAC+ABAC), `k-identity`, `k-tenancy`, + bu oturumda `k-policy-pdp`, `k-capability`, `k-actor`. Ayrıca `cc-security` + `enterprise-dod §2.2`. → **Var (standart değil, primitif).**
- **Validation / Error Handling**: `coding-standards` + ArcheType `validationRules`/`semanticRules`. → Var.
- **Logging / Audit**: `observability` standardı + `l1-audit` + `core-contract-pack §2.5`. → Var (güçlü).
- **Security**: ayrı *standart* değil; `quality-gates` (owasp) + `owasp` boyutu + `cc-security` (STRIDE+OWASP). → Var ama "boyut/düğüm" olarak, tek-kaynak *standart sözleşmesi* değil (istenirse standarda terfi).
- **Performance**: `performance` **boyutu** (14 üretim boyutundan biri), standart değil. → Var (boyut).
- **Deployment/Runtime**: `deployment` boyutu + `enterprise-dod §2.13`. → Var (boyut), topoloji doc'u eksik.
- **Enterprise DoD**: `enterprise-dod.md` (kanonik sözleşme, 14'ün dışında). → Var.
- **Documentation**: 14 standartta **YOK**, ayrı doc-standardı da yok. → **Gerçek ikincil boşluk** (ChatGPT'nin #12'si). Modül teknik/kullanıcı dokümanı formatı standartlaşmamış.

---

## 4. i18n DERİN DENETİM — asıl mesele (ve önceki ifademin düzeltmesi)

### 4.1 Önce dürüstlük: i18n "yok" değil — önceki raporumu düzeltiyorum
`kernel-dokuman-gap` raporunda "i18n gerçek boşluk" demiştim; bu **eksik/yanıltıcıydı**. Temiz tarama gösteriyor ki i18n kernel/crosscut tarafında **zengin biçimde tasarlı**. Kanıt düğümler:

- **`cc-i18n-standards`** [stone] — "BCP 47 (dil etiketi), CLDR (yerel veri), ICU MessageFormat (çoğul/biçim), RTL, Türkçe i/ı **collation** tuzağı, **pseudo-localization**, çeviri yönetimi, dil-**fallback**." Bu, tam teşekküllü bir i18n teknik standardıdır — sadece "standart olarak zorlanmıyor."
- **`s-i18n`** [archetype] — Ürünleşmiş i18n: "ICU MessageFormat çeviri yönetimi, çoğul/cinsiyet kuralı, çeviri iş akışı (taslak→inceleme→yayın), **eksik anahtarda fallback** — ham anahtar asla gösterilmez, CLDR sayı/tarih/para, **RTL tam düzen**, FX dönüşümü `cc-fx-ledger` ile, bölge kuralları `cc-jurisdiction-resolver` ile."
- **`cc-jurisdiction-resolver`** [module] — **En kritik ve ChatGPT'den ileri:** "Locale ≠ Jurisdiction ≠ Currency ≠ Tax ≠ Timezone ≠ Data residency — **6-eksen ortogonal model**. Amazon/eBay 'codebase değiştirmez' — politika/config'i koddan ayırır." Bu, ChatGPT'nin *düz liste* olarak saydığı şeylerin **doğru mimari çözümü**: her ekseni bağımsız çözer, kombinasyon çakışmasını önceliklendirir.
- **`l1-misc`** — i18n + Money (para/kur) + Calendar Layer-1 yardımcıları.
- **`cc-privacy`** (KVKK+GDPR: rıza, DSR, silme, taşınabilirlik, 72s ihlal) + **`s-kvkk`** (VERBİS, DSR portal) — hukuki yerelleştirme.

### 4.2 ChatGPT'nin i18n alt-gereksinimleri × gerçek kapsama
Sade özet: neredeyse tüm alt-gereksinim **içerik/tasarım olarak var**; boşluk tekil özelliklerde değil, **zorunlu-standart + kernel-primitifi** düzeyinde.

| i18n gereksinimi (ChatGPT) | Kernel/crosscut karşılığı | Durum |
|---|---|---|
| Language / Locale (BCP 47) | `cc-i18n-standards`, `s-i18n` | Tasarlı |
| Currency + FX | `l1-misc` (Money), `s-i18n`+`cc-fx-ledger`, `k-archetype-fieldtypes` (money tipi) | Tasarlı |
| Date/Time + Number format (CLDR) | `cc-i18n-standards`, `s-i18n` (CLDR) | Tasarlı |
| Timezone / business-time | `k-calendar-capacity` (business-time), `cc-jurisdiction-resolver` (timezone ekseni) | Tasarlı |
| RTL | `cc-i18n-standards`, `s-i18n` (tam düzen) | Tasarlı |
| Translatable DB fields | `k-archetype-fieldtypes` (`i18n-text` tipi — bu oturumda eklendi) | Tasarlı |
| Tax localization (KDV/VAT/GST) | `cc-jurisdiction-resolver` (tax ekseni) + vergi düğümleri (15 dosya) | Tasarlı |
| Legal localization (KVKK/GDPR) | `cc-privacy`, `s-kvkk`, `cc-jurisdiction-resolver` | Güçlü |
| Data residency (bölge) | `cc-jurisdiction-resolver` (data-residency ekseni) | Tasarlı (enforcement zayıf) |
| Translation workflow | `s-i18n` (taslak→inceleme→yayın) | Tasarlı |
| Fallback chain | `cc-i18n-standards`, `s-i18n` (ham anahtar gösterme) | Tasarlı |
| Search/slug i18n | `l1-search`/`l1-pseo` (slug 337 dosyada) — transliteration açık değil | Kısmi |
| Email/Notification i18n | `l1-notification` (289 dosyada bildirim) — locale-bağı açık değil | Kısmi |
| Tenant-default + user-locale | `k-tenancy` (tenant bağlamı) + `cc-jurisdiction-resolver` — çözümleme zinciri açık değil | Kısmi |

### 4.3 Gerçek boşluk üç maddede (tekil özellik değil, yapısal)
1. **i18n zorunlu-standart değil:** 14 standartta yok → `standardRefs.i18nRef` yok, `check-i18n` CI kapısı yok, **app-başı i18n uyum checklist'i zorlanmıyor**. Yani bir app i18n'siz "enterprise-ready" sayılabilir — ChatGPT'nin asıl haklı olduğu nokta budur.
2. **`cc-jurisdiction-resolver` bir kernel-primitifi değil, crosscut düğümü:** Oysa Locale/Currency/Tax/Timezone/Residency çözümlemesi **her app'in her isteğinde** gerekir — bu, `k-authz` gibi kernel-primitifi olmalı (her istek tenant-context + jurisdiction-context taşımalı). Şu an "crosscut" seviyesinde; kernel omurgasına örülü değil.
3. **Data-residency enforcement zayıf:** 6-eksen modelde residency *ekseni var* ama query-layer'da "TR verisi TR'de" **zorlaması** + failover'da residency-kapısı belgesiz (önceki kernel raporu §6 ile aynı bulgu).

---

## 5. Verdikt + ne yapmalı

**Cevap net:** 14 standart kernel tarafında **var ve zorlanıyor**; i18n **var ama zorlanmıyor** (tasarım güçlü, governance eksik). Yani ürün bugün *i18n-yetenekli* ama *i18n-garantili değil*.

Yapılacaklar (öncelik sırasıyla):
1. **`cc-i18n-standards`'ı 15. mühendislik standardına terfi et:** `src/data/standards/i18n-standards.json` + `StandardRefsSchema.i18nRef` + `check-i18n` CI kapısı + app-başı i18n uyum checklist'i. Zaten içerik hazır — sadece *governance katmanına* bağla. (En yüksek getiri; sonradan eklemek en pahalı olan.)
2. **`cc-jurisdiction-resolver`'ı kernel-primitifine terfi et:** `k-jurisdiction` — her istek `tenant + jurisdiction` context taşısın (tıpkı `k-tenancy` gibi). 6-eksen çözümleme kernel omurgasına örülsün.
3. **Data-residency enforcement:** query-layer zorlaması + failover residency-kapısı (bu oturumdaki `scale-invariant` deseniyle: zorunlu-invariant).
4. **`data-api-contract` bayat düzeltmesi** (Prisma→SQLAlchemy) — i18n ile ilgisiz ama kernel'e başlamadan acil.
5. **İkincil:** Documentation standardı (15./16.) + Security/Performance'ı boyuttan standarda terfi (opsiyonel).

**Aktör açıklığı:** *geliştirici* app'i i18n-standardına bağlar (`i18nRef`); *CI* `check-i18n` ile uyumu zorlar (eksikse merge bloklanır); *AI* eksik çeviri/locale önerir ama *insan* onaylar; *kernel* jurisdiction context'ini her isteğe taşır.

---

## 6. Kilitlenecek ADR taslakları

- **ADR-I1 — i18n 15. standart.** `cc-i18n-standards` → standart sözleşmesi + `i18nRef` + `check-i18n`. Öneri: evet (global blocker; içerik hazır).
- **ADR-I2 — Jurisdiction kernel-primitifi.** `cc-jurisdiction-resolver` → `k-jurisdiction` (her istekte 6-eksen context). Öneri: evet.
- **ADR-I3 — Data-residency zorunlu-invariant.** Query-layer + failover kapısı. Öneri: `scale-invariant` deseni.
- **ADR-I4 — data-api-contract stack düzeltmesi.** Prisma→SQLAlchemy. Öneri: acil.
- **ADR-I5 — Documentation standardı (ikincil).** Modül doküman formatı standardı. Öneri: değerlendir.

---

## 7. Özet tablo — "kernel tarafında var mı?"

| Konu | Var mı? | Nasıl |
|---|---|---|
| 14 mühendislik standardı | **Evet** | `src/data/standards/*.json` + CI kapıları, tüm düğümlere uygulanır |
| Auth/RBAC/Audit/Observability | **Evet** | Kernel-primitifi + standart + `enterprise-dod` |
| i18n yeteneği (dil/locale/RTL/FX/CLDR/jurisdiction) | **Evet (tasarlı)** | `cc-i18n-standards`, `s-i18n`, `cc-jurisdiction-resolver` (6-eksen) |
| i18n **zorunlu standart** olarak | **Hayır** | 14'te yok; `i18nRef`/CI kapısı yok → app-başı uyum zorlanmıyor |
| Jurisdiction **kernel-primitifi** olarak | **Hayır** | crosscut düğümü; her isteğe context olarak örülü değil |
| Data-residency enforcement | **Kısmi** | eksen var, query-layer zorlaması yok |
| Documentation standardı | **Hayır** | 14'te yok (ikincil boşluk) |
| data-api-contract güncelliği | **Bayat** | "Prisma" diyor; stack SQLAlchemy |

---

*Bağlı: `kernel-dokuman-gap-2026-07-01.md` (doküman güncelleme/ekleme planı) — bu rapor onun i18n bölümünü düzeltir/derinleştirir.*
