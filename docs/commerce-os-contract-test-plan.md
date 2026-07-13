# Commerce Operating System — Contract-Test Plan (Test-Önce Talimat)

**Durum:** DRAFT / APPROVED-INSTRUCTION — 2026-07-13 · **Kaynak yetki:** [`ADR-0031`](./adr-0031-commerce-os-vibecoder-handoff-decisions.md) (D7/D10/D8/D9/D12/D13), [`bounded-context map`](./commerce-os-bounded-context-map.md), [`readiness oracles`](./commerce-os-vibecoder-readiness-oracles.md) O7, [`../AGENTS.md`](../AGENTS.md) §0/§3.
**Kapsam:** Yalnız dokümantasyon **talimatı**. Bu dosya kod/şema/JSON/queue/node/gate **üretmez**, hiçbir testi **koşmaz** ve hiçbir kanıt **iddia etmez** ([`AGENTS.md`](../AGENTS.md) §0, §4.4).

> **instruction-ready ≠ runtime-ready.** Bu plan yalnız **hangi kırmızı (RED) testin, hangi katmanda, hangi kanıta karşı önce yazılacağını** ilan eder. Yeşil test, çalışan slice, ölçülmüş SLO **gelecekteki iştir** ve burada **var olduğu iddia edilmez** ([`Faz-7`](./enterprise-saas-phase-7-traceability-baseline.md) §Phase decision; [`Faz-6`](./enterprise-saas-phase-6-unknown-unknown-probes.md) §Stop gate). Bu bir **APPROVED-INSTRUCTION** iskeletidir: implementation-repo (`platform`) geliştiricisi bunu test-önce doldurur; `actionplan` doc-maintainer ürün testi yazmaz.

## 1. Okuma modeli — talimat vs kanıt

- Her aile bir **RED test niyeti** (önce yazılır, fail-closed beklenir) + **acceptance** + **beklenen kanıt tipi** + **P6/D izi** taşır. Hiçbir satır "passed/geçti/çalışıyor" demez.
- **Komutlar yer tutucudur.** Gerçek komut implementation-repo teyit edene kadar tam olarak şu işaretle yazılır: `implementation-repo command TBD; packet must replace before development`. Bu işaret var olan komut gibi **sunulamaz**; packet development'tan önce **değiştirmek zorundadır**.
- **RED varsa yeşile geçilmez.** Bir aile için RED test yazılıp fail-closed görülmeden ilgili slice ilerlemez ([`ready-for-dev-gate`](./ready-for-dev-gate.md) §Code-Start; [`task-to-code`](./task-to-code-contract.md) §Faz `test-plan → development`).
- Yetki sırası: Codex MASTER karar sahibi + nihai doğrulayıcı; bu plan yalnız kırmızıyı ilan eder, kapatmaz.

## 2. Test-önce katman hiyerarşisi (delivery sequence ile hizalı)

Sıra [`bounded-context map`](./commerce-os-bounded-context-map.md) §7 ve [`delivery sequence`](./kernel-sdk-app-delivery-sequence.md) ile aynıdır; her katman kendi RED ailesi yeşil olduğu **iddia edilmeden** bir sonrakine geçmez (talimat sırası):

1. **Kernel public contracts** — tenancy/identity/PDP/event-bus/audit/ledger port kontratları; consumer yalnız public yüzeye derlenir.
2. **SDK ports** — public port'lar; kernel iç tipi sızdırmaz.
3. **commerce-os app-core** — kompozisyon köku; BC yüzeyi açmaz.
4. **Neutral versioned commerce integration-contract packages** — events/commands/DTOs; hiçbir business BC'ye bağımlı değil (DAG kökü, D7).
5. **Core vertical slice (BC-01..BC-07)** — Catalog → Offer → Checkout intent → Order saga → Inventory/Payment → Fulfillment.

## 3. Test seviyeleri (tanım)

