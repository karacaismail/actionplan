# SURFACE ↔ Numeronym Eşlemesi — Hangi Standart Hangi Yüzey Alanında Karşılanır

Sürüm: 1.0 — 2026-07-01 · Durum: AI-DRAFT (ajan taslağı; insan onayı bekler). İzlenebilirlik dokümanı; kural değeri tanımlamaz, `numeronym-siniflandirma.md` standartlarını `src/schemas/surface.ts` alanlarına eşler.
Kaynak: `docs/standards/numeronym-siniflandirma.md` (7-aile sınıflandırma), `src/schemas/surface.ts` (SURFACE şeması), `docs/surface-v2-directive.md` (§8 a11y, §9 i18n, §10 state), `docs/standards/02-a11y-accessibility-standard.md`, `docs/standards/09-customization-personalization-standard.md`.

Bu doküman şu soruyu cevaplar: numeronym sınıflandırmasındaki her standart, SURFACE katmanının hangi tipinde veya hangi şema alanında somutlaşır? Amaç, "standart var ama yüzeyde nereye bağlandığı belirsiz" driftini kapatmak ve her SURFACE tipinde hangi beyanların zorunlu olduğunu netleştirmektir. Standartların bir kısmı SURFACE katmanında yaşamaz (kimlik/gözlemlenebilirlik/kanonikleştirme kernel veya archetype katmanının işidir); bunlar tabloda açıkça "kernel/archetype katmanında" işaretlenir ki ajan bir güvenlik/veri kuralını yanlışlıkla yüzey alanına gömmesin.

---

## 1. Eşleme Yöntemi ve Kolonlar

Aşağıdaki tablo her numeronym standardını bir SURFACE karşılığına bağlar. Kolonların anlamı tek cümlede şudur: **standart** = numeronym sınıflandırmasındaki kural; **surface alanı/tipi** = kuralın karşılandığı `src/schemas/surface.ts` alanı veya `SurfaceTypeSchema` tipi (SURFACE-dışı ise katman adı); **nasıl** = kuralın o alanda ne şekilde somutlaştığı; **durum** = alanın şemada bugün mevcut mu (VAR) yoksa `surface-v2-directive` ile eklenecek mi (YENİ). SURFACE katmanında karşılanmayan standartlar (kimlik, gözlemlenebilirlik, kanonikleştirme) "kernel/archetype katmanında" olarak işaretlenir; SURFACE onları *tüketir* veya *tetikler* ama *tanımlamaz*.

---

## 2. SURFACE Katmanında Karşılanan Numeronym Standartları

Bu bölümdeki standartlar doğrudan bir SURFACE alanında veya tipinde somutlaşır. `durum` sütunu, mevcut `surface.ts` şemasında zaten olan (VAR) ile `surface-v2-directive §6` şema değişiklikleriyle eklenecek (YENİ) alanları ayırır.

