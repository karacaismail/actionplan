# Enterprise SaaS — Capability Ontology and Dedup (Phase 3)

**Rol:** Claude SLAVE worker. Codex MASTER + nihai otorite.
**Faz:** 3 (capability ontology + dedup). Faz 0/1/2 çıktılarına ve iki untracked girdiye dokunulmadı; **Faz 4'e geçilmez**.
**Tarih:** 2026-07-13 · **Durum:** ÖNERİ — Codex bağımsız doğrulamadan tamamlanmış sayılmaz.

> Bu belge **ontology kurallarıdır**, requirement/backlog/node/app/module/queue/schema/gate/kod/test DEĞİL.
> Araştırma metni ve sayıları ([`gap`](./enterprise-saas-requirements-unknown-unknowns-gap-2026-07-13.md) §1,
> [`matrix`](./enterprise-saas-source-normalization-matrix.md)) **kanonik değildir**; hiçbir sayı otomatik hedeftir.
> Yeni TaskNode alanı/level/faz icat edilmez ([`../src/schemas/task.ts`](../src/schemas/task.ts), [`../AGENTS.md`](../AGENTS.md) §7).
> Kanonik WBS/module ölçütü [`commerce-os-capability-classification.md`](./commerce-os-capability-classification.md) §6 + [`../AGENTS.md`](../AGENTS.md) §4.3'tedir; yeniden yazılmaz, referans verilir.

## Execution record

Task/sub-agent mekanizması bu ortamda **MEVCUT DEĞİL** (yalnız Bash/Read/Grep/Glob/Edit; Task/subagent tool yok).
Bu nedenle 12 iş **SIRALI** yürütüldü; **paralellik/sub-agent iddiası yok**. Tek yazar/entegrasyon adımı yalnız bu dosyadır.

- Yürütülen iş sayısı: **12/12** · Mod: **sequential (mechanism unavailable)** · Analiz READ-ONLY + tek yazar.
- Girdi/HEAD: `6900d38`, branch `codex/enterprise-saas-requirements-2026-07-13`; okunan kanon [`../AGENTS.md`](../AGENTS.md),
  [`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) §3/Faz 3, [`preflight`](./enterprise-saas-requirement-program-preflight.md),
  [`matrix`](./enterprise-saas-source-normalization-matrix.md), [`constitution`](./enterprise-saas-requirement-constitution.md),
  [`gap`](./enterprise-saas-requirements-unknown-unknowns-gap-2026-07-13.md), [`../src/schemas/task.ts`](../src/schemas/task.ts).

| # | İş | Kapsam | Yerleştiği bölüm |
|---|---|---|---|
| A1 | naming/alias | ad ≠ kimlik; alias/lookup | Canonical identity · Alias and supersede model |
| A2 | parent-child/granularity | seviye/derinlik; sabit sayı yok | Parent child granularity |
| A3 | owner/data/lifecycle authority | tekil sahiplik; system-of-record | Ownership and authority |
| A4 | dependency/DAG | edge yönü + event contract; design-time acyclic | Dependency and event rules |
| A5 | reuse/composition | shared platform vs family-owned | Reuse and composition |
| A6 | edition/configuration | edition/config-pack module olmaz | Reuse and composition · Promotion and demotion criteria |
| V1 | canonical-key invariant | 6-tuple key değişmezi | Canonical identity · Ontology invariants |
| V2 | promotion/demotion invariant | terfi/geri-alma testi | Promotion and demotion criteria |
| V3 | duplicate-cluster resolution | canonical + evidence algoritması | Duplicate resolution |
| V4 | cross-authority write rule | yalnız sahip yazar | Ownership and authority |
| V5 | cycle detection logic | deterministik cycle taraması + çözüm | Dependency and event rules |
| V6 | links/allowed-files/boundary | relative link + tek izinli dosya | Deterministic checks · Phase decision |

## Ontology invariants

Sabit değişmezler (ihlal = kırmızı). Hiçbiri yeni gate/kod değildir; reviewer/CI teyidine açık sözleşmedir.

1. **Kimlik anahtarı adla değil tuple ile:** `concept + owner + dataAuthority + lifecycleAuthority + consumer + outcome`
   ([`gap`](./enterprise-saas-requirements-unknown-unknowns-gap-2026-07-13.md) §3, [`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) Faz 3).
