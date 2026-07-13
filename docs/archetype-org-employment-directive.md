# ArcheType Org-Employment Yönergesi — Organizasyon, İstihdam ve İşgücü Maliyeti Metamodeli

**Sürüm:** 0.2 · **Tarih:** 2026-07-12 · **Durum:** AI-DRAFT (insan onayı bekler)
**KONUM (v0.2 düzeltmesi):** EVM (enterprise-venture-management) ürününün archetype'ıdır; Arsam yalnız tenant'tır. Üst sözleşmeler: her kayıt venture+legal_entity+reporting_period koordinatı taşır (`archetype-venture-core` — istihdam hukuki kişiliğe bağlanır), as-of kuralı `decision-grade-data-contract §3.2` bitemporal modelinin özel halidir, karşılıklar `financial-state-model-contract`'ın **Accrued** durumuna denk düşer ve dönem kapanış sırasına tabidir.
**Kapatır:** `kapsama-matrisi-arsam-panel-2026-07-12.md` Bölüm 3 P0 satırı (#2 HRMS/bordro-karşılık metamodeli)
**Probe bağı:** `docs/reference/Arsam-Girisim-Yonetim-Gereksinim-Analizi.md` §3.2, §5.1 (#2 HRMS & Workforce Cost), §7.1–7.3 (D4), §8 (total_employer_cost, severance_leave_accrual), §9 (E4/E11)
**Kritik bağ:** `archetype-ledger` payroll'u "bloklanmış bağımlılık" olarak anıyordu; bu yönerge o bloğu açar — karşılıklar ay sonunda ledger'a **tahakkuk (accrual) fişi taslağı** olarak iner (accrual = doğmuş ama henüz ödenmemiş yükümlülüğün dönemine kaydı).

---

## 1. Amaç

"Her ay hangi meslek gruplarından kaç kişi istihdam edilecek, ne maaş verilecek, şirkete maaş-dışı toplam maliyeti ne olacak, kıdem/izin hakları mali tabloda nasıl karşılık bulacak?" sorularını tek metamodelde cevaplamak: departman/pozisyon/istihdam kayıtları + as-of versiyonlu maaş parametreleri + işveren maliyet çarpanları + aylık maliyet türetimi + karşılıkların ledger'a tahakkuk köprüsü + istihdam planının bütçeye beslenmesi.

## 2. Kapsam

`department` (org ağacı) + `position` (meslek grubu) + `employment` (kişi×pozisyon×dönem) + `salary_param` (as-of parametre) + `employer_cost_factor` (çarpanlar) + `headcount_plan` (istihdam planı) + aylık maliyet/karşılık türetim sözleşmesi + accrual fiş köprüsü.

### Non-goals (kapsam dışı)

- Bordro ÖDEMESİ, banka entegrasyonu, resmî SGK bildirgesi (v1 dışı; hesap üretir, ödemez).
- İşe alım süreci (ATS), performans değerlendirme, izin talep/onay iş akışı (yalnız izin *bakiyesi* karşılık hesabı için tutulur).
- Takım/board yönetimi (`archetype-team-topology` P1; takım ≠ departman — takım teslimat birimi, departman maliyet/org birimidir).
- Kişi kimlik yönetimi (kişi `k-party`'de yaşar; burada istihdam İLİŞKİSİ yaşar).

## 3. Tanım (nedir / ne yapar / ne yapmaz)

**Nedir:** İşgücünün org yapısı + istihdam ilişkisi + maliyet parametreleri metamodeli; girişimin en büyük gider kaleminin (personel) tek doğruluk kaynağı.

**Ne yapar:** Org ağacını `archetype-tree-relation` ile tutar; pozisyonu meslek grubu + seviye olarak tanımlar; istihdamı kişi×pozisyon×`DateRange` ilişkisi olarak kaydeder (aynı kişinin ardışık pozisyonları geçmişi bozmaz); maaş parametresini as-of versiyonlu saklar (E11: geçmiş ay, o ayın parametresiyle hesaplanır); aylık toplam işveren maliyetini türetir (brüt + SGK işveren + işsizlik + yan haklar); kıdem (1/12) ve izin karşılıklarını aylık hesaplar ve ay kapanışında (E4) ledger'a fiş TASLAĞI gönderir (finance_lead onaylar); `headcount_plan`'ı budget-plan'a satır kaynağı olarak besler; maaş alanlarını ABAC ile alan-düzeyi maskeler.

**Ne yapmaz:** Ödeme yapmaz; fişi kendisi ONAYLAMAZ (taslak üretir, insan keser); parametre geçmişini ezmez (yeni değer yeni geçerlilik penceresi açar); maaşı takım/board verisiyle yan yana GÖSTERMEZ (yetki kapsamları ayrık); resmî mevzuat oranlarını kod sabiti yapmaz (oranlar `employer_cost_factor` verisidir, `legal_basis` notuyla).

## 4. Sözleşme şekli (alan | tip | amaç)

### 4.1 `department` — org birimi

| Alan | Tip | Amaç |
|---|---|---|
| `id`, `tenant_id` | `uuid` | Kimlik + RLS |
| `name` | `I18nText` | Birim adı |
| `parent_path` | tree-relation (ltree) | Org hiyerarşisi; maliyet roll-up bu yoldan |
| `cost_center_ref` | `EntityRef` → budget kategorisi | Departman→bütçe bağı |
| `lead_ref` | `PartyRef` | Birim sorumlusu |

### 4.2 `position` — meslek grubu / pozisyon

| Alan | Tip | Amaç |
|---|---|---|
| `id`, `tenant_id` | `uuid` | Kimlik |
| `title` | `I18nText` | Pozisyon adı (ör. backend developer, moderatör) |
| `occupation_group` | `EnumType` (taxonomy'ye terfi edebilir) | Meslek grubu — maaş parametresinin anahtarı |
| `department_ref` | `EntityRef` | Bağlı birim |
| `seniority` | `EnumType` (junior/mid/senior/lead) | Parametre kırılımı |

### 4.3 `employment` — istihdam ilişkisi

| Alan | Tip | Amaç |
|---|---|---|
| `id`, `tenant_id` | `uuid` | Kimlik |
| `person_ref` | `PartyRef` → `k-party` | Kişi (PII orada; burada ilişki) |
| `position_ref` | `EntityRef` | Pozisyon |
| `period` | `DateRange` (açık uçlu = aktif) | İstihdam penceresi; kıdem hesabının tabanı |
| `salary_override` | `Money` (nullable, ABAC-korumalı) | Pozisyon parametresinden kişiye-özel sapma; boşsa `salary_param` geçerli |
| `employment_kind` | `EnumType` (full/part/contractor) | Çarpan seti seçimi (contractor'a SGK çarpanı uygulanmaz) |
| `leave_balance_days` | sayısal (karşılık girdisi) | Kullanılmamış izin; izin karşılığının çarpanı |
| `ended_reason` | `EnumType` (nullable) | Çıkış türü; kıdem ödemesi senaryo girdisi |

### 4.4 `salary_param` + `employer_cost_factor` — as-of parametreler

`salary_param`: `position_ref`(+`seniority`) × `gross_salary` (Money) × `currency_policy` (EnumType: TRY / USD-endeksli) × `valid_range` (DateRange) × `revision_note`. `employer_cost_factor`: `factor_kind` (EnumType: sgk_employer / unemployment / severance_accrual / leave_accrual / meal_transport / other) × `rate` (Percentage) VEYA `formula_ref` (`k-computation`) × `valid_range` × `legal_basis`.

**As-of değişmezi (E11):** parametre güncellemesi yeni `valid_range` açar; eski pencere değişmez. "Mart maliyeti" her zaman Mart'ta geçerli parametrelerle yeniden üretilebilir. Çakışan pencere reddedilir (aynı anahtar için tek geçerli değer).

### 4.5 Türetimler — aylık maliyet + karşılıklar (→ ledger)

| Türetim | Formül (yapı) | Çıktı |
|---|---|---|
| `monthly_employer_cost(employment, month)` | brüt (param as-of + override) + Σ uygulanabilir factor | Kişi-ay maliyeti |
| `total_employer_cost(month)` | Σ aktif employment maliyeti; departman roll-up ltree'den | Panel + kurul raporu metriği |
| `severance_accrual(month)` | kıdem tabanı × 1/12 (factor `severance_accrual`) | Aylık kıdem karşılığı |
| `leave_accrual(month)` | `leave_balance_days` × günlük maliyet (factor `leave_accrual`) | İzin karşılığı |
| Ay kapanışı (E4, `k-worker`) | karşılıklar → `journal_entry` **taslağı** (borç: gider, alacak: karşılık hesabı) | finance_lead onaylar → ledger'a iner; onaysız fiş yok |

Tüm türetimler `computation-derivation-contract`'a uyar: kaynak + formül + as-of ile deterministik yeniden üretilebilir; hesap motoru `k-computation`'a devreder (pending önkoşul — matris §3).

### 4.6 `headcount_plan` — istihdam planı (→ budget-plan)

Satır: `month` × `position_ref` × `count` × `planned_gross` (Money). Budget-plan bu satırlardan `source=headcount_plan` bütçe satırları üretir; plan-vs-actual, planlanan adet×maliyet ile gerçekleşen employment maliyetini kıyaslar. Değerler `VERİ BEKLİYOR` (CPO işe alım takvimi).

## 5. WBS / bağımlılık

Seviye: `archetype` (kaya). Bağımlılık: `k-party` (kişi/PII), `archetype-tree-relation` (org ağacı), `archetype-ledger` (fiş hedefi), `archetype-budget-plan` (plan beslemesi — tek yön: buradan oraya), `k-policy-pdp` (ABAC maaş maskeleme), `k-computation` (**pending**), `k-worker` (ay-sonu job, **yönergesi mevcut**). Üst sözleşmeler (dependsOn): `archetype-venture-core` (venture/legal_entity/reporting_period koordinatı), `decision-grade-data-contract` (bitemporal + maker-checker), `financial-state-model-contract` (Accrued durumu + kapanış sırası). Tüketici: EVM HRMS modülü, Reporting (kurul raporu), team-topology (P1; takım maliyeti bu archetype'ın kişi-maliyetinden okur).

## 6. Multi-tenant + AI guardrail

Tenant: `tenant_id` + RLS. **Maaş verisi kişisel veridir (KVKK, U3):** `salary_param.gross_salary`, `employment.salary_override` ve tüm maliyet türetimleri ABAC alan-sınıfı `salary` taşır — yalnız {hr_lead: CRUD, ceo/cpo/finance_lead: R}; diğer her rol için alan maskeli döner (null değil, `masked` işaretli — UI belirsizliğe kapalı). `dataLifecycle` zorunlu dolu: retention, çıkış sonrası saklama süresi ve DSAR yolu tanımlı olmalı (süre `KARAR BEKLİYOR` — hukuk görüşü).

AI sınırı: AI istihdam planı senaryosu ("bu takvimle 6 aylık maliyet projeksiyonu"), maliyet ANOMALİ özeti ve fiş taslağı AÇIKLAMASI önerebilir — hepsi `draft`. AI maaş parametresi GİREMEZ/DEĞİŞTİREMEZ, employment açamaz/kapatamaz, fiş ONAYLAYAMAZ, izin bakiyesi değiştiremez, maskelenmiş alanı hiçbir prompt'a taşıyamaz (PII sızıntı bariyeri — `ai-governance-master`).

## 7. Test stratejisi (test-önce, negatif testler dahil)

- **As-of:** parametre zammı sonrası geçmiş ay maliyeti DEĞİŞMEZ (aynı sorgu aynı sonucu verir — deterministik yeniden üretim testi); çakışan `valid_range` reddedilir.
- **Maliyet hesabı:** bilinen girdilerle kişi-ay maliyeti beklenen toplamı verir; contractor'a SGK çarpanı uygulanmaz; override parametreyi ezer; ay ortası giriş/çıkış gün-orantılı (kural `KARAR BEKLİYOR`: orantı mı tam ay mı).
- **Karşılıklar:** kıdem 1/12 ve izin karşılığı formül testleri; ay kapanışında fiş TASLAĞI üretilir, onaysız ledger'a İNMEZ (negatif test); onay sonrası ledger borç=alacak dengesi.
- **Çifte tahakkuk bariyeri:** aynı ay için ikinci accrual job idempotent (tek taslak).
- **ABAC (negatif, kritik):** team_member/assistant maaş alanını hiçbir uçtan (API, liste, rapor, export) çekemez — maskeli; audit'e erişim denemesi düşer.
- **Tenant (negatif):** komşu tenant org/istihdam verisi 0 satır.
- **Besleme:** headcount_plan değişimi budget satırlarını günceller; manuel bütçe satırı ezilmez.
- **Journey (e2e):** pozisyon tanımla → parametre gir → istihdam aç → aylık maliyet panelde → ay kapat → karşılık fişi finance onayında → onayla → ledger'da → kurul raporunda toplam doğru.

## 8. Kabul kriterleri + Anti-patterns + DoD

### Acceptance criteria

1. İstihdam kaydı girildiğinde aylık toplam işveren maliyeti (maaş + maaş-dışı ayrımıyla) otomatik türetilir.
2. Kıdem/izin karşılıkları her ay tahakkuk taslağına döner; yalnız finance onayıyla ledger'a iner.
3. Parametre değişikliği geçmişi asla değiştirmez; her ay kendi parametresiyle yeniden üretilebilir.
4. Maaş alanları yetkisiz rollere tüm yüzeylerde maskelidir (negatif test kanıtlı).
5. Headcount planı bütçeye otomatik satır üretir; plan-vs-actual çalışır.
6. Departman ağacı maliyet roll-up'ı doğru toplar.

### Anti-patterns (yasak desenler)

- Maaşı `employment` üzerine düz kolon yazıp parametre/as-of disiplinini atlamak.
- SGK/kıdem oranlarını kod sabiti yapmak (mevzuat değişince deploy gerekir; veri olmalı).
- Karşılığı ay kapanışında hesaplamayıp yıl sonunda toplu düzeltmek (aylık mali tablo yanlış kalır).
- Fişi onaysız otomatik kesmek (AI/sistem mali kayıt üretemez; taslak+insan).
- Kişi PII'sini (kimlik no, adres) bu archetype'a kopyalamak (`k-party`'de kalır; `PartyRef`).
- Takım verisiyle maaş verisini aynı yüzeyde birleştirmek (yetki kapsamı erimesi).

### DoD (Definition of Done)

17 boyut kartı dolu (`dataLifecycle` + `security` risk sinyaliyle zorunlu — PII/finans); `ecaRules[]` yapısal (E4 ay-kapanışı, E9 SaaS-besleme, E11 as-of); standardRefs bağlı (tenancyRef, authzRef, privacyRef, dataApiContractRef, testingStandardRef); §7 testleri kırmızı→yeşil kanıtlı; `KARAR BEKLİYOR` kalemleri (retention süresi, gün-orantı kuralı, hr'nin bütçe görünürlüğü) kapatılmış; `ready-for-dev-gate` 10/10.

## 9. Not — üç metamodelin sınırı

`org-employment` maliyeti DOĞURUR (istihdam gerçeği + parametre), `budget-plan` KIYASLAR (plan-vs-actual), `ledger` KAYDEDER (mali gerçek). Karşılık fişinin yönü: org-employment hesaplar → insan onaylar → ledger taşır → budget-plan actuals-feed'den okur. Bu zincirin herhangi bir halkasını atlamak (ör. bütçenin maaş hesaplaması, ledger'ın parametre tutması) sınır ihlalidir (`app-distribution-contract` + `scale-invariant-directive`).
