# PM Paritesi & AI-Üretim Yol Haritası — Fazlı Eylem Planı

Statü: aktif yönerge · Hedef: `actionplan/` (frontend-only, JSON-as-DB, tek-moderatör, git-temelli).
Bu doküman **yapı ve mantık** aktarır; kod ve ekran çizimi içermez. Her faz **test-önce → şema → geliştirme**
sırasına uyar. Amaç: Jira/ClickUp'ın PM (görünüm + dilimleme + raporlama) boşluğunu kapatmak, ama asıl
enerjiyi sistemin rakipsiz olduğu **AI-üretim/denetim döngüsüne** vermek.

## 0. İlkeler (tüm fazlarda geçerli)

- **Test-önce**: her faz birim + (gerekliyse) e2e/axe test planıyla başlar; testler kırmızıyken geliştirme yok.
- **Engine-first**: tüm hesap/mantık `src/engine`'de saf, UI-bağımsız, test edilebilir fonksiyonlarda; UI yalnız tüketir.
- **JSON-as-DB**: kalıcı durum yalnız JSON + browser-storage override. Yeni alanlar Zod şemasında, geriye uyumlu (default).
- **Mevcut üstünlükleri koru**: 7-seviye WBS, 14 boyut prompt blokları, ECA/agentPolicy yönetişimi, audit skoru, export/import.
- **Kimlik tezi**: genel Jira/ClickUp klonu olma; "AI ajanlarını büyük bir WBS üzerinde yöneten tek planlayıcı" için en iyi araç ol.
- **Erişilebilirlik**: WCAG 2.2 AAA; ≥1rem metin, ≥44px dokunma hedefi, ≥7:1 kontrast, tam klavye; Roboto ≥300; Phosphor ikon; emoji yok.
- **CI kapıları**: her faz typecheck + birim + içerik kalite + quality-lint + e2e/axe + build kapılarını yeşil bırakır (bloklayıcı).

## 1. Ortak mimari taban (Faz 0 bunu kurar, sonrası tüketir)

- **Sorgu/filtre çekirdeği** (`src/engine/query.ts`): TaskNode üzerinde saf yüklem (predicate). Alanlar: `status, level, priority, owner, assignees, milestone, cluster, tag, phase, score(audit), progress, effort, criticalPath`. Operatörler: `eq, neq, in, contains, gt/gte/lt/lte, exists`. Birleştirme: `AND/OR/NOT`, parantez.
- **Kayıtlı görünüm modeli** (`SavedView`): adlandırılmış sorgu + kolon seti + sıralama + gruplama; browser-storage'da saklanır, export/import'a dahil.
- **Görünüm durumu kalıcılığı**: aktif filtre/sıra/kolon `localStorage`'da; oturumlar arası korunur (kullanıcı kuralı: tek mod, hep-düzenlenebilir).
- **Kişi (assignee) kaydı** (`src/data/people.json`): ekip üyeleri (id, ad, rol, kapasite/gün). Çok-kullanıcılı *auth* değil; **atama-veri** katmanı (gerçek çok-kullanıcılı oturum backend ister → kapsam dışı, dürüstçe ertelenir).
- **Görünüm kayıt deseni**: yeni view'lar lazy route (`router.tsx`) + AppShell nav; ECharts/Table tembel yüklenir (paket küçük kalır).

## 2. Faz haritası (sıra + bağımlılık)

| Faz | Ad | Bağımlı | Ufuk |
| --- | --- | --- | --- |
| 0 | Sorgu çekirdeği + görünüm altyapısı + çoklu-assignee + people | — | Yakın |
| 1 | Tablo görünümü + filtre DSL + kayıtlı görünümler | 0 | Yakın |
| 2 | Toplu düzenleme (bulk edit) | 1 | Yakın |
| 3 | Gantt / zaman çizelgesi + baseline | 0 | Yakın |
| 4 | Workload / kapasite | 0, people | Yakın |
| 5 | Raporlar (milestone/faz/efor/akış) | 0 | Yakın |
| 6 | Takvim + hedef/portföy rollup + aktivite günlüğü + görünüm kalıcılığı | 0,1 | Orta |
| 7 | AI ajan köprüsü + audit-güdümlü kuyruk + ECA what-if + ArcheType editör | 0-5 | Uzak |

İlke: 0 → (1,3,4,5 paralel) → 2 → 6 → 7. Yakın ufuk (0-5) bir bütün olarak "PM paritesi"ni tamamlar; 7 kimliği büyütür.