- **unit** — tek fonksiyon/kural; port kontrat imzası.
- **contract** — üretici/tüketici versiyonlu kontrat uyumu; consumer-driven pin.
- **property** — invariant/idempotency/sıralama üzerinden üretilmiş girdi.
- **negative** — fail-closed: yetkisiz/geçersiz/kapsam-dışı reddedilmeli.
- **integration** — BC ↔ contract package ↔ platform port birleşimi.
- **e2e** — dikey dilim: sepetten teslimata dek dış davranış.
- **chaos** — outage/degradasyon/komşu-yük enjeksiyonu.
- **migration** — expand→migrate→contract + geriye-uyum + rollback provası.
- **restore** — clean-room restore + RPO/RTO bütünlüğü.
- **a11y** — WCAG 2.2 klavye/odak/kontrast + localization/jurisdiction pack.
- **performance** — p95/throughput/degradasyon bütçesi (D13 envelope'a bağlı).

## 4. RED test aileleri — acceptance · kanıt · iz

Her ailede `Test-commands:` satırı yer tutucudur (§1 işareti). Acceptance **falsifiable**; kanıt tipi implementation-repo'da beklenir.

### F1 · package-dag-no-bc-import — level: contract·unit
- **RED:** Bir BC implementasyonu başka BC'yi import ederse veya paket grafiği döngü içerirse build **fail** eder ("async" döngü çözümü kabul edilmez).
- **Acceptance:** Design-time paket grafiği DAG; `import order from cart` benzeri kenar yok; contract paketi hiçbir BC'ye bağımlı değil.
- **Evidence (beklenen):** DAG/import-boundary kontrol raporu (kırmızı→yeşil).
- **Test-commands:** `implementation-repo command TBD; packet must replace before development`
- **Trace:** D7 · O2 · [`map`](./commerce-os-bounded-context-map.md) §5.

### F2 · contract-version-compat — level: contract·migration
- **RED:** Geriye-uyumsuz kontrat değişimi major bump olmadan yayınlanırsa veya pin'lenmiş tüketici kırılırsa fail.
- **Acceptance:** major=breaking; consumer sürüm pin'ler; geriye-uyum matrisi yeşil iddia edilmeden tanımlı.
- **Evidence:** consumer-driven contract + compatibility matrisi raporu.
- **Test-commands:** `implementation-repo command TBD; packet must replace before development`
- **Trace:** D7 · D9 · P6-14 · D3.

### F3 · tenant-isolation — level: negative·security·integration
- **RED:** Tenant A objesi/anahtarı cache/search/projection **+ vector/embedding/RAG retrieval** dahil Tenant B'ye görünürse fail-closed ihlali.
- **Acceptance:** İki-tenant escape suite'te cross-tenant okuma/yazma reddedilir; tenant'sız context reddedilir.
- **Evidence:** tenant-escape negatif suite raporu (cache/search/projection/RAG).
- **Test-commands:** `implementation-repo command TBD; packet must replace before development`
- **Trace:** P6-01 · D3.

### F4 · cart-intent-vs-order-single-writer — level: contract·negative
- **RED:** Cart `OrderPlaced`/`OrderCreated` yayınlarsa veya bir BC Order store'una yazarsa fail.
- **Acceptance:** Cart yalnız `CheckoutSubmitted` (intent); Order tek yazar; cross-context write yok.
- **Evidence:** event-ownership + cross-context-write negatif raporu.
- **Test-commands:** `implementation-repo command TBD; packet must replace before development`
- **Trace:** D10 · O3 · [`map`](./commerce-os-bounded-context-map.md) §2.

### F5 · order-saga-cancellation — level: integration·negative
- **RED:** `OrderCancelled` telafiler (`ReleaseReservation`/`RefundPayment`/`CancelFulfillment`) ack'lenmeden yayınlanırsa veya örtük rollback olursa fail.
- **Acceptance:** İptal telafi-tamamlanınca; her adım açık ve isimli telafi.
- **Evidence:** saga cancellation izi + telafi ack kanıtı.
- **Test-commands:** `implementation-repo command TBD; packet must replace before development`
- **Trace:** D10 · [`map`](./commerce-os-bounded-context-map.md) §2.1.

### F6 · reservation-expiry-release — level: property·integration
- **RED:** Inventory TTL dolduğunda `ReservationExpired` yayınlanmazsa veya Order geç rezervasyonu terminal state üstüne yazarsa fail.
- **Acceptance:** TTL Inventory'nindir; Order geç rezervasyonu başarısız sayıp telafi eder.
- **Evidence:** expiry/release outcome + saga reconcile raporu.
- **Test-commands:** `implementation-repo command TBD; packet must replace before development`
- **Trace:** D10 · P6-13.

### F7 · payment-provider-failure — level: chaos·negative
- **RED:** PSP outage'da Order takılır/çift yazar veya degraded-mode tanımsızsa fail.
- **Acceptance:** `PaymentFailed` outcome saga'ya uzlaşır; port/adapter arkasında degraded/circuit-breaker; provider canonical authority değil.
- **Evidence:** provider-failure enjeksiyon + degraded-mode raporu.
- **Test-commands:** `implementation-repo command TBD; packet must replace before development`
- **Trace:** D10 · P6-03 · D6.

### F8 · refund-execution — level: integration·negative
- **RED:** Refund'u Payment yerine başka BC yürütürse veya Order refund store'una yazarsa fail.
- **Acceptance:** Fulfillment `ReturnAuthorized` → Order `RefundPayment` komutu → Payment yürütür → `PaymentRefunded`.
- **Evidence:** refund saga sahiplik izi.
- **Test-commands:** `implementation-repo command TBD; packet must replace before development`
- **Trace:** D10 · [`map`](./commerce-os-bounded-context-map.md) §6.

### F9 · duplicate-replay-ordering-idempotency — level: property·contract
- **RED:** Duplicate/replayed/out-of-order komut-event çift-etki, yanlış sıra veya terminal-state overwrite üretirse fail.
- **Acceptance:** Komutlar order+step-id ile idempotent; consumer message-id dedupe; terminal state üzerine yazılmaz.
- **Evidence:** idempotency/replay property test raporu.
- **Test-commands:** `implementation-repo command TBD; packet must replace before development`
- **Trace:** P6-13 · D3.

### F10 · export-import-roundtrip — level: migration·property
- **RED:** Export eksik veya round-trip diff ≠ ∅; silme/disposition counsel/retention-yönetişimli attestation olmadan doğrulanırsa fail.
- **Acceptance:** Tam export→temiz-import diff = ∅; disposition attestation retention/legal-hold yönetişimine bağlı (bare deletion-certificate authority-resolved sunulmaz).
- **Evidence:** round-trip diff + yönetişimli disposition attestation raporu.
- **Test-commands:** `implementation-repo command TBD; packet must replace before development`
- **Trace:** P6-11 · D8 · D4 · [`data-migration contract`](./commerce-os-data-migration-contract.md).

### F11 · metadata-expand-migrate-contract — level: migration·contract
- **RED:** Geriye-uyumsuz metadata/schema geçişi işaretlenmezse veya rollback deterministik değilse fail.
- **Acceptance:** expand→dual-read/write/backfill→verify→contract; canary + geriye-uyum; irreversible adım gate'li.
- **Evidence:** compatibility matrisi + canary + rollback drill raporu.
- **Test-commands:** `implementation-repo command TBD; packet must replace before development`
- **Trace:** P6-14 · D9 · D3 · [`data-migration contract`](./commerce-os-data-migration-contract.md).

### F12 · restore-and-key-loss — level: restore·chaos
- **RED:** Clean-room restore eksik/kirli veya key/region kaybında sessiz plaintext fallback üretirse fail-closed ihlali.
- **Acceptance:** Restore bütünlüklü, RPO/RTO bağlamlı-hedef (ölçülene kadar aday); key loss **fail-closed**; deterministik rotation/recovery; escrow authority `unresolved` iken sayı uydurulmaz.
- **Evidence:** restore drill + key/region-loss + rotation/revoke raporu.
- **Test-commands:** `implementation-repo command TBD; packet must replace before development`
- **Trace:** P6-04 · P6-05 · D9 · D4.

### F13 · plugin-exfiltration — level: security·negative
- **RED:** İmzasız/kapsam-dışı egress veya onaysız permission-diff fail-closed reddedilmezse fail.
- **Acceptance:** İmza/publisher fail-closed; no-egress sandbox; permission-diff onaysız genişlemez; AI modül yükleyemez.
- **Evidence:** exfiltration negatif suite + SBOM/imza + permission-diff raporu.
- **Test-commands:** `implementation-repo command TBD; packet must replace before development`
- **Trace:** P6-06 · D3.

### F14 · ai-eca-safety — level: negative·property
- **RED:** Eval regression/drift veya prompt/indirect-injection veya maskesiz PII/secret release'i bloklamazsa; ECA depth>6/forbidden app-module write/human-stop bypass/tool-permission escape reddedilmezse fail.
- **Acceptance:** Yüksek-risk AI aksiyonu **insan-gated**; auto-abstain/degrade/kill-switch otomatik olabilir; model/version rollback insan-gated.
- **Evidence:** eval + injection + PII-redaction + ECA runaway negatif suite raporu.
- **Test-commands:** `implementation-repo command TBD; packet must replace before development`
- **Trace:** P6-07 · P6-08 · D12 · [`AGENTS.md`](../AGENTS.md) §4.4.

### F15 · a11y-localization — level: a11y
- **RED:** WCAG 2.2 klavye/odak/kontrast veya localization/jurisdiction pack kriteri kırmızıysa fail.
- **Acceptance:** Tam klavye + görünür odak + kontrast; jurisdiction/i18n pack güncel; counsel-gated yer counsel gate'ini atlamaz.
- **Evidence:** axe/klavye drill + jurisdiction/i18n pack denetimi.
- **Test-commands:** `implementation-repo command TBD; packet must replace before development`
- **Trace:** P6-12 · C-5G-08 · [`Faz-7`](./enterprise-saas-phase-7-traceability-baseline.md) §Non-probe residual.

### F16 · slo-noisy-neighbor-provider-exit — level: performance·chaos·migration
- **RED:** Komşu p95 degradasyonu eşiği aşarsa, provider outage'da exit portability yoksa veya envelope alanları kayıtsızsa fail.
- **Acceptance:** Komşu p95 degradasyonu ≤ %20 (bağlamlı-aday); degraded-mode + exit-portability; D13 envelope alanları drill öncesi kayıtlı.
- **Evidence:** load-isolation + failover + exit-portability raporu.
- **Test-commands:** `implementation-repo command TBD; packet must replace before development`
- **Trace:** P6-02 · P6-03 · D6 · D13.

## 5. Evidence şeması (prose, koşulmuş kanıt değil)

Her aile için beklenen kanıt kaydı (implementation-repo'da üretilir; burada **yer tutucu**): `familyId · level(ler) · redFirstArtifact (kırmızı test + fail-closed gözlemi) · greenArtifact (yeşil rapor konumu) · auditTrail (outbox/audit izi) · envelopeRef (F16/F12 için D13/RPO-RTO değerleri) · validationAuthority (insan)`. `greenArtifact` **plan** değil **actual** olmalı; plan actual yerine geçmez. Hiçbir satır bu docs reposunda "doludur/geçmiştir" diye **sunulamaz**.

## 6. Stop-gate'ler

1. Bir aile için **RED test + fail-closed gözlemi** olmadan ilgili slice development'a geçmez ([`ready-for-dev-gate`](./ready-for-dev-gate.md); [`task-to-code`](./task-to-code-contract.md)).
2. Yer tutucu komut değiştirilmeden (`implementation-repo command TBD; packet must replace before development`) hiçbir aile "hazır" ilan edilmez.
3. F10/F12 counsel/escrow authority `unresolved` iken (P6-05/P6-09/P6-11/P6-12) karar **BLOCK VALIDATION**; sayı/politika uydurulmaz.
4. Core slice (BC-01..BC-07) RED aileleri tanımlanmadan opsiyonel edition BC ailesi açılmaz (O9; [`map`](./commerce-os-bounded-context-map.md) §7).
5. Bu worker JSON/node/queue/schema/gate/kod/test üretmez, commit/push/merge yapmaz; yalnız bu dosyayı yazar.

## İlgili doküman

- [`ADR-0031`](./adr-0031-commerce-os-vibecoder-handoff-decisions.md) · [`bounded-context map`](./commerce-os-bounded-context-map.md) · [`readiness oracles`](./commerce-os-vibecoder-readiness-oracles.md) · [`delivery sequence`](./kernel-sdk-app-delivery-sequence.md)
- [`Faz-6 probes`](./enterprise-saas-phase-6-unknown-unknown-probes.md) · [`Faz-7 traceability`](./enterprise-saas-phase-7-traceability-baseline.md) · [`data-migration contract`](./commerce-os-data-migration-contract.md)
- [`task-to-code`](./task-to-code-contract.md) · [`ready-for-dev-gate`](./ready-for-dev-gate.md) · [`../AGENTS.md`](../AGENTS.md)
