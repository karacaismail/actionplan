# Enterprise SaaS — Phase 5H AI/Data-Science Candidate Completeness Matrix

**Rol:** Claude SLAVE worker. Codex MASTER + nihai otorite.
**Faz:** 5H (AI/data-science candidate completeness). Faz 4.5 D3 (localization/integration/generic capability = platform; core-7-BC domain) + D5 (Controlled Paid Enterprise Pilot evidence controls) + D6 (build/buy/provider + bağlamlı SLO/COGS bütçesi) CLOSED çerçevesinde açıldı ([`ledger`](./enterprise-saas-human-decision-queue.md) §Newly closed decisions). Bu **onaylanabilir candidate set / domain-completeness** dokümanıdır; requirement/backlog/node/app/module/queue/schema/gate/kod/test/prompt-artifact DEĞİL ([`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) Faz 5).
**Tarih:** 2026-07-13 · **Durum:** ÖNERİ — Codex bağımsız doğrulamadan tamamlanmış sayılmaz.

> Bu belge **aday tamlık matrisidir** (AI/data-science yüzeyi), requirement listesi/backlog/prompt-metni/model-seçimi/schema değildir. **Kritik invariant:** AI **platform runtime**'ı (model/router/provider registry, prompt/tool/version registry, RAG/vector/embedding store, evaluation harness, drift/observability, agent identity/mandate, `agentPolicy`/ECA guardrail, kill-switch, cost/FinOps ölçümü) **platform/kernel owned**'dır; Commerce OS **core 7 BC** yalnız **domain use-case policy'sini, domain girdi/çıktı review'ını, domain golden-set beklentisini ve human-override semantiğini** tanımlar — jenerik AI/agent primitifini **tanımlamaz/sahiplenmez**, **tüketir** ve **hiçbir zaman source-of-truth state'i AI'ya bırakmaz** ([`ledger`](./enterprise-saas-human-decision-queue.md) D3; [`composition`](./enterprise-saas-product-family-composition.md) §Shared versus owned matrix; [`ai-gov`](./ai-governance-master.md) §2–§5; [`eca-directive`](./claude-ai-archetype-eca-directive.md) §Hard Security Boundary). **AI otonom onay veremez; doğrudan prod write yapamaz; `app`/`module`/`Actor`/`Capability`/`PDP`/`Mode-Profile`/jurisdiction/ruleset mutasyonu yasaktır** (`forbiddenTargets` `["app","module"]`; autonomy tavanı `apply-gated`, `app`/`module`=`none`; ECA zincir derinliği ≤6; kırmızı test/iterasyon ≤6 — [`../AGENTS.md`](../AGENTS.md) §4.4; [`ai-gov`](./ai-governance-master.md) §3–§9). Owner/authority belirsizse satır `unresolved`; eval/golden/drill gerektiren satır `passed`/`validated` işaretlenemez. **Enterprise-ready/GA iddiası yok** (D5). Hiçbir model/provider adı requirement DEĞİLDİR ([`ontology`](./enterprise-saas-capability-ontology.md) §provider). Hiçbir aday app/module/BC düğümüne terfi ETMEZ ([`../AGENTS.md`](../AGENTS.md) §4.4).

## Execution record

Task/sub-agent mekanizması bu ortamda **MEVCUT DEĞİL** (yalnız Bash/Read/Grep/Glob/Edit). Bu nedenle **2 iş SIRALI** yürütüldü; **paralellik/sub-agent iddiası yok**. Tek yazar/entegrasyon adımı yalnız bu dosyadır.

- Yürütülen iş sayısı: **2/2** · Mod: **sequential (mechanism unavailable)** · READ-ONLY analiz + tek yazar.
- Girdi/HEAD: branch `codex/enterprise-saas-requirements-2026-07-13`; okunan kanon (salt-okunur) [`../AGENTS.md`](../AGENTS.md) §4.4, [`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md), [`oracles`](./enterprise-saas-phase-5-11-acceptance-oracles.md) (§probe 7/8), [`ledger`](./enterprise-saas-human-decision-queue.md) (D3/D5/D6), [`composition`](./enterprise-saas-product-family-composition.md), [`constitution`](./enterprise-saas-requirement-constitution.md), [`ontology`](./enterprise-saas-capability-ontology.md), [`ai-gov`](./ai-governance-master.md), [`eca-directive`](./claude-ai-archetype-eca-directive.md), [`prompt-lib`](./prompt-template-library.md).

| # | İş | Tür | Kapsam | Yerleştiği bölüm |
|---|---|---|---|---|
| A5H | AI/data-science analyst | analyst | 14 aday: AI use-case inventory/risk, model/router/provider registry, prompt/tool/version registry, RAG/vector/embedding data-boundary, evaluation/golden-set, drift/silent-failure monitoring, privacy/data-minimization, AI budget/cost, human review/override, agent identity/mandate/spend, agent tool-permission scope, ECA runaway/depth>6/forbidden-write, explainability/decision-audit, provider exit/portability | Candidate completeness matrix |
| V5H | AI/agent-safety reviewer | reviewer | authority/dedup/fold, platform AI/agent primitif owner vs Commerce OS domain use-case/review tüketici, 2 zorunlu oracle (AI drift/silent-failure · agent/ECA runaway), ambiguous→unresolved, no autonomous approval, no direct prod write, no app/module/PDP/jurisdiction/ruleset mutasyonu, no model/provider-as-requirement, no GA claim, no cross-write, no module promotion, link/field/claim | AI and agent authority profile · Duplicate and safety notes · Red to green checks |

Sıra: **A5H → V5H** (sıralı, aynı dosya). İki iş de aynı tek dosyaya yazdı; başka lane'e paralel yazım yok.

## Lane boundary

- **scope:** AI/data-science yüzeyinin candidate completeness'ı — platform AI/agent runtime (model/router/provider/prompt/tool/RAG/eval/drift/agent-identity/`agentPolicy`/ECA/kill-switch/cost) **primitifinin** authority sınırı ve Commerce OS core-7-BC'nin **domain use-case policy + domain girdi/çıktı review + golden-set beklentisi + human-override semantiği** rolü. owner/authority/lifecycle/riskTier/testOracle belirsizse `unresolved`; eval/golden/drift/drill gerektiren satır `passed`/`validated` olamaz.
- **inputs:** yukarıdaki kanon; D3 platform/domain sınırı + D5 Pilot evidence-control + D6 build/buy/provider + bağlamlı COGS **bağlayıcı insan kararı** ([`ledger`](./enterprise-saas-human-decision-queue.md)).
- **allowed-files:** yalnız `docs/enterprise-saas-phase-5h-ai-data-science-candidates.md`. Başka dosya, JSON/node/schema/gate/kod/test/prompt-artifact yok.
- **non-goals:** requirement/backlog/module/app üretmek; AI/agent/prompt/model/RAG/eval/ECA **primitifini** yeniden yazmak veya Commerce OS-owned yapmak; `ai-governance-master`/`eca-directive`/`prompt-lib` sözleşme metnini **kopyalamak**; **prompt/model/eval-set/agent-config** üretmek; model/provider adını **requirement** yapmak; AI'ya autonomous approval/prod-write/`app`-`module`-`PDP`-jurisdiction-ruleset mutasyonu vermek; eval/golden/drift'i **koşulmuş/`validated`** saymak; concrete model/eşik/corpus **uydurmak**; module terfisi; cross-context write.
- **checks:** §Red to green checks (deterministik metin/link taraması; otomatik gate yoksa `MANUAL/CHANGESET`).
- **output:** ≥10 aday satır + **2 zorunlu oracle** (AI drift/silent-failure · agent/ECA runaway) + AI/agent authority profili + duplicate/safety notları + red/green.
- **blockers:** RAG/vector-store tenant-isolation + data-residency authority (platform vector runtime vs domain corpus) + AI cost-attribution/spend authority (platform FinOps/metering vs 5A billing vs 5E COGS) — contract'ta net owner/lifecycle yok → `unresolved` (blocker alanında).

## Candidate completeness matrix

Alan sözleşmesi (her aday): `candidateId · outcome · owner · dataAuthority · lifecycleAuthority · scopeClass · riskTier · testOracle · evidenceExpected · status · blocker` ([`constitution`](./enterprise-saas-requirement-constitution.md) §Candidate record contract). scopeClass 14-sınıf sözlüğü [`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) §1. Bir alan çözülemezse satır `unresolved` + `blocker`. AI/agent primitifleri owner=platform/kernel; Commerce OS domain kaydı use-case/review objesini tanımlar fakat primitifi **tüketir**, kopyalamaz ve source-of-truth state'i AI'ya bırakmaz.

| candidateId | scopeClass | riskTier | status |
|---|---|---|---|
| `C-5H-01-ai-use-case-inventory-risk` | policy | high | candidate |
| `C-5H-02-model-router-provider-registry` | platform capability (consumed) | high | candidate |
| `C-5H-03-prompt-tool-version-registry` | platform capability (consumed) | high | candidate |
| `C-5H-04-rag-vector-embedding-data-boundary` | platform capability (consumed) | high | unresolved |
| `C-5H-05-evaluation-golden-set` | policy | high | candidate |
| `C-5H-06-ai-drift-silent-failure-monitoring` | platform capability (consumed) | high | candidate |
| `C-5H-07-privacy-data-minimization` | NFR | high | candidate |
| `C-5H-08-ai-budget-cost-control` | policy | medium | unresolved |
| `C-5H-09-human-review-override` | policy | high | candidate |
| `C-5H-10-agent-identity-mandate-spend` | platform capability (consumed) | high | candidate |
| `C-5H-11-agent-tool-permission-scope` | platform capability (consumed) | high | candidate |
| `C-5H-12-eca-runaway-depth-forbidden-write` | platform capability (consumed) | critical | candidate |
| `C-5H-13-explainability-decision-audit` | policy | medium | candidate |
| `C-5H-14-ai-provider-exit-portability` | integration/protocol | high | candidate |

Detaylı alanlar (aynı authority'yi referansla, kopyalamaz):

**`C-5H-01-ai-use-case-inventory-risk`**
- outcome: Domain AI use-case envanteri + risk sınıflaması: her use-case (öneri, sınıflama, çıkarım, üretim/özet, çeviri-öneri) `purpose · girdi/çıktı · riskTier · human-in-loop gereği · reddine dair fallback` taşır; yüksek-risk use-case insan-review'suz yayınlanamaz. Use-case **domain policy** Commerce OS, model/inference primitifi platform.
- owner: Commerce OS domain (use-case policy) · dataAuthority: Commerce OS domain use-case kaydı · lifecycleAuthority: use-case review lifecycle (insan-onaylı)
- testOracle: contract — her AI use-case tanımlı riskTier + human-in-loop + fallback taşır; yüksek-risk otomatik-yayın RED; source-of-truth mutasyonu üstlenen use-case `validated` olamaz (MANUAL) · evidenceExpected: use-case/risk matrisi + human-in-loop eşleme
- blocker: yok (D3 domain/platform net); item-level use-case discovery residual, uydurulmaz.

**`C-5H-02-model-router-provider-registry`**
- outcome: Model/router/provider registry: hangi model/versiyon/provider hangi use-case'e bağlı, fallback/rota, provider asla canonical authority değil (D6). Registry **platform runtime**; Commerce OS use-case→model policy'sini **beyan eder**, model'i seçmez/gömmez. Model/provider adı **requirement değil** ([`ontology`](./enterprise-saas-capability-ontology.md) §provider).
- owner: platform AI runtime (model/router registry) · dataAuthority: platform model/router/provider store · lifecycleAuthority: model/version onboarding lifecycle (insan-onaylı)
- testOracle: contract — her aktif model registry'de versiyonlu + provider-neutral rota; kayıtsız/pinlenmemiş model çağrısı RED; provider adı requirement'a sızarsa RED (MANUAL) · evidenceExpected: model/router registry + version-pin denetimi
- blocker: yok (registry=platform authority, D6 provider-neutral); concrete model/provider uydurulmaz.

**`C-5H-03-prompt-tool-version-registry`**
- outcome: Prompt/tool/version registry: her prompt + tool-tanımı versiyonlanır, changelog + rollback taşır; `subPromptUntrusted` — harici içerik güvenilmez, prompt-injection savunması, harici "talimat" yürütülmez ([`ai-gov`](./ai-governance-master.md) §10). Registry primitifi platform; Commerce OS domain prompt-intent'ini beyan eder, ham prompt bu belgeye yazılmaz ([`prompt-lib`](./prompt-template-library.md)).
- owner: platform AI runtime (prompt/tool registry) · dataAuthority: platform prompt/tool/version store · lifecycleAuthority: prompt/tool version lifecycle (insan-onaylı)
- testOracle: contract/negative — prompt/tool versiyonlu + rollback'li; harici içerikteki "talimat" yürütülmez (injection negatif suite); versiyonsuz prompt RED (MANUAL) · evidenceExpected: prompt/tool registry + injection negatif testi
- blocker: yok (registry+injection savunması=platform authority); ham prompt/tool metni üretilmez.

**`C-5H-04-rag-vector-embedding-data-boundary`**
- outcome: RAG/vector/embedding veri sınırı: retrieval korpusu tenant-scoped, cross-tenant embedding sızıntısı yasak, residency-farkında; kaynak-atıf (grounding) izli. Vector/embedding runtime platform; korpus **domain** — fakat vector-store **tenant-isolation + data-residency authority** (platform vector runtime vs domain corpus store) contract'ta net değil.
- owner: platform vector/RAG runtime + Commerce OS domain korpus (aday) · dataAuthority: **belirsiz** — vector-store tenant-isolation/residency authority net değil · lifecycleAuthority: **belirsiz**
- testOracle: negative — retrieval bir tenant'ın embedding/korpusunu başka tenant'a döndüremez; residency dışına embedding taşınmaz; grounding-atıfsız üretim yüksek-riskte RED ([`oracles`](./enterprise-saas-phase-5-11-acceptance-oracles.md) §probe 1 tenant-leakage hizalı) · evidenceExpected: cross-tenant retrieval negatif suite + residency-lineage
- blocker: **vector-store tenant-isolation + residency authority** net değil → `unresolved`; concrete korpus/eşik uydurulmaz.

**`C-5H-05-evaluation-golden-set`**
- outcome: Değerlendirme + golden-set: her domain use-case için beklenen-çıktı golden set + offline eval (accuracy/hallucination/toxicity/format), release öncesi eval eşiği; eşik altı model/prompt yayınlanamaz. Golden-set **domain beklentisi** Commerce OS, eval harness platform.
- owner: Commerce OS domain (golden-set beklentisi) + platform eval harness · dataAuthority: platform eval/score store + Commerce OS golden-set kaydı · lifecycleAuthority: eval/golden-set review lifecycle (insan-onaylı)
- testOracle: contract — model/prompt değişimi eval eşiğini geçmeden yayınlanamaz; golden-set'siz use-case `validated` olamaz; eval skoru uydurulamaz (MANUAL) · evidenceExpected: golden-set + offline eval raporu (eşik)
- blocker: yok (yaklaşım net); eval **koşulmadı** — Codex residual, `passed`/`validated` uydurulmaz.

**`C-5H-06-ai-drift-silent-failure-monitoring`**
- outcome: Drift + sessiz-hata izleme: online kalite/latency/refusal/hallucination sinyali, distribution-drift alarmı, sessiz bozulma (boş/uydurma/format-kırılma) fail-closed; sessiz yutma yok. İzleme primitifi platform observability (5E hizalı); domain kalite-sinyali Commerce OS beyan eder. **Ayrım (bağlayıcı):** eşik aşımında **auto-degrade / abstain / otomatik-güven-düşürme** otomatik fail-safe olabilir (insan gerektirmez); ancak **model/version rollback (sürüm geri-alma) insan-gated** — AI kendi model sürümünü otonom geri alamaz/terfi ettiremez ([`ai-gov`](./ai-governance-master.md) §11; [`../AGENTS.md`](../AGENTS.md) §4.4).
- owner: platform AI observability/drift runtime · dataAuthority: platform AI metrics/drift store · lifecycleAuthority: drift-alarm + auto-degrade/abstain lifecycle (otomatik) · **model/version rollback lifecycle = insan-gated**
- testOracle: **zorunlu — AI drift / silent failure:** kalite/dağılım eşiği aşılınca alarm + degraded-mode + auto-degrade/abstain (otomatik fail-safe) tetiklenir; boş/uydurma/format-kırık çıktı sessiz geçilmez → RED; drift'te otomatik güven düşürülür; **model/version rollback insan-onayı ister, AI otonom sürüm-rollback yapamaz** ([`oracles`](./enterprise-saas-phase-5-11-acceptance-oracles.md) §probe 7) · evidenceExpected: drift-alarm + auto-degrade/abstain + silent-failure negatif drill logu + insan-gated rollback izi
- blocker: yok (AI observability=platform authority, 5E hizalı); drill **koşulmadı** — `passed` uydurulmaz.

**`C-5H-07-privacy-data-minimization`**
- outcome: Gizlilik + veri-minimizasyonu: AI girdisinde PII minimizasyon/maskeleme, amaç-sınırlama, training/inference'a domain veri kullanım consent'i, provider'a giden veri sözleşmeli (no-training/no-retention beyanı beklenir); KVKK/GDPR ile hizalı. Politika 5D privacy ile cross-ref (fold DEĞİL).
- owner: platform AI runtime (veri-akış guardrail) + Commerce OS domain veri-sınıfı · dataAuthority: platform AI I/O redaction + Commerce OS veri-sınıf kaydı · lifecycleAuthority: AI privacy-policy lifecycle
- testOracle: negative — AI girdisi maskesiz PII/secret sızdıramaz; consent'siz domain veri modele gitmez; provider'a residency/consent dışı veri akışı RED (MANUAL; 5D `C-5D-*` privacy cross-ref) · evidenceExpected: PII-redaction + consent/veri-akış denetimi
- blocker: yok (I/O guardrail=platform authority); provider data-processing sözleşme derinliği counsel/5D residual.

**`C-5H-08-ai-budget-cost-control`**
- outcome: AI bütçe/maliyet kontrolü **iki ayrık eksen taşır:** (1) **fail-closed budget/iterasyon-stop mekaniği = platform-owned** — per-use-case/per-tenant token+inference bütçesi + iterasyon tavanı aşımında ajan/çağrı **otomatik durur** (`agentPolicy`/ECA runtime, platform authority; owner net); (2) **cost-attribution/allocation** — hangi maliyetin hangi tenant/use-case/BC'ye atfedileceği **authority** (platform FinOps/metering vs 5A billing/usage-metering vs 5E COGS) contract'ta net **değil**. Row yalnız **(2) allocation authority** yüzünden `unresolved`; (1) budget-stop mekaniği belirsiz değildir ([`ai-gov`](./ai-governance-master.md) §8).
- owner: **budget/iterasyon-stop mekaniği = platform `agentPolicy`/AI-metering runtime (net)** · **cost-attribution/allocation = belirsiz** — AI-spend attribution authority net değil (5A/5E sınırı) · dataAuthority: platform budget/token-usage store (mekanik net); **attribution/allocation authority belirsiz** · lifecycleAuthority: platform budget-stop lifecycle (net); **cost-allocation lifecycle belirsiz**
- testOracle: contract — bütçe/iterasyon aşımı çağrı/ajanı **fail-closed durdurur** (platform-owned, deterministik); ölçülmemiş "ucuz" iddiası yok; cost-attribution/COGS bağlam notuyla raporlanır fakat allocation authority çözülene kadar `validated` değil (MANUAL/CHANGESET; 5E `C-5E-10` cross-ref) · evidenceExpected: budget/iterasyon-stop testi (platform) + AI-spend attribution (bağlamlı, authority açık)
- blocker: **yalnız cost-attribution/allocation authority + 5A/5E sınırı** net değil → row `unresolved`; **fail-closed budget/iterasyon-stop mekaniği platform-owned ve blocker DEĞİL**; maliyet sayıları gerçek ölçüm ister, uydurulmaz.

**`C-5H-09-human-review-override`**
- outcome: İnsan review/override: yüksek-risk AI çıktısı yayından önce insan-onay; her AI önerisi reddedilebilir/düzeltilebilir; **AI otonom onay veremez, merge=insan** ([`ai-gov`](./ai-governance-master.md) §11). Override semantiği domain Commerce OS, onay kapısı platform-enforced.
- owner: Commerce OS domain (override semantiği) + platform review/gate · dataAuthority: Commerce OS domain review/override kaydı · lifecycleAuthority: review/override lifecycle (insan-onaylı)
- testOracle: contract/negative — yüksek-risk AI çıktısı insan-onaysız yayınlanamaz; AI kendi çıktısını onaylayamaz (autonomous-approval RED); override izli (MANUAL) · evidenceExpected: human-in-loop gate + override audit izi
- blocker: yok (merge=insan, D3/AGENTS); item-level review eşik matrisi residual.

**`C-5H-10-agent-identity-mandate-spend`**
- outcome: Agent kimlik/mandate/spend: her ajan tekil kimlik (`k-identity`), yetki mandate'i (autonomy tavanı `apply-gated`, `app`/`module`=`none`), spend/iterasyon bütçesi, kill-switch (insan-only). Ajan kendi kill-switch'ini/mandate'ini yükseltemez ([`ai-gov`](./ai-governance-master.md) §4/§8/§9; [`../AGENTS.md`](../AGENTS.md) §4.4). Primitif platform.
- owner: platform IAM + `agentPolicy` runtime · dataAuthority: platform agent-identity/policy store · lifecycleAuthority: agent mandate/policy lifecycle (insan-onaylı)
- testOracle: negative — ajan mandate/autonomy'sini yükseltemez; kill-switch'i kapatamaz; `app`/`module` autonomy ≠ `none` ise RED; kimliksiz ajan çağrısı RED (MANUAL) · evidenceExpected: agentPolicy denetimi + kill-switch/mandate negatif suite
- blocker: yok (agent-identity/policy=platform authority); `agentPolicy` şeması bu belgede üretilmez.

**`C-5H-11-agent-tool-permission-scope`**
- outcome: Agent tool-izin scope'u: ajanın erişebildiği tool/veri **allow-list**, deny-by-default; tool çağrısı PDP-gated + audit; ajan kapsam dışı tool/veri erişemez, secret gömemez ([`ai-gov`](./ai-governance-master.md) §5/§10; [`eca-directive`](./claude-ai-archetype-eca-directive.md) §Advanced). Primitif platform.
- owner: platform `agentPolicy`/PDP + tool-broker · dataAuthority: platform tool-permission/allow-list store · lifecycleAuthority: tool-permission lifecycle (insan-onaylı)
- testOracle: negative — ajan allow-list dışı tool/veri çağıramaz (deny-by-default); PDP-gated + audit'siz tool çağrısı RED; secret sızıntısı RED (MANUAL) · evidenceExpected: tool-permission negatif suite + audit izi
- blocker: yok (tool-permission=platform authority, deny-by-default); allow-list içeriği item-level residual.

**`C-5H-12-eca-runaway-depth-forbidden-write`**
- outcome: ECA/agent runaway sınırı: ECA zincir derinliği ≤6, kırmızı-test iterasyonu ≤6, sonra insan-devir; **forbidden write** — `app`/`module`/`Actor`/`Capability`/`PDP`/`Mode-Profile`/jurisdiction/ruleset/prod mutasyonu deny; human-stop/kill-switch bypass edilemez ([`ai-gov`](./ai-governance-master.md) §5/§8; [`eca-directive`](./claude-ai-archetype-eca-directive.md) §Advanced; [`../AGENTS.md`](../AGENTS.md) §4.4). Primitif platform ECA/engine.
- owner: platform ECA/engine (`agentPolicy`/ruleset) · dataAuthority: platform ecaRules/deny-rule store · lifecycleAuthority: ruleset/ECA lifecycle (insan-onaylı, AI override edemez)
- testOracle: **zorunlu — agent / ECA runaway:** derinlik>6 zincir durur; `app`/`module`/`PDP`/jurisdiction/ruleset/prod write denenirse deny; human-stop/kill-switch bypass edilemez → hepsi RED-on-attempt ([`oracles`](./enterprise-saas-phase-5-11-acceptance-oracles.md) §probe 8) · evidenceExpected: depth-cap + forbidden-write + human-stop bypass negatif drill logu
- blocker: yok (ECA/ruleset=platform authority, AI override yasak); drill **koşulmadı** — `passed` uydurulmaz.

**`C-5H-13-explainability-decision-audit`**
- outcome: Açıklanabilirlik + karar-audit: her AI-etkili karar `model/prompt/version · girdi-özet · çıktı · confidence · human-override` ile izli, reprodüksiyona yeter; kara-kutu otomatik-aksiyon audit'siz olamaz. Audit envelope primitifi platform; domain karar-semantiği Commerce OS.
- owner: platform audit/observability + Commerce OS domain karar semantiği · dataAuthority: platform AI-decision audit store · lifecycleAuthority: audit/retention lifecycle
- testOracle: contract — AI-etkili karar model/prompt-version + girdi/çıktı + override ile izli; audit'siz otomatik-aksiyon RED; izsiz karar `validated` olamaz (MANUAL) · evidenceExpected: AI-decision audit envelope örneği
- blocker: yok (audit=platform authority); item-level explainability derinliği residual.

**`C-5H-14-ai-provider-exit-portability`**
- outcome: AI provider exit/portability: model/embedding provider değiştirilebilir, vektör/prompt/eval-set taşınabilir, provider kilitlemesi yok, degraded-mode fallback; provider asla canonical authority değil (D6). Reliability degraded-mode 5E `C-5E-12`, port sözleşme derinliği 5F cross-ref (fold DEĞİL).
- owner: Commerce OS provider-port sahibi + platform AI integration (aday) · dataAuthority: platform provider-adapter/embedding-portability kaydı · lifecycleAuthority: AI provider integration/exit lifecycle
- testOracle: **provider outage / exit (AI lensi):** provider outage'ta circuit-breaker + degraded-mode; exit'te embedding/prompt/eval-set portability ile canonical veri korunur, provider kilitlemesi yok ([`oracles`](./enterprise-saas-phase-5-11-acceptance-oracles.md) §probe 3 hizalı) · evidenceExpected: AI provider exit/failover drill logu
- blocker: yok (provider-neutral port bağlayıcı, D6); gerçek exit drill residual, `passed` uydurulmaz.

## AI and agent authority profile

- **Commerce OS owns (domain):** AI use-case policy, domain girdi/çıktı review, golden-set beklentisi, human-override semantiği, domain karar-semantiği, use-case→model policy **beyanı** — hepsi core-7-BC otoritesi içinde, tek-writer; **source-of-truth state daima domain BC'de kalır, AI'ya devredilmez** ([`composition`](./enterprise-saas-product-family-composition.md) §Shared versus owned matrix).
- **Platform/kernel owns (consumed):** model/router/provider registry, prompt/tool/version registry, RAG/vector/embedding runtime, eval harness, drift/AI-observability, agent identity/mandate/spend, `agentPolicy`/ECA/ruleset/kill-switch, AI cost/FinOps ölçümü — Commerce OS bunları **tüketir**, yeniden yazmaz/kopyalamaz ([`ledger`](./enterprise-saas-human-decision-queue.md) D3; [`ai-gov`](./ai-governance-master.md) §2–§10; [`eca-directive`](./claude-ai-archetype-eca-directive.md)).
- **AI authority tavanı (bağlayıcı):** AI yalnız ArcheType taslağı/prod-update **önerir** (autonomy ≤ `apply-gated`); `app`/`module`=`none`; `Actor`/`Capability`/`PDP`/`Mode-Profile`/jurisdiction/ruleset/prod **mutasyonu YASAK**; ECA derinliği ≤6; merge/onay=insan; kill-switch insan-only ([`../AGENTS.md`](../AGENTS.md) §4.4; [`ai-gov`](./ai-governance-master.md) §3–§9). Bu belge hiçbir AI'ya autonomous approval/prod-write vermez.
- **Provisional BC re-pass (AI lensi):** AI/data-science yüzeyi tekil `owner`/`dataAuthority`/`lifecycleAuthority`/independent-policy testine sokuldu; AI/agent yüzeyi **BC değil**, platform runtime + domain use-case/review tüketimidir — **hiçbir provisional BC yeni module/BC düğümü açmaz** ([`composition`](./enterprise-saas-product-family-composition.md) §Commerce OS Card). Bağımsız-policy kanıtı olmayan kalem (`C-5H-04/08`) `unresolved` bırakıldı; canonical owner **uydurulmaz**.

## Duplicate and safety notes

- **AI drift ≠ reliability degraded-mode:** `C-5H-06` AI kalite/dağılım-drift ekseni; 5E `C-5E-08/12` observability/provider degraded-mode altyapı ekseni — aynı observability primitifi, ayrı outcome/oracle, fold DEĞİL (cross-ref).
- **AI provider exit fold DEĞİL:** `C-5H-14` AI-provider portability lensi; 5E `C-5E-12` genel provider exit, 5F port sözleşme derinliği — sınır referansı, primitif kopyalanmaz.
- **AI cost ↔ 5A/5E:** `C-5H-08` AI-spend/FinOps lensi; 5A usage-metering/billing + 5E `C-5E-10` COGS — authority sınırı net değil → `unresolved`.
- **RAG data-boundary ↔ 5C/5D:** `C-5H-04` vector/embedding tenant-isolation/residency; 5C data/metadata + 5D tenant-leakage/privacy — tenant-isolation/residency authority net değil → `unresolved` (probe 1 hizalı).
- **AI privacy ↔ 5D:** `C-5H-07` AI I/O redaction/consent; 5D privacy/PII genel ekseni — cross-ref, fold DEĞİL.
- **Ambiguous authority = unresolved (icat yasak):** `C-5H-04/08` owner/lifecycle contract'ta net olmadığı için `unresolved`+`blocker`; vector-store isolation/residency ve AI-spend attribution authority **uydurulmaz** ([`../AGENTS.md`](../AGENTS.md) §4.4).
- **2 zorunlu oracle yazıldı:** AI drift/silent-failure (`C-5H-06`), agent/ECA runaway (`C-5H-12`) — açık oracle olarak ([`oracles`](./enterprise-saas-phase-5-11-acceptance-oracles.md) §probe 7/8).
- **No module promotion:** 14 adayın hiçbiri app/module/BC düğümü açmaz; her biri platform AI/agent primitifine veya mevcut core-7-BC domain use-case/review kaydına referans verir; primitif Commerce OS'a kopyalanmaz, source-of-truth AI'ya bırakılmaz.

## Red to green checks

| Kontrol | Tür | Sonuç |
|---|---|---|
| Required H2 (7, sırayla) | AUTO (metin taraması) | 7/7 mevcut, sırada — reviewer/CI teyidine açık |
| Aday satır ≥ 10 | AUTO | 14 aday (`C-5H-01…14`) |
| Her satır 11 alan **veya** `unresolved`+`blocker` | AUTO/MANUAL | tüm satırlar 11 alan; `unresolved` (04, 08) blocker taşır |
| Zorunlu AI drift/silent-failure oracle | AUTO | `C-5H-06` (drift-alarm, degraded-mode, no silent-swallow) §probe 7 |
| Zorunlu agent/ECA runaway oracle | AUTO | `C-5H-12` (depth>6 stop, forbidden-write deny, human-stop bypass RED) §probe 8 |
| No autonomous approval / direct prod write | AUTO/MANUAL | `C-5H-09/10/12` + §authority: merge=insan, AI otonom onay/prod-write yok |
| No app/module/PDP/jurisdiction/ruleset mutasyonu | AUTO/MANUAL | §authority + `C-5H-12`: forbidden-write deny; `app`/`module`=`none` |
| Ambiguous authority → unresolved | AUTO | vector-store isolation/residency, AI-spend attribution → `unresolved` |
| Eval/golden/drift/drill satırı `passed`/`validated` DEĞİL | AUTO/MANUAL | `C-5H-05/06/12/14` eval/drill `passed`/`validated` işaretlenmedi |
| No model/provider as requirement | AUTO | model/provider = build/buy; ad requirement değil ([`ontology`](./enterprise-saas-capability-ontology.md) §provider) |
| No prompt/model/agent-config/eval-set üretimi | AUTO/MANUAL | ham prompt/model/config/corpus üretilmedi (registry beyanı) |
| Provisional BC re-pass / no module | AUTO/MANUAL | §authority profile: AI/agent BC değil; module açılmadı |
| Enterprise-ready/GA iddiası yok | AUTO | eval/drill bekler; "enterprise-ready/GA" iddiası yok (D5) |
| Platform AI/agent primitifi tüketilir, owned değil | AUTO/MANUAL | §matrix owner=platform/kernel; Commerce OS use-case/review tüketici; cross-write yok (D3) |
| Sadece 2 sıralı iş (A5H, V5H), paralel iddia yok | AUTO | Execution record: 2/2 sequential |
| In-branch relative link target | MANUAL/CHANGESET | tüm link repo-relative; hedef Glob/Read ile doğrulandı; Codex teyidine açık |
| Line budget ≤ 220 | AUTO | bu dosya ≤ 220 satır |

Not: Repo CI kapıları (`npm run typecheck`, `npm test`, eval/agent-policy suite) bu worker tarafından **koşulmadı**; Codex'in bağımsız doğrulamasına aittir. Yeni makine gate/test/kod/prompt **yazılmadı** (kapsam dışı).

## Lane decision

- Bu çıktı **Phase 5H AI/data-science candidate completeness matrisidir**; requirement/backlog/node/app/module/queue/schema/gate/kod/test/prompt DEĞİL ve implementation/eval/drill kanıtı değildir.
- 14 aday üretildi; model/router/provider registry, prompt/tool registry, RAG/vector/embedding runtime, eval harness, drift/AI-observability, agent identity/mandate, `agentPolicy`/ECA/kill-switch, AI cost **primitifleri platform + kernel owned**, Commerce OS core-7-BC yalnız **domain use-case policy + girdi/çıktı review + golden-set beklentisi + human-override semantiği** tanımlar ve primitifi **tüketir**; **source-of-truth state AI'ya bırakılmadı** (D3 birebir), cross-write yazılmadı.
- Owner/authority belirsiz olanlar (vector-store tenant-isolation/residency, AI-spend attribution authority) `unresolved`+`blocker` bırakıldı — canonical owner, concrete model/eşik/corpus **uydurulmadı**, promote edilmedi.
- **2 zorunlu oracle** karşılandı: AI drift/silent-failure (`C-5H-06`, §probe 7), agent/ECA runaway (`C-5H-12`, §probe 8); ikisi de **koşulmadı**, `passed`/`validated` işaretlenmedi (Codex residual, D5).
- **AI otorite tavanı bağlayıcı:** autonomous approval yok, direct prod write yok, `app`/`module`/`PDP`/`Actor`/`Capability`/`Mode-Profile`/jurisdiction/ruleset mutasyonu yok, ECA derinliği ≤6, merge/kill-switch=insan; model/provider adı requirement yapılmadı; ham prompt/model/config/eval-set üretilmedi; enterprise-ready/GA iddiası yapılmadı (D5).
- Stop-gate ihlali: **yok** (sayı hedefi yapılmadı; AI/agent primitifi Commerce OS-owned yapılmadı; source-of-truth AI'ya bırakılmadı; cross-write/primitif kopyası yok; app/module/PDP/jurisdiction/ruleset mutasyonu yok; autonomous approval/prod-write yok; model/eşik/corpus uydurulmadı; eval/drill `passed`/`validated` denmedi; vendor requirement yapılmadı; prompt/config üretilmedi).
- Yazılan tek izinli dosya: `docs/enterprise-saas-phase-5h-ai-data-science-candidates.md`. Diğer 5A–5G shard'ları, kanon dokümanlar ve sibling worktree **değişmedi**. Commit/push/PR/deploy **yapılmadı**.
- **Faz 5H GO/NO-GO ve kalan dalgalar → Codex'e ait.** Bu worker 5H candidate matrisini üretti ve **durur**; Codex bağımsız doğrulamadan bu çıktı tamamlanmış sayılmaz.