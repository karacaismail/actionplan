# KERNEL ↔ Numeronym Eşlemesi — Hangi Standart Hangi Primitif/Yönergede Yaşar

Sürüm: 1.0 — 2026-07-01
Durum: AI-DRAFT (insan onayı bekler)
Bağlam: `docs/standards/numeronym-siniflandirma.md` (7-aile şeması), `docs/core-contract-pack.md` (10 v1 + 15 v2 primitif), `docs/pdp-policy-contract.md`, `docs/scale-invariant-directive.md`, `docs/ai-governance-master.md`.

Bu doküman nedir: Numeronym sınıflandırmasındaki her standart/kısaltmayı, onu **teknik olarak karşılayan** somut KERNEL primitifine veya çatı-yönergesine bağlar. Sınıflandırma dokümanı "bu bir standart mı, capability mi, araç mı?" sorusuna cevap verir; bu doküman "bu standart kernel katmanında **nerede yaşar, motoru hangisidir**?" sorusuna cevap verir. Böylece bir ajan/geliştirici bir numeronym (ör. o11y) için yeni altyapı kurmadan önce, onun zaten hangi primitifte karşılandığını görür.

En kritik ayrım: Bir numeronym'in kernel katmanında yaşaması, onun **çapraz-kesen** (her app'in tükettiği tek motor) olduğu anlamına gelir. Kernelde yaşamayanlar (a11y, i18n-surface, c12n, p13n) **archetype/surface katmanında** yaşar — kernel onları zorlamaz, yalnızca uyumluluk kapısıyla doğrular. Bu ayrım korunmazsa ajan her kısaltmayı "kernel primitifi" sanıp çekirdeği şişirir.

Durum sütunu okuması: **VAR** = primitif/yönerge mevcut sözleşmede tanımlı, standart orada karşılanır. **YENİ** = kernelde henüz karşılığı yok; bu doküman yeni bir kernel primitifi öneriyor (AI-DRAFT — insan onaylı taslak, `ai-governance-master` §5 gereği primitif üretimi yalnız insan onayıyla).

---

## 1. Ana Eşleme Tablosu

Aşağıdaki tablo her numeronym standardını kernel primitifine/yönergesine eşler. "Kernel primitifi/yönergesi" sütunu somut sözleşme adını (`platform_*` veya çatı-yönerge) verir; "Nasıl karşılanır" o standardın o primitifte hangi mekanizmayla yaşadığını tek cümlede söyler; "Durum" primitifin varlığını gösterir.