| Standart | Surface alanı/tipi | Nasıl | Durum |
|---|---|---|---|
| a11y (WCAG 2.2 AA taban) | `a11y.wcag` (`SurfaceA11ySchema`) | Yüzeyin erişilebilirlik taban seviyesini beyan eder; varsayılan `2.2-AA`; `check-ui-standards` + axe AA'yı bloklar (`02-a11y` §12) | VAR |
| a11y (AAA yüzey-bazlı hedef) | `a11y.wcagAspirational` | Yüzey-bazlı AAA hedefi; CI raporlar, bloklamaz (`surface-v2-directive §8`, `02-a11y` §7) | YENİ |
| a11y (klavye navigasyonu) | `a11y.keyboardNav` | Tam klavye akışı + focus trap + Escape sözleşmesi (`02-a11y` §5, `uxi-keyboard-full`) | VAR |
| a11y (renk-dışı durum) | `a11y.textStatus` | Durum yalnız renkle değil metinle de bildirilir (`uxi-status-not-color-only`) | VAR |
| a11y (endüstriyel HMI) | `andon` + `terminal` tipleri (Shop) | Renk-körü-güvenli andon (renk + şekil), ~64px dokunma hedefi (eldiven), gürültüde görsel-öncelikli geri-bildirim (`surface-v2-directive §8`) | YENİ |
| a11y (WebGL/WebRTC eşdeğeri) | `map-live` + `media-room` tipleri | Erişilebilir eşdeğer (tablo/metin fallback) zorunlu (`surface-v2-directive §8`) | YENİ |
| i18n (internationalization) | `i18n.locales` + `i18n.defaultLocale` | Yüzeyin desteklediği locale listesi + varsayılan dil beyanı (`surface-v2-directive §9`) | YENİ |
| l10n (localization) | `perf.renderMode` + i18n biçimleme | Tarih/para/sayı CLDR-tabanlı locale-farkında; ICU MessageFormat çoğul-kuralı (`surface-v2-directive §9`, `01-i18n` standardı) | YENİ |
| RTL (yazım yönü) | `i18n.rtl` (`auto`/`true`/`false`) | Yazım yönü beyanı; `auto` locale'den türer; CI pseudo-localization RTL+uzun-metin taşmasını yakalar | YENİ |
| t9n (translation, tek-kaynak) | `i18n.messagesRef` | Çeviri kaynağı referansı; ArcheType i18n-text alanına bağlanır — enum/etiket Surface'te tekrar yazılmaz (drift engellenir) | YENİ |
| p13n (saved-view) | `list`/`data-grid` + p13n (`user_preferences`/`saved_views`) | Kullanıcı filtre+sıralama+kolon-seçimini adlandırıp kaydeder; user-scoped, başka kullanıcıya sızmaz (`09-c12n/p13n` §8) | YENİ |
| p13n (dashboard düzeni) | `dashboard` tipi + `user_dashboard` | Kullanıcı widget seçimi/düzeni/boyutunu kişiselleştirir; yalnız yetkili+capability'li veriyi gösterir (`09` §9) | YENİ |
| c12n (tenant tema-token) | `techProfileRef` + `tenant_theme` (CSS custom property) | Tenant beyaz-listeli tasarım-token'ı ayarlar; runtime CSS değişkeni; AA kontrast korunur (`09` §5) | YENİ |
| c12n (layout tercihi) | `layout` alanı + `tenant_settings` | Tenant navigasyon/yoğunluk tercihini config-driven ayarlar (`if module` yasak) (`09` §6) | KISMİ (`layout` VAR; tenant-config YENİ) |
| c12n (field visibility) | `elements[]` + `tenant_settings` görünürlük | Tenant opsiyonel alan görünürlüğünü ayarlar (sunum); yetki-gizleme PDP'de ayrı enforce (`09` §7) | KISMİ (`elements` VAR; görünürlük-config YENİ) |
| UX (state sözleşmesi: empty) | `emptyState` prop beyanı (§10) | Boş-durum: neden boş + afordans + yönlendirici metin (`surface-v2-directive §10`, `ux-interaction`) | YENİ |
| UX (state sözleşmesi: loading) | `loadingMode` prop (`skeleton`/`spinner`) | Yükleniyor: skeleton/ilerleme; içerik-kayması yok (CLS korunur) | YENİ |
| UX (state sözleşmesi: error) | `onRetry` + `errorText` (renk-bağımsız) | Hata: ne oldu + yeniden-deneme yolu; metinsel, yalnız renkle değil | YENİ |
| UX (state sözleşmesi: optimistic) | TanStack Query mutation + `rollback` | İyimser-güncelleme: aksiyon sonucu beklemeden ekranda; başarısızsa geri-al | YENİ |
| UX (etkileşim: reduced-motion) | `a11y` + `motion` token | `prefers-reduced-motion` onurlanır; onaysız otomatik hareket yasak (`uxi-reduced-motion`) | YENİ |
| GUI (bileşen/etkileşim yüzeyi) | `SurfaceContractSchema` (tümü) + `layout` | Radix + tasarım-token'lı yüzey; UI standart kapısı (`ui-components`+`ux-interaction`) yeşil | VAR |

---

## 3. SURFACE-Dışı Numeronym Standartları (Kernel/Archetype Katmanında)

