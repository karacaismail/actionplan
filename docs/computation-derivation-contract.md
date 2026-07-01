# Computation / Derivation Sözleşmesi — Türetilmiş Değerin Denetlenebilir Grafiği

**Sürüm:** 1.0 · **Tarih:** 2026-07-01
**Durum:** Taslak sözleşme (kilitlenmeyi bekliyor — bkz. `plan-03` §6 ADR-A4 / `docs/adr-A4-computation.md`).
**Kapsam:** `k-computation` kernel primitifinin normatif sözleşmesi: fiyat, vergi, BOM-patlama (ürün ağacı açılımı) ve bordro gibi türetilmiş değerlerin, serbest kod yerine saf-fonksiyon derivation (türetme) grafiği olarak modellenmesi.
**Kaynak/bağlam:** `plan-03-yeni-yonergeler-2026-07-01.md` §3.4 (Computation/Derivation yönergesi), `core-contract-pack.md` §3.5 (`platform_computation` primitifi), `core-contract-pack.md` §3.6 (Field-Types — money/measure girdisi).
**Aktörler:** Formül sahibi (insan — fiyat/vergi/uyum ekibi), AI öneri motoru (swarm), Motor (platform runtime), CI (GitHub Actions), tüketici uygulama (Commerce/MRP/Accounting/HRMS).

---

## 1. Amaç

Fiyat, vergi, BOM ve bordro hesabı, 16 uygulamalık portföyün en riskli, en çok denetlenen alanıdır. Bunları uygulamaların içine serbest Python olarak gömmek üç sorun üretir: (1) denetlenemez ("bu KDV neden %18 çıktı?"), (2) 16 kez tekrarlanır, (3) yan-etki riski taşır. Bu sözleşme, türetilmiş her değeri **veri olarak yapısal ifade grafiği** kılar: girdileri, operatörleri, sabitleri açıkça listelenir; motor onu saf (yan-etkisiz, deterministik) çalıştırır. Böylece her türetilmiş değer izlenebilir, yeniden-hesaplanabilir ve versiyonlanabilir olur; hesap hattı (derivation graph) görünür kalır.

## 2. Kapsam

Bu sözleşme kapsar: (a) `computation` ve `derivation_edge` veri modelinin alan yapısını, (b) üç ifade türünü — `formula` | `lookup` (tablo) | `graph` (çok-seviyeli), (c) BOM-patlama (multi-level explosion) semantiğini, (d) determinism ve DAG (döngüsüzlük) invariant'larını, (e) computation'ın validation'dan farkını. Bir *yönerge* (mimari tarif) verir; implementasyon kodunu ajanlar `plan-01` Dalga 1 promptuyla yazar.

## 3. Non-goals (kapsam dışı)

Bu sözleşme şunları yapmaz: **(1)** Serbest JS/SQL çalıştırmaz — yapısaldır (güvenlik ve denetlenebilirlik için); yalnız whitelist operatör düğümleri. **(2)** Validation değildir: validation "değer doğru mu?" sorar; computation "değeri üret" der (bkz. §4). **(3)** Değeri prod veriye AI ile yazmaz; motor türetir, insan formülü onaylar. **(4)** Field-Types tanımlamaz; money/measure tiplerini `k-fieldtypes`'tan girdi alır. **(5)** İş kuralı/otomasyon (ECA) değildir; ECA event→action, computation girdi→çıktı türetmesidir.

## 4. Tanım (jargon, ilk geçişte açıklama)

- **Derivation / türetme:** Başka alanlardan hesaplanan alan (kalıcı yazılabilir ya da anlık hesaplanabilir).
- **İfade grafiği:** Hesabın düğüm-kenar temsili (girdi düğümleri → operatör düğümleri → sonuç); serbest fonksiyon değil.
- **Saf (pure) / deterministik:** Aynı girdiye her zaman aynı çıktı; dış duruma dokunmaz, dış çağrı yapmaz.
- **DAG:** Yönlü döngüsüz çizge; hiçbir derivation kendini (döngüsel) besleyemez.
- **BOM patlama (explosion):** Bir ürün ağacının çok-seviyeli açılımı — yarı-mamul → alt-parça → hammadde miktar/maliyet toplaması.
- **Computation vs Validation:** Validation bir değeri kabul/ret eder (sınır kontrolü); Computation yeni bir değer *üretir* (türetme). İkisi ayrı eksendir; karıştırılmaz.

## 5. Sözleşme şekli (alan | tip | amaç)

