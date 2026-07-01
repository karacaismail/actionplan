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

## 12. ArcheType v2 — Yeni Sözleşme Aileleri ve Genişletmeler

Bu bölüm, bölüm 2'deki sözleşme ailesini genişletir. Ana ilke değişmez: **ArcheType tek dosya
değildir**; Surface (projeksiyon) ve Workflow (davranış) gibi kendi versiyonu olan yan-sözleşmeler
vardır. Aşağıdaki aileler bu mantığı sürdürür — her biri ArcheType'a **bağlanır** ama ondan **ayrı
versiyonlanır**. Böylece bir ArcheType değişmeden yanındaki yetki/aktör/hesap sözleşmesi evrilebilir,
tersi de mümkündür.

Neden ayrı ailelere böldük: aynı ArcheType (ör. Product) farklı iş modelinde farklı aktör, farklı
yetki, farklı hesap-hattı ister. Bunları ArcheType'ın gövdesine gömersek her iş-modeli değişikliği
şema migration'ı doğurur (bölüm 4 riski). Ayrı yan-sözleşme olarak versiyonlarsak, ArcheType durur;
sadece bağlanan yan-sözleşme değişir.

**Bu bölüm boyunca korunan AI-güvenlik invariant'ı:** Aşağıdaki hiçbir aile AI'nın yetkisini
genişletmez. AI **yeni ArcheType/alan/yan-sözleşme taslağı ÖNERİR**; **insan (admin/platform owner)
onaylar** (bölüm 3 + bölüm 5 ADMIN_FLOW aynen geçerli). Geçmiş **üretim/maliyet transaction'ı
immutable**'dır; hiçbir aile onu geriye dönük değiştiremez. Effectivity/costing değişimi **yalnız yeni
dönem veya yeni revizyon açar**, eskiyi silmez/yeniden yazmaz. Bu invariant, bu bölümde tanımlanan her
ailenin conformance test'inde zorunlu koşuldur (bölüm 8 çelik duvarları devam eder).

### 12.A. Yeni yan-sözleşme aileleri (ArcheType'tan ayrı versiyonlanan)

Bu aileler Surface/Workflow ile aynı statüdedir: ArcheType'a `linked` referansla bağlanır, kendi
versiyon/uyumluluk metadata'sını taşır, kendi conformance testi vardır.

#### 12.A.1. Actor/Party sözleşmesi

**Bu nedir:** Party = "taraf" = sisteme katılan kişi/kurum. **Aktör/taraf sözleşmesi**, aynı
gerçek-dünya varlığının (bir kişi ya da bir kurum) **bağlama göre farklı rol** oynamasını modelleyen
yan-sözleşmedir. Aynı firma bir işlemde **buyer (alıcı)**, başka işlemde **seller (satıcı)**, aynı kişi
hem **employee (çalışan)** hem müşteri olabilir.

**Ne yapar:**
- Party kimliğini roldan ayırır: kim olduğu (Party) sabit, ne rol oynadığı bağlama bağlı.
- **RoleBinding** tanımlar = `rol + bağlam + zaman-aralığı` üçlüsü. Yani "X firması, Y sözleşmesi
  bağlamında, 2026-01..2026-12 arası, seller rolünde". Bir Party'nin aynı anda birden çok RoleBinding'i
  olur.
- Zaman-aralığı sayesinde geçmiş roller korunur (bölüm 12.C effectivity ile aynı disiplin): bir kişinin
  eski employee dönemi silinmez, kapanır.
- Bir Party'nin sisteme yeterince temel olması durumunda, onu **kernel-primitifine terfi** ettirme
  kararını mümkün kılar: `l1-party` (birinci-seviye Party) artık ArcheType değil, çekirdek ilkel tip
  gibi ele alınır ve tüm module'ler ona güvenle referans verir. Bu terfi kararını **platform owner**
  verir (AI öneremez-uygulayamaz, sadece gerekçe taslağı sunabilir).

**Ne yapmaz:**
- Yetki/izin **vermez**. "Bu rol neyi görebilir/yapabilir" sorusu 12.A.2 (Capability) ve mevcut
  ReBAC/ABAC policy'nin işidir. Party sadece "kim, hangi bağlamda, hangi rolde"yi söyler.
