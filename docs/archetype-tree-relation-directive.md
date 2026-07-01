# ArcheType Ağaç / Graf / Temporal İlişki Yönergesi — Hiyerarşik İlişki Modeli

Sürüm: 1.0 — 2026-07-01 · Durum: Normatif yönerge; `src/schemas/archetype.ts`'teki `RelationSchema`'yı genişletir, `docs/archetype-uretim-spec.md §12.C` ile hizalar, çelişen her tanımı geçersiz kılar. Statü: **AI-DRAFT** — ajan taslak önerir; insan (platform/tenant owner) onaylar; motor uygular.
Kaynak: `elestiri-01-archetype-2026-07-01.md §3.3` (düz ilişki modeli boşluğu — graf/ağaç/temporal yok), `docs/archetype-uretim-spec.md §12.C-12.D` (effectivity/tree/polymorphic/temporalScope/BOM-graph), `src/schemas/archetype.ts` (`RelationSchema`: 4 kardinalite + `onDelete`), `docs/reference/PIM-v2-Gereksinim-Analizi.md §4` (Category/ProductFamily/Taxonomy ağaçları, 3 nested-set; Özellik 6, 13).
Bu doküman *sözleşme/mimari tarif* verir — ürün kodu `platform` reposunda yazılır. Stack FastAPI + SQLAlchemy 2.0 + PostgreSQL (`ltree`); **Next.js/Supabase/Prisma yasaktır.** İlişki ağını **çizmez**; alan + tip + amaç olarak tanımlar; dolu/mock veri vermez.

---

## 1. Amaç

`elestiri-01 §3.3` şu boşluğu saptar: mevcut `RelationSchema` yalnız dört düz kardinalite (`one-to-one`/`one-to-many`/`many-to-one`/`many-to-many`) + `onDelete` taşır; özyinelemeli hiyerarşi, çok-biçimli hedef ve zaman-kapsamlı ilişki birinci-sınıf değildir. Bu yönerge o boşluğu kapatır: ArcheType'ın ilişki parçasını **ağaç (tree) + graf (dag/graph) + temporal** eksenlerinde genişletir; org şeması, kategori ağacı, çok-seviyeli BOM, taksonomi ve tarih-geçerli reçete gibi senaryoları yamayla değil sözleşmeyle ifade eder. Aktör-açık: *ajan* ilişki tanımı önerir (draft); *insan* onaylar; *motor* uygular; *CI* döngü-yokluğunu ve alt-ağaç sorgu performansını ölçer.

## 2. Kapsam

Kapsam: (1) `RelationKind` enum'unun `tree`/`dag`/`graph`/`temporal` ile genişlemesi, (2) hiyerarşi taşıma alanları (`parent`/`path`/`depth`) ve depolama seçimi (`ltree` vs nested-set vs adjacency, materialized path), (3) temporal alanlar (`valid_from`/`valid_to`/`revision`), (4) ağaç işlemleri (alt-ağaç, ata zinciri, taşıma, yeniden-parent), (5) WBS/archetype yerleşimi, (6) PostgreSQL + SQLAlchemy backend, (7) frontend ağaç gezgini, (8) multi-tenant izolasyon, (9) AI guardrail, (10) Category/ProductFamily/Taxonomy bağlaması. Backend, frontend, test ve AI sınırları ilgili bölümlerde tarif edilir.

## 3. Non-goals

Bu yönerge kapsamaz: (1) BOM patlaması/miktar hesabı — o Computation'ın işidir (`docs/computation-derivation-contract.md`, `archetype-uretim-spec §12.A.4`); bu yönerge yalnız yapıyı verir. (2) BOM-graph'ın MRP-özel semantiği (phantom/alternatif) — o `archetype-uretim-spec §12.D`'de kalır; buradaki `graph` genel altyapıdır. (3) Effectivity'nin costing/routing disiplini — o §12.C/12.D'de. (4) Aktör rolü grafiği (`party_relation`) — o `docs/actor-party-contract.md`'dedir; ArcheType ilişkisi ondan ayrı eksendir. (5) Ağaç görünümünü çizmek (wireframe yok); yalnız bileşen + prop + davranış tanımı. (6) Mevcut dört düz kardinalitenin davranışını değiştirmek — yalnız yeni `kind`'lar + yeni alanlar eklenir, geriye-dönük uyum korunur.