Aşağıdaki iki tablo Computation'ın veri modelini alan-alan tanımlar; alan adı + tip + amaç verir, dolu örnek veri (mock) vermez. Tipler SQLAlchemy 2.0 / SQLModel karşılığına eşlenir.

`computation` tablosu — bir türetilmiş alanın hesap tanımını tutar:

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Hesap tanımı benzersiz tanımlayıcı |
| `output_field` | string | Bu hesabın ürettiği çıktı alanı (ör. pricing net-total, tax amount) |
| `inputs` | list[string] | Hesabın tükettiği girdi alanları/anahtarları |
| `expr_kind` | enum(formula\|lookup\|graph) | İfade türü: formül / arama tablosu / çok-seviyeli grafik |
| `tenant_id` | UUID \| null | null = platform profili (ör. standart KDV tablosu); dolu = tenant override |
| `profile` | string | Alan kategorisi (pricing \| tax \| bom \| payroll) |
| `version` | string | Hesap sürümü; eski değerlerin korunması ve denetim için monoton |
| `deterministic` | bool | Saflık beyanı; false ise motor reddeder (determinism zorunlu) |
| `created_at` / `updated_at` | datetime | Audit alanları |

`derivation_edge` tablosu — hesap hattının bağımlılık kenarlarını tutar; bütün graf DAG (döngüsüz) olmak zorundadır:

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Kenar tanımlayıcı |
| `computation_id` | UUID (FK → computation) | Kenarın ait olduğu hesap |
| `depends_on_field_or_computation` | string | Bu hesabın beslendiği alan veya başka bir computation anahtarı |
| `edge_kind` | enum(field\|computation) | Bağımlılık kaynağı: ham alan mı, başka hesap mı |

`graph` kind çok-seviyeli patlama içindir: BOM'da her seviye bir alt-computation'a kenar verir; motor grafiği topolojik sırada çözer. `lookup` kind, girdiyi bir arama tablosuna (ör. jurisdiction→KDV oranı) eşler; `formula` kind, whitelist operatörlerle tek-ifade hesabıdır.

## 6. WBS yerleşimi

Bu sözleşme, `plan-03` §5'teki kernel kümesine `module`-seviyesi bir düğüm olarak girer; altında asıl kod-teslimatını taşıyan en az bir `archetype` düğümü durur. Bir cümle: Computation yalnız şemaya bağımlı olduğu için erken kilitlenebilir.

| Düğüm | Seviye | dependsOn | Küme |
|---|---|---|---|
| `k-computation` | module | `k-schema` | kernel |

`dependsOn` teknik sırayı verir: hesap grafiği şema (alan tipleri) olmadan kurulamaz; bu yüzden `k-schema`'ya bağlıdır ama diğer primitiflere bağlı değildir (paralel kilitlenebilir). `related` ile Commerce/MRP/Accounting/HRMS "computed field" düğümlerine bağlanır (karar üretmez, gezinme). `task-to-code-contract` gereği `k-computation` bir `module` düğümü olarak sözleşme/şema taşır; kod alt `archetype` düğümünde yazılır.

## 7. Backend

Motor tarafı `platform_computation` paketinde yaşar (`core-contract-pack` §3.5). `ComputationDef` grafiği yorumlar; `ComputationEngine.evaluate(key, inputs, tenant_id)` sonucu + kullanılan girdiler + `graph.version` ile izlenebilir döner. **Yan etki YOK, dış çağrı YOK; serbest Python evaluate YASAK** — yalnız whitelist operatör düğümleri. Tetikleyici (`trigger`) üç değerden biridir: `on_write` (yazma anında kalıcılaştır) | `on_query` (sorgu anında hesapla) | `batch` (toplu yeniden-hesap). SQLAlchemy 2.0 modeli + Alembic expand-contract migration (downgrade zorunlu) + Strawberry GraphQL tipi + REST endpoint (`Depends(require_tenant)`). Hesap *sonucu* audit'lenmez (hacim); ancak `computation` tanım değişiklikleri ve versiyon geçişleri `AuditLogger.log()` ile yazılır — "fiyat kuralı ne zaman, kim tarafından değişti" izlenir. Hata formatı `{code, message, trace_id, details}`; `get_logger()` kullanılır, `print()` yasaktır. Grafik `k-fieldtypes` money/measure tiplerini tip-güvenli girdi alır; hatalı boyut/kur karışımı hesap anında değil **tanım anında** reddedilir (`DimensionMismatchError`).

## 8. Frontend (config-driven, mode-aware)

