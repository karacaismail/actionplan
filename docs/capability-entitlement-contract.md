# Capability / Entitlement Sözleşmesi — Yetenek Kapısı ve Hak Yönetimi

**Tarih:** 2026-07-01
**Durum:** Taslak sözleşme (kilitlenmeyi bekliyor — bkz. §6 ADR-A2)
**Kaynak/bağlam:** `plan-03-yeni-yonergeler-2026-07-01.md §3.2` (Capability/Entitlement yönergesi), `core-contract-pack.md §3.2` (platform_capability primitifi), `wbs-field-semantics.md` (dependsOn anlamı), `plan-01-vibecoding-eylem-faz-faz-2026-07-01.md` Dalga 1.
**İlişki:** Bu doküman `actor-party-contract.md`'nin kardeşidir: Actor "kim ve hangi rolde?" sorusunu, Capability "hangi yeteneğe hakkı var?" sorusunu yanıtlar. Capability seti Mode-Profile'a (`k-mode`) *girdi*dir ve PDP'ye (`k-policy-pdp`) yetenek-kapısı bilgisi verir. Bu doküman **kod yazmaz**; `k-capability` kernel primitifinin davranış sözleşmesini normatif tanımlar. Makine-okunur karşılığı (SQLAlchemy modeli, Alembic migration, Strawberry tipi) ADR-A2 kilitlendiğinde ajan-draft + insan-onay ile `platform` reposunda üretilir.

---

## 1. Amaç

Bu sözleşme, bir yeteneğin (rfq, escrow, e_invoice, volume_pricing) bir aktör/tenant veya plan için açık/kapalı olmasının modelini sabitler. Hedef: "bu tenant bu özelliği görebilir/kullanabilir mi?" sorusunun 50 uygulama boyunca tek, denetlenebilir bir cevabı olması; her app'in kendi feature-flag'ini icat etmemesi. Yetenek hakkı feature-gate (özellik kapısı) ve lisans/entitlement'ı tek yerde birleştirir. Aktör-açık ifade: *ajan* yeni capability önerir (draft) veya upsell sinyali üretir; *insan* plan/lisans değişimini onaylar; *motor* entitlement'ı çözer ve yeteneği açar/kapatır.

## 2. Kapsam

Bu sözleşme şunları kapsar: (1) `capability` adlandırılmış yetenek tanımı ve neyi açtığı, (2) `plan` ticari paket ve `plan_capability` ile plan↔yetenek eşlemesi, (3) `entitlement` ile bir subject'in (tenant/actor) bir yeteneğe sahip olma hakkı ve kaynağı (plan/grant/trial), (4) çözüm kuralı (`is_enabled` = plan × capability × imza doğrulaması, fail-closed), (5) capability-gate'in UI ve API'de birlikte uygulanması, (6) Mode-Profile'a capability seti girdisi, (7) `k-capability` düğümünün WBS yerleşimi. Backend, frontend, test ve AI-guardrail gereksinimleri ilgili bölümlerde tarif edilir.

## 3. Non-goals

Bu sözleşme şunları **kapsamaz**: (1) RBAC — capability ≠ rol→izin. RBAC "bu kullanıcı silebilir mi?" sorusudur (rol→izin ekseni); capability "bu tenant RFQ *kullanabilir mi*?" sorusudur (plan→yetenek ekseni). İkisi ayrı eksen; karıştırılmaz. (2) Yetki kararı — allow/deny PDP'nindir; capability yalnız PDP'ye kapı bilgisi verir. (3) Rol/aktör tanımı — `actor-party-contract.md`'dedir. (4) Faturalama/ödeme akışı — capability entitlement'ı okur, para tahsil etmez. (5) Lisans-anahtarı üretimi/imzalama — bu işletmeci/faturalama işidir; capability yalnız imzayı *doğrular*.

## 4. Tanım (nedir / ne yapar / ne yapmaz)

**Nedir:** `k-capability`, hangi yeteneğin hangi plan/lisans altında açık olduğunu ve o yeteneğin hangi ArcheType/Surface/Workflow/ECA'yı etkinleştirdiğini tanımlayan kernel hak-yönetim (entitlement) katmanıdır.

**Ne yapar:** Ticari paketi (plan) teknik yeteneğe (capability) bağlar; bir subject'in (tenant/actor) efektif yetenek setini çözer; lisans-anahtarı imzasını doğrular (fail-closed: imza geçersizse yetenek KAPALI); capability'yi somut çekirdek nesnelere (hangi surface render edilir, hangi archetype açılır) map'ler; capability setini Mode-Profile'a girdi olarak verir; entitlement değişimlerini audit'ler.