Aşağıdaki standartlar SURFACE katmanında *tanımlanmaz*; kimlik/yetki/gözlemlenebilirlik/veri-kanonikleştirme kernel veya archetype katmanının sorumluluğudur. SURFACE onları tüketir (ör. `permissions` ile PDP'ye danışır) veya tetikler (ör. aksiyon audit üretir) ama kural değerini yüzey alanına gömmez. Bu ayrım kritiktir: bir güvenlik kapısı yüzeyde "gizleme" olarak taklit edilirse gerçek koruma kaybolur (`09-c12n/p13n` §10 güvenlik invariantı).

| Standart | Surface alanı/tipi | Nasıl | Durum |
|---|---|---|---|
| o11y (observability) | Kernel/archetype katmanında | SURFACE aksiyonu `audit_events` üretir; structured log + trace_id kernel'de yayılır; yüzey yalnız *tetikler* (`08-observability` standardı) | Kernel — SURFACE tüketir |
| AuthN (authentication) | Kernel/archetype katmanında | Kimlik doğrulama IAM/AuthN katmanında; SURFACE auth-context'i okur, oturumu kendisi kurmaz (`03-authn-authz-iam`) | Kernel — SURFACE tüketir |
| AuthZ / PDP (authorization) | Kernel — SURFACE `permissions[]` ile danışır | Yetki backend PDP'de enforce edilir; `permissions` alanı yüzeye erişimi kapılar; field visibility (c12n) yetki-gizleme *değildir* (`04-rbac-abac`, `09` §7) | Kernel — SURFACE `permissions` VAR |
| c13n (canonicalization) | Kernel/archetype katmanında | Slug/URL/email/NFC normalize archetype/data katmanında; SURFACE normalize-edilmiş veriyi *gösterir*, kuralı taşımaz (`05-c13n`) | Archetype/data katmanı |
| n6n (normalization) | Kernel/archetype katmanında | E.164/SKU normalize + 3NF şema archetype/data katmanında; SURFACE form-doğrulama (Zod) ile *yansıtır* ama şema kuralını tanımlamaz (`06-data-normalization`) | Archetype/data katmanı |
| i14y (interoperability) | Kernel/archetype katmanında | Webhook/idempotency/SDK-hazırlık API/archetype katmanında; SURFACE tükettiği veriyi çizer, kontratı üretmez (`07-api-interoperability`) | Archetype/API katmanı |
| RBAC / ABAC | Kernel/archetype katmanında | Rol→izin ve attribute-tabanlı karar PDP/IAM'de; SURFACE `permissions[]` ile sonucu tüketir | Kernel — SURFACE tüketir |
| Mode-Profile (B2B/B2C…) | Kernel — SURFACE `renderStrategy` ile mode-aware | İş-modeli geçişi `k-mode` primitifinde (config-driven, `if b2b else` yasak); SURFACE aktif capability setini *okur* (`09` §4) | Kernel — SURFACE okur |
| Capability/Entitlement | Kernel — SURFACE aksiyon/veri kapısı | "Bu yetenek var mı?" `k-capability`'de; SURFACE aksiyonu yeteneksiz açılmaz (`09` §4) | Kernel — SURFACE tüketir |

---

## 4. AI-Surface Guardrail Bağı (Çapraz-Kesen)

`aiSurface` bloğu bir numeronym standardı değildir ama SURFACE'in AI-güvenlik sınırını taşır ve yukarıdaki kernel-katmanı kurallarıyla hizalıdır. Bir AI-yüzey (`nl-query`, `generative-view`, `assistant`, `command-palette`) `aiSurface.pdpGated: true` olmadan validasyondan geçemez; AI ürettiği sorguyu PDP izin-simülasyonundan geçirir (AuthZ kernel'de enforce). AI en fazla `draft`/`preview` üretir, üretim ayarını (mode publish, capability, PDP policy, tenant tema-override) değiştiremez — bu `09-c12n/p13n` §14 AI-guardrail ve `surface-v2-directive §7` ile aynı sınırdır.

| Alan | Nasıl | Durum |
|---|---|---|
| `aiSurface.kind` | AI-yüzey türü (opsiyonel; yoksa AI-yüzey değil) | YENİ |
| `aiSurface.pdpGated` | Zorunlu `true`; PDP izin-simülasyonu olmadan veri/aksiyon yok (AuthZ tüketimi) | YENİ |
| `aiSurface.humanApproval` | AI önerisi insan onayı olmadan uygulanmaz (öneri→önizleme→onay) | YENİ |

---

## 5. SURFACE Katmanı Numeronym Kapsama Özeti

Bu bölüm hangi numeronym'in SURFACE katmanında birinci-sınıf karşılandığını, hangisinin kernel/archetype'ta yaşayıp SURFACE tarafından tüketildiğini özetler.

