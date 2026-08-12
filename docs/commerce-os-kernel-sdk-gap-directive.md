# Commerce Operating System — Kernel/SDK Gap Direktifi

**Durum:** DRAFT — 2026-07-13 · **Kaynak yetki:** [`adr-0030-commerce-operating-system-boundary.md`](./adr-0030-commerce-operating-system-boundary.md)
**Kapsam:** Yalnız dokümantasyon/direktif. Bu dosya kod/şema/JSON/test/queue/node üretmez; app/module düğümü açmaz; yeni kernel primitifi **otomatik** icat etmez ([`AGENTS.md`](../AGENTS.md) §0, §4.4).
**Amaç:** Commerce OS'un ([`commerce-os-product-scope.md`](./commerce-os-product-scope.md), [`commerce-os-bounded-context-map.md`](./commerce-os-bounded-context-map.md)) ihtiyaç duyduğu her geniş yatay motoru mevcut kernel/SDK sözleşmeleriyle karşılaştırıp **gerçek boşluğu** sahte-boşluktan ayırmak.

> **Bu bir boşluk analizidir, implementasyon kanıtı DEĞİLDİR.** Hiçbir satır "yapıldı/hazır" demez. Statü kararları öneridir; item-level triyaj + requirements + test-önce kapıları ([`task-to-code-contract.md`](./task-to-code-contract.md) §2–3) geçilmeden hiçbir queue/node üretilmez.

## 1. Statü sözlüğü (bağlayıcı)

Her yatay motor tam bir statü alır; boşluk ancak **repo kanıtı** destekliyorsa ilan edilir.

| Statü | Anlam |
|---|---|
| **REUSE** | Mevcut kernel/SDK sözleşmesi karşılar; yeniden yazma yok, tüket. |
| **EXTEND-CONTRACT** | Mevcut primitif var ama sözleşme yüzeyi genişletilmeli (yeni port sınıfı/alan); yeni primitif değil. |
| **SDK-PORT** | Kernel primitifi var; eksik olan SDK'nın tipli port/surface'ı ([`kernel-sdk-app-delivery-sequence.md`](./kernel-sdk-app-delivery-sequence.md) Kapı 1). |
| **APP-BC** | Sorumluluk business bounded-context'in; platform primitifi değil (BC-map). |
| **PROVIDER** | Düzenlenmiş/dış yürütme; lisanslı sağlayıcı entegrasyonu (ADR-0030 §7). |
| **DEFER-HUMAN** | Gerçek boşluk adayı ama layer kararı insan onayı ister; §8 kuyruğuna gider. |

Kapsama sınıfı (kanıt tabanı): **mevcut-kapsama** · **kısmi-kapsama** · **eksik-direktif/SDK** · **business-BC** · **provider** · **impl-repo-kanıtı-bilinmiyor** (salt-okunur audit gerekir).

## 2. Kanıt tabanı (repo)

Karar zeminini oluşturan kanonik sözleşmeler: [`core-contract-pack.md`](./core-contract-pack.md) (kernel primitifleri) · [`kernel-execution-contract-matrix.md`](./kernel-execution-contract-matrix.md) (yürütme zarfı, typed-action/generated-CRUD sınırı) · [`app-distribution-contract.md`](./app-distribution-contract.md) §3.4/§4 (ortak-ihtiyaç terfisi, entitlement) · [`capability-entitlement-contract.md`](./capability-entitlement-contract.md) · [`mode-profile-contract.md`](./mode-profile-contract.md) · [`workflow-directive.md`](./workflow-directive.md) · [`k-provider-adapter-directive.md`](./k-provider-adapter-directive.md) · [`k-search-directive.md`](./k-search-directive.md) · [`k-worker-taskqueue-directive.md`](./k-worker-taskqueue-directive.md) · [`k-storage-dam-directive.md`](./k-storage-dam-directive.md) · [`k-mdm-provenance-directive.md`](./k-mdm-provenance-directive.md) · [`marketplace-module-security-directive.md`](./marketplace-module-security-directive.md) · [`archetype-ledger-directive.md`](./archetype-ledger-directive.md) · [`archetype-inventory-stock-directive.md`](./archetype-inventory-stock-directive.md) · [`archetype-order-line-item-directive.md`](./archetype-order-line-item-directive.md) · SDK readiness: [`be-sdk-readiness-gap-2026-07-09.md`](./be-sdk-readiness-gap-2026-07-09.md), [`wave2-sdk-repeatability-readiness-gap-2026-07-09.md`](./wave2-sdk-repeatability-readiness-gap-2026-07-09.md).

