# k-signature / Trust Yönergesi — E-İmza / E-Mühür Orkestrasyon Kernel Primitifi

**Tarih:** 2026-07-01
**Durum:** Taslak sözleşme (kilitlenmeyi bekliyor — bkz. §13 DoD, ADR-SIG1)
**Kaynak/bağlam:** `core-contract-pack.md §3.0.1` (ortak AI-güvenlik invariantı), `k-storage-dam-directive.md` (kardeş kernel primitifi deseni, imzalanan doküman referansı), `atomik-netlestirme-2026-07-01.md` (atom/fragment/archetype kademe modeli; alan→atom bağı), `wbs-field-semantics.md` (dependsOn anlamı), `PIM-v2-Gereksinim-Analizi.md` (CLM / sözleşme yaşam döngüsü bağlamı).
**İlişki:** Bu doküman `k-storage`'ın ve `k-evidence`'ın kardeşidir: `k-storage` "binary/varlık nerede?", `k-evidence` "ne oldu, kanıtı nerede?", `k-signature` ise "bu doküman kim tarafından, hangi sırayla, hangi hukuki seviyede imzalanacak/mühürlenecek?" sorusunu yanıtlar. `k-signature` **sağlayıcı-agnostik e-imza/e-mühür orkestrasyon** primitifidir; kendisi bir QTSP (Qualified Trust Service Provider) **değildir** ve olmayacaktır — nitelikli sertifika ve nitelikli zaman damgası dış yetkili sağlayıcıdan (BTK-yetkili ESHS / eIDAS QTSP) tüketilir. Bu doküman **kod yazmaz**; `k-signature` kernel primitifinin davranış sözleşmesini normatif tanımlar. Makine-okunur karşılığı (SQLAlchemy 2.0 modeli, Alembic migration, sağlayıcı-adaptör soyutlaması, Strawberry tipi) ADR-SIG1 kilitlendiğinde ajan-draft + insan-onay ile `platform` reposunda üretilir.

---

## 1. Amaç

Bu sözleşme, platformdaki her elektronik imza ve elektronik mühür işleminin (sözleşme imzası, onay, e-fatura mührü, kurumsal damga) tek bir kernel soyutlamasında orkestre edilmesini sabitler. Hedef: 50 uygulamanın hiçbirinin kendi DocuSign/Adobe Sign entegrasyonunu, kendi imza akış motorunu veya kendi PAdES/XAdES üreticisini yeniden yazmaması; her imza talebinin tek bir `signature_request` kaydında tanımlanıp imzacıların (`signer`) sıra/kimlik-doğrulama kurallarına göre yürütülmesi, imza alanlarının (`signature_field`) doküman üstüne konumlanması, hukuki seviyenin (eIDAS SES/AES/QES) ve formatın (PAdES/XAdES/CAdES) sağlayıcı-agnostik uygulanması ve tamamlanan imzanın kanıtının `k-evidence`'a yazılması. Aktör-açık ifade: *ajan* imza işini (alan yerleşimi, özet) önerir (draft); *insan* imzaya-gönderme/sıra/QES-seviye kararını onaylar ve nitelikli imzayı bizzat atar; *motor* onaylı akışı deterministik ve geri-alınabilir yürütür.

## 2. Kapsam

Bu sözleşme şunları kapsar: (1) `signature_request` çekirdek imza-talebi kaydı (seviye + format + mod + vade + imzalanan doküman referansı), (2) `signer` ile bir talebe bağlı çok imzacı ve her imzacının sıra/kimlik-doğrulama kuralı, (3) `signature_field` ile doküman üstünde konumlanmış imza/paraf/tarih alanları, (4) eIDAS üç seviye (SES basit / AES gelişmiş / QES nitelikli) ve seviye-uygun sağlayıcı seçimi, (5) format uygulaması PAdES (PDF) / XAdES (XML) / CAdES (CMS/genel), (6) RFC 3161 nitelikli zaman damgası ve LTV/LTA (uzun-dönem doğrulama/arşiv) profili, (7) e-Seal (kurumsal elektronik mühür) akışı, (8) imza akış modelleri (sequential / parallel / group / delegated-vekil), (9) alıcı kimlik doğrulama (email / sms-otp / mfa / sso / eid), (10) embedded (gömülü) imza deneyimi ve bulk-send (toplu gönderim), (11) Türkiye 5070 + BTK-yetkili ESHS uyumu, (12) `k-signature` düğümünün WBS yerleşimi, çok-kiracılı izolasyon ve audit zorunlulukları. Backend (sağlayıcı-adaptör + async), frontend, test ve AI-guardrail gereksinimleri ilgili bölümlerde tarif edilir.

## 3. Non-goals

Bu sözleşme şunları **kapsamaz**: (1) QTSP/ESHS **olmak** — nitelikli sertifika üretimi, HSM tabanlı anahtar saklama, nitelikli zaman damgası otoritesi işletmek bir dış yetkili sağlayıcının (BTK-yetkili ESHS / eIDAS QTSP) işidir; `k-signature` bu sağlayıcıyı `k-provider-adapter` üzerinden *tüketir*, kendisi güven-hizmeti üretmez. (2) İmza kanıtının kalıcı saklanması ve denetim izinin tutulması — bunu `k-evidence` yapar; `k-signature` imza tamamlanınca kanıtı `k-evidence`'a *yazar*, kendi kanıt deposunu açmaz. (3) İmzalanacak dokümanın *üretimi/derlenmesi* — bunu `archetype-document-composition` yapar; `k-signature` yalnız hazır dokümanı (`AssetRef`) imzaya sokar, şablon/birleştirme yapmaz. (4) Bir kullanıcının belgeye/işleme erişip erişemeyeceği kararı — bunu PDP (`k-policy-pdp`) verir; `k-signature` yalnız imza akışını yürütür, erişim iznini vermez. (5) İmzalanan binary'nin object storage'da tutulması — bunu `k-storage` yapar; `k-signature` doküman ve imzalı çıktıyı `AssetRef` ile referanslar, binary'yi kendi tablosuna gömmez. (6) Serbest kodla sağlayıcı erişimi — hiçbir app doğrudan DocuSign/Adobe/E-imza-sağlayıcı SDK'sını çağıramaz; erişim yalnız bu primitifin sözleşmeli servisinden ve `k-provider-adapter`'dan geçer.