---

## Faz 0 — Sorgu/filtre çekirdeği + görünüm altyapısı + çoklu-assignee

**Amaç:** Tüm yakın-ufuk fazlarının üstüne bineceği ortak temeli (sorgu, kayıtlı görünüm, kişi kaydı, çoklu-atama) kurmak.

**Kapsam (yapı):** query engine; SavedView + people Zod şemaları; `assignees` alanı; view-state persist modülü. Veri doldurma yok — yalnız şema + fonksiyon imzaları.

**1) Test planı (önce)**
- `query.test.ts`: parser (geçerli/parçalı/hatalı ifade), her operatör, AND/OR/NOT/parantez önceliği, bilinmeyen alan → anlamlı hata, boş sorgu → tümünü geçir.
- `savedView.test.ts`: SavedView Zod validate; persist round-trip; bozuk kayıt → güvenli düş.
- `people.test.ts`: people.json şemaya uyar; kapasite ≥0; id benzersiz.
- `schema.test.ts` eki: `assignees` default `[]`, geriye uyumlu (eski düğüm parse olur).

**2) Şema & engine (yapı, mock yok)**
- `TaskNode.assignees: string[]` (default `[]`) — `owner` tekil sahip kalır; `assignees` çoklu atama.
- `PersonSchema = { id, name, role, capacityPerDay(number), active(boolean) }`; `src/data/people.json` = `Person[]`.
- `SavedViewSchema = { id, name, query(string), columns(string[]), sort({col,dir})[], group(string|null), createdAt }`.
- `QueryAst` + `parseQuery(s): QueryAst | QueryError`; `matchNode(node, ast): boolean`; `filterNodes(nodes, ast): TaskNode[]`.
- `src/store/viewState.ts`: `loadViewState()/saveViewState(partial)` (localStorage, sürümlü anahtar).

**3) Geliştirme yaklaşımı**
- Parser: küçük, bağımlılıksız bir tokenizer + recursive-descent (kütüphane yok); alan adları şemadan whitelisting (Zod enum) → enjeksiyon/serbest-eval YOK.
- Predicate saf fonksiyon; `audit.score` gibi türetilmiş alanlar için node→değer çözücü tablosu.
- people.json reindex'e değil; statik veri; `loadMeta` benzeri eager yükle.
- `assignees` migration: eski düğümlerde yoksa default `[]`; `gen-*` araçları dokunmaz (geriye uyumlu).

**4) UI tanımı**
- Bu faz UI üretmez (altyapı). Yalnız `FilterInput` taslağı sonraki fazlara bırakılır.

**5) Edge case'ler**
- Hatalı sorgu → kullanıcıya satır/sütun konumlu hata; uygulama çökmemeli, son geçerli filtre korunur.
- `localStorage` kotası/devre dışı → sessiz düş (export/import yedek yolu).
- Bilinmeyen/silinmiş assignee id → "atanmamış" gibi ele al, kaydı bozma.

**6) DoD + CI**
- Tüm Faz 0 testleri yeşil; typecheck temiz; `assignees` şema testi geçer; CI kapıları bozulmaz.

---

## Faz 1 — Tablo görünümü + filtre DSL + kayıtlı görünümler

**Amaç:** 424 düğümü tek ekranda sıralanabilir/filtrelenebilir/gruplanabilir bir grid'de dilimlemek; Jira "saved filter" paritesi.

**1) Test planı (önce)**
- `tableModel.test.ts`: kolon türetme, sıralama (alan + yön), gruplama anahtarı, filtre entegrasyonu (query AST → görünür satır kümesi).
- e2e (`/table`): sayfa açılır, filtre yazınca satır sayısı düşer, kolon başlığına tıklayınca sıra değişir, kayıtlı görünüm uygulanır.
- axe: tablo `/table` 320px + masaüstü AAA (rol/başlık/odak).

**2) Şema & engine**
- Yeni şema yok (Faz 0 yeterli). `columnsCatalog` (engine sabiti): hangi alanlar kolon olabilir + başlık (strings.json) + render tipi (metin/rozet/sayı/tarih/ilerleme).

**3) Geliştirme yaklaşımı**
- TanStack Table (`useReactTable`) — sıralama/gruplama/seçim state'i tabloda; filtre `filterNodes(ast)` ile ÖN-filtre (TanStack global filter yerine engine kullan → tutarlılık).
- Büyük liste: satır sanallaştırma (yoğunlukta) veya milestone/level grupla + sayfalı; ilk sürümde 424 satır kabul edilir, gerekirse `@tanstack/virtual`.
- URL + localStorage senkronu: aktif sorgu querystring'e yazılır (paylaşılabilir), localStorage'a düşer.

