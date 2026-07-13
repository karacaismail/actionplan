# Commerce Operating System — Capability Sınıflandırması (Classification)

**Durum:** DRAFT — 2026-07-13 · **Kaynak yetki:** [`adr-0030-commerce-operating-system-boundary.md`](./adr-0030-commerce-operating-system-boundary.md) §3
**Kapsam:** Yalnız dokümantasyon; kod/şema/JSON üretmez, düğüm açmaz ([`AGENTS.md`](../AGENTS.md) §0, §4.4).

> **Prefix kapsaması ≠ item kabulü.** Bu matris araştırma korpusundaki **kaynak-aile prefix'lerini** sınıflandırır. Bir prefix'in burada disposition alması, o ailenin **tek tek item'larının** kabul edildiği anlamına gelmez. Herhangi bir node/queue/kod üretiminden **önce item-level triyaj ZORUNLUDUR** (§4). Sayı hedef değildir; "N özellik → N düğüm" akışı geçersiz (ADR-0030 §4).

## 1. Sözlük

**Proposed level:** `platform-primitif` (tüketilir, inşa edilmez) · `module` (dağ/BC) · `archetype` (kaya) · `feature` (taş) · `policy`/`config` (mode/edition ayarı) · `provenance` (araştırma kökeni, seviye değil).

**Disposition:** `REUSE` (platform primitifi, yeniden yazma) · `KEEP-BC` (aday business BC) · `FOLD` (mevcut BC içine feature/policy/config olarak katla) · `DEDUP` (örtüşen prefix ile birleştir) · `PROVENANCE` (yalnız araştırma/köken) · `DEFER` (provisional, insan onayına ertelenir).

Sütunlar: **Prefix** · **Semantik** · **Önerilen seviye** · **Muhtemel hedef/owner (BC)** · **Disposition** · **Duplicate/overlap kuralı** · **İnsan kararı**.

## 2. Kaynak-aile prefix matrisi

Semantikler kullanıcının korpusundan bağlayıcıdır; tahmin değildir.