2. **Tek sahiplik:** her capability için `dataAuthority` ve `lifecycleAuthority` **tek** sahiptir; iki writer = authority conflict.
3. **Cross-authority write yasak:** yalnız sahip state author eder; diğer bağlamlar command/event/contract ile **ister** (§Ownership).
4. **Design-time DAG:** bağımlılık + event-contract kenarları tasarım-zamanı **asiklik** grafik üretir; cycle = kırmızı, deterministik çözüm gerekir (§Dependency).
5. **Sayı hedef değildir:** research sayıları (600/1000/5000/20000…) yalnız benchmark iddiasıdır; kapsam/başarı metriği olamaz.
6. **Sessiz kayıp yasak:** hiçbir kavram silinmez/gizlenmez; alias lookup'ı, supersede geçmişi korur (§Alias).
7. **L0–L19 etiketleri ve vendor listeleri otomatik terfi ETMEZ:** module/BC yalnız §Promotion ölçütüyle, insan onayıyla açılır.
8. **Belirsiz sonuç kuyruğa gider:** çözülemeyen kimlik/authority/cycle `uncertain` işaretlenir ve insan karar kuyruğuna (§Phase, P0) yönlendirilir.

## Canonical identity

**Capability nedir?** Bir sahibin (owner) yetkili veri ve yaşam döngüsüyle ürettiği, bir tüketici için **ölçülebilir bir
outcome** sağlayan yetenektir. Kanonik kimlik = **`concept + owner + dataAuthority + lifecycleAuthority + consumer + outcome`**
6-tuple'ı. Ad (`normalizedName`) yalnız insan-okunur etikettir; kimlik değildir.

