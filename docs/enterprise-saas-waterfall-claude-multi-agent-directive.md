# Claude Worker Yönergesi — Enterprise SaaS Requirement Programı

**Durum:** FAZ 0–11 TAMAMLANDI; güncel uygulama giriş noktası V0–V16 vibecoder handoff'tur · 2026-07-13
**Amaç:** MVP düzeyindeki aday capability listesini, test edilebilir ve karar-kaliteli enterprise SaaS requirement sistemine dönüştürmek.
**Kapsam:** `actionplan` içinde yalnız dokümantasyon, gap, directive ve insan-onayına sunulacak changeset. Platform/product kodu, generated JSON, app/module node, queue, schema veya gate değişikliği yoktur.

> **Güncel yönlendirme:** Bu belge tamamlanmış requirement programının tarihsel yürütme yönergesidir. Uygulamaya başlayacak vibecoder önce [`commerce-os-test-first-parallel-handoff.md`](./commerce-os-test-first-parallel-handoff.md), sonra [`commerce-os-vibecoder-task-packets.md`](./commerce-os-vibecoder-task-packets.md) içindeki **V0** paketini izler. D1–D13 kapalıdır; runtime/pilot/GA kanıtı henüz yoktur.

## 0. Değişmez rol ve yetki

- Codex **MASTER**: kapsam, izin, doğrulama ve nihai karar sahibidir.
- Claude **SLAVE worker**: yalnız bu yönergedeki sınırlı işi yürütür; kapsam büyütemez, commit/push/merge/release yapamaz.
- Claude yalnız `claude.ai` first-party Max aboneliğiyle çalışır; API/provider fallback yasaktır.
- Claude çıktısı öneridir. Codex repo diff'ini ve testleri bağımsız doğrulamadan tamamlandı sayılmaz.
- Repo kökündeki `AGENTS.md` bağlayıcıdır. AI product/platform implementation veya app/module node üretemez.

## 1. Ana görev

Kaynak araştırma metnini kanonik requirement kabul etme. Metindeki her öğeyi şu sınıflardan yalnız birine yerleştir:

`platform capability | product-family/app | module/BC | archetype | feature | workflow | policy | integration/protocol | provider | reporting surface | AI use-case | configuration/edition | NFR | research input`.

Ardından repo gerçekliğiyle tekilleştirilmiş enterprise SaaS requirement programı üret. Sayısal hedef yoktur. `8.000 capability`, `100 app`, `50.000 AC` gibi iddiaları ancak kanıtlı portföy ihtiyacı olarak doğrulanırsa kullan.

## 2. Multi-parallel çalışma sözleşmesi

**SUPERSEDED-AUTHORITY:** Aşağıdaki fazlardaki “lane” sözcüğü iş ayrıştırma etiketidir;
Claude orkestrasyonu veya bağımsız writer yetkisi değildir.

- Codex MASTER kapsamı kilitler; PM specialist sırasını ve evidence paketini koordine eder.
- Specialist ajanlar yalnız kendi dar audit/handoff çıktısını PM'ye verir.
- Claude alt-ajan veya Task/sub-agent başlatamaz; branch/worktree açamaz ve entegrasyon yapamaz.
- Yalnız Codex gerek görürse tek bir sınırlı Claude worker görevi çağırır.
- Claude görevi allowed-files, non-goals, checks, output ve blocker zarfından çıkamaz.
- Aynı dosyada tek yazar ilkesi korunur; PM paketler, Codex bağımsız doğrular.

## 3. Test-first dokümantasyon yaklaşımı

Her fazdan önce beklenen kontrolleri ve kırmızı durumları yaz:

| Kontrol | Bu dalgadaki oracle |
|---|---|
| Required-section | Önceden ilan edilen heading listesine deterministik metin taraması; eksik = kırmızı |
| Relative link | Yerel hedef varlık kontrolü; kırık = kırmızı |
| Terminology | Mevcut repo sözleşmelerine karşı reviewer matrisi; otomatik gate yoksa `MANUAL/CHANGESET` |
| Dedup | Canonical key/alias tablosunda duplicate sorgusu; registry yoksa `MANUAL/CHANGESET` |
| Traceability | `source→decision→AC→test→evidence` matrisi boş hücre taraması |
| Ownership | Data/lifecycle authority matrisi; bir authority için birden çok writer = kırmızı |
| DAG | Edge listesinden cycle detection; machine-readable graph yoksa `MANUAL/CHANGESET` |
| Claim | Kanıtsız sayı ve tamamlanma dili metin taraması + reviewer doğrulaması |

