# Commerce Operating System — Vibecoder Readiness Oracles (Test-Önce)

**Durum:** DRAFT — 2026-07-13 · **Kaynak yetki:** [`adr-0030-commerce-operating-system-boundary.md`](./adr-0030-commerce-operating-system-boundary.md), [`../AGENTS.md`](../AGENTS.md) §0/§3/§4.4
**Kapsam:** Yalnız dokümantasyon oracle'ı. Bu dosya kod/şema/JSON/queue/node/gate **üretmez**, implementasyon iddiası **taşımaz**, hiçbir kararı **kapatmaz**. Amaç: Commerce OS handoff'unu bir **vibecoder**'ın (yeni implementer) doğrudan kullanabileceği hâle getirmeden önce **kırmızı (RED) koşulları** ilan etmek.

> **instruction-ready ≠ runtime-ready.** Bu oracle yalnız **talimat-hazırlığını** ölçer: handoff'un belirsizlik/döngü/otorite açığı olmadan okunup ilk packet'in seçilebilmesi. **Runtime kanıtı (yeşil test, çalışan slice, SLO ölçümü) gelecekteki iştir** ve bu dosya bunun var olduğunu **iddia etmez** ([`commerce-os-kernel-sdk-gap-directive.md`](./commerce-os-kernel-sdk-gap-directive.md) §7).

## 1. Okuma modeli

- Her oracle bir **RED koşulu** (yazıma engel) + bir **deterministik/manuel kontrol** taşır. AUTO = metin/link taramasıyla; MANUAL = insan reviewer teyidi.
- **RED varsa downstream yazım DURUR.** Tüm oracle GREEN olmadan hiçbir vibecoder packet'i "ready" ilan edilemez (§6 stop-gate).
- Yetki sırası ihlal edilemez: Codex MASTER karar sahibi; bu oracle yalnız kanıt/çelişki yüzeyler, karar kapatmaz.

## 2. RED koşulları — O1…O12

**O1 — Karar kapanışı (D7–D13).**
RED: [`enterprise-saas-phase-10-human-decision-audit.md`](./enterprise-saas-phase-10-human-decision-audit.md) §Açık kararlar'da **D7–D13'ten herhangi biri `OPEN`/`DEFERRED`** ise, veya bir kayıtta **Decision owner** (insan rol) ya da **Consequence** alanı eksikse. D7 açıkça **PUBLICATION BLOCKER**.
Kontrol (AUTO+MANUAL): 7 kaydın (D7…D13) her biri `CLOSED` + owner + consequence taşır; [`enterprise-saas-human-decision-queue.md`](./enterprise-saas-human-decision-queue.md) ledger'ı ile birebir tutarlı. AI kapatamaz; yalnız insan kapanışı yansıtılır.

**O2 — Döngüsüz tasarım-zamanı bağımlılığı.**
RED: Core BC (BC-01…BC-07) **tam kenar listesi** yok, veya graf tasarım-zamanında **döngü** içeriyor, veya bir döngü **yalnız "async yaparız"** denerek çözülmüş. Runtime geri-besleme (`OrderConfirmed`→Inventory commit, refund→Payment) **nötr, versiyonlu contract paketleriyle** ayrılmamışsa RED.
Kontrol (MANUAL): [`commerce-os-bounded-context-map.md`](./commerce-os-bounded-context-map.md) §6 grafiği DAG olarak doğrulanır; her geri-besleme kenarı adlandırılmış versiyonlu event sözleşmesine bağlanır. Async, döngü çözümü olarak **kabul edilmez**.

**O3 — Cart intent vs Order lifecycle sahipliği.**
RED: Cart'ın **imzalı satın-alma niyeti** (`CheckoutSubmitted`) ile Order'ın **sipariş durum makinesi** sahipliği belirsiz; veya bir BC başka BC verisine yazıyor (cross-context write). RED.
Kontrol (AUTO+MANUAL): BC-map §2 (BC-03 vs BC-04) + §1 "cross-context write yok" değişmezi; D10 kapanışı Cart-intent/Order-event ayrımını sabitler. Order `CheckoutSubmitted` ile inventory/payment/fulfillment outcome'larını tüketir, sepete yazmaz; `OrderPlaced` Cart olayı değildir.

