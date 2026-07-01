# ArcheType Taksonomi Yönergesi — Uluslararası Standart Bağlama (ETIM/UNSPSC/GPC/GS1)

Sürüm: 1.0 — 2026-07-01 · Durum: Taslak yönerge (kilitlenmeyi bekliyor — bkz. §7 WBS + `docs/adr-A4-computation.md` GTIN/GLN checksum bağı).
Kaynak/bağlam: `docs/archetype-uretim-spec.md` §12.B (attribute-set/EAV), §12.C (tree relation), §12.A.4 (Computation), `docs/reference/PIM-v2-Gereksinim-Analizi.md` §Faz 3 (Taksonomi + Öznitelik önerisi) + §Faz 10 (GS1/GDSN), `plan-03-yeni-yonergeler-2026-07-01.md` §3.4 (Computation — GS1 validasyonu).
Aktörler: Taksonomi sahibi (insan — veri yönetişimi/uyum ekibi), AI öneri motoru (swarm), Motor (platform runtime), CI (GitHub Actions), tüketici uygulama (PIM Product/Family/Variant).
Bu doküman *sözleşme/mimari tarif* verir — implementasyon kodu `platform` reposunda yazılır. Kod yazmaz; alan adı + tip + amaç verir, dolu örnek (mock) veri vermez.

---

## 1. Amaç

Bu yönerge, bir ArcheType'ın (öncelikle Product) uluslararası taksonomi standartlarına (ETIM = ELektroteknik ürün sınıflandırma; UNSPSC = United Nations Standard Products and Services Code; GPC = Global Product Classification) veri-olarak nasıl bağlanacağını ve GS1 tanımlayıcılarının (GTIN = Global Trade Item Number; GLN = Global Location Number) nasıl doğrulanacağını sabitler. Hedef: 120 DocType'lık PIM portföyünün her ürünü, sınıflandırmayı koda gömmek yerine `Taxonomy` + `TaxonomyNode` kayıtlarına referans versin; sınıflandırma bir standart-ID ile taşınabilir, çok-standartlı (aynı ürün ETIM + UNSPSC + GPC) ve düğüm-başına öznitelik-önerili olsun. GS1 GTIN/GLN, string'e sıkışmış numara değil, checksum-doğrulanmış tanımlayıcı olsun. Aktör-açık ifade: *AI* kategori önerir (draft); *insan* onaylar; *motor* onaylı düğüm bağını kaydeder ve önerilen öznitelikleri türetir.

## 2. Kapsam

Bu yönerge şunları kapsar: (1) `Taxonomy` (standart kayıt defteri) ve `TaxonomyNode` (ağaç düğümü) veri modelinin alan yapısı, (2) desteklenen standartlar — ETIM | UNSPSC | GPC | GS1 — ve her birinin node-kodu (class/segment/brick kodu) biçimi, (3) düğüm-başına önerilen öznitelik (`node → attribute`) eşlemesi, (4) GTIN/GLN validasyon kuralı (GS1 mod-10 checksum), (5) bağlamanın üç ekseni — tree-relation (ağaç yerleşimi), variant/attribute/family (önerilen öznitelik akışı), Computation (GTIN/GLN checksum türetmesi), (6) `k-taxonomy` düğümünün WBS yerleşimi, (7) çok-kiracılı izolasyon, AI-guardrail, test ve DoD gereksinimleri. PIM-v2 Özellik 13 (Taksonomi), 14 (Öznitelik önerisi) ve 33 (GS1/GDSN) bu yönergeye eşlenir.

## 3. Non-goals (kapsam dışı)