## 3. Yatay motor haritası (tam liste)

Her satır: motor → statü → kanıt → kapsama sınıfı. Statü mevcut sözleşme kanıtına dayanır; kanıt yoksa satır DEFER-HUMAN + impl-repo-kanıtı-bilinmiyor işaretlenir.

| # | Yatay motor | Statü | Kanıt / dayanak | Kapsama |
|---|---|---|---|---|
| 1 | Organization / acting-context (aktör-bağlamı, grup sahipliği) | REUSE + **SDK-PORT** | `core-contract-pack` §3.1 `platform_actor`; `kernel-execution-contract-matrix` §5 `actor`; classification §2.1 DRC acting-context=REUSE. Party/Group SDK yüzeyi ayrı kanıtlanmamış | kısmi-kapsama |
| 2 | Capability / entitlement | REUSE | `capability-entitlement-contract`; `app-distribution-contract` §4 lisans→capability | mevcut-kapsama |
| 3 | Policy / rules (PDP/PEP) | REUSE | `kernel-execution-contract-matrix` §5 `policy`, §7 inv.7; `pdp-policy-contract` referansı | mevcut-kapsama |
| 4 | Workflow / state machine (onay/SLA/eskalasyon) | REUSE | `workflow-directive` §5, §7; `mode-profile-contract` mode bileşimi | mevcut-kapsama |
| 5 | Pricing / quote (CPQ, sözleşme-fiyat) | **APP-BC** | BC-02 Offer&Pricing; hesap motoru `core-contract-pack` §3.5 `platform_computation` REUSE; CFG/PRM2 classification=FOLD | business-BC |
| 6 | Availability — envanter/stok/lot/serial/rezervasyon | REUSE | `archetype-inventory-stock-directive` §5 warehouse/stock/lot/serial/reservation/movement | mevcut-kapsama |
| 7 | Availability — zaman/kapasite/koltuk/kaynak/entitlement/kredi | **DEFER-HUMAN** | Envanter direktifi yalnız fiziksel stok; time/seat/capacity ayrı veri otoritesi (BC-11/EVT2). Jenerik "availability" soyutlaması **kanıtlanmamış** | eksik-direktif |
| 8 | Ledger / settlement | REUSE + **APP-BC** | `archetype-ledger-directive` (çift-taraflı defter) REUSE; uzlaştırma/gelir-paylaşımı BC-17 Settlement | kısmi-kapsama |
| 9 | Document / version | REUSE (kısmi) | `k-storage-dam-directive` (object/varyant), `k-mdm-provenance-directive` (türetim/provenans versiyonu). Genel "belge sürümleme" tek sözleşmede toplu değil | kısmi-kapsama |
| 10 | Events / outbox / webhook | REUSE + **EXTEND-CONTRACT** | `core-contract-pack` outbox/event bus; scale-invariant `scaled_write`. Dışa **webhook egress** sözleşmesi ayrı kanıtlanmamış → egress port genişletme adayı | kısmi-kapsama |
| 11 | Audit / history | REUSE | `core-contract-pack` §2.5 append-only + hash-chain | mevcut-kapsama |
| 12 | Extensible schema (EAV/öznitelik-seti) | **REUSE** | `core-contract-pack` §3.6 `platform_fieldtypes` (tenant-tanımlı attribute-set, tipli değer, şema değiştirmeden dinamik öznitelik); [`archetype-eav-directive.md`](./archetype-eav-directive.md) tipli EAV metamodeli. ADR-K1 ham/tipsiz EAV ithalini yasaklar ama tipli attribute-set sözleşmesi mevcuttur | mevcut-kapsama |
| 13 | Catalog governance / provenance | **APP-BC** + REUSE | BC-01 Catalog Governance (business); provenans/golden-record `k-mdm-provenance` REUSE | business-BC |
| 14 | Search / projection | REUSE | `k-search-directive` (faceted/filter/sort, tenant-scoped index); DSC2 classification=FOLD | mevcut-kapsama |
| 15 | Payments / providers | **PROVIDER** + **EXTEND-CONTRACT** | ADR-0030 §7; `k-provider-adapter` port sınıfları imza/AI/storage/workflow/OCR/notification/timestamp — **ödeme/PSP/escrow/MoR/vergi port sınıfı listede yok** | eksik-direktif |
| 16 | Import-export / mapping | **SDK-PORT/DEFER** | classification MAG data-mapping=SDK-PORT/DEFER; mevcut migration/worker desenleri yeniden kullanılabilir ama **public tipli mapping port'u kanıtlanmamış**; platform primitifi olduğu iddia edilmez | impl-repo-kanıtı-bilinmiyor |
| 17 | Extension runtime — in-process | REUSE | `app-distribution-contract` §3.4; `marketplace-module-security-directive` sandbox/izin | mevcut-kapsama |
| 18 | Extension runtime — out-of-process (lifecycle/permission/health) | REUSE + **EXTEND-CONTRACT** | `marketplace-module-security` install/enable/update/quarantine/revoke/rollback+SBOM+RLS mevcut; sandbox teknolojisi ADR-M1'e ertelenmiş; **çalışma-anı health/liveness/heartbeat** sözleşmesi kısmi | kısmi-kapsama |
| 19 | Admin UI extension (operator workbench) | REUSE + **APP-BC** | `core-contract-pack` §3.14 consumer-surface runtime; `kernel-execution-contract-matrix` §8 surface; operator-workbench classification=FOLD (feature) | kısmi-kapsama |
| 20 | Offline edge / POS (sync/conflict) | **DEFER-HUMAN** | classification MAG offline-POS=DEFER (archetype edge); **sync/conflict-resolution** sözleşmesi yok | eksik-direktif |
| 21 | Agentic mandates (imzalı delegasyon) | **DEFER-HUMAN** | `kernel-execution-contract-matrix` §11 `actor_type=agent`+`approval_ref` var; **imzalı mandat/yetki-devri** sözleşmesi yok; AGT2 classification=DEFER, AI yetki sınırı `AGENTS.md` §4.4 | eksik-direktif |
| 22 | Case / support management | **APP-BC** | classification MAG support-case=FOLD (feature, Aftermarket/Marketplace support); kernel primitifi değil | business-BC |
| 23 | Release / workspace / layout | **DEFER-HUMAN** | Tekil **atomik-yayın/layout sözleşmesi repoda kanıtlanmamış**; platform primitifi olduğu iddia edilmez → paylaşılan-yetenek adayı, layer kararı insana (classification §2.1=DEFER-HUMAN) | impl-repo-kanıtı-bilinmiyor |
| 24 | Experimentation / data plane | REUSE + **DEFER-HUMAN** | DAT2 classification=REUSE (Analytics/Search, kendi veri gölü yok); **deney/flag/veri-düzlemi** sözleşmesi ayrı kanıtlanmamış | impl-repo-kanıtı-bilinmiyor |

