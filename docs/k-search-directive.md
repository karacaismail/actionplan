# k-search Yönergesi — Arama Kernel Primitifi (Faceted / Filter / Sort, Tenant-Scoped Index)

**Statü:** kanonik yönerge (kernel primitifi `k-search`). **Kod karşılığı:** `core-contract-pack.md` §2.1 (`platform_tenancy` — tenant izolasyonu), §2.6 (`platform_archetype` — `searchIndex` alanı), §2.9 (Observability — p95 bütçesi) + CI kapısı `check-search-contract`.
**Neden var:** Ürün/öznitelik arama 50 app'te tekrar eden, yanlış yapıldığında ya yavaş ya tenant-sızıntılı olan bir yüzeydir. Her app kendi `LIKE '%...%'` sorgusunu yazarsa: (1) p95 bütçesi (<300ms, 100k+ ürün) tutmaz, (2) faceted/sort her seferinde farklı, (3) `WHERE tenant_id` unutulursa çapraz-tenant sonuç sızar. Bu yönerge aramayı tek, sözleşmeli, index-tabanlı bir primitife bağlar. Stack: FastAPI + SQLAlchemy 2.0 + PostgreSQL FTS (GIN) taban → OpenSearch (ölçekte); deploy Hetzner/Debian/AMD EPYC/Docker.

---

## 1. Amaç

Bir tenant'ın veri kümesinde **hızlı, alakalı, filtrelenebilir ve boşluksuz-izole** aramayı — app'e serbest sorgu yazdırmadan, index-tabanlı ve p95-bütçeli biçimde — tek primitifte sağlamak. Ana kural: arama bir *ad-hoc SQL sorgusu* değil, bir *index sözleşmesidir*. App bir `SearchQuery` verir; motor tenant-scoped index'ten alaka-sıralı, faceted, sayfalanmış sonuç döndürür. Taban PostgreSQL FTS + GIN; veri/eşzamanlılık ölçeğinde aynı sözleşme OpenSearch adaptörüne kayar (app değişmez).

## 2. Kapsam — hangi aramalar

Yönerge yalnızca **index-tabanlı okuma-arama** yüzeyini bağlar; kapsam etiketi ArcheType'ın `searchIndex` alanı beyanıyla girer.

| Kapsam | Kapsar | Örnek |
|---|---|---|
| `full-text` | Metin alanlarında alaka-sıralı arama (FTS/BM25) | Ürün adı/açıklama/marka araması |
| `faceted` | Filtre + facet sayımı (kategori, marka, öznitelik) | "Kırmızı + 42 beden" daralt, sol menü sayaçları |
| `attribute` | EAV/JSONB öznitelik değeri üzerinde arama/filtre | `renk=kırmızı`, `voltaj=220V` (GIN indeksli) |

Bir yüzey bu kapsamlardan en az birini `searchIndex`'te beyan ederse yönerge zorunludur. Beyan etmeyen yüzey (örn. tekil PK-getirme) kapsam dışıdır.

## 3. Non-goals — neyi yapmaz (arama != veritabanı sorgusu)

Kritik ayrım: **arama, veritabanı sorgusu değildir.** Aşağıdakiler kasıtlı kapsam dışıdır.

| Yapmaz | Neden |
|---|---|
| Transactional CRUD / PK-getirme yerine geçmez | Kesin, tekil, tutarlı okuma ORM/DB işidir; arama yaklaşık-alaka + index-projeksiyonudur |
| Kayıt-anı (read-after-write) tutarlılık garantisi vermez | Index eventual; yeni yazılan kayıt anında görünmeyebilir (bkz. §7 reindex) |
| İş kuralı / hesap (fiyat/vergi) çözmez | O `k-computation` işidir; arama yalnız *bulur ve sıralar*, hesaplamaz |
| Yetki kararı vermez | Görünürlük `k-policy-pdp` + `k-tenancy` filtresidir; arama yalnız izinli kümede çalışır |
| Serbest sorgu dili (ham SQL/DSL enjeksiyonu) açmaz | App yalnız yapısal `SearchQuery` verir; motor parametreli üretir |

## 4. Tanım — nedir / ne yapar / ne yapmaz

**Nedir:** Tenant-scoped bir index üzerinde full-text + faceted + attribute aramayı, alaka-sıralamayı ve filtre/sort'u sağlayan, PostgreSQL FTS taban + OpenSearch ölçek-adaptörlü bir okuma primitifi.
**Ne yapar:** Metni tokenize/normalize edip GIN indeksinde arar; facet sayımlarını index-yan hesaplar; filtre/sort'u parametreli uygular; sonucu sayfalanmış (cursor) döndürür; p95 bütçesini ölçer. Ölçekte aynı `SearchQuery` sözleşmesini OpenSearch'e proxy'ler.
**Ne yapmaz:** Ham SQL/DSL kabul etmez; tenant sınırını aşmaz (index seviyesinde izole); yazma yapmaz; yetki/hesap kararı vermez; kesin-tutarlılık vaat etmez.

