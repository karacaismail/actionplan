# Enterprise SaaS — Phase 5G UX/Globalization/Accessibility Candidate Completeness Matrix

**Rol:** Claude SLAVE worker. Codex MASTER + nihai otorite.
**Faz:** 5G (UX/globalization/accessibility candidate completeness). Faz 4.5 D2 (ilk aile Commerce OS + Türkiye ticaret ICP) + D4 (ilk jurisdiction Türkiye + counsel gate) + D5 (Controlled Paid Enterprise Pilot; **accessibility/localization baseline** + support runbook zorunlu evidence-control) CLOSED çerçevesinde açıldı ([`ledger`](./enterprise-saas-human-decision-queue.md) §Newly closed decisions). Bu **onaylanabilir candidate set / domain-completeness** dokümanıdır; requirement/backlog/node/app/module/queue/schema/gate/kod/test/UI-component DEĞİL ([`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) Faz 5).
**Tarih:** 2026-07-13 · **Durum:** ÖNERİ — Codex bağımsız doğrulamadan tamamlanmış sayılmaz.

> Bu belge **aday tamlık matrisidir** (UX/globalization/accessibility yüzeyi), requirement listesi/backlog/storefront-metni/UI-bileşeni/schema değildir. **Kritik invariant:** jenerik UX/etkileşim primitifi, i18n/l10n çeviri deposu + fallback + locale çözümleme, `k-jurisdiction` 6-eksen (locale≠jurisdiction≠currency≠tax≠timezone≠residency) primitifi, generic notification delivery, accessibility gate/observability/support runbook **platform/kernel owned**'dır; Commerce OS **core 7 BC** yalnız **domain journey/persona akışını, domain surface projeksiyonunu, domain hata/onboarding semantiğini, domain notification event/tercih semantiğini ve jurisdiction pack seçimini** tanımlar — jenerik UX/i18n/notification/accessibility **primitifini tanımlamaz/sahiplenmez**, **tüketir** ([`ledger`](./enterprise-saas-human-decision-queue.md) D3 "localization/integration/generic notification = platform"; [`composition`](./enterprise-saas-product-family-composition.md) §Shared versus owned matrix; [`i18n-standard`](./i18n-standard.md); [`surface-spec`](./surface-spec.md)). **Türkiye jurisdiction pack ve legal/content metni counsel (`validationAuthority`) onayı olmadan `validated` OLAMAZ; bu belge hukuki uyum ispatı değildir** (D4). **UI redesign / component kit / storefront implementation üretilmez; frontend HEADLESS kilidi** ([`../AGENTS.md`](../AGENTS.md) §4.1/§4.2; [`adr-0026`](./adr-0026-tech-profiles.md); [`a11y-pack`](./platform-w3-03-enterprise-accessibility-gates-agent-pack-2026-07-09.md) §Non-Goal). Owner/authority belirsizse satır `unresolved`; counsel/baseline gerektiren satır (jurisdiction pack · legal text · a11y baseline · l10n baseline) `passed`/`validated` işaretlenemez. **Enterprise-ready/GA iddiası yok** (D5). Hiçbir provider/vendor adı requirement DEĞİLDİR ([`ontology`](./enterprise-saas-capability-ontology.md) §provider). Hiçbir aday app/module/BC düğümüne terfi ETMEZ ([`../AGENTS.md`](../AGENTS.md) §4.4).

## Execution record

Task/sub-agent mekanizması bu ortamda **MEVCUT DEĞİL** (yalnız Bash/Read/Grep/Glob/Edit). Bu nedenle **2 iş SIRALI** yürütüldü; **paralellik/sub-agent iddiası yok**. Tek yazar/entegrasyon adımı yalnız bu dosyadır.

- Yürütülen iş sayısı: **2/2** · Mod: **sequential (mechanism unavailable)** · READ-ONLY analiz + tek yazar.
- Girdi/HEAD: branch `codex/enterprise-saas-requirements-2026-07-13`; okunan kanon (salt-okunur) [`../AGENTS.md`](../AGENTS.md), [`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md), [`oracles`](./enterprise-saas-phase-5-11-acceptance-oracles.md), [`ledger`](./enterprise-saas-human-decision-queue.md) (D2/D4/D5), [`composition`](./enterprise-saas-product-family-composition.md), [`constitution`](./enterprise-saas-requirement-constitution.md), [`ontology`](./enterprise-saas-capability-ontology.md), [`i18n-standard`](./i18n-standard.md), [`surface-spec`](./surface-spec.md), [`surface-v2`](./surface-v2-directive.md), [`a11y-pack`](./platform-w3-03-enterprise-accessibility-gates-agent-pack-2026-07-09.md), [`adr-0026`](./adr-0026-tech-profiles.md), [`adr-0030`](./adr-0030-commerce-operating-system-boundary.md), [`core-contract-pack`](./core-contract-pack.md), [`bc-map`](./commerce-os-bounded-context-map.md), [`support-runbooks`](./deploy-separation-runbooks.md), [`entitlement`](./capability-entitlement-contract.md).

| # | İş | Tür | Kapsam | Yerleştiği bölüm |
|---|---|---|---|---|
| A5G | UX/globalization/accessibility analyst | analyst | 12 aday: ICP journey/persona, operator workbench surface, error/exception UX, learnability/onboarding, l10n/çeviri iş akışı, timezone/currency/address/phone/calendar primitifi, Türkiye jurisdiction pack, WCAG/accessibility baseline, responsive/headless channel surface, notification preference/consent, supportability/diagnostics, content/legal text versioning | Candidate completeness matrix |
| V5G | UX/globalization/accessibility reviewer | reviewer | authority/dedup/fold, platform jenerik UX/i18n/notification/a11y primitif owner vs Commerce OS domain journey/surface tüketici, 2 zorunlu baseline oracle (accessibility · localization), counsel-gated jurisdiction/legal satır, provisional BC re-pass/demote, ambiguous→unresolved, no vendor-as-requirement, no UI-component/storefront, no GA claim, no cross-write, no module promotion, link/field/claim | Commerce OS journey and surface profile · Red to green checks |

Sıra: **A5G → V5G** (sıralı, aynı dosya). İki iş de aynı tek dosyaya yazdı; başka lane'e paralel yazım yok.

## Lane boundary

- **scope:** UX/globalization/accessibility yüzeyinin candidate completeness'ı — platform jenerik UX/etkileşim, i18n/l10n, `k-jurisdiction` 6-eksen, generic notification delivery, accessibility gate/support runbook **primitifinin** authority sınırı ve Commerce OS core-7-BC'nin **domain journey/persona + domain surface + domain hata/onboarding/notification semantiği + jurisdiction pack seçimi** rolü. owner/authority/lifecycle/riskTier/testOracle belirsizse `unresolved`; counsel/baseline gerektiren satır (jurisdiction pack/legal text/a11y baseline/l10n baseline) `passed`/`validated` olamaz.
- **inputs:** yukarıdaki kanon; D2 Commerce OS+Türkiye ICP + D4 Türkiye jurisdiction/counsel gate + D5 Pilot accessibility/localization baseline & support runbook **bağlayıcı insan kararı** ([`ledger`](./enterprise-saas-human-decision-queue.md)).
- **allowed-files:** yalnız `docs/enterprise-saas-phase-5g-ux-globalization-accessibility-candidates.md`. Başka dosya, JSON/node/schema/gate/kod/test/UI yok.
- **non-goals:** requirement/backlog/module/app üretmek; jenerik UX/i18n/`k-jurisdiction`/notification/accessibility **primitifini** yeniden yazmak veya Commerce OS-owned yapmak; `i18n-standard`/`surface-spec`/`a11y-pack` sözleşme metnini **kopyalamak**; **UI redesign / component kit / storefront implementation / wireframe** üretmek (headless kilidi); provider/vendor adını **requirement** yapmak; Türkiye jurisdiction pack veya legal/content metnini **counsel-onaylı/uyumlu** saymak; a11y/l10n baseline'ı **koşulmuş/`validated`** saymak; concrete persona/journey/locale/format **uydurmak**; module terfisi; cross-context write.
- **checks:** §Red to green checks (deterministik metin/link taraması; otomatik gate yoksa `MANUAL/CHANGESET`).
- **output:** ≥10 aday satır + **2 zorunlu baseline oracle** (accessibility · localization) + counsel-gated jurisdiction/legal satır + Commerce OS journey/surface profili + provisional BC re-pass/demote + red/green.
- **blockers:** Türkiye jurisdiction pack/regulated-format authority (Commerce OS domain config vs platform `k-jurisdiction`) + counsel; content/legal text versioning owner (platform content vs Commerce OS legal) + counsel; consumer channel/storefront surface owner (headless surface vs domain) — contract'ta net owner/lifecycle yok → `unresolved` (blocker alanında).

## Candidate completeness matrix

Alan sözleşmesi (her aday): `candidateId · outcome · owner · dataAuthority · lifecycleAuthority · scopeClass · riskTier · testOracle · evidenceExpected · status · blocker` ([`constitution`](./enterprise-saas-requirement-constitution.md) §Candidate record contract). scopeClass 14-sınıf sözlüğü [`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) §1. Bir alan çözülemezse satır `unresolved` + `blocker`. UX/i18n/notification/accessibility primitifleri owner=platform/kernel; Commerce OS domain kaydı journey/surface/semantik tanımlar fakat primitifi **tüketir**, kopyalamaz.

| candidateId | scopeClass | riskTier | status |
|---|---|---|---|
| `C-5G-01-icp-journey-persona` | workflow | high | candidate |
| `C-5G-02-operator-workbench-surface` | reporting surface | high | candidate |
| `C-5G-03-error-exception-ux` | feature | medium | candidate |
| `C-5G-04-learnability-onboarding` | feature | medium | candidate |
| `C-5G-05-localization-translation-workflow` | platform capability (consumed) | high | candidate |
| `C-5G-06-locale-primitives-tz-currency-address-phone-calendar` | platform capability (consumed) | high | candidate |
| `C-5G-07-turkey-jurisdiction-pack` | configuration/edition | critical | unresolved |
| `C-5G-08-wcag-accessibility-baseline` | NFR | high | candidate |
| `C-5G-09-responsive-headless-channel-surface` | policy | medium | unresolved |
| `C-5G-10-notification-preference-consent` | platform capability (consumed) | medium | candidate |
| `C-5G-11-supportability-diagnostics` | platform capability (consumed) | medium | unresolved |
| `C-5G-12-content-legal-text-versioning` | policy | high | unresolved |

Detaylı alanlar (aynı authority'yi referansla, kopyalamaz):

**`C-5G-01-icp-journey-persona`**
- outcome: Commerce OS ICP persona/journey kataloğu: birincil kullanıcılar (commerce ops · catalog ops · marketplace ops · product/platform · entegrasyon geliştiricisi) ve JTBD akışı (katalog→fiyat→checkout→order→fulfillment→marketplace) **domain journey** olarak tanımlanır; persona/journey Commerce OS domain, render primitifi platform ([`ledger`](./enterprise-saas-human-decision-queue.md) D2; [`bc-map`](./commerce-os-bounded-context-map.md)). Concrete persona/journey discovery ile doğrulanır, uydurulmaz.
- owner: Commerce OS domain (journey/persona) · dataAuthority: Commerce OS domain journey kaydı · lifecycleAuthority: journey/persona kontrat lifecycle (product, insan-onaylı)
- testOracle: contract — her journey tanımlı persona + JTBD outcome taşır; personasız/outcome'suz journey `validated` olamaz; journey ICP dışı persona icat etmez (MANUAL) · evidenceExpected: persona/journey matrisi + ≥5 discovery sinyali ([`ledger`](./enterprise-saas-human-decision-queue.md) D2 residual)
- blocker: yok (ICP D2 CLOSED); item-level persona/journey discovery residual, uydurulmaz.

**`C-5G-02-operator-workbench-surface`**
- outcome: Operator/ops workbench domain surface projeksiyonu (list/detail/form/board/dashboard) `SurfaceContract` üzerinden; surface ArcheType'tan ayrı versiyonlanır, iş mantığı taşımaz, jenerik render primitifi platform ([`surface-spec`](./surface-spec.md) §1/§2; [`surface-v2`](./surface-v2-directive.md)). Commerce OS domain surface objesini tanımlar, panel primitifini **tüketir**.
- owner: Commerce OS domain surface (projeksiyon) + platform surface/render runtime · dataAuthority: platform SurfaceContract/render + Commerce OS domain kayıt · lifecycleAuthority: surface kontrat lifecycle (ArcheType'tan ayrı)
- testOracle: contract — domain surface `SurfaceContract` şemasına uyar (elements/actions/permissions/a11y); serbest UI/bespoke bileşen üretmez; permission'sız surface `validated` olamaz (MANUAL) · evidenceExpected: surface kontrat + permission/a11y alan denetimi
- blocker: yok (surface primitifi=platform, domain projeksiyon=Commerce OS); concrete workbench layout uydurulmaz, UI-component yaratılmaz.

**`C-5G-03-error-exception-ux`**
- outcome: Hata/istisna deneyimi: domain hatası kullanıcıya anlamlı, locale-farkında, aksiyon-önerili mesaja çevrilir; sessiz yutma yok; teknik/PII sızıntısı yok. Etkileşim/mesaj primitifi platform (ux-interaction), domain hata **semantiği** Commerce OS ([`../AGENTS.md`](../AGENTS.md) §Altın Kural referans; [`i18n-standard`](./i18n-standard.md) §3.1 ham-metin yasak).
- owner: platform UX/etkileşim primitifi + Commerce OS domain hata semantiği · dataAuthority: platform mesaj/i18n katalog + Commerce OS domain hata kodu · lifecycleAuthority: hata sözleşme lifecycle
- testOracle: contract/negative — domain hatası ham anahtar/stack/PII göstermez; her hata locale-çözümlü mesaj + kurtarma yolu taşır; sessiz yutma RED (MANUAL) · evidenceExpected: hata-mesaj katalog + PII/ham-metin taraması
- blocker: yok (mesaj primitifi=platform); item-level hata taksonomisi residual.

**`C-5G-04-learnability-onboarding`**
- outcome: Öğrenilebilirlik/onboarding: ilk-kullanım domain akışı (empty-state, rehberli kurulum, progressive disclosure) domain journey olarak; jenerik tur/checklist primitifi platform, domain adımlar Commerce OS. Erişilebilir + locale-farkında olmalı.
- owner: Commerce OS domain onboarding akışı + platform UX primitifi · dataAuthority: Commerce OS domain onboarding kaydı · lifecycleAuthority: onboarding journey lifecycle
- testOracle: contract — onboarding akışı klavye-erişilebilir + locale-çözümlü + kill/skip yolu taşır; erişilemez/hardcoded adım `validated` olamaz (MANUAL) · evidenceExpected: onboarding journey + a11y/l10n smoke
- blocker: yok; concrete onboarding içeriği discovery residual, uydurulmaz.

**`C-5G-05-localization-translation-workflow`**
- outcome: l10n/çeviri iş akışı: ham (hardcoded) metin yasak, ICU MessageFormat çoğul/cinsiyet, eksik anahtarda fallback (ham anahtar asla gösterilmez), taslak→inceleme→yayın; **AI çeviri önerir, insan onaylar, motor yayınlar** — makine-çevirisi doğrudan yayınlanmaz ([`i18n-standard`](./i18n-standard.md) §1/§3). Çeviri deposu/fallback/locale-çözümleme primitifi platform; Commerce OS domain çevrilebilir alanı beyan eder.
- owner: platform i18n/l10n runtime (`s-i18n`/`cc-i18n-standards`) · dataAuthority: platform çeviri deposu + locale-context · lifecycleAuthority: çeviri iş akışı lifecycle (insan-onaylı yayın)
- testOracle: **zorunlu — localization baseline:** ham kullanıcı metni taraması boş; eksik anahtar fallback verir, ham anahtar göstermez; ICU çoğul/cinsiyet doğru; pseudo-localization testi geçer ([`i18n-standard`](./i18n-standard.md) §3/§4; [`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) Faz 8 accessibility/i18n) · evidenceExpected: `check-i18n`-eş metin taraması + fallback + pseudo-loc raporu
- blocker: yok (i18n primitifi=platform authority, D3); baseline **koşulmadı** — Codex residual, `validated` uydurulmaz.

