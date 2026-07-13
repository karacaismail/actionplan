# ArcheType Venture-Core Yönergesi — Girişim Çekirdek Metamodeli

**Sürüm:** 0.1 · **Tarih:** 2026-07-12 · **Durum:** AI-DRAFT (insan onayı bekler)
**Kapatır:** Revize gap listesi #2 (Venture Core Model) — dış incelemenin "HR/bütçe/kampanya ayrı ayrı sayılmış, hepsini birleştiren girişim modeli yok" tespiti.
**Ürün bağı:** `drafts/adr-product-boundary.md` — EVM (Enterprise Venture Management) satılabilir ürününün omurga metamodeli. Arsam Venture bu metamodelin İLK KAYDIDIR (tenant verisi), şeması değil.

---

## 1. Amaç

HRMS, bütçe, kampanya, takım ve rapor modüllerini yan yana modül yığını olmaktan çıkarıp tek girişim omurgasına bağlamak: **her mali/örgütsel/stratejik kayıt bir venture bağlamında, bir reporting_period içinde, bir scenario/forecast_version altında yaşar ve karar+onay kaydıyla değişir.** Bu omurga olmadan "girişim yönetim sistemi" iddiası, bağımsız modüllerin toplamına düşer.

## 2. Kapsam

`venture` + `legal_entity` + `funding_round` + `capital_allocation` + `initiative` + `strategic_objective` + `business_case` + `assumption` + `scenario` + `forecast_version` + `decision` + `approval` + `reporting_period` + `management_snapshot` varlıkları ve bağ sözleşmeleri.

### Non-goals (kapsam dışı)

