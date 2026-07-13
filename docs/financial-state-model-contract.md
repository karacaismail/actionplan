# Financial State Model Contract — Altı Finansal Gerçek ve Geçişleri

**Sürüm:** 0.1 · **Tarih:** 2026-07-12 · **Durum:** AI-DRAFT (insan onayı bekler)
**Makine kontratı:** `src/data/standards/finance-money-model.json` (kapı: `check-finance-model`) — para modeli kural değerleri orada yaşar; bu doküman altı-durum semantiğinin gerekçesini anlatır.
**Kapatır:** Revize gap listesi #5 — dış inceleme tespiti: "Budget ≠ Forecast ≠ Commitment ≠ Accrual ≠ Actual ≠ Cash; matris bu altı finansal gerçeği ayırmıyor."
**Konum:** Contract — EVM'in tüm mali modülleri (budget-plan, org-employment accrual, pre-accounting, ledger tüketimi, raporlama) bu durum modeline uyar. `archetype-ledger` (actual'ın kayıt motoru) ve `decision-grade-data-contract` (doğruluk zinciri) ile üçlü temel oluşturur.

---

## 1. Amaç

"Bütçede var" ile "kasada var" arasındaki beş ayrı gerçeği tek modelde ayrıştırmak. Bu ayrım olmadan runway, taahhüt edilmiş ama faturalanmamış harcamayı görmez; bütçe raporu, tahakkuk etmiş ama ödenmemiş karşılığı "harcanmamış" sayar; yönetim yanlış nakit ihtiyacıyla karar verir.

## 2. Altı durum (normatif tanımlar)

| Durum | Tanım (bu üründe) | Kayıt yeri | Örnek |
|---|---|---|---|
| **Planned** | Onaylı bütçe niyeti (dönem×kategori×venture×senaryo) | `budget_line.planned` | "Q3 pazarlama: X ₺ planlandı" |
| **Forecast** | Güncel beklenti (assumption+scenario sürümlü; planned'dan sapabilir) | `forecast_version` hücreleri | "Koşu hızıyla Q3 sonu tahmini Y ₺" |
| **Committed** | Sözleşme/sipariş ile taahhüt edilmiş, henüz faturalanmamış | `commitment` (PO/sözleşme kaydı) | "İmzalı yıllık SaaS sözleşmesi" |
| **Accrued** | Döneme tahakkuk etmiş, ödenmemiş yükümlülük/gelir | ledger accrual fişi | "Kıdem karşılığı 1/12; Temmuz reklam faturası Ağustos'ta gelecek" |
| **Actual** | Ledger'a kayıtlı gerçekleşme (fatura/fiş) | `journal_entry` | "Fatura kesildi, gider kaydedildi" |
| **Cash** | Banka hareketi gerçeği (mutabakatlı) | banka ekstresi ↔ ledger nakit hesabı | "Ödeme hesaptan çıktı" |

Değişmez: **bu altı sayı aynı kavramın aşamaları değil, altı ayrı SORUNUN cevabıdır** — ne planladık / ne bekliyoruz / neye söz verdik / ne doğdu / ne kaydettik / ne ödendi. UI hiçbirini diğerinin yerine gösteremez; her mali görünüm hangi durumu gösterdiğini etiketler.

## 3. Geçiş zinciri ve kayıt kuralları

```
Planned ──(satınalma talebi→PO/sözleşme)──► Committed ──(fatura/dönem tahakkuku)──► Accrued/Actual ──(ödeme+mutabakat)──► Cash
   ▲                                                                                                    
Forecast (sürekli; assumption/scenario sürümüyle her durumdan beslenir, hiçbirine yazmaz)
```

Kurallar: (1) geçişler İLERİ yönlüdür; geri düzeltme ters kayıt/restatement iledir (decision-grade §3.6); (2) commitment, bütçe kullanılabilirliğini düşürür (`available = planned − committed − accrued − actual` — formül sürümlü); (3) accrual yalnız onaylı fişle doğar (org-employment karşılıkları dahil); (4) cash yalnız banka mutabakatıyla `matched` olur; (5) forecast hiçbir durumu DEĞİŞTİRMEZ — ayrı eksendir.

## 4. Boyut ekseni (planning-cube temeli)

Her mali hücre şu koordinatları taşır: `venture × legal_entity × department/cost_center × initiative × account (CoA) × channel(varsa) × reporting_period × scenario × forecast_version`. Bu contract koordinat ZORUNLULUĞUNU tanımlar; tam küp sorgu/pivot sözleşmesi `planning-cube` (P1) dokümanına aittir. Chart of Accounts (hesap planı) ledger'dan; cost/profit-center org-employment `department.cost_center_ref`'ten gelir.

## 5. Kapsadığı ve devrettiği konular

**Bu contract tanımlar:** altı durum + geçişler; commitment kaydının varlığı (PO/purchase-request ince modeli — budget-plan §4.5 genişlemesi); prepaid (peşin ödenmiş gider) ve fixed-asset/amortisman durum eşlemesi (accrual ailesi; ayrıntı ledger yönergesine ek `KARAR BEKLİYOR`); dönem kapanış sırası (alt: tüm accrual fişleri → mutabakatlar → kilit → snapshot); FX politikası (çok-kur: işlem kuru kayıtta, raporlama kuru dönem-sonu; ikisi ayrı saklanır — sessiz çevrim yasak); runway ve cash-flow forecast'in CASH durumundan (planned'dan değil) türetilme zorunluluğu.