**`C-5G-06-locale-primitives-tz-currency-address-phone-calendar`**
- outcome: Locale primitifleri: timezone (naive datetime yasak), currency/Money (FX snapshot), address/phone (bölge-formatı), calendar (CLDR biçimleme); **Locale≠Jurisdiction≠Currency≠Tax≠Timezone≠Residency ortogonal**, biri diğerinden türetilmez; `k-jurisdiction` 6-eksen ile çözülür ([`i18n-standard`](./i18n-standard.md) §3.2/§3.5; [`core-contract-pack`](./core-contract-pack.md) §jurisdiction). Primitif platform; domain kaydı tüketir.
- owner: platform `k-jurisdiction` 6-eksen + CLDR/Money primitifi · dataAuthority: platform locale/jurisdiction primitif store · lifecycleAuthority: jurisdiction/locale primitif lifecycle
- testOracle: contract — tarih/sayı/para/adres/telefon locale-farkında biçimlenir; naive datetime/sabit format RED; jurisdiction eksenlerinden biri diğerinden türetilirse RED (MANUAL) · evidenceExpected: CLDR biçimleme + ortogonal-eksen testi
- blocker: yok (jurisdiction primitifi=platform); concrete TR format değerleri C-5G-07 counsel scope'una bağlı, burada uydurulmaz.