| Prefix | Semantik (bağlayıcı) | Önerilen seviye | Muhtemel hedef/owner (BC) | Disposition | Duplicate/overlap kuralı | İnsan kararı |
|---|---|---|---|---|---|---|
| B2B | Hesap-tabanlı satış: hesap hiyerarşisi, sözleşme-fiyat, teklif, satın-alma onay akışı | module (edition) | B2B Procurement & Account Commerce | KEEP-BC | Satış-tarafı; PRC (alım-tarafı) ile ayrış | B2B ayrı BC mi mode mu? |
| PRC | **E-procurement/B2G/B2E:** requisition, onay, sourcing/RFx, tedarikçi yeterlilik, PO/mal-kabul/fatura-eşleştirme | module (edition) | B2B Procurement & Account Commerce (alım) | KEEP-BC | Alım-tarafı akış; SUP2 replenishment ile ayrış | Procurement B2B ile tek BC mi? |
| MKT | Çok-satıcılı pazar yeri operasyonu, seller lifecycle | module (edition) | Marketplace Operations & Trust | KEEP-BC | TRS2 (trust) buraya folds; payout Settlement'a | Marketplace edition sınırı |
| SRV | Hizmet ticareti, randevu, iş emri | module (edition) | Service/Booking/Rental | DEFER | EVT2/IOT2/RNT ile lifecycle-otorite ayrımı | Service+Booking+Rental tek BC mi? |
| SUB | Abonelik, yenileme, dönemsel faturalama | module (edition) | Subscription & Membership | KEEP-BC | MEM2 ekonomisiyle birleşik | Subscription+Membership sınırı |
| RNT | Kiralama, süre-bazlı, teminat, iade | module (edition) | Service/Booking/Rental | DEFER | IOT2 (leasing/asset-finance) ile örtüşür | Rental+Asset-finance tek BC mi? |
| AUC | Açık artırma, teklif oluşumu, kapanış | module (advanced) | Auction/Crowdfunding | DEFER | Fiyat oluşumu Offer&Pricing değil Auction | Auction MVP dışı mı? |
| CFG | Konfigüratör/CPQ, kural-tabanlı seçenek | archetype/feature | Offer & Pricing / Catalog | FOLD | `s-cpq` ile eşle; BC'ye terfi etme | CPQ Offer mı Catalog mı? |
| REC | **Recommerce/trade-in/konsinye/döngüsel:** tekil kullanılmış varlık, durum, provenans, otantisite, refurb/disposition | module (edition) | Recommerce & Asset Lifecycle | KEEP-BC | Tekil-varlık kimliği Catalog'un seri-üretim modelinden ayrı | Recommerce ayrı BC mi? |
| OMN | Omnichannel perakende, POS, click&collect | module (edition) | Channel/Omnichannel | KEEP-BC | CHN2 (dealer) farklı semantik; DEDUP değil, ayrış | OMN ve CHN2 tek BC mi? |
| DIG | Dijital ürün, indirme, lisans-anahtarı | archetype | Catalog Governance (Digital) | FOLD | Fulfilment DIG'e özel; Fulfillment BC'ye bağlan | Digital ayrı archetype mı? |
| XBR | Sınır-ötesi: para birimi, vergi, gümrük | policy/profile | Cross-border/Compliance | DEFER | CMP2 ile birleşik policy; vergi sağlayıcıya (ADR-0030 §7) | XBR policy mi BC mi? |
| TEN | Kiracı izolasyonu, tenant yaşam döngüsü | platform-primitif | Platform kernel | REUSE | İnşa edilmez; tenancy tüketilir | — (kilitli) |
| CAT2 | **CatalogOps/governance** (yalnız CRUD değil): yaşam döngüsü, onay, projeksiyon, drift | module (core) | Catalog Governance | KEEP-BC | MER2 sunum, DSC2 keşif ile ayrış; `s-pim` eşle | Catalog ↔ PIM birleşir mi? |
| DSC2 | **Arama/keşif:** typo/eşanlam/NL/görsel arama, ranking, kayıtlı arama, açıklanabilirlik | feature/archetype (SDK) | Search & Discovery (search primitifi üstü) | FOLD | Platform search (DAT2) tüketir; kendi veri otoritesi yok | Discovery BC mi feature mı? |
| MER2 | Merchandising, vitrin, sıralama, kampanya sunumu | feature/module | Promotions/Merchandising | FOLD | CAT2 otoritesini tüketir; ürün deposu yok | Merchandising BC mi feature mı? |
| CKO2 | Sepet, checkout, ödeme başlatma | module (core) | Cart & Checkout | KEEP-BC | Ödeme yürütme PAY2; CKO2 orchestrate etmez | Cart ve Checkout tek BC mi? |
| PRM2 | Promosyon motoru, kupon, kural | module/feature (edition) | Promotions/Merchandising | KEEP-BC | MER2 ile aynı BC grubu; opsiyonel (zorunlu core değil) | Promotions edition mı? |
| PAY2 | **Ödeme orchestrasyonu + treasury detayları:** PSP, refund, fee/adjustment | module (core) | Payment & Adjustment Orchestration | KEEP-BC | Lisanslı yürütme sağlayıcıda (ADR-0030 §7); Settlement ayrı | Payment orchestrator sınırı |
| OMS2 | **Fulfillment/order-promise/warehouse ops** | module (core, bölünmüş) | Order Orchestration + Inventory & Availability + Fulfillment & Returns | KEEP-BC | Sipariş otoritesi ↔ envanter ↔ fulfilment ayrı BC | OMS kaç BC'ye bölünür? |
| SUP2 | Tedarikçi, dropship, replenishment | module (advanced) | Supplier Network | DEFER | PRC alım-akışı ile ayrış; envanter otoritesi Inventory'de | Supplier advanced mı? |
| CHN2 | **Dealer/distributor/franchise kanal:** müşteri-SKU, blanket order, rebate, deal-registration, MDF, exclusivity, royalty, sell-through | module (edition) | Channel/Omnichannel | KEEP-BC | OMN (perakende) farklı; ayrı sub-context | CHN2 ayrı BC mi OMN alt-context mi? |
| TRS2 | **Marketplace güven/kalite/gelir:** reputation, IP/sahte/yasaklı, buyer-protection, demand-board, sponsored-ranking, seller-membership/support | module (edition) | Marketplace Operations & Trust | FOLD | MKT ile aynı BC; gelir-paylaşımı Settlement'a | Trust MKT içinde mi? |
| EVT2 | **Etkinlik/bilet/seyahat/kapasite:** waitlist, overbooking, seat-map, bilet-transfer/resale, itinerary/rate-plan/allotment | module (edition) | Booking & Capacity (Service/Booking/Rental) | DEFER | Koltuk/allotment otoritesi Inventory'den farklı → provisional ayrı | EVT2 ayrı BC mi Service içinde mi? |
| MEM2 | **Gelişmiş abonelik/üyelik ekonomisi:** phased/mixed period, consolidated/threshold billing, credit, retention, family membership | module (edition) | Subscription & Membership | KEEP-BC | SUB ile birleşik | (SUB ile karar) |
| IOT2 | **Kiralama/leasing/IoT/asset finance** | module (edition) | Service/Booking/Rental (Asset Finance) | DEFER | RNT ile örtüşür; asset-finance lifecycle ayrı olabilir | IoT/asset-finance ayrı BC mi? |
| AFT2 | After-sales/garanti/tamir/reverse-logistics | module | Fulfillment & Returns (Aftermarket) | DEFER | OMS2 fulfilment ile ayrış; reverse-logistics | Returns core mi edition mı? |
| CMP2 | Compliance/privacy/safety/sustainability | policy/profile + module | Cross-border/Compliance | DEFER | XBR ile birleşik policy; audit primitifini tüketir | Compliance policy mi BC mi? |
| DAT2 | Analytics/experimentation/data | platform-primitif/SDK | Platform (Analytics/Search) | REUSE | Kendi veri gölü yok; DSC2 keşfini besler | Analitik SDK sınırı |
| PLT2 | Platform operability/extensibility | platform-primitif | Platform kernel | REUSE | İnşa edilmez; tüketilir | — (kilitli) |
| AGT2 | Agentic commerce (otonom işlem) | provisional/SDK | — | DEFER | AI yetki sınırına tabi ([`AGENTS.md`](../AGENTS.md) §4.4); BC değil | AGT2 kapsamda mı? |
| DRC | Drupal-türevi davranış seti (provenans **ad**, davranış değil) | çok-seviye | bkz. §2.1 DRC alt-aile tablosu | (satır-başı) | Runtime bağımlılık değil (ADR-0030 §5); davranışlar sınıflandırılır, atılmaz | Her DRC alt-ailesi item triyajı |
| MAG | Magento-türevi davranış seti (provenans **ad**, davranış değil) | çok-seviye | bkz. §2.2 MAG alt-aile tablosu | (satır-başı) | Runtime bağımlılık değil; davranışlar sınıflandırılır, atılmaz | Her MAG alt-ailesi item triyajı |
| EXT | In-process/out-of-process extension runtime + SDK sözleşmeleri | platform-primitif | Extension runtime | REUSE | [`app-distribution-contract.md`](./app-distribution-contract.md) §3.4; yeniden yazma | — (kilitli) |

