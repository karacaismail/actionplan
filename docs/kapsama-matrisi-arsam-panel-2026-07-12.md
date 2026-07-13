# Kapsama Matrisi — EVM (Enterprise Venture Management) + Arsam Marketplace × Kernel / ArcheType / Surface Yönergeleri

Sürüm: 0.3 — 2026-07-12 (v0.2, dış inceleme sonrası revize edildi)
Durum: AI-DRAFT (insan onayı bekler). Kapsam/gap analizi; kod yazmaz, yalnız matris + boşluk teşhisi.
Amaç: Tek soruyu cevaplamak — "Metaframer ile, farklı girişimlerin finansal ve operasyonel kararlarını **güvenilir biçimde** yönetecek satılabilir bir ürün (EVM) + arsam-marketplace geliştirilebilir mi; her yetenek hangi katmanda tanımlı, ne eksik?" (Önceki sürümlerin cevapladığı "repoda benzer yönerge var mı?" sorusu bu sorunun yalnız alt kümesidir — dış inceleme tespiti.)
Kaynaklar: `docs/reference/Arsam-Girisim-Yonetim-Gereksinim-Analizi.md` (probe v1.1), `drafts/adr-product-boundary.md`, bu iki turda yazılan sözleşmeler (`archetype-venture-core-directive`, `decision-grade-data-contract`, `financial-state-model-contract`, `archetype-budget-plan-directive`, `archetype-org-employment-directive`, `archetype-listing-directive`) + mevcut yönergeler (v0.2 listesiyle aynı) + dış inceleme raporu (2026-07-12).