| Standart | Kernel primitifi / yönergesi | Nasıl karşılanır | Durum |
|---|---|---|---|
| o11y (observability) | `Observability` (core-pack §2.9) | structlog JSON + Prometheus/OTel + Jaeger; her sinyal `trace_id`+`tenant_id` ile korele; `get_logger()` tek giriş | VAR |
| AuthN (authentication) | `Identity/AuthZ` (§2.2) + `k-identity` | JWT/RS256 kimlik doğrulama; PDP'nin **girdisi** (kimlik verili) — AuthN kim, PDP ne yapabilir | VAR |
| AuthZ (authorization) | `PDP` (§3.3 / `pdp-policy-contract`) + `authn-authz` | `evaluate(actor,action,resource,context)→Decision`; policy-as-data, default-deny, deny-overrides | VAR |
| RBAC (role-based) | `PDP` + `Actor/Party` (§3.1) | Rol → `RoleBinding` (zaman/bağlam-kapsamlı); PDP `target_actor` seçiciyle rolü çözer | VAR |
| ABAC (attribute-based) | `PDP` (§3.3) | Policy `condition` içinde ABAC öznitelik ifadesi (attr/op/value); RBAC+ABAC+ReBAC tek hybrid modelde | VAR |
| ReBAC (relationship-based) | `PDP` + `Actor/Party` | İlişki grafiği (`X, Y'nin yöneticisidir`) policy `condition` relation koşulundan yetki türetir | VAR |
| IAM (identity & access mgmt) | `Identity/AuthZ` + `Actor/Party` + `PDP` | AuthN+AuthZ+Party+tenant izolasyonu birlikte IAM sınırını kurar; WBS `s-iam` (13.5) genişler | VAR |
| SSO (single sign-on) | `Identity/AuthZ` (`k-identity` alt-uzmanlık) | OIDC/SAML IdP federasyonu AuthN sözleşmesine bağlı; token yine RS256 JWT'ye iner | VAR (AuthN genişletmesi) |
| MFA (multi-factor) | `Identity/AuthZ` + `PDP` obligation | 2. faktör AuthN akışında; PDP `obligations:["require_2fa"]` ile step-up talep eder | VAR (AuthN + PDP obligation) |
| i14y (interoperability) | `Module SDK` (§2.10) + API sözleşmesi (§3.1/§3.2) + `Scale-Invariant` | AppModule `register_routes/register_graphql`; OpenAPI-first + imzalı/retry webhook; idempotency-key → `platform_idempotency` | VAR |
| webhook | `Event Bus + Outbox` (§2.3) + `Scale-Invariant` (§3.7) | Dış olay yayımı transactional outbox'tan akar; retry idempotent; imzalı teslim | VAR |
| API (application prog. iface) | `Module SDK` (§2.10) + API Hata/GraphQL standardı (§3.1/§3.2) | Tek hata formatı, cursor-sayfalama, resolver koruması; her modül SDK arayüzünden bağlanır | VAR |
| E2EE (end-to-end encryption) | `edge-security` (Edge Gateway §3.11 + core-pack §3.6 OWASP A02) | Envelope encryption + client-side crypto; hassas kolon pgcrypto; plaintext DB'de asla | VAR (kısmi — E2EE app-katmanı desteklenir) |
| edge-security (kenar güvenlik) | `Edge Gateway` (§3.11) + `Scale-Invariant` (§3.7) rate-limit | Saha/kenar köprüsü offline-first + idempotent; ağ kenarı rate-limit `rate_limit_scope=tenant` | VAR |
| WAF (web app firewall) | `edge-security` + `Scale-Invariant` + OWASP kapısı (§3.6) | Kötü-niyetli istek loglama + rate-limit/throttle; kenar katman filtreleme; A01/A03/A05 CI kapısı | VAR (kenar + CI kapısı) |
| DDoS (denial of service) | `Scale-Invariant` (§3.7) + `scale-invariant-directive` | `rate_limit_scope` (default `tenant`) noisy-neighbor + throttle; 429 döner; SCV-7 kapısı | VAR |
| IaC (infrastructure as code) | `deploy` (core-pack §3.7) + `Migration Policy` (§2.8) | Docker multi-stage + Hetzner/Debian manifest; env-validation; reproducible build; secret düz-metin yok | VAR |
| CI/CD (integration/delivery) | `deploy` (§3.7) + `check-core-contract` + `check-scale-invariant` | Konformans kapıları (pytest/vitest/coverage/migration dry-run) merge'i açar; kapı kırmızıysa deploy yok | VAR |
| capability (yetenek) | `Capability/Entitlement` (§3.2) | `CapabilityService.is_enabled(tenant,cap)`; plan×capability matrisi, imzalı lisans, fail-closed | VAR |
| feature-flag | `Capability/Entitlement` (§3.2) | Feature-flag = capability'nin tenant-katman efektif değeri; her app kendi flag'ini yazamaz (tek motor) | VAR |
| iş-modeli (B2B/B2C/M2M…) | `Mode-Profile` (§3.4) | Runtime iş-modeli tek versiyonlu profilde; ADMIN_FLOW (preview→dry-run→approval→apply→rollback); veri yıkılmaz | VAR |
| scale (ölçek-değişmez yazma) | `Scale-Invariant` (§3.7 / `scale-invariant-directive`) | `scaled_write` zarfı: `financial\|order\|inventory` etiketli her yazmada outbox+idempotency+audit zorunlu | VAR |
| idempotency | `Scale-Invariant` (§3.7) → `platform_idempotency` | `(idempotency_key, tenant_id)` tekilleştirme; tekrar isteği saklı `result_ref`'i döner; SCV-3 kapısı | VAR |
| outbox (transactional) | `Event Bus + Outbox` (§2.3) + `Scale-Invariant` (§3.7) | Domain kaydı + `platform_outbox` satırı **aynı** `session.commit()`; dual-write imkânsız; SCV-2 kapısı | VAR |
| storage (dosya/nesne depo) | `k-storage` (`platform_storage`) | Nesne/blob depolama, imzalı URL, quota, virüs-tarama, tenant-scoped bucket; presigned upload | YENİ |
| task-queue (arka plan iş) | `k-worker` (`platform_worker`) | Idempotent job + retry/backoff + DLQ + zamanlanmış görev; outbox tüketici worker'ının genel hali | YENİ |
| search (tam-metin/faset arama) | `k-search` (`platform_search`) | Tenant-scoped index, faset/typeahead, yetki-farkında sonuç (PDP filtreli), yeniden-indexleme | YENİ |
| MDM (master data mgmt) | `k-mdm` (`platform_mdm`) | Altın-kayıt (golden record), eşleştirme/tekilleştirme (match/merge), soy-kütük, referans-veri yönetimi | YENİ |