**Fiyat notu:** Korpusta ayrı bir "pricing" prefix'i yok; PRC = e-procurement'tır. Fiyat capability'si CFG, PRM2 ve B2B sözleşme-fiyatı gibi ailelerden türetilir ve **Offer & Pricing** BC'sinde toplanır ([`commerce-os-bounded-context-map.md`](./commerce-os-bounded-context-map.md) BC-02).

### 2.1 DRC — Drupal-türevi davranış alt-aileleri (davranışlar sınıflandırılır, kaybedilmez)

DRC adı provenanstır; aşağıdaki davranışlar **platform/SDK/business-feature/workflow/archetype/BC** eksenlerinde sınıflandırılır. Item-level kabul **beklemede**.

| DRC alt-aile | Davranış | Önerilen seviye | Hedef | Disposition |
|---|---|---|---|---|
| Capability commerce | Capability/entitlement'ın satılması | platform-primitif + business feature | Entitlement + Offer & Pricing | REUSE + FOLD |
| Object-scoped paid access/mutation/pay-to-publish | Nesne-kapsamlı ücretli erişim/mutasyon | policy(PDP) + feature | PDP + Cart & Checkout | FOLD |
| Form-to-commerce | Form → sipariş dönüşümü | feature/archetype (SDK) | Cart & Checkout | FOLD |
| Acting context / group ownership | Aktör-bağlamı, grup sahipliği | platform-primitif | Identity/Party/Group | REUSE |
| Operator workbench | Operatör iş-tezgahı (admin surface) | feature/archetype (SDK) | Cross-BC operatör yüzeyi | FOLD |
| Visual automation | Görsel otomasyon (ECA/workflow) | platform-primitif | Workflow/ECA | REUSE |
| Atomic experience releases / layout | Atomik deneyim yayını + layout | platform/shared-capability adayı (kanıtlanmamış) | Release + Extension (aday) | DEFER-HUMAN |
| Signed cart recipes / purchase intents | İmzalı sepet reçetesi/satın-alma niyeti | business feature | Cart & Checkout (signed intent) | DEFER |
| Price observation / UBL | Fiyat gözlemi, UBL değişimi | feature/integration | Offer & Pricing / Channel feed | FOLD |