**v0.2→v0.3 farkı (dış inceleme düzeltmeleri):**
1. **Ürün sınırı düzeltildi:** `arsam-company-os` → **EVM** (bağımsız, satılabilir Ada #1); Arsam = tenant/workspace/örnek konfigürasyon; `arsam-consumer` → **arsam-marketplace** (Ada #2, ayrı backlog, EVM'e managed-system verisi sağlar). ADR taslağı: `drafts/adr-product-boundary.md` (insan onayı bekler).
2. **Okuma kuralı sertleşti:** v0.2'de VAR ≈ "ilgili yönerge mevcut" idi; bu, semantik yeterliliği kanıtlamaz. v0.3'te **VAR** = yönerge mevcut VE yeteneğin karar-kritik semantiği (alan sözleşmesi, değişmezler, negatif testler) yazılı. Yalnız kavramı anan/ima eden yönerge **KISMİ**dir. Bu kuralla v0.2'nin 5 iyimser VAR'ı (kanban/view-types, ReBAC-UI, ledger, multi-tenancy, EAV) KISMİ'ye çekildi.
3. **Çekirdek eklendi:** girişim omurgası (venture-core), karar-verisi doğruluk zinciri (decision-grade) ve altı finansal gerçek (financial-state) yeteneği matrise girdi — v0.2 bunları hiç ölçmüyordu; dış incelemenin "en ölümcül sistem açığı" tespiti buydu.

Okuma kuralı: **VAR** = zemin + semantik derinlik birinci-sınıf yazılı (AI-DRAFT olsa bile). **KISMİ** = zemin var, karar-kritik derinlik veya bir katman/önkoşul açık. **EKSİK** = birinci-sınıf tanım yok. Katmanlar: KERNEL / ARCHETYPE-CONTRACT / SURFACE (+ ATOM önkoşulu §2).

---

## Bölüm 0 — Ürün Modeli (ADR taslağına bağlı)

| Katman | Rol |
|---|---|
| Metaframer | Ürün üretme meta-framework'ü |
| **EVM** (`enterprise-venture-management`) | Satılabilir generic girişim yönetim SaaS'ı — Ada #1, asıl ürün |
| Arsam Venture | EVM tenant'ı: workspace + venture kaydı + örnek konfigürasyon (app değil) |
| **arsam-marketplace** | Ayrı ürün, Ada #2; EVM'e event/connector/API ile operasyon verisi sağlayan managed system |

---

## Bölüm 1 — Yetenek × Katman Matrisi

### 1.0 Çekirdek sözleşmeler (ürünü ürün yapan katman — v0.3'te yeni)

| Yetenek | Taşıyıcı doküman | Durum |
|---|---|---|
| Ürün sınırı (generic EVM; Arsam=tenant; marketplace ilişkisi) | `drafts/adr-product-boundary.md` | KISMİ (taslak yazıldı; **insan onayı bekliyor** — onaysız kilitlenemez) |
| Girişim omurgası (venture/legal_entity/funding_round/capital_allocation/initiative/objective/assumption/scenario/forecast_version/decision/approval/reporting_period/management_snapshot) | `archetype-venture-core-directive.md` (bu tur) | VAR |
| Karar-verisi doğruluk zinciri (kaynak→doğrulama→onay→mutabakat→dönem kilidi→formül-sürümlü hesap→KPI→rapor→snapshot; bitemporal; lineage) | `decision-grade-data-contract.md` (bu tur) | VAR |
| Altı finansal gerçek (Planned≠Forecast≠Committed≠Accrued≠Actual≠Cash; runway=cash; available=plan−commit−accrue−actual) | `financial-state-model-contract.md` (bu tur) | VAR |
| Planning cube (venture×entity×departman×takım×initiative×hesap×kanal×dönem×senaryo×sürüm tam sorgu/pivot sözleşmesi) | **yok** — `planning-cube-contract` (P1); koordinat zorunluluğu financial-state §4'te | EKSİK |

### 1.1 EVM domain grafiği

| Yetenek | KERNEL | ARCHETYPE/CONTRACT | SURFACE | Durum |
|---|---|---|---|---|
| Venture omurgası + karar/onay kayıtları | `k-party`, `k-policy-pdp` | `archetype-venture-core` (bu tur) | `list/detail/form` | VAR |
| Department/Position/Employment metamodeli | `k-party`, tree-relation | `archetype-org-employment §4` | `list/detail/form` | VAR |
| Maaş parametresi (as-of) + alan maskeleme | `k-policy-pdp` (ABAC) | `archetype-org-employment §4.4` | maskeli `form/detail` | VAR |
| İşveren maliyeti + karşılık→accrual fişi | `k-computation` (**pending**) + `k-worker` | org-employment §4.5 → ledger | `dashboard/report` | KISMİ |
| Budget-line + capex onayı + commitment bağı | `k-policy-pdp` | budget-plan §4 (financial-state hizası: commitment/prepaid genişlemesi işlenmedi) | `table/form/wizard` | KISMİ |
| Plan-vs-actual + forecast | `k-computation` (**pending**) | budget-plan §4.4 + financial-state | `dashboard` | KISMİ |
| Çift taraflı ledger → yönetim muhasebesi bütünü | — | `archetype-ledger` VAR; ama cost/profit-center kırılımı, commitment muhasebesi, consolidation, reconciliation bütünü financial-state/decision-grade'e YENİ bağlandı, ledger yönergesine işlenmedi | `table/detail` | KISMİ (v0.2'de iyimser VAR idi) |
| Ön-muhasebe kayıtları + belge + fiş köprüsü | `k-storage` | budget-plan §4.5; banka/fatura mutabakat motoru → integration-reconciliation (P1) | `form/list` | KISMİ |
| Kampanya/atribüsyon (funnel+identity+window+model+fraud+consent+LTV) | `k-bus` + `k-computation` | **yok** — `archetype-campaign-attribution` (P1); gereksinim kapsamı probe §8.1'de yazıldı | `dashboard/form` | EKSİK |
| SaaS envanteri + kişi-başı maliyet projeksiyonu | `k-computation` | **yok** — `k-metering-cost` (P1) | `table/dashboard` | EKSİK |
| Takım topolojisi + org-tasarım öneri zinciri | ECA runtime + PDP | **yok** — `archetype-team-topology` (P1); karar girdileri probe §12'de düzeltildi (mekanik bölme değil) | `board` | EKSİK |
| KPI sözlüğü (formül sürümü + confidence + durum etiketi) | `k-kpi-registry` (ince) | decision-grade §3.7 kuralı VAR; `metric-attribution-contract` (P1) ayrıntısı yok | `dashboard` | KISMİ |