Yeni makine gate'i veya test kodu yazmak bu görevin kapsamında değildir. Yalnız gerçekten koşulan kontrole “kırmızı→yeşil” denir; otomatik oracle yoksa sonuç `MANUAL` olarak işaretlenir ve eksik gate changeset önerisi olur.

## 4. Faz planı

### Faz 0 — Preflight ve gerçeklik envanteri

**Paralel lane'ler:** repo/AGENTS; kanonik kararlar; Waterfall/DoR/DoD; standard/gate; generated JSON salt-okunur örneklemi; implementation-workspace ayrımı.

**Çıktı:** HEAD/branch/status, kaynak otorite tablosu, çelişki listesi, allowed-files önerisi.
**Stop-gate:** kirli ana worktree'ye yazma; temiz sibling worktree yoksa DUR.
**Kısa özet:** doğrulanan repo gerçekliği ve blocker'lar.

### Faz 1 — Kaynak iddia normalizasyonu

**Paralel analyst lane'ler:** platform/kernel; identity/tenant/org; metadata/workflow; integration/data; AI; operations/governance; experience/collaboration; commerce/product-family. Fan-out öncesi integration lane ortak `canonicalConcept + provisionalOwner` stub tablosunu üretir; her kavram tek lane'e atanır.

Her öğeye `sourceId, normalizedName, class, level, probableOwner, duplicateOf, repoMatch, confidence, disposition` ver.

**Çıktı:** sınırlı karar matrisi; toplu backlog/node yok.
**Stop-gate:** vendor, protokol veya feature module diye sınıflandırılırsa DUR.
**Kısa özet:** mevcut/kısmi/eksik/çelişkili/tekrar/kararsız sayıları.

### Faz 2 — Requirement constitution

**Paralel lane'ler:** requirement identity/provenance; stakeholder/RACI; authority/lifecycle; NFR/risk; acceptance/evidence; migration/rollout; baseline/change-control.

[`enterprise-saas-requirements-unknown-unknowns-gap-2026-07-13.md`](./enterprise-saas-requirements-unknown-unknowns-gap-2026-07-13.md) §5 alanlarını normatif sözleşme olarak taslakla. Requirement cümlesi çözümden bağımsız, test edilebilir ve tek outcome taşımalı.

**Çıktı:** mevcut TaskNode alanlarına eşleme + yalnız provenance/karar için pre-WBS lifecycle (`candidate→validated→approved→baselined→rejected`). `baselined` sonrası `planned/implemented/verified` yeni sözlükte değil, kanonik TaskNode `phase/status/state` alanlarındadır. Baseline/freeze, change-request/CCB, impact/revalidation ve supersede kuralları ayrıca tanımlanır.
**Stop-gate:** source/owner/AC/evidenceExpected olmayan kayıt onaylanamaz.
**Kısa özet:** constitution açıkları ve insan kararları.

### Faz 3 — Capability ontology ve dedup

**Paralel lane'ler:** isim/alias; parent-child; owner/authority; dependency; reuse; edition/configuration.

Canonical key: `concept + owner + dataAuthority + lifecycleAuthority + consumer + outcome`. `Event Bus`, retry ve DLQ aynı seviyede sayılmaz. App/modül/feature granülerliği repo WBS sözleşmesine göre belirlenir.

**Çıktı:** ontology kuralları, alias/supersede modeli, promotion/demotion kriterleri.
**Stop-gate:** sayı hedefi veya ad benzerliği tekillik kanıtı değildir.
**Kısa özet:** birleştirilen kavramlar ve açık authority çatışmaları.

### Faz 4 — Ürün ailesi ve portföy kompozisyonu

**Paralel analyst lane'ler (gerekirse iki wave):** product strategy/ICP; shared platform; product-family/app; edition/package; tenant/workspace; provider/integration; monetization; operating model.

“100 app” üretme. Önce tekrar kullanılabilir bir `Product Family Card` hazırla: thesis, buyer/user, JTBD, boundary, owned data/lifecycle, consumed platform capabilities, modules, editions, commercial model, jurisdictions, SLO, non-goals, exit criteria.