### 2.2 MAG — Magento-eklenti-türevi davranış alt-aileleri (davranışlar sınıflandırılır, kaybedilmez)

MAG adı provenanstır; davranışlar sınıflandırılır. Modül-terfi kriterini (§6) geçmedikçe feature/archetype/SDK yüzeyi olarak kalırlar. Item-level kabul **beklemede**.

| MAG alt-aile | Davranış | Önerilen seviye | Hedef | Disposition |
|---|---|---|---|---|
| SEO Ops | SEO operasyonları | feature (SDK surface) | Channel / Catalog | FOLD |
| Channel feed compiler | Kanal feed derleyici | feature/archetype | Channel/Omnichannel | FOLD |
| Data mapping / import-export | Veri eşleme, içe/dışa aktarım | SDK-port adayı (kısmen kanıtlı) | Platform data (EXT/DAT2) + migration/worker deseni | SDK-PORT/DEFER |
| Offline POS edge | Çevrimdışı POS uç | archetype (edge) | Channel/Omnichannel (POS) | DEFER |
| Commerce support case | Destek talebi | feature | Aftermarket / Marketplace support | FOLD |
| Fee / adjustment | Ücret/düzeltme | business feature | Payment & Adjustment Orchestration | FOLD |
| Q&A / knowledge | Soru-cevap/bilgi | feature | Catalog / Merchandising | FOLD |
| Badges | Rozetler | feature/policy | Marketplace Trust / Merchandising | FOLD |
| Affiliate attribution / settlement | Ortaklık atıf/uzlaştırma | business feature/module | Settlement & Revenue Share | DEFER |
| Federated identity | Federe kimlik | platform-primitif | Identity | REUSE |
| Fit knowledge | Beden/uygunluk bilgisi | feature | Merchandising / Catalog | FOLD |
| Post-purchase journeys | Satın-alma sonrası akışlar | feature/workflow | Order / Aftermarket (workflow) | FOLD |
| Price transparency | Fiyat şeffaflığı | feature | Offer & Pricing | FOLD |
| Review intelligence | Değerlendirme zekası | feature | Marketplace Trust / Merchandising | FOLD |
| Editorial graph | Editoryal içerik grafiği | feature/archetype | Merchandising (content) | FOLD |
| Catalog projections / drift | Katalog projeksiyon/drift | platform-primitif + feature | Catalog Governance + search | FOLD + REUSE |

## 3. Cross-model composite'ler

Composite'ler **yeni BC değildir**; edition + mode kompozisyonuyla çözülür ([`mode-profile-contract.md`](./mode-profile-contract.md), ADR-0030 §8).

| Composite | Bileşen aileler | Önerilen seviye | Disposition | İnsan kararı |
|---|---|---|---|---|
| B2B satış + Procurement | B2B, PRC | edition kompozisyonu | KEEP-BC (tek BC) | Satış+alım tek Procurement BC mi? |
| Marketplace + Trust | MKT, TRS2 | edition kompozisyonu | FOLD (tek BC) | Trust ayrı feature mı? |
| Marketplace + Settlement | MKT, PAY2, affiliate settlement | advanced-network | DEFER | Payout/gelir-paylaşımı ayrı BC mi? |
| Subscription + Membership | SUB, MEM2 | edition kompozisyonu | KEEP-BC (tek BC) | Ekonomi tek BC'de mi? |
| Booking/Rental/Asset-finance | SRV, RNT, EVT2, IOT2 | edition kompozisyonu | DEFER | Lifecycle-otoriteye göre böl |
| Cross-border + Compliance | XBR, CMP2 | policy/profile | DEFER | Bağımsız lifecycle yoksa policy mi? |
| Recommerce + Aftermarket | REC, AFT2 | edition kompozisyonu | DEFER | Refurb/return tek akış mı? |

