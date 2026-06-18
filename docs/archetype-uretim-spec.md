# ArcheType Üretim & Düzenleme Spec'i (AI-first, güvenli, admin-yönetilebilir)

Statü: aktif yönerge · Hedef alan: `actionplan/` (planlama). `platform/` implementasyonu bu spec'in
kapsamı dışıdır. Bu doküman, `claude-ai-archetype-eca-directive.md` guardrail'larını genişletir ve
kod karşılığı `src/schemas/archetype.ts` + `src/data/archetypes/*.json` + `tests/archetype.test.ts`'tedir.

## 1. Amaç

AI-first, güvenli, admin panelden yönetilebilir, 2032 hedefli ama bugün gerçekçi bir **ArcheType
üretim/düzenleme planı ve vibecoding yönerge seti** üretmek. Amaç, CI'da kodu otomatik düzeltip
push eden bir ajan (3b) değildir; amaç, ArcheType sözleşmelerinin güvenli üretimi/düzenlenmesidir.

## 2. Terimler (metafor + teknik karşılık aynı cümlede)

- **App = dağ** = bir ürün ailesi (ör. Çekirdek Operasyon); birden çok module barındırır.
- **Module = kaya** = sınırlı bağlam (bounded context); birden çok ArcheType barındırır.
- **ArcheType = büyük taş** = Frappe DocType'a benzeyen ama ondan gelişmiş, bir module'ü oluşturan
  ana bileşen. ArcheType **tek dosya/format değildir**; çok-parçalı bir sözleşme ailesidir.
- **Surface = projeksiyon** = ArcheType'tan AYRI ama ilişkili; UI/API/tablo izdüşümü; AYRI versiyonlanır.
- **Workflow = davranış** = ArcheType'tan AYRI ama ilişkili; durum makinesi/süreç; AYRI versiyonlanır.
- **field = alan** = en küçük veri birimi (alan seviyesi adı budur).

### ArcheType sözleşme ailesinin parçaları (tek JSON varsayma)

identity/meta · fields · fragments · relations · validation rules · semantic rules · permissions ·
ReBAC/ABAC policies · lifecycle · linked surfaces · linked workflows · typed actions · search/index rules ·
audit policy · migration policy · data retention policy · tenant isolation policy · ECA bindings ·
external ruleset bindings · AI policy · test fixtures · conformance tests · versioning/compatibility metadata.

Kod karşılığı: `ArchetypeContractSchema` (Zod), her parça ayrı alt-şema.

## 3. AI yetki sınırı (deny-by-default)

- AI **app üretemez**, **module üretemez**, **app/module güncelleyemez**.
- AI ruleset'i **bypass/disable/override edemez**; **doğrudan production write** yapamaz.
- AI **yeni ArcheType üretebilir** ve **mevcut ArcheType'ı düzenleyebilir**.
- Yeni ArcheType üretiminde AI, temel bileşenleri **admin onayı olmadan draft** olarak uygulayabilir.
- Daha kapsamlı/kritik kümelerde AI, admin'e **çok seçenekli soru (quiz/anket)** sormalı; seçenekler
  yetmezse **textarea yönergesiyle** admin'i süreçte yönlendirmeli.
- Mevcut ArcheType düzenlemede **güvenli migration varsa** kayıtlar yeni versiyona taşınır; **yoksa**
  işlem durur veya **platform owner onayına** düşer.

Kod karşılığı: `evaluateAgentPolicy` (src/engine/eca.ts) + her node'un `agentPolicy`'si + ArcheType
`aiPolicy`'si (`autonomy`, `allowedTargets=["archetype"]`, `forbiddenTargets=["app","module"]`,
`forbiddenActions`, `rulesetBoundary{enforced,canOverride:false}`, `prodDataPolicy`).

## 4. Migration & veri koruma

- Mevcut veriler korunmadan ArcheType update **uygulanamaz**.
- Varsayılan migration policy: **append-only, expand-contract, deprecated/alias/backfill**.
- field **delete/rename/type-change doğrudan yapılmaz**; önce deprecated + alias + backfill.
- Veri kaybı riski olan değişiklik yalnız **platform owner + immutable snapshot + rollback planı +
  açık risk onayı** ile mümkündür.
- Her update için **diff, data impact, dry-run, rollback, audit kaydı** planlanır.