## 5. Sözleşme şekli — alan | tip | amaç

Aşağıdaki iki yapı primitifin dış yüzeyidir; dolu örnek veri (mock) verilmez.

**5.1 `SearchIndex` (index tanımı — `platform_search/index.py`).** Bir ArcheType'ın nasıl indeksleneceğini beyan eder; taban PostgreSQL FTS/GIN, ölçekte OpenSearch mapping'ine çevrilir.

| Alan | Tip | Amaç |
|---|---|---|
| `index_key` | str (pk) | Index kimliği; ArcheType `searchIndex` alanından türer (ör. `pim.product`) |
| `tenant_scope` | enum(`per-tenant-index\|shared-filtered`) | İzolasyon stratejisi — **default `per-tenant-index`** (fiziksel ayrım) |
| `text_fields` | {alan: ağırlık}[] | FTS'e giren metin alanları + alaka ağırlığı (`name:A, desc:B`) |
| `facet_fields` | str[] | Facet sayımı üretilecek alanlar (kategori, marka, öznitelik) |
| `filter_fields` | {alan: tip}[] | Filtrelenebilir alanlar + tip (eq/range/in) |
| `sort_fields` | str[] | Sıralanabilir alanlar (allowlist; keyfi sort yasak) |
| `backend` | enum(`pg-fts\|opensearch`) | Aktif adaptör; sözleşme sabit, motor değişir |
| `analyzer` | str | Dil/normalize profili (tr/en; lower, unaccent, stopword) |

**5.2 `SearchQuery` (istek — `platform_search/query.py`).** App'in verdiği tek yapısal istek; ham SQL/DSL değildir.

| Alan | Tip | Amaç |
|---|---|---|
| `index_key` | str | Hangi index'te aranacağı |
| `tenant_id` | UUID | Zorunlu kapsam (§2.1); eksikse fail-closed reddedilir |
| `q` | str \| null | Full-text sorgu metni (boş = yalnız filtre/facet) |
| `filters` | {alan, op, value}[] | Yapısal filtre; `op ∈ eq\|in\|range`; `filter_fields` allowlist'ine tabi |
| `facets` | str[] | İstenen facet'ler (`facet_fields` alt kümesi) |
| `sort` | {alan, dir}[] | Sıralama; `sort_fields` allowlist'ine tabi |
| `cursor` / `limit` | str \| null / int | Cursor-tabanlı sayfalama (offset/limit yasak — §3.2 GraphQL standardı) |

**5.3 `SearchResult` (yanıt).** `hits[]` (projeksiyon, tam gövde değil) + `facet_counts{}` + `next_cursor` + `took_ms` (p95 ölçümü için). Yetki/maskeleme yükümlülükleri `k-policy-pdp`'den gelir.

## 6. WBS / kernel yerleşimi

`k-search` bir **module**-seviyesi kernel primitifidir; `app-layer0` kümesinde yaşar (parentId aynı küme), `dependsOn = [k-schema, k-tenancy]`. `k-schema` ArcheType'ın `searchIndex` alan tanımını sağlar (neyin indeksleneceği); `k-tenancy` izolasyon sınırını (`tenant_id`, RLS) sağlar. Layer-1'deki hibrit **Search ArcheType** (BM25 + vektör + facet) bu primitifin üzerine oturur; primitif tabanı (FTS/GIN, tenant-scoped index, faceted/filter/sort) verir, ArcheType uygulamaya özel yüzeyi kurar.

## 7. Backend deseni

Aktör-açık desen: *geliştirici* `searchIndex` alanını ArcheType'ta beyan eder; *motor* index'i kurar, sorguyu parametreli üretir, facet'i index-yan hesaplar; *CI* ham-SQL/tenant-eksik aramayı bloklar.