**Composite kuralı:** Bir composite iki BC'nin *çakışan yazma* ihtiyacı doğuruyorsa, çözüm yeni BC değil, **orchestration + event** akışıdır; cross-context write yasaktır ([`commerce-os-bounded-context-map.md`](./commerce-os-bounded-context-map.md)).

## 4. Item-level triyaj (ZORUNLU kapı)

Prefix disposition'ı **kapı değildir**. Her item için, node/queue üretiminden önce:
1. **Aidiyet:** item hangi BC'ye ait? (owner tek olmalı)
2. **Seviye:** feature mı, config mi, mevcut feature'ın parçası mı? (spekülatif BC yasak)
3. **Dedup:** başka prefix/item bunu zaten karşılıyor mu?
4. **Provenans kontrolü:** DRC/MAG kökenli ise runtime bağımlılık üretmiyor mu? (ADR-0030 §5)
5. **Sağlayıcı sınırı:** düzenlenmiş yürütme içeriyorsa sağlayıcıya delege mi? (ADR-0030 §7)
6. **Test-önce:** requirements + test-plan kapısı geçilmeden development yok ([`task-to-code-contract.md`](./task-to-code-contract.md) §2–3).

## 5. Dedup kriterleri

Bir prefix/item, mevcut bir BC/feature ile **DEDUP/birleştirme** edilir eğer: (a) aynı veri otoritesini talep ediyorsa; (b) aynı domain event'i yayınlıyorsa; (c) yalnız sunum/etiket farkı varsa; (d) örtüşen yaşam döngüsü durum makinesine sahipse. Açık birleşme adayları: **MKT+TRS2** (Marketplace Operations & Trust), **SUB+MEM2** (Subscription & Membership), **B2B+PRC** (Procurement & Account Commerce), **PRM2+MER2** (Promotions/Merchandising). Ayrıştırılması gereken **sahte-örtüşmeler** (birleştirilmez): **OMN vs CHN2** (perakende omnichannel ↔ dealer/distributor/franchise), **RNT vs IOT2** (kiralama ↔ leasing/asset-finance), **DSC2** (arama/keşif — promosyon/indirimle karıştırılmaz).

## 6. Modül-terfi (module-promotion) kriterleri

Bir aday ancak şu **hepsi** doğruysa `module`/BC seviyesine terfi eder:
- Tek ve net **data authority** (başka BC'nin yazmadığı veri) sahibi.
- Bağımsız **yaşam döngüsü / durum makinesi** var (başka BC'nin alt-durumu değil).
- En az bir **yayınlanan domain event** ile diğerlerinden gevşek bağlı.
- **Cross-context write** gerektirmiyor; ihtiyacı event/orchestration ile karşılanabiliyor.
- Bağımsız **satılabilir/ambalajlanabilir** değeri var (edition'a girebilir).

Bunlar sağlanmıyorsa aday `feature`/`policy`/`config` olarak **FOLD** edilir; BC'ye terfi ettirilmez (YAGNI; [`AGENTS.md`](../AGENTS.md) §4.3).

## İlgili doküman

- [`adr-0030-commerce-operating-system-boundary.md`](./adr-0030-commerce-operating-system-boundary.md), [`commerce-os-product-scope.md`](./commerce-os-product-scope.md), [`commerce-os-bounded-context-map.md`](./commerce-os-bounded-context-map.md)
- [`task-to-code-contract.md`](./task-to-code-contract.md), [`capability-entitlement-contract.md`](./capability-entitlement-contract.md), [`mode-profile-contract.md`](./mode-profile-contract.md), [`app-distribution-contract.md`](./app-distribution-contract.md)