**Capability NE DEĞİLDİR — karar testleri (biri bile capability'yi çürütür):**

| Sınıf | Karar testi (evet ⇒ capability değil) |
|---|---|
| feature | Bir capability'nin alt-davranışı mı; peer outcome üretmiyor mu? (ör. DLQ ⊂ Event Bus) |
| app / product-family | Birden çok capability'yi paketleyip bir ICP'ye satılıyor mu? (CRM/ERP → [`matrix`](./enterprise-saas-source-normalization-matrix.md) PF) |
| module / BC | §Promotion 5 ölçütünü geçmeden module diye adlandırılıyor mu? Geçmiyorsa capability/feature kalır. |
| workflow | Adım/BPMN/saga orkestrasyonu mu; state author etmiyor mu? |
| policy | Karar kuralı/kısıt mı (retention, SoD, release strateji)? outcome değil kural. |
| integration/protocol | Taşıma/sözleşme standardı mı (REST/GraphQL/**MCP**/SAML/SCIM)? |
| provider | Vendor/altyapı seçimi mi (Kafka, Zapier, OCR sağlayıcı)? build/buy kararı, capability değil. |
| NFR | Ölçülebilir bütçe mi (SLO/RTO/p95)? `NFRBudgets`'e ait, ayrı capability değil. |
| AI use-case | Model/prompt uygulaması mı; AI-governance kilidine mi tabi? ([`../AGENTS.md`](../AGENTS.md) §4.4) |
| configuration pack / edition | Paketleme/entitlement mı? edition, module değildir (§Reuse). |
| research input | Kanıtsız sayı/vendor/benchmark mı? `sourceType=benchmark`, requirement değil. |

**Aynı ad ne kanıttır ne de değildir:** aynı ad **duplicate kanıtı değildir** (farklı owner/dataAuthority/outcome →
ayrı capability; ör. Retention@L17-governance ≠ Retention@L10-document); aynı ad **tekillik kanıtı da değildir**
(farklı katman tablosu aynı 6-tuple'a düşebilir → duplicate; ör. L0 ≡ KX-runtime). Karar yalnız 6-tuple ile verilir.

## Alias and supersede model

- **Alias (lookup korunur):** eskiyen/eş ad yeni kanonik kimliğe `aliases[]` ile bağlanır; eski id/URL **çözülmeye devam eder**
  ([`../src/schemas/task.ts`](../src/schemas/task.ts) `aliases`). Alias veriyi/otoriteyi taşımaz, yalnız aramayı yönlendirir.
- **Supersede (geçmiş korunur):** bir kavram yerini bir yenisine bırakırsa `supersedes`/`aliases[]` ile bağlanır; eski kayıt
  **arşivlenir, silinmez** ([`constitution`](./enterprise-saas-requirement-constitution.md) §Baseline). Provenance ve karar izi kalır.
- **Sessiz silme YASAK:** hiçbir duplicate/eski kavram kayıtsız düşürülmez; her fold `duplicateOf` + gerekçe taşır
  ([`matrix`](./enterprise-saas-source-normalization-matrix.md) ledger).
- **Alias ≠ merge:** iki farklı outcome'lu kavram alias'la birleştirilmez; onlar ayrı kalır (sahte-örtüşme, §Duplicate).

## Parent child granularity

Ebeveyn-çocuk **6-tuple ilişkisiyle** belirlenir, **sabit derinlik/sayı ile değil.**

- **Kural:** çocuk, ebeveynin outcome'unun bir **alt-davranışı** ve **aynı sahiplik/otorite** altındaysa alt-feature'dır; ayrı
  owner/dataAuthority/outcome + §Promotion ölçütü varsa peer capability/module'dür.
- **Örnek — Event Bus vs retry/DLQ (seviye farkı):** `Event Bus` bir **capability**'dir (event dağıtım outcome'u).
  `Event Replay / Dead Letter Queue (DLQ) / Ordering / Versioning / Subscription` onun **alt-feature/policy**'leridir —
  aynı sahip (Platform Kernel/Event), ayrı satılabilir outcome yok → **peer module DEĞİL**
  ([`matrix`](./enterprise-saas-source-normalization-matrix.md) ledger; [`gap`](./enterprise-saas-requirements-unknown-unknowns-gap-2026-07-13.md) §3).
  Aynı mantık Command/Query/Scheduler/Queue/Cache "Platform"larına uygulanır: L0 primitifinin alt-feature seti, yeni peer değil.
- **Yasak:** "her capability tam N çocuk taşır" veya "derinlik sabit K" gibi keyfi kotalar. Granülerlik kanıta bağlıdır;
  repo 7-seviye metaforu (app→…→micro_step, [`../src/schemas/task.ts`](../src/schemas/task.ts)) yalnız baseline sonrası,
  insan-onaylı WBS eşlemesinde uygulanır — bu ontology **level icat etmez**.

## Ownership and authority

- **Her rolün tam bir hesap-verebilir otoritesi vardır:** `owner`, `dataAuthority` ve `lifecycleAuthority` **ayrı
  rollerdir**; her rol için **tam bir** accountable authority atanır. Roller **aynı** bağlamda toplanabilir veya **farklı**
  bağlamlara dağılabilir — ikisi de geçerlidir; hangisi olduğu açıkça kaydedilir. Rol başına birden çok authority = kırmızı.
- **Yazma/yaşam döngüsü ayrı yetkilerdir:** veriyi (system-of-record) **yalnız `dataAuthority`** yazar; durum-geçişi
  kararını **yalnız `lifecycleAuthority`** verir. `owner` **hesap-verebilirdir ama yalnızca owner olduğu için yazma yetkisi
  KAZANMAZ** — yazmak için `dataAuthority`, geçiş için `lifecycleAuthority` olmalıdır.
- **Cross-context write PROHIBITION (V4):** yetkili rol dışındaki bir bağlam bir capability'nin verisini **doğrudan yazamaz**;
  ihtiyacını **command / domain event / published contract** ile **ister** ([`commerce-os-capability-classification.md`](./commerce-os-capability-classification.md) §6
  "no cross-context write"; [`constitution`](./enterprise-saas-requirement-constitution.md) §Authority). Cross-context write gerektiren tasarım = red.
- **Çatışma/belirsizlik → kuyruk:** rol başına iki authority, yazma/geçiş yetkisi karışması veya `dataAuthority`↔
  `lifecycleAuthority` sınırı net değilse tasarım `uncertain` işaretlenir → insan karar kuyruğu (§Phase).
- **Verification ≠ Validation:** `validationAuthority` insandır; AI otoriteyi değiştiremez, otomatik terfi edemez
  ([`../AGENTS.md`](../AGENTS.md) §4.4, `agentPolicy.autonomy="suggest"`).

## Dependency and event rules

- **Kenar yönü:** `A dependsOn B` = A, B'nin yayınlanmış contract/event'ine bağımlıdır. Event-contract kenarı
  (publisher→subscriber) tasarım-zamanı bağımlılık kenarı olarak modellenir.
- **Design-time DAG:** bağımlılık + event-contract kenarlarının birleşimi **tasarım-zamanı asiklik** olmalıdır. (Runtime
  event akışının kendisi her zaman asiklik değildir — retry/geri-besleme döngüleri olabilir; bu kural **tasarım grafiği**
  içindir, runtime akışın asiklik olduğunu iddia etmez.)
- **Deterministik cycle check (V5):** kenar listesinden yönlü graf kur → Kahn topolojik sıralama (in-degree=0 kuyruğu) veya
  DFS ile geri-kenar (back-edge) tespiti çalıştır. Tüm düğümler sıralanamıyorsa kalan küme **cycle**'dır → kırmızı.
  Machine-readable graph registry **yok**; kontrol bu fazda `MANUAL/CHANGESET` işaretlenir ([`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) §3 DAG).
- **Cycle çözümü (deterministik seçenekler):** (1) ortak sözleşmeyi **contract extraction** ile ayır; (2) bağımlılığı
  **dependency inversion** ile ters çevir; (3) **async event** ile zamansal (temporal) bağı gevşet — **fakat async event
  tek başına design-time kenarı KIRMAZ**: yayınlanmış-sözleşme bağımlılığı sürer; kenar ancak authority/istek yönü ve
  contract ownership yeniden tasarlanıp **ters yöndeki design-time bağımlılık kaldırıldığında** kopar; (4) paylaşılan
  davranışı bir **shared platform capability**'ye taşı. Çözülene kadar tasarım `uncertain`.

## Reuse and composition

- **Shared platform capability vs family-owned behavior:** birçok app'in ortak tükettiği yetenek (tenant isolation, audit,
  identity, notification, observability) **shared platform capability**'dir (platform-primitive; tüketilir, inşa edilmez).
  Tek bir product-family'ye özgü davranış o ailenin **owned** capability'sidir; paylaşımlı platformu **tüketir**, kopyalamaz
  ([`gap`](./enterprise-saas-requirements-unknown-unknowns-gap-2026-07-13.md) §3, [`matrix`](./enterprise-saas-source-normalization-matrix.md)).
- **Reuse kanıtı = kompozisyon:** "100 app" iddiası reuse'u kanıtlamaz; app-family × shared-capability matrisi (Faz 4, insan
  onaylı) kanıtlar. Bu fazda matris **üretilmez**, kural konur.
- **Edition/config-pack ≠ module:** bir edition, config pack veya feature-flag paketi **yalnız paketleme yüzünden** module/BC
  olmaz. Packaging entitlement'tır (policy/config); module ancak §Promotion ölçütüyle açılır ([`matrix`](./enterprise-saas-source-normalization-matrix.md) KX-feature/KX-licensing).
- **Teslim sırası:** yeniden-kullanım kernel→SDK→app-core→module→app sırasına saygı gösterir ([`kernel-sdk-app-delivery-sequence.md`](./kernel-sdk-app-delivery-sequence.md)); alt katman üst katmana bağımlı olamaz (DAG).

## Promotion and demotion criteria

**Promotion (module/BC'ye terfi) — HEPSİ doğruysa** ([`commerce-os-capability-classification.md`](./commerce-os-capability-classification.md) §6, [`../AGENTS.md`](../AGENTS.md) §4.3):

1. Tek ve net **dataAuthority** (başka BC'nin yazmadığı veri).
2. Bağımsız **lifecycle / state machine** (başka BC'nin alt-durumu değil).
3. En az bir **yayınlanan domain event** ile gevşek bağ.
4. **Cross-context write gerektirmez** (ihtiyaç event/orchestration ile karşılanır).
5. Bağımsız **satılabilir/ambalajlanabilir** değer (edition'a girebilir).

Beşi birden sağlanmazsa **demotion:** aday `feature`/`policy`/`config` olarak **FOLD** edilir; module/BC'ye terfi edilmez
(YAGNI). **AI terfi/demote'u otomatik yapamaz** — yalnız changeset **önerir**; `app`/`module` üretimi/güncellemesi yasak
([`../AGENTS.md`](../AGENTS.md) §4.4, `forbiddenTargets=["app","module"]`).

**Research sayıları benchmark kalır:** 600/1000/5000/20000 vb. hiçbir sayı terfi/kapsam tetikleyicisi değildir
([`matrix`](./enterprise-saas-source-normalization-matrix.md) Rejected §; [`constitution`](./enterprise-saas-requirement-constitution.md) §Candidate).
**L0–L19 etiketleri ve 24 vendor/benchmark adı** kimlik anahtarı üretmez; otomatik owner/module'e dönüşmez.

## Duplicate resolution

**Duplicate decision algorithm (V3) — deterministik:**

1. Her aday için 6-tuple `concept + owner + dataAuthority + lifecycleAuthority + consumer + outcome` normalize et.
2. **6-tuple anahtarlar eşit** ⇒ **duplicate adayı** (evidence/canonical seçimine tabi); birini **canonical** seç (repo-evidence
   en güçlü olan: node/standart/kanonik doc > araştırma), diğerini `duplicateOf=<canonical>` ile **fold** et, `aliases[]`'a bağla.
3. Normalize edilmiş **concept/ad eşleşse bile**, 6-tuple `owner`/`dataAuthority`/`lifecycleAuthority`/`consumer`/`outcome`
   bileşenlerinden en az biri **farklıysa** anahtarlar **eşit değildir** ⇒ **duplicate DEĞİL** (sahte-örtüşme); ayrı tut,
   gerekçeyi kanıt ledger'ına yaz (ör. L7-proto/MCP ≠ L7-broker ≠ L7-ipaas; A/B@L19 ≠ A/B@Notification).
4. Bir aday ebeveynin outcome'unun alt-davranışı ise **fold as alt-feature** (peer değil; ör. DLQ⊂Event Bus).
5. Karar **evidence** ister: her fold `duplicateOf` + `repoMatch`/`sourceRefs` taşır; kanıtsız merge yok. Belirsizse
   `uncertain` bırak → insan kuyruğu (§Phase). **Ad benzerliği tek başına asla merge/split gerekçesi değildir.**

Kanonik kümeler için ledger: [`matrix`](./enterprise-saas-source-normalization-matrix.md) §Duplicate and granularity ledger
(L0≡KX-runtime/config/…, L4≡KX-meta, L8-infra≡KX-ai, L16-obs≡KX-logging/monitoring, L15≡KX-dev, L13≡KX-licensing).

## Deterministic checks

| Kontrol | Tür | Sonuç |
|---|---|---|
| Required H2 (12, sırayla) | AUTO (oracle metin taraması) | 12/12 mevcut — reviewer/CI teyidine açık |
| Relative link target | MANUAL/CHANGESET | tüm link repo-relative; okunan hedefler mevcut (`wbs-hiyerarsi-sozlesmesi.md` YOK → §6 commerce-os + AGENTS §4.3 kullanıldı) |
| Canonical-key invariant (V1) | AUTO | tek kimlik kuralı 6-tuple; ad kimlik değil |
| Cross-authority write (V4) | MANUAL | yalnız sahip yazar; command/event/contract ile istek — sözleşmede |
| Cycle detection (V5) | MANUAL/CHANGESET | Kahn/DFS back-edge tarif edildi; machine graph yok → MANUAL |
| Duplicate algoritması (V3) | MANUAL/CHANGESET | 5-adım 6-tuple + evidence; makine registry yok |
| Promotion/demotion (V2) | MANUAL | §6 5-ölçüt; sayı/ad terfi tetiklemez |
| Numeric = target? | AUTO | tüm sayılar research-only; hedef yok |
| No new schema/gate/node/module/app | AUTO | yalnız bu md; TaskNode alanı/level/faz icat edilmedi |
| Allowed-files (V6) | AUTO (`git status` Codex'te) | tek yazılan dosya; girdiler değişmedi |

Not: Repo CI kapıları (`qa:*`, `npm test`, e2e) bu worker tarafından **koşulmadı**; Codex'in bağımsız doğrulamasına aittir.
Yeni makine gate/test/kod **yazılmadı** (kapsam dışı). Bkz. test-önce sözleşmesi [`task-to-code-contract.md`](./task-to-code-contract.md), [`enterprise-dod.md`](./enterprise-dod.md), [`ready-for-dev-gate.md`](./ready-for-dev-gate.md), [`engineering-standards-index.md`](./engineering-standards-index.md).

## Phase decision

- Bu çıktı **capability ontology kurallarıdır**; requirement/backlog/node/app/module/queue/schema/gate/kod/test DEĞİL.
  Araştırma **kanonik değildir**; hiçbir sayı otomatik hedeftir; L0–L19/vendor otomatik terfi etmez.
- Stop-gate (sayı hedefi veya ad benzerliği tekillik kanıtı değildir): **sözleşmeye yazıldı**, ihlal yok
  ([`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) Faz 3).
- Ontology yalnız TaskNode `phase/status/state` ile **yarışmaz**; kimlik/dedup kuralları pre-WBS'te durur, baseline sonrası
  otorite TaskNode'dadır ([`constitution`](./enterprise-saas-requirement-constitution.md), [`../src/schemas/task.ts`](../src/schemas/task.ts)).
- **Belirsiz/çözülemeyen sonuçlar (uncertain) → insan karar kuyruğu** (P0, [`gap`](./enterprise-saas-requirements-unknown-unknowns-gap-2026-07-13.md) §8):
  DATA vs metadata otoritesi, shared-vs-owned authority sınırı (P0 #2), commerce/marketplace module terfisi, provider sınırı,
  KX-package supply-chain, çözülmemiş dependency cycle. Bu worker bunları **karara bağlamaz**, işaretler.
- Yazılan tek izinli dosya: `docs/enterprise-saas-capability-ontology.md`. Faz 0/1/2 çıktıları ve 2 untracked girdi
  **değişmedi**. Commit/push/PR/deploy **yapılmadı**.
- **Faz 3 GO/NO-GO → Codex'e ait.** Bu worker Faz 3'ü tamamladı ve **durur**; **Faz 4 (ürün ailesi/portföy) açılmaz** —
  yalnız Codex onayıyla ayrı, yetkili bir dalgada başlar.