**Otomatik primitif üretme yasağı:** Yukarıdaki hiçbir EXTEND/SDK-PORT satırı kernel'e yeni primitif *icat etme* izni değildir. EXTEND-CONTRACT en fazla mevcut bir sözleşmenin yüzeyini genişletir; yeni primitif kararı ADR + insan onayı ister (§8).

## 4. Gerçek boşluk adayları (yalnız kanıt destekli)

Aşağıdakiler §3'te kanıt gösterileni doğru layer'a bağlar. Aday, kanıt olmadan "boşluk" ilan edilmez; her biri §8 kuyruğuna veya bir changeset'e (§9) bağlıdır.

| Aday | Doğru layer (repo kriterine göre) | Gerekçe (neden bu layer) |
|---|---|---|
| Envanter-ötesi jenerik availability soyutlaması | **DEFER-HUMAN** (aceleyle EXTEND etme) | Rezervasyon deseni envanterde var ama zaman/kapasite/koltuk farklı veri otoritesi (BC-map §6 modül-terfi). Tek "availability" portu YAGNI riski taşır; layer kararı insana |
| Out-of-process extension yaşam-döngüsü/izin/health | **REUSE + EXTEND-CONTRACT** | Güvenlik yaşam-döngüsü `marketplace-module-security`'de mevcut; yalnız **runtime health/heartbeat** yüzeyi eksik; yeni primitif değil, mevcut sözleşme genişletmesi |
| Commerce adjustment/fee tipli port | **APP-BC** | MAG fee/adjustment classification=FOLD → BC-07 Payment&Adjustment içinde typed-action; kernel primitifi değil (`kernel-execution-contract-matrix` §6 typed-action) |
| Acting-context SDK | **SDK-PORT** | Kernel `platform_actor` var; eksik olan SDK'nın party/group acting-context tipli yüzeyi (Kapı 1); yeni kernel değil |
| İmzalı mandat / ajan delegasyonu | **DEFER-HUMAN** | `approval_ref` + `actor_type=agent` mevcut ama imzalı yetki-devri sözleşmesi yok; AI yetki sınırı (`AGENTS.md` §4.4) nedeniyle insan kararı zorunlu |
| Offline edge/POS sync/conflict sözleşmesi | **DEFER-HUMAN** | Ne kernel ne BC-map'te conflict-resolution sözleşmesi var; CAP2/OMN POS archetype'ına mı yoksa kernel sync primitifine mi ait olduğu insan kararı |
| Payment/tax provider port sınıfı | **EXTEND-CONTRACT** (k-provider-adapter) | Mevcut port/adapter deseni var; ödeme/vergi yeni bir *port sınıfı* olarak eklenir, yeni primitif değil; yürütme sağlayıcıda kalır (PROVIDER) |
| Atomik deneyim yayını / layout | **DEFER-HUMAN** | Sözleşme/impl-repo kanıtı yok → **primitif değil**, paylaşılan-yetenek adayı; önce impl-repo salt-okunur audit |

