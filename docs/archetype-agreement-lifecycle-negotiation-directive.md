# archetype-agreement Yönergesi — Sözleşme (Agreement) ArcheType ve Müzakere Yaşam Döngüsü

**Tarih:** 2026-07-01
**Durum:** Taslak sözleşme (kilitlenmeyi bekliyor — bkz. §15 DoD, ADR-AGR1)
**WBS düğümü:** `archetype-agreement`
**Kaynak/bağlam:** `core-contract-pack.md §3.0.1` (ortak AI-güvenlik invariantı), `atom-archetype-bagi-clm-ornegi-2026-07-01.md §2` (CLM agreement-graph alan-alan atom eşlemesi — **bu yönergenin ana kaynağıdır**; §3 alt-varlıklar, §8 bağımlılık grafiği, §9 test-önce çıkarımı), `atomik-netlestirme-2026-07-01.md` (Atom/Fragment/ArcheType kademe modeli; `Money`/`Range<date>`/`Term`/`Recurrence`/`Duration`/`Percentage`/`EnumType`/`PartyRef`/`ClauseRef`/`AssetRef`/`ExternalId`/`EntityRef` atomları; `Address`/`PersonName`/`ContactPoint` Fragment'leri), `k-obligation-commitment-directive.md` (yükümlülük yaşam döngüsü tüketicisi; agreement onu besler), `k-signature-trust-directive.md` (imza orkestrasyonu tüketicisi; agreement imzaya sokar), `k-evidence-seal-directive.md` (müzakere/imza kanıtı kasası), `pdp-policy-contract.md` (playbook/policy-as-data; müzakere fallback ve stance kontrolü), `computation-derivation-contract.md` (risk skoru/ödeme türetimi), `k-provider-adapter-directive.md` (CRM/ERP/HR entegrasyonu — i14y), `actor-party-contract.md` (taraf/imzacı `PartyRef` kütüğü), `k-storage-dam-directive.md` (ek/attachment binary referansı), `wbs-field-semantics.md` (dependsOn anlamı).
**İlişki:** Bu doküman CLM'in **merkezi archetype'ıdır**: sözleşmeyi (agreement) bir "PDF" olmaktan çıkarıp **işletilebilir bir veri grafiğine (agreement graph)** çeviren ve diğer kernel primitiflerini *kompoze eden* modeldir. `k-obligation`, `k-signature`, `k-evidence`, `archetype-document-composition`, `k-party`, PDP ve `k-computation` birer *kernel/primitif* iken `archetype-agreement` bunları bir araya getiren *ürün-archetype'ıdır*: "sözleşme metni/grafiği nedir, tarafları/maddeleri/değeri/tarihleri nedir, hangi müzakere durumundadır ve yaşam döngüsünün neresindedir?" sorusunu yanıtlar. Bu doküman **kod yazmaz**; `archetype-agreement`'ın (Contract ArcheType) alan yapısını, ilişki grafiğini ve müzakere yaşam-döngüsü sözleşmesini normatif tanımlar. Makine-okunur karşılığı (ArcheType tanımı, SQLAlchemy 2.0/SQLModel modeli, Alembic migration, Strawberry tipi, PEP guard) ADR-AGR1 kilitlendiğinde ajan-draft + insan-onay ile `platform` reposunda üretilir; alanlar `atom-archetype-bagi §2` tablosundan türetilir ve atom katmanı (`atomic-types-directive`) kilitlenmeden bu archetype "hazır" sayılmaz (bkz. §9).

**Stack:** FastAPI + SQLAlchemy 2.0/SQLModel + Alembic + PostgreSQL. Frontend: Vite + React + TanStack. Biçim: SCSS + token; ikonlar Phosphor. **YASAK:** Next.js, Supabase, Prisma, Redux, Flowbite, antd, MUI, Chakra, Mantine, react-markdown.

---

## 1. Amaç

Bu sözleşme, platformdaki her sözleşmenin (agreement) tek bir ArcheType soyutlamasında — bir **veri grafiği** olarak — temsil edilmesini; sözleşmenin metin/PDF halinde gömülü kalan bilgisinin (taraflar, maddeler, değer, tarihler, yükümlülükler, imzalar, kanıt, bağlı kayıtlar) **sorgulanabilir, ilişkili ve işletilebilir** alanlara çıkarılmasını; ve sözleşmenin taslaktan arşive uzanan yaşam döngüsünün — özellikle **müzakere (negotiation)** aşamasının — birinci-sınıf bir durum makinesi olarak yürütülmesini sabitler. Hedef: 50 uygulamanın hiçbirinin kendi "sözleşme tablosunu", kendi ad-hoc redline/versiyon-diff mantığını veya kendi imza/yükümlülük bağını yeniden yazmaması; sözleşme grafiği ve müzakere durumu tek bir ürün-archetype'ında yaşaması ve diğer kernel primitiflerini kompoze etmesi. Ürünün merkezi vaadi buradadır: sözleşme bir belge değil, **canlı bir grafiktir** — tarafı `k-party`'ye, maddesi clause-library'ye, yükümlülüğü `k-obligation`'a, imzası `k-signature`'a, kanıtı `k-evidence`'a, değeri/risk skoru `k-computation`'a, CRM/ERP/HR bağı i14y'ye (`k-provider-adapter`) tipli referanslarla bağlanır. Aktör-açık ifade: *ajan* müzakere sırasında redline (madde değişikliği), fallback madde ve negotiation stance (tutum) *önerir* (draft); *insan* (sözleşme/finans/hukuk sahibi) karşı-taraf şartını kabul/ret kararını verir ve müzakereyi ilerletir; *motor* onaylı grafiği, durum geçişini ve türetimleri deterministik ve denetlenebilir uygular. **AI karşı-taraf şartını tek başına kabul edemez, bir maddeyi tek başına kesinleştiremez, sözleşmeyi imzaya/aktife gönderemez** — yalnız draft önerir; müzakere kararı ve durum ilerletme insan onayıdır ve PDP playbook'una göre kontrol edilir.

## 2. Kapsam

Bu sözleşme şunları kapsar: (1) `agreement` çekirdek sözleşme kaydı (agreement graph başlık alanları: title, contract_type, status, parties, effective_range, term, notice_period, renewal_rule, total_value, payment_term, governing_law, risk_score + referans koleksiyonları), (2) grafiğin alt-varlıkları (`agreement_party` taraf, `clause` madde, `payment` ödeme; taraf içinde `Address`/`PersonName`/`ContactPoint` Fragment'leri ve `TaxId`/`NationalId` PII-sınıflı kimlik atomları), (3) sözleşme yaşam döngüsü durum makinesi (`status`: draft→review→negotiation→approval→signature→active→(renewal|termination)→archived), (4) **müzakere (negotiation) alt-yaşam-döngüsü ve workspace'i**: redline (madde-düzeyi değişiklik önerisi), karşı-taraf yorumu (counterparty comment), version diff (sürüm karşılaştırması), fallback madde (yedek/geri-çekilme maddesi), negotiation stance (madde bazında müzakere tutumu ve onay eşiği), clause battlecard (madde savunma kartı), (5) grafik ilişkileri: `parties→k-party`, `clauses→clause-library`, `obligations→k-obligation`, `signatures→k-signature`, `evidence→k-evidence`, `attachments→k-storage`, `linked_crm/erp/hr→i14y`, `document→archetype-document-composition`, (6) türetilen alanlar: `risk_score`/`total_value`/`payment_term` `k-computation`'dan referanslanır, (7) AI ile müzakere yardımı (redline/fallback/stance önerisi → draft → insan kararı → PDP playbook kontrolü), (8) `archetype-agreement` düğümünün WBS yerleşimi, çok-kiracılı izolasyon ve append-only audit zorunlulukları. Backend, frontend, test ve AI-guardrail gereksinimleri ilgili bölümlerde tarif edilir.

## 3. Non-goals

Bu sözleşme şunları **kapsamaz**: (1) **İmza orkestrasyonunu** *yürütmez* — imzacı/sıra/eIDAS-seviye/format/kanıt işi `k-signature`'ındır; `archetype-agreement` yalnız sözleşmeyi imzaya *sokar* (bir `signature_request` başlatır) ve sonucu `signatures` referansıyla tutar; imza motorunu açmaz (bkz. `k-signature`). (2) **Yükümlülük yaşam döngüsünü** *yürütmez* — taahhüdün vadesi, hatırlatması, eskalasyonu, yenileme-ihbar takibi ve met/breached/waive kapanışı `k-obligation`'ındır; `archetype-agreement` bir sözleşme aktifleştiğinde ilgili taahhütleri `k-obligation`'a *tanımlar/besler* (`source_ref`/`clause_ref` bağı), taahhüt motorunu açmaz. (3) **Doküman render/derlemeyi** *yapmaz* — imzalanacak/paylaşılacak PDF/DOCX'in şablondan üretilmesi, clause birleştirme ve mizanpaj `archetype-document-composition`'ındır; `archetype-agreement` bir `document` (`AssetRef`) referansı tutar, belgeyi *üretmez*. (4) **Kanıt kasası** *değildir* — müzakere/imza/aktifleşme kanıtı `k-evidence`'a append-only *yazılır*; `archetype-agreement` kendi kanıt deposunu açmaz. (5) **Para/oran/risk hesabını** *yapmaz* — `total_value`, `payment_term` tutar/oranı ve `risk_score` `k-computation`'ın türettiği değerlerdir; `archetype-agreement` bunları *referanslar/tutar*, aritmetiği yapmaz. (6) **Yetki/erişim kararı** *vermez* — "bu aktör bu sözleşmeyi görebilir/düzenleyebilir/onaylayabilir mi?" ve "bu redline/fallback playbook'a uygun mu?" kararları PDP'nindir (`k-policy-pdp` + playbook policy-as-data); `archetype-agreement` grafiği ve müzakere durumunu uygular ama *yetkiyi/playbook kararını* PDP'de bırakır. (7) **Taraf kütüğünü** *sahiplenmez* — bir taraf `k-party` ArcheType'ının kaydıdır; `archetype-agreement` ona `PartyRef` ile bağlanır (rol/bağlam yerelde), kişi/kurum ana verisini kopyalamaz (bkz. `k-mdm`/`k-party`). (8) Serbest kodla durum/madde değişimi — hiçbir app doğrudan `UPDATE agreement SET status=...` veya karşı-taraf redline'ını `UPDATE clause` ile *kesinleştiremez*; durum geçişi ve madde kabulü yalnız bu archetype'ın sözleşmeli servisinden, insan onayından ve PDP playbook kontrolünden geçer.

## 4. Tanım (nedir / ne yapar / ne yapmaz)

**Nedir:** `archetype-agreement`, bir sözleşmeyi (agreement) tek bir ArcheType olarak — tarafları, maddeleri, değeri, tarihleri, yükümlülükleri, imzaları, kanıtı ve bağlı dış kayıtları birbirine tipli referanslarla bağlayan **işletilebilir bir veri grafiği (agreement graph)** olarak — temsil eden; sözleşmenin taslaktan arşive uzanan yaşam döngüsünü, özellikle **müzakere (negotiation)** aşamasını, birinci-sınıf bir durum makinesi olarak yürüten ve diğer kernel primitiflerini *kompoze eden* CLM merkez-archetype'ıdır. Sözleşme metni bir belgede değil, sorgulanabilir alanlarda ve ilişkilerde yaşar; belge (render) yalnız bir çıktıdır (`document` → `archetype-document-composition`).

**Ne yapar:** Bir sözleşme/finans/hukuk sahibi tanımlar (veya AI çıkarımını/önerisini onaylar), motor uygular. Bir sözleşmeyi tanımlar (`agreement`: `title`, `contract_type`, `status`, `parties` `PartyRef[]`, `effective_range` `Range<date>`, `term`, `notice_period`, `renewal_rule` `Recurrence`, `total_value` `Money`, `payment_term`, `governing_law`, `risk_score`); grafiğin alt-varlıklarını (taraf/madde/ödeme) modeller; yaşam döngüsünü sürer (`draft→review→negotiation→approval→signature→active→(renewal|termination)→archived`); **müzakere workspace'ini yürütür**: redline'ları (madde-düzeyi değişiklik önerisi) sürüm olarak tutar, karşı-taraf yorumlarını iliştirir, iki sürüm arasında version diff üretir, her madde için fallback maddeyi (yedek dil) ve negotiation stance'i (kabul tutumu + onay eşiği: finans-onay/hukuk-onay) taşır, clause battlecard ile maddenin savunma/pazarlık gerekçesini sunar; sözleşmeyi imzaya sokar (`k-signature`'a `signature_request` başlatır, sonucu `signatures` ile bağlar); aktifleşince yükümlülükleri `k-obligation`'a besler (`source_ref`/`clause_ref`); kanıtı `k-evidence`'a yazar; `risk_score`/değer türetimini `k-computation`'dan referanslar; CRM/ERP/HR kayıtlarını i14y (`ExternalId`/`EntityRef`) ile bağlar; her durum geçişini, her madde kabulünü/redline'ını ve her müzakere kararını append-only audit'e yazar.

**Ne yapmaz:** İmza orkestrasyonunu *yürütmez* (`k-signature`; yalnız imzaya sokar, sonucu referanslar). Yükümlülük vadesini/eskalasyonunu/kapanışını *yürütmez* (`k-obligation`; yalnız besler). Doküman/PDF *üretmez/derlemez* (`archetype-document-composition`; yalnız `document` referansı tutar). Kanıtı kendi deposunda *tutmaz* (`k-evidence`'a yazar). Para/oran/risk *hesaplamaz* (`k-computation`; türetilmiş değeri referanslar). Yetki/erişim kararı ve playbook uygunluk kararı *vermez* — bunları PDP yapar. Taraf ana-verisini *sahiplenmez/kopyalamaz* (`k-party`/`k-mdm`; `PartyRef` ile bağlanır). **Bir karşı-taraf şartını (redline) AI eliyle kabul etmez, bir maddeyi tek başına kesinleştirmez, sözleşmeyi onaysız imzaya/aktife göndermez** — müzakere kararı ve durum ilerletme insan onayıdır ve PDP playbook'una göre kontrol edilir (`ApprovalRequiredError`/`PlaybookViolationError`). Sözleşmeyi *sessizce* değiştirmez veya kapatmaz — her durum geçişi, her madde değişikliği/kabulü ve her müzakere kararı audit'lenir (kim-ne-zaman-hangi-gerekçe izli).

## 5. Sözleşme şekli (alan yapısı)

Aşağıdaki dört tablo, `archetype-agreement` primitifinin veri şeklini yalnızca *alan adı + tip + amaç* olarak tarif eder; dolu örnek/mock değer verilmez. Tipler PostgreSQL/SQLAlchemy 2.0 karşılıklarıdır ve `atom-archetype-bagi-clm-ornegi §2` tablosuyla **birebir uyumludur**: her semantik alan bir **atoma** (Katman A/B/C) veya bir **Fragment**'e oturur — `I18nText` (title, çok-dilli), `EnumType` (contract_type/status/governing_law; alias+i18n+lifecycle), `PartyRef[]` (parties, Katman C referans-değer), `Range<date>` (effective_range, parametreli aralık), `Term` (term, süre-değer), `Duration` (notice_period), `Recurrence` (renewal_rule, RRULE), `Money` (total_value; değer+kur+precision), `Money`+`Duration`+`Percentage` (payment_term; vade+tutar+gecikme oranı), `Percentage` (risk_score; `k-computation`'dan), `ClauseRef[]` (clauses), `AssetRef[]` (attachments), `ExternalId`/`EntityRef` (linked_crm/erp/hr). İmzalanacak/paylaşılacak belge binary'si veritabanında değil `k-storage`'da tutulur; sözleşme yalnız `document`/`attachments` referansını taşır. Kanıt bu tabloda değil `k-evidence`'ta, imza akışı `k-signature`'da, yükümlülük `k-obligation`'da yaşar; agreement bunlara referans verir, kopyalamaz.

Bu tablo `agreement` çekirdek sözleşme kaydının (agreement graph) alanlarını tanımlar. Aktör: sözleşme/finans/hukuk sahibi tanımlar (veya AI önerisini onaylar); motor okur, yaşam döngüsünü sürer, türetimi/besleme referanslarını yönetir.

| Alan | Tip (atom/fragment) | Amaç |
|---|---|---|
| `id` | UUID (PK) | Sözleşmenin benzersiz kimliği; alt-varlıklar ve `k-obligation`/`k-signature` bunu referanslar |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu; v1 §2.1 fail-closed zorunluluğu |
| `title` | `I18nText` (NOT NULL) | Çok-dilli sözleşme başlığı; fallback; şema değişmeden dil ekleme; ham string değil |
| `contract_type` | `EnumType`(nda, sale, lease, supply, employment, ...) | Sözleşme türü; teknik-kimlik sabit + dile-özel alias etiket; tür-bazlı playbook/şablon seçer |
| `status` | `EnumType`(draft, review, negotiation, approval, signature, active, renewal, termination, archived) | Sözleşme yaşam döngüsü durumu; müzakere/onay/imza/aktif/yenileme/fesih/arşiv geçişini yönetir |
| `parties` | `PartyRef[]` (Katman C) | Sözleşme tarafları; `k-party`'ye tipli referans + rol bağlamı (müşteri/tedarikçi); ana-veri kopyalanmaz |
| `effective_range` | `Range<date>` (nullable) | Yürürlük penceresi (başlangıç-bitiş); çakışma/kapsama sorgusu; açık/kapalı uç; yenileme/fesih hesabı tabanı |
| `term` | `Term` (nullable) | Sözleşme süresi (ör. "2 yıl münhasırlık"); yenileme hesabının süre tabanı |
| `notice_period` | `Duration` (nullable) | İhbar süresi (ör. "60 gün"); iş-günü farkındalığı; fesih/yenileme ihbarının geri-sayım tabanı |
| `renewal_rule` | `Recurrence` (RRULE, nullable) | Yenileme kuralı (ör. yıllık auto-renew); sonraki yenileme tarihi üretimi; `k-obligation` besler |
| `total_value` | `Money` (nullable) | Sözleşme toplam değeri (değer+kur+precision+rounding); float yasağı; empty≠zero; `k-computation` türetir |
| `payment_term` | `Money` + `Duration` + `Percentage` (nullable) | Ödeme koşulu: vade (net-60 `Duration`) + tutar (`Money`) + gecikme cezası oranı (`Percentage`) |
| `governing_law` | `EnumType`/jurisdiction (nullable) | Uygulanacak hukuk + yargı yetkisi (jurisdiction ekseni); çok-yargı kuralı; imza `jurisdiction` ile hizalanır |
| `risk_score` | `Percentage` (nullable) | Politika-bazlı risk skoru (0-100 taban, yuvarlama); `k-computation` türetir, burada referanslanır |
| `document` | `AssetRef` (nullable) | Render edilmiş sözleşme belgesi; `archetype-document-composition` üretir, `k-storage`'da; burada referans |
| `origin` | `EnumType`(human, ai_assisted) | Sözleşmenin/son değişikliğin kaynağı; `ai_assisted` müzakere önerileri `approval_ref` gerektirir |
| `approval_ref` | UUID (nullable) | Durum ilerletme / madde kabulü / imzaya-gönderme için insan onayı (kim+zaman+gerekçe) |
| `created_at` | TIMESTAMPTZ (NOT NULL) | Audit/oluşturulma zamanı |
| `updated_at` | TIMESTAMPTZ (NOT NULL) | Son değişiklik zamanı |

Bu tablo grafiğin **referans koleksiyonlarını** (m2m/1-n bağlar) tanımlar; agreement bunları *tutmaz*, ilgili kernel primitifine tipli referansla *bağlanır*. Kaynak: `atom-archetype-bagi §2` (obligations/signatures/evidence/attachments/linked satırları) + §3 (alt-varlık grafiği).

| Bağ | Tip | Hedef / Amaç |
|---|---|---|
| `clauses` | `ClauseRef[]` (Katman C) | Sözleşme maddeleri; clause-library maddesine referans (standart/alternatif); sürüm; kopyalama yerine referans |
| `obligations` | `EntityRef[]` → `k-obligation` | Sözleşmeden doğan yükümlülükler; agreement aktifleşince beslenir (`source_ref`/`clause_ref`) |
| `signatures` | `EntityRef[]` → `k-signature` | İmza akışları; agreement imzaya sokulunca `signature_request` bağlanır (m2m) |
| `evidence` | `EntityRef[]` → `k-evidence` | Müzakere/imza/aktifleşme kanıtı; append-only kasaya bağ |
| `attachments` | `AssetRef[]` → `k-storage` | Ekler (destekleyici belge); binary `k-storage`'da, burada referans+checksum |
| `linked_crm_deal` | `ExternalId`/`EntityRef` (nullable) | CRM fırsatına idempotent kimlik eşleme (i14y; `k-provider-adapter`) |
| `linked_erp_vendor` | `ExternalId` (nullable) | ERP tedarikçi kimliği (i14y) |
| `linked_hr_record` | `ExternalId`/`EntityRef` (nullable) | HR kaydı bağı (ör. istihdam sözleşmesi çalışan kimliği; i14y) |

Bu tablo grafiğin alt-varlıklarından **`agreement_party` (taraf)** ve **`clause` (madde)** kayıtlarını tanımlar; taraf, `k-party` referansı üstüne sözleşme-yerel rol/bağlam taşır ve çok-alanlı değerlerini **Fragment**'lerle modeller. Kaynak: `atom-archetype-bagi §3` (Party/Clause alt-varlıkları).

| Alt-varlık / Alan | Tip (atom/fragment) | Amaç |
|---|---|---|
| `agreement_party.party_ref` | `PartyRef` → `k-party` | Taraf ana kaydı; kişi/kurum ana-verisi `k-party`'de, burada referans |
| `agreement_party.role` | `EnumType`(customer, supplier, counterparty, guarantor, ...) | Sözleşme-yerel taraf rolü |
| `agreement_party.name` | `PersonName` (Fragment) | Tüzel/gerçek kişi ad-yapısı (görüntü/sıra için); ana-veri `k-party`'de |
| `agreement_party.address` | `Address` (Fragment) | Tebligat/fatura adresi; alt-alanlar bağımsız sorgulanır (U1: Address = Fragment) |
| `agreement_party.contact` | `ContactPoint` (Fragment) | İletişim kanalı (e-posta/telefon); her kanal kendi atom tipini taşır |
| `agreement_party.tax_id` | `TaxId` (atom, PII) | Vergi kimliği; jurisdiction+checksum parametresi; alan-düzeyi maskeleme |
| `agreement_party.national_id` | `NationalId` (atom, PII-yüksek) | Ulusal kimlik; KVKK/GDPR field-level şifreleme; maskeli sunum |
| `clause.clause_ref` | `ClauseRef` → clause-library | Maddenin kütüphane referansı; standart/alternatif; sürüm |
| `clause.title` | `I18nText` | Çok-dilli madde başlığı |
| `clause.body` | `I18nText` | Madde metni (müzakere edilen dil); redline burada sürümlenir |
| `clause.stance` | `EnumType`(standard, alternative, prohibited) + `NegotiationStance` | Madde tutumu (kütüphane sınıfı) + müzakere stance (§6); playbook (PDP) kontrol eder |
| `clause.fallback_ref` | `ClauseRef` (nullable) | Fallback madde (geri-çekilme/yedek dil); müzakere tıkanınca sunulan alternatif |
| `payment.amount` | `Money` | Ödeme tutarı (değer+kur+precision); empty≠zero; kur karışımı reddi |
| `payment.due_range` | `Range<date>` / `Duration` | Vade penceresi / net-N vade; ödeme yükümlülüğü tabanı (`k-obligation` besler) |
| `payment.penalty_rate` | `Percentage` (nullable) | Gecikme cezası oranı; tetik koşulu burada, tutar hesabı `k-computation` |

Bu tablo **müzakere workspace** kayıtlarını (`negotiation_round` ve `redline`) tanımlar; müzakere durumu birinci-sınıf veri olarak tutulur (§6). Aktör: karşı-taraf yorum bırakır, iç ekip redline/stance önerir (AI draft dahil), sözleşme sahibi kabul/ret kararını onaylar; motor sürüm/diff üretir, PDP playbook'a göre kontrol eder.

| Alan | Tip (atom/fragment) | Amaç |
|---|---|---|
| `negotiation_round.id` | UUID (PK) | Müzakere turunun benzersiz kimliği |
| `negotiation_round.tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu |
| `negotiation_round.agreement_id` | UUID (FK → agreement.id) | Bağlı olduğu sözleşme |
| `negotiation_round.version_no` | integer (NOT NULL) | Sürüm numarası; iki sürüm arası version diff tabanı |
| `negotiation_round.direction` | `EnumType`(internal, counterparty) | Turu üreten taraf (iç ekip / karşı taraf) |
| `negotiation_round.status` | `EnumType`(open, countered, accepted, rejected, superseded) | Turun durumu; müzakere alt-yaşam-döngüsü |
| `negotiation_round.summary` | `I18nText` (nullable) | Turun özeti (AI önerebilir → draft; insan onaylar) |
| `redline.id` | UUID (PK) | Redline (madde-düzeyi değişiklik önerisi) kimliği |
| `redline.round_id` | UUID (FK → negotiation_round.id) | Bağlı olduğu müzakere turu |
| `redline.clause_id` | UUID (FK → clause.id) | Değişiklik önerilen madde |
| `redline.proposed_body` | `I18nText` | Önerilen madde dili (mevcut `clause.body`'ye karşı diff) |
| `redline.rationale` | `I18nText` (nullable) | Değişiklik gerekçesi / clause battlecard notu |
| `redline.origin` | `EnumType`(human, ai_suggested, counterparty) | Öneriyi üreten; `ai_suggested`/`counterparty` **kabul için insan onayı** zorunlu |
| `redline.stance` | `NegotiationStance`(accept/finance_approval/legal_approval/reject) | Bu redline'a müzakere tutumu; kabul eşiği (finans/hukuk onayı) |
| `redline.decision` | `EnumType`(pending, accepted, rejected, escalated) | Karar durumu; `accepted` yalnız `approval_ref` + PDP playbook kontrolüyle |
| `redline.approval_ref` | UUID (nullable) | Kabul/ret onayı (insan; kim+zaman+gerekçe); AI dolduramaz |
| `redline.created_at` | TIMESTAMPTZ (NOT NULL) | Audit |

## 6. Müzakere yaşam döngüsü ve workspace

`archetype-agreement`'ın ayırt edici çekirdeği, sözleşmeyi bir belge yerine **müzakere edilen bir grafik** olarak yürütmesidir. Bu bölüm müzakere alt-yaşam-döngüsünü ve workspace bileşenlerini normatif tanımlar; hepsi §5'teki `negotiation_round`/`redline` veri modeline oturur ve §10 AI guardrail'e tabidir. Aktör-açık: *karşı taraf* redline/yorum üretir; *iç ekip (ve AI draft)* redline/fallback/stance *önerir*; *sözleşme/finans/hukuk sahibi* kabul/ret kararını *onaylar*; *motor* sürüm/diff üretir ve PDP playbook'una göre kontrol eder.

Sözleşme yaşam döngüsü `status` ile yürür: `draft` (iç hazırlık) → `review` (iç gözden geçirme) → **`negotiation`** (karşı-taraf ile tur-tur redline/yorum) → `approval` (iç onay eşikleri: finans/hukuk) → `signature` (`k-signature`'a imzaya sokma) → `active` (yürürlük; `k-obligation` besleme) → (`renewal` yenileme | `termination` fesih) → `archived` (arşiv). Her geçiş insan onayı (`approval_ref`) ve — negotiation/approval/signature geçişlerinde — PDP playbook kontrolü ister; motor durumu *sessizce* ilerletmez.

Aşağıdaki tablo müzakere workspace bileşenlerini, sahibini ve AI sınırını tanımlar. Her bileşen §5 modeline ve §10 guardrail'e bağlıdır.

| Bileşen | Nedir / ne yapar | Sahip (karar) | AI sınırı |
|---|---|---|---|
| **Redline** | Madde-düzeyi değişiklik önerisi (`redline.proposed_body` vs `clause.body`); tur içinde sürümlenir | Kabul: sözleşme/finans/hukuk sahibi (`approval_ref`) | AI `ai_suggested` redline *önerir* (draft); kabul edemez |
| **Karşı-taraf yorumu** | Karşı tarafın (`direction=counterparty`) madde/tur üzerine yorumu ve redline'ı | Karşı taraf üretir; iç ekip yanıtlar | AI karşı-taraf şartını *tek başına kabul edemez* |
| **Version diff** | İki `negotiation_round` (`version_no`) arasında madde-madde fark | Motor üretir (deterministik) | AI diff'i *özetleyebilir* (draft); değiştiremez |
| **Fallback madde** | Bir madde tıkanınca sunulan yedek/geri-çekilme dili (`clause.fallback_ref`) | Hukuk sahibi onaylar | AI fallback *önerir* (draft); dayatamaz |
| **Negotiation stance** | Madde/redline bazında müzakere tutumu ve onay eşiği: `accept` / `finance_approval` / `legal_approval` / `reject` | Playbook (PDP) tanımlar; eşik insanı bağlar | AI stance *önerir* (draft); playbook eşiğini atlayamaz |
| **Clause battlecard** | Maddenin savunma/pazarlık gerekçesi (`redline.rationale`); "neden bu dil, karşı-teklife yanıt" | Hukuk/iç ekip; PDP playbook besler | AI battlecard *önerir* (draft); karar-metni değil |

Müzakere alt-yaşam-döngüsü kuralları: (1) Karşı-taraf ve AI kaynaklı her redline (`origin ∈ {counterparty, ai_suggested}`) **varsayılan `decision=pending`** başlar ve `accepted` olması **yalnız** `approval_ref` (insan) + PDP playbook kontrolüyle mümkündür; motor doğrudan kabul etmez. (2) Stance eşiği bağlayıcıdır: `finance_approval`/`legal_approval` gerektiren bir redline, ilgili onay olmadan `accepted` olamaz (aksi `PlaybookViolationError`/`ApprovalRequiredError`). (3) `version_no` monotonik artar; her tur bir öncekini `superseded` yapabilir; version diff iki sürümü madde-madde karşılaştırır (kopya değil, diff). (4) Fallback madde yalnız bir *öneridir*; bir maddenin yerine geçmesi (madde body değişimi) bir redline + kabul onayı gerektirir. (5) Müzakere `negotiation` durumunda yürür; `approval`'a geçiş tüm açık (`pending`) redline'ların karara bağlanmasını (accepted/rejected) ve iç onay eşiklerinin karşılanmasını ister. Her redline kararı, tur geçişi ve stance uygulaması append-only audit'lenir.

## 7. Backend gereksinimleri (agreement graph + müzakere + kompozisyon)

Aşağıdaki gereksinimler CLM Core + Negotiation portunu bağlar; her biri test-önce (kırmızı→yeşil) yaşam döngüsüne tabidir. Motor tarafı `platform_agreement` paketinde yaşar. Çekirdek imzalar: `create_agreement(title, contract_type, parties, ..., tenant_id) -> Agreement` (grafiği tanımlar); `advance_status(agreement_id, to_status, approval_ref) -> Agreement` (yaşam döngüsü geçişi; insan onayı + PDP playbook kontrolü, doğrudan `UPDATE status` yasak); `open_round(agreement_id, direction) -> NegotiationRound` (yeni müzakere turu açar, `version_no` ilerletir); `propose_redline(round_id, clause_id, proposed_body, origin, stance) -> Redline` (redline üretir; `counterparty`/`ai_suggested` origin `pending` başlar); `decide_redline(redline_id, decision, approval_ref) -> Redline` (kabul/ret; `accepted` yalnız insan onayı + PDP playbook, stance eşiği kontrolü); `diff_rounds(agreement_id, from_version, to_version) -> [ClauseDiff]` (sürüm-arası deterministik diff); `send_to_signature(agreement_id, approval_ref) -> SignatureRef` (`k-signature`'a `signature_request` başlatır); `feed_obligations(agreement_id) -> [ObligationRef]` (aktifleşince `k-obligation`'a taahhüt besler).

- **Agreement graph modeli:** Sözleşme düz bir tablo değil; `parties` (`PartyRef[]`), `clauses` (`ClauseRef[]`), `obligations`/`signatures`/`evidence` (`EntityRef[]`) ve `attachments` (`AssetRef[]`) ile bir grafiktir. Her referans tipli ve tenant-kapsamlıdır; grafik gezinmesi (sözleşme → tarafları/maddeleri/yükümlülükleri) tek sorguda çözülebilir. Ana-veri kopyalanmaz: taraf `k-party`'de, madde clause-library'de, belge `k-storage`'da yaşar.
- **Yaşam döngüsü durum makinesi:** `status` yalnız `advance_status`/motor kuralıyla ilerler; geçiş grafiği (`draft→review→negotiation→approval→signature→active→renewal|termination→archived`) sabit, geriye/ileriye geçerli geçişler tanımlı, geçersiz geçiş engellidir. `negotiation`/`approval`/`signature` geçişleri insan onayı (`approval_ref`) + PDP playbook kontrolü ister. Doğrudan `UPDATE agreement SET status=...` **yasaktır** (bkz. §14).
- **Müzakere motoru (redline + tur + diff):** `open_round` yeni tur açar ve `version_no`'yu ilerletir; `propose_redline` madde-düzeyi öneri üretir (`counterparty`/`ai_suggested` origin `decision=pending`); `decide_redline` kabul/ret yapar — `accepted` **yalnız** `approval_ref` + PDP playbook + stance eşiği (finans/hukuk onayı) karşılanınca; `diff_rounds` iki sürümü madde-madde deterministik karşılaştırır (kopya değil, fark). Karşı-taraf/AI redline'ının doğrudan kabulü **yasaktır** (insan + playbook).
- **Negotiation stance + playbook (PDP):** Her madde/redline bir `NegotiationStance` (accept/finance_approval/legal_approval/reject) taşır; stance ve kabul eşiği **PDP playbook'undan (policy-as-data)** okunur. Motor bir redline'ı `accepted` yaparken PDP'ye "bu madde/redline bu aktör tarafından, bu stance ile kabul edilebilir mi?" sorusunu sorar; playbook ihlali `PlaybookViolationError` fırlatır. Stance kararı ≠ yetki kararı; ikisi de PDP'de.
- **Fallback madde:** Her madde bir `fallback_ref` (yedek dil) taşıyabilir; müzakere tıkandığında motor fallback'i *aday* olarak sunar (uygulama değil). Bir maddenin body'sinin değişmesi (fallback'e geçiş dahil) bir redline + kabul onayı gerektirir; motor fallback'i tek başına uygulamaz.
- **Kompozisyon (diğer primitifleri bağlama):** `send_to_signature` sözleşmeyi `k-signature`'a bir `signature_request` olarak sokar (`document` = render edilmiş belge `AssetRef`); `feed_obligations` aktifleşince (`status=active`) sözleşme/madde taahhütlerini `k-obligation`'a tanımlar (`source_ref`/`clause_ref`); `document` `archetype-document-composition`'dan üretilir; `risk_score`/`total_value` `k-computation`'dan türetilir ve referanslanır; kanıt `k-evidence`'a yazılır. `archetype-agreement` bu primitiflerin *işini yapmaz*, onları *kompoze eder*.
- **i14y (CRM/ERP/HR) bağı:** `linked_crm_deal`/`linked_erp_vendor`/`linked_hr_record` dış sistem kayıtlarına `ExternalId`/`EntityRef` ile idempotent kimlik eşlemesidir; erişim `k-provider-adapter` (BYO) üzerinden; `archetype-agreement` dış sistem SDK'sını doğrudan çağırmaz.
- **AI müzakere yardımı (öner → onay → playbook):** AI redline (`ai_suggested`), fallback ve stance *önerir* (`origin=ai_suggested`, `decision=pending`); ayrıca sözleşme metninden alan/tur özeti çıkarır. Bu öneriler **yürürlükte değildir**; bir insan onaylayana (`approval_ref`) ve PDP playbook geçene kadar madde body'sini/durumu değiştirmez. AI karşı-taraf şartını *tek başına kabul edemez*.
- **Audit:** Her durum geçişi, her redline kararı (accept/reject/escalate), her tur geçişi ve her müzakere/kabul kararı `AuditLogger.log()` ile `actor` + `resource=agreement` yazılır ve append-only tutulur (v1 §2.5). Kim hangi maddeyi ne zaman hangi gerekçeyle kabul/ret etti, hangi karşı-teklif hangi sürümde geldi — hepsi izlidir (müzakere kanıtı).
- **Hata formatı:** `{code, message, trace_id, details}` (v1 §3.1); `get_logger()` kullanılır, `print()` yasak.

## 8. Frontend gereksinimleri

Aşağıdaki gereksinimler Vite + React + TanStack yığınına ve config-driven surface ilkesine uyar; CLM Core + Negotiation ekranlarını bağlar. Bileşenler SCSS + token ile biçimlenir; ikonlar Phosphor'dur. Mock veri yasaktır — her şey runtime endpoint'inden gelir.

- **Sözleşme grafiği görünümü:** Bir sözleşmenin özeti (`title`, `contract_type`, `status`, `parties`, `effective_range`, `total_value`, `risk_score`) ve grafik bağları (maddeler, yükümlülükler, imzalar, ekler, bağlı CRM/ERP/HR kaydı) tek ekranda; veri TanStack Query ile çekilir, hardcoded taraf/sağlayıcı referansı **yasak**. Yaşam döngüsü durumu (`status`) ve sıradaki izinli geçiş rozetle gösterilir.
- **Müzakere workspace:** Madde-madde redline editörü (mevcut `clause.body` vs `redline.proposed_body`), karşı-taraf yorumları iliştirilmiş; iki sürüm (`negotiation_round.version_no`) arası **version diff** görsel olarak (eklenen/silinen/değişen madde) gösterilir; her redline'ın `origin` (human/ai_suggested/counterparty), `stance` ve `decision` durumu ayrışır. Karşı-taraf/AI redline'ları "öneri — onay bekliyor" olarak işaretlenir ve doğrudan kabul edilemez.
- **Fallback + stance + battlecard paneli:** Bir madde seçildiğinde fallback maddesi (`fallback_ref`), müzakere stance'i (accept/finance-onay/hukuk-onay/reject) ve clause battlecard (savunma/pazarlık gerekçesi `redline.rationale`) yan panelde gösterilir; stance eşiği (finans/hukuk onayı gerekiyorsa) açıkça belirtilir; AI önerileri "taslak" rozetiyle ayrışır.
- **Kabul/ret aksiyonları:** Bir redline'ı kabul/ret veya bir durum geçişini (ör. `approval`→`signature`) tetikleme yalnız insan tarafından, `approval_ref` üreten bir onay adımıyla; stance eşiği finans/hukuk onayı gerektiriyorsa ilgili onaycıya yönlendirilir; AI önerileri bu aksiyonları tetikleyemez.
- **AI öneri görünürlüğü (guardrail):** AI'ın ürettiği redline/fallback/stance önerileri ve tur özetleri "AI önerisi — onay bekliyor" rozetiyle, kaynak madde vurgusuyla ve (varsa) güven skoruyla ayrışır; yürürlükte değildir ve madde body'sini/durumu değiştirmez; insan onayı butonu (kabul/düzelt/reddet) ile karara bağlanır.
- **Erişilebilirlik + i18n:** WCAG 2.2 AA taban; dokunmatik hedef ≥ 44x44px; renk kontrastı ≥ 4.5:1; diff/redline vurgusu yalnız renge dayanmaz (ikon/etiket ile). Sözleşme türü/durum/rol/stance metinleri `I18nText`/`EnumType` alias üzerinden çok-dilli (TR/EN); ham string gömülmez; tutar/tarih locale'e göre biçimlenir; ikonlar Phosphor.

## 9. Multi-tenant / RLS (tenant-scoped sözleşme grafiği + müzakere)

Her `agreement`, `agreement_party`, `clause`, `payment`, `negotiation_round` ve `redline` satırı `tenant_id` taşır ve fail-closed çalışır (bağlam yoksa istek reddedilir, v1 §2.1). PostgreSQL RLS ile bir tenant başka tenant'ın sözleşmesini/müzakere turunu/redline'ını göremez veya etkileyemez: `USING (tenant_id = current_setting('app.current_tenant')::uuid)`. Grafik referansları tenant sınırını *genişletemez*: `parties` (`PartyRef`), `document`/`attachments` (`AssetRef`), `obligations`/`signatures`/`evidence` (`EntityRef`) mutlaka aktif tenant kapsamında çözülür; cross-tenant referans `TenantViolationError` fırlatır ve audit'lenir. Karşı-taraf portalı üzerinden gelen redline/yorum da sözleşmenin tenant'ına bağlanır; bir tenant başka tenant'ın müzakeresine sızamaz (veri sızıntısı koruması). PII alanları (`agreement_party.tax_id`/`national_id`) alan-düzeyi maskeleme/şifreleme ile korunur (KVKK/GDPR); NationalId PII-yüksek. Türetilen değerler (`risk_score`, `total_value`) ve `k-computation`/`k-obligation` besleme çağrıları tenant'ı taşır. i14y bağlarında (`linked_*`) dış sistem kimliği tenant-kapsamlı sağlayıcı adaptöründen geçer; bir tenant başka tenant'ın CRM/ERP kimliğini kullanamaz. Schema-per-tenant / RLS geçiş eşiği ADR-0026'ya uyar.

## 10. AI guardrail (autonomy seviyesi)

Aşağıdaki iş bölümü değiştirilemezdir: **AI önerir → insan onaylar → motor uygular.** (`core-contract-pack.md §3.0.1`) Bu archetype hukuki ve finansal sonuç doğurduğu için (yanlış kabul edilen bir madde = hukuki risk, kaçan bir müzakere şartı = gelir/pozisyon kaybı) AI'ın autonomy'si dardır: AI müzakere önerir (redline/fallback/stance/özet) ama hiçbir karşı-taraf şartını tek başına kabul edemez, bir maddeyi kesinleştiremez ve sözleşmeyi imzaya/aktife gönderemez; her karar insan onayı + PDP playbook kontrolü ister.

Bu tablo `archetype-agreement` üzerindeki AI autonomy sınırlarını tanımlar.

| İşlem | Autonomy | Kural |
|---|---|---|
| Redline (madde değişikliği) *önerme* | `draft` | AI madde-düzeyi değişiklik önerir (`ai_suggested`, `decision=pending`); **kesinleştiremez** |
| Fallback madde *önerme* | `draft` | AI yedek/geri-çekilme maddesi önerir; hukuk onaylar, AI **dayatamaz** |
| Negotiation stance *önerme* | `draft` | AI madde stance'i (kabul/finans-onay/hukuk-onay) önerir; **playbook eşiğini atlayamaz** |
| Tur/madde özeti + metinden alan çıkarma | `draft` | AI sözleşme metninden alan/özet çıkarır; karar-metni değil, yardımcı taslak |
| Karşı-taraf şartını (redline) kabul | `none` | AI bir karşı-taraf redline'ını **tek başına kabul edemez** (`ApprovalRequiredError`); insan + PDP playbook |
| Bir maddeyi kesinleştirme (body değişimi) | `none` | Madde body değişimi/madde kabulü insan onayı; AI **kesinleştiremez** |
| Durum ilerletme (negotiation→approval→signature→active) | `none` | Yaşam döngüsü geçişi insan onayı + PDP playbook; AI **ilerletemez** |
| İmzaya/aktife gönderme | `none` | Sözleşmeyi imzaya sokma/aktifleştirme insan onayı; AI **gönderemez** |
| Playbook / governing_law / risk politikası değişimi | `none` | Playbook, hukuk çerçevesi ve risk politikası kararı çekirdek/hukuk ekibi; AI değiştiremez |
| Karar-logu / audit / kanıt değişimi | `none` | Audit ve kanıt append-only; AI değiştiremez |

Mutlak sınırlar: AI main branch'e push edemez; app/module düğümü üretemez/güncelleyemez; ruleset override edemez; kanıtsız "anlaşıldı/imzalandı/bitti" diyemez. En kritik sınırlar: (1) **AI karşı-taraf şartını (redline) tek başına kabul edemez** — bu hukuki sonuç doğuran insan kararıdır; (2) **AI bir maddeyi kesinleştiremez ve durumu ilerletemez** — yalnız `draft` önerir; (3) **AI sözleşmeyi imzaya/aktife gönderemez**. PDP kararı erişim yetkisini ve playbook uygunluğunu belirler; AI PDP/playbook kararını override edemez. Nitelikli imzayı (QES) daima gerçek imzacı (insan) `k-signature` üzerinden atar; AI imzacı yerine geçemez.

## 11. Bağlama (her şeyi kompoze eder)

`archetype-agreement` CLM'in merkez-archetype'ı olarak diğer kernel primitiflerini *kompoze eder*; kendisi imza/yükümlülük/render/kanıt/hesap *yapmaz*, onları tipli referanslarla bağlar ve orkestre eder.

**`k-party` bağlama:** Sözleşme tarafları (`parties`, `agreement_party.party_ref`) `k-party` ArcheType'ının kayıtlarına `PartyRef` ile bağlanır; kişi/kurum ana-verisi `k-party`/`k-mdm`'de yaşar, `archetype-agreement` yalnız sözleşme-yerel rol/bağlam (`role`) ve Fragment'lenmiş sunum alanlarını (`PersonName`/`Address`/`ContactPoint`) tutar. Ana-veri kopyalanmaz.

**`archetype-document-composition` bağlama:** İmzalanacak/paylaşılacak belge (`document`) `archetype-document-composition` tarafından şablon + clause birleştirmesiyle *üretilir/derlenir*; `archetype-agreement` bir `AssetRef` referansı tutar, belgeyi *üretmez*. Grafik (agreement) veri kaynağı, kompozisyon belge çıktısıdır; belge yalnız grafiğin bir *render*'ıdır.

**`k-obligation` bağlama:** Sözleşme aktifleştiğinde (`status=active`) doğan taahhütler (ödeme/teslim/yenileme/ihbar/SLA/ceza) `k-obligation`'a *beslenir* (`feed_obligations`; `source_ref`=agreement, `clause_ref`=madde). Taahhüt yaşam döngüsü (vade/hatırlatma/eskalasyon/yenileme-ihbar/met-breached-waive) `k-obligation`'ındır; `archetype-agreement` yalnız kaynağı besler, taahhüt motorunu açmaz.

**`k-signature` bağlama:** `signature` durumunda sözleşme `k-signature`'a bir `signature_request` olarak *sokulur* (`send_to_signature`; `document`=`AssetRef`); imzacı/sıra/seviye/format/kanıt işi `k-signature`'ındır; `archetype-agreement` sonucu `signatures` (`EntityRef[]`) ile bağlar. İmza tamamlanınca `active`'e geçiş insan onayıyla yapılır.

**`k-evidence` bağlama:** Müzakere kararları (redline kabul/ret, tur geçişi), imzaya-gönderme ve aktifleşme kanıtı `k-evidence`'a append-only *yazılır* (`evidence` `EntityRef[]`); `archetype-agreement` kanıt deposu değildir. İhtilafta müzakere/imza ispatı `k-evidence`'tan çekilir.

**PDP (`k-policy-pdp`) + playbook bağlama:** "Bu aktör bu sözleşmeyi görebilir/düzenleyebilir/onaylayabilir mi?" yetki kararı ve "bu redline/fallback/stance playbook'a uygun mu, bu madde bu eşikle kabul edilebilir mi?" **playbook (policy-as-data)** kararı PDP'nindir. `archetype-agreement` grafiği ve müzakere durumunu uygular ama *yetkiyi ve playbook kararını* PDP'de bırakır (tek doğruluk kaynağı). Stance eşiği (finans/hukuk onayı) PDP playbook'undan okunur; ihlal `PlaybookViolationError`.

**`k-computation` bağlama:** `total_value` (sözleşme değeri), `payment_term` tutar/oranı ve `risk_score` (politika-bazlı risk) `k-computation`'ın türettiği/denetlenebilir grafikle hesapladığı değerlerdir; `archetype-agreement` bunları *referanslar/tutar*, aritmetiği (para/oran/risk) yapmaz. Kur karışımı/precision/yuvarlama `k-computation` + `Money` atomu güvencesindedir.

**i14y (CRM/ERP/HR — `k-provider-adapter`) bağlama:** `linked_crm_deal`/`linked_erp_vendor`/`linked_hr_record` dış sistem kayıtlarına `ExternalId`/`EntityRef` ile idempotent kimlik eşlemesidir; erişim `k-provider-adapter` (BYO) üzerinden; bir sözleşme bir CRM fırsatına, bir ERP tedarikçisine veya bir HR çalışan kaydına bağlanır. `archetype-agreement` dış sistem SDK'sını doğrudan çağırmaz; entegrasyon zarfı adaptöründür.

**Atom/Fragment bağlama:** Grafiğin her alanı `atom-archetype-bagi §2` tablosundan bir atoma/Fragment'e oturur; `archetype-agreement` "hazır" sayılması için dayandığı atomların (`Money`/`Range<date>`/`Term`/`Recurrence`/`Duration`/`Percentage`/`PartyRef`/`ClauseRef`/`AssetRef`/`ExternalId`) ve Fragment'lerin (`Address`/`PersonName`/`ContactPoint`) test-önce kilitlenmiş olması gerekir (bkz. §9-multi-tenant değil, atom testleri: `atomik-netlestirme §9`/`atom-archetype-bagi §9`). Eksik atom `string`/`json`'a sıkışırsa grafiğin değeri (yükümlülük/yenileme/kanıt) sessizce çöker.

## 12. Test stratejisi

Aşağıdaki testler CLM Core + Negotiation kabul kriterlerini ve `core-contract-pack` DoD'unu karşılar; hepsi test-önce (önce kırmızı) yazılır. Kompozisyon bağları (`k-signature`/`k-obligation`/`k-computation`/`archetype-document-composition`) stub/sandbox adaptörle test edilir.

Bu tablo `archetype-agreement` için zorunlu test senaryolarını ve türlerini tanımlar.

| # | Senaryo | Test türü |
|---|---|---|
| 1 | Agreement graph: sözleşme tarafları/maddeleri/yükümlülükleri tipli referansla bağlanıyor, tek sorguda gezilebiliyor; ana-veri kopyalanmıyor | Entegrasyon |
| 2 | Yaşam döngüsü: `draft→review→negotiation→approval→signature→active→renewal/termination→archived` geçerli geçişler yürüyor, geçersiz geçiş engelleniyor | Contract |
| 3 | Doğrudan durum yazma reddi: `UPDATE agreement SET status` reddediliyor; geçiş yalnız `advance_status` + `approval_ref` + PDP playbook | Contract |
| 4 | Müzakere turu + version diff: `open_round` `version_no` ilerletiyor; `diff_rounds` iki sürümü madde-madde deterministik karşılaştırıyor | Entegrasyon |
| 5 | Redline kabul onay-zorunlu: `counterparty`/`ai_suggested` redline `pending` başlıyor; `accepted` yalnız `approval_ref` + PDP playbook ile | Entegrasyon |
| 6 | Stance eşiği: `finance_approval`/`legal_approval` gerektiren redline ilgili onay olmadan `accepted` olamıyor (`PlaybookViolationError`) | Entegrasyon |
| 7 | Fallback madde: fallback yalnız aday olarak sunuluyor; madde body değişimi bir redline + kabul onayı gerektiriyor (motor tek başına uygulamıyor) | Entegrasyon |
| 8 | Kompozisyon-imza: `send_to_signature` `k-signature`'a `signature_request` başlatıyor, sonucu `signatures` ile bağlıyor | Entegrasyon |
| 9 | Kompozisyon-yükümlülük: `active`'e geçince `feed_obligations` `k-obligation`'a taahhüt besliyor (`source_ref`/`clause_ref`) | Entegrasyon |
| 10 | Türetim referansı: `risk_score`/`total_value` `k-computation`'dan referanslanıyor; agreement para/risk hesaplamıyor | Contract |
| 11 | AI guardrail: AI karşı-taraf redline'ını kabul edemiyor, madde kesinleştiremiyor, durumu ilerletemiyor, imzaya gönderemiyor; yalnız `draft` öneriyor | Entegrasyon |
| 12 | Tenant izolasyonu: A tenant B'nin sözleşmesini/müzakeresini/redline'ını göremiyor/etkileyemiyor, cross-tenant referans reddediliyor (≥10 negatif case) | Entegrasyon (negatif) |
| 13 | PII: `agreement_party.national_id`/`tax_id` alan-düzeyi maskeleniyor/şifreleniyor; maskeli sunum, geçersiz reddi | Birim |
| 14 | Audit: her durum geçişi + redline kararı + tur geçişi append-only audit'e düşüyor (müzakere kanıtı izli) | Entegrasyon |
| 15 | Migration downgrade: `alembic downgrade -1` veri kaybetmeden çalışıyor | CI |
| 16 | GraphQL/PEP koruması: her resolver/endpoint `permission_classes`/`Depends(require_tenant)` taşıyor | Contract |

## 13. Acceptance criteria

- Sözleşme birinci-sınıf `agreement` grafiği olarak tanımlanıyor (`title`/`contract_type`/`status`/`parties`/`effective_range`/`total_value` + referans koleksiyonları); grafik bağları (taraf/madde/yükümlülük/imza/kanıt/ek/linked) tipli referansla çözülüyor ve ana-veri kopyalanmıyor (CLM Core kabul kriteri).
- Yaşam döngüsü (`draft→review→negotiation→approval→signature→active→renewal|termination→archived`) durum makinesiyle yürüyor; `negotiation`/`approval`/`signature` geçişleri insan onayı (`approval_ref`) + PDP playbook kontrolü istiyor; doğrudan `UPDATE status` reddediliyor.
- Müzakere workspace çalışıyor: redline (madde-düzeyi değişiklik) sürümleniyor, karşı-taraf yorumu iliştiriliyor, iki sürüm arası version diff deterministik üretiliyor, fallback madde ve negotiation stance (kabul/finans-onay/hukuk-onay) taşınıyor, clause battlecard sunuluyor.
- Karşı-taraf/AI kaynaklı redline `pending` başlıyor ve `accepted` yalnız insan onayı (`approval_ref`) + PDP playbook + stance eşiği (finans/hukuk onayı) karşılanınca oluyor; stance eşiği ihlali reddediliyor (`PlaybookViolationError`).
- Kompozisyon çalışıyor: sözleşme `k-signature`'a imzaya sokuluyor (`signature_request`), aktifleşince `k-obligation`'a taahhüt besleniyor (`source_ref`/`clause_ref`), belge `archetype-document-composition`'dan `document` (`AssetRef`) olarak alınıyor, `risk_score`/`total_value` `k-computation`'dan referanslanıyor, kanıt `k-evidence`'a yazılıyor, i14y (CRM/ERP/HR) `k-provider-adapter` ile bağlanıyor.
- AI müzakere önerisi (redline/fallback/stance/özet) yalnız `draft`; AI karşı-taraf şartını kabul edemiyor, madde kesinleştiremiyor, durumu ilerletemiyor, imzaya/aktife gönderemiyor (test-kanıtlı).
- Cross-tenant sözleşme/müzakere/referans erişimi en az 10 negatif test case ile reddediliyor ve audit'leniyor; PII (`national_id`/`tax_id`) alan-düzeyi maskeleniyor/şifreleniyor.
- Her durum geçişi, redline kararı ve tur geçişi append-only audit'e düşüyor (müzakere kanıtı izli, sessiz madde-değişimi/kabul olamaz).
- Alembic migration downgrade otomatik test geçiyor; `check-core-contract` (tenant guard, resolver koruması, audit çağrısı, indeks) yeşil.

## 14. Anti-patterns

- **Sözleşmeyi PDF gibi tutma:** Sözleşmeyi tek `bytea`/`file` belge olarak saklayıp alanları (taraf/değer/tarih/yükümlülük) grafiğe çıkarmamak — YASAK; agreement bir grafiktir, belge yalnız `document` render'ıdır.
- **Doğrudan durum yazma:** App'te `UPDATE agreement SET status=...` ile yaşam döngüsünü ilerletmek — YASAK; geçiş yalnız `advance_status` + `approval_ref` + PDP playbook kontrolünden.
- **Karşı-taraf redline'ını doğrudan kabul:** `UPDATE clause SET body=...` ile karşı-taraf/AI önerisini kesinleştirmek — YASAK; kabul yalnız `decide_redline` + insan onayı + PDP playbook + stance eşiğinden.
- **AI'ın madde kabulü/durum ilerletmesi:** AI'ın bir redline'ı kabul etmesi, madde kesinleştirmesi, durumu ilerletmesi veya imzaya göndermesi — YASAK; hepsi `autonomy: none`, insan kararı + playbook.
- **App-özel sözleşme tablosu:** Bir ArcheType'ın kendi `contracts`/`agreements` tablosunu açması — YASAK; tek sözleşme kaynağı `archetype-agreement`.
- **İmza/yükümlülük/render'ı içeride yapma:** `archetype-agreement` içinde imza akışı yürütmek, yükümlülük vadesi izlemek veya PDF derlemek — YASAK; sırasıyla `k-signature`/`k-obligation`/`archetype-document-composition`.
- **Kanıtı yerelde tutma:** Müzakere/imza kanıtını agreement tablosuna gömmek — YASAK; kanıt `k-evidence`'a append-only yazılır.
- **Para/risk hesabı yapma:** `total_value`/`risk_score`/ceza tutarını agreement içinde hesaplamak — YASAK; türetim `k-computation`, agreement referanslar.
- **Taraf ana-verisini kopyalama:** Kişi/kurum ana-verisini agreement'a kopyalamak — YASAK; `PartyRef` ile `k-party`'ye bağlanır.
- **Eksik atomu string'e sıkıştırma:** `total_value`'yu `number`, `effective_range`'i iki serbest tarih, `renewal_rule`'u serbest metin yapmak — YASAK; atom katmanı (`atomic-types-directive`) kullanılır (aksi hâlde yükümlülük/yenileme/değer çöker).
- **Sessiz müzakere:** Redline kabulünü/durum geçişini audit'siz/`approval_ref`'siz yapmak — YASAK; kim-ne-zaman-hangi-gerekçe izli olmalı.
- **PII'ı düz string tutma:** `national_id`/`tax_id`'yi maskesiz/şifresiz `string` tutmak — YASAK; alan-düzeyi PII sınıfı (KVKK/GDPR).
- **Playbook'u atlama:** Stance eşiğini (finans/hukuk onayı) PDP playbook kontrolü olmadan geçmek — YASAK; `PlaybookViolationError`.

## 15. Definition of Done

- §12'deki 16 test senaryosu yeşil (test-önce kanıtı: kırmızı→yeşil geçişi belgeli).
- `core-contract-pack` tenant + audit + indeks uyumu sağlandı; `check-core-contract.mjs` yeşil.
- Alembic migration downgrade CI'da çalışıyor; `agreement`/`agreement_party`/`clause`/`payment`/`negotiation_round`/`redline` şeması §5 tablolarıyla ve `atom-archetype-bagi §2` eşlemesiyle uyumlu; durum-geçişi ve müzakere audit'i append-only.
- Yaşam döngüsü durum makinesi (geçerli/geçersiz geçiş) ve müzakere motoru (tur/redline/diff/stance/fallback) çalışıyor; karşı-taraf/AI redline'ı insan onayı + PDP playbook + stance eşiği olmadan kabul edilemiyor (entegrasyon kanıtı).
- Kompozisyon bağları çalışıyor (entegrasyon kanıtı): `send_to_signature`→`k-signature`, `feed_obligations`→`k-obligation`, `document`←`archetype-document-composition`, `risk_score`/`total_value`←`k-computation`, kanıt→`k-evidence`, `linked_*`→i14y (`k-provider-adapter`).
- CLM uçtan-uca akış (sözleşme oluştur → maddeleri bağla → müzakere turları/redline/diff → onay eşikleri → imzaya gönder → aktifleş → yükümlülük besle → yenileme/fesih/arşiv) çalışıyor.
- ADR-AGR1 "Kilitli" statüsünde (insan onayı); `archetype-agreement` düğümü ve altındaki `archetype` (kod) düğümü WBS'te doğru `dependsOn` (`k-party`, `k-obligation`, `k-signature`, `k-policy-pdp`, `archetype-document-composition`) ile mevcut; dayandığı atomlar/Fragment'ler (`atom-archetype-bagi §2`/§8) test-önce kilitli.
- AI-guardrail testi: AI'ın karşı-taraf redline kabulü, madde kesinleştirme, durum ilerletme ve imzaya/aktife gönderme denemeleri reddediliyor; yalnız `draft` (redline/fallback/stance/özet) öneri üretilebiliyor; PDP playbook override edilemiyor.
- Doküman `icerik-kalite-sozlesmesi` biçim kurallarına uyar (aktör-açık, emoji yok, her başlıkta nedir/yapar/yapmaz, her tablodan önce açıklama, mock yok).

## 16. CLM karşılığı (Core + Negotiation)

Aşağıdaki tablo, bu sözleşmenin CLM (Contract Lifecycle Management) Core + Negotiation gereksinimlerini `archetype-agreement` sözleşme öğelerine nasıl eşlediğini gösterir; her satır bir CLM yeteneğini merkez-archetype'a bağlar. Bu eksen ürünün *çekirdeğidir*: sözleşmeyi işletilebilir bir grafiğe çevirir ve müzakereyi birinci-sınıf yürütür; diğer kernel primitiflerini (imza/yükümlülük/kanıt/render/hesap) kompoze eder.

| CLM / Negotiation gereksinimi | archetype-agreement karşılığı |
|---|---|
| Sözleşme = işletilebilir veri grafiği (PDF değil) | §4 tanım; §5 agreement graph; §7 graph modeli; §14 anti-pattern (PDF gibi tutma) |
| Agreement graph başlık alanları (title/type/status/parties/dates/value/risk) | §5 tablo-1 (`atom-archetype-bagi §2` ile birebir) |
| Taraf modeli (Fragment Address/PersonName/ContactPoint + TaxId/NationalId) | §5 tablo-3 `agreement_party`; §3/§4 (`k-party` referans, ana-veri kopyalanmaz) |
| Madde (clause) kütüphanesi + standart/alternatif + sürüm | §5 `clauses` `ClauseRef[]` + `clause`; §6 redline sürümleme |
| Yaşam döngüsü (draft→…→active→renewal/termination→archived) | §5 `status`; §6 durum makinesi; §7 `advance_status` |
| Müzakere: redline (madde-düzeyi değişiklik) | §5 `redline`; §6 workspace; §7 `propose_redline`/`decide_redline` |
| Karşı-taraf yorumu + version diff | §5 `negotiation_round` (direction/version_no); §6/§7 `diff_rounds` |
| Fallback madde + negotiation stance (kabul/finans/hukuk onayı) | §5 `clause.fallback_ref`/`redline.stance`; §6 stance eşiği; §7 playbook |
| Clause battlecard (savunma/pazarlık gerekçesi) | §5 `redline.rationale`; §6 battlecard; §8 panel |
| İmzaya gönderme (composition) | §7 `send_to_signature`; §11 `k-signature` bağlama |
| Yükümlülük besleme (composition) | §7 `feed_obligations`; §11 `k-obligation` bağlama |
| Doküman render (composition) | §5 `document` `AssetRef`; §11 `archetype-document-composition` bağlama |
| Değer/ödeme/risk türetimi | §5 `total_value`/`payment_term`/`risk_score`; §11 `k-computation` bağlama |
| Müzakere/imza kanıtı | §5 `evidence` `EntityRef[]`; §11 `k-evidence` bağlama |
| Playbook (policy-as-data) kontrolü | §6/§7 PDP playbook; §10 AI guardrail; §11 PDP bağlama |
| CRM/ERP/HR bağı (i14y) | §5 `linked_crm/erp/hr`; §11 i14y (`k-provider-adapter`) bağlama |
| AI müzakere yardımı (öner → insan karar → playbook) | §6 workspace AI sınırı; §7 AI müzakere yardımı; §10 autonomy |

## 17. Requirement-ID tablosu

Aşağıdaki tablo, bu sözleşmenin izlenebilir gereksinimlerini kimlik + katman + öncelik (P0–P3) + test türü + kabul + sahip ile listeler. Öncelik: P0 = bloklayıcı invariant, P1 = çekirdek, P2 = önemli, P3 = iyileştirme.

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| AGR-01 | `agreement` çekirdek grafiği tenant-kapsamlı (title/type/status/parties/dates/value + referans koleksiyonları) | Backend/Data | P0 | Integration | Grafik tenant izolasyonlu tanımlanır/gezilebilir | kernel-team |
| AGR-02 | Alanlar `atom-archetype-bagi §2` ile birebir (Money/Range/Term/Recurrence/Duration/Percentage/PartyRef/ClauseRef/AssetRef/ExternalId) | Backend/Data | P0 | Contract | Her alan doğru atoma/Fragment'e oturur | kernel-team |
| AGR-03 | Yaşam döngüsü durum makinesi (draft→…→archived), geçersiz geçiş engeli | Backend | P0 | Contract | Geçerli geçiş yürür, geçersiz engellenir | kernel-team |
| AGR-04 | Doğrudan `UPDATE status`/`UPDATE clause` reddi; yalnız `advance_status`/`decide_redline` | Backend | P0 | Contract | Serbest durum/madde yazımı yok | kernel-team |
| AGR-05 | Müzakere turu + version diff (`version_no`, `diff_rounds` deterministik) | Backend | P1 | Integration | İki sürüm madde-madde karşılaştırılır | kernel-team |
| AGR-06 | Redline kabul onay-zorunlu (`counterparty`/`ai_suggested` `pending`→`accepted` yalnız insan + playbook) | Backend/Compliance | P0 | Integration | Onaysız/playbook-dışı kabul reddedilir | governance |
| AGR-07 | Negotiation stance eşiği (finans/hukuk onayı) PDP playbook'tan | Backend/Compliance | P0 | Integration | Eşik ihlali `PlaybookViolationError` | governance |
| AGR-08 | Fallback madde yalnız aday; body değişimi redline + kabul gerektirir | Backend | P1 | Integration | Motor fallback'i tek başına uygulamaz | kernel-team |
| AGR-09 | Kompozisyon-imza: `send_to_signature`→`k-signature` `signature_request` | Backend/Integration | P1 | Integration | Sözleşme imzaya sokulur, sonuç bağlanır | kernel-team |
| AGR-10 | Kompozisyon-yükümlülük: `active`→`feed_obligations`→`k-obligation` | Backend/Integration | P1 | Integration | Taahhüt beslenir (`source_ref`/`clause_ref`) | kernel-team |
| AGR-11 | Kompozisyon-doküman: `document` `archetype-document-composition`'dan `AssetRef` | Backend/Integration | P1 | Integration | Belge referanslanır, üretilmez | kernel-team |
| AGR-12 | Türetim: `risk_score`/`total_value` `k-computation`'dan; agreement hesaplamaz | Backend | P1 | Contract | Para/risk aritmetiği agreement'ta yok | kernel-team |
| AGR-13 | Kanıt: müzakere/imza kanıtı `k-evidence`'a append-only | Security/Data | P0 | Integration | Karar/geçiş kanıtı yazılır | security-team |
| AGR-14 | Tenant-scoped RLS + cross-tenant sözleşme/müzakere/referans reddi | Security | P0 | Integration(neg) | ≥10 cross-tenant negatif case reddedilir | security-team |
| AGR-15 | PII: `national_id`/`tax_id` alan-düzeyi maskeleme/şifreleme (KVKK/GDPR) | Security | P0 | Unit | Maskeli sunum; geçersiz reddi | security-team |
| AGR-16 | Durum geçişi + redline kararı + tur geçişi audit (append-only) | Security | P0 | Integration | Müzakere kanıtı izli | security-team |
| AGR-17 | AI müzakere önerisi `draft`; kabul/kesinleştirme/ilerletme/imzaya-gönderme `none` | AI-Governance | P0 | Integration | AI karşı-taraf şartını kabul edemez, durumu ilerletemez | governance |
| AGR-18 | AI playbook/governing_law/risk politikası değiştiremez (autonomy none) | AI-Governance | P0 | Unit | AI politika/çerçeve kararı veremez | governance |
| AGR-19 | Playbook (policy-as-data) kontrolü PDP'ye referans; agreement yetki/playbook kararı vermez | Backend/API | P1 | Integration | Kabul/erişim/eşik kararı PDP'den | kernel-team |
| AGR-20 | i14y (CRM/ERP/HR) `linked_*` `ExternalId`/`EntityRef` + `k-provider-adapter` (BYO) | Integration | P1 | Integration | Dış sistem SDK'sı doğrudan çağrılmaz | kernel-team |
| AGR-21 | Alembic expand-contract + dolu downgrade | Backend/DevOps | P1 | CI | `alembic downgrade -1` veri kaybetmez | kernel-team |
| AGR-22 | Strawberry resolver `permission_classes` + PEP `Depends` zorunlu | Backend/API | P1 | Contract | Korumasız resolver/endpoint yok | kernel-team |
| AGR-23 | Frontend sözleşme grafiği + müzakere workspace (redline/diff/stance/battlecard) config-driven | Frontend | P1 | E2E | UI runtime verisinden; hardcoded taraf/sağlayıcı yok | ui-team |
| AGR-24 | WCAG 2.2 AA + i18n (type/status/rol/stance) + diff renk-dışı ayrım + Phosphor | Frontend/A11y | P2 | A11y(axe) | axe critical=0; öneri/eşik rozeti erişilebilir | ui-team |
| AGR-25 | `archetype-agreement` WBS düğümü doğru dependsOn (k-party, k-obligation, k-signature, k-policy-pdp, archetype-document-composition) | Governance/WBS | P1 | CI(data-quality) | DAG geçerli, dangling yok | pmo |

---

*Kaynak yönerge: CLM Core + Negotiation. Bu, CLM'in **merkez-archetype'ıdır**: sözleşmeyi işletilebilir bir veri grafiğine (agreement graph) çevirir ve diğer kernel primitiflerini kompoze eder. Kardeş/kompoze edilen sözleşmeler: `k-party` (`actor-party-contract.md`; taraf/imzacı `PartyRef`), `archetype-document-composition` (imzalanacak/paylaşılacak belge render; `document` `AssetRef`), `k-obligation-commitment-directive.md` (yükümlülük yaşam döngüsü; agreement besler), `k-signature-trust-directive.md` (imza orkestrasyonu; agreement imzaya sokar), `k-evidence-seal-directive.md` (müzakere/imza kanıtı kasası), `pdp-policy-contract.md` (playbook/policy-as-data; redline/stance/fallback kontrolü), `computation-derivation-contract.md` (risk skoru/değer/ödeme türetimi), `k-provider-adapter-directive.md` (CRM/ERP/HR entegrasyonu — i14y), `k-storage-dam-directive.md` (ek binary referansı), `atom-archetype-bagi-clm-ornegi-2026-07-01.md §2/§3/§8/§9` (alan-alan atom eşlemesi — ana kaynak), `atomik-netlestirme-2026-07-01.md` (atom/Fragment kademe modeli), `core-contract-pack.md §3.0.1` (AI guardrail). Bu doküman hiçbir kod/şema/JSON dosyasına dokunmaz; yalnız sözleşme metnidir. Çelişki halinde `core-contract-pack.md` (kernel runtime) önceliklidir; bu doküman güncellenir. Sözleşmeyi değiştirme yetkisi yalnız insan onayındadır; AI bu dosyayı doğrudan güncelleyemez. Bir karşı-taraf şartını (redline) kabul, bir maddeyi kesinleştirme, durumu ilerletme ve sözleşmeyi imzaya/aktife gönderme yalnız insan kararıdır ve PDP playbook'una göre kontrol edilir; AI yalnız önerir (redline/fallback/stance/özet).*
