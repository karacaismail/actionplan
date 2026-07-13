# ArcheType Budget-Plan Yönergesi — Bütçe Planlama ve Plan-vs-Actual Metamodeli

**Sürüm:** 0.2 · **Tarih:** 2026-07-12 · **Durum:** AI-DRAFT (insan onayı bekler)
**KONUM (v0.2 düzeltmesi):** EVM (enterprise-venture-management) ürününün archetype'ıdır; Arsam yalnız tenant'tır. Üst sözleşmeler: her kayıt venture+reporting_period koordinatı taşır (`archetype-venture-core §4.2`), doğruluk zarfı/mutabakat/kilit `decision-grade-data-contract`'a, durum ayrımı `financial-state-model-contract`'a tabidir — **bu yönergedeki `planned/actual/forecast` alanları o modelin altı durumundan yalnız üçünü taşır; `committed` (PO/sözleşme taahhüdü) genişlemesi financial-state §5 uyarınca bu yönergeye eklenecek açık iştir (`KARAR BEKLİYOR`: v1'de mi v1.1'de mi).**
**Kapatır:** `kapsama-matrisi-arsam-panel-2026-07-12.md` Bölüm 3 P0 satırı (#3 bütçe/opex-capex)
**Probe bağı:** `docs/reference/Arsam-Girisim-Yonetim-Gereksinim-Analizi.md` §3.2, §5.1 (#3 Budget & FP&A, #6 Pre-accounting), §7 (D4), §9 (E2/E3/E4)
**Kritik ayrım:** `archetype-ledger` **gerçekleşmiş** mali hareketi tutar (kayıt gerçeği); bu archetype **planlanan** hareketi tutar (niyet) ve ikisini karşılaştırır. Bütçe ledger'a yazmaz; ledger'dan OKUR.

---

## 1. Amaç

Girişimin harcama niyetini (opex/capex bütçe satırları) birinci-sınıf, dönemli, sürümlü veriye çevirmek; gerçekleşmeyi ledger ve ön-muhasebe kayıtlarından otomatik akıtmak; sapmayı hesaplanabilir ve uyarı-üretir kılmak (plan-vs-actual); capex onay akışını ve forecast'i (ileriye dönük tahmin) aynı metamodele bağlamak. "Bütçe Excel'de, gerçekleşme muhasebede, sapma kimsenin aklında" kopukluğunu kapatır.

## 2. Kapsam

`budget_plan` (dönem+sürüm kökü) + `budget_line` (opex/capex × kategori satırı) + `purchase_record` (ön-muhasebe kayıt köprüsü) + actuals-feed sözleşmesi + sapma/forecast türetimleri + capex onay akışı.

### Non-goals (kapsam dışı)

- Çift taraflı kayıt, hesap planı, dönem kapanışı (ledger'ın işi).
- Resmî muhasebe, e-fatura, vergi beyanı, banka mutabakatı.
- Maaş parametrelerinin tanımı (org-employment'ın işi; personel bütçe satırı ORADAN beslenir).
- Kampanya atribüsyonu/CAC (campaign-attribution P1; kanal bütçe satırı buradan, getiri oradan).
- Nakit akışı/treasury yönetimi (v2+).

## 3. Tanım (nedir / ne yapar / ne yapmaz)

**Nedir:** Planlanan mali hareketin metamodeli: kim, hangi dönemde, hangi kategoriye, ne harcamayı planladı; gerçekte ne oldu.

**Ne yapar:** Bütçeyi dönem (ay/çeyrek/yıl) ve sürüm (v1 plan → revize) ekseninde saklar; her satırı opex/capex sınıfı + kategori taksonomisine bağlar; gerçekleşmeyi iki kaynaktan akıtır (ledger fişleri + purchase_record'lar, kategori eşlemesiyle); sapma ve forecast'i `k-computation` disipliniyle türetir; eşik aşımında ECA uyarısı üretir (E2/E3); capex satırında tutar eşiği üstünü CEO step-up onayına bağlar; istihdam planından (org-employment `HeadcountPlan`) personel satırlarını otomatik üretir.

**Ne yapmaz:** Ledger'a fiş YAZMAZ (tek istisna yok — accrual fişini de org-employment tetikler, bütçe değil); geçmiş dönem planını değiştirmez (revizyon = yeni sürüm, üzerine yazma değil); harcamayı ENGELLEMEZ (v1'de uyarır/eskale eder; hard-block `KARAR BEKLİYOR`); kur çevirisini gizlice yapmaz (çok-kur satırlar rapor kurunda AÇIK çevrimle gösterilir).

## 4. Sözleşme şekli (alan | tip | amaç)

### 4.1 `budget_plan` — dönem/sürüm kökü

| Alan | Tip | Amaç |
|---|---|---|
| `id`, `tenant_id` | `uuid` | Kimlik + RLS |
| `period` | `DateRange` + `EnumType` (month/quarter/year) | Bütçe dönemi |
| `version` | ardışık tamsayı + `status` `EnumType` (draft/active/superseded) | Aynı dönemde tek `active`; revize yeni sürüm |
| `title`, `note` | `I18nText` | Bağlam |
| `approved_by`, `approved_at` | `PartyRef`, `timestamptz` | Aktifleşme onayı (CPO; capex istisnası §4.2) |

### 4.2 `budget_line` — bütçe satırı

| Alan | Tip | Amaç |
|---|---|---|
| `id`, `tenant_id`, `plan_ref` | `uuid`, `EntityRef` | Bağ |
| `line_class` | `EnumType` (**opex** / **capex**) | Sınıf; capex onay kuralının anahtarı |
| `category_ref` | `EntityRef` → harcama taksonomisi | Personel / pazarlama-kanal / SaaS / donanım / ofis / diğer (taxonomy tenant-özelleştirilebilir) |
| `owner_ref` | `PartyRef` (rol: cost-center sahibi) | Sapma eskalasyonunun muhatabı |
| `planned_amount` | `Money` | Planlanan tutar; kur ayrık |
| `actual_amount` | türetilmiş `Money` (yazılamaz) | Actuals-feed toplamı (§4.4); elle giriş YASAK |
| `variance` | türetilmiş `Percentage` | (actual − plan) ÷ plan; E2/E3 girdisi |
| `forecast_amount` | türetilmiş `Money` | Dönem-sonu tahmini (`k-computation`; koşu hızı yöntemi v1) |
| `source` | `EnumType` (manual / headcount_plan / saas_inventory) | Otomatik üretilen satırın kaynağı (org-employment / metering) |
| `approval_state` | `EnumType` + `approval_ref` | Capex: `planned_amount > capex_threshold` (`VERİ BEKLİYOR`) → CEO step-up (E-onay PDP'de) |

### 4.3 `purchase_record` — ön-muhasebe kayıt köprüsü

Şirket-içi alımların (masa, bilgisayar, SaaS aboneliği, AI kredisi, reklam harcaması) sade kayıt ucu. Resmî muhasebe DEĞİLDİR; bütçe eşlemesi ve fiş TASLAĞI üretir.

| Alan | Tip | Amaç |
|---|---|---|
| `id`, `tenant_id` | `uuid` | Kimlik |
| `record_kind` | `EnumType` (purchase / sale / ad_spend / subscription / other) | Tür |
| `amount` | `Money` | Tutar |
| `occurred_on` | `date` | Harcama günü (dönem eşlemesi) |
| `category_ref` | `EntityRef` → harcama taksonomisi | budget_line eşleme anahtarı |
| `budget_line_ref` | `EntityRef` (nullable, önerilir) | Doğrudan satır bağı; boşsa kategori+dönemden çözülür |
| `counterparty` | `PartyRef` / serbest ad | Tedarikçi |
| `document_ref` | `AssetRef` (fatura/fiş görseli) | `k-storage`; belge zorunluluğu eşiği `KARAR BEKLİYOR` |
| `ledger_entry_ref` | `EntityRef` (nullable) | Finance onayıyla kesilen fişin bağı; kayıt→fiş izlenebilirliği |
| `entered_by` | `PartyRef` | Giren (asistan/finance); audit |

### 4.4 Actuals-feed sözleşmesi (gerçekleşme akışı)

İki kaynak, tek kural: (1) `ledger.journal_line` — hesap→kategori eşleme tablosuyla; (2) `purchase_record` — henüz fişe dönmemiş kayıtlar "soft actual" olarak AYRI renkte raporlanır (çifte sayım bariyeri: `ledger_entry_ref` dolan kayıt soft'tan düşer). Feed idempotent ve yeniden-hesaplanabilirdir (as-of: dönem kapandıktan sonra geriye dönük fiş, o dönemin actual'ını günceller ve audit iz bırakır).

## 5. WBS / bağımlılık

Seviye: `archetype` (kaya). Bağımlılık: `archetype-ledger` (okuma), `archetype-taxonomy` (kategori), `k-policy-pdp` (capex step-up), `k-computation` (variance/forecast — **pending önkoşul**), `k-worker` (dönem-sonu jobs), `k-storage` (belge), org-employment (`HeadcountPlan` → personel satırı üretimi). Üst sözleşmeler (dependsOn): `archetype-venture-core` (koordinat), `decision-grade-data-contract` (zarf/mutabakat/kilit), `financial-state-model-contract` (durum etiketleri). Tüketici: EVM Budget & FP&A + Pre-accounting modülleri; kurul raporu (report-scheduler P2) bu veriden okur.

## 6. Multi-tenant + AI guardrail

Tenant: `tenant_id` + RLS her tabloda; bütçe verisi ticari sırdır (U3) — `board_member` özet görür, satır detayı ABAC'a tabidir (probe §6 D3 matrisi). `dataLifecycle` boyutu finans risk sinyaliyle zorunlu doludur.

AI sınırı: AI bütçe taslağı satırları, sapma AÇIKLAMA özeti ve forecast senaryosu önerebilir — hepsi `draft`. AI `planned_amount`/`actual_amount` DEĞİŞTİREMEZ, plan AKTİFLEŞTİREMEZ, capex ONAYLAYAMAZ, purchase_record'u fişe DÖNÜŞTÜREMEZ, eşik/kural tanımlayamaz. Onay zinciri: satır sahibi girer → CPO planı aktifler → capex eşik üstü CEO step-up → fiş her zaman finance_lead.

## 7. Test stratejisi (test-önce, negatif testler dahil)

- **Sürümleme:** aynı dönemde ikinci `active` plan reddedilir; revize yeni sürüm açar, eskisi `superseded` + değişmez.
- **Türetilmişler:** `actual_amount`/`variance`/`forecast` alanlarına doğrudan yazma girişimi reddedilir; feed'den yeniden hesap deterministik (aynı girdi→aynı sonuç).
- **Çifte sayım:** purchase_record fişe bağlanınca soft-actual düşer, toplam değişmez (kritik invariant testi).
- **Kur:** farklı kurlu satırlar toplanırken açık çevrim kuru zorunlu; kur belirtmeden toplama hata fırlatır (Money invariantı).
- **Capex onayı:** eşik altı satır CPO ile aktifleşir; eşik üstü CEO step-up'sız aktifleşemez (negatif test); onay audit'e düşer.
- **ECA:** actual, plan×0.9'u aşınca E2 uyarısı; planı aşınca E3 eskalasyon — kural simülasyon çıktısı kanıt.
- **As-of:** dönem kapanışı sonrası geriye dönük fiş → actual güncellenir + audit izi; geçmiş PLAN değişmez.
- **Yetki (negatif):** team_member bütçe satırı okuyamaz; hr maaş-dışı satır göremez `KARAR BEKLİYOR` netleşince; komşu tenant 0 satır.
- **Journey (e2e):** plan kur → satır ekle → aktifle → purchase gir → soft actual gör → fiş kes → hard actual'a dönüşsün → sapma uyarısı tetiklensin.

## 8. Kabul kriterleri + Anti-patterns + DoD

### Acceptance criteria

1. Bütçe satırı tanımlanır; gerçekleşme iki kaynaktan otomatik akar; sapma yüzdesi ve forecast panelde görünür.
2. Purchase kaydı girilir → kategori+dönemle satıra eşlenir → finance onayıyla fişe dönüşür → çifte sayım oluşmaz.
3. Capex eşik-üstü satır CEO step-up'sız aktifleşemez.
4. Geçmiş dönem planı hiçbir yolla değişmez; revizyon sürüm açar.
5. E2/E3 uyarıları eşiklerde üretilir ve doğru muhataba (owner + finance + CPO) düşer.
6. HeadcountPlan değişince personel satırları `source=headcount_plan` ile yeniden üretilir; manuel satırlar ezilmez.

### Anti-patterns (yasak desenler)

- `actual_amount`'ı elle girmek/düzeltmek (feed dışı her yazım yasak).
- Bütçeden ledger'a fiş kesmek (yön tersine döner; muhasebe gerçeği plan-katmanına sızar).
- Revizyonu mevcut planın üzerine yazmak (sürüm tarihi kaybolur; kurul raporu güvenilirliği çöker).
- Kur farklı satırları sessizce toplamak.
- Kategori taksonomisini kod içinde enum'a gömmek (tenant-verisi olmalı).
- Soft/hard actual ayrımını UI'da gizlemek (kullanıcı fişlenmemiş harcamayı kesin sanır).

### DoD (Definition of Done)

17 boyut kartı dolu; `ecaRules[]` yapısal (E2/E3/E4-rapor tetiği); standardRefs bağlı (dataApiContractRef, tenancyRef, authzRef, privacyRef, testingStandardRef); §7 testleri kırmızı→yeşil kanıtlı; `capex_threshold`/belge-zorunluluğu/hard-block kararları `VERİ/KARAR BEKLİYOR` kapatılmış; `ready-for-dev-gate` 10/10.

## 9. Not — ledger ve org-employment ile sınır taşları

Üç metamodelin sınırı tek cümleyle: **org-employment maliyeti DOĞURUR (istihdam gerçeği), budget-plan maliyeti PLANLAR ve KIYASLAR (niyet vs gerçek), ledger maliyeti KAYDEDER (mali gerçek).** Karşılık (accrual) fişini org-employment tetikler, ledger taşır, budget-plan yalnız actuals-feed'den okur — bu yön asla ters akmaz (`scale-invariant-directive` bağımlılık-yönü ilkesi).