- Kimlik doğrulama (authentication) **yapmaz**; sadece kimliği modeller.
- Rolleri koda gömmez; roller veri olarak tanımlıdır (serbest kod yok, bölüm 7 ilkesi).

**ArcheType'a nasıl bağlanır:** ArcheType `relations`/`linked` parçasında bir alan bir Party rolüne
referans verir (ör. Order.buyer → RoleBinding[role=buyer]). ArcheType, Party sözleşmesinin versiyonunu
`linked` metadata'sında sabitler; Party v2'ye geçince ArcheType uyumluluk kontrolünden geçer.

#### 12.A.2. Capability/Entitlement sözleşmesi

**Bu nedir:** Capability = "yetenek/erişim hakkı", Entitlement = "hak ediş". Bu sözleşme, **hangi
ArcheType / Surface / Workflow / ECA kuralının hangi planda veya hangi katmanda açık** olduğunu
tanımlar. Kısaca: **feature-gate (özellik kapısı) + lisans** katmanı.

**Ne yapar:**
- Bir özelliği plana/lisansa bağlar: "BOM-graph ArcheType yalnız Üretim planında açık", "Costing-policy
  yalnız Enterprise katmanında görünür".
- Feature-gate: bir Surface/Workflow/ECA'nın bir tenant için **açık mı kapalı mı** olduğunu tek yerden
  yönetir.
- Lisans/planla eşler; plan değişince hangi yeteneklerin açıldığı deterministik olur.

**Ne yapmaz:**
- Kişi-bazlı izin **değildir**. "Bu kullanıcı bu kaydı görebilir mi" ReBAC/ABAC'ın işidir; Capability
  "bu tenant/plan bu özelliği kullanabilir mi" sorusuna bakar. İkisi ayrı katman.