Bu yönerge şunları **yapmaz**: **(1)** Yeni FieldType tanımlamaz — `i18n-text`/`measure`/`attribute-set` tipleri `archetype-uretim-spec §12.B`'de (girdi olarak alınır). **(2)** Öznitelik değerini üretmez veya doğrulamaz — düğüm yalnız *hangi* özniteliklerin *önerildiğini* söyler; değer validasyonu ArcheType `validationRule`'un işidir. **(3)** GDSN veri-havuzu senkronizasyonunu (CIN/CIP/RCI) kodlamaz — GDSN bir tüketici entegrasyonudur (`gdsn_sync` portu, Faz 10); bu yönerge yalnız GTIN/GLN tanımlayıcı biçimini ve checksum'unu tanımlar. **(4)** GTIN/GLN checksum *hesabını* kendi yazmaz — hesap `k-computation` primitifine (`docs/computation-derivation-contract.md`) referans verir; bu yönerge yalnız kuralı ve bağlamayı beyan eder. **(5)** ECA/otomasyon değildir — kategori değişimi bir event→action zinciri değil, veri-referans değişimidir. **(6)** AI'ya kategori *uygulama* yetkisi vermez — AI önerir, insan onaylar (`archetype-uretim-spec §3` aynen geçerli).

## 4. Tanım (nedir / yapar / yapmaz)

**Nedir:** `k-taxonomy`, bir ArcheType'ı uluslararası sınıflandırma standartlarına (ETIM/UNSPSC/GPC) ağaç-düğüm referansıyla bağlayan ve GS1 tanımlayıcılarının (GTIN/GLN) checksum kuralını taşıyan kernel kayıt defteridir. Sınıflandırma koda değil veriye yazılır (`archetype-uretim-spec §7` "serbest kod yok" ilkesinin taksonomi karşılığı).

**Ne yapar:** Bir standardı (`Taxonomy`) ve onun düğümlerini (`TaxonomyNode`, özyinelemeli ağaç) veri olarak tutar; bir ürünü bir düğüme (ör. ETIM class `EC010101`) bağlar; düğüm-başına önerilen öznitelik setini (`node → attribute`) çözer; aynı ürünün birden çok standartta (ETIM + UNSPSC + GPC) sınıflandırılmasına izin verir; GTIN/GLN tanımlayıcısını GS1 mod-10 checksum'ıyla doğrular; her sınıflandırma değişimini audit'ler.

**Ne yapmaz:** Sınıflandırmayı koda gömmez (`if category == "cable"` yerine `taxonomy_node` referansı — veridir). Öznitelik *değerini* üretmez/doğrulamaz (yalnız *öneri* verir; değer ArcheType validation'ın işi). Yetki kararı vermez (o PDP'nin işi). GDSN senkronunu yürütmez. Bir ürünü tek bir standarda kilitlemez — çok-standartlı sınıflandırma (aynı ürün, farklı sözlükte farklı kod) çekirdek özelliktir. AI'nın önerdiği kategoriyi otomatik uygulamaz — insan onayı zorunludur.

## 5. Sözleşme şekli (alan | tip | amaç)

Aşağıdaki üç tablo `k-taxonomy` primitifinin veri şeklini yalnız *alan adı + tip + amaç* olarak tarif eder; dolu örnek/mock değer verilmez. Tipler PostgreSQL/SQLAlchemy 2.0 karşılıklarıdır.

Bu tablo `taxonomy` standart kayıt defterinin alanlarını tanımlar; her satır bir uluslararası sınıflandırma sözlüğüdür:

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Taksonomi (sözlük) benzersiz kimliği |
| `tenant_id` | UUID (indexed, nullable) | null = platform-katman (ETIM/UNSPSC/GPC ortak sözlük); dolu = tenant-özel sözlük; v1 §2.1 fail-closed |
| `standard` | Enum(etim, unspsc, gpc, gs1, custom) | Sınıflandırma standardı; node-kodu biçimini bu belirler |
| `version` | Text | Standart sürümü (ör. ETIM-9.0, UNSPSC-26.0801, GPC-Dec-2024); düğüm kodları versiyona bağlıdır |
| `name` | I18nText | Sözlüğün insan-okur adı (çok-dilli) |
| `code_pattern` | Text | Düğüm kodu doğrulama deseni (ör. ETIM `^EC\d{6}$`, UNSPSC `^\d{8}$`, GPC brick `^\d{8}$`) |
| `status` | Enum(active, deprecated, archived) | Sözlük yaşam döngüsü; eski versiyon silinmez, deprecated'a düşer |
| `created_at` / `updated_at` | TIMESTAMPTZ | Audit alanları |