## 4. Tanım (nedir / ne yapar / ne yapmaz)

**Nedir:** Hiyerarşik/graf/temporal ilişki modeli, `RelationSchema`'nın bir ilişkinin *şeklini* (düz kenar mı, özyinelemeli ağaç mı, yönlü graf mı) ve *zaman-kapsamını* (ne zaman geçerli) beyan etmesini sağlayan genişletmedir. Bir ArcheType'ın kendine (self-recursive) veya başka tipe ağaç/graf/temporal olarak bağlanmasını sözleşme düzeyinde tanımlar.

**Ne yapar:** Aynı tipten üst/alt ilişkisini (`tree`) `parent`/`path`/`depth` ile taşır; alt-ağaç, ata zinciri, taşıma ve yeniden-parent işlemlerini deterministik kılar; çok-hedefli yönlü bağı (`dag`/`graph`) döngü-tespitiyle modeller; ilişkiye zaman ekseni (`temporal`: `valid_from`/`valid_to`/`revision`) ekleyerek geçmişi silmeden yeni geçerlilik penceresi açar; her ağaç mutasyonunu audit'ler.

**Ne yapmaz:** Değer üretmez (BOM patlaması, fiyat — Computation'ın işi). Döngüye izin vermez (`tree`/`dag`'te bir düğüm dolaylı olarak kendi atası olamaz; CI kapısı bloklar). Geçmişi yeniden yazmaz (`temporal` pencere silinmez, kapatılır; append-only, `archetype-uretim-spec §4`). İlişkiyi koda gömmez (hiyerarşi veridir, `if parent == ...` değil `path`/`ltree` sorgusudur). Tenant sınırını aşmaz (ağaç kenarları tek tenant içinde çözülür).

## 5. Sözleşme şekli — RelationKind genişlemesi

`RelationSchema.kind` enum'u aşağıdaki değerlerle genişler; her yeni `kind` kendi taşıyıcı alanlarını ister. Yeni alanlar opsiyonel-varsayılanlıdır; mevcut dört kardinalite ve `onDelete` korunur (geriye-dönük uyum). Bu tablo yeni `kind` değerlerini ve amacını tanımlar.