## 5. Tekrar-etme (no-duplicate) listesi — açık

Aşağıdakiler **kesinlikle yeniden yazılmaz/kopyalanmaz**; Commerce OS bunları tüketir (ADR-0030 §6, `app-distribution-contract` §3.4):
`tenancy` · `identity/authz/PDP` · `audit` · `event/outbox` · `ledger` · `storage/DAM` · `search infra` · `capability/entitlement` · `mode/workflow` · `provider adapter`.
Bir BC bu on başlıktan birini kendi verisinde çoğaltıyorsa, bu bir sözleşme ihlalidir; çözüm kopyalama değil, primitifi tüketmek veya ortak ihtiyacı kernele terfi etmektir (`app-distribution-contract` §3.4).

## 6. Test-önce sözleşme matrisi

Herhangi bir EXTEND/SDK-PORT işi implementasyona geçerse, **önce kırmızı sözleşme testi** yazılır (`AGENTS.md` §3, `kernel-execution-contract-matrix` §12). Aşağıdaki eksenler her yeni port/yüzey için zorunludur.

| Test ekseni | Beklenti (kırmızı-önce) |
|---|---|
| Kırmızı-sözleşme-önce | Port imzası/şeması yokken test kırmızı; implementasyon yeşile getirir |
| Pozitif + negatif | Her pozitif senaryonun negatif karşılığı (yetkisiz/geçersiz) zorunlu (`kernel-execution-contract-matrix` §9) |
| Multi-tenant izolasyon | Cross-tenant okuma/yazma reddi ≥10 negatif case; fail-closed (`core-contract-pack` §2.1) |
| Idempotency / replay | Çift-tetik → tek etki; etiketli mutasyon `scaled_write` (§5, scale-invariant) |
| Forbidden-dependency | Yasak stack (Next/Prisma/Supabase…) SDK/template taramasında reddedilir (`AGENTS.md` §4.1) |
| Provider failure | Sağlayıcı düşünce fallback/circuit-breaker; port hatası sızmaz (`k-provider-adapter` §7) |
| Version compatibility | Public API snapshot + geriye-uyum testi (`be-sdk-readiness-gap` Çıkış Eşiği) |
| Evidence output | Kırmızı→yeşil geçiş + audit/decision_log/outbox izi kanıt-paketinde |

## 7. Implementation-repo sınır uyarısı

Bu doküman **actionplan** (plan+sözleşme) reposunda üretildi; `platform` implementation reposunu değiştirmez ve **paketlerin/portların var olduğunu kanıtlamaz** (`AGENTS.md` §0–§1). `be-sdk-readiness-gap` kanıtı: `platform` checkout'unda `packages/sdk` **yoktur**; yalnız runtime Strawberry schema vardır. Dolayısıyla §3'teki her "REUSE" bile, SDK yüzeyi kanıtlanana dek **tasarım niyetidir, mevcut kod kanıtı değildir**. Statüyü "hazır"a çevirmek için salt-okunur audit + evidence-önce zorunludur; bu direktif bunu başlatmaz.

