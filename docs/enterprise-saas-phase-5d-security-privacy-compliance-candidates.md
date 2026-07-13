# Enterprise SaaS — Phase 5D Security/Privacy/Compliance Candidate Completeness Matrix

**Rol:** Claude SLAVE worker. Codex MASTER + nihai otorite.
**Faz:** 5D (security/privacy/compliance candidate completeness). Faz 4.5 D3 (platform vs Commerce OS core-7-BC authority) + D4 (Türkiye jurisdiction + regulated-execution sınırı + counsel gate) + D5 (Controlled Paid Enterprise Pilot evidence controls) CLOSED çerçevesinde açıldı ([`ledger`](./enterprise-saas-human-decision-queue.md) §Newly closed decisions). Bu **onaylanabilir candidate set / domain-completeness** dokümanıdır; requirement/backlog/node/app/module/queue/schema/gate/kod/test DEĞİL ([`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) Faz 5).
**Tarih:** 2026-07-13 · **Durum:** ÖNERİ — Codex bağımsız doğrulamadan tamamlanmış sayılmaz.

> Bu belge **aday tamlık matrisidir** (security/privacy/compliance yüzeyi), requirement listesi/backlog/module/standart-metni değildir. **Kritik invariant:** tenant isolation, authn, authz/PDP, secrets/key (KMS), plugin/module trust, immutable audit/evidence, retention/legal-hold, privacy classification **platform/kernel primitifleridir**; Commerce OS **core 7 BC** yalnız **kendi domain kaydının** güvenlik özne/tüketici tarafıdır — kendi authz/secret/audit motorunu yazmaz, primitifi **tüketir** ([`ledger`](./enterprise-saas-human-decision-queue.md) D3; [`composition`](./enterprise-saas-product-family-composition.md) §Shared versus owned matrix). Cross-context write yok; erişim yalnız versioned command/API/event/outbox. **Standart metni kopyalanmaz** (ASVS/SSDF/OWASP/KVKK/eIDAS) — yalnız Faz 8 crawswalk referansı ([`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) §Altın Kural / Faz 8). **Standarda atıf ≠ uyumluluk iddiası; regulated/legal yorum Türkiye-yetkili counsel'a aittir (D4).** Owner/authority belirsizse satır `unresolved`; counsel-bağımlı satır **`passed` işaretlenemez**. Hiçbir aday app/module/BC düğümüne **terfi ETMEZ** ([`../AGENTS.md`](../AGENTS.md) §4.4).

## Execution record

Task/sub-agent mekanizması bu ortamda **MEVCUT DEĞİL** (yalnız Bash/Read/Grep/Glob/Edit). Bu nedenle **2 iş SIRALI** yürütüldü; **paralellik/sub-agent iddiası yok**. Tek yazar/entegrasyon adımı yalnız bu dosyadır.