Kod karşılığı: `MigrationPolicySchema` (`forbidDirect:["delete","rename","type-change"]`,
`requireSnapshot/Rollback/CompatibilityCheck/DataImpact/DryRun/Audit`, `dataLossNeedsOwnerApproval`).

## 5. Admin akışı (zorunlu sıra)

`prompt → draft → validation → diff → data-impact → migration-dry-run → preview → approval → apply`

Kod karşılığı: `ADMIN_FLOW` (src/schemas/archetype.ts).

## 6. AI üretim/düzenleme doğrulama döngüsü (CI 3b DEĞİL)

- 1–3. deneme: otomatik düzeltme.
- 3. denemeden sonra: admin'e **net çok-seçenekli sorular**.
- 6. denemede: tekrar soru.
- 9. denemede: **tanı raporu üret ve dur**.
- Bu döngü, kodu CI'da otomatik push eden 3b **değildir**; ArcheType üretim/düzenleme doğrulama
  döngüsüdür. Kod karşılığı: `AI_FIX_LOOP` (`autoFixUntil:3`, `askAdminAt:[3,6]`, `diagnoseAndStopAt:9`,
  `ciAutoPush:false`).

## 7. ECA & ruleset'ler

- ECA kuralları **admin UI'dan yönetilebilir**; ama ECA'nın gerçek otoritesi **backend/ruleset
  engine**'dir. UI yalnız güvenli, şemalı, yetkili yönetim yüzeyidir.
- **Serbest JS/SQL/shell yok.** Yalnız yapısal kural (`event/when[{field,op,value}]/then{type,params}`).
- Gelişmiş hazır **ECA şablonları/ruleset paketleri** olmalı; üst üste çalışan çoklu ve birbirinden
  bağımsız ECA kuralları desteklenir.
- Zorunlu: **chain depth ≤ 6, idempotency, loop breaker, tenant isolation, action allowlist,
  step-up approval**.
- **Ruleset yetki katmanları** (`RulesetLayer`):
  1. **system** — kilitli; yalnız developer/code/PR ile değişir.
  2. **platform** — platform owner yönetir.
  3. **tenant** — tenant admin yalnız **güvenli parametrelerle** yönetir (`tenantEditableParams`).

Kod karşılığı: `EcaRuleSchema` + `evaluateEca` (çalıştırılabilir) + `RulesetLayerSchema` +
`RulesetBindingSchema`.

## 8. ECA dışındaki çelik duvarlar (deny-by-default, hepsi zorunlu)

schema validation · semantic validation · migration safety · ReBAC/ABAC · tenant isolation ·
action allowlist · prompt-injection guard · audit/forensic log · rate/cost/abuse limits ·
conformance tests · rollback/snapshot gates · protected fields/rules/archetypes ·
immutable ruleset boundary.

Kod karşılığı: `STEEL_WALLS` + her ArcheType sözleşmesinde `steelWalls` alanı (conformance test ile zorunlu).

## 9. İlk fixtures (gelişmiş örnek)

- **Product ArcheType** (`src/data/archetypes/product.json`): fields, relations, permissions,
  lifecycle, surfaces, workflows, search, audit, migration, ECA, AI policy.
- **Customer ArcheType** (`src/data/archetypes/customer.json`): aynı parçalar + PII alanları
  (email/phone/taxId) + PII anonimleştirme (retention) + KVKK typed action.

Her ikisi `tests/archetype.test.ts` ile şema + AI-sınır + migration + ruleset-katman + çelik-duvar
açısından doğrulanır (CI bloklayıcı).

## 10. unknown-unknowns (bilinmeyen bilinmeyenler)

**Bilinmeyen bilinmeyenler** = sistemin şu an varlığını fark etmediği risk sınıfı. Bunu bir **risk
keşif checklist'i** olarak ele al: her ArcheType için "hangi tehdit/veri-kaybı/uyum senaryosunu
henüz modellemedik?" sorusu periyodik sorulur; bulunan her yeni risk bir conformance test'e veya
çelik duvara dönüştürülür. Sıfır varsayım: "bunu kimse kötüye kullanmaz" denmez; deny-by-default kalır.

## 11. Non-goals

- `platform/` implementasyonuna başlamak.
- CI'da kodu otomatik düzeltip push eden 3b ajanı.
- Testleri/güvenlik gate'lerini zayıflatmak.
- AI'ya app/module üretim/güncelleme yetkisi vermek.