- **PostgreSQL FTS taban:** İndekslenecek `text_fields` bir `tsvector` kolonuna (veya generated column) yazılır; üzerine **GIN index** kurulur. Sorgu `to_tsquery` ile parametreli üretilir; `ts_rank` alaka sıralaması verir. String birleştirme (injection) yasak — yalnız bind parametre.
- **EAV/JSONB öznitelik:** Öznitelik değerleri JSONB kolonda; üzerine **GIN index** (`jsonb_path_ops`). `attribute` filtreleri JSONB path operatörleriyle çözülür (N+1 yerine tek indeksli tarama).
- **Faceted:** Facet sayımları index-yan hesaplanır (FTS'te `GROUP BY` + kısmi index; OpenSearch'te aggregation). Her istekte yeniden tam-tarama yapılmaz.
- **Tenant izolasyonu index seviyesinde:** Default `per-tenant-index` — her tenant kendi fiziksel index'inde (OpenSearch'te ayrı index/alias; PG'de `tenant_id` zorunlu eş-anahtar + RLS). Çapraz-tenant sorgu index seviyesinde imkânsız; `tenant_id` bind zorunlu.
- **Ölçek-adaptörü:** `backend=pg-fts` → `opensearch` geçişi `SearchQuery` sözleşmesini değiştirmez; sadece motor değişir. Reindex: yazma olayı (§2.3 outbox) index-güncelleme job'ı tetikler; index **eventual** (read-after-write garantisi yok).

## 8. Multi-tenant

Arama, `k-tenancy` sınırına **index seviyesinde** tabidir: izolasyon uygulama-katmanı `WHERE`'e bırakılmaz, index topolojisine gömülür. Default `per-tenant-index` fiziksel ayrım sağlar; `shared-filtered` yalnız düşük-hacim tenant'lar için, RLS + zorunlu `tenant_id` predikatıyla ve açık gerekçeyle seçilir. Hiçbir `SearchQuery` `tenant_id` olmadan çalışmaz (fail-closed). Facet sayımları da tenant-scoped'tur (bir tenant'ın facet'i diğerinin varlığını sızdıramaz).

## 9. AI guardrail

`k-party` AI-güvenlik invariantı burada da geçerlidir: **AI önerir → insan onaylar → motor uygular.** AI, arama davranışını *önerebilir* (eş-anlamlı sözlük, alaka-ağırlığı ayarı, "bunu mu demek istediniz", facet düzeni taslağı) ve dry-run'da etkisini gösterebilir; ancak aktif `SearchIndex` tanımını (analyzer, ağırlık, tenant_scope) doğrudan değiştiremez — index tanım değişimi `approval_ref` ister. AI bir index'i yeniden-kuramaz, tenant kapsamını gevşetemez, ham DSL enjekte edemez. Arama *sonuçlarını* AI zenginleştirebilir (özet/açıklama) ama sıralamayı gizlice override edemez; alaka motorun ölçtüğüdür.

## 10. Bağlama — PIM ürün/öznitelik arama

Bu primitif PIM-v2'nin ürün/öznitelik aramasını taşır. ArcheType `searchIndex` alanı hangi ürün alanlarının (ad, açıklama, marka, kategori) ve hangi EAV özniteliklerinin indeksleneceğini beyan eder. EAV değerleri JSONB'de tutulur; üzerine **GIN index** kurulur (PIM-v2 §5.1 EAV performans riski azaltması: "JSONB + uygun index (GIN)"). Faceted arama kategori/marka/öznitelik facet'lerini index-yan üretir. Faz 1'de PostgreSQL FTS yeterli (PIM-v2 §3.1, §10 "başlangıçta Postgres FTS yeterli"); 100k+ ürün ve artan eşzamanlılıkta OpenSearch adaptörüne geçilir — `SearchQuery` sözleşmesi sabit kaldığı için app kodu değişmez.

## 11. Test stratejisi

Aşağıdaki testler primitifin p95 bütçesini ve izolasyonunu kanıtlar; ArcheType DoD'sinin parçasıdır.

1. **p95 bütçesi (performans):** 100k+ ürünlük tenant'ta `full-text + 2 filtre + 3 facet` sorgusu **p95 < 300ms** (PIM-v2 NFR). GIN index'in kullanıldığı `EXPLAIN`'de doğrulanır; seq-scan yoksa geçer.
2. **Tenant sızıntı yok (izolasyon):** Tenant A'nın index'ine Tenant B verisi yazılıp A adına arama yapılır → B'nin hiçbir hit'i/facet sayımı görünmez. `tenant_id`'siz `SearchQuery` fail-closed reddedilir. En az 10 çapraz-tenant senaryosu (§3.5).
3. **N+1 yok (verimlilik):** Faceted sonuç + hit projeksiyonu **tek indeksli sorguyla** döner; facet başına ek sorgu (N+1) üretilmez — sorgu sayacı ile doğrulanır.

## 12. Acceptance criteria