- Yürütülen iş sayısı: **2/2** · Mod: **sequential (mechanism unavailable)** · READ-ONLY analiz + tek yazar.
- Girdi/HEAD: branch `codex/enterprise-saas-requirements-2026-07-13`; okunan kanon [`../AGENTS.md`](../AGENTS.md), [`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md), [`oracles`](./enterprise-saas-phase-5-11-acceptance-oracles.md), [`ledger`](./enterprise-saas-human-decision-queue.md) (D3/D4/D5), [`composition`](./enterprise-saas-product-family-composition.md), [`constitution`](./enterprise-saas-requirement-constitution.md), [`ontology`](./enterprise-saas-capability-ontology.md), [`k-kms`](./k-kms-directive.md), [`k-signature-trust`](./k-signature-trust-directive.md), [`k-evidence-seal`](./k-evidence-seal-directive.md), [`k-module-security`](./marketplace-module-security-directive.md), [`k-legal-hold-retention`](./k-legal-hold-retention-directive.md), [`privacy-retention-matrix`](./privacy-retention-decision-matrix.md), [`k-provider-adapter`](./k-provider-adapter-directive.md), [`adr-P1-pdp`](./adr-P1-pdp.md), [`w3-01-security-gates`](./platform-w3-01-enterprise-security-gates-agent-pack-2026-07-09.md), [`adr-0030`](./adr-0030-commerce-operating-system-boundary.md).

| # | İş | Tür | Kapsam | Yerleştiği bölüm |
|---|---|---|---|---|
| A5D | security/privacy/compliance analyst | analyst | 14 aday: threat/abuse model, tenant isolation security, authn enforcement, authz/PDP enforcement, secrets/key lifecycle + key-loss, supply-chain/plugin trust, vulnerability/dependency mgmt, privacy classification/consent, retention/deletion/legal-hold (security lens), residency, SoD/privileged access, immutable audit/evidence, incident/legal notification, Türkiye counsel validation | Candidate completeness matrix |
| V5D | security/privacy/compliance reviewer | reviewer | authority/dedup/fold, platform-primitif owner vs Commerce OS özne, 4 zorunlu oracle (tenant leakage · key loss · plugin exfiltration · deletion-retention), ambiguous→unresolved, counsel≠passed, no standard-copy, no compliance-claim, no cross-write, no module promotion, link/field/claim | Turkey validation boundary · Duplicate and authority notes · Red to green checks |

Sıra: **A5D → V5D** (sıralı, aynı dosya). İki iş de aynı tek dosyaya yazdı; başka lane'e paralel yazım yok.

## Lane boundary

- **scope:** security/privacy/compliance yüzeyinin candidate completeness'ı — platform güvenlik primitiflerinin authority sınırı ve Commerce OS core-7-BC'nin **özne/tüketici** rolü. owner/authority/lifecycle/riskTier/testOracle belirsizse `unresolved`; counsel yorumu gereken satır `passed` olamaz.
- **inputs:** yukarıdaki kanon; D3 authority allocation + D4 Türkiye/counsel gate/regulated sınır + D5 evidence-control listesi **bağlayıcı insan kararı** ([`ledger`](./enterprise-saas-human-decision-queue.md)).
- **allowed-files:** yalnız `docs/enterprise-saas-phase-5d-security-privacy-compliance-candidates.md`. Başka dosya, JSON/node/schema/gate/kod/test yok.
- **non-goals:** requirement/backlog/module/app üretmek; k-kms/k-module-security/k-evidence/PDP/privacy primitiflerini **yeniden yazmak**; authz/secret/audit'i Commerce OS-owned yapmak; ASVS/SSDF/KVKK/eIDAS metnini **kopyalamak**; **uyumluluk/GA iddiası**; concrete residency/breach-notification süresi **uydurmak** (D4 counsel gate); Türkiye counsel satırını `passed` işaretlemek; module terfisi; cross-context write.
- **checks:** §Red to green checks (deterministik metin/link taraması; otomatik gate yoksa `MANUAL/CHANGESET`).
- **output:** ≥10 aday satır + **4 zorunlu oracle** (tenant leakage · key loss · plugin exfiltration · deletion-retention conflict) + Türkiye validation boundary + duplicate/authority notları + red/green.
- **blockers:** consent-record authority, vulnerability-SLA gate owner, residency-lineage (D4), SoD-policy authority, breach/legal-notification süre+authority (D4 counsel), key-loss recovery semantiği — contract'ta net owner/lifecycle yok → `unresolved` (blocker alanında).

## Candidate completeness matrix

Alan sözleşmesi (her aday): `candidateId · outcome · owner · dataAuthority · lifecycleAuthority · scopeClass · riskTier · testOracle · evidenceExpected · status · blocker` ([`constitution`](./enterprise-saas-requirement-constitution.md) §Candidate record contract). scopeClass 14-sınıf sözlüğü [`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) §1. Bir alan çözülemezse satır `unresolved` + `blocker`. Güvenlik primitifleri owner=platform/kernel; Commerce OS domain kaydı özne/tüketici, primitifi **kopyalamaz**.