- Finansal durum geçişleri (planned→…→cash) — `financial-state-model-contract.md`.
- Veri doğruluk/lineage/mutabakat zinciri — `decision-grade-data-contract.md`.
- Departman/pozisyon/istihdam detayı — `archetype-org-employment` (buradaki `venture`/`legal_entity`/`reporting_period`'a bağlanır).
- Cap table / hisse yönetimi hukuki derinliği (funding_round kaydı tutar; pay defteri v2+).
- OKR koçluğu/metodolojisi (objective kaydı tutar; süreç aracı değildir).

## 3. Tanım (nedir / ne yapar / ne yapmaz)

**Nedir:** Girişimin kendisinin metamodeli — tenant'ın altında birden çok venture, venture'ın altında hukuki yapı, sermaye, strateji, dönem ve karar kayıtları.

**Ne yapar:** Tenant→venture→legal_entity hiyerarşisini kurar (bir tenant birden çok girişim/şirket yönetebilir); yatırımı `funding_round` + `capital_allocation` olarak kaydeder (50M ₺ nereden geldi, hangi stratejik kalemlere tahsis edildi); stratejiyi `strategic_objective` (hedef) → `initiative` (program/girişim) → `business_case` (gerekçe+varsayım) zinciriyle bağlar; her sayısal varsayımı `assumption` kaydına (değer + gerekçe + geçerlilik + sürüm) düşürür; `scenario` (base/optimistic/pessimistic…) ve `forecast_version`'ı birinci-sınıf yapar (plan hücreleri senaryo×sürüm koordinatı taşır — planning-cube P1 sözleşmesinin temeli); yönetsel kararı `decision` (bağlam + seçenekler + gerekçe + karar vereni) ve `approval` (maker-checker: hazırlayan ≠ onaylayan) kayıtlarıyla izlenebilir kılar; `reporting_period`'u (ay/çeyrek + açık/kapalı durumu) tüm mali modüllerin ortak dönem ekseni yapar; kurul/yönetim raporunu `management_snapshot` olarak dondurur (yayınlanmış rakam sonradan değişmez — restatement yeni sürümdür).

**Ne yapmaz:** Mali tutarı kendisi hesaplamaz (financial-state + k-computation); dönem kilidini kendisi uygulamaz (decision-grade-data contract'ın period-lock mekanizmasına ekseni verir); karar VERMEZ (insan verir; sistem kaydeder ve bağlar); Arsam'a özgü hiçbir alan taşımaz.

## 4. Sözleşme şekli (alan | tip | amaç — öz)

### 4.1 Omurga varlıkları

| Varlık | Kritik alanlar (tip) | Amaç |
|---|---|---|
| `venture` | `name` (I18nText), `stage` (EnumType: idea/seed/growth…), `tenant_id` | Girişim kökü; tüm modül kayıtları `venture_ref` taşır |
| `legal_entity` | `name`, `jurisdiction` (EnumType), `entity_kind` (EnumType: AŞ/Ltd/şube), `venture_ref` | Hukuki kişilik; ledger/istihdam/vergi bağlamı bu eksene bağlanır |
| `funding_round` | `round_kind` (EnumType), `amount` (Money), `closed_on` (date), `investor_refs` (PartyRef[]) | Yatırım kaydı (ör. 50M ₺); runway ve capital_allocation kaynağı |
| `capital_allocation` | `round_ref`, `target` (EntityRef → initiative/budget kategorisi), `amount` (Money), `approval_ref` | Sermayenin stratejik tahsisi; bütçe tavanlarının üst kaynağı |
| `strategic_objective` | `title`, `metric_ref` (KPI sözlüğü), `target_value`, `period_ref` | Ölçülebilir hedef; KPI sözlüğüne bağlanır, serbest metin hedef yasak |
| `initiative` | `title`, `objective_refs[]`, `owner_ref` (PartyRef), `status` (EnumType), `business_case_ref` | Program/inisiyatif; bütçe satırı ve takım bağının stratejik üst düğümü |
| `business_case` | `narrative` (I18nText), `assumption_refs[]`, `expected_impact` (metric+değer), `decision_ref` | Gerekçe; varsayımlara ve karara bağlı |
| `assumption` | `statement`, `value`+`unit`, `valid_range` (DateRange), `version`, `source_ref`, `confidence` (EnumType) | Versiyonlu varsayım; forecast'in açıklanabilirlik temeli ("bu tahmin hangi varsayımın hangi sürümüyle?") |
| `scenario` | `name` (EnumType+serbest), `assumption_overrides[]` | Senaryo = varsayım seti farkı; plan/forecast hücrelerinin koordinat ekseni |
| `forecast_version` | `label` (ör. dönem+ardışık no), `created_from` (scenario_ref), `status` (draft/active/superseded) | Tahmin sürümü; geçmiş sürüm değişmez |
| `reporting_period` | `period` (DateRange + EnumType ay/çeyrek), `status` (open/closing/locked), `locked_by/at` | Ortak dönem ekseni; `locked` sonrası mali yazım decision-grade kurallarına tabidir |
| `decision` | `context`, `options_considered`, `chosen`, `rationale`, `decided_by` (PartyRef), `decided_at`, `linked_refs[]` | Yönetsel karar kaydı; "bu bütçe/bölünme/yayın neden yapıldı" sorusunun kalıcı cevabı |
| `approval` | `subject_ref`, `maker_ref`, `checker_ref` (≠maker — DB+PDP değişmezi), `state`, `step_up_used` (bool) | Maker-checker onayı; görev ayrılığı (segregation of duties) kaydı |
| `management_snapshot` | `period_ref`, `scope` (hangi rapor/metrik seti), `payload_hash`, `published_url`, `version` | Dondurulmuş yönetim görünümü; yayın sonrası değişmez, düzeltme yeni sürüm + restatement notu |

### 4.2 Bağ değişmezleri

(1) Her `budget_plan`, `campaign`, `headcount_plan`, `report` kaydı `venture_ref` + `reporting_period_ref` taşır — venture'sız mali kayıt reddedilir. (2) `approval.maker_ref ≠ approval.checker_ref` her onayda zorlanır. (3) `management_snapshot` yayınlandıktan sonra kaynağı değişse bile snapshot payload'ı sabittir (hash doğrulanır). (4) `assumption` güncellemesi yeni sürüm açar; forecast_version hangi assumption sürümlerini kullandığını kaydeder. (5) `reporting_period.locked` iken o döneme mali yazım yalnız decision-grade restatement yoluyla girer.

## 5. WBS / bağımlılık

Seviye: `archetype` (kaya) — EVM app'inin omurga archetype'ı. Bağımlılık: `k-party` (kişi/kurum), `k-policy-pdp` (approval/step-up), `archetype-tree-relation` (venture>entity hiyerarşisi gerekirse), `decision-grade-data-contract` (snapshot/lock semantiği), `financial-state-model-contract` (mali durumların dönem ekseni). Tüketiciler: org-employment, budget-plan, campaign-attribution (P1), reporting, productization (P1 — tenant template bu omurgayı şablonlar).

## 6. Multi-tenant + AI guardrail

Tenant→venture iki-seviye izolasyon: RLS tenant'ta; venture-scope ABAC'la (bir tenant'ın iki venture'ı arasında rol-bazlı görünürlük — danışman yalnız venture-A'yı görür). Funding/allocation verisi ticari sırdır (U3 sınıfı): board_member okur, ekip rolleri göremez.

AI sınırı: AI business_case taslağı, assumption tutarlılık kontrolü ("bu iki varsayım çelişiyor"), senaryo karşılaştırma özeti ve decision kaydı TASLAĞI üretebilir. AI karar VEREMEZ, approval oluşturamaz/geçemez, snapshot yayınlayamaz, period kilidini açamaz/kapatamaz, assumption değerini değiştiremez.

## 7. Test stratejisi (test-önce, negatif dahil)

- Venture'sız/dönemsiz mali kayıt yazımı reddedilir (bağ değişmezi #1).
- maker=checker onay girişimi reddedilir (DB kısıtı + PDP testi).
- Snapshot yayın → kaynak veri değişir → snapshot payload/hash SABİT kalır; yeni sürüm restatement notuyla açılır.
- Assumption güncelle → eski forecast_version'ın assumption bağı değişmez (as-of).
- Locked period'a doğrudan yazım reddedilir; restatement yolu audit iziyle çalışır.
- Venture-scope negatif: venture-B rolü venture-A kaydını göremez (0 satır); komşu tenant 0 satır.
- Journey: round kaydet → allocation tahsis et → objective+initiative kur → assumption'lı business_case yaz → decision+approval → dönem kapat → snapshot yayınla → düzeltme dene (reddedilir) → restatement sürümü.

## 8. Kabul kriterleri + Anti-patterns + DoD

### Acceptance criteria

1. 50M ₺ yatırım funding_round+capital_allocation olarak kaydedilir ve bütçe tavanlarına bağlanır.
2. Her mali kayıt venture+dönem koordinatı taşır; her forecast hangi senaryo ve varsayım sürümleriyle üretildiğini gösterir.
3. Kurul raporu snapshot olarak donar; geçmiş rapor hiçbir veri düzeltmesiyle değişmez.
4. Her onay maker-checker ayrımıyla kayıtlıdır; her stratejik değişikliğin decision kaydı vardır.

### Anti-patterns (yasak desenler)

- Modüllerin venture bağı olmadan "tenant'a düz bağlı" kayıt tutması (çok-venture vaadi ölür).
- Varsayımı forecast formülünün içine gömmek (assumption kaydı yerine sihirli sayı).
- Snapshot'ı canlı sorguya bağlamak ("dondurulmuş" raporun rakamları sonradan oynar — en tehlikeli senaryo).
- Kararı yalnız chat/e-postada bırakmak (decision kaydı yoksa kurumsal hafıza yok).
- Onayı tek kişiye indirmek (maker=checker).

### DoD (Definition of Done)

17 boyut kartı dolu (finans risk sinyaliyle `dataLifecycle`/`security` zorunlu); `ecaRules[]` (dönem kapanış hatırlatması, snapshot yayın zinciri); standardRefs (tenancyRef, authzRef, privacyRef, dataApiContractRef, testingStandardRef); §7 testleri kırmızı→yeşil; `ready-for-dev-gate` 10/10.

## 9. Not — omurga ilkesi

Tek cümle: **modüller veriyi üretir, venture-core bağlamı verir, decision-grade-data doğruluğu garanti eder, financial-state para gerçeğini sınıflar.** Bu dördü ayrı yazılır ama tek üründür; venture-core'suz modül yığını "girişim yönetim sistemi" değildir (dış inceleme tespiti, 2026-07-12).