## 4. Tanım (nedir / ne yapar / ne yapmaz)

**Nedir:** `k-signature`, sistemdeki her e-imza/e-mühür işlemini tek bir soyutlamada orkestre eden, imzacıları/sırayı/kimlik-doğrulamayı yöneten, hukuki seviyeyi (eIDAS SES/AES/QES) ve formatı (PAdES/XAdES/CAdES) sağlayıcı-agnostik uygulayan ve nitelikli güven-hizmetini (sertifika, zaman damgası) dış yetkili sağlayıcıdan tüketen kernel orkestrasyon primitifidir.

**Ne yapar:** Bir imza talebini bir kez tanımlar (`signature_request`); hedef dokümanı (`AssetRef`) imza akışına sokar; imzacıları (`signer`) ekler ve her birine sıra (sequential/parallel/group) ile kimlik-doğrulama kuralı (email/sms-otp/mfa/sso/eid) atar; imza/paraf/tarih alanlarını (`signature_field`) doküman sayfası üstünde konumlar; seçilen eIDAS seviyesine uygun sağlayıcıyı `k-provider-adapter` üzerinden çağırır (SES/AES basit sağlayıcı, QES nitelikli ESHS/QTSP); imzayı PAdES/XAdES/CAdES formatında gömer; RFC 3161 zaman damgası alır ve LTV/LTA profili uygular; e-Seal kurumsal mühür akışını yürütür; vekil/delegated imzayı yetki devriyle yönetir; embedded imza oturumu ve bulk-send toplu gönderim sağlar; imza tamamlanınca kanıtı `k-evidence`'a yazar; her akış mutasyonunu audit'ler; vade (`expires`) ve hatırlatmaları `k-obligation`/`k-worker` ile bağlar.

**Ne yapmaz:** Nitelikli sertifika/zaman-damgası **üretmez** (QTSP değildir; dış ESHS/QTSP'den tüketir). İmza kanıtını kendi deposunda **tutmaz** (kanıt `k-evidence`'a yazılır). Doküman **üretmez/derlemez** (`archetype-document-composition` işidir; `k-signature` hazır dokümanı imzaya sokar). Erişim/yetki kararı **vermez** — bunu PDP yapar; `k-signature` yalnız PDP izniyle akışı başlatır. Binary'yi tabloya **gömmez** (`k-storage`'da tutulur, `AssetRef` ile referanslanır). QES seviyesini veya imza sırasını **kendi başına seçmez** — seviye/sıra/imzaya-gönderme kararı insan onayına bağlıdır (AI yalnız draft önerir). Sağlayıcı-özel API'yi (örn. tek sağlayıcıya bağlı özellik) sözleşmeye **sızdırmaz** — ortak imza-orkestrasyon alt kümesi `k-provider-adapter` arayüzünden geçer.

## 5. Sözleşme şekli (alan yapısı)

Aşağıdaki üç tablo, `k-signature` primitifinin veri şeklini yalnızca *alan adı + tip + amaç* olarak tarif eder; dolu örnek/mock değer verilmez. Tipler PostgreSQL/SQLAlchemy 2.0 karşılıklarıdır ve `atomik-netlestirme-2026-07-01.md` kademe modeline bağlıdır: her semantik alan bir **atoma** (Katman A/B/C) oturur — `EnumType` (seviye/format/mod/kimlik-doğrulama), `Duration` (vade/hatırlatma), `AssetRef` (imzalanan doküman/imzalı çıktı, Katman C referans-değer), `PartyRef` (imzacı taraf, Katman C), `integer` (sıra), `SignatureField` (sayfa+konum+boyut+tür bileşik alan-yerleşim değeri). İmzalanan binary veritabanında değil `k-storage` object storage'da tutulur; tablo yalnız referansı, akış durumunu ve orkestrasyon metadata'sını taşır. İmza kanıtı bu tabloda değil `k-evidence`'ta yaşar.

Bu tablo `signature_request` çekirdek imza-talebi kaydının alanlarını tanımlar.