**4) UI tanımı**
- Bileşen hiyerarşisi: `TableView > [TableToolbar, DataTable, (BulkActionBar Faz 2)]`.
  - `TableToolbar` (props: `query, onQueryChange, savedViews, onApplyView, onSaveView, columns, onToggleColumn`) — alt: `FilterInput` (DSL + hata balonu), `SavedViewMenu`, `ColumnPicker`.
  - `DataTable` (props: `rows, columns, sort, onSortChange, group`) — state: `rowSelection, sorting` (TanStack).
- Etkileşim kuralları: yazma → 200ms debounce → parse → geçerliyse filtrele, değilse hata göster + son filtreyi koru; başlık tıkla → 3'lü döngü (artan/azalan/yok); satır tıkla → `/task/$id`.
- Stil token'ları: hücre `px-2 py-2` (tap-target ≥44px), metin ≥1rem, başlık `font-medium`, çizgi `divide-border`, rozetler mevcut `StatusBadge`; renk yalnız CSS değişkenleri (`--muted-foreground`, `--border`), Roboto ≥300; mobilde yatay scroll + sticky ilk kolon.

**5) Edge case'ler**
- Sıfır eşleşme → boş-durum metni (strings.json), filtre korunur.
- Gruplama + sıralama birlikte → grup içi sıralama; grup başlıkları sayımlı.
- Kayıtlı görünüm silinmiş kolona referans → kolonu yok say, uyar.

**6) DoD + CI**
- `/table` nav + route; e2e+axe yeşil; tüm metin strings.json'da; kayıtlı görünüm round-trip testli.

---

## Faz 2 — Toplu düzenleme (bulk edit)

**Amaç:** Tabloda çoklu seçim → status/owner/assignees/milestone/tarih/priority/phase toptan değiştir; browser-storage override deseniyle.

**1) Test planı (önce)**
- `bulkEdit.test.ts`: `applyBulk(nodes, ids, patch)` yalnız seçili id'leri yamalar; override map'e yazar; diğerlerini bozmaz; geçersiz değer reddedilir.
- e2e: 3 satır seç → durum "done" uygula → sayım/rozet güncellenir; "geri al" override'ı temizler.

**2) Şema & engine**
- Yeni alan yok. `applyBulk(nodes, ids: string[], patch: Partial<TaskNode>): TaskNode[]` (saf) + store `applyBulkPatch(ids, patch)` (override persist + commit).
- Yamalanabilir alan beyaz listesi (engine sabiti): serbest alan yaması yok (audit/dimensions toptan yamalanmaz → kalite kapısı korunur).

**3) Geliştirme yaklaşımı**
- Seçim state tabloda; `BulkActionBar` yalnız `selection>0` iken görünür (sticky alt bar, mobil-dostu).
- Patch tek `updateNode` mantığını çoklu çağırır (tek commit + tek autosave → performans).
- Geri-alma: mevcut `clearLocal` + seçime özel "bu yamayı geri al" (override map'ten ilgili id'leri sil).

**4) UI tanımı**
- `DataTable` satır başına seçim kutusu (aria-label); `BulkActionBar` (props: `count, onApply(patch), onClear`) → alanlar: durum select, sahip/atanan picker (people kaydından), milestone select, tarih, öncelik.
- Etkileşim: seç → bar belir → alan değiştir → "uygula" → optimistic güncelle + autosave; "temizle" seçimi sıfırlar.
- Token: bar `bg-card border-t border-border`, kontroller `tap-target`, ≥1rem; seçim kutusu ≥24px tıklama alanı.

**5) Edge case'ler**
- Karışık mevcut değerler → alan "değiştirme" (boş) durumunda dokunma; yalnız set edilen alanları yamala.
- Çok sayıda seçim (yüzlerce) → tek toplu commit; UI bloklamadan (gerekirse `requestIdleCallback`).