**Devrettiği:** çift-taraflı kayıt mekaniği → `archetype-ledger`; doğruluk zarfı/mutabakat/kilit mekanizması → `decision-grade-data-contract`; varsayım/senaryo/sürüm → `archetype-venture-core`; deterministik hesap → `k-computation` (pending); tam boyutlu sorgu → planning-cube (P1); consolidation (çok-legal-entity birleştirme) → v2 `KARAR BEKLİYOR` (tek entity ile başlanır, model koordinatı ilk günden taşır); ödeme yöntemleri/PSP/3-D Secure/dunning/chargeback → `global-market-readiness-directive.md`; pazar-bazlı fiyatlandırma → `standards/10-business-model-switching-standard.md` (sahiplik: §7).

## 6. Ne yapar / ne yapmaz

**Yapar:** her mali rakama durum etiketi zorlar; bütçe kullanılabilirliğini taahhüt-farkında yapar; runway'i nakit gerçeğine bağlar; dönem kapanışına sıra verir. **Yapmaz:** muhasebe standardı (VUK/IFRS) beyanı üretmez (yönetim muhasebesi aracıdır; resmî defter dışarıdadır ve mutabakat kaynağıdır); vergi hesaplamaz; banka entegrasyonunun kendisini tanımlamaz (integration-reconciliation P1; burada yalnız cash-matched şartı).

## 7. Global vergi, faturalandırma ve para modeli semantiği

Bu bölüm altı durumu değiştirmez; Committed→Accrued/Actual→Cash zincirini üreten fatura ve para değerlerinin global semantiğini tamamlar.

**CLDR sınırı (normatif):** CLDR parayı doğru GÖSTERİR (sembol, ayraç, basamak gruplama); şunların HİÇBİRİNİ söyleyemez: hangi verginin uygulanacağı; verginin hangi ülkeye ödeneceği; müşterinin B2B mi B2C mi olduğu; verginin fiyata dahil mi hariç mi ("vergi dahil" / "vergi hariç") gösterileceği; vergi numarasının geçerliliği; reverse charge uygulanıp uygulanmayacağı; faturada zorunlu alanlar; fatura numarası üretimi; elektronik faturanın hangi sisteme iletileceği; iade ve alacak notunun düzenlenişi. Avrupa'da OSS mekanizmasında dahi vergi müşteri ülkesi + satış türü + işletme statüsüne göre değişir (kaynak: https://europa.eu/youreurope/business/taxation/vat/one-stop-shop/index_en.htm); Peppol gibi e-fatura birlikte çalışabilirlik sistemleri ülkeye özgü işlem/belge gereksinimleri doğurur. Vergi ve fatura kuralları locale'den türetilemez; açık vergi/fatura konfigürasyonundan gelir.

**Para modeli — asla varsayılmayacaklar (normatif):** (1) her para birimi iki ondalık basamak kullanmaz; (2) gösterim yuvarlaması ile muhasebe yuvarlaması aynı olmayabilir — ikisi ayrı politikadır; (3) vergi satır bazında veya toplam üzerinden hesaplanabilir, seçim beyan edilir; (4) kur dönüşüm tarihi ödeme/fatura/iade/raporlama için farklı olabilir (§5 FX politikasıyla tutarlı); (5) prorasyon ve kupon dağıtımı kuruş farkları doğurur — fark dağıtım kuralı açık yazılır; (6) iadenin orijinal kurla mı güncel kurla mı yapılacağı açıkça belirlenir; (7) faturalandırma para birimi, gösterim para birimi ve muhasebe para birimi AYRILIR. Para değerleri için sabit noktalı/decimal model + para birimi kodu + açık ölçek + açık yuvarlama politikası ZORUNLUDUR; "her şeyi 100 ile çarpıp integer tutma" yaklaşımı tüm para birimleri ve muhasebe işlemleri için YETERSİZDİR. ISO 4217 para kodlarını ve minor unit ilişkilerini tanımlar; ticari hesap politikasını tanımlamaz (kaynak: https://www.iso.org/iso-4217-currency-codes.html).

**Sahiplik:** ödeme yöntemleri/PSP/3-D Secure/dunning/chargeback `global-market-readiness-directive.md`'dedir; pazar-bazlı fiyatlandırma `standards/10-business-model-switching-standard.md`'dedir (çapraz referans: §5 devir listesi). Bu contract yalnız para değerinin temsilini ve durum modelindeki semantiğini tanımlar.

## 8. Test stratejisi (test-önce)

(1) Durum etiketsiz mali görünüm render edilemez (UI conformance); (2) commitment girilince available düşer, fatura gelince commitment→actual devri çift saymaz (kritik invariant); (3) accrual onaysız doğamaz; (4) cash yalnız mutabakatla matched olur, mutabakatsız cash raporu confidence-düşük işaretlenir; (5) FX: işlem+raporlama kuru ayrı saklanır, sessiz çevrim testte yakalanır; (6) runway CASH'ten hesaplanır — planned'dan hesaplayan kod testte kırmızı; (7) dönem kapanış sırası atlanamaz (accrual'sız kilit reddedilir); (8) forecast yazımı hiçbir durumu değiştirmez (salt-okunur eksen testi); (9) para birimi kodu, açık ölçek veya yuvarlama politikası eksik para değeri kaydedilemez — iki ondalık varsayımını sabitleyen kod, sıfır ve üç minor-unit'li para birimleriyle testte kırmızı.

## 9. DoD

17 boyut kartı; budget-plan/org-employment yönergeleri bu contract'a `dependsOn` verir ve durum eşlemelerini beyan eder; KPI sözlüğündeki mali metrikler hangi DURUMDAN türediğini bildirir (runway=cash, sapma=actual+accrued vs planned…); `KARAR BEKLİYOR`: prepaid/fixed-asset ayrıntı yeri, consolidation zamanlaması, resmî muhasebe mutabakat frekansı.
