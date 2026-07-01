# 09 — c12n / p13n Özelleştirme & Kişiselleştirme Standardı (Customization & Personalization)

Sürüm: 1.0 — 2026-07-01
Aile (`family`): `design` · Öncelik: c12n P1 (`should`), p13n P2 (`may`)
Makine kontratı: `src/data/standards/c12n.json` + `src/data/standards/p13n.json` (PLANLANDI — bu anlatı ile aynı PR'da merge edilir; `plan-02` PROMPT 3/12)
CI kapısı (hedef): `check-standards-coverage`
Tüketen primitifler: `k-capability` (`plan-03` §3.2 Capability/Entitlement), `k-mode` (`plan-03` §3.3 Mode-Profile), `k-policy-pdp` (`plan-03` §3.5 — görünürlük kararı PDP'ye sorulur)

Bu doküman anlatı standardıdır: makine-sözleşmeleri *anlatır*, kuralı yeniden tanımlamaz (`00-standards-index.md` §1). İki disiplini tek dosyada tanımlar çünkü aralarındaki *ayrım* standardın özüdür: c12n **tenant seviyesidir** (yönetici bir kez ayarlar, tüm tenant kullanıcılarını etkiler); p13n **kullanıcı seviyesidir** (her kullanıcı kendi için ayarlar, yalnız kendini etkiler). Bu iki eksen karıştırılırsa bir kullanıcının kişisel tercihi başka kullanıcıyı etkiler ya da tenant ayarı kullanıcı-bazında sızar.

---

## 1. Numeronym ve Kapsam

Bu bölüm iki kısaltmayı açar ve standardın hangi soruyu cevapladığını verir.

c12n = "c" + 12 harf + "n" = *customization* (özelleştirme); p13n = "p" + 13 harf + "n" = *personalization* (kişiselleştirme). Özelleştirme, bir *tenant'ın* (kiracı/müşteri organizasyon) yöneticisinin ürünün görünüşünü ve davranışını o tenant genelinde ayarlamasıdır. Kişiselleştirme, bir *kullanıcının* kendi deneyimini yalnız kendisi için ayarlamasıdır. Standardın cevapladığı soru: "bu ayar tüm tenant'ı mı yoksa tek kullanıcıyı mı bağlar — ve nerede, hangi izolasyon ve hangi öncelikle çözülür?"

c12n kapsamı: tema token, layout tercihi, feature flag, field visibility (alan görünürlüğü), configurable module (yapılandırılabilir modül). p13n kapsamı: saved view (kayıtlı görünüm), dashboard düzeni, per-user preference (kullanıcı tercihi). Kapsam DIŞI: iş-modeli değişimi (bu `k-mode` Mode-Profile primitifi — c12n onu *tüketir*, yeniden tanımlamaz), yetki/rol (bu `k-policy-pdp`), lisans/yetenek açık-kapalı (bu `k-capability`).

---

## 2. En Kritik Ayrım — c12n (tenant) ≠ p13n (kullanıcı)

Bu bölüm standardın en önemli guardrail'ini verir; bu ayrım bozulursa veri sızıntısı veya yanlış-etki doğar.

Ayrım şu şekilde uygulanır ve aşağıdaki tabloyla sabitlenir: c12n bir *tenant-scoped* karardır (kim ayarlar: tenant admin; kimi etkiler: tenant'ın tüm kullanıcıları; nerede saklanır: `tenant_settings`/`feature_flags`); p13n bir *user-scoped* karardır (kim ayarlar: kullanıcının kendisi; kimi etkiler: yalnız o kullanıcı; nerede saklanır: `user_preferences`/`saved_views`). Bir kullanıcının kişisel tercihi (p13n) asla başka kullanıcıya sızmaz; bir tenant ayarı (c12n) asla kullanıcı-bazında ayrışmaz (yönetici değiştirdiğinde herkes etkilenir). İki eksenin çakıştığı yerde (ör. hem tenant hem kullanıcı bir tercihi ayarlayabiliyorsa) çözüm sırası §3'teki katman kuralıyla belirlenir.

Aşağıdaki tablo iki ekseni yan yana koyarak farkı netleştirir.

| Boyut | c12n (customization) | p13n (personalization) |
|---|---|---|
| Seviye | Tenant | Kullanıcı |
| Kim ayarlar | Tenant admin | Kullanıcının kendisi |
| Kimi etkiler | Tenant'ın tüm kullanıcıları | Yalnız o kullanıcı |
| Depolama | `tenant_settings`, `feature_flags`, `tenant_theme` | `user_preferences`, `saved_views`, `user_dashboard` |
| İzolasyon | Tenant izolasyonu (RLS) | Kullanıcı izolasyonu (+ tenant) |
| Öncelik (çözüm) | Taban/sınır (tenant izin verirse) | Üstte (kullanıcı tercihi kazanır, tenant sınırı içinde) |
| Örnek | Tenant teması, aktif modül, alan gizleme | Kayıtlı filtre, dashboard düzeni, sayfa-boyu |

---

## 3. Çözüm Sırası — Katman Önceliği

Bu bölüm bir efektif değerin hangi sırayla hesaplandığını tanımlar; bu, feature-flag ve tercih çözümünün belirleyici kuralıdır.

Efektif değer şu şekilde, sabit ve deterministik bir katman sırasıyla çözülür: **system default → tenant (c12n) → user (p13n)** — sonraki katman öncekini, izin verilen sınırlar içinde, ezer. Yani sistem bir varsayılan sunar; tenant admin bunu tenant geneli için değiştirebilir; kullanıcı kendi için (tenant izin verdiyse) daha da özelleştirebilir. Bir tenant bir tercihi *kilitlerse* (locked), kullanıcı onu ezemez — kilit c12n'in p13n üzerindeki üstünlüğünü ifade eder ve bu bir tenant kararıdır. Feature flag'de sıra aynıdır: bir yetenek önce `k-capability` (entitlement) ile *var mı?* diye kapılanır; varsa `feature_flags` ile tenant açık/kapalı; sonra kullanıcı-seviyesi tercih (varsa) uygulanır. Kararın "neden bu değer?" izi (hangi katmandan geldiği) hata-ayıklama için çözülebilir olmalıdır.

---

## 4. Primitif Tüketimi — Capability, Mode-Profile, PDP

Bu bölüm standardın hangi kernel primitiflerini *tükettiğini* (yeniden tanımlamadığını) tanımlar; bu, drift'i önleyen en kritik mimari kuraldır.

Bu standart üç primitifi tüketir ve şu şekilde uygulanır:

- **`k-capability` (Capability/Entitlement, `plan-03` §3.2):** Feature flag bir yeteneği *açıp kapatmadan önce*, o yeteneğin tenant için entitlement'ı (plan/grant/trial) olup olmadığını Capability primitifine sorar. Capability = "bu tenant RFQ *kullanabilir mi?*" (lisans/yetenek ekseni); feature flag = "kullanabildiği yeteneği şu an *açık mı tutuyor?*" (özelleştirme ekseni). Entitlement yoksa flag açılamaz — c12n Capability'yi *yeniden tanımlamaz*, ona danışır. RBAC ile de karıştırılmaz (RBAC=rol→izin, ayrı eksen).
- **`k-mode` (Mode-Profile, `plan-03` §3.3):** İş-modeli (B2B/B2C/…) bileşimi bir *özelleştirme değil* Mode-Profile primitifinin işidir; c12n onun aktif capability setini *okur* ama mod geçişini (`preview→validate→publish→rollback`) kendisi yapmaz. "Tenant temasını değiştir" c12n'dir; "tenant'ı B2C'den B2B'ye geçir" Mode-Profile'dır (kod `if b2b else` DEĞİL, config-driven). Bu ayrım korunur; c12n Mode-Profile'ı taklit eden ikinci bir mod-anahtarı üretmez.
- **`k-policy-pdp` (PDP, `plan-03` §3.5):** Field visibility bir *güvenlik değil* sunum kararıysa c12n çözer; ama "bu kullanıcı bu alanı *görme yetkisine sahip mi?*" sorusu PDP'ye gider. Alan gizleme (c12n) UX'tir; yetki-tabanlı gizleme (PDP) güvenliktir ve backend'de enforce edilir — frontend gizleme güvenlik değildir.

Böylece c12n/p13n bir *tüketici katmandır*: yetenek Capability'den, iş-modeli Mode-Profile'dan, yetki PDP'den gelir; bu standart yalnız *sunum ve tercih* eksenini yönetir.

---

## 5. Tema Token Özelleştirmesi (c12n)

Bu bölüm tenant'ın görsel kimliğini nasıl ayarladığını tanımlar.

Tema özelleştirme şu şekilde uygulanır: tenant, tasarım-token'ları (renk paleti, tipografi ölçeği, radius, spacing) `design-system` standardının izin verdiği *sınırlı ve doğrulanan* bir alt-küme üzerinden ayarlar; token'lar `tenant_theme` olarak saklanır ve runtime'da CSS değişkeni (custom property) olarak enjekte edilir. Serbest CSS/stil enjeksiyonu yasaktır (güvenlik ve tutarlılık riski); tenant yalnız beyaz-listelenmiş token'ları değiştirir. Kontrast/erişilebilirlik invariantı korunur: tenant seçtiği renk kombinasyonu WCAG 2.2 AA kontrast eşiğini (`ui-components`/`ux-interaction` standardı) geçmelidir; geçmeyen tema reddedilir (a11y tenant tercihine feda edilmez). Frontend token'ı React tema sağlayıcısından okur; hangi tenant'ın teması olduğu tenant bağlamından çözülür.

---

## 6. Layout ve Configurable Module (c12n)

Bu bölüm tenant'ın hangi modül/düzeni etkinleştirdiğini tanımlar.

Layout ve modül özelleştirme şu şekilde uygulanır: tenant, hangi modüllerin aktif olduğunu ve temel yerleşim tercihini (ör. navigasyon konumu, yoğunluk) `tenant_settings` üzerinden ayarlar; aktif modül seti önce `k-capability` entitlement'ıyla, sonra tenant flag'iyle çözülür (yetkisi olmayan modül açılamaz). Yapılandırılabilir modül *konfigürasyonla* açılıp kapanır — kodda `if module_x_enabled` dallanması yerine, runtime navigasyon/menü tenant konfigürasyonundan türetilir (Mode-Profile'ın config-driven ilkesiyle aynı ruh). Modül ekleme/çıkarma canlı veriyi yıkmaz: bir modül kapatılınca verisi silinmez, yalnız arayüzden gizlenir; yeniden açılınca veri korunmuş gelir.

---

## 7. Field Visibility (c12n)

Bu bölüm tenant'ın hangi alanları görünür kıldığını tanımlar ve güvenlikten ayırır.

Field visibility şu şekilde uygulanır: tenant admin, form/liste/detay yüzeylerinde hangi *opsiyonel* alanların gösterileceğini `tenant_settings` görünürlük kurallarıyla ayarlar; bu bir *sunum* kararıdır (UX sadeleştirme), güvenlik değildir. Kritik ayrım: "bu alan bu tenant'ta gösterilmesin" (c12n, UX) ile "bu kullanıcı bu alanı görme yetkisine sahip değil" (PDP, güvenlik) farklıdır — ikincisi backend'de enforce edilir ve alan API yanıtından çıkarılır, yalnız frontend'de gizlenmez. Zorunlu/sistem alanları (ör. `id`, audit alanları) gizlenemez. Görünürlük kuralı `k-schema` alan-tanımına referans verir; alanlar koda gömülü değildir.

---

## 8. Saved Views (p13n)

Bu bölüm kullanıcının kayıtlı görünümlerini tanımlar.

Saved view şu şekilde uygulanır: kullanıcı bir liste/tablo yüzeyinde filtre + sıralama + kolon-seçimi + gruplama kombinasyonunu adlandırıp `saved_views` olarak kaydeder; bu görünüm *yalnız o kullanıcıya* aittir ve başka kullanıcıya sızmaz (user-scoped + tenant izolasyonu). Bir kullanıcı bir görünümü *paylaşmak* isterse bu ayrı ve açık bir aksiyondur (paylaşım = kopya veya tenant-seviyesi görünüm önerisi); varsayılan olarak saved view özeldir. Görünüm tanımı, kullanıcının o an sahip olduğu yetkiyle (PDP) tutarlı çözülür: kayıtlı bir filtre kullanıcının artık göremediği bir alana atıfsa, o alan görünümden düşürülür (kayıtlı görünüm yetki-bypass aracı olamaz). Görünümler kalıcıdır (kullanıcı oturumları arasında korunur).

---

## 9. Dashboard ve Per-User Preference (p13n)

Bu bölüm kullanıcının kişisel dashboard'unu ve tercihlerini tanımlar.

Kişiselleştirme şu şekilde uygulanır: kullanıcı kendi dashboard'unda widget seçimi/düzeni/boyutunu `user_dashboard` olarak; genel tercihlerini (dil, sayfa-boyu, yoğunluk, varsayılan görünüm) `user_preferences` olarak saklar. Bu tercihler user-scoped'tur ve §3 katman sırasına uyar: kullanıcı tercihi tenant varsayılanını (izin verildiği sınırda) ezer, ama tenant kilitlediyse ezemez. Dashboard widget'ları yalnız kullanıcının yetkisi (PDP) ve tenant'ın capability'si olan veriyi gösterebilir — kişiselleştirme yetki/yetenek sınırını genişletmez. Dil tercihi p13n'de kullanıcı seviyesinde tutulur ama biçimleme/çeviri `i18n-standards`'ın işidir (locale resolution: tenant-default → user-preference sırası, `i18n-standards` ile aynı).

---

## 10. İzolasyon ve Güvenlik Invariantı

Bu bölüm hem tenant hem kullanıcı izolasyonunun nasıl garanti edildiğini tanımlar.

İzolasyon şu şekilde uygulanır: c12n verisi (`tenant_settings`, `feature_flags`, `tenant_theme`) tenant-scoped'tur ve `data-api-contract` RLS kuralıyla PostgreSQL Row-Level Security ile izole edilir — bir tenant başka tenant'ın ayarını göremez/değiştiremez. p13n verisi (`user_preferences`, `saved_views`, `user_dashboard`) user-scoped'tur ve hem kullanıcı hem tenant düzeyinde izole edilir — bir kullanıcı başka kullanıcının tercihini/görünümünü göremez. Güvenlik invariantı: hiçbir özelleştirme/kişiselleştirme ayarı bir güvenlik-kapısı yerine geçmez; field visibility, feature flag ve tema hepsi *sunum* katmanıdır — gerçek erişim kontrolü PDP'de, gerçek yetenek kontrolü Capability'de, gerçek veri izolasyonu RLS'te enforce edilir. Frontend'de bir şeyin gizli olması onun güvenli olduğu anlamına gelmez.

---

## 11. Migration Stratejisi (Expand-Contract)

Bu bölüm ayar-şeması değişikliğinin sıfır-kesinti sırasını tanımlar.

Ayar tabloları (`tenant_settings`, `feature_flags`, `user_preferences`, `saved_views`) değişikliği `data-api-contract` expand-contract kuralıyla uygulanır: yeni ayar-anahtarı eklenirken önce sistem-varsayılanı tanımlanır (mevcut tenant/kullanıcı ayarsız durumda doğru varsayılana düşer), yeni kolon nullable eklenir ve gerekirse backfill edilir, sonra ayrı migration'da sıkılaştırılır. Bir feature flag *kaldırılırken* önce koddan tüm okuma yolları temizlenir (contract), sonra flag verisi düşürülür — sırası ters olursa çalışan kod tanımsız flag okur. Her migration idempotent ve çalışan `down` yoluna sahiptir; yeni ayar-anahtarının varsayılanı geriye-uyumlu olmalıdır (eski tenant/kullanıcı için davranış değişmemeli). Ayar-şeması sürümlenir; canlı tenant ayarları migration'da korunur (kör-sıfırlama yasak).

---

## 12. Stack Karşılığı (FastAPI + SQLAlchemy + React)

Bu bölüm standardın somut teknoloji karşılıklarını tek yerde toplar.

Aşağıdaki tablo c12n ve p13n konularının backend, veritabanı ve frontend karşılığını verir; c12n'in tenant-scoped, p13n'in user-scoped olduğu ve her ikisinin de yetki/yetenek sınırını genişletmediği vurgulanır.

| Konu | FastAPI / SQLAlchemy | PostgreSQL | React |
|---|---|---|---|
| Feature flag çözümü | flag resolver (capability→tenant→user sırası) | `feature_flags` (tenant) + RLS | flag-aware koşullu render |
| Tema token (c12n) | tema config API + token doğrulama | `tenant_theme` + RLS | CSS custom property + tema sağlayıcı |
| Layout/modül (c12n) | runtime navigasyon config'ten türetilir | `tenant_settings` + RLS | config-driven menü (if/else yok) |
| Field visibility (c12n) | görünürlük kuralı (sunum) + PDP (güvenlik ayrı) | `tenant_settings` görünürlük | alan koşullu gösterim |
| Saved view (p13n) | saved-view repo (user-scoped) | `saved_views` (user+tenant) + RLS | filtre/kolon kaydet-yükle |
| Dashboard (p13n) | dashboard preference API | `user_dashboard` (user) + RLS | widget düzeni (izinli veriyle) |
| Per-user preference (p13n) | preference API (katman sırası) | `user_preferences` (user) + RLS | tercih formu (RHF/Zod) |
| Capability tüketimi | `k-capability` entitlement sorgusu | `entitlement`/`plan_capability` | (yetenek yoksa aksiyon yok) |
| Mode-Profile tüketimi | `k-mode` aktif capability seti okuma | `mode_profile` (okuma) | mode-aware yüzey |
| Migration | Alembic expand-contract + geriye-uyumlu varsayılan | nullable→backfill→contract; `down` çalışır | — |

---

## 13. Test Stratejisi

Bu bölüm standardın yeşil sayılma koşullarını test tipine göre listeler.

Test şu şekilde uygulanır: (1) *birim* — feature-flag çözümünün katman sırasını (system→tenant→user) doğru uyguladığı; kilitli (locked) tenant ayarının kullanıcı tarafından ezilemediği; capability'siz flag'in açılamadığı. (2) *entegrasyon* — saved view/tercih kalıcılığı (oturumlar arası korunur); ayar migration'ının geriye-uyumlu varsayılanla mevcut tenant davranışını değiştirmediği; kayıtlı görünümün yetki-değişiminde yetki-bypass yapmadığı. (3) *izolasyon (e2e/security)* — bir kullanıcının p13n tercihinin/görünümünün başka kullanıcıya sızmadığı; bir tenant'ın c12n ayarının başka tenant'ta görünmediği (RLS); tema/görünüm değişiminin kullanıcı bazında izole olduğu. (4) *güvenlik* — field visibility/feature flag ile "gizlenen" bir alanın PDP-yetkisiz kullanıcıda API yanıtından da çıkarıldığı (frontend-gizleme tek savunma olmadığı). Testi "geçsin diye" zayıflatmak (ör. izolasyon assert'ini gevşetmek) standardı düşürmektir ve yasaktır.

---

## 14. AI Guardrail

Bu bölüm AI ajanının bu standart kapsamında ne yapıp yapamayacağını tanımlar; primitif yönergelerinin (`plan-03` §3) AI sınırlarıyla hizalıdır.

AI guardrail şu şekilde uygulanır: AI, kullanıcı-seviyesi kişiselleştirme (p13n) için *öneri* üretebilir (ör. "şu görünümü kaydetmek ister misiniz?") ama kullanıcının tercihini onun yerine kalıcılaştıramaz — kullanıcı onaylar. AI, tenant-seviyesi özelleştirmeyi (c12n: tema/flag/modül) *öneri-draft* olarak sunabilir ama uygulayamaz; tenant admin onayı zorunludur (`autonomy: draft`). AI, entitlement/lisans (Capability) veya iş-modeli geçişi (Mode-Profile) *değiştiremez* (`autonomy: none`) — bunlar bu standardın tükettiği primitiflerin AI sınırlarına tabidir. AI hiçbir güvenlik ayarını (PDP/görünürlük-yetkisi) gevşetemez. Öneri→önizleme→insan-onayı akışı korunur.

---

## 15. Requirement-ID Tablosu

Bu bölüm standardın her kuralını izlenebilir bir kimlikle listeler; makine kontratlarındaki (`c12n.json`, `p13n.json`) `rules[].id` alanları bu kimliklerle hizalanır. c12n kuralları P1 (`should`), p13n kuralları P2 (`may`) tabanındadır.

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| C12N-01 | c12n tenant-scoped; ayar tüm tenant kullanıcılarını etkiler | Backend/DB | P1 | Integration | Tenant ayarı kullanıcı-bazında ayrışmaz; RLS izole eder | Platform Kernel |
| C12N-02 | Efektif değer system→tenant→user sırasıyla deterministik çözülür | Backend | P1 | Unit | Katman sırası testi yeşil; "neden bu değer" izlenebilir | Platform Kernel |
| C12N-03 | Feature flag açılmadan önce Capability entitlement'ı doğrulanır | Backend | P1 | Unit+Integration | Entitlement yoksa flag açılamaz; c12n Capability'yi tüketir | Platform Kernel |
| C12N-04 | c12n Mode-Profile'ı taklit etmez; aktif capability setini yalnız okur | Backend | P1 | Integration | İş-modeli geçişi `k-mode`'da; c12n ikinci mod-anahtarı üretmez | Platform Kernel |
| C12N-05 | Tema yalnız beyaz-listeli token; serbest CSS enjeksiyonu yasak | Backend/Frontend | P1 | Unit | Beyaz-liste dışı token reddedilir | Design Platform |
| C12N-06 | Tenant teması WCAG 2.2 AA kontrast eşiğini geçmelidir | Frontend | P1 | Unit+E2E | Kontrast-altı tema reddedilir (a11y feda edilmez) | Design Platform |
| C12N-07 | Configurable module config-driven; `if module` dallanması yasak | Backend | P1 | Integration | Modül kapatınca veri silinmez; runtime navigasyon config'ten türer | Platform Kernel |
| C12N-08 | Field visibility sunum kararıdır; yetki-gizleme ayrı (PDP) enforce edilir | Backend/Frontend | P1 | Security | Yetkisiz alan API yanıtından çıkarılır, yalnız gizlenmez | Platform Kernel |
| P13N-01 | p13n user-scoped; tercih/görünüm başka kullanıcıya sızmaz | Backend/DB | P2 | Integration+E2E | Kullanıcı izolasyonu (+tenant RLS) testi yeşil | Platform Kernel |
| P13N-02 | Kullanıcı tercihi tenant varsayılanını (kilit yoksa) ezer | Backend | P2 | Unit | Kilitli tenant ayarı kullanıcı tarafından ezilemez | Platform Kernel |
| P13N-03 | Saved view kalıcıdır; oturumlar arası korunur, varsayılan özeldir | Backend/DB | P2 | Integration | Paylaşım ayrı-açık aksiyon; varsayılan user-scoped | Platform Kernel |
| P13N-04 | Kayıtlı görünüm/dashboard yetki-bypass aracı olamaz | Backend | P2 | Security | Yetki-dışı alana atıf görünümden düşürülür | Platform Kernel |
| P13N-05 | Dashboard yalnız kullanıcının yetkili+tenant-capability'li verisini gösterir | Backend/Frontend | P2 | Integration | Kişiselleştirme yetki/yetenek sınırını genişletmez | Platform Kernel |
| CP-01 | Hiçbir c12n/p13n ayarı güvenlik-kapısı yerine geçmez | Backend | P1 | Security | Erişim PDP'de, yetenek Capability'de, izolasyon RLS'te enforce | Platform Kernel |
| CP-02 | Ayar-şeması değişikliği expand-contract + geriye-uyumlu varsayılanla | DB/Migration | P1 | Migration | Yeni anahtar eski davranışı değiştirmez; `down` çalışır | Platform Kernel |
| CP-03 | AI c12n/p13n'i uygulayamaz; öneri→önizleme→insan-onayı | Backend | P2 | Integration | AI capability/mode değiştiremez; tenant/kullanıcı onaylar | AI Governance |