**Ne yapmaz:** RBAC yapmaz (rol→izin ayrı eksen). Yetki kararı vermez (PDP'nin işi). Para tahsil etmez. Lisans-anahtarı üretmez/imzalamaz — yalnız doğrular. Kapalı bir capability için varlığı sızdırmaz (endpoint 404 = varlık gizli, 403 = yetki yok ayrımı). Bir yeteneği koda hardcoded gömmez; yetenek veridir.

## 5. Sözleşme şekli (alan yapısı)

Aşağıdaki dört tablo, `k-capability` primitifinin veri şeklini yalnızca *alan adı + tip + amaç* olarak tarif eder; dolu örnek/mock değer verilmez. Tipler PostgreSQL/SQLAlchemy 2.0 karşılıklarıdır.

Bu tablo `capability` adlandırılmış yetenek tanımının alanlarını tanımlar.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Capability'nin benzersiz kimliği |
| `key` | Text (unique) | Yetenek anahtarı (escrow, rfq, net_terms, volume_pricing, e_invoice, …) |
| `description` | Text | İnsan-okur açıklama (yeteneğin ne sağladığı) |
| `category` | Text | Gruplama (commerce, finance, mrp, …) |
| `layer` | Enum(system, platform, tenant) | Katman; alt katman üstü daraltır, genişletemez |
| `unlocks_archetypes` | JSONB (list) | Bu yeteneğin açtığı ArcheType anahtarları |
| `unlocks_surfaces` | JSONB (list) | Bu yeteneğin render ettiği Surface anahtarları |
| `unlocks_workflows` | JSONB (list) | Bu yeteneğin etkinleştirdiği Workflow anahtarları |

Bu tablo `plan` ticari paketin alanlarını tanımlar.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Planın benzersiz kimliği |
| `name` | Text | Plan adı (insan-okur) |
| `tier` | Text | Paket seviyesi (free, pro, enterprise, …) |
| `status` | Enum(active, deprecated) | Plan yaşam döngüsü |

Bu tablo `plan_capability` ile plan↔yetenek eşlemesini tanımlar (birleşik anahtar).

| Alan | Tip | Amaç |
|---|---|---|
| `plan_id` | UUID (FK → plan.id, PK) | Eşlemenin plan tarafı |
| `capability_id` | UUID (FK → capability.id, PK) | Eşlemenin yetenek tarafı |

Bu tablo `entitlement` ile bir subject'in yetenek hakkını ve kaynağını tanımlar; temporal alanlar hakkın süresi için.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Entitlement kaydının kimliği |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu |
| `subject_type` | Enum(tenant, actor) | Hakkın kime ait olduğu (tenant geneli veya belirli party) |
| `subject_id` | UUID | Subject'in kimliği (tenant_id veya party_id) |
| `capability_id` | UUID (FK → capability.id) | Hakkı verilen yetenek |
| `source` | Enum(plan, grant, trial) | Hakkın kaynağı (plandan mı, elle grant mı, deneme mi) |
| `valid_from` | TIMESTAMPTZ (NOT NULL) | Hakkın başladığı an |
| `valid_to` | TIMESTAMPTZ (nullable) | Hakkın bittiği an; NULL = süresiz. Süre dolunca yetenek kapanır |
| `approval_ref` | UUID (nullable) | Onaylayan insan referansı (grant/plan değişimi için zorunlu) |

## 6. WBS yerleşimi

`k-capability`, kernel kümesine (`k-*`) `module`-seviyesi bir düğüm olarak eklenir; altında asıl kod-teslimatı olan en az bir `archetype` düğümü durur. Bağımlılıklar `wbs-field-semantics`'e uyar: `dependsOn` = teknik/yürütme sırası (kritik yol); `related` = yalnız gezinme.

Bu tablo `k-capability` düğümünün WBS yerleşimini ve bağımlılıklarını tanımlar.

| Düğüm | Seviye | dependsOn | Küme |
|---|---|---|---|
| `k-capability` | module | `k-party`, `k-tenancy` | kernel |

`dependsOn` gerekçesi: entitlement bir subject'e (tenant/actor) bağlandığından `k-party` önce gelmeli; kiracı kapsamı için `k-tenancy` gerekli. `k-mode`, kendi `dependsOn`'unda `k-capability`'yi listeler — capability seti Mode-Profile'ın girdisi olduğundan capability mode'dan önce gelir. `related` ile (karar üretmeden) ArcheType/Surface düğümlerine bağlanır.

## 7. Backend gereksinimleri

Aşağıdaki gereksinimler `plan-01` Dalga 1'in capability modülü promptunu bağlar; her biri test-önce (kırmızı→yeşil) yaşam döngüsüne tabidir.

- **SQLAlchemy model:** `capability`, `plan`, `plan_capability`, `entitlement` SQLAlchemy 2.0 (`Mapped[...]`) modelleri; `entitlement` `tenant_id` kolonu ve `(tenant_id, created_at DESC)` bileşik indeksi taşır; `(subject_type, subject_id, capability_id, valid_from)` çözüm indeksi.
- **Alembic migration:** expand-contract; `downgrade()` dolu ve CI'da test edilir (boş downgrade yasak).
- **Strawberry GraphQL:** `CapabilityType`, `PlanType`, `EntitlementType`; resolver'lar `Depends(require_tenant)` + `RequirePermission(...)` ile korunur; her resolver en az bir `permission_classes` içerir.
- **Servis arayüzü:** `is_enabled(tenant_id, capability)` planı × capability matrisinden çözer, lisans-anahtarı imzasını doğrular (fail-closed); `enabled_surfaces(tenant_id)` UI shell'in render edebileceği surface setini döndürür; `effective_capabilities(subject)` Mode-Profile için efektif seti verir.
- **Capability-gate ara katman:** Kapalı capability için endpoint 404 (varlık gizli), yetkisiz kullanıcı için 403 döner; capability kapısı v1 §2.2 izin kontrolünden *önce* gelir.
- **Audit:** Entitlement değişimi (plan yükseltme/düşürme, grant, trial açma/kapama) `AuditLogger.log()` ile yazılır (v1 §2.5). `get_logger()` kullanılır, `print()` yasak.

## 8. Frontend gereksinimleri

Aşağıdaki gereksinimler Vite + React + TanStack yığınına ve config-driven surface ilkesine uyar.

- **Capability-gate UI:** Surface ve ArcheType, alan/aksiyonu capability-gate ile gösterir/gizler; ön yüzde yeteneğin varlığı `enabled_surfaces` / runtime endpoint'inden okunur, hardcoded flag yazılmaz.
- **Kapalı yetenek davranışı:** Yeteneği olmayan tenant'ta ilgili menü/aksiyon UI'da *yok* (yalnız gizli değil, render edilmez); "yükselt" (upsell) yolu ayrı ve açık.
- **Kaynak ayrımı:** Trial ile açılmış yetenekler UI'da kalan süreyi gösterebilir; grant/plan kaynağı ayrışır.
- **Erişilebilirlik:** WCAG 2.2 AA taban; dokunmatik hedef ≥ 44x44px; kontrast ≥ 4.5:1.
- **i18n:** Capability açıklamaları ve upsell metinleri `I18nText` üzerinden çok-dilli.

## 9. Multi-tenant / RLS

Her `entitlement` satırı `tenant_id` taşır ve fail-closed çalışır (v1 §2.1); `is_enabled` her zaman `tenant_id` ile çağrılır. Cross-tenant entitlement sızıntısı `TenantViolationError` fırlatır ve audit'lenir; RLS ikinci bariyer: `USING (tenant_id = current_setting('app.current_tenant')::uuid)`. `capability` üç katmanlıdır: `system` (platform çapında, işletmeci kontrolünde) → `platform` (paket seviyesi) → `tenant` (tenant'a atanmış efektif set); alt katman üst katmanı yalnızca **daraltır**, genişletemez. Lisans-anahtarı imzası geçersizse yetenek KAPALI sayılır (fail-closed) — imza doğrulaması tenant izolasyonunun üstünde ek bir güvenlik katmanıdır.

