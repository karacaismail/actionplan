# Actor / Party Sözleşmesi — Polimorfik Aktör ve Temporal Roller

**Tarih:** 2026-07-01
**Durum:** Taslak sözleşme (kilitlenmeyi bekliyor — bkz. §6 ADR-A1)
**Makine kontratı:** `src/data/standards/identity-data.json` (identity-data — §16 isim/adres/telefon kuralları)
**Kaynak/bağlam:** `plan-03-yeni-yonergeler-2026-07-01.md §3.1` (Actor/Party yönergesi), `core-contract-pack.md §3.1` (platform_actor primitifi), `wbs-field-semantics.md` (dependsOn anlamı), `plan-01-vibecoding-eylem-faz-faz-2026-07-01.md` Dalga 1.
**İlişki:** Bu doküman `capability-entitlement-contract.md`'nin kardeşidir: Actor "kim ve hangi rolde?" sorusunu, Capability "hangi yeteneğe hakkı var?" sorusunu yanıtlar. İkisi birlikte PDP'nin (`k-policy-pdp`) karar girdisini oluşturur. Bu doküman **kod yazmaz**; `k-party` kernel primitifinin davranış sözleşmesini normatif tanımlar. Makine-okunur karşılığı (SQLAlchemy modeli, Alembic migration, Strawberry tipi) ADR-A1 kilitlendiğinde ajan-draft + insan-onay ile `platform` reposunda üretilir.

---

## 1. Amaç

Bu sözleşme, aynı kişi veya kurumun bağlama göre birden çok rol taşıyabildiği polimorfik aktör modelini sabitler. Hedef: 50 uygulamanın hiçbirinin kendi Customer/Supplier/Employee tablosunu yeniden yazmaması; her aktörün tek bir `party` kaydında tanımlanıp rollerinin *veri* olarak (tenant/channel/app bağlamıyla ve zaman aralığıyla) çözülmesi. Aktör-açık ifade: *ajan* rol tanımı önerir (draft); *insan* onaylar; *motor* onaylı rolü kaydeder ve PDP'ye besler.

## 2. Kapsam

Bu sözleşme şunları kapsar: (1) `party` (person/organization) çekirdek kimliği, (2) `party_role` ile bağlam-kapsamlı ve zaman-aralıklı rol bağlama, (3) `party_relation` ile taraflar arası ilişki grafiği (employs/owns/represents), (4) bağlam-çözümü kuralı (bir rolün tenant/channel/app filtresiyle geçerli sayılması), (5) temporal sorgu (belirli bir andaki geçerli roller), (6) `k-party` düğümünün WBS yerleşimi ve bağımlılıkları, (7) çok-kiracılı izolasyon ve audit zorunlulukları. Backend, frontend, test ve AI-guardrail gereksinimleri ilgili bölümlerde tarif edilir.

## 3. Non-goals

Bu sözleşme şunları **kapsamaz**: (1) Contact/CRM yönetimi — mevcut `l1-party` contact-merkezliydi; bu primitif kernel-seviyesidir ve onun yerini almaz, farklı bir eksendir. (2) Kimlik doğrulama (authentication) — login `k-identity` işidir; `k-party` yalnızca "kim olduğu doğrulanmış tarafın hangi bağlamda ne rol taşıdığını" tutar. (3) İzin/yetki kararı — allow/deny kararı PDP'nindir; `party_role` yalnızca PDP'ye *girdi*dir. (4) Capability/lisans — yetenek hakkı `capability-entitlement-contract.md`'dedir. (5) Serbest kodla rol mantığı — roller koda gömülmez, veridir.

## 4. Tanım (nedir / ne yapar / ne yapmaz)

**Nedir:** `k-party`, sistemdeki her tarafı (kişi, kurum) tek bir soyutlamada temsil eden ve bu taraflara zaman-aralıklı, bağlam-kapsamlı roller bağlayan kernel kayıt defteridir.

**Ne yapar:** Bir party'yi bir kez tanımlar; buyer/seller/employee/supplier/agent rollerini *bağlam* (tenant/channel/app kapsamı) filtresiyle ve *zaman* (valid_from/valid_to) ekseniyle çözer; taraflar arası ilişkileri (bir kişi bir kurumu temsil eder) grafik olarak tutar; her rol değişimini audit'ler.