**`C-5G-07-turkey-jurisdiction-pack`**
- outcome: Türkiye jurisdiction pack: TR locale/currency(TRY)/timezone/adres/telefon/vergi-kimliği/legal-format seçimi ve regulated-format sınırı (düzenlenmiş e-fatura/e-belge delivery **lisanslı sağlayıcı**, Commerce OS orchestration/policy/snapshot). Pack **hukuki uyum ispatı DEĞİL**; Türkiye-yetkili counsel zorunlu pre-sale gate ([`ledger`](./enterprise-saas-human-decision-queue.md) D4; [`adr-0030`](./adr-0030-commerce-operating-system-boundary.md) §7). Pack content authority (Commerce OS domain config vs platform `k-jurisdiction`) net değil.
- owner: Commerce OS domain jurisdiction seçimi + platform `k-jurisdiction` primitifi · dataAuthority: **belirsiz** — jurisdiction pack/regulated-format authority net değil · lifecycleAuthority: **belirsiz** · validationAuthority: **Türkiye counsel (zorunlu)**
- testOracle: **jurisdiction / regulated-role drift:** Commerce OS regulated execution (tax filing/e-doc/e-sign/KYC) üstlenmez, yalnız orchestration/policy/snapshot; jurisdiction pack counsel onayı olmadan `validated` OLAMAZ ([`oracles`](./enterprise-saas-phase-5-11-acceptance-oracles.md) §probe 12) · evidenceExpected: regulated-action sınır tablosu + counsel inceleme kaydı
- blocker: **pack/regulated-format authority + counsel** çözülmedi → `unresolved`; concrete TR format/mevzuat **uydurulmaz**, counsel `passed` işaretlenmez.