**O4 — Provider/regulated sınırı korunur.**
RED: Lisanslı/düzenlenmiş yürütme (PSP/escrow/MoR/vergi/KYC) app veya BC içine gömülmüş; PROVIDER sınırı yok. RED.
Kontrol (AUTO): ADR-0030 §7 + BC-map BC-07/BC-17/BC-18 Provider satırları; [`commerce-os-kernel-sdk-gap-directive.md`](./commerce-os-kernel-sdk-gap-directive.md) §3 satır 15 PROVIDER etiketi korunur.

**O5 — Implementation packet tamlığı.**
RED: Herhangi bir packet şu **14 alandan** birini kaçırıyorsa RED: `packet id · objective · inputs · allowed-files patterns · forbidden files · prerequisites · red-tests-first · implementation steps · test commands/placeholders · acceptance criteria · evidence · rollback · stop conditions · max diff/file budget`.
Kontrol (AUTO): her packet başlığı alanları sırayla taşır; budget ≤400 net satır & ≤20 dosya ([`../AGENTS.md`](../AGENTS.md) §4.3); test-önce sırası ([`task-to-code-contract.md`](./task-to-code-contract.md) §2–3) korunur.

**O6 — Kernel → SDK → app-core → core-BC sırası.**
RED: Sıra örtük/tersine; app-core tanımlanmadan BC packet'i açılıyor; kernel `check-core-contract` referansı yok. RED.
Kontrol (AUTO): [`kernel-sdk-app-delivery-sequence.md`](./kernel-sdk-app-delivery-sequence.md) Kapı 1→2 + [`commerce-os-test-first-parallel-handoff.md`](./commerce-os-test-first-parallel-handoff.md) P1→P2→P3 zinciri packet prerequisite'lerinde açık.

**O7 — Contract-test plan kapsama.**
RED: Aşağıdaki 11 eksenden biri kırmızı-önce plan olarak yoksa RED: tenant izolasyonu · idempotency/replay · lifecycle compensation · provider failure · export/import · metadata-upgrade · restore/key-loss · plugin exfiltration · AI/ECA güvenliği · accessibility/localization · SLO/noisy-neighbor.
Kontrol (AUTO+MANUAL): handoff §5 adversarial matris + [`commerce-os-kernel-sdk-gap-directive.md`](./commerce-os-kernel-sdk-gap-directive.md) §6 ile eşlenir; her eksen ≥1 negatif case ve fail-closed beklentisi taşır.

**O8 — Data/migration contract otoritesi.**
RED: Veri/migration için **authority** ataması yok, veya rollback / expand-contract kuralı yok, veya doküman **şema implemente ediyor**. RED.
Kontrol (MANUAL): her veri değişimi tek yazar-otoriteye bağlı; expand→migrate→contract + geri-alma kuralı beyan edilir; şema **tanımlanmaz**, yalnız sözleşme sınırı ([`task-to-code-contract.md`](./task-to-code-contract.md)).

**O9 — Core-önce (edition yok).**
RED: Herhangi bir opsiyonel edition BC (Grup B/C) packet'i, core vertical slice (BC-01…BC-07 P4 yeşil) tanımlanmadan sıraya girmiş. RED.
Kontrol (AUTO): handoff P4→P5 stop-gate; edition packet prerequisite'i "core 7 BC yeşil" içerir; aksi = RED.

**O10 — Sahte hazır iddiası yok.**
RED: Doküman "ready/GA/test-passed/done/çalışıyor" gibi **runtime** iddiası taşıyor, veya instruction-ready ile runtime-ready'yi ayırmıyor. RED.
Kontrol (AUTO): yasak-iddia metin taraması; her hazırlık ifadesi "instruction-ready (runtime kanıtı gelecek iş)" olarak nitelenir.

**O11 — Relative link + allowed-files geçerliliği.**
RED: Kırık göreli link, veya packet'in `allowed-files` deseni gerçek repo yapısına bağlanmamış / forbidden-stack ([`../AGENTS.md`](../AGENTS.md) §4.1) taramasıyla çelişir. RED.
Kontrol (AUTO): tüm `./`,`../` linkleri çözülür; her packet allowed/forbidden deseni tek-yazar izolasyonuyla ([`../AGENTS.md`](../AGENTS.md) §6) tutarlı.

**O12 — READY FOR VIBECODER tanımı karşılanır.**
RED: Yeni bir implementer **ilk packet'i seçmek için bir mimari/ürün kararı vermek zorunda** kalıyor; veya hedef repo/test-önce stop-gate belirsiz. RED.
Kontrol (MANUAL): §5 tanımı sağlanır; runtime kanıtı **açıkça gelecek iş** olarak işaretli kalır.