**Ne yapmaz:** Rolü koda gömmez (rol veridir, `if role == "buyer"` yerine `party_role` sorgusu). Contact defterini yönetmez. Login/parola tutmaz. Yetki kararı vermez — bunu PDP yapar. Bir aktörü tek bir statik role kilitlemez; polimorfizm (aynı party'nin aynı anda buyer + seller + employee olabilmesi) çekirdek özelliktir.

## 5. Sözleşme şekli (alan yapısı)

Aşağıdaki üç tablo, `k-party` primitifinin veri şeklini yalnızca *alan adı + tip + amaç* olarak tarif eder; dolu örnek/mock değer verilmez. Tipler PostgreSQL/SQLAlchemy 2.0 karşılıklarıdır.

Bu tablo `party` çekirdek kimlik kaydının alanlarını tanımlar.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Party'nin benzersiz kimliği |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu; v1 §2.1 fail-closed zorunluluğu |
| `type` | Enum(person, organization) | Tarafın türü; polimorfizmin taban ayrımı |
| `display_name` | Text | İnsan-okur ad (kişi adı veya kurum unvanı) |
| `identity_user_id` | UUID (nullable) | Kişi ise `k-identity` login kaydına 1:1 köprü (opsiyonel) |
| `external_ref` | Text (nullable) | Dış sistem/entegrasyon kimliği (VKN/TCKN yerine referans; PII motorun tip kurallarında) |
| `status` | Enum(active, suspended, archived) | Party yaşam döngüsü; silme yerine arşiv |
| `created_at` | TIMESTAMPTZ (NOT NULL) | Audit/oluşturulma zamanı |
| `updated_at` | TIMESTAMPTZ (NOT NULL) | Son değişiklik zamanı |

Bu tablo `party_role`'ün bağlam-kapsamlı ve zaman-aralıklı rol bağlarını tanımlar; temporal alanlar rol geçmişi için zorunludur.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Rol bağının benzersiz kimliği |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu |
| `party_id` | UUID (FK → party.id) | Rolü taşıyan party |
| `role` | Text | Rol anahtarı (buyer, seller, employee, supplier, agent, …); k-authz izin setine eşlenir |
| `context` | JSONB | Bağlam kapsamı: {tenant, channel, app, department, project} — rolün nerede geçerli olduğu |
| `valid_from` | TIMESTAMPTZ (NOT NULL) | Rolün başladığı an (temporal çözüm için) |
| `valid_to` | TIMESTAMPTZ (nullable) | Rolün bittiği an; NULL = süresiz |
| `status` | Enum(active, revoked) | Rol bağının durumu; revoke iz bırakır |
| `approval_ref` | UUID (nullable) | Onaylayan insan + zaman + gerekçe referansı (AI-draft ise zorunlu) |
| `created_at` | TIMESTAMPTZ (NOT NULL) | Audit |

Bu tablo `party_relation`'ın taraflar arası ilişki kenarlarını tanımlar.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | İlişki kenarının kimliği |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu |
| `from_party` | UUID (FK → party.id) | İlişkinin kaynağı |
| `to_party` | UUID (FK → party.id) | İlişkinin hedefi |
| `kind` | Text | İlişki türü (employs, owns, represents, …) |
| `valid_from` | TIMESTAMPTZ (NOT NULL) | İlişkinin başladığı an |
| `valid_to` | TIMESTAMPTZ (nullable) | İlişkinin bittiği an; NULL = süresiz |

## 6. WBS yerleşimi

`k-party`, kernel kümesine (`k-*`) `module`-seviyesi bir düğüm olarak eklenir; `l1-party`'den **terfi** eder (contact-merkezli eski düğümün yerini almaz, kernel-seviyesi yeni düğümdür). Altında asıl kod-teslimatı olan en az bir `archetype` düğümü durur. Bağımlılıklar `wbs-field-semantics`'e uyar: `dependsOn` = teknik/yürütme sırası (kritik yol); `related` = yalnız gezinme.

Bu tablo `k-party` düğümünün WBS yerleşimini ve bağımlılıklarını tanımlar.

| Düğüm | Seviye | dependsOn | Küme |
|---|---|---|---|
| `k-party` | module | `k-schema`, `k-tenancy` | kernel |

`dependsOn` gerekçesi: `k-party` şema temeline (`k-schema`) ve kiracı bağlamına (`k-tenancy`) teknik olarak bağlıdır; bunlar hazır olmadan party yazılamaz. `related` ile (karar üretmeden) ArcheType ve Surface düğümlerine bağlanır. `k-capability`, `k-mode` ve `k-policy-pdp` ise kendi `dependsOn`'larında `k-party`'yi listeler — yani party bu üçünden önce gelir.

## 7. Backend gereksinimleri

Aşağıdaki gereksinimler `plan-01` Dalga 1'in party modülü promptunu bağlar; her biri test-önce (kırmızı→yeşil) yaşam döngüsüne tabidir.

- **SQLAlchemy model:** `party`, `party_role`, `party_relation` SQLAlchemy 2.0 (`Mapped[...]`) modelleri; her tablo `tenant_id` kolonu ve `(tenant_id, created_at DESC)` bileşik indeksi taşır (v1 §2.8 migration lint zorunluluğu). `party_role.role` ve `party_role.context` sık sorgu olduğundan indekslenir; polimorfik çözüm performansı için `(party_id, role, valid_from)` indeksi.
- **Alembic migration:** expand-contract deseni; `downgrade()` dolu ve CI'da `alembic downgrade -1` ile test edilir (boş downgrade yasak).
- **Strawberry GraphQL:** `PartyType`, `PartyRoleType`, `PartyRelationType`; resolver'lar `Depends(require_tenant)` + `RequirePermission(...)` ile korunur; N+1'i DataLoader ile engelle (bir party'nin rolleri tek batch'te). Her resolver en az bir `permission_classes` içerir.
- **Audit:** Her `bind_role` / `revoke_role` / party mutasyonu `AuditLogger.log()` ile `actor` + `resource=party_role` yazılır (v1 §2.5).
- **Servis arayüzü:** `effective_roles(party_id, micro_step)` verilen anda geçerli (`valid_from <= micro_step < valid_to`) rolleri döndürür; `resolve_context(party_id, role, context)` bir rolün belirli bağlamda geçerli olup olmadığını çözer.
- **Hata formatı:** `{code, message, trace_id, details}` (v1 §3.1); `get_logger()` kullanılır, `print()` yasak.

## 8. Frontend gereksinimleri

Aşağıdaki gereksinimler Vite + React + TanStack yığınına ve config-driven surface ilkesine uyar.

- **Config-driven gösterim:** Surface aktörü role göre gösterir; ön yüzde `if role == "buyer"` gibi hardcoded dallanma yasak. Aktif rol/bağlam runtime endpoint'inden (`/runtime/...`) okunur; React `party_role` verisini TanStack Query ile çeker.
- **Rol/bağlam seçici:** Aynı party birden çok rol taşıdığında, kullanıcı aktif bağlamı (channel/app) seçebilir; UI seçilen bağlama göre görünür rolleri filtreler.
- **Temporal görünürlük:** Geçmiş roller (valid_to geçmiş) salt-okunur "geçmiş" olarak ayrışır; aktif rollerden görsel olarak ayrı gösterilir.
- **Erişilebilirlik:** WCAG 2.2 AA taban (AAA yüzey-bazlı opt-in); dokunmatik hedef ≥ 44x44px; renk kontrastı ≥ 4.5:1.
- **i18n:** Rol adları ve ilişki türleri `I18nText` üzerinden çok-dilli; ham string gömülmez.

## 9. Multi-tenant / RLS

Her `party`, `party_role` ve `party_relation` satırı `tenant_id` taşır ve fail-closed çalışır (bağlam yoksa istek reddedilir, v1 §2.1). Cross-tenant sorgu girişimi `TenantViolationError` fırlatır ve audit'lenir. İkinci bariyer PostgreSQL RLS: `USING (tenant_id = current_setting('app.current_tenant')::uuid)`. Schema-per-tenant / RLS geçiş eşiği ADR-0026'ya uyar. Sistem-katman party'leri (platform işletmecisi tanımlı) yalnızca işletmeci tarafından oluşturulur; tenant'lar sistem-katman party'lerini genişletemez. Bağlam-çözümünde `context` filtresi, tenant izolasyonunun *içinde* ikinci bir daraltmadır — asla tenant sınırını genişletmez.

## 10. AI guardrail (autonomy seviyesi)

Aşağıdaki iş bölümü değiştirilemezdir: **AI önerir → insan onaylar → motor uygular.**

Bu tablo `k-party` üzerindeki AI autonomy sınırlarını tanımlar.

| İşlem | Autonomy | Kural |
|---|---|---|
| Rol *tanımı* önerme | `draft` | AI org şemasından rol bağı önerir (`RoleBindingDraft`); doğrudan aktif edemez |
| Rol bağlama (`bind_role`) | onay-zorunlu | `approval_ref` (insan) olmadan `ApprovalRequiredError` fırlar |
| Yeni rol *anahtarı* icadı | `none` | Roller `k-authz` PR'ıyla eklenir; AI yeni rol tipi icat edemez |
| Karar-logu / audit değişimi | `none` | Audit append-only; AI değiştiremez |

Mutlak sınırlar: AI main branch'e push edemez; app/module düğümü üretemez/silemez; ruleset override edemez; kanıtsız "bitti" diyemez. PDP kararı `party_role`'e bakar; AI PDP kararını override edemez.

## 11. ArcheType / Surface / PDP bağlama

**ArcheType bağlama:** ArcheType'lar kendi Customer/Supplier/Employee tablosunu **yazmaz**; `party` + `party_role`'e referans verir. Bir ArcheType "bu belgenin alıcısı" derken bir `party_id` + `role=buyer` bağlamına bağlanır.

**Surface bağlama:** Surface aktörü role göre gösterir (config-driven; §8). Consumer-Surface (storefront) anonim/buyer, Admin-Surface employee/agent bağlamında farklı görünür — bu fark `party_role` verisinden türetilir, koda gömülmez.

**PDP bağlama:** `party_role` PDP'nin (`k-policy-pdp`) `subject` girdisidir: PDP "bu aktör (party + geçerli roller) bu kaynakta bu eylemi yapabilir mi?" sorusunu çözerken `effective_roles`'u okur. Capability (`k-capability`) diğer girdidir; ikisi birlikte kararı besler. Actor rolü ReBAC kenarı olarak da PDP'ye akar (`party_relation.kind` → "X, Y'nin temsilcisidir").

## 12. Test stratejisi

Aşağıdaki testler `plan-03 §3.1` DoD'unu ve `plan-01` Dalga 1 kabul kriterlerini karşılar; hepsi test-önce (önce kırmızı) yazılır.

Bu tablo `k-party` için zorunlu test senaryolarını ve türlerini tanımlar.

| # | Senaryo | Test türü |
|---|---|---|
| 1 | Polimorfizm: tek party'ye 3 farklı rol (buyer+seller+employee) atanabiliyor | Birim + entegrasyon |
| 2 | Bağlam-çözümü: rol tenant/channel/app filtresiyle doğru çözülüyor | Entegrasyon |
| 3 | Temporal: belirli bir andaki geçerli roller doğru (geçmiş rol sorgusu) | Birim |
| 4 | Tenant izolasyonu: A tenant B'nin party'sini göremiyor (≥10 negatif case) | Entegrasyon (negatif) |
| 5 | Audit: rol ekleme/çıkarma audit'e düşüyor, append-only korunuyor | Entegrasyon |
| 6 | Migration downgrade: `alembic downgrade -1` veri kaybetmeden çalışıyor | CI |
| 7 | GraphQL koruması: her resolver `permission_classes` taşıyor | Contract |
| 8 | Kişi adı: tek isim kullanan ve Latin-dışı yazı sistemli party displayName ile kaydediliyor; gereksiz regex/karakter engeli yok | Birim |
| 9 | Adres: posta kodu veya eyalet/bölge alanı olmayan ülke adresi geçerli kabul ediliyor | Birim |
| 10 | Telefon: yerel format girişi korunuyor, normalize E.164 karşılığı ayrı tutuluyor; SMS-alabilirlik varsayılmıyor | Birim |

## 13. Acceptance criteria

- Aynı party bağlama göre buyer + seller + employee rollerini aynı anda taşıyabiliyor ve her biri doğru bağlamda çözülüyor.
- `effective_roles(party_id, micro_step)` verilen tarihteki geçerli rolleri (yalnız `valid_from <= micro_step < valid_to`) döndürüyor.
- Cross-tenant erişim en az 10 negatif test case ile reddediliyor ve audit'leniyor.
- AI rol bağlamayı yalnız `draft` olarak öneriyor; `approval_ref` olmadan `bind_role` reddediliyor.
- `party_role` PDP `subject` girdisi olarak okunabiliyor; PDP kararı role bakıyor.
- Alembic migration downgrade otomatik test geçiyor; `check-core-contract` (tenant guard, resolver koruması, audit çağrısı, indeks) yeşil.
- İsim/adres/iletişim modeli §16'ya uygun: tek isimli kişi kaydedilebiliyor; displayName serbest, hukuki isim alanları ayrı; posta kodu evrensel-zorunlu değil; telefon yerel format + ayrı E.164 tutuluyor; OTP teslimat ölçümü ülke+operatör bazında.

## 14. Anti-patterns

- **Rolü koda gömme:** `if user.role == "buyer"` — YASAK; rol `party_role` sorgusudur, veridir.
- **App-özel aktör tablosu:** Bir ArcheType'ın kendi `customers` tablosunu açması — YASAK; `party` referansı zorunlu.
- **Statik tek-rol:** Party'yi tek role kilitlemek (polimorfizmi kırmak) — YASAK.
- **Temporal alan atlama:** `valid_from/valid_to` olmadan rol yazmak (geçmiş sorgusu imkânsızlaşır) — YASAK.
- **Tenant sınırını bağlamla genişletme:** `context` filtresini tenant izolasyonunu gevşetmek için kullanmak — YASAK; context yalnız daraltır.
- **AI'ın doğrudan rol aktifleştirmesi:** `approval_ref`'siz `bind_role` — YASAK; `ApprovalRequiredError`.
- **Sessiz silme:** Party/rol satırını fiziksel silmek — YASAK; `status=archived`/`revoked` ile iz bırak.

## 15. Definition of Done

- §12'deki 10 test senaryosu yeşil (test-önce kanıtı: kırmızı→yeşil geçişi belgeli).
- `core-contract-pack` tenant + audit + indeks uyumu sağlandı; `check-core-contract.mjs` yeşil.
- Alembic migration downgrade CI'da çalışıyor.
- `party_role` PDP tarafından `subject` olarak okunabiliyor (entegrasyon kanıtı).
- ADR-A1 "Kilitli" statüsünde (insan onayı); `k-party` düğümü ve altındaki `archetype` düğümü WBS'te doğru `dependsOn` ile mevcut.
- AI-guardrail testi: `draft`-dışı doğrudan rol yazımı reddediliyor.
- Doküman `icerik-kalite-sozlesmesi` biçim kurallarına uyar (aktör-açık, emoji yok, her başlıkta nedir/yapar/yapmaz, her tablodan önce açıklama).

## 16. Kişi adları, adresler, telefon ve iletişim kimlikleri

Bu bölüm, party'nin insan-veri yüzeyinin (kişi adı, adres, telefon, e-posta) modellenme kurallarını normatif sabitler. §3 non-goal'leri aynen korunur: bu bölüm contact/CRM yönetimi getirmez, kimlik doğrulama tanımlamaz; somut çok-alanlı yapıların (PersonName/Address/ContactPoint) üretimi Fragment kademesinin (`fragments-directive`) işidir — burada sabitlenen, o yapıların ve `party.display_name` gibi alanların uyacağı sözleşmedir. Aktör-açık ifade: *ajan* alan modelini önerir (draft); *insan* onaylar; *motor* onaylı modeli uygular.

### 16.1 Kişi adları

`firstName + lastName` evrensel model DEĞİLDİR; bu ikiliyi zorunlu kılan şema, tek isim kullanan veya farklı isim düzeni taşıyan kişileri yanlış modeller. İsim modeli aşağıdakilerin tamamını dikkate alır:

- Tek isim kullanan kişiler (soyadı alanı zorunlu tutulamaz).
- Birden fazla soyadı taşıyan kişiler.
- Patronimik ve matronimik parçalar (baba/anne adına dayalı, soyadı olmayan bileşenler).
- Soyadının önce yazıldığı kültürler.
- Resmî isim ile tercih edilen ismin ayrışması.
- Aynı kişinin birden fazla yazı sistemindeki isimleri.
- İsim parçalarının sırasının bağlama göre değişmesi (resmî belge, hitap, sıralama bağlamları).
- Hitap ve unvanlar (ismin parçası değil, sunum bağlamıdır).
- İsim değişiklikleri (geçmişe dönük iz korunur; §14 "sessiz silme" yasağıyla uyumlu).
- İsimlerin benzersiz kimlik olarak KULLANILAMAMASI (kimlik `party.id`'dir; isim tekil anahtar, dedup anahtarı veya login anahtarı yapılamaz).

CLDR Person Names, locale'e göre GÖSTERİM yapıları sağlar; kimlik doğrulamayı, resmî ismi, tercih edilen ismi veya DB şemasını belirlemez (kaynak: https://www.unicode.org/reports/tr35/tr35-personNames.html). EN GÜVENLİ YAKLAŞIM (normatif): kullanıcı tam görüntüleme adını (displayName — §5 `party.display_name` alanının karşılığı) serbestçe girer; hukuki zorunluluk varsa AYRICA yapılandırılmış hukuki isim alanları tutulur; orijinal yazı sistemi korunur; transliteration bilgisi orijinalin üzerine yazılmadan ayrı tutulur; isim alanlarında gereksiz regex ve karakter yasağı KULLANILMAZ.

### 16.2 Adresler

Evrensel bir `street, city, state, ZIP` formu YOKTUR; adres modeli ülkeye göre şu eksenlerin tamamında değişir:

- Alanların varlığı ülkeye göre değişir.
- Alan sırası ülkeye göre değişir.
- Posta kodu olmayabilir (posta kodu evrensel-zorunlu alan yapılamaz).
- Eyalet/bölge alanı zorunlu olmayabilir.
- Bina ve daire bilgisi farklı hiyerarşide olabilir.
- Latin dışı yazı sistemi gerekebilir.
- Yerel adres ile uluslararası posta adresi farklı olabilir (iki gösterim ayrı temsil ister).

UPU S42, ülkeye özgü adres bileşenleri ve gösterim şablonları gerekliliğini ortaya koyar; teslim edilebilirliği, KYC'yi veya kullanıcının gerçekten o adreste bulunduğunu DOĞRULAMAZ (kaynak: https://www.upu.int/en/postal-solutions/programmes-services/addressing-solutions). Adres doğrulama ve teslim edilebilirlik ayrı operasyonel yeteneklerdir; şablon standardına uymak bunları ikame etmez.

### 16.3 Telefon ve e-posta

İletişim kimlikleri aşağıdaki kuralların tamamıyla modellenir:

- Telefon girişinde kullanıcının yerel formatı kabul edilir; normalize E.164 karşılığı AYRI tutulur (girilen biçim kaybedilmez).
- Her telefonun SMS alabildiği VARSAYILMAZ (sabit hat/sanal numara olabilir; SMS-yeteneği ayrı bir veridir).
- OTP teslimatı ülke ve operatör bazında ölçülür; OTP teslimat oranı kanal seçim kararına veri sağlar (operasyon sahipliği §16.4).
- E-postada uluslararası karakter (EAI) teknik olarak mümkündür; e-posta doğrulama kuralı ASCII varsaymaz.
- Uluslararası alan adları (IDN) ve güvenli gösterimi ayrıca ele alınır (güvenlik sahipliği §16.4).

ITU E.164 numaralandırma yapısını, IETF EAI uluslararası e-postayı, IDNA uluslararası alan adını tanımlar; hiçbiri doğrulama/teslimat/uyumluluk POLİTİKASINI tanımlamaz (kaynak: https://www.itu.int/rec/t-rec-e.164/en) — politika bu sözleşmede ve §16.4'te sahiplik verilen standartlarda veri olarak sabitlenir.

### 16.4 Sahiplik ve çapraz referans

Identifier güvenliği (username/confusable karakter politikası) bu sözleşmenin değil `standards/03-authn-authz-iam-standard.md`'nin kapsamındadır; OTP/hesap kurtarma operasyonu da orada tanımlanır. Bu bölüm yalnız party'nin isim/adres/iletişim veri modelini sabitler; kimlik doğrulama, kurtarma ve identifier-güvenliği kararları için ilgili standarda çapraz referans verilir (§3 non-goal ayrımıyla tutarlı).

## 17. Requirement-ID tablosu

Aşağıdaki tablo, bu sözleşmenin izlenebilir gereksinimlerini kimlik + katman + öncelik (P0–P3) + test türü + kabul + sahip ile listeler. Öncelik: P0 = bloklayıcı invariant, P1 = çekirdek, P2 = önemli, P3 = iyileştirme.

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| AP-01 | `party` çekirdek kimliği (person/organization) tenant-kapsamlı | Backend/Data | P0 | Integration | Party tenant izolasyonlu yazılır/okunur | kernel-team |
| AP-02 | `party_role` bağlam-kapsamlı + temporal (valid_from/to) | Backend/Data | P0 | Unit+Integration | Rol bağlamla ve zamanla çözülür | kernel-team |
| AP-03 | Polimorfizm: tek party çoklu eşzamanlı rol | Backend | P0 | Integration | 3 rol tek party'de doğru | kernel-team |
| AP-04 | `party_relation` ilişki grafiği (employs/owns/represents) | Backend/Data | P1 | Unit | İlişki kenarı yazılır/sorgulanır | kernel-team |
| AP-05 | `effective_roles(party_id, micro_step)` temporal çözüm | Backend | P0 | Unit | Verilen anda geçerli roller doğru | kernel-team |
| AP-06 | Bağlam-çözümü (tenant/channel/app filtresi) | Backend | P1 | Integration | Rol yalnız geçerli bağlamda çözülür | kernel-team |
| AP-07 | Tenant izolasyonu + RLS ikinci bariyer | Security | P0 | Integration(neg) | ≥10 cross-tenant negatif case reddedilir | security-team |
| AP-08 | Rol mutasyonu audit (append-only) | Security | P0 | Integration | bind/revoke audit'e düşer | security-team |
| AP-09 | Alembic expand-contract + dolu downgrade | Backend/DevOps | P1 | CI | `alembic downgrade -1` veri kaybetmez | kernel-team |
| AP-10 | Strawberry resolver `permission_classes` zorunlu | Backend/API | P1 | Contract | Korumasız resolver yok | kernel-team |
| AP-11 | AI rol bağlama `draft` + `approval_ref` zorunlu | AI-Governance | P0 | Integration | approval_ref'siz bind reddedilir | governance |
| AP-12 | AI yeni rol *anahtarı* icat edemez (autonomy none) | AI-Governance | P0 | Unit | AI rol tipi ekleyemez | governance |
| AP-13 | PDP `subject` girdisi: rol PDP'ye akar | Backend/Integration | P0 | Integration | PDP effective_roles okur | kernel-team |
| AP-14 | Config-driven surface (hardcoded rol dallanması yok) | Frontend | P1 | E2E | UI rol verisinden türetilir | ui-team |
| AP-15 | WCAG 2.2 AA + i18n rol/ilişki adları | Frontend/A11y | P2 | A11y(axe) | axe critical=0; roller çok-dilli | ui-team |
| AP-16 | `k-party` WBS düğümü doğru dependsOn (k-schema, k-tenancy) | Governance/WBS | P1 | CI(data-quality) | DAG geçerli, dangling yok | pmo |
| AP-17 | Kişi adı modeli: displayName serbest giriş; `firstName+lastName` dayatması yok (tek isim, çoklu soyadı, patronimik kabul) | Backend/Data | P1 | Unit | Tek isimli party kaydedilir; soyadı zorunlu değil | kernel-team |
| AP-18 | İsim: hukuki isim ayrı yapılandırılmış alanlarda; yazı sistemi korunur; transliteration ayrı; gereksiz regex/karakter yasağı yok | Backend/Data | P1 | Unit | Latin-dışı isim bozulmadan saklanır; transliteration ayrı alanda | kernel-team |
| AP-19 | Adres: ülkeye özgü bileşen/şablon (UPU S42 referans); posta kodu ve eyalet/bölge evrensel-zorunlu tutulamaz | Backend/Data | P1 | Contract | Posta kodsuz adres geçerli; şablon ülkeye göre çözülür | kernel-team |
| AP-20 | Telefon: yerel format girişi + AYRI normalize E.164; SMS-alabilirlik varsayılmaz | Backend/Data | P1 | Unit | Giriş biçimi korunur; E.164 ayrı; SMS-yeteneği ayrı veri | kernel-team |
| AP-21 | OTP teslimat ölçümü ülke+operatör bazında; identifier güvenliği ve hesap kurtarma `standards/03-authn-authz-iam-standard.md`'ye çapraz referanslı | Security/Integration | P2 | Integration | Teslimat metriği kaydedilir; sahiplik sınırı net | security-team |