Bu tablo `taxonomy_node` ağaç düğümünün alanlarını tanımlar; özyinelemeli (self-referencing) tree ilişkisi taşır ve düğüm-başına önerilen öznitelik burada bağlanır:

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Düğüm benzersiz kimliği |
| `tenant_id` | UUID (indexed, nullable) | Kiracı izolasyonu; platform sözlüğü null |
| `taxonomy_id` | UUID (FK → taxonomy.id) | Düğümün ait olduğu standart/sözlük |
| `node_code` | Text | Standart-özel düğüm kodu (ETIM class `EC010101`, UNSPSC commodity `43211503`, GPC brick `10000045`); `taxonomy.code_pattern` ile doğrulanır |
| `parent_id` | UUID (FK → taxonomy_node.id, nullable) | Ağaç ebeveyni; NULL = kök; tree-relation (`archetype-uretim-spec §12.C tree`) |
| `path` | LTREE | Materialize edilmiş ağaç yolu (PostgreSQL `ltree`); alt-ağaç sorgusu O(log n) |
| `label` | I18nText | Düğümün çok-dilli etiketi (ör. `{tr, en, de}`); enum etiketleri alias ile (`archetype-uretim-spec §12.E`) |
| `suggested_attributes` | JSONB (list) | Düğüm-başına önerilen öznitelik anahtarları + zorunluluk (ör. `[{key, required, unit_ref}]`); ETIM feature seti buraya eşlenir |
| `depth` | Integer | Ağaç seviyesi (segment/family/class/brick); döngü ve derinlik denetimi için |
| `status` | Enum(active, deprecated) | Düğüm yaşam döngüsü; kaldırılan düğüm alias/deprecated ile iz bırakır |
| `created_at` | TIMESTAMPTZ | Audit |

Bu tablo `product_taxonomy` bağını (bir ArcheType kaydı ↔ bir düğüm) tanımlar; çok-standartlı sınıflandırmayı bir ürünün birden çok satırla farklı düğümlere bağlanmasıyla sağlar:

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Bağ kimliği |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu |
| `product_id` | UUID (FK → product.id) | Sınıflandırılan ürün (ArcheType kaydı) |
| `node_id` | UUID (FK → taxonomy_node.id) | Bağlanılan düğüm |
| `is_primary` | Boolean | Bir standart içinde birincil sınıflandırma mı (aynı standartta tek primary) |
| `source` | Enum(human, ai_suggested, import, gdsn) | Bağın kökeni; AI önerisi izlenir |
| `confidence` | Numeric (nullable) | AI önerisinin güven skoru (source=ai_suggested ise); insan onayında NULL'a düşebilir |
| `approval_ref` | UUID (nullable) | Onaylayan insan + zaman + gerekçe (source=ai_suggested ise zorunlu) |
| `created_at` | TIMESTAMPTZ | Audit |

**GTIN/GLN validasyon kuralı (GS1 mod-10 checksum):** GTIN (8/12/13/14 hane) ve GLN (13 hane) GS1 tanımlayıcıları serbest string değildir; son hane bir **kontrol hanesidir** (check digit). Kural: sağdan sola, kontrol hanesi hariç rakamlara sırayla `×3, ×1, ×3, ×1…` ağırlığı uygulanır; ağırlıklı toplamın 10'a tümlenmiş modülüsü (`(10 − (Σ mod 10)) mod 10`) kontrol hanesine eşit olmalıdır. GTIN alanı bir ArcheType `field`'ında `derived`/`validated` işaretlenir ve checksum kuralı **Computation** primitifine (`k-computation`, `expr_kind=formula`) bağlanır — checksum hesabı bu yönergede kodlanmaz, referansla türetilir (§6.3). Uzunluk (8/12/13/14), yalnız-rakam ve checksum uyumu **tanım anında** değil, **yazma anında** (`on_write`) reddedilir → `GtinChecksumError`.