**6) DoD + CI**
- Bulk patch testli; quality-lint golden/köken korunur (bulk audit/dimensions'a dokunmaz); e2e yeşil.

---

## Faz 3 — Gantt / zaman çizelgesi + baseline

**Amaç:** `schedule` verisini zaman çizelgesinde göstermek; kritik yolu bindirmek; planı dondurup (baseline) gerçekleşenle (actualStart/actualEnd) kıyaslamak. ClickUp Gantt + baseline paritesi.

**1) Test planı (önce)**
- `gantt.test.ts`: `toGanttBars(nodes, scope)` — başlangıç/bitiş → bar; tarihsiz düğüm dışlanır; kritik-yol bayrağı taşınır; milestone işaretçileri.
- `baseline.test.ts`: `diffBaseline(node)` — plan vs actual gün farkı (kaydı/erken/geç); baseline yoksa null.
- axe (Gantt görünümü ECharts `role=img` + aria-label).

**2) Şema & engine**
- `schedule.baselineStart/baselineEnd` (opsiyonel, nullable) — "planı dondur" bunları schedule.start/end'den kopyalar.
- `toGanttBars`, `diffBaseline`, `criticalOverlay` engine fonksiyonları (saf).

**3) Geliştirme yaklaşımı**
- ECharts `custom` seri + `renderItem` ile yatay bar Gantt (SVG renderer; mevcut `EChart` sarmalayıcı). Bağımlılık okları ilk sürümde opsiyonel (kritik yol vurgusu yeterli).
- Kapsam seçici: app/milestone bazlı (424 barı aynı anda çizme → grupla/scope).
- Baseline: "Planı dondur" aksiyonu → baseline alanlarını set (override persist); Gantt'ta iki şeritli (plan soluk + gerçek dolu) gösterim.

**4) UI tanımı**
- `GanttView > [GanttToolbar(scope seçici, "planı dondur", baseline aç/kapa), GanttChart]`.
- Etkileşim: scope değiştir → barları yeniden hesapla; bar tıkla → `/task/$id`; baseline açık → kayan görevler renk token'ıyla işaretli (yalnız renk değil, metin/etiketle de).
- Token: gecikme/erken için kontrast ≥7:1 metin + desen; bar yüksekliği dokunma-dostu; mobilde dikey scroll + yatay pan.

**5) Edge case'ler**
- Tarihsiz düğümler (çoğu) → Gantt yalnız tarihli olanları çizer; "planlanmamış" sayacı gösterir.
- start > end → doğrulama uyarısı, çizimde min 1 gün.
- Baseline yokken "gerçek" kıyas → yalnız plan gösterilir.

**6) DoD + CI**
- `/gantt` route+nav; gantt/baseline testli; axe yeşil; tarihsiz çoğunlukta anlamlı boş-durum.

---

## Faz 4 — Workload / kapasite

**Amaç:** Atanan kişi başına adam-gün'ü zaman penceresinde toplayıp aşırı/eksik yükü göstermek. ClickUp Workload paritesi; "dev-ekip yürütme" birincil kullanıcısının çekirdek ihtiyacı.

**1) Test planı (önce)**
- `workload.test.ts`: `workloadByAssignee(nodes, people, window)` — `effort(d)` schedule aralığına yayılır (gün başına eşit); kişi kapasitesine göre yük yüzdesi; çoklu-assignee'de efor bölüşülür; tarihsiz iş "atanmamış zaman" kovasına düşmez (uyarılır).
- Aşırı/eksik tahsis eşiği testi (>%100 aşırı).

**2) Şema & engine**
- `people.json` kapasite (gün/gün). `workloadByAssignee`, `allocationStatus(load, capacity)` engine fonksiyonları (saf).
- Çoklu-assignee paylaşımı: efor `assignees.length`'e bölünür (ilk sürüm; sonra ağırlık).

**3) Geliştirme yaklaşımı**
- Zaman kovaları (gün/hafta) × kişi matrisi → ECharts heatmap veya yığılmış bar.
- Tatil/izin ilk sürümde yok (orta ufuk); kapasite sabit/gün.
- Kaynak: yalnız tarihli + atanmış düğümler; gerisi "planlanmamış/atanmamış" panelinde.

**4) UI tanımı**
- `WorkloadView > [WorkloadToolbar(pencere: hafta/ay, kişi filtresi), WorkloadGrid(heatmap), UnplannedPanel]`.
- Etkileşim: pencere değiştir → yeniden topla; hücre tıkla → o kişinin o aralıktaki görevleri (tablo filtresine köprü).
- Token: aşırı yük yalnız renk değil metin/ikon (≥7:1); kişi satırları ≥44px; mobilde kişi başına kart.

**5) Edge case'ler**
- Kapasitesiz/pasif kişi → "tanımsız kapasite" rozetiyle göster, böl-sıfıra düşme.
- Çakışan aralıklar → günlük toplam; >%100 aşırı işaretli.