| kind | Nedir | Öncelikli senaryo | Zorunlu ek alan |
|---|---|---|---|
| `tree` | Aynı tipten özyinelemeli üst/alt (self-recursive) | Category, ProductFamily, org şeması | `parent`, `path`, `depth` |
| `dag` | Yönlü, döngüsüz çok-parent graf | Taksonomi çoklu-üst, yetki devri | `edgeFrom`, `edgeTo`, `cycleGuard` |
| `graph` | Yönlü graf (döngü-tespiti zorunlu) | BOM-graph yapısı (§12.D) | `edgeFrom`, `edgeTo`, `cycleGuard` |
| `temporal` | Zaman-kapsamlı ilişki (herhangi kind'a eklenir) | Tarih-geçerli reçete/rota, geçmiş bağ | `validFrom`, `validTo`, `revision` |

Bu tablo yeni `kind`'ların taşıdığı alanları (alan + tip + amaç) tanımlar; tipler PostgreSQL/SQLAlchemy 2.0 karşılıklarıdır, dolu değer verilmez.

| Alan | Tip | Amaç |
|---|---|---|
| `parent` | UUID (FK → self, nullable) | `tree`'de bir düğümün doğrudan atası; NULL = kök |
| `path` | `ltree` (indexed, GiST) | Materialized path = kökten düğüme yol; alt-ağaç/ata sorgusu tek kolonda |
| `depth` | Integer (>= 0) | Kök = 0; seviye kısıtı ve derinlik-sınırı (ör. varyant max 3) için |
| `edgeFrom` / `edgeTo` | UUID (FK) | `dag`/`graph` yönlü kenarın kaynak/hedefi |
| `cycleGuard` | Boolean (default true) | `dag`/`graph`'te döngü-tespitini zorunlu kılar; kapatılamaz (CI) |
| `validFrom` | TIMESTAMPTZ (NOT NULL) | `temporal` ilişkinin geçerlilik başlangıcı |
| `validTo` | TIMESTAMPTZ (nullable) | Geçerlilik bitişi; NULL = süresiz (açık pencere) |
| `revision` | Integer (>= 1) | Aynı ilişkinin sürüm numarası; yeni pencere yeni revision açar |
| `storage` | Enum(ltree, nested-set, adjacency) | Hiyerarşinin fiziksel taşınma stratejisi (§6 kuralı) |

Depolama seçimi (kural §6'da sabitlenir): **`ltree` (materialized path)** = varsayılan; `path` kolonu kökten yolu tutar, alt-ağaç `path <@ :atapath` ile tek indeksli sorgu; yazma ucuz, taşıma alt-ağacın path prefix'ini günceller. **nested-set** = okuma-ağır, seyrek-yazılan derin ağaçta alt-ağaç sayımı için opt-in; taşıma pahalı (left/right yeniden numaralanır). **adjacency** = yalnız `parent` kolonu; sığ ağaç/basit senaryo; derin alt-ağaç sorgusu recursive CTE ister. Karar kuralı: sık taşıma + alt-ağaç sorgusu → `ltree`; nadir yazma + yoğun alt-ağaç toplama → nested-set; sığ + basit → adjacency.

## 6. Ağaç işlemleri

Aşağıdaki dört işlem `tree`/`dag`/`graph` üzerinde deterministik ve audit'li olmalıdır; her biri döngü-tespitinden geçer. Bu tablo zorunlu ağaç işlemlerini ve `ltree` karşılığını tanımlar.

| İşlem | Nedir / ne yapar | `ltree` karşılığı |
|---|---|---|
| Alt-ağaç (subtree) | Bir düğümün tüm torunlarını getirir | `WHERE path <@ :node_path` (GiST indeksli) |
| Ata zinciri (ancestors) | Kökten düğüme yolu getirir | `WHERE path @> :node_path` |
| Taşıma (move) | Bir alt-ağacı yeni parent altına taşır | Alt-ağacın `path` prefix'i toplu güncellenir |
| Yeniden-parent (re-parent) | Tek düğümün atasını değiştirir | `parent` + kendi ve torun `path`/`depth` yeniden hesaplanır |

Kural: her taşıma/yeniden-parent **döngü-tespiti** (`cycleGuard`) çalıştırır — hedef, taşınan alt-ağacın torunu olamaz (aksi halde `CycleDetectedError`, işlem reddedilir). Taşıma tek transaction'da atomiktir; alt-ağacın `path`/`depth` değerleri tutarlı kalır. `temporal` ilişkide taşıma yeni `revision` açar, eski pencereyi `validTo` ile kapatır (silmez). Kök taşınamaz-silme yerine `status=archived`.

## 7. WBS / archetype yerleşimi

Bu genişletme kendi kod-teslimatını `k-archetype-relation` düğümünde toplar; `k-schema` ilişki tanım temeline ve `k-tenancy` izolasyon sınırına teknik olarak bağlıdır (`dependsOn`), `k-party` ve `k-mode` ile yalnız gezinir (`related`). `wbs-field-semantics`: `dependsOn` = kritik yol; `related` = gezinme. Bu tablo düğüm yerleşimini tanımlar.

| Düğüm | Seviye | dependsOn | Küme |
|---|---|---|---|
| `k-archetype-relation` | archetype | `k-schema`, `k-tenancy` | archetype |

`dependsOn` gerekçesi: ilişki alanları şema temeline (`k-schema`) ve tenant kolonuna (`k-tenancy`) bağlıdır; bunlar hazır olmadan ağaç/temporal ilişki yazılamaz. BOM-graph (`archetype-uretim-spec §12.D`) ve Computation (`k-computation`) kendi `dependsOn`'larında bu düğümü listeler — yapı hesaptan önce gelir.

## 8. Backend (PostgreSQL ltree + SQLAlchemy)

Aşağıdaki gereksinimler test-önce (kırmızı→yeşil) yaşam döngüsüne tabidir.

- **PostgreSQL:** `ltree` uzantısı (`CREATE EXTENSION ltree`); `path` kolonu `ltree` tipinde, **GiST indeksli** (`USING gist(path)`) — alt-ağaç/ata sorgusu `<@`/`@>` ile indekslenir. `(tenant_id, path)` bileşik erişim; her ağaç kenarı `tenant_id` taşır.
- **SQLAlchemy 2.0:** `Mapped[...]` modeli; `path` için `sqlalchemy-utils` `LtreeType` (veya eşdeğer). `parent` self-referential FK; `depth` kolonu. Recursive CTE gereken durumda `select().cte(recursive=True)`.
- **Alembic:** expand-contract; `downgrade()` dolu ve `alembic downgrade -1` ile CI'da test edilir (boş downgrade yasak). `ltree` uzantısı migration'da açılır.
- **Servis arayüzü:** `subtree(node)`, `ancestors(node)`, `move(node, new_parent)`, `reparent(node, parent)`; hepsi `cycleGuard` çalıştırır ve `AuditLogger.log()` ile `resource=relation` yazar.
- **Temporal çözüm:** `effective_edges(at)` verilen anda geçerli (`valid_from <= at < valid_to`) kenarları döndürür; `temporalScope` (`archetype-uretim-spec §12.C`) ilişki kümesini tek bir zaman ekseninde okur.
- **Hata formatı:** `{code, message, trace_id, details}`; `CycleDetectedError` ayrı kod; `get_logger()` kullanılır, `print()` yasak.

## 9. Frontend (ağaç gezgini)

Vite + React + TanStack yığınına ve config-driven surface ilkesine uyar.

- **Ağaç gezgini bileşeni:** Genişlet/daralt (expand/collapse), lazy-load (büyük alt-ağaç talep-üzerine çekilir; tüm ağaç bir kerede yüklenmez), sanallaştırılmış satır (derin ağaçta performans). Alt-ağaç `subtree` endpoint'inden TanStack Query ile çekilir.
- **Taşıma:** Sürükle-bırak yeniden-parent; drop hedefi geçersizse (döngü) UI reddeder ve neden metnini gösterir (yalnız renkle değil).
- **Temporal görünürlük:** Geçmiş kenarlar (`validTo` geçmiş) salt-okunur "geçmiş" olarak ayrışır; "belirli tarihteki ağaç" görünümü (`effective_edges(at)`) seçilebilir.
- **Erişilebilirlik:** WCAG 2.2 AA taban; ağaç `role=tree`/`treeitem`, klavye ok-tuşu gezinme, `aria-expanded`/`aria-level`; dokunma hedefi >= 44x44px.
- **i18n:** Düğüm etiketleri `I18nText` üzerinden çok-dilli; ham string gömülmez.

## 10. Multi-tenant / RLS

Her ağaç kenarı (`parent`/`path`/`edge`) ve her temporal ilişki `tenant_id` taşır ve fail-closed çalışır (bağlam yoksa reddedilir). Alt-ağaç/ata sorgusu asla tenant sınırını aşmaz — `path <@` filtresi tenant izolasyonunun *içinde* ikinci daraltmadır. Cross-tenant taşıma girişimi `TenantViolationError` fırlatır ve audit'lenir. İkinci bariyer PostgreSQL RLS: `USING (tenant_id = current_setting('app.current_tenant')::uuid)`. Bir tenant'ın ağacı başka tenant'ın düğümüne re-parent edilemez.

## 11. AI guardrail (autonomy seviyesi)

Değiştirilemez iş bölümü: **AI önerir → insan onaylar → motor uygular** (`claude-ai-archetype-eca-directive`). Bu tablo ilişki mutasyonlarında AI sınırlarını tanımlar.

| İşlem | Autonomy | Kural |
|---|---|---|
| Ağaç/ilişki *tanımı* önerme | `draft` | AI hiyerarşi taslağı önerir; doğrudan aktif edemez |
| Taşıma / yeniden-parent | onay-zorunlu | `approval_ref` (insan) olmadan `ApprovalRequiredError` |
| Yeni `kind` icadı | `none` | `RelationKind` şema PR'ıyla eklenir; AI enum genişletemez |
| Döngü-tespiti / audit değişimi | `none` | `cycleGuard` kapatılamaz; audit append-only |

Mutlak sınırlar: AI main'e push edemez; app/module üretemez/silemez; `cycleGuard`'ı devre dışı bırakamaz; `temporal` pencereyi geriye dönük silemez/yeniden yazamaz; kanıtsız "bitti" diyemez.

## 12. Bağlama (Category / ProductFamily / Taxonomy)

PIM-v2 §4 üç nested-set ağacı sayar: Category, ProductFamily, Taxonomy/TaxonomyNode (§3.1 `ltree` seçimi; Özellik 6, 13). Bu yönerge onları `tree`/`dag` genişlemesiyle taşır. Bu tablo bağlamayı tanımlar.

| PIM-v2 varlığı | kind | storage | Not |
|---|---|---|---|
| Category (Özellik 6) | `tree` | `ltree` | Tek-parent kategori ağacı; alt-ağaç filtre |
| ProductFamily (Özellik 6) | `tree` | `ltree` | Öznitelik miras zinciri (family → product → variant) |
| Taxonomy/TaxonomyNode (Özellik 13) | `dag` | `ltree` + kenar | ETIM/UNSPSC/GPC; düğüm çoklu-üst olabilir → `dag` |

**Taxonomy yönergesi:** Taksonomi (ETIM/UNSPSC/GPC) tek-parent varsaymaz; bir düğüm birden çok üst altında görünebilir → `kind=dag` (döngüsüz çok-parent). ETIM özellik önerileri düğüme bağlanır (PIM-v2 Faz 3); Computation bu yapıyı okur ama değiştirmez. PIM-v2 nested-set kararı bu yönergede `ltree` (materialized path) ile taşınır — okuma-ağır alt-ağaç toplama gerekirse ilgili ağaç `storage=nested-set` ile opt-in eder.

## 13. Test stratejisi

Aşağıdaki testler `check-archetype-relation` CI kapısında zorunludur; bir ilişki bunları geçmeden merge edilemez. Bu tablo zorunlu test senaryolarını tanımlar.

| # | Senaryo | Test türü |
|---|---|---|
| 1 | Döngü yok: taşıma/yeniden-parent bir düğümü kendi atası yapamıyor | Birim + entegrasyon (negatif) |
| 2 | Alt-ağaç performansı: derin ağaçta `subtree` sorgusu GiST indeksiyle p95 bütçesinde | Performans (yük) |
| 3 | Ata zinciri: `ancestors` kökten yolu doğru döndürüyor | Birim |
| 4 | Temporal: `effective_edges(at)` verilen andaki geçerli kenarları döndürüyor | Birim |
| 5 | Taşıma atomik: alt-ağaç `path`/`depth` tutarlı, kısmi güncelleme yok | Entegrasyon |
| 6 | Tenant izolasyonu: A tenant B'nin ağacına re-parent edemiyor (>= 10 negatif) | Entegrasyon (negatif) |
| 7 | Migration downgrade: `alembic downgrade -1` veri kaybetmeden çalışıyor | CI |
| 8 | Audit: taşıma/yeniden-parent append-only audit'e düşüyor | Entegrasyon |

## 14. Acceptance criteria

Bu yönerge şu ölçütlerde "uygulanmış" sayılır: (1) `RelationKind` `tree`/`dag`/`graph`/`temporal` ile genişledi, `parent`/`path`/`depth`/`validFrom`/`validTo`/`revision`/`storage` alanları şemada tanımlı ve varsayılanlı; (2) döngü-tespiti taşıma/yeniden-parent'ta zorunlu ve >= 10 negatif case ile kanıtlı; (3) alt-ağaç sorgusu `ltree` GiST indeksiyle p95 bütçesinde; (4) `effective_edges(at)` temporal çözüm doğru; (5) §13'teki 8 test yeşil; (6) tenant izolasyonu ağaç kenarlarında zorlanıyor; (7) Category/ProductFamily/Taxonomy PIM-v2 §4 ile bağlandı (Özellik 6, 13); (8) mevcut dört düz kardinalite geriye-dönük bozulmadı.

## 15. Anti-patterns

Aşağıdakiler yasaktır; CI veya review reddeder. Hiyerarşiyi koda gömme (`if parent == root` — YASAK; `path`/`ltree` sorgusudur). Alt-ağacı N+1 ile gezme (her düğüm için ayrı sorgu — YASAK; `path <@` tek sorgu). `cycleGuard`'ı kapatıp döngüye izin verme (YASAK; malzeme kendini içeremez). `temporal` pencereyi fiziksel silme/yeniden yazma (YASAK; `validTo` ile kapat, yeni `revision` aç). Taşımayı transaction dışı yapıp `path` tutarsız bırakma (YASAK; atomik). Taksonomiyi zorla tek-parent (`tree`) sayma (YASAK; ETIM çoklu-üst → `dag`). Tenant sınırını `path` sorgusuyla aşma (YASAK; `path <@` tenant içinde daraltır). AI'ın `approval_ref`'siz taşıma yapması (YASAK; `ApprovalRequiredError`).

## 16. Definition of Done

- §13'teki 8 test yeşil (test-önce kanıtı: kırmızı→yeşil belgeli).
- `check-archetype-relation` CI kapısı döngü-yokluğunu + alt-ağaç p95 bütçesini + tenant izolasyonunu + temporal çözümü zorluyor.
- Alembic migration downgrade CI'da çalışıyor; `ltree` uzantısı açık.
- `RelationKind` genişledi; mevcut dört kardinalite + `onDelete` geriye-dönük bozulmadı.
- Category/ProductFamily/Taxonomy PIM-v2 §4 ile bağlandı (Özellik 6, 13); taksonomi `dag` olarak taşınıyor.
- AI-guardrail testi: `draft`-dışı doğrudan taşıma reddediliyor; `cycleGuard` kapatılamıyor.
- `k-archetype-relation` düğümü WBS'te doğru `dependsOn` (k-schema, k-tenancy) ile mevcut.
- Doküman `icerik-kalite-sozlesmesi` biçim kurallarına uyar (aktör-açık, emoji yok, nedir/yapar/yapmaz, her tablodan önce açıklama, mock veri yok).

## 17. Requirement-ID tablosu

Aşağıdaki tablo bu yönergenin gereksinimlerini izlenebilir kılar; her satır `check-archetype-relation` kapısına ve §13 testlerine bağlanır. Öncelik: P0 = bloklayıcı invariant, P1 = çekirdek, P2 = önemli, P3 = iyileştirme.

| ID | Requirement | Layer | Priority | TestType | AcceptanceCriteria | Owner |
|---|---|---|---|---|---|---|
| ATR-01 | `RelationKind` `tree`/`dag`/`graph`/`temporal` genişler | schema | P0 | unit (Zod) | Enum genişledi; mevcut 4 kind korundu | Ajan PR → İnsan |
| ATR-02 | `parent`/`path`/`depth` ağaç taşıyıcı alanları | schema/data | P0 | unit | Alanlar tanımlı; `ltree` path indeksli | Ajan PR → İnsan |
| ATR-03 | `validFrom`/`validTo`/`revision` temporal alanları | schema/data | P0 | unit+integration | Temporal pencere açılır/kapanır, silinmez | Ajan PR → İnsan |
| ATR-04 | Döngü-tespiti (`cycleGuard`) taşıma/yeniden-parent'ta zorunlu | data/logic | P0 | integration(neg) | >= 10 döngü case reddedilir | kernel-team |
| ATR-05 | Alt-ağaç sorgusu `ltree` GiST p95 bütçesinde | performance | P0 | perf(yük) | Derin ağaçta `subtree` p95 bütçede | perf-team |
| ATR-06 | Ağaç işlemleri (subtree/ancestors/move/reparent) atomik+audit'li | data/logic | P0 | integration | Taşıma atomik; path tutarlı; audit düşer | kernel-team |
| ATR-07 | `effective_edges(at)` temporal çözüm | backend | P1 | unit | Verilen anda geçerli kenarlar doğru | kernel-team |
| ATR-08 | Depolama seçimi (ltree/nested-set/adjacency) beyanlı | data | P1 | unit | `storage` alanı §6 kuralına uyar | kernel-team |
| ATR-09 | Tenant izolasyonu ağaç kenarlarında (RLS 2. bariyer) | security | P0 | integration(neg) | Cross-tenant re-parent reddedilir | security-team |
| ATR-10 | Alembic expand-contract + dolu downgrade | backend/devops | P1 | CI | `alembic downgrade -1` veri kaybetmez | kernel-team |
| ATR-11 | AI taşıma `draft` + `approval_ref`; `cycleGuard` kapatılamaz | ai-governance | P0 | integration | approval'sız taşıma reddedilir | governance |
| ATR-12 | AI yeni `kind` icat edemez (autonomy none) | ai-governance | P0 | unit | AI enum genişletemez | governance |
| ATR-13 | Ağaç gezgini config-driven + WCAG 2.2 AA + i18n | frontend/a11y | P1 | e2e+axe | Klavye gezinme; axe critical=0; çok-dilli | ui-team |
| ATR-14 | Category/ProductFamily → `tree`, Taxonomy → `dag` (PIM-v2 §4) | integration | P1 | integration | Özellik 6, 13 ağaçları bağlandı | pim-team |
| ATR-15 | `k-archetype-relation` WBS düğümü doğru dependsOn | governance/wbs | P1 | CI(data-quality) | DAG geçerli, dangling yok | pmo |

---

*Bağlı dokümanlar: `docs/archetype-uretim-spec.md §12.C-12.D` (effectivity/tree/polymorphic/temporalScope/BOM-graph) · `elestiri-01-archetype-2026-07-01.md §3.3` (analiz temeli) · `docs/reference/PIM-v2-Gereksinim-Analizi.md §4` (Category/ProductFamily/Taxonomy; Özellik 6, 13) · `docs/computation-derivation-contract.md` (yapıyı tüketen hesap) · `docs/actor-party-contract.md` (ayrı aktör grafiği) · `claude-ai-archetype-eca-directive.md` (AI sınırı). Bağlı düğümler: `k-archetype-relation`, `k-schema`, `k-tenancy`, `k-computation`. Şema hedefi: `src/schemas/archetype.ts` (`RelationSchema`).*