## 6. Bağlama (üç eksen)

ArcheType'a bağlama üç ekseni izler; her eksen `archetype-uretim-spec §12`'deki mevcut bir yeteneğe oturur, yeni mekanizma icat etmez.

### 6.1 Tree-relation ekseni — ağaç yerleşimi

Taksonomi ağacı, `archetype-uretim-spec §12.C`'deki **tree** (özyinelemeli/recursive) ilişki yeteneğini kullanır: `taxonomy_node.parent_id` bir düğümün aynı tipten üstünü işaret eder; `path` (LTREE) materialize edilmiş yolu taşır. Segment → family → class → brick gibi çok-seviyeli sınıflandırma bu ağaçla ifade edilir. **Döngü-tespiti zorunludur** (`archetype-uretim-spec §12.D BOM-graph` ile aynı disiplin): bir düğüm dolaylı olarak kendi atası olamaz; döngü tanımı testte reddedilir. ArcheType, ürünü ağacın bir düğümüne `product_taxonomy` ile bağlar; ağacın kendisi ArcheType gövdesine gömülmez, ayrı `taxonomy_node` kayıt defterinde durur (çok-standart tek ağaç değil, standart-başına ağaç).

### 6.2 Variant/attribute/family ekseni — önerilen öznitelik akışı

Bir düğüme bağlanan ürün, o düğümün `suggested_attributes` setini **önerilen öznitelik** olarak alır; bu, `archetype-uretim-spec §12.B`'deki **attribute-set/EAV** yeteneğini besler. Akış: ürün ETIM class'ına bağlanınca, o class'ın feature seti (ETIM özellikleri) önerilen öznitelik listesi olur; Family (aile) şablonu ve Variant (varyant) eksenleri bu öneriyi miras zincirine (`family → product → variant`) katar. Öneri **zorlama değildir** — kullanıcı öneriyi kabul/atlar; ama zorunlu işaretli (`required:true`) öznitelikler kalite kapısında (Faz 4) eksik-alan olarak raporlanır. PIM-v2 Özellik 14 (Öznitelik önerisi) tam olarak bu eksendir: "bir ürün ETIM düğümüne bağlanınca önerilen öznitelikler otomatik listelenir" (`PIM-v2 §Faz 3` kabul kriteri).

### 6.3 Computation ekseni — GTIN/GLN checksum

GTIN/GLN checksum doğrulaması `k-computation` primitifine (`docs/computation-derivation-contract.md`) bir `formula` kind computation olarak bağlanır: girdi = tanımlayıcı hanesi (rakam dizisi), operatör düğümleri = GS1 mod-10 ağırlıklı toplam + tümleme, çıktı = beklenen kontrol hanesi. `plan-03 §3.4` GS1 validasyonunu bu primitifin tüketicisi olarak işaretler. Checksum **saf/deterministik** (aynı girdi → aynı kontrol hanesi), serbest kod değil (whitelist operatör), ve `on_write` tetikli. Bu ayrım kasıtlıdır: computation "kontrol hanesini *üret*" der; ArcheType validation "girilen GTIN bu üretilen haneyle *uyuşuyor mu*?" sorusunu sorar — üretme ile doğrulama ayrı eksendir (`computation-derivation-contract §4`). Böylece checksum tek yerde tanımlanır, GTIN yazan her ArcheType (Product/PackageVariant/Bundle) onu tutarlı tüketir.

## 7. WBS yerleşimi