- Rol tanımlamaz (o Party'nin işi, 12.A.1).
- İş-modelini değiştirmez (o Mode-Profile'ın işi, 12.A.3); sadece neyin açık olduğunu söyler.

**ArcheType'a nasıl bağlanır:** ArcheType/Surface/Workflow/ECA parçaları bir `capabilityKey` beyan
eder; Capability sözleşmesi bu anahtarı plana/katmana eşler. Runtime'da bir yetenek çağrılmadan önce
Capability kontrol edilir (kapalıysa özellik hiç sunulmaz).

#### 12.A.3. Mode-Profile sözleşmesi

**Bu nedir:** Mode-Profile = "çalışma-modu profili". Bu, **Edition (sürüm) DEĞİLDİR**. Edition =
**statik paketleme** = derleme/dağıtım zamanında hangi modüllerin paketlendiği (ör. "Community
sürümünde şu modüller yok"). Mode-Profile ise **runtime (çalışma zamanı) iş-modeli**dir: aynı kurulum,
canlıyken **B2C ↔ B2B** gibi iş modelleri arasında yeniden düzenlenebilir.

**Ne yapar:**
- Runtime'da iş-modeli seçer: aynı Product ArcheType'ı B2C modunda perakende fiyat/tekil müşteri,
  B2B modunda sözleşmeli fiyat/kurumsal hesap davranışıyla sunar.
- **Recomposition (yeniden bileşim)** yapar: mevcut **ADMIN_FLOW ile (bölüm 5)** hangi
  Surface/Workflow/Capability kümesinin aktif olduğunu **veri yıkmadan** değiştirir. Yani mod değişimi
  bir migration değil, bir bileşim değişimidir; kayıtlar yerinde kalır.

**Ne yapmaz:**
- Statik paketleme yapmaz (o Edition'ın alanı); modül eklemez/çıkarmaz, sadece açık olanları yeniden
  düzenler.
- Şema/veri **migration'ı yapmaz** — mod değişimi asla append-only kuralını (bölüm 4) tetikleyecek bir
  alan silme/yeniden adlandırma içermez. İçermesi gerekiyorsa bu bir mod değil, migration'dır ve o
  yoldan gider.
- İzin/yetenek tanımlamaz; sadece hangi yetenek/yüzey kümesinin o modda aktif olduğunu seçer.

**ArcheType'a nasıl bağlanır:** Mode-Profile, ArcheType'ın kendisine değil, ona bağlı
Surface/Workflow/Capability **bileşimine** referans verir. Mod değişimi ADMIN_FLOW'un
`preview → approval → apply` adımlarından geçer; apply veri taşımaz, bileşim seçimini değiştirir.

#### 12.A.4. Computation/Derivation sözleşmesi

**Bu nedir:** Computation = "hesaplama", Derivation = "türetme". Bu ailenin varlık nedeni net bir
ayrımdır: mevcut **validationRule/semanticRule bir assertion'dır** = bir doğruluk iddiası ("bu alan
boş olamaz", "toplam ≥ 0"); doğrular ama üretmez. Oysa **fiyat / vergi / BOM-patlaması (reçete
açılımı) / bordro** birer **hesap-hattıdır** = girdilerden yeni değer **üretir**. Bu ikisi karıştırılmamalı;
o yüzden hesaplama ayrı bir aile.

**Ne yapar:**
- **Türetilmiş alan** üretir: değeri kullanıcı girmez, girdilerden hesaplanır (ör. satır toplamı,
  vergili tutar).
- Hesabı **saf yapısal ifade grafiği** olarak tanımlar: girdi alanlar → operatör düğümleri → çıktı;
  yani deklaratif bir hesap ağı (serbest kod değil, bölüm 7'deki "serbest JS/SQL/shell yok" ilkesinin
  hesaplama karşılığı).
- **Tetik (trigger)** tanımlar: hangi alan değişince hesabın yeniden koşacağı deklaratif olarak yazılır.

**Ne yapmaz:**
- Assertion değildir; doğrulama yapmaz (o validation/semantic rule'un işi). Doğrular vs. üretir ayrımı
  bu ailenin tüm gerekçesidir.
- **Serbest kod DEĞİLDİR:** rastgele fonksiyon/script çalıştırmaz; yalnız izinli operatörlerden kurulu
  saf ifade grafiği. Böylece deterministik, denetlenebilir ve idempotent kalır.
- Geçmişi yeniden yazmaz: bir formül değişse bile **geçmiş hesaplanmış transaction immutable** kalır
  (invariant, giriş). Yeni formül yalnız yeni kayıtlara veya yeni revizyona/döneme uygulanır.

**ArcheType'a nasıl bağlanır:** ArcheType `fields` içinde bir alanı `derived` işaretler ve onu bir
Computation sözleşmesine bağlar. Computation, girdi alanlarını ArcheType'ın diğer alanlarından (ve
12.C ilişkilerinden, ör. BOM) okur; çıktıyı türetilmiş alana yazar. Computation sözleşmesi ArcheType'tan
ayrı versiyonlanır.

Aşağıdaki tablo bu iki farklı kavramı kısaca ayırır (önce açıklama yukarıda verildi):

| Kavram | Ne yapar | Örnek | Yazım biçimi |
|---|---|---|---|
| validation/semantic rule (mevcut) | Doğrular (assertion) | "toplam ≥ 0" | `when[{field,op,value}]` |
| Computation/Derivation (yeni) | Üretir (türetilmiş alan) | fiyat, vergi, BOM açılımı, bordro | saf ifade grafiği + tetik |

### 12.B. Alan tipi (FieldType) genişletmesi

Bölüm 2'deki `field` = en küçük veri birimi. Aşağıdaki tipler mevcut FieldType kümesine **eklenir**;
her biri kendi doğrulama ve indeksleme davranışıyla gelir. Amaç, MRP (Malzeme İhtiyaç Planlama) ve
PIM (Ürün Bilgi Yönetimi / Product Information Management) gibi alanların bugün "string'e sıkıştırılan"
verilerini tip güvenli hale getirmek.

- **money** — para. Tek sayı değil; **değer + kur (currency) + kesinlik (precision) + yuvarlama
  (rounding)** dörtlüsü. Neden: 10.00 USD ile 10.00 TRY aynı sayı ama farklı değer; yuvarlama kuralı
  finansal doğruluğun parçasıdır. Serbest float yasak; kesinlik/yuvarlama alanın tanımında sabittir.
- **measure** — ölçü/miktar. **Birim (unit) + dönüşüm (conversion)** taşır; MRP ve PIM için kritik
  (adet ↔ koli ↔ palet, kg ↔ g). Neden: miktar birimsiz anlamsızdır; dönüşüm tabloya değil tipe bağlı
  olmalı ki hesap-hattı (12.A.4) güvenle çarpsın/toplasın.
- **i18n-text** — çok-dilli metin = `locale → değer` eşlemesi (ör. `{tr: "Kırmızı", en: "Red"}`).
  **ZORUNLU beyan:** global ürün satan bir sistemde çevrilebilir metin string olamaz. Hangi alanın
  i18n-text olduğu ArcheType'ta açıkça beyan edilir (bölüm 12.E bunu kural yapar).
- **geo** — coğrafi konum/geometri; **PostGIS köprüsü** = veritabanı tarafındaki coğrafi tipe
  (PostgreSQL/PostGIS) bağlanan alan. Neden: konum sorgusu (yakınlık, kapsama) string ile yapılamaz;
  bu tip DB'nin coğrafi yeteneğine köprü kurar. (Stack: PostgreSQL zaten SQLAlchemy/Alembic altında;
  PostGIS bu tipin arkasındaki köprüdür.)
- **attribute-set / EAV** — nitelik-kümesi. EAV = Entity-Attribute-Value = "varlık-nitelik-değer"
  = niteliklerin şemaya değil veriye yazıldığı esnek model. **Akeneo-sınıfı PIM** aile/varyant grafiğini
  hedefler (ör. tişört ailesi → beden/renk varyantları; her varyantın değişken nitelik seti).
  Bu tip **çalışma-zamanında (runtime)** tanımlıdır (şema migration'ı gerektirmeden yeni nitelik eklenir)
  ve **ayrı indekslenir** (arama/filtre performansı için ana tablodan bağımsız indeks; bölüm 2 search/index
  rules ile uyumlu).

Bu tipler bir tabloda özetlenir (açıklamalar yukarıda):

| Tip | Taşıdığı | Öncelikli alan | Not |
|---|---|---|---|
| money | değer+kur+kesinlik+yuvarlama | finans/fiyat | float yasak |
| measure | birim+dönüşüm | MRP/PIM | hesap-hattı güvenli çarpım |
| i18n-text | locale→değer | global ürün | beyanı zorunlu (12.E) |
| geo | geometri (PostGIS köprü) | konum sorgusu | DB coğrafi tipe köprü |
| attribute-set/EAV | değişken nitelik grafiği | Akeneo-sınıfı PIM | runtime + ayrı indeks |

### 12.C. İlişki ve temporal (zaman-boyutlu) genişletme

Bölüm 2'deki `relations` parçasına (RelationSchema) aşağıdaki yetenekler eklenir. Sürücü senaryo MRP'dir
(tarih-geçerli reçete/rota) ama yetenekler geneldir. Temporal = "zaman-boyutlu" = bir ilişkinin ne zaman
geçerli olduğunun verinin parçası olması.

- **effectivity** — geçerlilik penceresi: `validFrom / validTo / revision`. Neden MRP: bir reçete
  (BOM) veya rota (routing) belirli tarihler arasında geçerlidir; 1 Mart'ta değişen reçete 1 Şubat'taki
  üretimi etkilemez. Bu alan, geçmişi silmeden yeni geçerlilik penceresi açmayı sağlar — invariant'ın
  ilişki karşılığı: **effectivity değişimi yalnız yeni revizyon/dönem açar**, eski pencereyi kapatır ama
  silmez.
- **tree** — özyinelemeli (recursive) ilişki: bir kaydın aynı tipten üstü/altı olması. Kullanım:
  organizasyon hiyerarşisi, kategori ağacı, çok-seviyeli BOM. Döngü riski vardır; bu yüzden 12.D BOM-graph
  döngü-tespiti ile birlikte düşünülür.
- **polymorphic** — çok-biçimli bağ: bir ilişkinin **herhangi bir ArcheType'a** bağlanabilmesi (ör.
  bir "not" veya "ek" hem Product hem Order hem Party'ye bağlanabilir). Neden: bazı yan-kayıtlar tek bir
  hedef tipe sabitlenemez.
- **temporalScope** — ilişkinin zaman kapsamı: effectivity'yi tekil ilişkiden **ilişki kümesine**
  taşır; "bu ilişki grubu hangi zaman ekseninde okunacak" sorusunu tanımlar (ör. "1 Nisan itibarıyla
  geçerli reçete ağını getir"). Hesap-hattı (12.A.4) bu kapsamı okuyarak doğru dönemin verisiyle çalışır.

### 12.D. MRP-özel yan-sözleşmeler

MRP = Malzeme İhtiyaç Planlama. Aşağıdakiler MRP'ye özgü yan-sözleşmelerdir; Surface/Workflow gibi
ArcheType'a bağlanır, ayrı versiyonlanır ve **hesaplamayı (12.A.4) besler ama kendisi hesaplamaz**.

- **BOM-graph** — Bill of Materials = ürün ağacı/reçete. Bu sözleşme **çok-seviyeli** (ürün → yarı
  mamul → hammadde), **phantom** (fiziksel stoklanmayan ara seviye), **alternatif** (aynı yerde
  kullanılabilecek yedek malzeme) ve **versiyon**lu reçeteleri modeller. Yapısı bir **graf**tır (12.C
  tree'nin üstünde) ve **döngü-tespiti (cycle detection)** zorunludur — bir malzeme dolaylı olarak
  kendini içeremez. **Ne yapmaz:** miktar patlatmasını (explosion) kendisi hesaplamaz; o Computation'ın
  (12.A.4) işidir. BOM-graph yapıyı verir, **Computation onu tüketir**.
- **Routing** — rota = üretim operasyonları dizisi. Bu sözleşme **operation × resource × time × cost**
  (operasyon × kaynak × süre × maliyet) birleşik nesnesini tanımlar: hangi operasyon, hangi kaynakta
  (makine/istasyon), ne kadar sürede, ne maliyetle. effectivity (12.C) ile tarih-geçerlidir.
- **Costing-policy** — maliyetlendirme politikası: **yöntem + dönem + varyans**. Yöntem = standart/ortalama
  vb. maliyet yöntemi; dönem = hangi mali dönemde geçerli; varyans = plan-gerçek sapmasının nasıl ele
  alınacağı. Invariant gereği: **costing değişimi yalnız yeni dönem açar**; kapanmış dönemin maliyet
  transaction'ı immutable'dır, yeniden hesaplanmaz.

### 12.E. i18n zorunluluğu (çevrilebilirlik beyanı)

i18n = internationalization = uluslararasılaştırma. Kural: **her ArcheType, hangi alanının çevrilebilir
(i18n-text tipinde) olduğunu açıkça beyan etmelidir.** Beyan opsiyonel değildir; global ürün satan bir
sistemde "bu alan tek dilli mi çok dilli mi" belirsiz bırakılamaz. Beyanı olmayan bir ArcheType
conformance test'ten (bölüm 8) geçemez.

Ek olarak **enum/etiket yerelleştirmesi alias ile** yapılır: bir enum değeri (ör. `status=SHIPPED`)
koda ve veriye teknik kimliğiyle yazılır; kullanıcıya gösterilen dile-özel etiket ayrı bir alias
tablosundan gelir. Böylece dil eklemek veriyi/kodu değiştirmez, sadece alias eklenir (bölüm 4 append-only
ruhu). Bu, i18n-text alanlarını (12.B) tamamlar: serbest metin i18n-text'te, sabit enum etiketleri
alias'ta yerelleşir.

### 12.F. Bu bölümün kod ve süreç karşılığı (özet)

Yukarıdaki ailelerin hepsi mevcut mimariye **eklemedir**, değişiklik değil:

- Yeni yan-sözleşmeler (Actor/Party, Capability, Mode-Profile, Computation ve MRP aileleri) Surface/Workflow
  ile aynı desende ayrı alt-şema + ayrı versiyon/uyumluluk metadata'sı + ayrı conformance testi taşır.
- Yeni FieldType'lar (12.B) mevcut FieldType kümesine eklenir; her biri doğrulama + indeksleme davranışını
  beraberinde getirir.
- İlişki/temporal alanlar (12.C) RelationSchema'yı genişletir.
- **AI-güvenlik invariant'ı** (giriş) bu ailelerin tümü için conformance test koşuludur: AI önerir, insan
  onaylar (ADMIN_FLOW); geçmiş üretim/maliyet transaction'ı immutable; effectivity/costing değişimi yalnız
  yeni dönem/revizyon. Bu bölüm hiçbir yerde AI'ya app/module yetkisi (bölüm 3) veya doğrudan production
  write vermez; çelik duvarlar (bölüm 8) aynen geçerlidir.