SURFACE katmanı **beş numeronym standardını** birinci-sınıf alan olarak karşılar: **a11y** (`a11y.wcag`+`keyboardNav`+`textStatus`+`wcagAspirational`), **i18n/l10n/RTL/t9n** (`i18n{locales,defaultLocale,rtl,messagesRef}`), **p13n** (per-user saved-view + dashboard; user-scoped), **c12n** (tenant tema-token + layout + field-visibility; tenant-scoped) ve **UX** (empty/loading/error/optimistic state sözleşmesi + reduced-motion). Bunların çoğu (`i18n`, `wcagAspirational`, `perf`, `aiSurface`, state prop'ları) `surface-v2-directive §6` ile YENİ eklenir; `a11y` çekirdeği ve `layout`/`elements`/`permissions` zaten VAR.

SURFACE katmanı **dokuz standardı** *tanımlamaz*, yalnız tüketir veya tetikler: **o11y** (audit tetikler), **AuthN/AuthZ/RBAC/ABAC** (`permissions[]` ile PDP'ye danışır), **c13n/n6n** (normalize-edilmiş veriyi gösterir), **i14y** (API kontratını tüketir), **Mode-Profile/Capability** (aktif seti okur). Bu ayrımın kuralı `renderStrategy: custom` yüzeylerde de geçerlidir: custom yüzey jenerik render'dan kaçar ama `permissions`+`a11y`+`i18n`+audit yönetişiminden kaçamaz — "jenerik render'dan kaçmak, yönetişimden kaçmak değildir" (`surface-v2-directive §5`).

Kritik izolasyon ayrımı: **p13n** (kullanıcı-seviyesi; tercih başka kullanıcıya sızmaz) ile **c12n** (tenant-seviyesi; ayar tüm tenant kullanıcılarını etkiler) farklı eksenlerdir; çözüm sırası `system default → tenant (c12n) → user (p13n)` deterministiktir ve tenant kilidi p13n'i ezebilir (`09` §2-3). SURFACE bu iki ekseni ayrı alanlarda (`user_*` vs `tenant_*` depolama) taşır; karıştırılırsa veri sızıntısı doğar.

---

## 6. Her SURFACE Tipinde Zorunlu Beyan (a11y + i18n)

Global ürün için i18n ve a11y pazarlık konusu değildir; **her SURFACE tipi** (22 tipin tamamı: 8 admin + 8 consumer + 6 shop) — `renderStrategy` `projected` veya `custom` olsun — aşağıdaki iki beyanı zorunlu taşır. Bu, `check-surface` CI kapısının blokladığı bir invariant'tır.

Aşağıdaki tablo iki zorunlu beyanı ve CI'nın nasıl doğruladığını verir.

| Zorunlu beyan | Alan | CI doğrulaması | Kaynak |
|---|---|---|---|
| a11y taban (WCAG 2.2 AA) | `a11y.wcag` (varsayılan `2.2-AA`) | axe + Playwright AA ihlalini bloklar; `wcagAspirational` AAA'yı raporlar (bloklamaz) | `surface-v2-directive §8`, `02-a11y` §12 |
| i18n beyanı | `i18n{locales,defaultLocale,rtl,messagesRef}` | pseudo-localization taşan/kırılan yüzeyi yakalar; `rtl: auto` locale'den doğru türer; `messagesRef` tek-kaynak çeviriye bağlanır | `surface-v2-directive §9`, `01-i18n` standardı |

İki ek zorunluluk tip-ailesine göre koşulludur: **Consumer + Shop** yüzeyleri ayrıca `perf.cwvBudget` (Core Web Vitals: LCP ≤ 2500ms, INP ≤ 200ms, CLS ≤ 0.1) beyan etmeden merge edilemez; **AI-yüzeyler** (`aiSurface` tanımlı) `pdpGated: true` olmadan validasyondan geçemez. WebGL/WebRTC yüzeyleri (`map-live`, `media-room`) için erişilebilir eşdeğer (tablo/metin) zorunludur; Shop yüzeyleri için endüstriyel HMI profili (kontrast AA-üstü, ~64px dokunma hedefi, renk-körü-güvenli andon) `factoryContext` ile beyan edilir.

Özetle: **a11y ve i18n her yüzeyde zorunlu tabandır** (tip veya render stratejisi fark etmez); perf-bütçesi tüketici/üretim yüzeyinde, PDP-kapısı AI-yüzeyde ek zorunluluktur. Custom yüzey bu beyanların hiçbirinden muaf değildir — yönetişim custom'a da uygulanır.

---

*Bağlı dokümanlar: `docs/standards/numeronym-siniflandirma.md` (7-aile sınıflandırma) · `src/schemas/surface.ts` (şema hedefi) · `docs/surface-v2-directive.md` (§6 şema, §8 a11y, §9 i18n, §10 state) · `docs/surface-spec.md` (kanonik spec) · `docs/standards/02-a11y-accessibility-standard.md` · `docs/standards/09-customization-personalization-standard.md` · `docs/standards/01-i18n-l10n-g11n-standard.md` · `docs/standards/08-observability-standard.md` · `docs/ci-conformance-gates.md` (`check-surface` kapısı). Bağlı düğümler: `k-surface`, `k-surface-consumer`, `k-capability`, `k-mode`, `k-policy-pdp`.*