**Çıktı:** ilk 3 aday product family için örnek kompozisyon + shared-vs-owned matrisi.
**Stop-gate:** insan ICP/product-family kararı yoksa kalan 97 app araştırma adayı kalır.
**Kısa özet:** platforma taşınanlar, app'e kalanlar, tekrarlar.

### Faz 4.5 — Erken insan ürün kararı

Faz 4 çıktısından sonra ilk ICP, ilk üç product family, ilk jurisdiction, hedef maturity tier ve build/buy/provider politikası insan tarafından karara bağlanır.

**Çıktı:** onaylı/deferred/rejected karar kaydı.
**Stop-gate:** bu beş karar kapanmadan Faz 5 geniş domain candidate üretimi yok.
**Kısa özet:** kararlar, deferred etkisi ve NO-GO alanları.

### Faz 5 — Enterprise requirement domain dalgaları

Bu faz dalgalar halinde ve her dalgada en fazla 8 analyst lane ile yürür:

- **5A Strategy/commercial:** market evidence, pricing, entitlement, metering, unit economics, procurement, contracts.
- **5B Identity/tenant/org:** identity proofing, federation, machine identity, delegation, org graph, isolation, lifecycle.
- **5C Data/metadata:** authority, schema evolution, lineage, quality, MDM, retention, legal hold, portability.
- **5D Security/privacy/compliance:** threat/abuse, ASVS, SSDF, supply chain, secrets/keys, residency, SoD, evidence.
- **5E Reliability/operations:** SLI/SLO/SLA, capacity, DR, restore, incident, support, admin tooling, cost attribution.
- **5F Integration/extensibility:** API/event contracts, provider ports, sandbox, versioning, quotas, compatibility, exit.
- **5G UX/globalization/accessibility:** journeys, errors, learnability, localization, jurisdiction packs, WCAG, supportability.
- **5H AI/data science:** use-case risk, model/prompt/tool registry, evaluation, drift, budget, privacy, human override.

Her lane ortak capability'yi yeniden yazmaz; canonical ID'ye referans verir.

**Çıktı:** domain completeness matrisi; requirement listesi değil yalnız onaylanabilir candidate set.
**Stop-gate:** owner, authority, risk tier veya test oracle belirsizse `unresolved`.
**Kısa özet:** yüksek riskli boşluklar ve bloklanan adaylar.

### Faz 6 — Unknown-unknown probe programı

**Paralel lane'ler:** market; legal; architecture/scale; data; security/abuse; operations/DR; AI; migration/exit.

Her probe: `hypothesis, trigger, blastRadius, owner, method, fixture, expectedEvidence, timebox, result, decision`.

Zorunlu probes: noisy-neighbor, region/key loss, cross-tenant leak, replay/idempotency, plugin exfiltration, provider outage/exit, metadata upgrade blast radius, data deletion conflict, AI silent failure/drift, KPI reconciliation, round-trip export/import, regulated-role drift ve agent/ECA runaway (depth>6, forbidden app/module write, human-stop bypass).

**Çıktı:** risk-sıralı probe backlog'u ve önce koşulacak 10 probe.
**Stop-gate:** probe sonucu olmadan yüksek risk requirement `validated` olamaz.
**Kısa özet:** confirmed/rejected/unresolved.

### Faz 7 — Waterfall baseline, traceability ve test planı

Bu bölüm paralel lane değildir; kanonik Waterfall DAG'ı boyunca **sıralı kapı zinciridir**: requirements → test-plan → db-schema/migration → development handoff → test/QA → verification → release/maintenance. Farklı bağımsız requirement'lar ayrı analyst shard'larında hazırlanabilir, fakat tek requirement'ın fazları paralel açılamaz.