## 3. Implementation packet — zorunlu alan iskeleti (O5 referansı)

```
Packet: <id>
Objective: <tek amaç>            Non-goal: <en az bir>
Inputs: <kaynak doküman/sözleşme linkleri>
Allowed-files: <desen(ler)>      Forbidden-files: <desen(ler) + forbidden stack>
Prerequisites: <kernel/SDK/app-core/BC sırası kapısı — O6>
Red-tests-first: <kırmızı test listesi/placeholder>
Implementation-steps: <sıralı>
Test-commands: <komut/placeholder — mevcut olduğu iddia edilmez>
Acceptance-criteria: <ölçülebilir>
Evidence: <kırmızı→yeşil + audit/outbox izi konumu>
Rollback: <geri-alma>            Stop-conditions: <DUR koşulları>
Budget: ≤400 net satır · ≤20 dosya
```

## 4. RED→GREEN checklist

- [ ] O1 D7–D13 hepsi `CLOSED` (owner + consequence) — D7 blocker temiz
- [ ] O2 core BC tam kenar listesi DAG; geri-besleme versiyonlu contract paketiyle ayrık (async ≠ çözüm)
- [ ] O3 Cart-intent vs Order-lifecycle net; cross-context write yasağı korunur
- [ ] O4 provider/regulated sınırı gömülmemiş
- [ ] O5 her packet 14 alan + budget tam
- [ ] O6 kernel→SDK→app-core→core-BC sırası açık
- [ ] O7 11 contract-test ekseni kırmızı-önce planlı
- [ ] O8 data/migration authority + rollback/expand-contract (şema yok)
- [ ] O9 core slice öncesi edition packet yok
- [ ] O10 sahte ready/GA/test-passed iddiası yok
- [ ] O11 tüm göreli linkler + allowed-files geçerli
- [ ] O12 vibecoder ilk packet'i kararsız seçebilir; runtime kanıtı gelecek iş

## 5. READY FOR VIBECODER — tanım

Handoff **READY FOR VIBECODER**'dır ancak ve ancak: yeni bir implementer, **hiçbir mimari veya ürün kararı vermeden** ilk packet'i seçebilir; **hangi repo** ve **hangi test-önce stop-gate**'in geçerli olduğunu tereddütsüz bilir; ve **runtime kanıtı açıkça gelecekteki iş** olarak işaretli kalır. Bu, "çalışıyor/GA" demek **değildir**; yalnız talimatların belirsizlik-siz yürütülebilir olduğunu söyler.

## 6. Final stop-gate

O1–O12'den **herhangi biri RED** ise: hiçbir vibecoder packet'i "ready" ilan edilmez, hiçbir downstream implementasyon dokümanı yazılmaz, hiçbir queue/node üretilmez. Karar/onay Codex MASTER + insan yetkisine aittir; bu oracle yalnız kapıyı **kırmızıda tutar**. Yeşil geçiş bile **instruction-ready** anlamındadır — runtime kanıtı ayrı, gelecek iştir.

## İlgili doküman

- [`../AGENTS.md`](../AGENTS.md), [`task-to-code-contract.md`](./task-to-code-contract.md), [`ready-for-dev-gate.md`](./ready-for-dev-gate.md), [`kernel-sdk-app-delivery-sequence.md`](./kernel-sdk-app-delivery-sequence.md)
- [`commerce-os-test-first-parallel-handoff.md`](./commerce-os-test-first-parallel-handoff.md), [`commerce-os-bounded-context-map.md`](./commerce-os-bounded-context-map.md), [`commerce-os-kernel-sdk-gap-directive.md`](./commerce-os-kernel-sdk-gap-directive.md), [`adr-0030-commerce-operating-system-boundary.md`](./adr-0030-commerce-operating-system-boundary.md)
- [`enterprise-saas-human-decision-queue.md`](./enterprise-saas-human-decision-queue.md), [`enterprise-saas-phase-10-human-decision-audit.md`](./enterprise-saas-phase-10-human-decision-audit.md), [`enterprise-saas-phase-9-adversarial-review.md`](./enterprise-saas-phase-9-adversarial-review.md), [`enterprise-saas-phase-5-11-acceptance-oracles.md`](./enterprise-saas-phase-5-11-acceptance-oracles.md)