Türetilmiş alanlar ön yüzde salt-okunur ("computed") gösterilir ve elle düzenlenemez. Yüzey, hangi alanların türetildiğini ve hesap hattını runtime konfigürasyonundan (form şeması) okur; kodda alan-alan `if` dalı yazılmaz. Fiyat/vergi gibi mode-duyarlı hesaplar `mode_profile`'ın `pricing_policy_ref` / `tax_policy_ref`'i üzerinden çözülür — B2B ve B2C farklı computation profiline bağlanabilir, ama ön yüz farkı config'ten alır. Derivation graph'ı bir "neden bu değer?" görünümü olarak açığa çıkarılabilir (denetlenebilirlik); bu görünüm de projected şema-render kullanır. Vite + React + TanStack + RHF/Zod stack'i sabittir.

## 9. Multi-tenant

Platform profilleri (`tenant_id = NULL`) tüm tenant'lara ortak taban sağlar (ör. yasal KDV tablosu); tenant kendi override'ını tanımlayabilir ama **yalnızca izin verilen düğümlerle**. Alt katman (tenant) üst katmanı (platform) genişletemez, yalnız daraltır/özelleştirir. Her tenant override'ı `tenant_id` ile izole edilir (v1 §2.1 fail-closed): A tenant B'nin fiyat grafiğini göremez. Sistem-katman "resmî" formüller (yasal KDV) yalnız işletmeci/uyum ekibince güncellenir.

## 10. AI guardrail

Dört-aktör iş bölümü (`core-contract-pack` §3.0.1) burada değiştirilemez biçimde uygulanır: **AI önerir → insan onaylar → motor uygular.** AI mevcut fiyat/vergi verisinden ifade grafiği *taslağı* önerebilir (ör. "bu indirim merdiveni şu grafikle temsil edilebilir") ve örnek girdilerde çıktı gösterebilir (`autonomy: draft`); ancak aktif `computation`'ı değiştiremez. Grafik yayımı insan `approval_ref`'i ister; onaysız apply `ApprovalRequiredError` fırlatır ve audit'lenir. AI hesabı çalışma anında **override edemez**: motorun ürettiği türetilmiş değer bağlayıcıdır. **AI'ın döngü (cycle) üreten bir grafik önermesi testte engellenir** (DAG invariant). AI main branch'e push edemez, app/module düğümü üretemez, ruleset override edemez.

## 11. Bağlama

ArcheType "computed field"ları bu primitife referans verir. Tüketiciler: **Commerce** (pricing — net-total, indirim, kampanya), **MRP** (BOM-patlama + routing maliyeti), **Accounting** (defter türetme), **HRMS** (bordro kalemleri). `mode_profile` fiyat/vergi profilini `*_policy_ref` üzerinden bu primitife bağlar. `k-fieldtypes` money/measure girdiyi sağlar. `plan-01` Dalga 2'de Commerce pricing ve ileride MRP BOM bu primitifi tüketerek türetilmiş değerin doğruluğunu kanıtlar.

## 12. Test stratejisi

Test-önce zorunludur (önce kırmızı, sonra yeşil):

| # | Test | Tür |
|---|---|---|
| 1 | DAG doğrulaması: grafik döngü içermiyor (döngü tanımı reddediliyor) | Unit |
| 2 | Determinism: aynı girdi → aynı çıktı | Unit |
| 3 | Yeniden-hesap: girdi değişince çıktı güncelleniyor (`on_write`/`on_query`) | Integration |
| 4 | Versiyon: eski hesap eski değeri koruyor, yeni versiyon yeni değer üretiyor | Integration |
| 5 | BOM çok-seviyeli patlama doğru (miktar/maliyet toplaması) | Integration |
| 6 | Tip güvenliği: boyut/kur uyumsuzluğu tanım anında reddediliyor | Unit |
| 7 | Whitelist: serbest kod/operatör dışı ifade reddediliyor | Unit |
| 8 | Cross-tenant izolasyon: A tenant B'nin override'ını göremiyor | Integration |

## 13. Acceptance criteria

- AC-1: Bir türetilmiş alan (ör. net-total) girdilerden yeniden-hesaplanabilir ve izlenebilir üretiliyor.
- AC-2: Döngüsel bir grafik tanımı reddediliyor (DAG invariant).
- AC-3: Aynı girdi her çağrıda aynı çıktıyı veriyor (determinism).
- AC-4: Girdi değişince çıktı güncelleniyor; eski versiyon eski değeri koruyor.
- AC-5: BOM çok-seviyeli patlama miktar ve maliyeti doğru topluyor.
- AC-6: Serbest kod / whitelist-dışı operatör reddediliyor; hesap tanımı yalnız yapısal grafik.
- AC-7: Aktif hesabı yalnız insan onayı değiştiriyor; AI draft ile sınırlı.