**`C-5G-08-wcag-accessibility-baseline`**
- outcome: Accessibility baseline: WCAG 2.2 (AGENTS AAA hedefi — kontrast, tam klavye, görünür odak, ≥44px dokunma), domain route'ları axe-core ihlal raporu + keyboard/focus-order + contrast/token uyumu; a11y gate kırmızıysa fail-closed ([`../AGENTS.md`](../AGENTS.md) §4.2; [`a11y-pack`](./platform-w3-03-enterprise-accessibility-gates-agent-pack-2026-07-09.md) §Amaç; [`surface-spec`](./surface-spec.md) `a11y`). Gate/primitif platform; domain surface conformance'ı **tüketir**.
- owner: platform accessibility gate (`check-ui-standards`/axe e2e) + Commerce OS domain surface conformance · dataAuthority: platform a11y gate/rapor · lifecycleAuthority: a11y gate lifecycle
- testOracle: **zorunlu — accessibility baseline:** domain route axe ihlal 0 (kritik); tam klavye + görünür odak + kontrast eşiği; ihlalde PR fail-closed, skip/waiver ile sahte-yeşil RED ([`a11y-pack`](./platform-w3-03-enterprise-accessibility-gates-agent-pack-2026-07-09.md) §Non-Goal; [`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) Faz 8) · evidenceExpected: axe raporu + keyboard/focus + contrast raporu
- blocker: yok (a11y gate=platform authority, D5 baseline); baseline **koşulmadı** — Codex residual, `validated`/`passed` uydurulmaz; UI redesign yapılmaz.

**`C-5G-09-responsive-headless-channel-surface`**
- outcome: Responsive + **headless** channel surface politikası: ürün frontend headless (Radix + React Aria, SCSS+token), stillenmiş kit/storefront ürüne giremez; SDUI domain surface çok-kanal (ekran/mobil) responsive; consumer/storefront surface owner (headless surface primitifi vs domain) net değil ([`../AGENTS.md`](../AGENTS.md) §4.1; [`adr-0026`](./adr-0026-tech-profiles.md); [`surface-spec`](./surface-spec.md) §1). Bu belge **UI implementasyonu üretmez**.
- owner: platform headless surface tech-profile + Commerce OS domain surface projeksiyonu · dataAuthority: platform surface/tech-profile + Commerce OS domain kayıt · lifecycleAuthority: surface/tech-profile lifecycle
- testOracle: contract — surface responsive + headless kilidine uyar (yasak paket yok, SCSS+token, Roboto/Phosphor, emoji yok); stillenmiş kit/storefront implementation RED (MANUAL/`check-tech-profile`) · evidenceExpected: tech-profile + dependency-policy denetimi
- blocker: **consumer/storefront surface owner + bağımsız kanal-policy** contract'ta tekil değil → `unresolved`; headless kilidi policy'si nettir (platform) fakat kanal-surface BC-hood'u kanıtsız; concrete storefront/layout **uydurulmaz/üretilmez**.

**`C-5G-10-notification-preference-consent`**
- outcome: Notification tercih/consent: kullanıcı/tenant kanal tercihi (email/SMS/push), opt-in/opt-out, KVKK-uyumlu consent kaydı; **generic notification delivery + preference primitifi platform**, domain notification **event/tetikleyici semantiği** Commerce OS ([`ledger`](./enterprise-saas-human-decision-queue.md) D3 "generic notification delivery=platform"). Delivery execution provider (comms) — canonical değil, vendor requirement değil.
- owner: platform notification delivery/preference runtime + Commerce OS domain event semantiği · dataAuthority: platform preference/consent store · lifecycleAuthority: preference/consent lifecycle
- testOracle: contract/negative — opt-out sonrası kanal teslimi yapılmaz; consent'siz pazarlama bildirimi RED; tercih tenant-scoped, cross-tenant sızmaz (MANUAL) · evidenceExpected: preference/opt-out + consent-audit testi
- blocker: yok (notification primitifi=platform authority, D3); item-level domain event eşlemesi residual.

**`C-5G-11-supportability-diagnostics`**
- outcome: Supportability/diagnostics: support runbook (D5 evidence-control), kullanıcı-yüzeyli tanılama (correlation-id, durum sayfası, self-diagnostic), PII-masking log; support/observability primitifi platform (5E ile hizalı), Commerce OS domain runbook'u **tüketir** ([`ledger`](./enterprise-saas-human-decision-queue.md) D5 "support runbook"; [`support-runbooks`](./deploy-separation-runbooks.md)).
- owner: platform observability/support runtime + Commerce OS domain support runbook; **kullanıcı-yüzeyli tanı read-scope owner = 5E `C-5E-09` ile ortak ve `unresolved`** · dataAuthority: **belirsiz** — diagnostic read-scope authority 5E `C-5E-09` ile hizalı, tekil değil · lifecycleAuthority: **belirsiz**
- testOracle: contract — kullanıcı hatası correlation-id yüzeye taşır, support runbook adımı çözülür; diagnostic log PII maskeler (MANUAL) · evidenceExpected: support runbook + correlation-id/PII-masking smoke
- blocker: **diagnostic veri-erişim read-scope + owner** 5E `C-5E-09` ile aynı şekilde contract'ta tekil değil → authority uniquely-statable olmadığı için `unresolved`; support runbook/correlation-id/PII-masking primitifi platform (tüketilir) fakat cross-tenant tanı görünürlüğü scope'u **uydurulmaz**.

**`C-5G-12-content-legal-text-versioning`**
- outcome: Content/legal text versiyonlama: ToS/gizlilik/KVKK aydınlatma/legal metin sürümlenir, kabul (acceptance) izli, locale-farkında, geriye-dönük denetlenebilir; legal metin **counsel onayı** ister. Authority (platform content mgmt vs Commerce OS legal domain) + counsel scope net değil ([`ledger`](./enterprise-saas-human-decision-queue.md) D4 counsel; [`i18n-standard`](./i18n-standard.md) §6 hukuki yerelleştirme).
- owner: platform content/versiyon primitifi + Commerce OS/legal domain metin · dataAuthority: **belirsiz** — legal text versioning authority net değil · lifecycleAuthority: **belirsiz** · validationAuthority: **counsel (zorunlu)**
- testOracle: contract — legal metin değişimi yeni sürüm + acceptance izi + counsel onayı olmadan yayınlanamaz; onaysız metin `validated` olamaz (MANUAL) · evidenceExpected: versiyon/acceptance izi + counsel onay kaydı
- blocker: **legal text versioning authority + counsel** çözülmedi → `unresolved`; concrete legal metin **uydurulmaz**, counsel `passed` işaretlenmez.

## Commerce OS journey and surface profile

- **Commerce OS owns (domain):** ICP persona/journey akışı, domain surface projeksiyonu (`SurfaceContract` objesi), domain hata/onboarding semantiği, domain notification **event/tetikleyici**, jurisdiction pack **seçimi**, legal metin **domain'i** — hepsi core-7-BC otoritesi içinde, tek-writer ([`composition`](./enterprise-saas-product-family-composition.md) §Shared versus owned matrix; [`bc-map`](./commerce-os-bounded-context-map.md)).
- **Platform/kernel owns (consumed):** jenerik UX/etkileşim primitifi, surface/SDUI render runtime, i18n/l10n çeviri deposu+fallback+locale çözümleme, `k-jurisdiction` 6-eksen + CLDR/Money, generic notification delivery/preference, accessibility gate/observability/support runtime — Commerce OS bunları **tüketir**, yeniden yazmaz/kopyalamaz ([`ledger`](./enterprise-saas-human-decision-queue.md) D3; [`i18n-standard`](./i18n-standard.md); [`surface-spec`](./surface-spec.md)).
- **Provisional BC re-pass/demote (UX lensi):** UX/surface lensinden provisional BC'ler tekil `owner`/`dataAuthority`/`lifecycleAuthority`/independent-policy testine sokuldu; surface/journey **BC değil**, platform render + domain projeksiyon tüketimidir ([`composition`](./enterprise-saas-product-family-composition.md) §Commerce OS Card).

| Provisional BC (UX lensi) | Independent-policy testi | Sonuç |
|---|---|---|
| Channel* | Consumer/storefront surface ayrı BC mi, yoksa headless surface primitifi + domain projeksiyon tüketimi mi? | Surface yüzeyi → **DEMOTE** platform headless surface + domain projeksiyon; bağımsız kanal-policy kanıtsız → `unresolved` (C-5G-09) |
| Service* | Support/helpdesk journey ayrı BC mi, yoksa support runbook + domain journey tüketimi mi? | Support yüzeyi → **DEMOTE** platform support/observability + domain runbook; bağımsız service-policy 5E cross-ref, fold DEĞİL |
| Compliance* | Jurisdiction/legal text ayrı BC mi, yoksa `k-jurisdiction` + counsel-gated domain config mi? | Jurisdiction/legal yüzeyi → **DEMOTE** platform `k-jurisdiction`; counsel-gated pack/legal `unresolved` (C-5G-07/12), module açılmaz |

Sonuç: UX/globalization/accessibility lensinde **hiçbir provisional BC yeni module/BC düğümü açmaz**; surface/journey/jurisdiction yüzeyi platform primitifine demote edilir, domain-policy yüzeyi owning lane'e cross-ref edilir. Bağımsız-policy/counsel kanıtı olmayan kalemler `unresolved` bırakılır — canonical owner **uydurulmaz** ([`../AGENTS.md`](../AGENTS.md) §4.4).

## Turkey localization boundary

- **Türkiye jurisdiction (D4 CLOSED):** ilk jurisdiction Türkiye; bu **hukuki uyum ispatı DEĞİL**, Türkiye-yetkili **counsel zorunlu pre-production/pre-sale validation gate**tir ([`ledger`](./enterprise-saas-human-decision-queue.md) D4).
- **Ortogonal eksen:** TR için Locale (`tr-TR`) ≠ Jurisdiction (TR) ≠ Currency (TRY) ≠ Tax ≠ Timezone (Europe/Istanbul) ≠ Data-residency; hiçbiri diğerinden türetilmez, `k-jurisdiction` 6-eksen ile çözülür ([`i18n-standard`](./i18n-standard.md) §3.5). Concrete TR format/mevzuat değerleri **uydurulmaz** — counsel + item-level residual.
- **Regulated execution sınırı:** düzenlenmiş e-fatura/e-belge delivery, e-sign trust, tax filing/authority, KYC/AML execution **lisanslı sağlayıcı**; Commerce OS yalnız orchestration/policy selection/command/status/reconciliation/calculation snapshot/evidence yapar ([`adr-0030`](./adr-0030-commerce-operating-system-boundary.md) §7). **Vendor adı requirement değildir** ([`ontology`](./enterprise-saas-capability-ontology.md) §provider).
- **Residency:** bölgeye bağlı veri sorgu katmanında zorlanır; failover'da residency kapısı korunur (KVKK/GDPR); residency-lineage denetimi D4 residual ([`i18n-standard`](./i18n-standard.md) §3.6).
- **Counsel-gated satırlar `validated` DEĞİL:** Türkiye jurisdiction pack (`C-5G-07`), content/legal text versioning (`C-5G-12`) counsel onayı ister; bu belge hiçbirini `validated`/`passed` işaretlemez.

## Red to green checks

| Kontrol | Tür | Sonuç |
|---|---|---|
| Required H2 (7, sırayla) | AUTO (metin taraması) | 7/7 mevcut, sırada — reviewer/CI teyidine açık |
| Aday satır ≥ 10 | AUTO | 12 aday (`C-5G-01…12`) |
| Her satır 11 alan **veya** `unresolved`+`blocker` | AUTO/MANUAL | tüm satırlar 11 alan; `unresolved` (4/12: 07, 09, 11, 12) blocker taşır |
| Zorunlu accessibility baseline oracle | AUTO | `C-5G-08` (axe 0 kritik, klavye/odak/kontrast, fail-closed, no sahte-yeşil) |
| Zorunlu localization baseline oracle | AUTO | `C-5G-05` (ham-metin yok, fallback, ICU, pseudo-loc) |
| Jurisdiction pack counsel-gated | AUTO/MANUAL | `C-5G-07` + §Turkey boundary: counsel `validationAuthority`, `validated` değil (D4) |
| Legal/content counsel-gated | AUTO/MANUAL | `C-5G-12`: counsel `validationAuthority`, `validated` değil |
| Provisional BC re-pass/demote | AUTO/MANUAL | §journey/surface profile: Channel/Service/Compliance DEMOTE; module açılmadı |
| No UI-component/storefront/wireframe | AUTO/MANUAL | headless kilidi; UI redesign/kit/storefront üretilmedi ([`a11y-pack`](./platform-w3-03-enterprise-accessibility-gates-agent-pack-2026-07-09.md) §Non-Goal) |
| No vendor/provider as requirement | AUTO | comms/e-doc provider = build/buy; vendor adı requirement değil ([`ontology`](./enterprise-saas-capability-ontology.md) §provider) |
| Ambiguous authority → unresolved | AUTO | jurisdiction pack authority (`C-5G-07`), legal text versioning authority (`C-5G-12`), consumer/storefront surface owner (`C-5G-09`), diagnostic read-scope (`C-5G-11`, 5E `C-5E-09` hizalı) → `unresolved` |
| Baseline/counsel satırı `validated`/`passed` DEĞİL | AUTO/MANUAL | a11y/l10n baseline + jurisdiction/legal counsel `validated`/`passed` işaretlenmedi |
| Enterprise-ready/GA iddiası yok | AUTO | baseline/counsel bekler; "enterprise-ready/GA" iddiası yok (D5) |
| Platform primitifi tüketilir, owned değil | AUTO/MANUAL | §matrix owner=platform/kernel (UX/i18n/notification/a11y); Commerce OS journey/surface tüketici; cross-write yok (D3) |
| Sadece 2 sıralı iş (A5G, V5G), paralel iddia yok | AUTO | Execution record: 2/2 sequential |
| No module/app creation | AUTO | §profile "no module"; TaskNode alanı/level/faz icat edilmedi |
| In-branch relative link target | MANUAL/CHANGESET | tüm link repo-relative; hedef Glob/Read ile doğrulandı; Codex teyidine açık |
| Line budget ≤ 220 | AUTO | bu dosya ≤ 220 satır |

Not: Repo CI kapıları (`check-i18n`, `check-ui-standards`, axe e2e, `qa:*`, `npm test`) bu worker tarafından **koşulmadı**; Codex'in bağımsız doğrulamasına aittir. Yeni makine gate/test/kod **yazılmadı** (kapsam dışı).

## Lane decision

- Bu çıktı **Phase 5G UX/globalization/accessibility candidate completeness matrisidir**; requirement/backlog/node/app/module/queue/schema/gate/kod/test/UI-component DEĞİL ve implementasyon/baseline/counsel kanıtı değildir.
- 12 aday üretildi; jenerik UX/etkileşim, i18n/l10n, `k-jurisdiction` 6-eksen, generic notification delivery/preference, accessibility gate/support **primitifleri platform + kernel owned**, Commerce OS core-7-BC yalnız **domain journey/persona + domain surface + domain hata/onboarding/notification semantiği + jurisdiction pack seçimi + legal domain** tanımlar ve primitifi **tüketir** — hiçbir primitif Commerce OS-owned yapılmadı (D3 birebir), cross-write yazılmadı.
- Owner/authority belirsiz olanlar (Türkiye jurisdiction pack + regulated-format authority `C-5G-07`, content/legal text versioning authority `C-5G-12`, consumer/storefront surface owner `C-5G-09`, supportability diagnostic read-scope `C-5G-11` — 5E `C-5E-09` ile hizalı) `unresolved`+`blocker` bırakıldı — canonical owner, concrete persona/journey/locale/format **uydurulmadı**, promote edilmedi.
- **2 zorunlu baseline oracle** karşılandı: accessibility (`C-5G-08`), localization (`C-5G-05`); ikisi de **koşulmadı**, `validated`/`passed` işaretlenmedi (Codex residual, D5).
- **Türkiye jurisdiction pack + legal/content metni counsel-gated** (D4); counsel `validated`/`passed` işaretlenmedi; regulated execution lisanslı sağlayıcıya bırakıldı, vendor adı requirement yapılmadı; **UI redesign/component kit/storefront üretilmedi** (headless kilidi); provisional BC surface/journey/jurisdiction yüzeyi platform primitifine demote edildi, module açılmadı; enterprise-ready/GA iddiası yapılmadı (D5).
- Stop-gate ihlali: **yok** (sayı hedefi yapılmadı; UX/i18n/notification/a11y primitifi Commerce OS-owned yapılmadı; cross-write/primitif kopyası yok; app/module açılmadı; persona/journey/locale/format uydurulmadı; baseline/counsel `validated`/`passed` denmedi; vendor requirement yapılmadı; UI/storefront üretilmedi).
- Yazılan tek izinli dosya: `docs/enterprise-saas-phase-5g-ux-globalization-accessibility-candidates.md`. Diğer 5A–5H shard'ları, kanon dokümanlar ve sibling worktree **değişmedi**. Commit/push/PR/deploy **yapılmadı**.
- **Faz 5G GO/NO-GO ve kalan dalgalar → Codex'e ait.** Bu worker 5G candidate matrisini üretti ve **durur**; Codex bağımsız doğrulamadan bu çıktı tamamlanmış sayılmaz.