`k-taxonomy`, kernel kümesine (`k-*`) `module`-seviyesi bir düğüm olarak eklenir; altında asıl kod-teslimatı olan en az bir `archetype` düğümü durur (`task-to-code-contract` gereği: `module` sözleşme/şema taşır, kod alt `archetype`'ta yazılır). Bağımlılıklar `wbs-field-semantics`'e uyar: `dependsOn` = teknik/yürütme sırası (kritik yol); `related` = yalnız gezinme.

Bu tablo `k-taxonomy` düğümünün WBS yerleşimini ve bağımlılıklarını tanımlar:

| Düğüm | Seviye | dependsOn | Küme |
|---|---|---|---|
| `k-taxonomy` | module | `k-schema`, `k-tenancy`, `k-computation` | kernel |

`dependsOn` gerekçesi: `k-taxonomy` şema temeline (`k-schema`; LTREE/JSONB kolon tipleri), kiracı bağlamına (`k-tenancy`; platform vs tenant sözlük) ve checksum hesabına (`k-computation`; GTIN/GLN türetmesi §6.3) teknik olarak bağlıdır — bunlar hazır olmadan taksonomi yazılamaz. `related` ile (karar üretmeden) Product/Family/Variant ArcheType düğümlerine ve PIM-Product referans spec'ine bağlanır. Faz eşlemesi: `k-taxonomy` MVP-sonrası, PIM-v2 Faz 3'te (Gelişmiş Öznitelik & Taksonomi) kilitlenir; GTIN/GLN checksum bağı erken (Faz 10 GS1'den önce, `k-computation` hazırsa) doğrulanabilir.

## 8. Backend

Motor tarafı `platform_taxonomy` paketinde yaşar. SQLAlchemy 2.0 (`Mapped[...]`) modelleri: `taxonomy`, `taxonomy_node`, `product_taxonomy`; her tablo `tenant_id` kolonu ve `(tenant_id, ...)` bileşik indeksi taşır (v1 §2.8). `taxonomy_node.path` LTREE kolonu GIST-indekslidir (alt-ağaç sorgusu); `node_code` `(taxonomy_id, node_code)` unique. Alembic expand-contract migration; `downgrade()` dolu ve CI'da `alembic downgrade -1` ile test edilir (boş downgrade yasak). Strawberry GraphQL: `TaxonomyType`, `TaxonomyNodeType`, `ProductTaxonomyType`; resolver'lar `Depends(require_tenant)` + `RequirePermission(...)` ile korunur; ağaç sorgusunda N+1'i DataLoader ile engelle (bir düğümün çocukları tek batch). `suggested_attributes` çözümü servis arayüzünde: `resolve_suggested_attributes(node_id)` düğüm + atalarının önerilen öznitelik setini miras zinciriyle birleştirir. GTIN/GLN doğrulaması `k-computation` `ComputationEngine.evaluate` çağrısıyla yapılır; hatalı checksum yazma anında `GtinChecksumError`; hatalı `node_code` (pattern uyumsuz) `TaxonomyCodeError`. Her `bind_node` / `unbind_node` / sözlük-versiyon geçişi `AuditLogger.log()` ile `actor` + `resource=product_taxonomy` yazılır (v1 §2.5). Hata formatı `{code, message, trace_id, details}`; `get_logger()` kullanılır, `print()` yasak.

## 9. Multi-tenant

Platform-katman sözlükleri (`tenant_id = NULL`) tüm tenant'lara ortak taban sağlar: ETIM/UNSPSC/GPC resmî sözlükleri işletmeci/uyum ekibince yüklenir ve tenant'lar bunları **genişletemez, yalnız kullanır ve tenant-özel `custom` sözlükle daraltır/özelleştirir** (alt katman üst katmanı genişletemez — `computation-derivation-contract §9` ile aynı ilke). Her tenant-özel sözlük ve `product_taxonomy` bağı `tenant_id` ile izole edilir (v1 §2.1 fail-closed): A tenant B'nin sınıflandırmasını göremez; cross-tenant girişim `TenantViolationError` fırlatır ve audit'lenir. İkinci bariyer PostgreSQL RLS: `USING (tenant_id = current_setting('app.current_tenant')::uuid OR tenant_id IS NULL)` — platform sözlüğü okunur, başka tenant'ınki okunmaz. Resmî standart sürüm geçişi (ör. ETIM-9.0 → ETIM-10.0) yalnız işletmeci tarafından yapılır; eski sürüm deprecated'a düşer, silinmez (mevcut ürün bağları korunur).

## 10. AI guardrail

Dört-aktör iş bölümü değiştirilemez biçimde uygulanır: **AI önerir → insan onaylar → motor uygular** (`archetype-uretim-spec §3` + `PIM-v2 §2.1.1 ai_categorization` "human-in-the-loop").

Bu tablo `k-taxonomy` üzerindeki AI autonomy sınırlarını tanımlar:

| İşlem | Autonomy | Kural |
|---|---|---|
| Kategori (düğüm) *önerme* | `draft` | AI ürün verisinden düğüm önerir (`source=ai_suggested` + `confidence`); doğrudan bağlayamaz |
| Düğüm bağlama (`bind_node`) | onay-zorunlu | `approval_ref` (insan) olmadan `ApprovalRequiredError` fırlar; auto-approval eşiği yalnız insan-tanımlı |
| Önerilen öznitelik *listeleme* | `read` | AI düğümün `suggested_attributes`'ını gösterebilir; değer üretimi ayrı akış (enrichment, Faz 5) |
| Yeni `node_code` / sözlük icadı | `none` | Standart düğümler resmî sürümden gelir; AI ETIM/UNSPSC/GPC kodu icat edemez |
| GTIN/GLN üretme/override | `none` | Checksum motor türetir; AI kontrol hanesini override edemez |
| Audit / karar-logu değişimi | `none` | Audit append-only; AI değiştiremez |

Mutlak sınırlar: AI main branch'e push edemez; app/module düğümü üretemez/silemez; ruleset override edemez; kanıtsız "bitti" diyemez. AI'nın önerdiği kategori güven skoru ne olursa olsun otomatik uygulanmaz — insan onayı (`archetype-uretim-spec §3` ADMIN_FLOW) zorunludur. AI'nın döngü üreten bir ağaç ilişkisi önermesi testte engellenir (tree cycle detection §6.1).

## 11. Test stratejisi

Test-önce zorunludur (önce kırmızı, sonra yeşil). Aşağıdaki testler `check-core-contract` ve taksonomi kapısında zorunludur; bir düğüm bunları geçmeden merge edilemez.

Bu tablo `k-taxonomy` için zorunlu test senaryolarını ve türlerini tanımlar:

| # | Senaryo | Test türü |
|---|---|---|
| 1 | GTIN checksum: geçerli GTIN-13 kabul, tek-hane bozuk GTIN reddediliyor (`GtinChecksumError`) | Unit |
| 2 | GLN checksum: geçerli GLN-13 kabul, bozuk kontrol hanesi reddediliyor | Unit |
| 3 | node → öznitelik önerisi: ürün ETIM düğümüne bağlanınca önerilen öznitelikler doğru listeleniyor | Integration |
| 4 | Çok-standart: aynı ürün ETIM + UNSPSC + GPC düğümlerine aynı anda bağlanabiliyor | Integration |
| 5 | Tree döngü-tespiti: bir düğümü kendi atası yapan `parent_id` reddediliyor | Unit |
| 6 | Node-kodu deseni: `code_pattern`'e uymayan `node_code` reddediliyor (`TaxonomyCodeError`) | Unit |
| 7 | Miras zinciri: düğüm + atalarının önerilen öznitelikleri birleşiyor (family → product → variant) | Integration |
| 8 | AI-guardrail: `approval_ref`'siz `bind_node` (source=ai_suggested) reddediliyor | Integration |
| 9 | Tenant izolasyonu: A tenant B'nin sözlüğünü/bağını göremiyor (≥10 negatif case); platform sözlüğü okunur | Integration (negatif) |
| 10 | Migration downgrade: `alembic downgrade -1` veri kaybetmeden çalışıyor | CI |

## 12. Acceptance criteria

- AC-1: Geçerli GTIN/GLN GS1 mod-10 checksum'ından geçiyor; bozuk kontrol hanesi yazma anında reddediliyor.
- AC-2: Bir ürün ETIM/UNSPSC/GPC düğümüne bağlanınca o düğümün önerilen öznitelikleri otomatik listeleniyor (PIM-v2 Faz 3 kabul kriteri).
- AC-3: Aynı ürün birden çok standartta (ETIM + UNSPSC + GPC) sınıflandırılabiliyor; her standartta tek `is_primary`.
- AC-4: Taksonomi ağacı döngüsüz; kendi atası olan düğüm reddediliyor.
- AC-5: `node_code` standart deseni (`code_pattern`) doğrulanıyor; uymayan kod reddediliyor.
- AC-6: AI kategori önerisi `draft`; insan `approval_ref` olmadan bağ uygulanmıyor.
- AC-7: Platform sözlüğü (ETIM/UNSPSC/GPC) tüm tenant'larca okunuyor; tenant sözlükleri izole; cross-tenant reddediliyor.
- AC-8: GTIN/GLN checksum `k-computation`'a referansla türetiliyor (bu yönergede kodlanmıyor); Product/PackageVariant/Bundle tutarlı tüketiyor.

## 13. Anti-patterns (yasak desenler)

- **Sınıflandırmayı koda gömme:** `if category == "cable"` — YASAK; sınıflandırma `taxonomy_node` referansıdır, veridir.
- **Tek-standart kilit:** Bir ürünü tek sözlüğe (yalnız ETIM) kilitleyip UNSPSC/GPC'yi engellemek — YASAK; çok-standart çekirdek özelliktir.
- **GTIN'i string olarak tutma:** GTIN/GLN'i checksum'sız serbest metin kolonu yapmak — YASAK; GS1 mod-10 zorunlu, `float`/serbest string reddedilir.
- **Checksum'ı tekrar yazma:** GTIN checksum'ını her ArcheType'ta ayrı kodlamak — YASAK; `k-computation` referansı tek-kaynak (§6.3).
- **Önerilen özniteliği zorunlu-değer sanma:** `suggested_attributes`'ı validation olarak koşmak — YASAK; öneri ≠ zorunlu değer; değer validasyonu ayrı eksen.
- **Döngülü ağaç:** Bir düğümü kendi atası yapmak — YASAK; tree cycle detection ihlali.
- **AI'ın kategori otomatik uygulaması:** `approval_ref`'siz `bind_node` — YASAK; güven skoru ne olursa olsun insan onayı zorunlu.
- **Tenant'ın platform sözlüğünü genişletmesi:** Resmî ETIM/UNSPSC/GPC ağacına tenant düğümü eklemek — YASAK; katman yalnız daraltır, `custom` sözlük ayrı.

## 14. DoD (Definition of Done)

§11'deki 10 testin tamamı yeşil (test-önce kanıtı: kırmızı→yeşil belgeli); GTIN ve GLN checksum invariant'ı kanıtlandı; node → öznitelik önerisi ve miras zinciri doğrulandı; çok-standart sınıflandırma ve tree döngü-tespiti çalışıyor; migration downgrade CI'da geçti; `check-core-contract` (tenant guard, resolver koruması, audit çağrısı, indeks) + `check-dependency-policy` yeşil; GTIN/GLN checksum `k-computation`'a referansla türetiliyor (kod tekrarı yok); AI-guardrail testi `draft`-dışı doğrudan kategori bağını reddediyor; `k-taxonomy` düğümü ve altındaki `archetype` düğümü WBS'te doğru `dependsOn` (`k-schema`, `k-tenancy`, `k-computation`) ile mevcut; PR açıldı, insan reviewer merge etti (main'e doğrudan push yok); doküman `icerik-kalite-sozlesmesi` biçim kurallarına uyar (emoji yok, her başlıkta nedir/yapar/yapmaz, her tablodan önce açıklama).

## 15. Requirement-ID tablosu

Aşağıdaki tablo bu yönergenin izlenebilir gereksinimlerini kimlik + katman + öncelik (P0–P3) + test türü + kabul + sahip ile listeler; PIM-v2 karşılığı (Özellik 13/14/33) son sütunda eşlenir. Öncelik: P0 = bloklayıcı invariant, P1 = çekirdek (Faz 3), P2 = önemli, P3 = uzun-vade (Faz 10).

| ID | Requirement | Layer | Priority | TestType | AC | PIM-v2 | Owner |
|---|---|---|---|---|---|---|---|
| TX-01 | `taxonomy` sözlük şeması (standard/version/code_pattern) tenant-kapsamlı | Backend/Data | P1 | Unit | AC-3 | Özellik 13 | kernel-team |
| TX-02 | `taxonomy_node` ağaç (parent_id/path/depth) + tree döngü-tespiti | Backend/Data | P1 | Unit | AC-4 | Özellik 13 | kernel-team |
| TX-03 | `node_code` desen doğrulaması (ETIM/UNSPSC/GPC) | Backend | P1 | Unit | AC-5 | Özellik 13 | kernel-team |
| TX-04 | `product_taxonomy` çok-standart bağı (ETIM+UNSPSC+GPC, is_primary) | Backend | P1 | Integration | AC-3 | Özellik 13 | kernel-team |
| TX-05 | `suggested_attributes` düğüm-başına önerilen öznitelik | Backend/Data | P1 | Integration | AC-2 | Özellik 14 | kernel-team |
| TX-06 | Miras zinciri (family → product → variant öneri birleşimi) | Backend | P2 | Integration | AC-2 | Özellik 14 | kernel-team |
| TX-07 | GTIN checksum (GS1 mod-10) `k-computation`'a bağlı | Backend/Compute | P2 | Unit | AC-1, AC-8 | Özellik 33 | kernel-team |
| TX-08 | GLN checksum (GS1 mod-10, 13 hane) | Backend/Compute | P2 | Unit | AC-1, AC-8 | Özellik 33 | kernel-team |
| TX-09 | Tenant izolasyonu + platform sözlük okunur + RLS | Security | P0 | Integration(neg) | AC-7 | Özellik 13 | security-team |
| TX-10 | Sınıflandırma mutasyonu audit (append-only) | Security | P0 | Integration | AC-7 | Özellik 13 | security-team |
| TX-11 | AI kategori önerisi `draft` + `approval_ref` zorunlu | AI-Governance | P0 | Integration | AC-6 | Özellik 14 | governance |
| TX-12 | AI yeni `node_code`/sözlük icat edemez (autonomy none) | AI-Governance | P0 | Unit | AC-6 | Özellik 14 | governance |
| TX-13 | Alembic expand-contract + dolu downgrade | Backend/DevOps | P1 | CI | AC-1 | — | kernel-team |
| TX-14 | Strawberry resolver `permission_classes` + N+1 DataLoader (ağaç) | Backend/API | P1 | Contract | AC-2 | Özellik 13 | kernel-team |
| TX-15 | Config-driven surface (taksonomi ağaç gezgini, hardcoded dallanma yok) | Frontend | P2 | E2E | AC-2 | Özellik 13 | ui-team |
| TX-16 | `k-taxonomy` WBS düğümü doğru dependsOn (k-schema, k-tenancy, k-computation) | Governance/WBS | P1 | CI(data-quality) | AC-8 | — | pmo |

---

*AI-DRAFT — insan onayına tabidir; AI bu dosyayı doğrudan güncelleyemez.*
*Kaynak yönerge: `archetype-uretim-spec §12.B/§12.C/§12.A.4`, `PIM-v2-Gereksinim-Analizi §Faz 3 + §Faz 10`, `plan-03 §3.4`. Kardeş dokümanlar: `computation-derivation-contract.md` (GTIN/GLN checksum bağı), `actor-party-contract.md`, `surface-v2-directive.md`. Bağlı düğümler: `k-taxonomy`, `k-schema`, `k-tenancy`, `k-computation`, Product/Family/Variant ArcheType. Çelişki halinde `archetype-uretim-spec.md` (kanonik ArcheType spec) önceliklidir; bu doküman güncellenir. Bu doküman hiçbir kod/şema/JSON dosyasına dokunmaz; yalnız sözleşme metnidir. Sözleşmeyi değiştirme yetkisi yalnız insan onayındadır.*
