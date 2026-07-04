# ArcheType Mesajlaşma / Thread / Feed Yönergesi — Kanal, Thread, Mesaj, Tepki, Okundu-Bilgisi, Mention Metamodeli

**Sürüm:** 1.0 · **Tarih:** 2026-07-02
**Durum:** Taslak sözleşme (kilitlenmeyi bekliyor) — insan onayı ile kilitlenecek. 2026-07-02.
**Gerekçe:** `gap-2026-07-02-02-archetype.md` §4 **G-A5** şunu saptar: mesajlaşma/thread/feed metamodeli **hiç yoktur** (grep 0); kernel/archetype katmanında bu yapıyı besteleyen tek bir sözleşme bulunmuyor. Sosyal+video ürünü, Teams-benzeri iş-içi mesajlaşma ürünü ve e-posta ürünü — üçü de **yapısal temel** olarak kanal/thread/mesaj örgüsünü ister (P0); bu üçü olmadan her ürün kendi mesaj tablosunu yeniden icat eder (kernel'in "50 app × kendi implementasyonu = 50× hata" felsefesine aykırı, `archetype-eav-directive.md`/`archetype-tree-relation-directive.md` ile aynı gerekçe kalıbı).
**Kaynak/bağlam:** `gap-2026-07-02-02-archetype.md` §4 G-A5, `archetype-uretim-spec.md` (23-parçalı sözleşme ailesi + §12 v2 uzantıları), `archetype-eav-directive.md` (kardeş yönerge, ton/yapı referansı), `archetype-tree-relation-directive.md` (kardeş yönerge; thread'in kendi-içi yanıt-zinciri `tree`/`dag` deseniyle ilişkilidir), `k-worker-taskqueue-directive.md` (arka-plan iş: bildirim gönderimi, okundu-bilgisi toplu işleme, moderasyon kuyruğu), `event-replay-projection-contract.md` (olay tüketimi/idempotent-consumer sözleşmesi — gerçek-zamanlı fanout'un **önkoşulu**, ama fanout'un kendisi değil), `k-storage-dam-directive.md` (medya varlığı — mesaj eki bu primitife referans verir, kendi ikame etmez).
**Aktörler:** Mesaj gönderen kullanıcı (insan — uygulama son-kullanıcısı), moderatör (insan — içerik/güven ekibi), AI öneri motoru (draft; ör. moderasyon işareti, otomatik-yanıt taslağı), Motor (platform runtime), CI (GitHub Actions), tüketici uygulama (sosyal+video, Teams-benzeri, e-posta).

---

## 1. Amaç

"Bir kullanıcı bir kanalda/thread'de mesaj gönderir, başkaları görür, tepki verir, kimin okuduğu bilinir, birine mention (bahsetme) ile bildirim gider" sorusu **üç farklı ürün ailesinde** (sosyal+video, Teams-benzeri, e-posta) aynı çekirdek örgüyü ister — yüzey (surface) farklıdır (feed kartı vs. thread paneli vs. e-posta istemcisi), ama veri modeli aynıdır. Bu yönerge, mesajlaşmayı **kanal → thread → mesaj** üç-seviyeli hiyerarşiye oturtan, mesajı **değişmez** (immutable, düzenleme geçmişi tutulan) ve silmeyi **soft-delete** (yumuşak silme — satır fiziksel silinmez, görünürlük durumu değişir) ile tanımlayan bir metamodel sabitler. Aktör-açık ifade: *AI* moderasyon işareti veya otomatik-yanıt **önerir** (draft); *insan* moderasyon kararını ve mesaj silme onayını verir; *motor* mesajı deterministik uygular ve okundu-bilgisini senkronize eder; *CI* çapraz-tenant mesaj sızıntısını ve soft-delete sonrası erişimi bloklar.

## 2. Kapsam

Bu yönerge kapsar: (1) `channel` (kanal — mesajlaşmanın üst kapsayıcısı: bir DM, bir grup, bir yayın kanalı) veri modeli, (2) `thread` (bir kanal içinde bir konuşma dizisi/konu) veri modeli, (3) `message` (tekil mesaj — metin/medya-referans/yapılandırılmış içerik) veri modeli ve **değişmezlik + düzenleme-geçmişi** kuralı, (4) `reaction` (tepki — emoji/beğeni gibi kısa geri-bildirim) veri modeli, (5) `read_receipt` (okundu-bilgisi — kimin hangi mesaja kadar okuduğu) veri modeli, (6) `mention` (bahsetme — bir mesajın belirli bir aktörü işaretlemesi ve bildirim tetiklemesi) veri modeli, (7) soft-delete politikası ve silme-sonrası erişim kuralı, (8) WBS/bağımlılık yerleşimi, (9) multi-tenant/RLS, (10) AI guardrail (moderasyon typed action), (11) test stratejisi. Bir *yönerge* (mimari tarif) verir; implementasyon kodunu ajanlar `plan-01` promptuyla yazar.

## 3. Non-goals (kapsam dışı)

Bu yönerge şunları **yapmaz**: **(1) Gerçek-zamanlı fanout (canlı dağıtım)** — bir mesajın yazıldığı anda açık bağlantılara **anında** itilmesi (WebSocket/SSE tabanlı push) `k-event`/WebSocket primitifinin işidir; bu primitif kernelde **henüz yoktur** (`event-replay-projection-contract.md` yalnız olay-tüketim/idempotency/replay sözleşmesini verir, canlı-push mekanizmasını tanımlamaz). Bu yönerge yalnız mesajın **kalıcı veri sonucunu** tanımlar; canlı dağıtım ayrı bir kernel primitifi kilitlendiğinde ona `dependsOn` verecektir (§6). **(2) Medya transcode/varyant üretimi** — mesaj eki bir görsel/videoysa, onun sıkıştırma/boyutlandırma/format-dönüşümü `k-storage-dam-directive.md` (`digital_asset`/`asset_rendition`) ve `image_variants` işinin işidir; bu yönerge yalnız `message.attachment_ref`'in `digital_asset.id`'ye referans verdiğini tanımlar, binary işlemez. **(3) WebRTC (sesli/görüntülü çağrı)** — gerçek-zamanlı ses/video akışı **ayrı bir primitiftir**, bu yönergenin kapsamı dışıdır; bir "çağrı başladı" sistem-mesajı bu metamodelde bir `message.kind=system-event` satırı olabilir, ama çağrının kendisi (medya akışı, SDP/ICE) burada tanımlanmaz. **(4) Bildirim teslim kanalı (push/e-posta/SMS)** — bir mention'ın veya yeni mesajın kullanıcıya push-bildirim/e-posta olarak ulaştırılması `k-worker`'ın (arka-plan iş) ve ayrı bir bildirim-teslim primitifinin işidir; bu yönerge yalnız bildirimin **nedenini** (`mention`, yeni mesaj) veri olarak üretir, teslimi yürütmez. **(5) Moderasyon kural motoru** — hangi içeriğin otomatik işaretleneceği (spam/nefret-söylemi sınıflandırması) `k-computation`/AI sağlayıcının işidir; bu yönerge yalnız moderasyon **kararının** (`message.moderation_status`) veri sonucunu ve typed-action zincirini tanımlar, sınıflandırma algoritmasını üretmez. **(6) Arama/indeksleme algoritması** — mesaj içeriğinin tam-metin aranabilir olması `k-search`'ün işidir; bu yönerge mesajın aranabilir alanlarını (§5) beyan eder, indeksleme stratejisini üretmez.

## 4. Tanım (nedir / ne yapar / ne yapmaz)

**Nedir:** Mesajlaşma/thread/feed metamodeli, bir mesajın **kanal → thread → mesaj** hiyerarşisinde nerede yaşadığını, kimin ne zaman ne yazdığını (değişmez kayıt + düzenleme-geçmişi), kimin gördüğünü (okundu-bilgisi) ve kime seslendiğini (mention) tanımlayan sözleşmedir. "Kanal" (channel) = mesajlaşmanın en üst kapsayıcısı (bir bire-bir DM, bir grup sohbeti, bir yayın/duyuru kanalı, bir e-posta konuşma-zinciri); "thread" = bir kanal içinde odaklanmış bir konuşma dizisi (bir konuya yanıtların toplandığı alt-yapı; DM'de kanal=thread olabilir, forum/Teams-benzeri üründe bir kanalda çok thread olabilir); "mesaj" (message) = bir thread'e ait, göndereni ve içeriği olan tekil, değişmez kayıt birimi.

**Ne yapar:** Kanalı üyelik listesiyle (`channel_member`) sınırlar ve her mesajı bir kanal+thread bağlamına yerleştirir; her mesajı **değişmez** yazar — düzenleme yeni içerik üretmez, önceki içeriği `message_revision`'a taşıyıp görünen satırı günceller (düzenleme-geçmişi korunur, sessizce üzerine yazılmaz); silmeyi **soft-delete** ile yapar (satır fiziksel silinmez, `deleted_at` dolar, içerik erişim-kısıtlanır ama audit için saklanır); tepkiyi (`reaction`) mesaja bağlı, aktör-bazlı, tekil (bir aktör bir mesaja bir tepki-türünden bir kez) kayıt olarak tutar; okundu-bilgisini (`read_receipt`) her üye için "şu ana kadar okudum" imleci olarak taşır (mesaj-bazlı değil, thread-imleç bazlı — ölçeklenebilirlik); mention'ı ayrı bir tabloda tutar ve bildirim-tetikleyici olay üretir (teslimi yürütmez, §3).

**Ne yapmaz:** Gerçek-zamanlı dağıtım yapmaz (§3.1). Medya işlemez, yalnız referans taşır (§3.2). Sesli/görüntülü çağrı akışı taşımaz (§3.3). Bildirim teslim etmez (§3.4). Mesajı `UPDATE ... SET content = ...` ile sessizce üzerine yazmaz — her düzenleme `message_revision` satırı üretir. Silinen mesajı fiziksel `DELETE` ile kaybetmez — `deleted_at` + erişim-kuralı. Kanal/thread üyeliğini örtük varsaymaz — `channel_member` açık kayıttır, üye-olmayan aktör mesaj göremez. Moderasyon kararını AI'ın tek başına uygulamasına izin vermez — typed action + insan onayı (§10).

## 5. Sözleşme şekli — backend PostgreSQL + SQLAlchemy 2.0/SQLModel + Alembic + FastAPI

Aşağıdaki tablolar mesajlaşma metamodelinin veri şeklini alan adı + tip + amaç olarak tarif eder; dolu örnek/mock değer verilmez. Tipler PostgreSQL/SQLAlchemy 2.0 karşılıklarıdır. Stack: FastAPI + SQLAlchemy 2.0/SQLModel + Alembic + PostgreSQL; Next.js/Supabase/Prisma yasaktır (repo-genel stack kısıtı). RLS her tabloda zorunludur (§9).

### 5.1 `channel` (kanal)

Mesajlaşmanın en üst kapsayıcısıdır; bire-bir DM, grup sohbeti, yayın kanalı veya e-posta konuşma-zinciri hepsi bu tablonun `kind` alanıyla ayrışan örnekleridir.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Kanal benzersiz kimliği |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu; v1 §2.1 fail-closed zorunluluğu |
| `kind` | Enum(dm, group, broadcast, email-thread) | Kanal türü: bire-bir / grup / tek-yönlü yayın / e-posta zinciri |
| `name` | I18nText (nullable) | Görünen ad; bire-bir DM'de genelde NULL (karşı taraf adından türer) |
| `visibility` | Enum(private, restricted, public) | Kanalın görünürlüğü: yalnız üyelere / davetle-katılım / tenant-genel açık |
| `owner_id` | UUID (FK → actor) | Kanalı oluşturan/yöneten aktör; grup/broadcast'te yönetim yetkisinin başlangıcı |
| `archived_at` | TIMESTAMPTZ (nullable) | Arşivlenme anı; arşivlenmiş kanal salt-okunur olur, silinmez |
| `created_at` / `updated_at` | TIMESTAMPTZ (NOT NULL) | Audit alanları |

### 5.2 `channel_member` (kanal üyeliği)

Bir aktörün bir kanala erişim yetkisini taşır; mesaj görünürlüğünün **birincil kapısı** budur — üye-olmayan aktör mesaj göremez (§4).

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Üyelik kaydı kimliği |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu |
| `channel_id` | UUID (FK → channel) | Hangi kanal |
| `actor_id` | UUID (FK → actor) | Hangi aktör |
| `role` | Enum(owner, admin, member, guest) | Kanal-içi yetki seviyesi (silme/moderasyon yetkisi buradan türer) |
| `joined_at` | TIMESTAMPTZ (NOT NULL) | Katılım anı |
| `left_at` | TIMESTAMPTZ (nullable) | Ayrılma anı; NULL = hâlâ üye. Ayrılan üye geçmiş mesajları görebilir mi kuralı `visibility_after_leave` politikasıyla ayrı beyan edilir |
| `muted_until` | TIMESTAMPTZ (nullable) | Bildirim susturma süresi; okundu-bilgisini etkilemez, yalnız bildirim tetiklemesini durdurur |

Benzersizlik kısıtı `(tenant_id, channel_id, actor_id)` üzerinedir.

### 5.3 `thread` (thread)

Bir kanal içinde odaklanmış bir konuşma dizisidir. Bire-bir DM'de kanal=thread eşleniği tek bir örtük thread ile temsil edilebilir; forum/Teams-benzeri üründe bir kanalda çok thread olur.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Thread benzersiz kimliği |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu |
| `channel_id` | UUID (FK → channel) | Hangi kanala ait |
| `root_message_id` | UUID (FK → message, nullable) | Thread'i başlatan kök mesaj; NULL = kanalın örtük ana-thread'i |
| `subject` | I18nText (nullable) | Konu başlığı (özellikle e-posta-zinciri kind'ında zorunlu benzeri kullanılır) |
| `status` | Enum(open, resolved, archived) | Thread yaşam döngüsü (Teams-benzeri "çözüldü" işaretleme senaryosu) |
| `last_message_at` | TIMESTAMPTZ (nullable) | Sıralama/özet için denormalize alan; kaynak-of-truth değil, `message.created_at`'tan senkronize edilir |
| `created_at` / `updated_at` | TIMESTAMPTZ (NOT NULL) | Audit alanları |

### 5.4 `message` (mesaj — değişmez + düzenleme-geçmişi)

Bu yönergenin çekirdek tablosudur. Bir satır bir mesajın **güncel görünen halini** taşır; geçmiş halleri `message_revision`'da saklanır (§5.5). Mesaj satırı fiziksel silinmez — soft-delete (§5.4 `deleted_at`).

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Mesaj benzersiz kimliği |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu |
| `channel_id` | UUID (FK → channel) | Hangi kanalda (denormalize; sorgu hızlandırma, `thread.channel_id` ile tutarlı olmak zorunda) |
| `thread_id` | UUID (FK → thread) | Hangi thread'de |
| `author_id` | UUID (FK → actor, nullable) | Gönderen aktör; NULL = sistem-mesajı (`kind=system-event`) |
| `kind` | Enum(text, media, structured, system-event) | Mesaj türü: serbest metin / medya-ekli / yapılandırılmış (form/kart) / sistem-olayı |
| `body` | Text (nullable) | Metin içeriği; `kind=text` iken zorunlu dolu |
| `attachment_ref` | UUID (nullable, FK → `k-storage` `digital_asset.id`) | Medya eki referansı; binary burada taşınmaz (§3.2) |
| `reply_to_message_id` | UUID (nullable, self-FK) | Bu mesajın doğrudan yanıtladığı mesaj; thread-içi yanıt-zinciri (`archetype-tree-relation-directive.md` `tree` deseniyle isteğe bağlı ilişkilendirilebilir, §6) |
| `edited_at` | TIMESTAMPTZ (nullable) | Son düzenlenme anı; NULL = hiç düzenlenmedi. Dolu ise istemci "düzenlendi" göstergesini bu alandan türetir |
| `deleted_at` | TIMESTAMPTZ (nullable) | Soft-delete anı; NULL = aktif. Dolu ise içerik erişim-kısıtlıdır (§4, §7) |
| `deleted_by` | UUID (nullable, FK → actor) | Silme işlemini yapan aktör (kendi mesajı veya moderatör) |
| `moderation_status` | Enum(clean, flagged, hidden) | Moderasyon durumu; `flagged`/`hidden` AI-draft + insan-onay zinciriyle değişir (§10) |
| `created_at` | TIMESTAMPTZ (NOT NULL) | İlk yazılma anı; **immutable**, düzenlemede değişmez |

**Değişmezler (invariant):**
- **Değişmez içerik + düzenleme-geçmişi:** `message.body` doğrudan `UPDATE` ile değişebilir (görünen-güncel-hal budur), **ama** her değişiklikten önce eski `body` bir `message_revision` satırına yazılır — yani "mesaj değişmez" ilkesi *tarihçe hiç kaybolmaz* anlamındadır, güncel satır sabit-donmuş değildir. Düzenleme geçmişi olmadan `body` değişimi CI'da reddedilir (§8 senaryo).
- **Soft-delete:** `deleted_at` dolduğunda `body`/`attachment_ref` uygulama katmanında erişime kapanır (moderatör/audit dışı görünüm boş/"[silindi]" placeholder döner), ama satır ve `message_revision` geçmişi veritabanında kalır — fiziksel `DELETE` yasaktır (legal-hold/audit gereksinimiyle uyumlu).

### 5.5 `message_revision` (mesaj düzenleme-geçmişi)

Bir mesajın her önceki halini append-only saklar; `message.body` güncellenmeden önce buraya bir satır yazılması zorunludur.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Revizyon kaydı kimliği |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu |
| `message_id` | UUID (FK → message) | Hangi mesajın geçmişi |
| `body` | Text | O andaki (değiştirilmeden önceki) içerik |
| `revised_at` | TIMESTAMPTZ (NOT NULL) | Bu halin ne zamana kadar geçerli olduğu |
| `revision_number` | Integer (>= 1) | Sıra numarası; `(tenant_id, message_id, revision_number)` benzersiz |

### 5.6 `reaction` (tepki)

Bir aktörün bir mesaja verdiği kısa geri-bildirimdir (emoji/beğeni); bir aktör bir mesaja bir tepki-türünden yalnız bir kez tepki verebilir.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Tepki kaydı kimliği |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu |
| `message_id` | UUID (FK → message) | Hangi mesaja |
| `actor_id` | UUID (FK → actor) | Kim tepki verdi |
| `emoji_code` | Text (NOT NULL) | Kanonik emoji/tepki kodu (Unicode CLDR kısa-ad; serbest string değil, kapalı/kanonik küme) |
| `created_at` | TIMESTAMPTZ (NOT NULL) | Tepki anı |

Benzersizlik kısıtı `(tenant_id, message_id, actor_id, emoji_code)` üzerinedir: aynı aktör aynı mesaja aynı emojiyle iki kez tepki veremez (tekrar istek = idempotent no-op veya toggle-kaldırma, uygulama kararı).

### 5.7 `read_receipt` (okundu-bilgisi)

Ölçeklenebilirlik nedeniyle **mesaj-bazlı değil, thread-imleç bazlıdır**: her üye için "bu thread'de şu mesaja/ana kadar okudum" tek bir satır tutulur — her mesaj için her üyeye ayrı satır açmak (N-üye × M-mesaj) patlar.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Okundu-bilgisi kaydı kimliği |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu |
| `thread_id` | UUID (FK → thread) | Hangi thread |
| `actor_id` | UUID (FK → actor) | Hangi üye |
| `last_read_message_id` | UUID (FK → message) | Bu üyenin okuduğu son mesaj (bu mesaj ve öncesi okunmuş sayılır) |
| `last_read_at` | TIMESTAMPTZ (NOT NULL) | Okuma anı |

Benzersizlik kısıtı `(tenant_id, thread_id, actor_id)` üzerinedir: bir üyenin bir thread'de tek imleç satırı olur, güncellenir (bu satır append-only değildir — yalnız ileri hareket eder, geri gitmez; motor `last_read_message_id`'nin kronolojik olarak geriye gitmesini reddeder).

### 5.8 `mention` (bahsetme)

Bir mesajın belirli bir aktörü işaretlediği ve bildirim-tetikleyici olduğu kayıttır; bildirimin kendisini teslim etmez (§3.4), yalnız "bu aktör bu mesajda anıldı" veri-gerçeğini üretir.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Mention kaydı kimliği |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu |
| `message_id` | UUID (FK → message) | Hangi mesajda |
| `mentioned_actor_id` | UUID (FK → actor, nullable) | Kim anıldı; NULL = özel mention türü (`kind=everyone/here`) |
| `kind` | Enum(user, everyone, here) | Bahsetme türü: tekil kullanıcı / kanaldaki herkes / şu an aktif olanlar |
| `notified_at` | TIMESTAMPTZ (nullable) | Bildirim-tetikleyici olayın üretildiği an; NULL = henüz tetiklenmedi (k-worker kuyruğunda) |

## 6. WBS / bağımlılık (dependsOn / related)

Bu yönerge `archetype-messaging` düğümünü kernel/layer0'ın archetype kümesinde açar; `wbs-field-semantics.md`'ye uyar: `dependsOn` = teknik/yürütme sırası (kritik yol, DAG), `related` = yalnız gezinme (karar üretmez). Aşağıdaki tablo düğüm yerleşimini ve bağımlılığını tanımlar.

| Düğüm | Seviye | dependsOn | Küme |
|---|---|---|---|
| `archetype-messaging` | archetype | `k-schema`, `k-tenancy`, `k-worker` | archetype |

`dependsOn` gerekçesi: (1) `k-schema`/`k-tenancy` — her tablo şema temeline ve tenant kolonuna bağlıdır. (2) **`k-worker`** (`k-worker-taskqueue-directive.md`) — mention bildirim-tetikleme, okundu-bilgisi toplu senkronizasyonu ve moderasyon kuyruğu işlemesi **arka-plan iş**dir (§2 `ai_enrichment`/`sync` türleri); bu işleri HTTP isteği içinde senkron çalıştırmak k-worker'ın Amaç bölümünün doğrudan yasakladığı anti-pattern'dir (§13 tablosu "İşi HTTP handler'ında blocking çalıştırmak").

**Gerçek-zamanlı primitif — EKSİK, belirtilir:** Bu yönerge, mesajın **anlık dağıtımını** (bir kullanıcı mesaj yazdığında açık bağlantılara canlı push) `k-event`/WebSocket primitifine `dependsOn` vermek **isterdi**, ama bu primitif kernelde **henüz tanımlı değildir**. `event-replay-projection-contract.md` yalnız olay-**tüketim** (consumer/idempotent/DLQ/replay) sözleşmesini verir — bir olayın *var olduktan sonra* nasıl güvenilir tüketileceğini tanımlar, ama bir mesajın yazıldığı anda WebSocket/SSE üzerinden **canlı** dağıtılmasını (fanout) tanımlamaz. Bu, `gap-2026-07-02-02-archetype.md`'nin doğrudan işaret ettiği bir kernel-boşluğudur: mesajlaşma ürünleri (Teams-benzeri, sosyal+video canlı-feed) bu primitif olmadan yalnız **polling** (periyodik sorgu) veya *app-katmanında yeniden icat edilen* WebSocket sunucusuyla çalışabilir — ikisi de geçicidir. Bu yönerge kilitlendiğinde ve gerçek-zamanlı fanout primitifi (`k-realtime` veya eşdeğeri) kernel'e eklendiğinde, `archetype-messaging` o düğüme `dependsOn` ekler; bugün bu bağ **bilinçli olarak boş bırakılır**, sessizce varsayılmaz.

**`related` (karar üretmeden gezinme):** `archetype-tree-relation-directive` (`message.reply_to_message_id` yanıt-zinciri isteğe bağlı `tree`/`dag` deseniyle modellenmek istenirse), `k-storage-dam-directive` (`attachment_ref` hedefi), `k-search` (mesaj tam-metin arama indeksi), `archetype-eav-directive` (kanal/thread'e özel dinamik ayar alanı gerekirse EAV kullanılabilir, mesaj gövdesi için değil).

**Scale-invariant [messaging]:** Mention bildirim-tetikleme ve okundu-bilgisi senkronizasyonu, `k-worker`'ın `idempotency_key` mekanizmasını (`k-worker-taskqueue-directive.md` §5.1) kullanır; aynı mesajın worker-retry'de iki kez bildirim üretmesi (çift-bildirim) veya `read_receipt`'in retry'de geri gitmesi engellenir — bu, scale-invariant ailesinin (çift-etki sınıfı) mesajlaşmadaki somut karşılığıdır.

## 7. Multi-tenant + AI guardrail

**Multi-tenant:** Her tablo (`channel`, `channel_member`, `thread`, `message`, `message_revision`, `reaction`, `read_receipt`, `mention`) `tenant_id` taşır ve fail-closed çalışır (bağlam yoksa istek reddedilir, v1 §2.1). Cross-tenant sorgu girişimi `TenantViolationError` fırlatır ve audit'lenir. İkinci bariyer PostgreSQL RLS: `USING (tenant_id = current_setting('app.current_tenant')::uuid)` her sekiz tabloda etkindir. **Kanal-üyeliği tenant-içi ikinci bir daraltmadır:** RLS tenant sınırını korur, ama bir tenant-içi kullanıcının *üye olmadığı* bir kanalın mesajlarını görmesi de ayrıca `channel_member` join'iyle engellenir — iki bariyer birbirinin yerine geçmez (tenant izolasyonu ≠ kanal-üyelik izolasyonu).

**Arka-plan işler (k-worker bağı):** Mention bildirim-tetikleme ve moderasyon-kuyruğu işlemesi `k-worker-taskqueue-directive.md` §2 `ai_enrichment`/`sync` türünde tenant-scoped `Job` olarak koşar (§8 tenant-adalet ile aynı zarf); bir tenant'ın büyük broadcast-kanalının bildirim hacmi komşu tenant'ın mesaj-teslimini geciktiremez (noisy-neighbor koruması, k-worker §8).

**AI guardrail:** Dört-aktör iş bölümü değiştirilemezdir: **AI önerir → insan onaylar → motor uygular.**

| İşlem | Autonomy | Kural |
|---|---|---|
| Moderasyon işareti **önerme** (`moderation_status=flagged` adayı) | `draft` | AI şüpheli içeriği tespit edip işaret **önerir**; doğrudan `flagged`/`hidden`'a çeviremez |
| Moderasyon kararı **uygulama** (`message.moderation_status` değişimi) | onay-zorunlu | `approval_ref` (insan/moderatör) olmadan `ApprovalRequiredError`; typed action ile yazılır, generated CRUD ile değil |
| Otomatik-yanıt/asistan mesajı taslağı önerme | `draft` | AI bir thread'de yanıt taslağı önerebilir (`kind=text`); insan onaylamadan `author_id` insan gibi görünecek şekilde gönderilemez — AI-üretimi mesaj açıkça işaretlenir |
| Mesaj silme (soft-delete) — kendi mesajı | otomatik (motor, sahip yetkisi) | Aktörün kendi mesajını silmesi AI kararı değildir; motor typed-action ile doğrudan uygular (yetki kontrolü `channel_member.role` üzerinden) |
| Mesaj silme (soft-delete) — moderatör tarafından başkasının mesajı | onay-zorunlu (insan moderatör) | AI tek başına başkasının mesajını silemez; moderatör kararı gerekir |
| `message`/`message_revision` fiziksel silme | `none` | Soft-delete invariant; AI dahil hiçbir aktör satırı fiziksel silemez, yalnız `deleted_at` typed-action ile dolar |

Mutlak sınırlar: AI main branch'e push edemez; `channel`/`message` şemasını genişletemez (yeni alan = migration = insan onaylı PR); soft-delete kısıtını (`deleted_at` yerine `DELETE`) devre dışı bırakamaz; moderasyon kararını insan onayı olmadan uygulayamaz; başka bir aktör adına mesaj gönderemez (`author_id` sahteciliği); kanıtsız "moderasyon tamamlandı" diyemez.

## 8. Test stratejisi (test-önce, negatif testler dahil)

Test-önce zorunludur (önce kırmızı, sonra yeşil). Aşağıdaki tablo test senaryosunu türüyle eşler; negatif testler bu yönergenin invariant setinin CI kapısıdır.

| # | Senaryo | Tür |
|---|---|---|
| 1 | Çapraz-tenant mesaj sızıntısı reddi: A tenant'ının kullanıcısı B tenant'ının kanal/thread/mesajına sorgu/erişim girişiminde bulunamıyor (≥10 negatif case) | Integration (negatif) |
| 2 | Kanal-üyelik izolasyonu: tenant-içi ama `channel_member` olmayan aktör kanalın mesajlarını göremiyor | Integration (negatif) |
| 3 | Düzenleme-geçmişi: `message.body` her `UPDATE`'ten önce `message_revision`'a eski hal yazılıyor; geçmişsiz `body` değişimi reddediliyor | Integration |
| 4 | Soft-delete sonrası erişim: `deleted_at` dolu mesajın içeriği normal-kullanıcı görünümünde erişilemez, ama satır ve `message_revision` veritabanında kalıyor (fiziksel silme yok) | Integration (negatif) |
| 5 | Soft-delete audit erişimi: moderatör/audit rolü, soft-delete edilmiş mesajın içeriğini denetim amaçlı görebiliyor (normal kullanıcı göremiyor ile çelişmiyor) | Integration |
| 6 | Read-receipt tutarlılığı: `last_read_message_id` yalnız kronolojik olarak ileri gidiyor; geriye giden güncelleme reddediliyor | Unit (negatif) |
| 7 | Read-receipt ölçek: N üyeli thread'de M mesaj sonrası okundu-sorgusu N×M satır değil N satır (imleç modeli) ile çözülüyor | Performans |
| 8 | Tepki tekilliği: aynı aktör aynı mesaja aynı emoji ile ikinci kez tepki verince ikinci satır oluşmuyor (idempotent/toggle) | Unit |
| 9 | Mention bildirim-tetikleme idempotency: worker-retry aynı mention için ikinci kez bildirim-olayı üretmiyor (çift-bildirim yok) | Integration (scale-invariant) |
| 10 | Mention `everyone`/`here` yalnız yetkili rol (`admin`/`owner`) tarafından tetiklenebiliyor; `member`/`guest` denemesi reddediliyor | Unit (negatif) |
| 11 | Moderasyon typed-action: `approval_ref`'siz `moderation_status` değişimi reddediliyor | Integration (negatif) |
| 12 | AI-üretimi mesaj işaretlemesi: AI-draft yanıt insan onayı olmadan normal kullanıcı mesajı gibi görünmüyor | Integration |
| 13 | Thread durum geçişi: `status=resolved`/`archived` geçişinde mevcut mesajlar değişmeden kalıyor, yeni mesaj `archived` thread'e engelleniyor (politika beyanına göre) | Integration |

## 9. Kabul kriterleri (Acceptance criteria)

- AC-1: `channel`/`channel_member`/`thread`/`message`/`message_revision`/`reaction`/`read_receipt`/`mention` §5 tablolarıyla uyumlu.
- AC-2: `message.body` değişimi her zaman bir `message_revision` satırı üretiyor; geçmişsiz değişim reddediliyor (§8 senaryo 3).
- AC-3: Soft-delete fiziksel `DELETE`'in yerini tam alıyor; silinen mesaj normal görünümde erişilemez ama audit/moderatör görünümünde ve veritabanında kalıyor (§8 senaryo 4-5).
- AC-4: Read-receipt thread-imleç modeliyle N-üye ölçeğinde çalışıyor, geriye gitmiyor (§8 senaryo 6-7).
- AC-5: Çapraz-tenant ve kanal-üyelik izolasyonu ≥10 negatif case ile kanıtlı (§8 senaryo 1-2).
- AC-6: Mention bildirim-tetikleme idempotent; worker-retry çift-bildirim üretmiyor (§8 senaryo 9, scale-invariant uyumu).
- AC-7: Moderasyon kararı yalnız typed-action + `approval_ref` ile uygulanıyor; AI doğrudan yazamıyor (§8 senaryo 11-12).
- AC-8: Gerçek-zamanlı fanout primitifinin eksikliği dokümante edilmiş ve bu yönergenin `dependsOn` grafiğinde açıkça boş bırakılmış (sessizce varsayılmamış, §6).

## 10. Anti-patterns (yasak desenler)

- **Mesajı sessizce üzerine yazmak:** `message.body`'yi `message_revision` üretmeden `UPDATE` etmek — YASAK; her düzenleme geçmişe yazılır.
- **Fiziksel silme:** Silinen mesajı `DELETE FROM message` ile kaybetmek — YASAK; `deleted_at` soft-delete zorunlu (audit/legal-hold gereksinimi).
- **Mesaj-bazlı okundu-bilgisi:** Her mesaj için her üyeye ayrı `read_receipt` satırı açmak — YASAK; thread-imleç modeli (N×M değil N).
- **Üyeliksiz erişim varsayımı:** `channel_member` kontrolü yapmadan tenant-içi herkesin her kanalı görmesine izin vermek — YASAK; üyelik açık kayıttır, ikinci bariyer.
- **Kanalsız/thread'siz mesaj:** Bir mesajı doğrudan aktörler-arası, kanal/thread bağlamı olmadan yazmak — YASAK; her mesaj bir `thread_id`+`channel_id` taşır.
- **Emoji'yi serbest string yapmak:** `reaction.emoji_code`'u doğrulamasız serbest metin bırakmak — YASAK; kanonik/kapalı küme.
- **Gerçek-zamanlı fanout'u app-katmanında yeniden icat etmek:** Her mesajlaşma app'inin kendi WebSocket sunucusunu açması — YASAK (bugün için primitif eksik, ama "her app kendi çözer" kernel felsefesine aykırı); primitif kilitlenene dek bu boşluk açıkça işaretlenir, sessizce doldurulmaz.
- **Worker-retry'de çift-bildirim:** Mention işleme retry'de ikinci kez bildirim-olayı üretmesine izin vermek — YASAK; idempotency kısıtı zorunlu (§6 scale-invariant).
- **AI'ın doğrudan moderasyon uygulaması:** `approval_ref`'siz `moderation_status` değişimi — YASAK; `ApprovalRequiredError`.
- **AI mesajını insan gibi göstermek:** AI-üretimi yanıtı `author_id`'de insan aktör gibi işaretsiz göndermek — YASAK; AI-üretimi mesaj açıkça ayrışır.
- **Tenant sınırını kanal join'inde gevşetmek:** `message`→`channel` join'inde yalnız `channel_id` eşleşmesine güvenip `tenant_id`'yi tekrar doğrulamamak — YASAK; her iki tarafta tenant kontrolü.

## 11. DoD (Definition of Done)

- §8'deki 13 test senaryosu yeşil (test-önce kanıtı: kırmızı→yeşil belgeli).
- Değişmezlik+düzenleme-geçmişi, soft-delete ve read-receipt-ölçek invariant'ları kanıtlanmış (§8 senaryo 3-7).
- Çapraz-tenant ve kanal-üyelik izolasyonu ≥10 negatif case ile yeşil (§8 senaryo 1-2).
- Alembic migration downgrade CI'da çalışıyor (`alembic downgrade -1`).
- `core-contract-pack` tenant + audit + RLS uyumu sağlandı.
- `k-worker` entegrasyonu (mention bildirim-tetikleme, moderasyon kuyruğu) idempotent ve tenant-adaletli kanıtlanmış.
- Gerçek-zamanlı fanout primitifinin eksikliği WBS'te açıkça belirtilmiş; sessizce varsayılan bir "WebSocket zaten var" iddiası yok.
- Sosyal+video, Teams-benzeri, e-posta tüketici akışlarından en az birinin (kanal→thread→mesaj→okundu) uçtan uca kanıtlanmış.
- AI-guardrail testi: `draft`-dışı doğrudan moderasyon/soft-delete-atlama reddediliyor.
- Doküman `icerik-kalite-sozlesmesi` biçim kurallarına uyar (emoji yok, her başlıkta nedir/yapar/yapmaz, her tablodan önce açıklama, mock veri yok).

## 12. Requirement-ID tablosu

Aşağıdaki tablo, bu yönergenin izlenebilir gereksinimlerini kimlik + katman + öncelik (P0–P3) + test türü + kabul + sahip ile listeler. Öncelik: P0 = bloklayıcı invariant, P1 = çekirdek, P2 = önemli, P3 = iyileştirme.

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| MSG-01 | `channel`/`channel_member`/`thread`/`message`/`message_revision`/`reaction`/`read_receipt`/`mention` şeması (§5) | Backend/Data | P0 | Unit | AC-1 | kernel-team |
| MSG-02 | Düzenleme-geçmişi: `body` değişimi öncesi `message_revision` zorunlu | Backend | P0 | Integration | AC-2 | kernel-team |
| MSG-03 | Soft-delete: fiziksel `DELETE` yasak, `deleted_at` + erişim-kısıtlama | Backend/Security | P0 | Integration(neg) | AC-3 | kernel-team |
| MSG-04 | Read-receipt thread-imleç modeli (N-üye ölçek, N×M değil) | Backend/Data | P1 | Performans | AC-4 | data-team |
| MSG-05 | Read-receipt yalnız ileri gider (kronolojik geri-gitme reddi) | Backend | P1 | Unit(neg) | AC-4 | kernel-team |
| MSG-06 | Çapraz-tenant izolasyonu + RLS ikinci bariyer (≥10 negatif case) | Security | P0 | Integration(neg) | AC-5 | security-team |
| MSG-07 | Kanal-üyelik ikinci daraltma (tenant-içi ama üye-olmayan reddi) | Security | P0 | Integration(neg) | AC-5 | security-team |
| MSG-08 | Tepki tekilliği (`tenant,message,actor,emoji_code` benzersiz) | Backend/Data | P1 | Unit | — | data-team |
| MSG-09 | Mention bildirim-tetikleme idempotent (k-worker, scale-invariant) | Backend | P0 | Integration | AC-6 | kernel-team |
| MSG-10 | Mention `everyone`/`here` yetki-kısıtlı (`admin`/`owner`) | Backend/Security | P1 | Unit(neg) | — | security-team |
| MSG-11 | Moderasyon typed-action + `approval_ref` zorunlu | AI-Governance | P0 | Integration(neg) | AC-7 | governance |
| MSG-12 | AI-üretimi mesaj açık işaretleme (insan-taklidi yasak) | AI-Governance | P0 | Integration | AC-7 | governance |
| MSG-13 | Gerçek-zamanlı fanout primitifi eksikliği WBS'te açık `dependsOn` boşluğu | Governance/WBS | P1 | CI(data-quality) | AC-8 | pmo |
| MSG-14 | Alembic expand-contract + dolu downgrade | Backend/DevOps | P1 | CI | — | kernel-team |
| MSG-15 | `archetype-messaging` WBS düğümü doğru `dependsOn` (k-schema, k-tenancy, k-worker) | Governance/WBS | P1 | CI(data-quality) | — | pmo |

---

*Kaynak yönerge: `gap-2026-07-02-02-archetype.md` §4 G-A5. Kardeş sözleşmeler: `archetype-eav-directive.md` (dinamik öznitelik — kanal/thread ayarı için opsiyonel, mesaj gövdesi için değil), `archetype-tree-relation-directive.md` (`message.reply_to_message_id` yanıt-zinciri için opsiyonel `tree`/`dag` deseni). Bağlı primitifler: `k-worker-taskqueue-directive.md` (mention/moderasyon arka-plan işi), `event-replay-projection-contract.md` (olay-tüketim sözleşmesi — gerçek-zamanlı fanout'un önkoşulu, kendisi değil), `k-storage-dam-directive.md` (medya eki referansı). Bu doküman hiçbir kod/şema/JSON dosyasına dokunmaz; yalnız yönerge metnidir. Çelişki halinde `core-contract-pack.md` (kernel runtime) önceliklidir. Sözleşmeyi değiştirme yetkisi yalnız insan onayındadır; AI bu dosyayı doğrudan güncelleyemez.*
