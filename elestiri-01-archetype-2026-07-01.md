# Rapor 1 — ArcheType Katmanı Eleştirisi

**Tarih:** 2026-07-01 · **Kaynak kod:** `src/schemas/archetype.ts`, `src/schemas/task.ts`, `docs/archetype-uretim-spec.md`, `k-schema`, `k-archetype-storage`, `k-archetype-bayraklari`, `l1-party` · **Mercekler:** UX, AI-First, yüksek-trafik.

---

## 1. ArcheType nedir / ne yapar / ne yapmaz

**Bu nedir?** ArcheType, sisteminizin "büyük taş" seviyesidir: bir module'ü (kaya) oluşturan ana veri/domain sözleşmesi. Metafor sizin: App=dağ, Module=kaya, ArcheType=büyük taş. Teknik karşılığı: **Frappe DocType'ın gelişmiş hâli** — bir kayıt tipinin (ör. Fatura, Müşteri, Sipariş) alanlarını, ilişkilerini, kurallarını, yetkilerini, yaşam döngüsünü, denetimini ve göçünü tek bir çok-parçalı sözleşmede toplayan tanım. (DocType = Frappe'de bir tabloyu+formu+izinleri birlikte tanımlayan metadata nesnesi.)

**Ne işe yarar?** Geliştirici kod yazmadan, sadece sözleşme tanımlayarak yeni bir kayıt tipi üretebilir; sistem bu tanımdan formu, sorguyu, doğrulamayı, denetim izini ve göç planını türetir. Farklılaşma noktanız da budur: "kod yazmadan module üretmek."

**Ne yapar?** `ArchetypeContractSchema` 23 parça taşır: kimlik, alanlar (field), fragment (yeniden-kullanılabilir alan grubu), ilişkiler, doğrulama kuralları, anlamsal kurallar, izinler, ReBAC/ABAC erişim politikası, yaşam döngüsü, bağlı surface/workflow referansları, tipli aksiyonlar, arama indeksi, denetim politikası, göç politikası, saklama politikası, tenant izolasyonu, ECA bağları, ruleset bağları, AI politikası, çelik duvarlar, test fixture'ları, conformance testleri, versiyonlama.

**Ne yapmaz?** ArcheType **UI kodu değildir** (onu Surface projekte eder), **davranış/süreç değildir** (onu Workflow taşır) ve **serbest kod çalıştırmaz** (kurallar yapısal ifadedir). Bu ayrımlar doğru ve olgun. Ama bu raporun tezi: ArcheType **bir "kayıt tipini" tarif etmede sınıfının en iyisi, bir "aktörü / yeteneği / iş-modeli modunu / hesaplamayı" tarif etmede ise sözleşme-eksik.**

---

## 2. Adil değerlendirme — neyi gerçekten iyi yapıyor

Eleştiriye geçmeden, haksızlık etmemek için: bu katman çoğu ticari meta-framework'ten daha ileri. Somut güçlü yönler:

Göç güvenliği sınıf-üstü. `MigrationPolicySchema` alan silme/yeniden-adlandırma/tip-değiştirmeyi **doğrudan yasaklıyor** (`forbidDirect`), önce deprecated+alias+backfill zorunlu, snapshot+rollback+dry-run+data-impact+audit istiyor. Çoğu ürün bunu disiplinle (yani unutulabilir biçimde) yapar; siz sözleşmeye gömmüşsünüz. Bu doğru.

AI yetki sınırı sözleşmede. `AgentPolicySchema` deny-by-default: AI app/module üretemez, ruleset override edemez, doğrudan prod-write yapamaz; `autonomy: suggest`, `forbiddenTargets: [app, module]`. Bu, "AI önerir, insan/motor uygular" invariant'ını **makine-okunur** yapıyor — düz metin politika değil. Enterprise için doğru desen.

Çok-katmanlı yetki (ruleset layer: system/platform/tenant) ve çelik duvarlar (`STEEL_WALLS`: 13 deny-by-default kontrol) tasarımı olgun. Depolama kararı da isabetli: `k-archetype-storage` "tablo-per-tip YOK, dinamik DDL YOK; paylaşılan şema + JSONB + FK, yalnız yüksek-hacim opt-in fiziksel kolona terfi" diyor — bu, metadata-driven sistemlerin klasik "her tenant tablo yaratır → şema patlaması" tuzağından kaçınıyor.

Yani sorun "kötü tasarım" değil. Sorun **kapsam**: model bir eksene (kayıt/entity) çok derin, diğer eksenlere (aktör/yetenek/mod/hesap) hiç girmemiş.

---

## 3. Zayıflık nedenleri — kök sebep analizi

### 3.1 Kök sebep: DocType soyutlaması "kayıt tipi"dir, "aktör" veya "yetenek" değil

DocType/ArcheType mental modeli şudur: *"dünyada bir tür kayıt vardır; onun alanları, kuralları, izinleri olur."* Bu, Fatura veya Sipariş için mükemmel. Ama üç şey bu kalıba sığmaz:

**Aktör polimorfizmi.** Gerçek dünyada aynı varlık (bir kişi ya da kurum) **bağlama göre farklı roller** oynar: ekranın birinde "alıcı", diğerinde "satıcı", üçüncüsünde "çalışan", dördüncüsünde "onaylayan". ChatGPT'nin haklı olarak vurguladığı Actor Model budur. Sizde `l1-party` var ("Customer/Supplier/Employee yazma — Party yaz") — bu doğru içgüdü. Ama iki sorun: (1) Party **Layer-1'de**, yani "16 app'in ortak primitifi" değil, sıradan bir modül; (2) Party **contact/golden-record merkezli** (tekilleştirme, birleştirme), *rol-bağlam-yetenek* merkezli değil. ArcheType'ın `RelationSchema`'sı sadece `one-to-one/one-to-many/...` + `onDelete` taşır; "bu ilişki, X aktörünün Y bağlamında Z rolüdür" gibi *rollü, bağlam-kapsamlı* ilişkiyi ifade edemez.

**Yetenek (capability) açma/kapama.** `k-boyut3` düğümü "etkin yetki = kullanıcı ∩ capability ∩ plan" diyor — yani capability kavramı **var**. Ama `src/schemas/` içinde `capability.ts` diye versiyonlanan bir sözleşme **yok**. Capability şu an bir *cümle*, bir *kontrat* değil. Oysa "B2B'de RFQ açık, C2C'de escrow açık" gibi davranış, bir kayıt tipinin alanı değil; ArcheType'ların/Surface'lerin/Workflow'ların *üstünde* duran bir yetenek matrisidir.

**İş-modeli modu (mode profile).** ChatGPT'nin "tek tıkla B2C→B2B, validation+rollback ile" dediği şey. Sizde `edition-*` düğümleri var (storefront, salescrm, people...). Ama edition tanımınız açıkça **paketleme/GTM varyantı**: "aynı core module seti, farklı UI estetiği ve pazara-çıkış." Bu, *statik* bir paket seçimi; ChatGPT'nin tarif ettiği *runtime* mod-değişimi (canlı tenant'ın sipariş/fatura/rol/checkout davranışını, veriyi yıkmadan, dry-run+rollback ile yeniden-kompoze etmek) değil. Üstelik commerce için yalnız "storefront" (B2C) edition'ı var; B2B/C2C/D2C/B4B modları modellenmemiş.

### 3.2 Kök sebep: Kurallar "doğrulama"dır, "hesaplama" değil

ArcheType iki kural türü taşır: `ValidationRuleSchema` (`expr` + mesaj) ve `SemanticRuleSchema` (`invariant` — ör. "fatura toplamı kalemler toplamına eşit"). İkisi de **assertion** (doğ/yanlış iddiası). Ama enterprise portföyünüzün yarısı **hesaplama hattı** ister; bunlar assertion değildir:

- Commerce/PIM: fiyatlandırma motoru (taban → kanal → müşteri-grubu → hacim → sözleşme → kampanya → FX), CPQ.
- MRP: BOM patlaması (ürün ağacını seviye seviye açıp net ihtiyaç hesaplama), MRP net-leme.
- Muhasebe: vergi hesabı, dunning (vade-takip), amortisman, çok-defter konsolidasyon.
- HRMS: bordro (brütten nete, kesinti/prim/vergi zinciri).
- CRM: forecast rollup (fırsatların olasılıkla ağırlıklı toplanması).

Bunların hiçbiri "bu alan şu koşulu sağlasın" değil; "bu değer, şu girdilerden şu sırayla **türetilir**." ArcheType'ta *türetilmiş alan (derived field)* + *hesap grafiği (derivation graph)* + *rating/pricing engine* sözleşmesi yok. `typedActions` var ama onlar ayrık aksiyonlar (butonlar), sürekli hesap hattı değil. Bu boşluk, "SAP MRP kadar güçlü", "Akeneo kadar güçlü PIM", "gerçekten satış yaptıran CRM" iddialarının altını boşaltıyor.

### 3.3 Kök sebep: İlişki modeli düz (graf/ağaç/temporal yok)

`RelationSchema` dört düz kardinalite + `onDelete` taşır. Eksikler:

- **Ağaç/hiyerarşi**: org şeması (HRMS), kategori ağacı (Commerce/CMS), BOM ağacı (MRP), threaded yorum (Social) — hepsi *özyinelemeli* ilişkidir; düz kardinalite bunu birinci-sınıf ifade etmez.
- **Polimorfik hedef**: "bu ek, *herhangi bir* ArcheType'a bağlanabilir" (dosya→herhangi kayıt, yorum→herhangi kayıt, audit→herhangi kayıt). `relationTo` tek bir hedef id ister.
- **Temporal/bitemporal ilişki**: "bu çalışan şu departmana *2024-2025 arası* bağlıydı." `k-archetype-bayraklari` bitemporal *bayrağını* biliyor ama ilişki seviyesinde zaman-kapsamı yok.

### 3.4 Kök sebep: Fragment "kopyala-yapıştır alan grubu", "davranışsal arayüz" değil

`FragmentSchema` yeniden-kullanılabilir alan grubudur (iyi). Ama bir *trait/arayüz* değildir. Enterprise'da şuna ihtiyaç var: "her *Adreslenebilir* şeyin adres surface'i aynı render edilir", "her *Fiyatlanabilir* şeye pricing engine takılır", "her *Konumlanabilir* şey `scale-gis` haritasına düşer", "her *Denetlenebilir* şey audit alır." Bu, alan-kopyalama değil, *sözleşmeye uyan her ArcheType'a otomatik davranış bağlama*dır (structural typing / trait). Bu olmayınca Surface ve Workflow yeniden-kullanımı zayıflar (her ArcheType kendi surface'ini elle bağlar).

### 3.5 Kök sebep: Alan tipi kümesi kapalı ve enterprise-eksik

`FieldTypeSchema` 14 tip: string/text/number/integer/boolean/date/datetime/enum/json/relation/currency/email/phone/file. Eksik olan, portföyünüzü doğrudan bloke eden tipler:

- **money** (para): `currency` var ama "para = değer + para-birimi + ondalık-kesinlik + yuvarlama-kuralı" değil. Muhasebede yanlış yuvarlama = yasal sorun. currency'yi float gibi tutmak enterprise-güvensiz.
- **measure / unit-of-measure** (ölçü birimi): MRP ve PIM için zorunlu — "5 kg", "12 adet/koli", "1 palet = 40 koli." Birim dönüşümü olmadan MRP/oto-yedek-parça PIM imkânsız.
- **i18n-text** (yerelleştirilmiş metin): HRMS/CMS/Email global; "ürün adı 8 dilde" tek alan olmalı, 8 ayrı string değil.
- **attribute-set / EAV** (öznitelik-seti): Akeneo-sınıfı PIM'in kalbi. Bir "aile" (family) yüzlerce özniteliği, varyant eksenlerini (renk×beden), miras zincirini tanımlar. Bu, sabit `fields` dizisiyle ifade edilemez — *çalışma-zamanı öznitelik grafiği* ister. Not: PIM modülü (`s-pim`, "Akeneo muadili") ve `product` ArcheType'ı **var**; eksik olan modül değil, ArcheType şemasının bu öznitelik-grafiğini taşıyacak alan-tipi — Akeneo-sınıfı derinliğin önündeki asıl teknik engel budur.
- **geo** (coğrafi): `scale-gis` motoru var ama `FieldType`'ta geo yok; yani bir ArcheType alanı "bu bir konum" diye beyan edip haritaya otomatik düşemiyor. Motor ile sözleşme kopuk.

---

## 4. Gap analizi — önceliklendirilmiş

Aşağıdaki tablo öncesi sade özet: boşlukların hepsi "yeni alan tipi" değil; en pahalıları **yeni sözleşme aileleri** (Actor, Capability, Mode, Computation). Bunlar sonradan "modül" diye eklenemez — ArcheType'la aynı seviyede, yan-sözleşme olarak tasarlanmalı (tıpkı Surface/Workflow'un ayrı versiyonlanması gibi).

Öncelik ölçeği: **P0** = portföyün ≥2 ürününü bloke eder, sonradan eklenmesi pahalı; **P1** = tek ürün ailesini derinden etkiler; **P2** = kalite/olgunluk.

| # | Boşluk | Öncelik | Kimi bloke eder | Neden ArcheType-seviyesi |
|---|---|---|---|---|
| 1 | Actor/Party polimorfizmi (rol-bağlam-yetenek) | P0 | Commerce, CRM, HRMS, Social, Fleetx | Her app'te aktör var; kayıt-tipi olarak modellenince rol-geçişi yamaya döner |
| 2 | Capability/Entitlement sözleşmesi | P0 | Tüm SaaS paketleme + lisans | Feature-gate/plan/lisans ArcheType üstü matris; kayıt alanı değil |
| 3 | Mode-Profile (runtime iş-modeli anahtarı) | P0 | Commerce (B2C/B2B/C2C/D2C/B4B), çok-dikey | Editions statik; canlı recomposition ayrı sözleşme ister |
| 4 | Computation/Derivation sözleşmesi | P0 | Commerce, MRP, Muhasebe, HRMS, CRM | Fiyat/BOM/bordro *hesap*; validation/semantic *assertion* |
| 5 | attribute-set/EAV + variant/family alan tipi | P0 | PIM (Akeneo sınıfı), Commerce varyant | Sabit `fields` dizisi öznitelik-grafiğini tutamaz |
| 6 | money + unit-of-measure alan tipleri | P1 | Muhasebe, MRP, PIM | Yuvarlama/birim-dönüşümü yasal/üretimsel doğruluk |
| 7 | Ağaç/polimorfik/temporal ilişki | P1 | HRMS(org), CMS/Commerce(kategori), MRP(BOM), Social(thread) | Özyineleme+zaman düz kardinalitede yok |
| 8 | Trait/arayüz (davranışsal fragment) | P1 | Surface/Workflow yeniden-kullanımı | Adreslenebilir/Fiyatlanabilir/Konumlanabilir otomasyonu |
| 9 | i18n-text + enum-değeri yerelleştirme | P2 | HRMS, CMS, Email, çok-bölge | Global ürünlerde tek-dil alan yetersiz |
| 10 | Çapraz-ArcheType invariant | P2 | Muhasebe, sipariş bütünlüğü | "toplam = kalemler toplamı" iki tipi kapsar; SemanticRule tek-tip |

---

## 5. Önerilen sözleşme/şema tasarımı (kod değil — mimari tarif)

Aşağıdaki her öneri, mevcut deseninizle uyumlu bir **yeni yan-sözleşme** (Surface/Workflow'un ArcheType'tan ayrı versiyonlanması gibi) ya da mevcut şemaya bir *parça eklemesi* biçimindedir. Sizin kurallarınıza sadık kalarak test-önce sıralıyorum: her sözleşme için önce onu koruyacak conformance testi/gate, sonra veri modeli, sonra davranış.

### 5.1 Actor (Party) sözleşmesi — kernel-seviyesine terfi

**Ne olmalı?** `l1-party`'yi Layer-1'den çıkarıp kernel-komşusu bir **Actor** primitifi yapın; `k-identity` (authentication principal) ile `Actor` (business party) arasına net köprü koyun.

Sözleşme parçaları (tarif): `identity` (kişi/kurum/sistem/marka ayrımı) · `roles[]` (bir aktörün oynayabildiği roller: buyer/seller/employee/approver...) · `roleBindings[]` (rol + **bağlam/scope** + zaman-aralığı: "ABC Ltd, tenant-X kanalında, 2025'ten beri distributor") · `capabilities[]` (bu aktör-rolüne açık yetenekler — §5.2 ile bağ) · `relationships[]` (aktörler-arası: çalışır-, temsil-eder-, ana-şirket-) · `mergePolicy` (golden-record; l1-party'den taşınır).

**Test-önce:** conformance testi "aynı Actor, iki farklı bağlamda iki farklı rol kümesiyle yetkilenebiliyor mu; bir bağlamdaki rol diğerine sızıyor mu (sızmamalı)."

**Güvenli / riskli / enterprise / sizin durumunuz:** Güvenli = Party'yi olduğu yerde bırakıp her app'in kendi rolünü yazması (ama bu tekrar üretir). Riskli = aktörü tek dev "God object" yapmak (her şey Party'ye bağlanır, şişer). Enterprise-doğru = ince Actor kimliği + ayrı **RoleBinding** tablosu (bağlam-kapsamlı). Sizin durumunuz: RoleBinding'i `k-authz`'in ReBAC ilişkisine besleyin — zaten ReBAC var, aktör-rolü onun doğal girdisidir.

### 5.2 Capability / Entitlement sözleşmesi

**Ne olmalı?** `capability.ts` adında, ruleset.ts'e kardeş bir katalog: her **Capability** = id + açıklama + hangi ArcheType/Surface/Workflow/ECA'ları etkinleştirdiği + hangi *layer*'da (system/platform/tenant) togglanabildiği + lisans/plan bağı.

Bu, gap analizinin "lisans yönetimi yok" bulgusuyla aynı yeri çözer: **entitlement** (bir tenant'ın bir plana göre neye hakkı olduğu) = capability × plan. `k-boyut3`'teki "user ∩ capability ∩ plan" cümlesini sözleşmeye dönüştürür.

**Test-önce:** "capability kapalıyken ilgili Surface görünmüyor, ilgili typed-action 403 dönüyor, ilgili ECA tetiklenmiyor" conformance testi.

### 5.3 Mode-Profile sözleşmesi (ChatGPT'nin "Commerce Mode Orchestrator"ının doğru hâli)

**Ne olmalı?** Edition'ı ikiye ayırın: (a) *Edition* = statik paketleme/GTM (kalsın); (b) **Mode-Profile** = runtime davranış profili. Mode-Profile = aktif capability seti + aktif surface/workflow versiyonları + policy override'ları. Mod değişimi ChatGPT'nin doğru tarif ettiği akışla: `preview → validation → data-impact → dry-run → approval → apply → rollback`. Dikkat: bu akış sizde **zaten var** — ArcheType'ın `ADMIN_FLOW`'u tam olarak budur. Yani Mode-Profile, yeni bir akış icat etmez; mevcut ADMIN_FLOW'u ArcheType yerine *profil* nesnesine uygular.

**Aktör açıklığı (sizin kuralınız):** Mod değişiminde **kullanıcı** modu seçer; **sistem** validation+dry-run çalıştırır; **AI** yalnız eksikleri *önerir* (ChatGPT örneğindeki "eksik alanları listele, MOQ öner") — uygulamaz; **insan (platform/tenant owner)** onaylar; **motor** uygular; **CI** conformance testini geçmeden apply'ı bloke eder. Bu, sizin `AI_FIX_LOOP` + `ciAutoPush:false` invariant'ınızla birebir uyumlu.

### 5.4 Computation/Derivation sözleşmesi

**Ne olmalı?** ArcheType'a üçüncü kural sınıfı: `derivations[]`. Her derivation = çıktı-alan + girdi-alanlar + **saf (yan-etkisiz) hesap ifadesi** (yine serbest kod değil; yapısal ifade grafiği) + tetik (yaz-anında mı, sorgu-anında mı, batch mı). Pricing/tax/BOM/bordro bunun *özel profilleri* olur (pricing-derivation, tax-derivation).

**Neden serbest kod değil?** Sizin çelik-duvar felsefeniz "serbest JS/SQL yok" diyor. Hesap ifadesi de yapısal olmalı (whitelist fonksiyon + alan referansı), böylece AI güvenle üretebilir, motor deterministik çalıştırır, conformance testi doğrular.

**Test-önce:** her derivation için "bilinen girdi → beklenen çıktı" golden-test; para hesaplarında yuvarlama-kuralı testi (banker's rounding vb.).

### 5.5 Zenginleştirilmiş alan tipleri + ilişki + trait

- **Alan tipleri**: `money` (değer+currency+precision+rounding), `measure` (değer+unit, dönüşüm tablosuyla), `i18n-text` (locale→değer), `geo` (`scale-gis`'e köprü), ve **attribute-set** (EAV/family/variant — PIM için ayrı alt-sözleşme, çünkü çalışma-zamanı grafiği).
- **İlişki**: `kind`'e `tree` (self-recursive) ve `polymorphic` (hedef = "herhangi archetype") ekleyin; ilişkiye opsiyonel `temporalScope` (validFrom/validTo).
- **Trait**: `FragmentSchema`'nın yanına `TraitSchema` — davranışsal arayüz (Addressable/Priceable/Geolocatable/Auditable). Bir ArcheType trait'i "implement eder"; Surface/Workflow trait'e göre otomatik bağlanır.

---

## 6. Üç mercek — ArcheType özelinde

### 6.1 AI-First (bu raporun en ağır merceği)
İyi haber: ArcheType AI-first'ü **sözleşmeye gömmüş** — `aiPolicy` + `AI_FIX_LOOP` (1-3 otomatik, 3/6'da admin'e çok-seçenekli soru, 9'da tanı+dur) + `ADMIN_FLOW`. Bu, çoğu üründen ileri. Eksik olan: yukarıdaki dört yeni sözleşme (Actor/Capability/Mode/Computation) **AI'ın üretebileceği yüzey** olarak tanımlı değil. AI şu an ArcheType üretiyor; ama "AI bir capability önerir", "AI bir pricing-derivation taslağı üretir, insan onaylar" akışı yok. Öneri: her yeni sözleşmeyi `allowedTargets`'a *önermek* (draft) yetkisiyle ekleyin, *apply* insana kalsın. Bu, "sadece teşhis eden / öneren / değiştiren / PR açan / main'e yazan" ayrımınızda **öneren** kategorisinde kalır — doğru enterprise sınırı.

### 6.2 Yüksek-trafik
`k-archetype-storage`'ın hibrit modeli (paylaşılan şema + JSONB, yüksek-hacim opt-in fiziksel kolon) doğru. Ama iki risk: (1) **EAV/attribute-set** (PIM) JSONB'de tutulursa milyonlarca ürün × yüzlerce öznitelikte sorgu çöker — attribute-set için ayrı indeksleme stratejisi (materialized attribute tabloları) sözleşmede planlanmalı. (2) **Derived field**'lar sorgu-anında hesaplanırsa yüksek-trafikte pahalı; hangi derivation'ın *materialize* edileceği (CQRS projection'a — `scale-projections` mevcut) sözleşmede beyan edilmeli.

### 6.3 UX
ArcheType'ın UX'e katkısı dolaylı: `typedActions` (riskLevel + requiresApproval) doğrudan **afordansa** (butonun görünürlüğü/onay-diyaloğu) çevrilebilir — bu iyi. Eksik: alan-seviyesi UX ipuçları (yardım metni, placeholder, maskeleme deseni, bağımlı-alan görünürlüğü) sözleşmede zayıf. Surface bunları türetecekse, ArcheType field'ında `uiHints` taşımalı (Surface raporu §5 ile bağ).

---

## 7. Unknown-unknowns — risk keşif checklist'i

Sizin `archetype-uretim-spec.md` §10'unuz unknown-unknowns'ı "henüz modellemediğimiz risk sınıfı" diye doğru tanımlıyor. ArcheType'a özel, henüz sormadığınız sorular:

- **Öznitelik-grafiği patlaması:** 10.000 öznitelikli bir PIM ailesinde şema-evrimi + göç nasıl davranır? (Test edilmemiş; EAV migration en zor göçtür.)
- **Çapraz-ArcheType invariant tutarlılığı:** "sipariş toplamı = kalemler toplamı" invariant'ı, kalem ayrı aggregate ise event-driven'da *anlık* tutmaz; hangi invariant güçlü-tutarlı (ACID), hangisi nihai-tutarlı? (Kernel raporu §4 ile bağ.)
- **Derivation döngüsü:** A alanı B'den, B A'dan türetilirse? Derivation grafiğinde döngü tespiti conformance testi gerekir.
- **Enum yerelleştirme + göç:** enum değeri "active" 8 dile çevrilir; sonra "active" yeniden adlandırılırsa çeviriler? (alias zinciri enum'a da lazım.)
- **Trait sürüm çakışması:** ArcheType `Priceable v1`'i implement ederken pricing-engine `Priceable v2` beklerse? (Surface/Workflow'un versiyonlandığı gibi trait de versiyonlanmalı.)
- **Actor birleştirme (merge) sonrası yetki:** iki Party golden-record'a merge edilince rol/capability birleşimi nasıl çözülür? Fazla-yetki (privilege escalation) riski.
- **Mode-Profile geri-alma penceresi:** B2C→B2B'ye geçip 3 gün sipariş alındıktan sonra rollback istenirse, o siparişler hangi modda? (Rollback'in veri-tarihsel sınırı.)

---

## 8. Kilitlenecek ADR taslakları

Terminoloji: **ADR** = Architecture Decision Record; "şu kararı, şu gerekçeyle, şu tarihte verdik" diyen kısa kilitli belge. Aşağıdakiler taslak başlıklardır; içlerini doldurmak sıradaki adım olabilir.

- **ADR-A1 — Actor/Party primitifinin katmanı.** Karar: Party Layer-1'de mi kalır, kernel-komşusu Actor'a mı terfi eder? Öneri: terfi + RoleBinding ayrımı. Etki: `k-authz` ReBAC girdisi.
- **ADR-A2 — Capability/Entitlement sözleşmesi.** Karar: capability birinci-sınıf sözleşme mi, ArcheType alanı mı? Öneri: `capability.ts` (ruleset.ts kardeşi) + plan/lisans bağı.
- **ADR-A3 — Edition vs Mode-Profile ayrımı.** Karar: iş-modeli değişimi statik edition mı, runtime mode-profile mi? Öneri: ikisini ayır; Mode-Profile ADMIN_FLOW'u yeniden kullansın.
- **ADR-A4 — Computation/Derivation sözleşmesi.** Karar: hesap ArcheType'a üçüncü kural sınıfı mı, ayrı engine mi? Öneri: `derivations[]` + pricing/tax/BOM profilleri; yapısal ifade (serbest kod değil).
- **ADR-A5 — Alan tipi genişletme.** Karar: money/measure/i18n-text/geo/attribute-set eklenir mi? Öneri: evet; attribute-set ayrı alt-sözleşme (EAV grafiği).

---

## 9. Öncelikli aksiyonlar (ArcheType)

Sade sıra: önce dört yeni sözleşmeyi *kavramsal* kilitle (ADR), sonra bir dikey dilimde kanıtla, sonra genişlet.

1. **ADR-A1..A5'i yaz ve kilitle** (blocker; hepsi birbirini besliyor).
2. **Tek dikey dilim seç ve dört sözleşmeyi orada kanıtla:** Commerce'te "B2C→B2B mod anahtarı." Bu tek senaryo Actor (buyer/company-buyer), Capability (RFQ/net-terms aç), Mode-Profile (recomposition), Computation (B2B fiyat-listesi) — dördünü birden zorlar. Uçtan uca sözleşme + conformance testi + rollback.
3. **PIM için attribute-set alt-sözleşmesini ayrı tasarla** (P0, en zor; erken başla).
4. **money + measure alan tiplerini ekle** (P1; Muhasebe/MRP doğruluğu — yasal risk).
5. **Trait sözleşmesini pilotla:** `Geolocatable` (scale-gis'e otomatik bağ) ile başla — en görünür kazanç.

---

*Bağlı raporlar: Kernel (`elestiri-02`) — bu sözleşmelerin hangi katmana ait olduğu; Surface (`elestiri-03`) — bu sözleşmelerin yüzeye nasıl yansıdığı.*
