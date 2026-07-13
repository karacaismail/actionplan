# Enterprise SaaS — Faz 10 İnsan Karar Denetimi (Human Decision Audit)

**Güncel durum:** D7–D13 [`ADR-0031`](./adr-0031-commerce-os-vibecoder-handoff-decisions.md) ile insan-yetkili olarak **CLOSED**. Aşağıdaki OPEN kayıtları karar öncesi tarihsel denetim snapshot'ıdır; güncel durum için bu dosyanın kapanış addendum'u ve [`ledger`](./enterprise-saas-human-decision-queue.md) kullanılır.

**Rol:** Claude SLAVE writer. Codex MASTER + nihai otorite ve doğrulayıcı.
**Faz:** Faz 10 insan karar kapısı ([`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) Faz 10; [`oracles`](./enterprise-saas-phase-5-11-acceptance-oracles.md) §Faz 10). Faz 9 adversarial review → **YAYIN NO-GO** sonrası ([`phase9`](./enterprise-saas-phase-9-adversarial-review.md) §Stop-gate).
**Tarih:** 2026-07-13 · **Durum:** TARİHSEL DENETİM + GÜNCEL CLOSED ADDENDUM.

> **Tarihsel dürüstlük.** Bu belge karar öncesi denetimdir; requirement/backlog/node/app/module/queue/schema/gate/kod/test veya implementasyon kanıtı değildir. Gövdedeki D7–D13 OPEN ifadeleri o anın snapshot'ıdır. İnsan daha sonra Codex MASTER'a bu analizde gereken kararları uygulama yetkisi verdi ve ADR-0031 ile kapattı; Claude karar vermedi.

## Execution record

Gerçek concurrency kullanılmadı; dosya-sahipliği çakışmasını önlemek için **5 bounded görev SIRALI** yürütüldü (H10-01..H10-05); paralellik/sub-agent iddiası yoktur. Tek yazar/entegrasyon adımı yalnız bu belge ve ledger addendum'udur.

| Görev | Lane türü | Kapsam | Çıktı |
|---|---|---|---|
| `H10-01` | decision filter | Faz 9 unresolved register (10) + duplicate/cycle raporu → gerçek yön-değiştiren kararların süzülmesi | §Karar süzgeci |
| `H10-02` | architecture | design-time cycle çözümü + lifecycle/event semantiği | D7 · D10 |
| `H10-03` | authority | export bundle/disposition · metadata-upgrade & backup/restore authority · provisional BC yönü | D8 · D9 · D11 |
| `H10-04` | commercial/governance | AI yüksek-risk human-review eşiği/owner · pilot doğrulama zarfı | D12 · D13 |
| `H10-05` | audit writer | bu denetim + ledger D7–D13 addendum (tek yazar) | Bu dosya |

Girdi/HEAD: `6900d38`, branch `codex/enterprise-saas-requirements-2026-07-13`. Okunan kanon: [`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md), [`phase9`](./enterprise-saas-phase-9-adversarial-review.md), [`ledger`](./enterprise-saas-human-decision-queue.md), [`integration`](./enterprise-saas-phase-5-integration-decision.md), [`probes`](./enterprise-saas-phase-6-unknown-unknown-probes.md), [`traceability`](./enterprise-saas-phase-7-traceability-baseline.md), [`crosswalk`](./enterprise-saas-phase-8-control-crosswalk.md), [`composition`](./enterprise-saas-product-family-composition.md), [`ontology`](./enterprise-saas-capability-ontology.md).

## Karar süzgeci (H10-01)

Faz 9 `Unresolved decision register` **10 madde** taşıyordu ([`phase9`](./enterprise-saas-phase-9-adversarial-review.md) §Unresolved). Süzgeç kriteri: bir madde ancak **ürün/mimari yönünü değiştiren, geri dönüşü maliyetli bir insan seçimi** ise Faz 10 kararıdır; salt kanıt/ölçüm/hukuki-yorum bekleyen madde **karar değil, evidence gate**'tir. Sonuç: 10 madde → **7 karar (D7–D13)** + **2 evidence gate** + **1 folded**.

| Faz 9 register | Sınıf | Yön |
|---|---|---|
| 1 design-time cycle çözüm seçeneği | KARAR | **D7** (publication blocker) |
| 2 cancellation/refund/reservation compensation + event owner | KARAR | **D10** |
| 3 canonical export bundle + deletion/disposition owner | KARAR | **D8** |
| 4 metadata-upgrade gate owner | KARAR | **D9** |
| 5 backup/restore consistency + crypto-shred authority | KARAR | **D9** |
| 6 cost/COGS/AI-spend allocation owner | FOLDED | §Karar-dışı — budget-stop settled; allocation ayrık, açık |
| 7 AI yüksek-risk human-review eşiği | KARAR | **D12** |
| 8 Channel & Classifieds (+Recommerce) independent-policy/authority | KARAR | **D11** |
| 9 availability/absolute latency ölçüm bağlamı | KARAR | **D13** |
| 10 Türkiye counsel retention/legal-hold precedence + regulated-role drift | EVIDENCE GATE | §Karar-dışı — D4 counsel-owned |

## Karar-dışı bırakılanlar (evidence gate ≠ yeni ürün kararı)

- **Counsel validation (D4):** retention/legal-hold precedence, regulated-role drift ve KVKK/residency yorumu **Türkiye-yetkili counsel** insan yetkisindedir; bu **açık evidence/validation gate**'tir, yeni ürün-yön kararı değildir. AI hukuki sonuç üretmez ([`probes`](./enterprise-saas-phase-6-unknown-unknown-probes.md) P6-09/P6-12; [`crosswalk`](./enterprise-saas-phase-8-control-crosswalk.md) §Counsel sınırı).
- **Runtime probe sonuçları:** 14/14 probe **NOT-RUN/UNRESOLVED**'dır ([`probes`](./enterprise-saas-phase-6-unknown-unknown-probes.md)); gerçek drill kanıtı **evidence gate**'tir, karar değildir. Hiçbir `confirmed/rejected` yön kararı olarak sunulmaz.
- **Cost/COGS/AI-spend allocation (folded):** fail-closed budget/iteration-stop **zaten platform güvenlik primitifi** olarak yerleşiktir (settled, [`phase9`](./enterprise-saas-phase-9-adversarial-review.md) F9-15). Cost-attribution/allocation **owner'ı ayrık ve `unresolved`**'dır ([`integration`](./enterprise-saas-phase-5-integration-decision.md) §Cross-lane); bu bir muhasebe/atıf sorusudur, yön-değiştiren D-kararı değildir ve D12 içinde ayrık not edilir.

## Tarihsel açık kararlar (D7–D13) — karar öncesi snapshot

Bu bölümdeki her kayıt karar anında **Status OPEN** idi. Güncel status CLOSED'dur; çözüm kapanış addendum'undadır.

**D7 — Design-time cycle çözümü (architecture)**
- **id / Status:** `D7-design-time-cycle-resolution` · **OPEN** · **PUBLICATION BLOCKER**.
- **Options:** (a) **contract extraction** — döngü kenarını ayrı sürümlü contract'a çıkar; (b) **dependency inversion** — publisher/subscriber yönünü tersine çevir; (c) **authority/event semantic redesign** — event sahipliği/semantiğini yeniden tasarla. Yalnız "async" demek kenarı kırmaz.
- **Trade-off:** (a) hızlı fakat contract yüzeyini büyütür; (b) yön netliği fakat coupling yeniden dağılır; (c) en temiz fakat en pahalı/geniş revizyon.
- **Affected:** iki döngü — Order→Inventory→Cart→Order ve Order→Fulfillment→Payment→Order ([`phase9`](./enterprise-saas-phase-9-adversarial-review.md) §Cycle report); [`BC map`](./commerce-os-bounded-context-map.md), [`ontology`](./enterprise-saas-capability-ontology.md); C-5F-01/02, P6-13.
- **Default-if-deferred:** **yayın BLOKE kalır** (NO-GO); canonical BC map değiştirilmez, cycle çözülmez.
- **Irreversible cost:** yanlış decompose edilen event contract baseline sonrası dondurulur; sürümlü dış sözleşmede geri alması pahalıdır.
- **Recommended evidence:** revize kenar kümesi + **yeniden cycle-check (design-time DAG döngüsüz)** + contract test tasarımı.
- **Owner / validationAuthority:** platform + Commerce OS architecture authority (D3) + Codex.

**D10 — Lifecycle compensation / event semantic contract (architecture)**
- **id / Status:** `D10-lifecycle-compensation-event-semantics` · **OPEN**.
- **Options:** (a) her BC için açık compensation contract + terminal-event tüketicileri tanımla; (b) **Cart intent vs Order event** sahipliğini ayır; (c) saga/orchestration owner ata. D7 ile etkileşir.
- **Trade-off:** açık contract güvenlik verir fakat yüzey artar; intent/event ayrımı netlik verir fakat çift-model riski taşır.
- **Affected:** `OrderCancelled` compensation tüketicileri, reservation expiry/release + idempotency, refund/adjustment tüketicileri, `OrderPlaced` semantic owner ([`phase9`](./enterprise-saas-phase-9-adversarial-review.md) F9-03/04/05/06); [`BC map`](./commerce-os-bounded-context-map.md); C-5F-01/02, P6-13.
- **Default-if-deferred:** cancellation/refund/reservation semantiği tanımsız; lifecycle boşlukları açık kalır.
- **Irreversible cost:** event sahipliği/semantiği yayınlanan contract'a gömülür; tüketici çoğaldıkça geri alınamaz.
- **Recommended evidence:** lifecycle contract tasarımı + replay/idempotency property tasarımı (P6-13).
- **Owner / validationAuthority:** Commerce OS domain authority (D3) + Codex.

**D8 — Canonical tenant export/portability bundle + deletion/disposition attestation owner (authority)**
- **id / Status:** `D8-export-bundle-disposition-owner` · **OPEN**.
- **Options:** (a) **platform primitive** canonical bundle'ı sahiplenir; (b) **Commerce OS domain** sahiplenir; (c) **explicit split** — platform bundle formatı/taşıyıcısı + domain payload authority. Provider-exit ile tenant-export ortak canonical bundle contract'ına bağlanır.
- **Trade-off:** platform tek format verir fakat domain semantiğini inceltebilir; domain sahipliği anlamlı fakat çoğaltma/mükerrer owner riski; split netlik fakat iki-owner koordinasyonu.
- **Affected:** C-5C-07/09, C-5F-10, C-5A-09 ([`integration`](./enterprise-saas-phase-5-integration-decision.md) §Duplicate; [`phase9`](./enterprise-saas-phase-9-adversarial-review.md) F9-16); P6-11.
- **Default-if-deferred:** duplicate/`unresolved` owner sürer; export/disposition **baselineable değil**.
- **Irreversible cost:** bundle formatı **dış müşteri-exit contract'ıdır**; yanlış owner formatı kilitler, lock-in üretir.
- **Recommended evidence:** round-trip diff + **counsel/retention-yönetişimli deletion/disposition attestation** drill (P6-11). Bare deletion-certificate authority resolved sunulmaz.
- **Owner / validationAuthority:** data/exit owner + **Türkiye counsel (D4)** disposition için.

**D9 — Metadata-upgrade gate + backup/restore data-consistency authority (authority)**
- **id / Status:** `D9-metadata-upgrade-and-restore-authority` · **OPEN**.
- **Options:** (a) **tek** migration/data-consistency authority hem metadata-upgrade gate'ini hem backup/restore consistency + crypto-shred'i sahiplenir; (b) **split** — metadata-upgrade gate (schema evolution) ayrı, backup/restore consistency + crypto-shred authority ayrı. **Split önerilir**: irreversibility farklıdır — metadata-upgrade expand-contract ile **geri alınabilir**, crypto-shred/erasure **geri alınamaz**.
- **Trade-off:** tek-owner basitlik fakat farklı-risk eksenini tek gate'e sıkıştırır; split doğru sorumluluk fakat iki authority sınırı.
- **Affected:** C-5C-03/02/10, C-5E-11/04, C-5F-08 ([`phase9`](./enterprise-saas-phase-9-adversarial-review.md) F9-17/18); P6-14 (upgrade), P6-04 (restore).
- **Default-if-deferred:** gate owner'sız → upgrade blast radius sınırsız; restore consistency authority açık.
- **Irreversible cost:** crypto-shred/erasure **kalıcı veri kaybı**; yanlış consistency authority restore'da veri kaybı riski.
- **Recommended evidence:** compatibility matrix + canary + rollback rehearsal (P6-14); clean-room restore drill + ölçülen RPO/RTO (P6-04).
- **Owner / validationAuthority:** migration owner (metadata) + data/DR authority (restore) + Codex.

**D11 — Provisional BC yönü: Channel / Classifieds / Recommerce (authority)**
- **id / Status:** `D11-provisional-bc-direction` · **OPEN**.
- **Options:** her BC için (a) `KEEP PROVISIONAL` (bağımsız authority hipotezini Faz 6/7 kanıtına taşı); (b) `DEMOTE` (core/platform authority'ye feature/policy/config olarak katla); (c) `UNRESOLVED-hold`. **Kısıt:** Classifieds **REOC Property/Listing authority'sini alamaz** (D1 sınırı); Recommerce asset/provenance owner karar-grade değil; Channel demote + detay `UNRESOLVED`.
- **Trade-off:** promote esneklik fakat module/authority sınırı yaratır (geri alması zor); demote sadelik fakat bağımsız-policy kaybı.
- **Affected:** [`composition`](./enterprise-saas-product-family-composition.md), [`integration`](./enterprise-saas-phase-5-integration-decision.md) §Provisional BC, [`ontology`](./enterprise-saas-capability-ontology.md) ([`phase9`](./enterprise-saas-phase-9-adversarial-review.md) F9-02/22).
- **Default-if-deferred:** üçü `UNRESOLVED` kalır; module değildir, promote edilmez.
- **Irreversible cost:** bağımsız BC'ye terfi authority/module sınırı yaratır; yanlış yön **REOC scope sızıntısı** riski.
- **Recommended evidence:** owner/data/lifecycle/independent-policy **re-pass** (Faz 5 testi) + insan sınır-onayı.
- **Owner / validationAuthority:** Admin/Owner (product) + platform/Commerce OS authority.

**D12 — AI yüksek-risk human-review eşik matrisi + accountable owner (governance)**
- **id / Status:** `D12-ai-high-risk-review-threshold-owner` · **OPEN**.
- **Options:** (a) **item-level yüksek-risk review eşik matrisi**, tek accountable AI-governance owner; (b) per-use-case owner. Auto-degrade/abstain otomatik fail-safe; **model/version rollback insan-gated** (settled, F9-14). **Budget-stop zaten platform güvenliği** (settled); **cost attribution ayrık ve `unresolved`** (bu kararın parçası değil).
- **Trade-off:** merkezi eşik tutarlılık fakat esneklik kaybı; per-use-case granülerlik fakat sahiplik dağılır.
- **Affected:** C-5H-09 (residual), C-5H-06 ([`traceability`](./enterprise-saas-phase-7-traceability-baseline.md) §Non-probe residual); [`ai-governance`](./ai-governance-master.md); P6-07/08.
- **Default-if-deferred:** yüksek-risk AI yayın-öncesi onay için **accountable owner yok** → güvensiz karar riski.
- **Irreversible cost:** eşiksiz/yanlış human-review pilotta hatalı AI kararlarını sessiz geçirir (müşteri güveni).
- **Recommended evidence:** eşik matrisi tasarımı + human-override drill (P6-07); prompt/indirect-injection + PII-redaction negatif suite.
- **Owner / validationAuthority:** AI governance owner + human override + Codex.

**D13 — D6 hedefleri için pilot doğrulama zarfı (commercial/governance)**
- **id / Status:** `D13-pilot-validation-envelope` · **OPEN**. **D6 sayısal hedeflerini DEĞİŞTİRMEZ.**
- **Options:** (a) **tek referans zarf** — reference workload + region + tenant size/mix + provider dependency + measurement window; (b) hedef-başına ayrı zarf. Zarf yalnız D6 sayılarını **ölçülebilir** kılar, yeni sayı üretmez.
- **Trade-off:** tek zarf karşılaştırılabilirlik fakat kenar-yükleri kaçırabilir; çoklu zarf isabet fakat yönetim yükü.
- **Affected:** C-5E-01 (availability/error-budget), C-5E-02 (mutlak p95/load) ([`probes`](./enterprise-saas-phase-6-unknown-unknown-probes.md) §Deferred; [`phase9`](./enterprise-saas-phase-9-adversarial-review.md) F9-10/19); D6; P6-02/04.
- **Default-if-deferred:** sayılar bağlamsız → ölçülemez, baselineable değil; SLO/COGS kanıtı geçersiz.
- **Irreversible cost:** düşük (ölçüm tanımı), fakat yanlış zarf tüm SLO/COGS kanıtını geçersiz kılar.
- **Recommended evidence:** tanımlı zarf + gerçek yük altında ölçülen SLO/COGS (P6-02/04) + per-tenant cost attribution.
- **Owner / validationAuthority:** reliability/ops owner + finans/operating + product (D6 sahipleri).

## Traceability — Faz 9 → Faz 10

D7↔register-1 · D8↔register-3 · D9↔register-4/5 · D10↔register-2 · D11↔register-8 · D12↔register-7 · D13↔register-9. Register-6 (cost allocation) folded; register-10 (counsel) evidence gate. Duplicate report (C-5C-09 vs C-5F-10) D8'e, cycle report D7'ye, Payment/Settlement/KPI ayrımı D10/D8 komşuluğuna bağlanır ([`phase9`](./enterprise-saas-phase-9-adversarial-review.md)).

## Red-to-green kontroller (checklist, executable gate değil)

> **Tarihsel pre-closure snapshot:** Bu checklist D7–D13 kararları verilmeden önceki RED/GREEN koşullarını gösterir. Güncel kapanış ADR-0031 addendum'undadır.

| Kontrol | Tür | Red koşulu |
|---|---|---|
| ≤10 karar; yalnız yön-değiştiren | AUTO/MANUAL | >10 veya rutin/derive-edilebilir karar |
| Her kararda 8 alan (options..owner) | AUTO | boş alan |
| Tüm D7–D13 Status = OPEN | AUTO | AI-kapatılmış `CLOSED`/`validated` iddiası |
| D7 publication blocker işaretli | AUTO | blocker eksik |
| D1–D6 CLOSED değişmedi | AUTO (`git diff` Codex'te) | closed metin/status değişimi |
| Counsel/probe = evidence gate, karar değil | MANUAL | evidence gate'i ürün kararı olarak sunma |
| Relative link hedefleri mevcut | AUTO (`git`/reviewer) | kırık/absolute link |
| Allowed-files (yalnız 2 dosya) | AUTO (`git status` Codex'te) | başka dosya/kod/schema/gate |

## Stop-gate ve Phase decision

> **Tarihsel pre-closure snapshot:** Aşağıdaki NO-GO, D7–D13 OPEN iken geçerliydi. Güncel durum instruction handoff GO; runtime/pilot/GA NO-GO'dur.

- **Yayın (publication) gate: BLOKE / NO-GO** — D7 (design-time cycle) çözülmeden yayın yok; D8–D13 açık ([`phase9`](./enterprise-saas-phase-9-adversarial-review.md) §Cycle report).
- **Development: NO-GO** — 14/14 probe NOT-RUN/UNRESOLVED; test-plan/db-schema/migration contract yok ([`traceability`](./enterprise-saas-phase-7-traceability-baseline.md)).
- **Docs-only Faz 11 blocked-readiness raporu: GO** — yalnız yayın blocker'larını ve doğrulanmış changeset'i raporlar; "yayın-ready" DEĞİL. Publication/development NO-GO kalır.
- **İnsan kararı gerekenler:** D7–D13 (7 açık karar); D7 yayın-blocker. D1–D6 CLOSED; bu belge onları yeniden açmaz. Kararı verecek yer **yalnız insandır**; bu worker yerine karar vermez.
- Yazılan izinli dosyalar: bu denetim + [`ledger`](./enterprise-saas-human-decision-queue.md) D7–D13 addendum. JSON/node/queue/schema/gate/kod/test yok; commit/push/merge yok; sibling worktree değişmedi. Codex bağımsız doğrulamadan bu çıktı tamamlanmış sayılmaz.

## ADR-0031 kapanış addendum — D7–D13 CLOSED (güncel)

**Tarih:** 2026-07-13. Yukarıdaki denetim gövdesi (D7–D13 **OPEN** olarak süzülmüş hâli) **tarihsel Faz 10 snapshot** olarak korunur ve geriye dönük değiştirilmez; bu addendum güncel kapanışı ekler.

- **Yetki:** İnsan (Owner/Admin), bu denetimdeki analizin **uygulanması ve D7–D13'ün kapatılması** yetkisini açıkça **Codex MASTER'a devretti**; kapanış [`ADR-0031`](./adr-0031-commerce-os-vibecoder-handoff-decisions.md) **ACCEPTED** ile insan-yetkilidir. Claude writer karar vermedi; yalnız kaydeder. AI insan kararını kapatamaz.
- **D7 (publication blocker) çözüldü:** contract-extraction + dependency-inversion — business BC'ler birbirini import etmez, **neutral sürümlü contract paketleri + SDK portları**na bağlanır, design-time **DAG**. Eski yayın-blocker'ı **dokümantasyon/tasarım düzeyinde** temizlendi (**runtime doğrulandı denmez**; build-enforced DAG check açık).
- **Her kararın çözümü (özet):** D8 explicit split (platform envelope/crypto/import-verify · domain payload · governance retention/disposition · audit attestation); D9 üç isimli authority (metadata/schema-evolution · data-resilience · key-management, crypto-shred governance-yetkili); D10 Cart→`CheckoutSubmitted` intent + **Order tek yazar/saga**, cross-context write yok; D11 Channel DEMOTE · Classifieds DEMOTE (optional edition, REOC authority alamaz) · Recommerce KEEP PROVISIONAL; D12 Central AI Governance accountable + domain owner, yüksek-risk öncesi zorunlu insan onayı; D13 tek parametreli referans zarf, D6 sayıları değişmedi.
- **Karar-dışı sabit:** counsel (D4) validation ve 14/14 runtime probe **açık evidence gate** kalır; kapanış bunları koşmaz. **instruction-ready ≠ runtime/GA-ready.** Tam alanlı kayıt: [`ledger`](./enterprise-saas-human-decision-queue.md) §ADR-0031 kapanış addendum.
- **Güncel karar sayısı:** 13 CLOSED (D1–D13), 0 OPEN. Bu addendum yalnız bu dosyayı güncelledi; JSON/node/queue/schema/gate/kod/test yok, commit/push/merge yok. Codex bağımsız doğrulamadan tamamlanmış sayılmaz.