## 14. Anti-patterns (yasak desenler)

- **Serbest Python/SQL/JS evaluate:** Hesabı koda gömmek; denetlenebilirliği ve güvenliği yok eder, yasak.
- **Döngülü grafik:** Bir derivation'ın kendini beslemesi; DAG invariant'ını ihlal eder.
- **Non-deterministik hesap:** Rastgelelik/zaman/dış-çağrı içeren türetme; `deterministic=false` reddedilir.
- **Validation ile karıştırma:** "Değer doğru mu?" mantığını computation'a koymak; ikisi ayrı eksendir.
- **Float ile para:** Money tipini `float` ile temsil etmek; yuvarlama kaybı üretir, `k-fieldtypes` Money zorunlu.
- **AI'ın hesabı override etmesi:** Motor sonucunu çalışma anında değiştiren AI yolu; fail-closed ilkesini deler.
- **Tenant'ın platform tabanını genişletmesi:** Tenant override'ının izin-dışı düğüm eklemesi; katman yalnız daraltır.

## 15. DoD (Definition of Done)

§12'deki 8 testin tamamı yeşil; migration downgrade otomatik test geçti; DAG ve determinism invariant'ları kanıtlandı; BOM çok-seviyeli patlama doğrulandı; `check-core-contract`, `check-short-code`, `check-dependency-policy` yeşil; MRP BOM ve Commerce pricing bu primitifi tüketiyor; PR açıldı, insan reviewer merge etti (main'e doğrudan push yok).

## 16. Requirement-ID tablosu

Aşağıdaki tablo sözleşmenin izlenebilir gereksinimlerini kimliklendirir; her satır bir gereksinim, katmanı, önceliği, test türü, ilgili acceptance criteria ve sahibiyle eşlenir.

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| CD-01 | `computation` şeması (output/inputs/expr_kind/version/deterministic) | Backend | P0 | Unit | AC-1 | Kernel geliştirici |
| CD-02 | `derivation_edge` kenarları + DAG kısıtı | Backend | P0 | Unit | AC-2 | Kernel geliştirici |
| CD-03 | DAG doğrulaması (döngü reddi) | Backend | P0 | Unit | AC-2 | Kernel geliştirici |
| CD-04 | Determinism (saf fonksiyon, dış çağrı yok) | Backend | P0 | Unit | AC-3 | Kernel geliştirici |
| CD-05 | Yeniden-hesap (girdi değişince çıktı güncelleniyor) | Backend | P0 | Integration | AC-4 | Kernel geliştirici |
| CD-06 | Versiyon: eski hesap eski değeri koruyor | Backend | P0 | Integration | AC-4 | Kernel geliştirici |
| CD-07 | BOM çok-seviyeli patlama (miktar/maliyet) | Backend | P0 | Integration | AC-5 | Kernel geliştirici |
| CD-08 | Whitelist operatör; serbest kod reddi | Backend | P0 | Unit | AC-6 | Kernel geliştirici |
| CD-09 | Field-Types tip güvenliği (money/measure) | Backend | P1 | Unit | AC-1 | Kernel geliştirici |
| CD-10 | Cross-tenant izolasyon + platform/tenant katman | Multi-tenant | P0 | Integration | AC-1 | Kernel geliştirici |
| CD-11 | Aktif hesabı yalnız insan onayı değiştiriyor; AI draft + döngü engeli | Governance | P0 | Integration | AC-7 | Kernel geliştirici |
| CD-12 | Computed field ön yüzde salt-okunur (config-driven) | Frontend | P1 | Statik analiz | AC-1 | Frontend geliştirici |

---

*Kaynak yönerge: `plan-03` §3.4. Kardeş sözleşmeler: `mode-profile-contract.md`, `capability-entitlement-contract.md`, `pdp-policy-contract.md`. Bu doküman hiçbir kod/şema/JSON dosyasına dokunmaz; yalnız sözleşme metnidir. Çelişki halinde `core-contract-pack.md` (kernel runtime) önceliklidir; bu doküman güncellenir. Sözleşmeyi değiştirme yetkisi yalnız insan onayındadır; AI bu dosyayı doğrudan güncelleyemez.*