### 1.2 EVM 14 modülü (probe §5.1)

| # | Modül | Durum | v0.3 gerekçesi |
|---|---|---|---|
| 1 | Executive Cockpit | KISMİ (v0.2: VAR) | `board` surface tipi + ReBAC scope zemini var; board/card/rank/eşzamanlılık/private-scope/saved-view **modeli** hiçbir yönergede yazılı değil |
| 2 | HRMS & Workforce Cost | KISMİ | org-employment VAR; hesap motoru (k-computation) pending |
| 3 | Budget & FP&A | KISMİ | budget-plan VAR; forecast/commitment/planning-cube açık |
| 4 | Marketing Budget & Attribution | EKSİK | P1 (kapsam probe §8.1) |
| 5 | SaaS & Vendor Spend | EKSİK | P1 |
| 6 | Pre-accounting | KISMİ | kayıt+köprü VAR; mutabakat motoru P1 |
| 7 | Team & Agile Mgmt | EKSİK | P1 |
| 8 | Reporting & BI | KISMİ | render VAR; scheduler P2 + snapshot yayını decision-grade'e bağlandı |
| 9 | CMS & Public Publishing | KISMİ | page-builder VAR; publish workflow P2; snapshot semantiği artık decision-grade'de tanımlı |
| 10 | Media & File Manager | VAR | `k-storage-dam` tam |
| 11 | IAM & Policy Admin | KISMİ (v0.2: VAR) | PDP sözleşmesi VAR; policy editörü, izin simülatörü, çakışma analizi ve açıklanabilir-karar UI'ı yazılı değil |
| 12 | Notification Center | KISMİ | worker+port VAR; bildirim sözleşmesi P2 |
| 13 | Venture & Strategy | VAR | `archetype-venture-core` (bu tur) |
| 14 | Scenario & Forecast Planning | KISMİ | assumption/scenario/forecast_version varlıkları VAR; planning-cube + karşılaştırma yüzeyi P1 |

### 1.3 arsam-marketplace 7 modülü (probe §5.2 — ayrı backlog)