## 8. İnsan karar kuyruğu (maks. 8)

1. Envanter-ötesi jenerik availability: tek soyutlama mı, per-BC (zaman/kapasite/koltuk) ayrı mı?
2. `k-provider-adapter`'a ödeme/vergi **port sınıfı** eklensin mi (EXTEND), yoksa ayrı payment-orchestration sözleşmesi mi?
3. Out-of-process extension **health/heartbeat** yüzeyi: `marketplace-module-security` genişletmesi mi, ayrı runtime primitifi mi?
4. Acting-context: SDK-PORT yeterli mi, yoksa party/group kernel yüzeyi genişletme mi ister?
5. İmzalı mandat/ajan delegasyonu kapsamda mı? (AGT2 DEFER; `AGENTS.md` §4.4 sınırı)
6. Offline edge/POS sync/conflict: kernel sync primitifi mi, OMN POS archetype feature'ı mı?
7. Atomik deneyim yayını/layout: gerçekten primitif mi? Önce impl-repo audit kararı.
8. Experimentation / veri-düzlemi (§3 satır 24): DAT2 analitik REUSE dışında ayrı deney/flag/veri-düzlemi sözleşmesi gerekli mi, yoksa mevcut analytics/search yeterli mi? Karardan önce impl-repo salt-okunur audit gerekir (impl-repo-kanıtı-bilinmiyor).

## 9. Önerilen gelecek changeset'leri (kod değil, sınır beyanı)

Her changeset **öneridir**; insan onayı + test-önce olmadan üretilmez. `allowed-files` + `non-goal` bildirimi zorunludur (`AGENTS.md` §4.3, §6).

| Changeset (öneri) | allowed-files (öneri) | non-goal | stop-gate (üretmeden dur) |
|---|---|---|---|
| CS-A: Provider port sınıfı genişletme direktifi (ödeme/vergi) | `docs/k-provider-adapter-directive.md` (EXTEND bölümü) | Sağlayıcı adaptör kodu yazmak; lisanslı yürütme (PROVIDER'da kalır) | §8-Q2 insan kararı yoksa DUR |
| CS-B: Out-of-process extension health yüzeyi direktifi | `docs/marketplace-module-security-directive.md` (health/heartbeat) | Sandbox teknolojisi seçmek (ADR-M1); yeni primitif icat etmek | §8-Q3 kararı + ADR-M1 statüsü yoksa DUR |
| CS-C: Acting-context SDK-port direktifi | yeni `docs/sdk-acting-context-port.md` | Kernel `platform_actor` şemasını değiştirmek; kod üretmek | SDK readiness (`be-sdk-readiness-gap` Çıkış Eşiği) yeşil değilse DUR |
| CS-D: Availability abstraction karar ADR taslağı | yeni `docs/adr-XXXX-availability-abstraction.md` | Envanter direktifini yeniden yazmak; jenerik portu zorlamak | §8-Q1 layer kararı yoksa DUR (YAGNI) |
| CS-E: BC↔platform primitif tüketim eşleme matrisi | yeni `docs/commerce-os-primitive-consumption-map.md` | `s-*` düğümlerini değiştirmek; app/module düğümü açmak | ADR-0030 slug/BC insan onayı yoksa DUR |

Her changeset kanonik paket bütçesine uyar (`src/data/standards/short-code.json#changePackageBudget`; `AGENTS.md` §4.3); aşan iş atomik parçalara bölünür.

## İlgili doküman

- [`adr-0030-commerce-operating-system-boundary.md`](./adr-0030-commerce-operating-system-boundary.md), [`commerce-os-product-scope.md`](./commerce-os-product-scope.md), [`commerce-os-capability-classification.md`](./commerce-os-capability-classification.md), [`commerce-os-bounded-context-map.md`](./commerce-os-bounded-context-map.md)
- [`kernel-sdk-app-delivery-sequence.md`](./kernel-sdk-app-delivery-sequence.md) (Commerce OS profili/addendum), [`kernel-execution-contract-matrix.md`](./kernel-execution-contract-matrix.md), [`core-contract-pack.md`](./core-contract-pack.md)
- [`task-to-code-contract.md`](./task-to-code-contract.md), [`app-distribution-contract.md`](./app-distribution-contract.md)