| candidateId | scopeClass | riskTier | status |
|---|---|---|---|
| `C-5D-01-threat-abuse-model` | policy | high | candidate |
| `C-5D-02-tenant-isolation-security` | platform capability (consumed) | high | candidate |
| `C-5D-03-authentication-enforcement` | platform capability (consumed) | high | candidate |
| `C-5D-04-authorization-pdp-enforcement` | platform capability (consumed) | high | candidate |
| `C-5D-05-secrets-key-lifecycle-keyloss` | platform capability (consumed) | high | unresolved |
| `C-5D-06-supply-chain-plugin-trust` | platform capability (consumed) | high | candidate |
| `C-5D-07-vulnerability-dependency-mgmt` | policy | high | unresolved |
| `C-5D-08-privacy-classification-consent` | policy | high | unresolved |
| `C-5D-09-retention-deletion-legalhold-security` | policy | high | unresolved |
| `C-5D-10-data-residency` | policy | high | unresolved |
| `C-5D-11-sod-privileged-access` | policy | high | unresolved |
| `C-5D-12-immutable-audit-evidence` | platform capability (consumed) | high | candidate |
| `C-5D-13-incident-legal-notification` | policy | high | unresolved |
| `C-5D-14-turkey-counsel-validation` | policy | high | unresolved |