- `SearchIndex` ve `SearchQuery` §5 tablolarıyla birebir uyumlu; app ham SQL/DSL değil yalnız `SearchQuery` verir.
- Faceted + filter + sort tek indeksli sorguyla çalışır; `sort`/`filter` yalnız allowlist alanlarında.
- Bölüm 11 üç testi yeşil: p95 < 300ms (100k+ ürün), sıfır tenant-sızıntı (10+ senaryo), N+1 yok.
- Tenant izolasyonu index seviyesinde: default `per-tenant-index`; `tenant_id`'siz arama fail-closed.
- `pg-fts` → `opensearch` adaptör geçişi `SearchQuery` sözleşmesini bozmadan çalışır (aynı test seti iki backend'de yeşil).

## 13. Anti-patterns

| Anti-pattern | Neden yanlış | Doğrusu |
|---|---|---|
| `WHERE tenant_id` uygulama-katmanına bırakmak | Bir sorguda unutulur → çapraz-tenant sızıntı | İzolasyon index seviyesinde (`per-tenant-index`/RLS); motor zorlar |
| `q` metnini SQL'e string birleştirmek | SQL injection + N+1 | `to_tsquery` parametreli; yalnız bind |
| Her facet için ayrı `COUNT` sorgusu | N+1; p95 patlar | Facet index-yan tek tarama / aggregation |
| Aramayı CRUD tutarlılığı sanmak | Index eventual; read-after-write beklentisi kırılır | Kesin okuma ORM/PK; arama yaklaşık-alaka |
| `LIKE '%term%'` ile "arama" | Index kullanılmaz (leading wildcard), 100k'da seq-scan | FTS + GIN; `ts_rank` alaka |
| Keyfi `sort`/`filter` alanı kabul etmek | Indekssiz alan → yavaş + saldırı yüzeyi | `sort_fields`/`filter_fields` allowlist |

## 14. Definition of Done

- `check-search-contract.mjs` yazıldı, `deploy.yml` `build` job'ına bloklayıcı adım olarak eklendi, `docs/ci-conformance-gates.md` matrisine işlendi (ham-SQL arama + `tenant_id`-eksik `SearchQuery` reddi).
- `SearchIndex` / `SearchQuery` §5 tablolarıyla uyumlu; PostgreSQL FTS taban (`tsvector` + GIN) ve EAV JSONB GIN index kurulu; Alembic migration expand-contract + downgrade çalışıyor.
- Bölüm 11 üç testi yeşil; Bölüm 12 acceptance criteria karşılandı.
- AI-guardrail testli: AI aktif `SearchIndex`'i onaysız değiştiremiyor, tenant kapsamını gevşetemiyor, ham DSL enjekte edemiyor (`approval_ref` zorunlu).
- OpenSearch adaptörü aynı `SearchQuery` sözleşmesini karşılıyor; `core-contract-pack.md` §2.1/§2.6 ve PIM-v2 §3.1/§NFR ile çelişmiyor.

## 15. Requirement-ID tablosu

Her kural bir izlenebilir kimliğe bağlanır; kapı/test bu kimliği referans alır.

| ID | Gereksinim | Zorlayan |
|---|---|---|
| SRCH-1 | Arama index-tabanlıdır (PostgreSQL FTS + GIN); `LIKE '%..%'`/seq-scan yasak | `check-search-contract` + Test-1 |
| SRCH-2 | Her `SearchQuery` `tenant_id` taşır; eksikse fail-closed reddedilir | `check-search-contract` + Test-2 |
| SRCH-3 | Tenant izolasyonu index seviyesinde (`per-tenant-index` default) | `check-search-contract` + Test-2 |
| SRCH-4 | Faceted/filter/sort tek indeksli sorguyla; N+1 yok | Test-3 |
| SRCH-5 | `filter`/`sort` yalnız `filter_fields`/`sort_fields` allowlist alanlarında | `check-search-contract` |
| SRCH-6 | Ürün listesi araması p95 < 300ms (100k+ ürün) | Test-1 (PIM-v2 NFR) |
| SRCH-7 | App ham SQL/DSL vermez; yalnız yapısal `SearchQuery` | `check-search-contract` |
| SRCH-8 | `pg-fts` → `opensearch` geçişi `SearchQuery` sözleşmesini bozmaz | Test-1/2 (iki backend) |
| SRCH-9 | AI aktif index tanımını/tenant kapsamını onaysız değiştiremez | CI + AI-guardrail testi |

---

*Bağlı: `docs/core-contract-pack.md` §2.1 (`platform_tenancy`) / §2.6 (`platform_archetype` — `searchIndex`) / §2.9 (Observability — p95) / §3.2 (cursor sayfalama) — kod karşılığı; `docs/reference/PIM-v2-Gereksinim-Analizi.md` §3.1 (arama: FTS→OpenSearch), §NFR (p95<300ms, 100k+ ürün, N+1 yasak), §5.1 (EAV JSONB GIN) — PIM-v2 karşılığı; `src/data/generated/nodes/k-search.json` — WBS düğümü; `k-schema` (searchIndex alanı) / `k-tenancy` (izolasyon) — bağımlılıklar.*