## 10. AI guardrail (autonomy seviyesi)

Aşağıdaki iş bölümü değiştirilemezdir: **AI önerir → insan onaylar → motor uygular.**

Bu tablo `k-capability` üzerindeki AI autonomy sınırlarını tanımlar.

| İşlem | Autonomy | Kural |
|---|---|---|
| Lisans/entitlement değişimi | `none` | AI entitlement'ı açamaz/kapatamaz; plan değişimi insan + faturalama akışı |
| Yeni capability *önerisi* | `draft` | AI yeni yetenek tanımı önerebilir; doğrudan ekleyemez |
| Upsell sinyali | `draft` | AI "bu tenant şu yetenekten faydalanır" önerir; hakkı açamaz |
| Lisans-anahtarı üretme/imzalama | `none` | AI anahtar üretemez/imzalayamaz |

Mutlak sınırlar: AI main branch'e push edemez; app/module düğümü üretemez/silemez; ruleset override edemez; kanıtsız "bitti" diyemez. PDP capability'ye bakar (yetenek yoksa deny); AI PDP kararını override edemez.

## 11. ArcheType / Surface / PDP bağlama

**ArcheType bağlama:** ArcheType, alan ve aksiyonlarını `capability.unlocks_archetypes` üzerinden capability-gate'e bağlar; capability yoksa ArcheType (veya ilgili aksiyon) etkin değildir. ArcheType kendi feature-flag'ini icat etmez.