Her requirement için `source→decision→baseline→AC→test level→test command placeholder→evidence type→release/rollback` zinciri kur. Verification (ürünü spec'e göre yaptık mı?) ile validation'ı (doğru ürünü mü yaptık?) ayır; validation authority'yi açıkla. Baselined requirement değişirse change request, etki analizi ve etkilenen testlerin yeniden onayı zorunludur. Test oracle yoksa geliştirme yok. Property, contract, negative, chaos, security, accessibility, migration ve restore testlerini risk bazlı ata.

**Çıktı:** traceability matrix + Definition of Ready/Done delta.
**Stop-gate:** test-plan ve db-schema geçmeden development önerme.
**Kısa özet:** code-start'a hazır olmayan nedenler.

### Faz 8 — Standart/control crosswalk

**Paralel lane'ler:** ISO 25010; NIST CSF/SSDF; OWASP ASVS; privacy/residency; AI RMF; accessibility; reliability; supply-chain.

Standart metinlerini kopyalama. `standard/version/controlId/applicability/requirementId/evidence/waiver` referansı üret. Lisanslı veya mevzuat yorumu gereken içerikleri insan uzman kararına bırak.

**Çıktı:** crosswalk ve eksik kontrol aileleri.
**Stop-gate:** standarda atıf uyumluluk iddiası değildir.
**Kısa özet:** kanıtlanan/kanıtlanmayan kontrol alanları.

### Faz 9 — Tutarlılık, dedup ve adversarial review

**Paralel read-only reviewer lane'leri:** taxonomy; ownership; lifecycle/events; security/privacy; commercial/edition; NFR/SLO; migration/exit; AI/agent safety.

Reviewer'lar birbirinin bulgusunu görmeden ilk turu tamamlar. Integration lane her bulguyu `KATILIYORUM/KISMEN/KATILMIYORUM` biçiminde repo kanıtıyla değerlendirir.

**Çıktı:** conflict ledger, cycle report, duplicate report, unresolved decisions.
**Stop-gate:** authority conflict veya dependency cycle varken yayın yok.
**Kısa özet:** kabul edilen ve reddedilen review bulguları.

### Faz 10 — İnsan karar kapısı

En fazla 10 gerçekten ürün yönünü değiştiren karar sun. Her karar: seçenekler, trade-off, affected requirements, default-if-deferred, irreversible cost, recommended evidence.

**Çıktı:** human decision queue.
**Stop-gate:** product family, first ICP, first jurisdiction, maturity target ve build/buy/provider kararı yoksa machine-readable catalog/node dönüşümü yok.
**Kısa özet:** onay bekleyenler.

### Faz 11 — Yayın/handoff

Yalnız insan kararları sonrası docs/gap/directive güncellenir. Generated JSON/node/queue ayrı, insan-onaylı sonraki dalgadır. Bu dokümantasyon handoff'u insan onayı + link/allowed-files kontrollerine bağlıdır; `ready-for-dev` yalnız daha sonraki yetkili node dalgasında bir TaskNode `phase=development` olduğunda uygulanır.

**Çıktı:** dosya manifesti, linkler, diff özeti, doğrulama sonuçları, kalan riskler.
**Stop-gate:** sahte evidence, “enterprise tamam”, product implementation veya kanıtsız node yasak.
**Kısa özet:** ne değişti, ne değişmedi, sonraki kapı.

## 5. Her faz sonu zorunlu kısa rapor

```text
Faz / durum:
Lane'ler ve tek-yazar dosya sahipliği:
Girdi commit ve kaynaklar:
Üretilen dosyalar:
Kırmızı→yeşil kontroller:
Repo kanıtları:
Yeni duplicate/conflict/cycle:
Unknown unknown probe sonucu:
İnsan kararı gerekenler:
Stop-gate ihlali:
Sonraki faz GO/NO-GO:
```

## 6. Nihai kabul kriterleri

- Kaynak metindeki her ana iddia sınıflandırılmış; hiçbir sayı otomatik hedef değildir.
- Capability, feature, app, module, edition, tenant, provider ve NFR birbirine karışmaz.
- Her approved requirement source, owner, authority, AC, test ve evidence zinciri taşır.
- Shared platform capability'leri product family'lerde tekrar yazılmaz.
- Unknown-unknown programında en az 10 yüksek risk probe ve stop-gate vardır.
- Dependency grafiği döngüsüz; cross-authority write yoktur.
- Dış standartlar sürümlü referanstır; uyumluluk iddiası kanıta bağlıdır.
- `git diff --check`, relative-link kontrolü ve allowed-files kontrolü geçer.
- Claude commit/push/merge yapmaz; Codex bağımsız doğrular.

## 7. Yasaklar

- Binlerce capability'yi sayı doldurmak için üretmek.
- Vendor veya protokol adını kanonik requirement yapmak.
- Araştırma girdisini backlog/node/app/module kabul etmek.
- Aynı kavramı farklı product family'lerde kopyalamak.
- Test oracle ve evidence olmadan “hazır/tamam/enterprise” demek.
- Kirli kullanıcı worktree'sine yazmak veya kullanıcı değişikliklerini düzeltmek.
- Product/platform implementation, generated JSON, queue veya node üretmek.