| # | Modül | Durum | Not |
|---|---|---|---|
| 1 | Listing Core | VAR | `archetype-listing-directive` (bu paket); marketplace backlog'unda yaşar — EVM P0'ı DEĞİL |
| 2 | Category & Attributes | KISMİ (v0.2: VAR) | EAV/taxonomy/variant-family yönergeleri VAR; ölçek davranışı, search projection, öznitelik migration'ı ve kategori kalite yönetimi kanıtlanmamış |
| 3 | Search & Discovery | KISMİ | k-search + listing §4.5 sözleşmesi VAR; EAV→search projection önkoşulu (#2) açık |
| 4 | Geo Layer | VAR | `adr-geo-visualization` |
| 5 | Messaging | VAR | `archetype-messaging-thread` |
| 6 | Membership & Trust | KISMİ | k-identity/k-party VAR; session-auth (P1) + atribüsyon anahtarı (P1) açık |
| 7 | Moderation & Monetization | KISMİ | workflow VAR; ödeme/PSP + order kaydı ince |

### 1.4 Enine yetenekler

| Yetenek | Durum | v0.3 gerekçesi |
|---|---|---|
| Multi-tenancy (RLS, fail-closed) | KISMİ (v0.2: VAR) | İzolasyon ilkesi VAR; satılabilirlik için gereken tenant onboarding/template/entitlement/portability (`productization-contract` P1) yazılı değil |
| ReBAC/ABAC + PDP | KISMİ (v0.2: VAR) | Karar zemini VAR; yetkinin UI'dan güvenle yönetimi (editör+simülatör+çakışma+açıklama) yazılı değil |
| D3 yetki matrisi → policy seti | VAR | probe §6 politika kaynağı |
| Magic link + 6 ay rotasyonlu oturum (U1 kilitli) | KISMİ | karar probe §11'de; `k-session-auth` (P1) yok |
| Append-only audit + mali değişmezlik | VAR | audit envelope + ledger ters-fiş + decision-grade restatement |
| KVKK / veri hassasiyeti (U3) | VAR | k-legal-hold + dataLifecycle zorunlu + ABAC maskeleme |
| Zamanlanmış rapor üretimi | KISMİ | k-worker VAR; report-scheduler (P2) |
| Public snapshot yayını | KISMİ | snapshot semantiği VAR (venture-core + decision-grade); publish workflow (P2) |
| Kaynak-bağımsız veri alımı + mutabakat (manuel/import/API/event hiyerarşisi, dedup, düzeltme) | KISMİ | ilke decision-grade §3.1/§3.5'te; `integration-reconciliation-contract` (P1) — banka/muhasebe/reklam/bordro/SaaS-fatura/marketplace-analytics bağları |
| Approval & decision governance (maker-checker, görev ayrılığı, period close, kurul dondurma) | KISMİ | temel venture-core+decision-grade'de VAR; bütünleşik governance sözleşmesi (P1) |
| Data-sense capability seti (pivot, drill-down, saved view, lineage-UI, confidence, anomali, bulk edit, export=ekran) | EKSİK | kapsam probe §4.1'de kabul edildi; `data-sense-surface-contract` (P1) yazılmadı — surface tipi ≠ veri ürünü |
| 17 boyut disiplini + CI kapıları | VAR | dimension-contract-17 + ci-conformance-gates |

---

## Bölüm 2 — Atom Önkoşulu (değişmedi)

v0.2 §2 geçerli: kritik atomlar (Money, Percentage, DateRange, Recurrence, PartyRef/EntityRef, GeoPoint, EnumType, I18nText) katalogda tanımlı, **şema terfisi (FieldTypeSchema) pending** (Görev #16; CLM/PIM ile ortak). EVM para-taşıyan üründür; terfi kapanmadan hiçbir mali archetype ready-for-dev sayılmaz.

---

## Bölüm 3 — Boşluk Listesi (dış inceleme revize listesiyle eşlenmiş)

Sıra: karar → sözleşme → yönerge. İlk sütun dış incelemenin 10 maddelik listesindeki numaradır.

| # | Boşluk | Durum / Kapatan doküman | Öncelik |
|---|---|---|---|
| 1 | Product Boundary ADR | Taslak YAZILDI (`drafts/adr-product-boundary.md`) — **CPO onayı bekliyor**; onay U4+U5'i kapatır | KARAR |
| 2 | Venture Core Model | YAZILDI — `archetype-venture-core-directive.md` (AI-DRAFT) | kapandı (bu tur) |
| 3 | Decision-Grade Data Contract | YAZILDI — `decision-grade-data-contract.md` (AI-DRAFT) | kapandı (bu tur) |
| 5 | Financial State Model | YAZILDI — `financial-state-model-contract.md` (AI-DRAFT) | kapandı (bu tur) |
| 4 | Planning Cube | `planning-cube-contract.md` — koordinat zorunluluğu hazır (financial-state §4) | P1 |
| 6 | Metric & Attribution Contract | `metric-attribution-contract.md` — kapsam probe §8.1; `archetype-campaign-attribution` ile birlikte | P1 |
| 7 | Data-Sense Surface Contract | `data-sense-surface-contract.md` — kapsam probe §4.1 | P1 |
| 8 | Approval & Decision Governance | `approval-governance-contract.md` — temel venture-core/decision-grade'de | P1 |
| 9 | Integration & Reconciliation | `integration-reconciliation-contract.md` — temel decision-grade §3.1/§3.5 | P1 |
| 10 | Productization (tenant template/sektör paketi/entitlement/billing/portability) | `productization-contract.md` — kapsam probe §2.2 | P1 |
| — | `archetype-team-topology` (org-tasarım öneri zinciri, probe §12) | P1 | P1 |
| — | `k-metering-cost` (SaaS/kişi-başı maliyet) | P1 | P1 |
| — | `k-session-auth` (U1 uygulaması + waiver) | P1 | P1 |
| — | `k-computation` sözleşmesi (deterministik para/oran hesabı) | CLM/PIM ile ortak önkoşul | P0-ortak |
| — | Atom şema terfisi (Görev #16) | ortak önkoşul | P0-ortak |
| — | cms-publish / notification / report-scheduler | P2 üçlüsü (v0.2'den) | P2 |
| — | Ödeme/PSP + doping order genişlemesi (marketplace) | `archetype-order-line-item` genişlemesi | P2 (marketplace backlog) |
| — | Board/card modeli (cockpit + takım board'ları için) | team-topology içinde veya ayrı `archetype-board-directive` | P1 |
| — | Policy admin UI semantiği (editör/simülatör/çakışma/açıklama) | pdp-policy-contract eki | P1 |
| — | EAV ölçek/projection/migration kanıtı | archetype-eav eki + D9 hacim verisi | P1 (marketplace) |

---

## Bölüm 4 — Özet Sayım

| Matris | VAR | KISMİ | EKSİK | Toplam |
|---|---|---|---|---|
| §1.0 Çekirdek sözleşmeler | 3 | 1 | 1 | 5 |
| §1.1 EVM domain grafiği | 3 | 6 | 3 | 12 |
| §1.2 EVM 14 modülü | 2 | 9 | 3 | 14 |
| §1.3 Marketplace 7 modülü | 3 | 4 | 0 | 7 |
| §1.4 Enine yetenekler | 4 | 7 | 1 | 12 |
| **Toplam** | **15** | **27** | **8** | **50** |

v0.2 (40 yetenek: 20 VAR / 14 KISMİ / 6 EKSİK) → v0.3 (50 yetenek: 15 VAR / 27 KISMİ / 8 EKSİK). VAR oranının %50→%30'a düşmesi gerileme değil, ölçüm düzeltmesidir: (a) okuma kuralı sertleşti (5 iyimser VAR→KISMİ), (b) v0.2'nin hiç ölçmediği çekirdek yetenekler (omurga, doğruluk zinciri, finansal durumlar, data-sense, productization, governance) matrise girdi. Aynı kuralla v0.2 yeniden sayılsaydı VAR oranı ~%25 olurdu; yani bu tur net ilerlemedir (3 çekirdek sözleşme + ADR taslağı EKSİK→VAR/KISMİ).

---

## Bölüm 5 — Teşhis (tek cümle) + Gerçeklik Notu

Metaframer zemini (tenancy, PDP, ledger, EAV, surface kataloğu, worker/storage/search, 17 boyut) + bu iki turda yazılan çekirdek (venture omurgası, karar-verisi doğruluk zinciri, altı finansal gerçek, üç domain archetype'ı) ile **EVM tanımlanabilir bir ürün haline geldi**; ancak ürün kararı için iki kapı insanda (Product Boundary ADR onayı + probe'daki `VERİ/KARAR BEKLİYOR` hücreleri), teknik borç dar-adresli (6 P1 sözleşme + 4 P1 yönerge + 2 ortak önkoşul + 3 P2), ve hiçbir "VAR" çalışan kod anlamına gelmez — foundation zinciri (PR-01→11) hâlâ blocker'dadır, tüm bu katman planlama/sözleşme katmanıdır.

İnsan kararı durumu: U1 verildi (probe §11), U2 kayıtlı, U3 işlendi; **U4/U5 `drafts/adr-product-boundary.md` onayına bağlı (açık)**.