**Surface bağlama:** Surface, `enabled_surfaces(tenant_id)` sonucundan render edilir; capability olmadan surface render edilmez (§8). Consumer-Surface storefront'ta RFQ butonu ancak `rfq` capability açıksa görünür.

**PDP bağlama:** Capability PDP'nin (`k-policy-pdp`) girdisidir: PDP kararında "yetenek yoksa deny" kuralı işler — Party (rol) + Capability (yetenek) birlikte `subject`/`resource` bağlamını oluşturur. Capability-gate (404/403) PDP kararının *önünde* varlık gizleme katmanıdır; PDP daha ince yetki kararını verir.

**Mode-Profile bağlama:** Aktif capability seti Mode-Profile'ın (`k-mode`) `active_capabilities[]` girdisidir; mode geçişi capability bayraklarını değiştirir, veriyi yıkmaz. Mode-Profile capability setini `effective_capabilities` üzerinden okur.

## 12. Test stratejisi

Aşağıdaki testler `plan-03 §3.2` DoD'unu ve `plan-01` Dalga 1 kabul kriterlerini karşılar; hepsi test-önce (önce kırmızı) yazılır.

Bu tablo `k-capability` için zorunlu test senaryolarını ve türlerini tanımlar.

| # | Senaryo | Test türü |
|---|---|---|
| 1 | Plan→capability çözümü: planın kapsadığı yetenekler doğru | Entegrasyon |
| 2 | Entitlement süresi bitince yetenek kapanıyor (valid_to geçince) | Birim |
| 3 | Capability olmadan aksiyon UI'da yok VE API'da reddediliyor (404/403) | E2E + entegrasyon |
| 4 | Kaynak ayrımı: plan/grant/trial kaynağı doğru çözülüyor | Birim |
| 5 | Fail-closed: lisans imzası geçersizse yetenek kapalı | Entegrasyon (negatif) |
| 6 | Tenant izolasyonu: A tenant B'nin entitlement'ını göremiyor (≥10 negatif) | Entegrasyon (negatif) |
| 7 | Mode-Profile capability setini `effective_capabilities`'ten okuyabiliyor | Entegrasyon |

## 13. Acceptance criteria

- Bir plana bağlı tenant, planın kapsadığı capability'lere sahip; kapsamayanlara sahip değil.
- Entitlement `valid_to` geçtiğinde yetenek otomatik kapanıyor (yeniden çözümde deny).
- Capability olmayan bir aksiyon hem UI'da render edilmiyor hem API'da 404/403 dönüyor (çift kapı).
- Lisans-anahtarı imzası geçersiz olduğunda yetenek fail-closed kapalı.
- AI entitlement'ı açamıyor (`none`); yeni capability yalnız `draft` öneriyor.
- Mode-Profile aktif capability setini buradan okuyabiliyor.
- `check-core-contract` (tenant guard, resolver koruması, audit, indeks) yeşil; migration downgrade CI'da geçiyor.

## 14. Anti-patterns

- **Capability'yi RBAC ile karıştırma:** capability'yi role, rolü capability'ye eşitlemek — YASAK; ayrı eksenler.
- **App-özel feature-flag:** Bir ArcheType'ın kendi `if feature_x_enabled` bayrağını icat etmesi — YASAK; `is_enabled` zorunlu.
- **Kapalı yeteneği 403 ile sızdırma:** Var olmayan yeteneği 403 ile ele vermek — YASAK; varlık gizleme 404 olmalı.
- **Fail-open:** İmza doğrulanamazken yeteneği açık saymak — YASAK; fail-closed zorunlu.
- **Alt katmanın üstü genişletmesi:** tenant-katman capability'nin platform/system sınırını aşması — YASAK; alt katman yalnız daraltır.
- **AI'ın entitlement açması:** AI'ın plan/lisans değiştirmesi — YASAK (`autonomy: none`).
- **UI-only gate:** Yeteneği yalnız UI'da gizleyip API'yi açık bırakmak — YASAK; çift kapı (UI + API) zorunlu.