Detaylı alanlar (aynı authority'yi referansla, kopyalamaz):

**`C-5D-01-threat-abuse-model`**
- outcome: Her core-7-BC + primitif için **threat/abuse model** (STRIDE + abuse/misuse case → negatif test eşlemesi); tehdit modeli olmadan yüksek-risk yüzey `validated` olamaz ([`k-module-security`](./marketplace-module-security-directive.md) §13 threat-model-to-test).
- owner: platform security (aday) · dataAuthority: threat-model kaydı platform security · lifecycleAuthority: platform security review lifecycle (insan-onaylı)
- testOracle: contract — her yüksek-risk tehdit maddesi en az bir negatif teste eşlenir; eşlemesiz tehdit RED (MANUAL/CHANGESET) · evidenceExpected: threat→abuse-case→negative-test matrisi
- blocker: yok (yaklaşım net); per-BC item-level tehdit envanteri insan-onaylı ayrı dalga.

**`C-5D-02-tenant-isolation-security`**
- outcome: Kiracı izolasyonu güvenlik özne kararı: her erişim fail-closed tenant-scoped, RLS + PDP iki katman; cross-tenant okuma/yazma reddedilir ([`ledger`](./enterprise-saas-human-decision-queue.md) D3 platform authority; [`w3-01-security-gates`](./platform-w3-01-enterprise-security-gates-agent-pack-2026-07-09.md) tenant escape suite).
- owner: platform tenancy (`k-tenancy`) · dataAuthority: platform tenant-scope/RLS · lifecycleAuthority: platform isolation lifecycle
- testOracle: **zorunlu — tenant leakage / cross-tenant leak:** başka tenant kaydı okunamaz/yazılamaz; tenant'sız context fail-closed; escape suite sızıntıyı reddeder ([`oracles`](./enterprise-saas-phase-5-11-acceptance-oracles.md) §probe 1) · evidenceExpected: tenant-escape negatif suite raporu
- blocker: yok (izolasyon=platform authority, D3); noisy-neighbor performans ekseni 5E'ye ait.

**`C-5D-03-authentication-enforcement`**
- outcome: Authn (kullanıcı/machine identity/federation/MFA) platform primitifidir; Commerce OS kendi login/token motorunu yazmaz, kimliği **tüketir** ([`ledger`](./enterprise-saas-human-decision-queue.md) D3 authn/identity; identity proofing detayı 5B).
- owner: platform identity/authn · dataAuthority: platform credential/session · lifecycleAuthority: platform identity lifecycle
- testOracle: negative — geçersiz/expired/replayed credential reddedilir; MFA-zorunlu yüzey MFA'sız geçmez (MANUAL) · evidenceExpected: authn negatif suite
- blocker: yok; identity-proofing/federation derinliği 5B lane'inde (fold DEĞİL, sınır referansı).

**`C-5D-04-authorization-pdp-enforcement`**
- outcome: Yetki kararı yalnız **PDP** (deny-by-default); her mutation/agent/module eylemi ExecutionContext taşır; cross-context write PDP'de reddedilir ([`adr-P1-pdp`](./adr-P1-pdp.md); [`ledger`](./enterprise-saas-human-decision-queue.md) D3 authz/PDP).
- owner: platform PDP (`k-authz`) · dataAuthority: platform policy/grant · lifecycleAuthority: platform policy lifecycle
- testOracle: negative — authz bypass suite deny-by-default kanıtlar; yetkisiz/cross-tenant/cross-context eylem reddedilir ([`w3-01-security-gates`](./platform-w3-01-enterprise-security-gates-agent-pack-2026-07-09.md) authz bypass suite) · evidenceExpected: authz-bypass negatif suite
- blocker: yok (PDP=platform authority); RBAC/ABAC edition-policy eşlemesi item-level residual.

**`C-5D-05-secrets-key-lifecycle-keyloss`**
- outcome: Sır/anahtar yaşam döngüsü (secret_binding referans, envelope encryption, rotation/revoke, tenant-scoped, PDP-gated resolve) platform KMS'te; ham değer asla DB/log/response'ta; AI ham sır göremez ([`k-kms`](./k-kms-directive.md) §1/§4). **Key-loss/recovery** semantiği (kayıp ana-anahtar → kurtarma vs crypto-shred) contract'ta **tanımsız**.
- owner: platform `k-kms` · dataAuthority: platform secret_binding (değer değil) · lifecycleAuthority: **belirsiz** — key-loss/recovery lifecycle net değil
- testOracle: **zorunlu — key loss / region-key loss:** anahtar kaybı/iptalinde etkilenen veri erişilemez olur (crypto-shred anlamı) fakat sistem fail-closed davranır ve kurtarma yolu deterministiktir; kayıp anahtar sessiz plaintext fallback üretmez ([`oracles`](./enterprise-saas-phase-5-11-acceptance-oracles.md) §probe 5) · evidenceExpected: key-loss drill + rotation/revoke testi
- blocker: **key-loss recovery + backup-key escrow authority/semantiği** contract'ta yok → `unresolved`; concrete recovery politikası uydurulmaz.

**`C-5D-06-supply-chain-plugin-trust`**
- outcome: Dış modül/plugin **güvenilmez subject**: imza+yayıncı doğrulama (fail-closed), SBOM/provenance, permission-diff insan onayı, sandbox (ağ/dosya/process default-deny), module-tablosu RLS zorunlu, karantina/rollback ([`k-module-security`](./marketplace-module-security-directive.md) §2/§4). AI modül yükleyemez/izin veremez/karantina kaldıramaz.
- owner: platform `k-module-security` · dataAuthority: platform module registry/permission/SBOM · lifecycleAuthority: platform install/enable/quarantine/revoke lifecycle (insan-onaylı)
- testOracle: **zorunlu — plugin exfiltration:** sandbox'lı modül kapsam-dışı secret/ağ/dosya/başka-tenant verisine erişemez; veri sızdırma negatif testleri reddeder ([`oracles`](./enterprise-saas-phase-5-11-acceptance-oracles.md) §probe 6; [`k-module-security`](./marketplace-module-security-directive.md) §10) · evidenceExpected: exfiltration negatif suite + SBOM/imza raporu
- blocker: yok (module-security=platform authority); sandbox teknoloji seçimi (ADR-M1) altyapı residual.

**`C-5D-07-vulnerability-dependency-mgmt`**
- outcome: Zafiyet/bağımlılık yönetimi (SAST/DAST/secret-scan/SBOM diff, critical/high bulguda RC-kapısı kapanır) D5 evidence control ([`ledger`](./enterprise-saas-human-decision-queue.md) D5 vulnerability/dependency mgmt; [`w3-01-security-gates`](./platform-w3-01-enterprise-security-gates-agent-pack-2026-07-09.md)).
- owner: platform security/CI (aday) · dataAuthority: **belirsiz** — vuln-SLA/gate authority (kim severity sınıflar, kim waiver verir) net değil · lifecycleAuthority: **belirsiz**
- testOracle: contract/negative — critical/high bulguda release-candidate kapısı kapanır; bilinen-zafiyetli bağımlılık işaretlenir (MANUAL/CHANGESET; standart metni kopyalanmaz) · evidenceExpected: security-scan raporu + gate sonucu
- blocker: **vuln severity-SLA + waiver authority** contract'ta net değil → `unresolved`; concrete SLA gün sayısı uydurulmaz.

**`C-5D-08-privacy-classification-consent`**
- outcome: Veri sınıflandırma (PII/özel-nitelikli/finansal) + **consent/işleme-amacı** kaydı; erişim ve işleme sınıf+amaç ile sınırlanır ([`privacy-retention-matrix`](./privacy-retention-decision-matrix.md)). KVKK/GDPR yorumu **counsel'a** aittir (D4), uyumluluk iddiası değil.
- owner: platform privacy (classification) · dataAuthority: **belirsiz** — consent-record/lawful-basis authority (platform primitif mi, domain kaydı mı) net değil · lifecycleAuthority: **belirsiz**
- testOracle: negative — classification'sız PII alanı build'i kırar; consent/amaç dışı işleme reddedilir ([`privacy-retention-matrix`](./privacy-retention-decision-matrix.md) §2 `check-privacy-retention`) · evidenceExpected: alan→sınıf→lawful-basis kaydı
- blocker: **consent/lawful-basis canonical owner + KVKK yorumu (D4 counsel)** çözülmemiş → `unresolved`; concrete lawful-basis kuralı uydurulmaz.

**`C-5D-09-retention-deletion-legalhold-security`** — **status: unresolved**
- outcome: Saklama/imha/erasure/legal-hold **güvenlik lensi** — 5C `C-5C-07` authority'sini (platform `k-legal-hold-retention`) **referansla**, kopyalamaz; buradaki katkı yalnız çatışma-oracle'ının 5D kabulüdür ([`k-legal-hold-retention`](./k-legal-hold-retention-directive.md); fold DEĞİL, cross-ref). **`hold > retention > erasure` önceliği bir counsel-validation HİPOTEZİDİR (test-önerisi), tesis edilmiş hukuki emsal/precedence DEĞİLDİR;** hangi hold türünün hangi erasure/retention yükümlülüğünü hangi jurisdiction'da ezdiği Türkiye-yetkili counsel yorumuna bağlıdır (D4), worker karara bağlamaz.
- owner: **belirsiz** — deletion/disposition çatışma-önceliği + counsel-validated hold semantiği owner/authority contract'ta net değil; `k-legal-hold-retention` primitif mekaniğini taşır fakat **çatışma-önceliği kararı** counsel-gated ve **unresolved** · dataAuthority: platform hold/retention (mekanik); **çatışma-önceliği authority belirsiz** · lifecycleAuthority: **belirsiz** — hold/disposition çatışma lifecycle counsel yorumuna bağlı
- testOracle: **zorunlu — deletion-retention / legal-hold conflict (hipotez):** hipoteze göre aktif hold, retention imhasını ve KVKK/GDPR erasure'ı ezmeli; finansal-işlem silinmez→pseudonymize; audit silinmez→redaction — fakat bu **beklenen davranış hipotezidir**, counsel doğrulaması + gerçek çatışma drill'i olmadan `validated`/`passed` DEĞİL ([`oracles`](./enterprise-saas-phase-5-11-acceptance-oracles.md) §probe 9; [`k-legal-hold-retention`](./k-legal-hold-retention-directive.md) §12) · evidenceExpected: hold>retention>erasure çatışma testi + counsel-review kaydı
- blocker: **deletion/disposition çatışma-önceliği owner/authority + counsel yorumu (D4)** çözülmemiş → `unresolved`; `hold>retention>erasure` emsal gibi sunulamaz; concrete süre (VUK/TTK/KVKK) counsel residual, uydurulmaz.

**`C-5D-10-data-residency`**
- outcome: Veri residency/region yönlendirme; ilk jurisdiction Türkiye (D4) ama bu **hukuki ispat değil**, counsel gate'tir. Commerce OS region/classification'ı **okur**, jurisdiction kuralı yazmaz.
- owner: platform tenancy (region) + privacy (aday) · dataAuthority: **belirsiz** — residency-lineage kayıt authority net değil · lifecycleAuthority: **belirsiz**
- testOracle: negative — yanlış region'da PII reddedilir; residency ihlali fail-closed ([`privacy-retention-matrix`](./privacy-retention-decision-matrix.md)) · evidenceExpected: alan→region-lineage + residency-ihlal testi
- blocker: **residency-lineage authority + Türkiye counsel gate (D4)** residual → `unresolved`; concrete jurisdiction/residency kuralı uydurulmaz.

**`C-5D-11-sod-privileged-access`**
- outcome: Görev ayrımı (SoD) + privileged/break-glass erişim: onaylayan ≠ uygulayan; yüksek-risk eylem çift-onay; break-glass zaman-sınırlı + tam audit ([`ledger`](./enterprise-saas-human-decision-queue.md) D5 immutable audit; PDP eforcement `C-5D-04`).
- owner: platform PDP/identity (aday) · dataAuthority: **belirsiz** — SoD-policy/duty-matrix authority net değil · lifecycleAuthority: **belirsiz**
- testOracle: negative — aynı aktör hem onaylayıp hem uygulayamaz; break-glass audit'siz açılamaz; toxic-combination reddedilir (MANUAL) · evidenceExpected: SoD çakışma testi + break-glass audit izi
- blocker: **SoD duty-matrix + toxic-combination authority** contract'ta net değil → `unresolved`; concrete rol-ayrım matrisi uydurulmaz.

**`C-5D-12-immutable-audit-evidence`**
- outcome: Değişmez audit/decision history + kanıt mühürü (append-only, tamper-evident, silinmez→redaction) platform primitifidir; Commerce OS domain olayını **yazar**, kendi audit deposunu açmaz ([`k-evidence-seal`](./k-evidence-seal-directive.md); [`ledger`](./enterprise-saas-human-decision-queue.md) D3 audit/evidence).
- owner: platform `k-evidence` + audit · dataAuthority: platform audit/evidence seal · lifecycleAuthority: platform append-only lifecycle
- testOracle: contract/negative — audit kaydı değiştirilemez/silinemez (tamper-evident); güvenlik olayı deny+immutability kanıtlanır ([`w3-01-security-gates`](./platform-w3-01-enterprise-security-gates-agent-pack-2026-07-09.md) audit deny/immutability) · evidenceExpected: tamper-evidence + append-only testi
- blocker: yok (audit/evidence=platform authority, D3); item-level evidence-taxonomy eşlemesi residual.

**`C-5D-13-incident-legal-notification`**
- outcome: Güvenlik/gizlilik olayı tespit→escalation→**yasal bildirim** (KVKK/veri-ihlali) akışı; bildirim eşiği/süresi **counsel yorumu** gerektirir (D4), uydurulmaz ([`ledger`](./enterprise-saas-human-decision-queue.md) D5 incident/escalation).
- owner: platform security/ops (incident) + counsel (legal-notification) · dataAuthority: **belirsiz** — breach-notification tetik/süre authority net değil · lifecycleAuthority: **belirsiz**
- testOracle: contract — tespit→escalation zinciri kopmaz; bildirim-gerektiren olay işaretlenir (MANUAL/CHANGESET; süre counsel'dan) · evidenceExpected: incident-drill + escalation izi
- blocker: **breach-notification eşik/süre/authority (D4 counsel)** çözülmemiş → `unresolved`; concrete bildirim süresi uydurulmaz.

**`C-5D-14-turkey-counsel-validation`**
- outcome: Türkiye-yetkili counsel pre-production/pre-sale **validation gate** (KVKK/e-imza 5070/regulated-execution sınırı); bu **AI/worker'ın geçemeyeceği** insan-uzman kapısıdır ([`ledger`](./enterprise-saas-human-decision-queue.md) D4). Regulated execution provider'a aittir (D4).
- owner: **counsel** (`validationAuthority`, insan uzman) · dataAuthority: n/a (validation kararı) · lifecycleAuthority: counsel validation lifecycle (D4)
- testOracle: MANUAL/CHANGESET — counsel imzası olmadan yüksek-risk privacy/regulated satır GA/satışa geçemez; **bu satır `passed` OLARAK İŞARETLENEMEZ** (AI validation authority değildir) · evidenceExpected: counsel review kaydı (worker üretemez)
- blocker: **counsel review üretilmedi** → `unresolved` ve kalıcı `passed` değil; worker bu kararı veremez.

## Turkey validation boundary

- **Counsel gate ≠ compliance proof:** D4 Türkiye jurisdiction kararı **hukuki uyum ispatı değildir**; Türkiye-yetkili counsel zorunlu pre-production/pre-sale validation'dır ([`ledger`](./enterprise-saas-human-decision-queue.md) D4). Bu worker jurisdiction/residency/breach-süre/lawful-basis **uydurmaz**.
- **`passed` yasağı:** `C-5D-14` ve counsel-bağımlı satırlar (`C-5D-08/10/13`) bu belgede **hiçbir koşulda `passed`/`validated` işaretlenmez** — validation authority insan counsel'dır (AI değil, [`oracles`](./enterprise-saas-phase-5-11-acceptance-oracles.md) Faz 8 no-compliance-claim).
- **Regulated execution provider'da:** payment/custody, KYC/AML, tax filing, e-sign trust (QES/ESHS), regulated e-doc, e-notary/tapu → lisanslı sağlayıcı; Commerce OS yalnız orchestration/policy/command/status/reconciliation/evidence (D4; [`adr-0030`](./adr-0030-commerce-operating-system-boundary.md) §7). `k-signature` QTSP **değildir** ([`k-signature-trust`](./k-signature-trust-directive.md) §3).
- **Standart metni yasağı:** ASVS/SSDF/OWASP/KVKK/eIDAS metni bu belgeye kopyalanmaz; yalnız Faz 8 `standard/version/controlId/evidence/waiver` referansına bırakılır ([`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) §Altın Kural / Faz 8).

## Duplicate and authority notes

- **Retention/legal-hold fold DEĞİL, cross-ref (status `unresolved`):** `C-5D-09` 5C `C-5C-07` authority'sini (platform `k-legal-hold-retention`) **yeniden atamaz**, yalnız deletion-retention oracle'ının 5D güvenlik kabulünü yazar — iki lane aynı primitifi kopyalamaz. `hold>retention>erasure` önceliği **counsel-validation hipotezidir**, tesis edilmiş emsal değildir; çatışma-önceliği owner/authority + counsel yorumu açık → `unresolved`.
- **Authn ≠ 5B identity-proofing:** `C-5D-03` enforcement/negatif-test lensidir; identity proofing/federation derinliği 5B lane'idir — sınır referansı, fold DEĞİL.
- **Authz enforcement ≠ SoD:** `C-5D-04` (PDP deny-by-default runtime kararı) ve `C-5D-11` (duty-matrix/toxic-combination policy) ayrı eksen, ayrı outcome.
- **Secrets ≠ signature-trust:** `C-5D-05` (KMS secret/key) ve QES/ESHS (`k-signature`, provider/regulated) ayrıktır; `k-kms` anahtarı saklar, QTSP değildir.
- **Ambiguous authority = unresolved (icat yasak):** `C-5D-05/07/08/10/11/13/14` owner veya lifecycle contract'ta net olmadığı için `unresolved`+`blocker`; canonical owner, concrete SLA/residency/breach-süre/lawful-basis **uydurulmaz** ([`../AGENTS.md`](../AGENTS.md) §4.4).
- **4 zorunlu oracle yazıldı:** tenant leakage (`C-5D-02`), key loss (`C-5D-05`), plugin exfiltration (`C-5D-06`), deletion-retention conflict (`C-5D-09`) — açık oracle olarak ([`oracles`](./enterprise-saas-phase-5-11-acceptance-oracles.md) §probe 1/5/6/9).
- **No module promotion:** 14 adayın hiçbiri app/module/BC düğümü açmaz; her biri paylaşılan platform primitifine veya mevcut core-7-BC domain kaydına referans verir; primitif Commerce OS'a kopyalanmaz.

## Red to green checks

| Kontrol | Tür | Sonuç |
|---|---|---|
| Required H2 (7, sırayla) | AUTO (metin taraması) | 7/7 mevcut, sırada — reviewer/CI teyidine açık |
| Aday satır ≥ 10 | AUTO | 14 aday (`C-5D-01…14`) |
| Her satır 11 alan **veya** `unresolved`+`blocker` | AUTO/MANUAL | tüm satırlar 11 alan; `unresolved` (05/07/08/09/10/11/13/14) blocker taşır |
| Zorunlu tenant-leakage oracle | AUTO | `C-5D-02` (cross-tenant escape) |
| Zorunlu key-loss oracle | AUTO | `C-5D-05` (crypto-shred, fail-closed, no plaintext fallback) |
| Zorunlu plugin-exfiltration oracle | AUTO | `C-5D-06` (sandbox exfiltration negatif suite) |
| Zorunlu deletion-retention/legal-hold oracle | AUTO | `C-5D-09` (hold>retention>erasure **hipotez**, cross-ref 5C; status `unresolved`) |
| Ambiguous authority → unresolved | AUTO | key-loss/vuln-SLA/consent/residency/SoD/breach/counsel + deletion-disposition çatışma-önceliği belirsiz → `unresolved` |
| Counsel satırı `passed` DEĞİL | AUTO/MANUAL | `C-5D-14` + §Turkey validation boundary: `passed` yasak, authority=counsel |
| Standart metni kopyalanmadı | AUTO/MANUAL | ASVS/SSDF/KVKK/eIDAS referans; Faz 8 crosswalk'a bırakıldı |
| Compliance/GA iddiası yok | AUTO | negatif oracle/drill kanıtı bekler; "uyumlu/enterprise-ready" iddiası yok |
| Sadece 2 sıralı iş (A5D, V5D), paralel iddia yok | AUTO | Execution record: 2/2 sequential |
| Platform güvenlik-primitif owner; Commerce OS özne/tüketici | AUTO/MANUAL | §matrix owner=platform; cross-write yok (D3) |
| No module/app creation | AUTO | §notes "No module promotion"; TaskNode alanı/level/faz icat edilmedi |
| In-branch relative link target | MANUAL/CHANGESET | tüm link repo-relative; hedef Glob/Read ile doğrulandı; Codex teyidine açık |
| Line budget ≤ 220 | AUTO | bu dosya ≤ 220 satır |

Not: Repo CI kapıları (`qa:*`, `npm test`, e2e) bu worker tarafından **koşulmadı**; Codex'in bağımsız doğrulamasına aittir. Yeni makine gate/test/kod **yazılmadı** (kapsam dışı).

## Lane decision

- Bu çıktı **Phase 5D security/privacy/compliance candidate completeness matrisidir**; requirement/backlog/node/app/module/queue/schema/gate/kod/test DEĞİL ve implementasyon/baseline/uyumluluk kanıtı değildir.
- 14 aday üretildi; tenant-isolation/authn/authz/KMS/module-trust/audit/evidence/retention/privacy **primitifleri platform/kernel-owned**, Commerce OS core-7-BC yalnız **özne/tüketici** — hiçbir primitif Commerce OS-owned yapılmadı (D3 birebir), cross-write yazılmadı.
- Owner/authority belirsiz olanlar (key-loss recovery, vuln-SLA, consent/lawful-basis, residency-lineage, SoD duty-matrix, breach-notification, deletion/disposition çatışma-önceliği, counsel) `unresolved`+`blocker` bırakıldı — canonical owner, concrete SLA/süre/residency **uydurulmadı**, promote edilmedi.
- **4 zorunlu oracle** karşılandı: tenant leakage (`C-5D-02`), key loss (`C-5D-05`), plugin exfiltration (`C-5D-06`), deletion-retention conflict (`C-5D-09`).
- **Türkiye counsel validation (`C-5D-14`) `passed` işaretlenmedi**; counsel-bağımlı satırlar (08/09/10/13) da `passed` değil — validation authority insan counsel'dır (D4); `C-5D-09` `hold>retention>erasure` önceliği emsal değil counsel-validation hipotezidir. Standart metni kopyalanmadı; uyumluluk/GA iddiası yapılmadı.
- Stop-gate ihlali: **yok** (sayı hedefi yapılmadı; güvenlik primitifi Commerce OS-owned yapılmadı; cross-write/primitif kopyası yok; app/module açılmadı; jurisdiction/SLA/breach-süre uydurulmadı; counsel `passed` denmedi).
- Yazılan tek izinli dosya: `docs/enterprise-saas-phase-5d-security-privacy-compliance-candidates.md`. Diğer 5A–5H shard'ları, kanon dokümanlar ve sibling worktree **değişmedi**. Commit/push/PR/deploy **yapılmadı**.
- **Faz 5D GO/NO-GO ve kalan dalgalar → Codex'e ait.** Bu worker 5D candidate matrisini üretti ve **durur**; Codex bağımsız doğrulamadan bu çıktı tamamlanmış sayılmaz.