| Alan | Tip (atom) | Amaç |
|---|---|---|
| `id` | UUID (PK) | İmza talebinin benzersiz kimliği |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu; v1 §2.1 fail-closed zorunluluğu |
| `document` | `AssetRef` (FK-scope → k-storage) | İmzalanacak doküman (hazır PDF/XML); binary `k-storage`'da, burada referans |
| `signed_document` | `AssetRef` (nullable) | İmza/mühür gömülü çıktı (imza tamamlanınca üretilen imzalı belge referansı) |
| `level` | `EnumType`(ses, aes, qes) | eIDAS hukuki seviye; nitelikli (qes) = QTSP sertifikası, el-imzası eşdeğeri |
| `format` | `EnumType`(pades, xades, cades) | İmza formatı; PAdES→PDF, XAdES→XML, CAdES→CMS/genel |
| `mode` | `EnumType`(sequential, parallel, group) | İmza akış modeli; sıralı / paralel / grup-eşiği |
| `kind` | `EnumType`(signature, seal) | E-imza (gerçek kişi) mi e-mühür/e-Seal (tüzel kişi/kurumsal) mi |
| `timestamping` | `EnumType`(none, rfc3161) | RFC 3161 nitelikli zaman damgası uygulanacak mı |
| `retention_profile` | `EnumType`(none, ltv, lta) | Uzun-dönem doğrulama (LTV) / arşiv (LTA) profili |
| `jurisdiction` | `EnumType`(eidas, tr5070) | Uygulanacak hukuki çerçeve; TR = 5070 + BTK-yetkili ESHS |
| `provider_ref` | UUID (FK → k-provider-adapter, nullable) | Seçilen güven-hizmeti sağlayıcı bağlaması (seviye-uygun ESHS/QTSP) |
| `status` | `EnumType`(draft, sent, in_progress, completed, declined, expired, voided) | İmza talebi yaşam döngüsü |
| `expires` | `Duration` / TIMESTAMPTZ (nullable) | Talebin geçerlilik süresi/vadesi; `k-obligation` bağlar |
| `approval_ref` | UUID (nullable) | İmzaya-gönderme/QES-seçimi onaylayan insan + zaman + gerekçe (AI-draft ise zorunlu) |
| `created_at` | TIMESTAMPTZ (NOT NULL) | Audit/oluşturulma zamanı |
| `updated_at` | TIMESTAMPTZ (NOT NULL) | Son değişiklik zamanı |

Bu tablo `signer`'ın bir imza talebine bağlı imzacılarını, sırasını ve kimlik-doğrulama kuralını tanımlar; bir `signature_request` çok sayıda imzacı taşır (sequential'da sıra önemli, parallel'da eşzamanlı, group'ta eşik).