---

## 2. Non-Kernel Numeronym'ler — Archetype / Surface Katmanında Yaşayanlar

Aşağıdaki standartlar **kernel primitifi değildir**. Çapraz-kesen tek motor gerektirmezler; her archetype veya surface (yüzey/UI) kendi katmanında uygular ve kernel yalnızca bir **uyumluluk kapısıyla** doğrular. Bunları kernel primitifi sanmak çekirdeği yanlış şişirir. Tablo, standardı, hangi katmanda yaşadığını ve kernelin oradaki tek rolünü verir.

| Standart | Katman | Neden kernel değil | Kernelin rolü |
|---|---|---|---|
| a11y (accessibility) | Surface (UI shell / archetype) | Erişilebilirlik render-katmanı kararıdır; semantic HTML+ARIA+focus her surface'te yaşar, tek motor çözemez | UI Shell standardı (§3.4) + `check-ui-standards` kapısı (axe-core WCAG 2.2 AA) |
| i18n-surface (arayüz çevirisi) | Surface (message catalog / archetype) | Metin çevirisi ve locale-render surface'te yaşar; kernelin sunacağı bir "çeviri motoru" değil, standarttır | `i18n-standards` sözleşmesi + surface message-catalog kapısı |
| c12n (customization) | Archetype + Capability | Tenant temalama/özelleştirme archetype config + Capability flag'iyle çözülür; ayrı kernel primitifi gerekmez | `Capability` (§3.2) tema/flag capability'si; archetype config katmanı |
| p13n (personalization) | Surface (per-user preference) | Kullanıcı-bazlı görünüm (saved views, dashboard) surface state'tir; kernel çapraz-kesen değil | Surface preference katmanı; kernel yalnız `user_preferences` izolasyonunu (tenant/kullanıcı) doğrular |

Not: `g11n` (globalization) bunlardan ayrıdır — o **kernele yakın**dır çünkü residency/jurisdiction çapraz-kesendir ve `Jurisdiction` primitifinde (§3.15) yaşar (locale≠currency≠tax≠residency ortogonalliği). a11y/i18n-surface/c12n/p13n ise surface/archetype katmanında kalır.

---

## 3. Kernel Katmanı Numeronym Kapsaması — Özet

Aşağıdaki özet, numeronym sınıflandırmasındaki standartların kernel katmanınca ne oranda ve nasıl kapsandığını verir. Önce eksen-eksen sayısal tablo, sonra açıklama.