## 15. Definition of Done

- §12'deki 7 test senaryosu yeşil (test-önce kanıtı: kırmızı→yeşil geçişi belgeli).
- `core-contract-pack` tenant + audit + indeks + capability-gate uyumu sağlandı; `check-core-contract.mjs` yeşil.
- Alembic migration downgrade CI'da çalışıyor.
- Mode-Profile (`k-mode`) capability setini `effective_capabilities` üzerinden okuyabiliyor (entegrasyon kanıtı).
- ADR-A2 "Kilitli" statüsünde (insan onayı); `k-capability` düğümü ve altındaki `archetype` düğümü WBS'te doğru `dependsOn` ile mevcut.
- AI-guardrail testi: AI entitlement açamıyor; yeni capability yalnız `draft`.
- Doküman `icerik-kalite-sozlesmesi` biçim kurallarına uyar (aktör-açık, emoji yok, her başlıkta nedir/yapar/yapmaz, her tablodan önce açıklama).

## 16. Requirement-ID tablosu

Aşağıdaki tablo, bu sözleşmenin izlenebilir gereksinimlerini kimlik + katman + öncelik (P0–P3) + test türü + kabul + sahip ile listeler. Öncelik: P0 = bloklayıcı invariant, P1 = çekirdek, P2 = önemli, P3 = iyileştirme.

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| CE-01 | `capability` tanımı + unlocks_* eşlemesi | Backend/Data | P0 | Integration | Yetenek surface/archetype açar | kernel-team |
| CE-02 | `plan` + `plan_capability` eşlemesi | Backend/Data | P0 | Integration | Plan→capability çözülür | kernel-team |
| CE-03 | `entitlement` subject + source + temporal | Backend/Data | P0 | Unit+Integration | Hak kaynağıyla ve süresiyle çözülür | kernel-team |
| CE-04 | `is_enabled` fail-closed imza doğrulaması | Security | P0 | Integration(neg) | Geçersiz imza = kapalı | security-team |
| CE-05 | Capability-gate çift kapı (UI yok + API 404/403) | Backend/Frontend | P0 | E2E+Integration | Yeteneksiz aksiyon her iki katmanda kapalı | kernel-team |
| CE-06 | Entitlement süresi bitince kapanma | Backend | P0 | Unit | valid_to sonrası deny | kernel-team |
| CE-07 | Kaynak ayrımı (plan/grant/trial) | Backend | P1 | Unit | Kaynak doğru çözülür | kernel-team |
| CE-08 | Üç-katman daralma (system→platform→tenant) | Backend/Data | P1 | Unit | Alt katman üstü genişletemez | kernel-team |
| CE-09 | Tenant izolasyonu + RLS ikinci bariyer | Security | P0 | Integration(neg) | ≥10 cross-tenant negatif reddedilir | security-team |
| CE-10 | Entitlement değişimi audit (append-only) | Security | P0 | Integration | plan/grant/trial değişimi audit'e düşer | security-team |
| CE-11 | Mode-Profile'a `effective_capabilities` girdisi | Backend/Integration | P0 | Integration | Mode capability setini okur | kernel-team |
| CE-12 | PDP capability girdisi (yetenek yoksa deny) | Backend/Integration | P0 | Integration | PDP capability'ye bakar | kernel-team |
| CE-13 | Alembic expand-contract + dolu downgrade | Backend/DevOps | P1 | CI | `alembic downgrade -1` veri kaybetmez | kernel-team |
| CE-14 | Strawberry resolver `permission_classes` zorunlu | Backend/API | P1 | Contract | Korumasız resolver yok | kernel-team |
| CE-15 | AI entitlement açamaz (none); capability draft | AI-Governance | P0 | Integration | AI lisans değiştiremez | governance |
| CE-16 | Config-driven capability-gate UI (hardcoded flag yok) | Frontend | P1 | E2E | UI enabled_surfaces'ten türetilir | ui-team |
| CE-17 | WCAG 2.2 AA + i18n capability metinleri | Frontend/A11y | P2 | A11y(axe) | axe critical=0; açıklamalar çok-dilli | ui-team |
| CE-18 | `k-capability` WBS düğümü doğru dependsOn (k-party, k-tenancy) | Governance/WBS | P1 | CI(data-quality) | DAG geçerli, dangling yok | pmo |