| Alan | Tip (atom) | Amaç |
|---|---|---|
| `id` | UUID (PK) | İmzacının benzersiz kimliği |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu |
| `request_id` | UUID (FK → signature_request.id) | Bağlı olduğu imza talebi |
| `party` | `PartyRef` (Katman C) | İmzacı taraf; `k-party` ArcheType'ına referans-değer |
| `order` | integer | İmza sırası; sequential modda yürütme sırası, group modda eşik hesabı |
| `role` | `EnumType`(signer, approver, delegate, seal_holder) | İmzacı rolü; imzalayan / onaylayan / vekil / mühür-sahibi |
| `auth` | `EnumType`(email, sms_otp, mfa, sso, eid) | Alıcı kimlik doğrulama yöntemi; eid = elektronik kimlik (QES için) |
| `delegated_from` | `PartyRef` (nullable) | Vekil imzada yetkiyi devreden taraf (delegated/vekil imza) |
| `status` | `EnumType`(pending, notified, viewed, signed, declined) | Bu imzacının bireysel durumu |
| `signed_at` | TIMESTAMPTZ (nullable) | İmzacının imza attığı an (audit; kanıt detayı `k-evidence`'ta) |
| `created_at` | TIMESTAMPTZ (NOT NULL) | Audit |

Bu tablo `signature_field`'ın imza/paraf/tarih alanlarının doküman üstündeki yerleşimini tanımlar; bir imzacıya bağlı bir veya çok alan doküman sayfasında konumlanır. Alan yerleşiminin tümü `SignatureField` bileşik değerine (sayfa + normalize konum/boyut + tür) oturur.

| Alan | Tip (atom) | Amaç |
|---|---|---|
| `id` | UUID (PK) | İmza alanının benzersiz kimliği |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu |
| `request_id` | UUID (FK → signature_request.id) | Bağlı olduğu imza talebi |
| `signer_id` | UUID (FK → signer.id) | Alanı dolduracak imzacı |
| `placement` | `SignatureField`(page, x, y, w, h, kind) | Yerleşim değeri; sayfa no + normalize konum/boyut + alan türü |
| `page` | integer | Doküman sayfa numarası (`SignatureField.page`) |
| `x` | decimal | Sol-üst köşe X (normalize/oran; `SignatureField.x`) |
| `y` | decimal | Sol-üst köşe Y (normalize/oran; `SignatureField.y`) |
| `w` | decimal | Alan genişliği (normalize/oran; `SignatureField.w`) |
| `h` | decimal | Alan yüksekliği (normalize/oran; `SignatureField.h`) |
| `field_kind` | `EnumType`(signature, initial, date, seal, text) | Alan türü; imza / paraf / tarih / mühür / metin (`SignatureField.kind`) |
| `required` | boolean | Alan zorunlu mu (imza tamamlanması için doldurulması şart mı) |
| `created_at` | TIMESTAMPTZ (NOT NULL) | Audit |

## 6. WBS / kernel yerleşimi

`k-signature`, kernel/layer0 kümesine (`k-*`) `module`-seviyesi bir düğüm olarak eklenir; `k-storage`, `k-evidence` ile aynı `app-layer0` altındadır. Altında asıl kod-teslimatı olan en az bir `archetype` düğümü durur. Bağımlılıklar `wbs-field-semantics`'e uyar: `dependsOn` = teknik/yürütme sırası (kritik yol); `related` = yalnız gezinme.

Bu tablo `k-signature` düğümünün WBS yerleşimini ve bağımlılıklarını tanımlar.

| Düğüm | Seviye | dependsOn | Küme |
|---|---|---|---|
| `k-signature` | module | `k-storage`, `k-provider-adapter` | kernel/layer0 |

`dependsOn` gerekçesi: `k-signature` imzalanacak dokümana (`k-storage`'daki `AssetRef`) ve sağlayıcı erişimine (`k-provider-adapter` — BYO/kendi-sağlayıcını-getir soyutlaması) teknik olarak bağlıdır; doküman referansı ve seviye-uygun sağlayıcı adaptörü hazır olmadan imza akışı başlatılamaz. `related` ile (karar üretmeden) `k-evidence` (imza kanıtı buraya yazılır), PDP (`k-policy-pdp`; akış-başlatma izni), `k-worker` (hatırlatma/asenkron yürütme), `k-obligation` (vade/son-tarih), `k-party` (imzacı taraf) ve `archetype-document-composition` (imzalanacak dokümanı üreten üst süreç) düğümlerine bağlanır. CLM E-Signature modülü (§16) kendi `dependsOn`'unda `k-signature`'ı listeler — yani imza orkestrasyonu önce gelir, sözleşme yaşam döngüsü onu tüketir.

## 7. Backend gereksinimleri (sağlayıcı-adaptör + async)

Aşağıdaki gereksinimler `k-provider-adapter` soyutlamasını bağlar; her biri test-önce (kırmızı→yeşil) yaşam döngüsüne tabidir.

- **Sağlayıcı-agnostik orkestrasyon:** Tek `SignatureProvider` arayüzü (create-envelope / add-signer / apply-signature / timestamp / seal / status) `k-provider-adapter` üstünde; SES/AES için basit imza sağlayıcı, QES için nitelikli ESHS/QTSP aynı arayüzde farklı adaptör. Sağlayıcı seviye + jurisdiction'a göre seçilir; app kod değişmeden sağlayıcı değişir. Doğrudan sağlayıcı SDK çağrısı app'te **yasak**; erişim yalnız `k-provider-adapter` sözleşmesinden.
- **eIDAS seviye kapısı:** `level=qes` yalnız nitelikli sertifika sunan (BTK-yetkili ESHS / eIDAS QTSP) sağlayıcıyla ilerleyebilir; nitelikli-olmayan sağlayıcıya QES istemek `LevelNotSupportedError` fırlatır. Seviye seçimi (özellikle QES) insan onayına bağlıdır (§10); el-imzası eşdeğeri hukuki sonuç doğurur.
- **Format uygulaması:** `format` alanına göre imza gömme — PAdES (PDF içine), XAdES (XML üzerine), CAdES (CMS/genel binary). Format ile doküman `content_type` uyumu doğrulanır (PDF olmayan dokümana PAdES istenemez); uyumsuzluk `FormatMismatchError`.
- **Zaman damgası (RFC 3161):** `timestamping=rfc3161` istendiğinde nitelikli zaman-damgası otoritesinden (TSA, dış sağlayıcı) damga alınır ve imzaya gömülür; TSA `k-provider-adapter` üzerinden çağrılır, `k-signature` kendi TSA'sını işletmez.
- **LTV / LTA:** `retention_profile=ltv` sertifika zinciri + iptal bilgisi (CRL/OCSP) imzaya gömülür (uzun-dönem doğrulama); `lta` ayrıca arşiv zaman-damgası ekler (uzun-dönem arşiv). Bu profil dokümanı ileride sertifika süresi dolsa bile doğrulanabilir kılar.
- **E-Seal akışı:** `kind=seal` tüzel-kişi/kurumsal mühür; imzacı gerçek kişi yerine kurumsal sertifika sahibi (`role=seal_holder`), akış tek-taraflı kurumsal onaydır (e-fatura mührü, kurumsal damga tipik kullanım).
- **Akış modu yürütme:** `sequential` bir imzacı tamamlanmadan sonrakine geçmez; `parallel` tümüne eşzamanlı gönderir; `group` eşik (N-of-M) tamamlanınca ilerler; `delegated` imzacı yetkiyi `delegated_from` ile vekile devreder (vekil imza, denetim izinde iki taraf da görünür).
- **Alıcı kimlik doğrulama:** `signer.auth` ile imzacı imza öncesi doğrulanır — `email` (bağlantı), `sms_otp` (tek-kullanımlık kod), `mfa` (çok-faktör), `sso` (kurumsal oturum), `eid` (elektronik kimlik, QES için tipik). Doğrulama başarısız ise imza reddedilir ve audit'lenir.
- **Embedded imza + bulk-send:** Embedded modda imza deneyimi app içine gömülür (sağlayıcının barındırdığı sayfaya yönlendirme yerine gömülü oturum token'ı); bulk-send tek şablondan çok alıcıya toplu talep üretir (her biri bağımsız `signature_request`, ortak alan-yerleşimi).
- **Kanıt yazımı (k-evidence):** İmza her tamamlandığında/ret/vade-dolumunda kanıt (imzacı, an, IP/oturum, sertifika parmak-izi, zaman-damgası) `k-evidence`'a yazılır; `k-signature` kendi kanıt deposunu tutmaz. İmza kanıtı append-only.
- **Async I/O:** Sağlayıcı çağrıları event loop'u bloklamaz; uzun-süren imza akışları (hatırlatma, yoklama/polling, webhook işleme) `k-worker`'a offload edilir (senkron istek yolunda değil).
- **Audit + hata formatı:** Her create/send/sign/void/decline `AuditLogger.log()` ile `actor` + `resource=signature_request` yazılır (v1 §2.5). Hata formatı `{code, message, trace_id, details}` (v1 §3.1); `get_logger()` kullanılır, `print()` yasak.

## 8. Frontend gereksinimleri

Aşağıdaki gereksinimler Vite + React + TanStack yığınına, SCSS + token temasına, Phosphor ikon setine ve config-driven surface ilkesine uyar.

- **İmza akışı kurgu ekranı:** Doküman seçimi (`AssetRef`, `k-storage`'dan), imzacı ekleme (`PartyRef`), sıra/mod (sequential/parallel/group) atama, seviye/format seçimi; asset ve imzacı verisi TanStack Query ile çekilir, hardcoded sağlayıcı/envelope referansı **yasak** (her şey runtime endpoint'inden).
- **Alan yerleşim editörü:** İmza/paraf/tarih/mühür alanları doküman önizlemesi üstünde sürükle-bırak konumlanır (`signature_field.placement` → sayfa+normalize x/y/w/h); AI yalnız alan yerleşimini *önerir* (draft), insan konumu onaylar/düzeltir (§10).
- **Embedded imza deneyimi:** Gömülü imza oturumu app içinde açılır (sağlayıcı barındırdığı sayfaya yönlendirme yerine); imzacı kimlik-doğrulama adımı (`auth`) UI'da netçe gösterilir; QES imzada nitelikli araç/eid akışı ayrıştırılır.
- **Durum görünürlüğü:** `signature_request.status` ve `signer.status` akış izleyicisinde gösterilir; `in_progress` bekleyen imzacıyı, `declined` ret gerekçesini, `expired` vade-dolumunu ayrıştırır; bulk-send toplu talepler tek listede özetlenir.
- **Erişilebilirlik:** WCAG 2.2 AA taban (AAA yüzey-bazlı opt-in); dokunmatik hedef ≥ 44x44px; renk kontrastı ≥ 4.5:1; imza alanı ve kimlik-doğrulama adımı klavye ile erişilebilir; ikonlar Phosphor.
- **i18n:** Seviye/format/mod/rol/durum ve hata metinleri `I18nText` üzerinden çok-dilli (TR/EN); ham string gömülmez.

## 9. Multi-tenant / RLS (tenant-scoped imza akışı)

Her `signature_request`, `signer` ve `signature_field` satırı `tenant_id` taşır ve fail-closed çalışır (bağlam yoksa istek reddedilir, v1 §2.1). Metadata satırında PostgreSQL RLS bariyer: `USING (tenant_id = current_setting('app.current_tenant')::uuid)`. İmza talebi tenant sınırını *genişletemez*: bir talebe eklenen `document` (`AssetRef`) mutlaka aktif tenant'ın `k-storage` kapsamında olmalı; cross-tenant doküman imzaya sokma girişimi `TenantViolationError` fırlatır ve audit'lenir. İmzacı (`PartyRef`) ve vekil (`delegated_from`) aynı tenant/izin sınırına uyar. Sağlayıcı bağlaması (`provider_ref`) tenant'ın yapılandırdığı adaptörle sınırlıdır; bir tenant başka tenant'ın sağlayıcı kimlik bilgisini kullanamaz. Kanıt yazımı da tenant-kapsamlı `k-evidence`'a düşer. Schema-per-tenant / RLS geçiş eşiği ADR-0026'ya uyar.

## 10. AI guardrail (autonomy seviyesi)

Aşağıdaki iş bölümü değiştirilemezdir: **AI önerir → insan onaylar → motor uygular.** (`core-contract-pack.md §3.0.1`)

Bu tablo `k-signature` üzerindeki AI autonomy sınırlarını tanımlar.

| İşlem | Autonomy | Kural |
|---|---|---|
| Alan yerleşimi *önerme* | `draft` | AI imza/paraf/tarih alanı konumu önerir (`SignatureFieldDraft`); insan onaylar, doğrudan uygulayamaz |
| Doküman özeti *önerme* | `draft` | AI imzalanacak dokümanın özetini/risk notunu önerir; karar-metni değil, yardımcı taslak |
| İmzaya gönderme (send) | onay-zorunlu | `approval_ref` (insan) olmadan `status=sent` `ApprovalRequiredError` fırlatır; AI tek başına gönderemez |
| İmza sırası (mode/order) kararı | onay-zorunlu | Sıra/mod (sequential/parallel/group) ve imzacı sırası insan onayıyla kesinleşir |
| eIDAS seviye (özellikle QES) seçimi | onay-zorunlu | `level=qes` (el-imzası eşdeğeri, hukuki sonuç) yalnız insan onayıyla; AI tek başına QES seçemez |
| İmza talebini void/decline | onay-zorunlu | Tamamlanmış/yürüyen talebi iptal insan onayına bağlı |
| Sağlayıcı/jurisdiction politikası değişimi | `none` | Sağlayıcı (ESHS/QTSP) ve hukuki çerçeve kararı çekirdek ekip PR'ı; AI değiştiremez |
| Kanıt / audit değişimi | `none` | İmza kanıtı ve audit append-only; AI değiştiremez/silemez |

Mutlak sınırlar: AI main branch'e push edemez; app/module düğümü üretemez/güncelleyemez; ruleset override edemez; kanıtsız "imzalandı/bitti" diyemez; doğrudan sağlayıcıya imza gönderemez (yalnız draft alan/özet önerir); QES seviyesini, imza sırasını veya imzaya-gönderme kararını insan onayı olmadan veremez. PDP kararı akış-başlatma iznini belirler; AI PDP kararını override edemez. Nitelikli imzayı (QES) daima gerçek imzacı (insan) atar — AI imzacı yerine geçemez.

## 11. Bağlama (k-storage, k-evidence, k-provider-adapter, PDP, k-worker, k-obligation)

**`k-storage` bağlama:** İmzalanacak doküman (`document`) ve imza gömülü çıktı (`signed_document`) `k-storage`'da `AssetRef` ile tutulur; `k-signature` binary'yi kendi tablosuna gömmez, referanslar. İmzalı belge üretildiğinde `k-storage`'a yeni bir asset olarak yazılır ve `signed_document` bağlanır.

**`k-evidence` bağlama:** İmza tamamlandığında/reddedildiğinde/vade dolduğunda kanıt (imzacı, an, oturum/IP, sertifika parmak-izi, RFC 3161 zaman-damgası, LTV/LTA verisi) `k-evidence`'a *yazılır*; `k-signature` kanıt deposu değildir. `k-evidence` bu kaydı append-only tutar; ihtilafta ispat oradan çekilir.

**`k-provider-adapter` bağlama (BYO):** Tüm sağlayıcı erişimi (SES/AES basit sağlayıcı, QES nitelikli ESHS/QTSP, TSA, e-Seal) `k-provider-adapter` (kendi-sağlayıcını-getir / BYO soyutlaması) üzerinden geçer; `k-signature` tek `SignatureProvider` arayüzünü çağırır, sağlayıcı-özel SDK'yı bilmez. Sağlayıcı seviye + jurisdiction'a göre `k-provider-adapter`'da seçilir.

**PDP (`k-policy-pdp`) bağlama:** Bir aktörün bir dokümanı imzaya sokabileceği / bir imza talebini görebileceği kararı PDP'nindir; `k-signature` akışı yalnız PDP izniyle başlatır ve izni override etmez. İmza *yürütmesi* `k-signature`'ın, *erişim izni* PDP'nin işidir.

**`k-worker` bağlama:** Bekleyen imzacıya hatırlatma, vade-yaklaşımı bildirimi, sağlayıcı-yoklama (polling) ve webhook işleme `k-worker`'a offload edilir (ölçek-değişmez, idempotent, retry+backoff, dead-letter); senkron istek yolunda değil.

**`k-obligation` bağlama:** `signature_request.expires` bir yükümlülük/son-tarihtir; `k-obligation` vadeyi izler, vade dolunca `status=expired` geçişini ve gerekli hatırlatmayı tetikler (yürütme `k-worker`'da).

**`archetype-document-composition` bağlama:** İmzalanacak doküman `archetype-document-composition` tarafından *üretilir/derlenir*; `k-signature` hazır çıktıyı `AssetRef` ile imzaya sokar, şablon/birleştirme yapmaz. Doküman üretimi önce gelir, imza orkestrasyonu sonra.

## 12. Test stratejisi

Aşağıdaki testler eIDAS/5070 uyum kabul kriterlerini ve `core-contract-pack` DoD'unu karşılar; hepsi test-önce (önce kırmızı) yazılır. Nitelikli sağlayıcı (QTSP/ESHS) entegrasyonu sandbox/stub adaptörle test edilir (gerçek nitelikli sertifika CI'da üretilmez).

Bu tablo `k-signature` için zorunlu test senaryolarını ve türlerini tanımlar.

| # | Senaryo | Test türü |
|---|---|---|
| 1 | Sağlayıcı-agnostik: aynı akış SES basit ve QES nitelikli adaptöre create/sign yapıyor (config farkı) | Entegrasyon |
| 2 | eIDAS seviye kapısı: nitelikli-olmayan sağlayıcıya `level=qes` `LevelNotSupportedError` veriyor | Birim (negatif) |
| 3 | Format uyumu: PDF olmayan dokümana PAdES `FormatMismatchError`; PAdES/XAdES/CAdES doğru gömülüyor | Entegrasyon |
| 4 | Akış modu: sequential sıra bekliyor, parallel eşzamanlı, group eşiği (N-of-M) çözülüyor | Entegrasyon |
| 5 | Delegated/vekil: yetki `delegated_from` ile devrediliyor, denetim izinde iki taraf görünüyor | Entegrasyon |
| 6 | Kimlik doğrulama: email/sms-otp/mfa/sso/eid akışları; başarısız doğrulama imzayı reddediyor | Entegrasyon |
| 7 | Zaman damgası + LTV/LTA: RFC 3161 damga gömülüyor, LTV zincir/iptal ekleniyor | Entegrasyon |
| 8 | Kanıt yazımı: imza tamamlanınca kanıt `k-evidence`'a append-only yazılıyor | Entegrasyon |
| 9 | Tenant izolasyonu: A tenant B'nin dokümanını imzaya sokamıyor (≥10 negatif case) | Entegrasyon (negatif) |
| 10 | AI-guardrail: `approval_ref`'siz send / AI'ın QES seçimi reddediliyor | Entegrasyon |
| 11 | Migration downgrade: `alembic downgrade -1` veri kaybetmeden çalışıyor | CI |
| 12 | GraphQL/API koruması: her resolver `permission_classes` taşıyor | Contract |

## 13. Acceptance criteria

- Bir doküman imza akışına sokulur → imzacılar sıra/mod (sequential/parallel/group) ve kimlik-doğrulama (email/sms-otp/mfa/sso/eid) kuralıyla eklenir → imza alanları doküman üstünde konumlanır → seviye-uygun sağlayıcıyla (SES/AES/QES) imzalanır → PAdES/XAdES/CAdES gömülür → kanıt `k-evidence`'a yazılır.
- Aynı orkestrasyon kodu SES/AES basit sağlayıcı ve QES nitelikli ESHS/QTSP için yalnız `k-provider-adapter` config değişimiyle çalışıyor; app doğrudan sağlayıcı SDK'sını çağırmıyor.
- `level=qes` yalnız nitelikli (BTK-yetkili ESHS / eIDAS QTSP) sağlayıcıyla ilerliyor; nitelikli-olmayana QES reddediliyor.
- RFC 3161 zaman damgası imzaya gömülüyor; LTV/LTA profili uygulanınca doküman uzun-dönem doğrulanabilir kalıyor.
- Delegated/vekil imza yetki devriyle çalışıyor; e-Seal (kurumsal mühür) tek-taraflı kurumsal akışla tamamlanıyor.
- Cross-tenant doküman imzaya sokma en az 10 negatif test case ile reddediliyor ve audit'leniyor.
- AI alan yerleşimi/özeti yalnız `draft` olarak öneriyor; `approval_ref` olmadan send / AI'ın QES-seviye seçimi reddediliyor.
- Alembic migration downgrade otomatik test geçiyor; `check-core-contract` (tenant guard, resolver koruması, audit çağrısı, indeks) yeşil.

## 14. Anti-patterns

- **QTSP olmaya çalışma:** `k-signature` içinde nitelikli sertifika üretmek / HSM anahtar saklamak / TSA işletmek — YASAK; nitelikli güven-hizmeti dış BTK-yetkili ESHS / eIDAS QTSP'den `k-provider-adapter` ile tüketilir.
- **Doğrudan sağlayıcı SDK:** App'te DocuSign/Adobe/e-imza SDK'sını doğrudan çağırmak — YASAK; erişim yalnız `k-provider-adapter` sözleşmesinden.
- **Kanıtı yerelde tutma:** İmza kanıtını `signature_request` tablosuna gömmek — YASAK; kanıt `k-evidence`'a append-only yazılır.
- **Binary'yi tabloya gömme:** İmzalanan/imzalı PDF'i DB kolonuna yazmak — YASAK; binary `k-storage`'da, burada `AssetRef` referansı.
- **Doküman üretimini imzaya karıştırma:** `k-signature` içinde şablon derleme/birleştirme yapmak — YASAK; doküman `archetype-document-composition`'da üretilir.
- **AI'ın QES/send/sıra kararı:** AI'ın insan onayı olmadan imzaya-gönderme, QES-seviye seçimi veya imza sırası belirlemesi — YASAK; `ApprovalRequiredError`.
- **Seviye kapısını atlama:** `level=qes`'i nitelikli-olmayan sağlayıcıyla ilerletmek — YASAK; `LevelNotSupportedError`.
- **Format uyumsuzluğu:** PDF olmayan dokümana PAdES gömmeye çalışmak — YASAK; `FormatMismatchError`.
- **Tenant sınırı genişletme:** Cross-tenant doküman/imzacı/sağlayıcı kullanımı — YASAK; `TenantViolationError`.
- **Erişim kararını üstlenme:** İmza talebine erişim iznini `k-signature`'ın vermesi — YASAK; izin PDP'nindir.
- **Sağlayıcı-özel API sızdırma:** Tek sağlayıcıya bağlı özelliği orkestrasyon sözleşmesine gömmek — YASAK; ortak `SignatureProvider` alt kümesi.
- **Senkron ağır akış:** Hatırlatma/yoklama/webhook'u istek yolunda işlemek — YASAK; `k-worker`'a offload.

## 15. Definition of Done

- §12'deki 12 test senaryosu yeşil (test-önce kanıtı: kırmızı→yeşil geçişi belgeli).
- `core-contract-pack` tenant + audit + indeks uyumu sağlandı; `check-core-contract.mjs` yeşil.
- Alembic migration downgrade CI'da çalışıyor.
- Sağlayıcı-agnostik akış SES/AES basit ve QES nitelikli (sandbox/stub) adaptörle uçtan-uca çalışıyor (create → sign → PAdES/XAdES/CAdES → RFC 3161 → kanıt); `k-signature` doğrudan sağlayıcı SDK'sı açmıyor.
- İmza tamamlanınca kanıt `k-evidence`'a yazılıyor (entegrasyon kanıtı); doküman `k-storage`'dan `AssetRef` ile alınıyor, imzalı çıktı `k-storage`'a yazılıyor.
- ADR-SIG1 "Kilitli" statüsünde (insan onayı); `k-signature` düğümü ve altındaki `archetype` düğümü WBS'te doğru `dependsOn` (`k-storage`, `k-provider-adapter`) ile mevcut.
- AI-guardrail testi: `draft`-dışı doğrudan send / QES seçimi / imza sırası kararı reddediliyor; nitelikli imzayı daima insan atıyor.
- Doküman `icerik-kalite-sozlesmesi` biçim kurallarına uyar (aktör-açık, emoji yok, her başlıkta nedir/yapar/yapmaz, her tablodan önce açıklama, şema tablolarında mock değer yok).

## 16. CLM E-Signature modülü karşılığı

Aşağıdaki tablo, bu sözleşmenin CLM (Contract Lifecycle Management) E-Signature modülü gereksinimlerini `k-signature` sözleşme öğelerine nasıl eşlediğini gösterir; her satır CLM'deki bir yeteneği kernel primitifine bağlar. CLM sözleşmenin *yaşam döngüsünü* (müzakere, onay, imza, yürürlük, yenileme) yönetir; imza adımını `k-signature`'dan tüketir, kendi imza motorunu açmaz.

| CLM E-Signature gereksinimi | k-signature karşılığı |
|---|---|
| Sözleşmeyi imzaya gönderme (envelope) | §5 `signature_request` (document=AssetRef, level, format, mode) |
| Çok taraflı sıralı/paralel imza | §5 `signer` (order, mode sequential/parallel/group) |
| İmza/paraf/tarih alanı yerleşimi | §5 `signature_field` (`SignatureField` page/x/y/w/h/kind) |
| Nitelikli imza (el-imzası eşdeğeri, QES) | §5 `level=qes`; §7 eIDAS seviye kapısı + nitelikli ESHS/QTSP |
| PAdES/XAdES/CAdES + zaman damgası | §5 `format` + `timestamping`; §7 format uygulaması + RFC 3161 |
| Uzun-dönem doğrulama/arşiv (LTV/LTA) | §5 `retention_profile`; §7 LTV/LTA profili |
| Kurumsal mühür (e-Seal, e-fatura mührü) | §5 `kind=seal`; §7 e-Seal akışı (`role=seal_holder`) |
| Vekil/delegated imza | §5 `signer.delegated_from`, `role=delegate`; §7 delegated yürütme |
| Alıcı kimlik doğrulama (email/sms-otp/mfa/sso/eid) | §5 `signer.auth`; §7 kimlik-doğrulama akışı |
| Gömülü imza + toplu gönderim | §7 embedded imza oturumu + bulk-send |
| İmza kanıtı / denetim izi (ispat) | §11 kanıt yazımı → `k-evidence` (append-only) |
| Türkiye 5070 + BTK-yetkili ESHS uyumu | §5 `jurisdiction=tr5070`; §7 seviye kapısı (yetkili ESHS) |
| İmza vadesi / hatırlatma | §5 `expires`; §11 `k-obligation` (vade) + `k-worker` (hatırlatma) |

## 17. Requirement-ID tablosu

Aşağıdaki tablo, bu sözleşmenin izlenebilir gereksinimlerini kimlik + katman + öncelik (P0–P3) + test türü + kabul + sahip ile listeler. Öncelik: P0 = bloklayıcı invariant, P1 = çekirdek, P2 = önemli, P3 = iyileştirme.

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| SIG-01 | `signature_request` çekirdek imza-talebi kaydı tenant-kapsamlı | Backend/Data | P0 | Integration | Talep tenant izolasyonlu yazılır/okunur | kernel-team |
| SIG-02 | Sağlayıcı-agnostik `SignatureProvider` (SES/AES/QES) `k-provider-adapter` üstünde | Backend | P0 | Integration | Aynı akış config ile çoklu sağlayıcıya çalışır | kernel-team |
| SIG-03 | Doğrudan sağlayıcı SDK app'te yasak; erişim `k-provider-adapter`'dan | Backend | P0 | Contract | Korumasız sağlayıcı erişimi yok | kernel-team |
| SIG-04 | eIDAS seviye kapısı (QES yalnız nitelikli ESHS/QTSP) | Backend/Compliance | P0 | Unit(neg) | Nitelikli-olmayana QES reddedilir | compliance |
| SIG-05 | Format uygulaması PAdES/XAdES/CAdES + `content_type` uyumu | Backend | P1 | Integration | Format doğru gömülür, uyumsuzluk reddedilir | kernel-team |
| SIG-06 | RFC 3161 zaman damgası + LTV/LTA profili | Backend/Compliance | P1 | Integration | Damga gömülür, LTV/LTA doğrulanır | compliance |
| SIG-07 | Akış modları (sequential/parallel/group) + delegated/vekil | Backend | P1 | Integration | Sıra/eşik/yetki-devri doğru yürür | kernel-team |
| SIG-08 | E-Seal (kurumsal mühür) akışı | Backend | P2 | Integration | Kurumsal mühür tek-taraflı tamamlanır | kernel-team |
| SIG-09 | Alıcı kimlik doğrulama (email/sms-otp/mfa/sso/eid) | Backend/Security | P1 | Integration | Doğrulama başarısız imza reddedilir | security-team |
| SIG-10 | İmza kanıtı `k-evidence`'a append-only yazımı | Backend/Data | P0 | Integration | Tamamlanan imza kanıtı yazılır | kernel-team |
| SIG-11 | Tenant-scoped imza akışı + RLS + cross-tenant reddi | Security | P0 | Integration(neg) | ≥10 cross-tenant negatif case reddedilir | security-team |
| SIG-12 | Akış mutasyonu audit (append-only) | Security | P0 | Integration | create/send/sign/void audit'e düşer | security-team |
| SIG-13 | Alembic expand-contract + dolu downgrade | Backend/DevOps | P1 | CI | `alembic downgrade -1` veri kaybetmez | kernel-team |
| SIG-14 | Strawberry/API resolver `permission_classes` zorunlu | Backend/API | P1 | Contract | Korumasız resolver yok | kernel-team |
| SIG-15 | Async I/O + `k-worker` offload (hatırlatma/yoklama/webhook) | Backend/Perf | P1 | Integration | Sağlayıcı çağrısı isteği bloklamaz | kernel-team |
| SIG-16 | AI alan-yerleşimi/özet `draft`; send/QES/sıra onay-zorunlu | AI-Governance | P0 | Integration | approval_ref'siz send/QES reddedilir | governance |
| SIG-17 | AI sağlayıcı/jurisdiction politikası değiştiremez (autonomy none) | AI-Governance | P0 | Unit | AI sağlayıcı/çerçeve kararı veremez | governance |
| SIG-18 | Frontend imza kurgu + alan yerleşim editörü config-driven | Frontend | P1 | E2E | UI imza verisinden türetilir, hardcoded sağlayıcı yok | ui-team |
| SIG-19 | Embedded imza deneyimi + bulk-send | Frontend/Backend | P2 | E2E | Gömülü imza ve toplu gönderim çalışır | ui-team |
| SIG-20 | WCAG 2.2 AA + i18n (seviye/format/mod/durum) + Phosphor | Frontend/A11y | P2 | A11y(axe) | axe critical=0; çok-dilli etiket | ui-team |
| SIG-21 | Türkiye 5070 + BTK-yetkili ESHS uyumu (`jurisdiction=tr5070`) | Compliance | P1 | Integration | TR çerçevesi + yetkili ESHS ile imza | compliance |
| SIG-22 | `k-signature` WBS düğümü doğru dependsOn (k-storage, k-provider-adapter) | Governance/WBS | P1 | CI(data-quality) | DAG geçerli, dangling yok | pmo |