**6) DoD + CI**
- `/workload` route+nav; workload aggregation testli; axe yeşil.

---

## Faz 5 — Raporlar (waterfall-uygun)

**Amaç:** Agile burndown/velocity yerine bu projeye uygun raporlar: milestone ilerleme, faz-gate ilerlemesi, efor burn-up (planlanan vs harcanan adam-gün), durum kümülatif akışı.

**1) Test planı (önce)**
- `reports.test.ts`: `milestoneProgress`, `phaseGateProgress`, `effortBurnup`, `statusCumulative` — saf toplayıcılar; bilinen küçük ağaçta beklenen değerler.

**2) Şema & engine**
- Yeni alan yok. Rapor toplayıcıları engine'de saf fonksiyon; mevcut `rollup`, `rollupExecution`, `phases`, `effort` üzerinden.
- Kümülatif akış için anlık görüntü gerekiyorsa: aktivite günlüğü (Faz 6) beslenir; ilk sürüm anlık dağılım.

**3) Geliştirme yaklaşımı**
- ECharts: milestone başına yığılmış ilerleme bar; faz-gate geçiş oranı; burn-up çift çizgi (planlanan kapsam vs tamamlanan); durum dağılımı.
- Her grafik SVG export (mevcut export deseni) → rapor dışa aktarımı.

**4) UI tanımı**
- `ReportsView > [ReportTabs(milestone/faz/efor/akış), ReportChart, ExportButtons]`.
- Etkileşim: sekme değiştir → grafik; filtre (Faz 0 query) ile kapsamı daralt; PNG/SVG indir.
- Token: grafik lejantı ≥1rem, kontrast ≥7:1; başlıklar `font-medium`.

**5) Edge case'ler**
- Boş kapsam → boş-durum; tek-veri noktası → anlamlı min grafik.
- Harcanan>planlanan → aşım vurgusu (metinle de).

**6) DoD + CI**
- `/reports` route+nav; rapor toplayıcıları testli; export çalışır; axe yeşil.

---

## Faz 6 — Orta ufuk: takvim + hedef/portföy + aktivite günlüğü + görünüm kalıcılığı

**Amaç:** Yürütmeyi olgunlaştıran ikincil görünüm/izleme katmanı.

**1) Test planı (önce)**
- `calendar.test.ts`: `toCalendarEvents(nodes, month)` — schedule/milestone → gün hücresi; çok-günlü olaylar.
- `goals.test.ts`: `Goal` şema; `goalRollup(goal, nodes)` — bağlı düğümlerden ilerleme.
- `activity.test.ts`: `appendActivity(entry)` + `loadActivity()` — browser-storage append-only halka tampon (sınırlı boyut).

**2) Şema & engine**
- `GoalSchema = { id, title, metric, target, linkedNodeIds(string[]) }`; `src/data/goals.json` veya browser-storage.
- `ActivityEntry = { ts, actor, nodeId, field, before, after }` — `updateNode/applyBulk` çağrılarında üretilir (tek-moderatör: actor sabit/yerel).
- Görünüm kalıcılığı Faz 0'da kuruldu → burada tüm view'lara yayılır (kolon/sıra/scope hatırlama).

**3) Geliştirme yaklaşımı**
- Takvim: hafif ay-grid (kütüphane yok; tarih matematiği saf util); olaylar milestone/schedule'dan.
- Hedef rollup: mevcut `rollup`/`rollupExecution` üstüne; portföy = app/milestone bazlı toplam.
- Aktivite: append-only, kota-sınırlı (son N kayıt); export'a dahil; tek-moderatör'de "ne değişti" görünürlüğü.

**4) UI tanımı**
- `CalendarView`, `GoalsView`, görev detayında `ActivityTimeline` (props: `entries`); etkileşim: gün/olay tıkla → görev; hedef tıkla → bağlı düğüm filtresi.
- Token: takvim hücresi ≥44px, bugünü metinle de işaretle; ≥1rem; kontrast ≥7:1.

**5) Edge case'ler**
- Aktivite kotası dolması → en eski kayıtları düşür (halka tampon).
- Hedef bağlı düğüm silinmiş → yok say, uyar.

**6) DoD + CI**
- `/calendar`, `/goals` route+nav; testler yeşil; aktivite export/import'a dahil; axe yeşil.

---

## Faz 7 — Uzak ufuk (kimliği büyüten asıl yön)