| Eksen | Standartlar | Taşıyan primitif(ler) | Durum |
|---|---|---|---|
| Kimlik-Yetki | AuthN/AuthZ/RBAC/ABAC/ReBAC/IAM/SSO/MFA | `Identity/AuthZ` + `PDP` + `Actor/Party` | VAR (8/8) |
| Entegrasyon-API | i14y/webhook/API/SDK | `Module SDK` + API sözleşmesi + `Event Bus/Outbox` | VAR (4/4) |
| Güvenli-Yazma | scale/idempotency/outbox | `Scale-Invariant` (CI-zorlamalı) | VAR (3/3) |
| Kenar-Güvenlik | edge-security/WAF/DDoS/E2EE | `Edge Gateway` + `Scale-Invariant` rate-limit + OWASP kapısı | VAR (4/4) |
| Operasyon | o11y/IaC/CI-CD | `Observability` + `deploy` + konformans kapıları | VAR (3/3) |
| Ticari | capability/feature-flag/iş-modeli | `Capability/Entitlement` + `Mode-Profile` | VAR (3/3) |
| Veri-Altyapı | storage/task-queue/search/MDM | `k-storage` + `k-worker` + `k-search` + `k-mdm` | YENİ (0/4) |
| Surface-Yerel | a11y/i18n-surface/c12n/p13n | (kernel değil — archetype/surface katmanı) | Kernel dışı |

**Mevcut primitiflerle (VAR) kapsanan çekirdek yüzey.** Numeronym sınıflandırmasının **kimlik-yetki** ekseninin tamamı (AuthN/AuthZ/RBAC/ABAC/ReBAC/IAM/SSO/MFA) iki primitifte — `Identity/AuthZ` (kim) + `PDP` (ne yapabilir) — ve `Actor/Party` girdisiyle karşılanır; tek doğruluk kaynağı, default-deny, tamper-evident karar-logu. **Entegrasyon-API** ekseni (i14y/webhook/API/SDK) `Module SDK` + API sözleşmesi + `Event Bus/Outbox` üçlüsünde yaşar. **Güvenli-yazma** ekseni (scale/idempotency/outbox) `Scale-Invariant` yönergesinde CI-zorlamalı invariant'tır (opt-in değil). **Kenar-güvenlik** ekseni (edge-security/WAF/DDoS/E2EE) `Edge Gateway` + `Scale-Invariant` rate-limit + OWASP CI kapısında; **operasyon** ekseni (o11y/IaC/CI-CD) `Observability` + `deploy` + konformans kapılarında. **Ticari** eksen: `capability`/`feature-flag` → `Capability/Entitlement`, `iş-modeli` → `Mode-Profile`. Toplam: kimlik-yetki, API, güvenli-yazma, gözlemlenebilirlik, ticari-yetenek eksenlerinin **tamamı** mevcut kernelde karşılanıyor.

**Yeni önerilen 4 primitif (YENİ — AI-DRAFT).** Mevcut kernelde motoru olmayan dört çapraz-kesen ihtiyaç: `k-storage` (nesne/blob depolama — 50 app'in dosya yüklemesi tek imzalı-URL/quota motoru ister), `k-worker` (arka plan task-queue — outbox-tüketici worker'ının genelleştirilmiş, retry/DLQ/zamanlama'lı hali), `k-search` (yetki-farkında tam-metin arama — sonuçlar PDP'den filtreli), `k-mdm` (master data / altın-kayıt — match/merge/soy-kütük). Dördü de `ai-governance-master` §5 gereği yalnız insan-onaylı taslakla üretilir; hiçbiri AI eliyle yürürlüğe giremez.

**Kernel dışında bilinçle bırakılanlar.** a11y, i18n-surface, c12n, p13n **surface/archetype** katmanındadır; kernel onlara motor sunmaz, yalnız uyumluluk kapısıyla (UI standardı, i18n sözleşmesi, capability flag'i) doğrular. Ayrıca araç/domain kısaltmaları (CRUD/REST/CMS/ERP…) sınıflandırma gereği zaten standart-DIŞIdır ve kernel primitifine eşlenmez. Sonuç: kernel katmanı, çapraz-kesen **standartların** tamamını (mevcut + 4 yeni öneri) kapsar; katman-yerel olanları kasıtlı olarak archetype/surface'e bırakır — bu, çekirdeğin doğru (ince ama tam) kalmasının koşuludur.