**Amaç:** Sistemin rakipsiz olduğu AI-üretim/denetim döngüsünü ürünleştirmek. Burada Jira/ClickUp paritesi değil, **fark yaratma** hedeflenir.

### 7A — AI ajan köprüsü
- Her görevin 14 boyut **prompt bloğu** → bir vibecoding ajanına (yerel `claude -p` / harici) gönderilir; çıktı **draft** olarak ArcheType admin akışına girer: `prompt→draft→validation→diff→data-impact→dry-run→preview→approval→apply`.
- Güvenlik sınırı (mevcut `evaluateAgentPolicy`): AI yalnız ArcheType taslağı/öneri; app/module üretemez, ruleset override edemez, doğrudan prod write yok. Köprü bu kapıdan geçer.
- Test-önce: `agentBridge.test.ts` — istek/yanıt sözleşmesi, policy reddi, draft→diff üretimi (gerçek model çağrısı mock'lanır).

### 7B — Audit-güdümlü zenginleştirme kuyruğu
- Bugün elle yaptığımızın (en zayıf düğüm → ajan partisi) **ürünleşmiş hâli**: audit skoru < eşik düğümler otomatik kuyruğa girer; ajan partisi çalışır; sonuç quality-lint + content-gate'ten geçerse draft, geçmezse reddedilir.
- Test-önce: `enrichQueue.test.ts` — eşik seçimi, shard'lama, kapı sonrası kabul/ret.

### 7C — ECA what-if simülasyonu
- Mevcut `evaluateEca/runEca` üstüne: bir olay + bağlam ver → hangi kuralların, hangi sırada, zincir-derinliği ≤6 ile tetikleneceğini **veri değiştirmeden** göster (salt-okunur simülasyon — mevcut ECA görünümünü genişlet).
- Test-önce: zincir simülasyonu + derinlik sınırı + idempotency senaryoları.

### 7D — ArcheType sözleşme editörü
- `ArchetypeContractSchema`'yı (24 parça) admin akışıyla düzenleyen UI; migration güvenliği (delete/rename/type-change doğrudan yasak) + diff/dry-run/onay görünür.
- Test-önce: sözleşme düzenleme → conformance test + migration-policy kapısı.

### Otomasyon senaryoları (openclaw + n8n)
Cowork içi alt-ajanlar oturum-içi yoldur; **ürün/CI yolunda** ajan koşumu kullanıcının Hetzner (Debian/AMD EPYC) kutusunda otomatikleşir:
- **n8n akışı:** zamanlanmış tetik → repo'dan `audit.json` çek → skor<eşik düğümleri seç → `claude -p` shard partisi (yerel swarm) → quality-lint + content-gate → geçenleri PR olarak GitHub'a aç (private repo) → CI yeşilse merge önerisi.
- **openclaw:** ajan koşumlarını orkestre/izole et (shard başına süreç, socket-drop yok), n8n'e durum/sonuç webhook'u.
- Güvenlik: PR-modu (doğrudan main'e yazma yok), test dosyalarına dokunmama, maliyet/oran sınırı — mevcut "güvenli 3b" ilkeleriyle hizalı (yalnız kullanıcı açıkça isterse).

---

## 8. Kapanış

**Sıra & bağımlılık:** 0 → (1,3,4,5 paralel-ish; ama paylaşılan dosyalar — router/strings/engine-index — sırayla düzenlenir) → 2 → 6 → 7. Her faz tek başına CANLI'ya gidebilir (artımlı, her zaman yeşil).

**Ölçüm (her faz):** yeni testler yeşil + mevcut kapılar bozulmadı + audit ortalaması düşmedi + paket boyutu kabul sınırında (ağır görünümler tembel) + canlı doğrulama.

**Riskler:** (a) paylaşılan dosyalarda paralel ajan çakışması → fazlar arası dosya sahipliği netleştirilir, ajanlar izole node/util dosyalarında çalışır; (b) 424 satır tablo/Gantt performansı → sanallaştırma/scope; (c) çok-kullanıcılı gerçek senaryolar backend ister → bilinçli kapsam dışı (assignee yalnız veri).

**Dogfooding (öneri):** Bu 8 fazı, aracın KENDİ WBS'ine düğüm olarak ekle (her faz = archetype/stone, alt adımlar = molecule/element) → araç kendi geliştirme planını yönetir, audit/yürütme/Gantt görünümlerini kendi yol haritasıyla test eder.

