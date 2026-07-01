# MDM / Golden-Record / Provenance Yönergesi — Tek Doğru Kaydın Denetlenebilir Türetimi

**Tarih:** 2026-07-01 · **WBS düğümü:** `k-mdm` · **Statü:** kanonik yönerge (kernel boşluk primitifi). · **Bağlam:** `PIM-v2-Gereksinim-Analizi.md` §Faz 7 (MDM & Veri Yönetişimi) yönergesini tam sözleşmeye çevirir. · **Kural:** Bu dosya *sözleşme/mimari tarif* verir — implementasyon kodu değil; kodu ajanlar `plan-01` Dalga-1 promptlarıyla yazar. AI bu dosyayı doğrudan güncelleyemez; değiştirme yetkisi yalnız insan onayındadır.

Kısa çerçeve: Aynı gerçek-dünya varlığı (ürün, tedarikçi, müşteri) birden çok kaynak sistemde (ERP, pazaryeri, manuel giriş) farklı, çakışan kopyalarla yaşar. MDM bu kopyaları tekilleştirir (dedup), hangi kaynağın hangi alanda kazandığını kurala (survivorship) bağlar ve tek "altın kayıt"ı (golden record) alan-düzeyinde kaynağına (provenance) bağlı biçimde üretir. Bu yönerge, "bu değer nereden geldi, neden bu kaynak kazandı, ne zaman birleşti" sorularını serbest kod yerine sözleşmeye bağlar.

**Stack:** FastAPI + SQLAlchemy 2.0/SQLModel + Alembic + PostgreSQL. **YASAK:** Next.js, Supabase, Prisma.

---

## 1. Amaç

Çok-kaynaklı bir portföyde "tek doğru kayıt" (single source of truth) üretmek, ama bunu **kör bir üzerine-yazma** ile değil, **denetlenebilir bir türetim** ile yapmak. Golden record'un her alanı için "bu değer hangi kaynak sistemden, hangi survivorship kuralıyla, ne zaman seçildi" izlenebilir olmalıdır. Amaç üç riski kapatmak: (1) yinelenen kayıt (aynı ürün iki kez), (2) kaynak-körlüğü ("bu fiyat nereden geldi?"), (3) sessiz-birleşme (merge geri alınamaz, kim yaptığı belirsiz). MDM bu üçünü de veri-olarak-provenance + kural-olarak-survivorship + audit-olarak-merge ile çözer.

## 2. Kapsam

Bu sözleşme kapsar: (a) `GoldenRecord`, `GoldenRecordSource`, `SurvivorshipRule`, `SourceSystem`, `DataSteward` veri modelinin alan yapısını; (b) alan-düzeyi provenance (her alan değeri kaynağına bağlı); (c) deduplication'ı — exact / fuzzy (Levenshtein–Jaro-Winkler) / phonetic / ML — ve benzerlik skorunu; (d) merge audit trail'i (kim, ne zaman, hangi adaylar, hangi kural, geri-alınabilir); (e) survivorship kuralının Computation primitifiyle ilişkisini ve merge kararının PDP ile ilişkisini. Bir *yönerge* (mimari tarif) verir; kodu ajanlar yazar.

## 3. Non-goals (kapsam dışı)

Bu sözleşme şunları yapmaz: **(1)** Veri kalitesi kuralı (validation) tanımlamaz — o `DataQualityPolicy`'nin işidir; MDM kayıt-birleştirir, değer-doğrulamaz. **(2)** Survivorship *hesabını* kendi içinde koda gömmez — kural bir Computation ifade-grafiği olarak yaşar (bkz. §11). **(3)** Merge'i AI ile üretime yazmaz — AI dedup adayı önerir, insan onaylar, motor uygular. **(4)** Field-Types tanımlamaz; alan tiplerini `k-fieldtypes`'tan girdi alır. **(5)** Kimlik doğrulama / yetki *kararı* vermez — merge'in izinli olup olmadığını PDP'ye sorar (bkz. §11). **(6)** Kaynak-sistem entegrasyonunun (ERP/pazaryeri sync) kendisi değildir; kaynaklardan gelen kayıtları alır, onları *çeker* değil.

## 4. Tanım — nedir / ne yapar / ne yapmaz

**Nedir:** Çok-kaynaklı kayıtları tekilleştiren ve alan-düzeyinde kaynağa bağlı tek golden record üreten, merge'i geri-alınabilir + denetlenebilir kılan kernel primitifi. Golden record veri olarak saklanır; her alanı bir `GoldenRecordSource` kaydıyla kaynağına bağlıdır.

**Ne yapar:**
- Aday kayıtları dedup ile eşler: exact (birebir anahtar), fuzzy (Levenshtein/Jaro-Winkler benzerlik eşiği), phonetic (Soundex/Metaphone), ML (öğrenilmiş eşleştirici) — her eşleşme bir benzerlik skoru taşır.
- Survivorship kuralına göre her alan için kazanan kaynağı seçer (ör. "en güncel", "en güvenilir kaynak", "en dolu"), sonucu golden record'a yazar.
- Alan-düzeyi provenance tutar: golden record'un her alanı hangi `SourceSystem`'den, hangi `SurvivorshipRule` ile, hangi zaman-damgasıyla geldi.
- Her merge'i değiştirilemez audit trail'e yazar (adaylar, kural, karar, onaylayan steward, zaman); merge geri-alınabilir (unmerge).
- Değişiklikleri `PIMEvent` (event-sourcing) olarak yayınlar; golden record'un durum-geçmişi yeniden kurulabilir.

**Ne yapmaz:**
- Değeri doğrulamaz (validation ayrı eksen — `DataQualityPolicy`).
- Survivorship hesabını koda gömmez (Computation grafiği).
- Merge'i AI ile onaysız üretime yazmaz (`autonomy: draft` — §10).
- Merge audit trail'ini silmeyi/değiştirmeyi mümkün kılmaz (append-only).
- Eşleşme belirsizse otomatik-birleştirmez — steward onayına (`DataSteward`) düşer.

## 5. Sözleşme şekli (alan | tip | amaç)

Aşağıdaki beş tablo MDM'in veri modelini alan-alan tanımlar; alan adı + tip + amaç verir, dolu örnek veri (mock) vermez. Tipler SQLAlchemy 2.0/SQLModel karşılığına eşlenir. Tüm tablolar `tenant_id` ile izole edilir (v1 §2.1 fail-closed).

`GoldenRecord` — bir gerçek-dünya varlığının tekil, türetilmiş altın kaydı:

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Golden record'un tekil kimliği; kaynak kayıtlar buna işaret eder. |
| `tenant_id` | UUID | Tenant izolasyonu (deny-by-default). |
| `entity_type` | string | Hangi varlık tipi (product / supplier / customer); ArcheType id'ye eşlenir. |
| `merged_from` | list[UUID] | Bu golden record'a birleşen kaynak kayıt kimlikleri (aday küme). |
| `status` | enum(active\|superseded\|unmerged) | Kaydın durumu; unmerge sonrası eski golden record `superseded`. |
| `confidence` | float | Genel eşleşme güveni (dedup skorlarının bileşimi); eşik-altı → steward onayı. |
| `version` | string | Golden record sürümü; her merge/unmerge monoton artırır (audit için). |
| `created_at` / `updated_at` | datetime | Audit alanları. |

`GoldenRecordSource` — golden record'un **her alanı** için kaynak-bağı (alan-düzeyi provenance):

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Provenance kaydının kimliği. |
| `golden_record_id` | UUID (FK → GoldenRecord) | Hangi golden record'un hangi alanı. |
| `field_name` | string | Provenance'ın ait olduğu alan (ör. `price`, `gtin`, `brand`). |
| `source_system_id` | UUID (FK → SourceSystem) | Bu alan değerinin geldiği kaynak sistem. |
| `source_record_id` | UUID | Kaynak sistemdeki orijinal kayıt kimliği (geri-izleme). |
| `survivorship_rule_id` | UUID (FK → SurvivorshipRule) | Bu alanı kazandıran kural (neden bu kaynak seçildi). |
| `value_snapshot` | jsonb | Seçilen değerin o anki anlık görüntüsü (denetlenebilirlik). |
| `selected_at` | datetime | Bu alanın bu kaynaktan ne zaman seçildiği. |

`SurvivorshipRule` — bir alanın hangi kaynaktan kazanacağını belirleyen kural (Computation girdisi):

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Kuralın kimliği; `GoldenRecordSource` bunu referanslar. |
| `tenant_id` | UUID \| null | null = platform tabanı (standart kural); dolu = tenant override. |
| `field_name` | string \| null | Kuralın uygulandığı alan; null = varsayılan/tümü. |
| `strategy` | enum(most_recent\|source_priority\|most_complete\|highest_trust\|computation_ref) | Kazanan-seçme stratejisi; `computation_ref` ise ifade-grafiğine delege eder. |
| `computation_id` | UUID \| null | `strategy=computation_ref` ise Computation primitifindeki grafik (bkz. §11). |
| `source_priority` | list[UUID] | `source_priority` stratejisinde kaynak sistemlerin öncelik sırası. |
| `version` | string | Kural sürümü; eski golden record'ların hangi kuralla üretildiğini izlemek için. |
| `enabled` | bool | Kural aktif mi (default `true`). AI bunu değiştiremez (§10). |

`SourceSystem` — golden record'u besleyen kaynak sistem kütüğü:

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Kaynak sistemin kimliği. |
| `tenant_id` | UUID | Tenant izolasyonu. |
| `name` | string | Kaynak adı (ör. `erp-netsis`, `trendyol`, `manual-entry`). |
| `trust_level` | int | Kaynağın güven derecesi; `highest_trust` survivorship stratejisinde kullanılır. |
| `is_authoritative` | bool | Bu kaynak belirli alanlarda "resmî" mi (ör. muhasebe için ERP). |

`DataSteward` — belirsiz eşleşmeleri inceleyip merge'i onaylayan yetkili:

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Steward kaydının kimliği. |
| `tenant_id` | UUID | Tenant izolasyonu. |
| `party_id` | UUID (FK → Party) | Steward olan aktör (k-party'ye bağ). |
| `scope_entity_type` | string | Steward'ın yetkili olduğu varlık tipi (product / supplier / ...). |
| `assigned_at` | datetime | Atama zamanı (audit). |

Ek olarak merge audit trail bir `MergeDecision` kaydıyla tutulur (append-only, PDP `decision_log` ruhuyla aynı): `candidate_ids`, `resulting_golden_record_id`, `applied_rules`, `decided_by` (steward party_id), `approval_ref` (onay referansı), `similarity_scores`, `reversible: bool`, `ts`, `prev_hash`, `entry_hash` (hash-zinciri, tamper-evident).

## 6. WBS yerleşimi (kernel)

Bu sözleşme, `plan-03` §5'teki kernel kümesine `module`-seviyesi bir düğüm olarak girer; altında asıl kod-teslimatını taşıyan en az bir `archetype` düğümü durur (`task-to-code-contract` gereği: `module` sözleşme/şema taşır, kod alt `archetype`'ta yazılır).

| Düğüm | Seviye | dependsOn | Küme |
|---|---|---|---|
| `k-mdm` | module | `k-computation`, `k-policy-pdp` | kernel (layer0) |

`dependsOn` teknik sırayı verir: survivorship kuralı bir Computation grafiği olarak çalışır (bu yüzden `k-computation`'a bağlıdır) ve merge kararı bir yetki-kapısından geçer (bu yüzden `k-policy-pdp`'ye bağlıdır). `related` ile PIM Product/Supplier ArcheType "golden record" düğümlerine bağlanır (karar üretmez, gezinme).

## 7. Backend

Motor tarafı `platform_mdm` paketinde yaşar. Çekirdek imzalar: `dedup(candidates, strategy, tenant_id) -> [MatchGroup]` (benzerlik skoru + eşleşme kümesi döner); `merge(match_group, approval_ref, tenant_id) -> GoldenRecord` (survivorship uygular, provenance yazar, audit'ler, geri-alınabilir); `unmerge(golden_record_id, approval_ref) -> [SourceRecord]` (birleşmeyi geri alır, geçmiş korunur). Dedup dört strateji sağlar: `exact` (normalize edilmiş anahtar eşitliği), `fuzzy` (Levenshtein / Jaro-Winkler benzerlik ≥ eşik), `phonetic` (Soundex/Metaphone), `ml` (öğrenilmiş eşleştirici skoru). Survivorship *hesabı* Computation motoruna delege edilir (`strategy=computation_ref`) — serbest Python evaluate YASAK; yalnız yapısal grafik.

SQLAlchemy 2.0 modeli + Alembic expand-contract migration (downgrade zorunlu) + Strawberry GraphQL tipi + REST endpoint (`Depends(require_tenant)`). Her merge/unmerge `AuditLogger.log()` ile ve tamper-evident `MergeDecision` hash-zinciriyle yazılır — "kim, ne zaman, hangi adayları, hangi kuralla birleştirdi" izlenir. Değişiklikler `EventPublisher.publish()` ile `PIMEvent` olarak yayınlanır (event-sourcing; transactional outbox garantisi). Celery: `scan_for_duplicates` (periyodik dedup taraması; aday çiftleri üretir, otomatik merge etmez — steward kuyruğuna düşer). Hata formatı `{code, message, trace_id, details}`; `get_logger()` kullanılır, `print()` yasaktır. Alan tipleri `k-fieldtypes`'tan tip-güvenli alınır.

## 8. Multi-tenant

Platform survivorship kuralları (`tenant_id = NULL`) tüm tenant'lara ortak taban sağlar (ör. "GTIN her zaman ERP'den"); tenant kendi override'ını tanımlayabilir ama **yalnızca izin verilen alanlarla** — alt katman (tenant) üst katmanı (platform) genişletemez, yalnız daraltır/özelleştirir. Golden record, kaynak kayıt, provenance ve merge audit `tenant_id` ile izole (RLS, fail-closed): A tenant B'nin golden record'unu, kaynak sistemini veya merge geçmişini göremez. `SourceSystem` ve `DataSteward` tenant-scoped'tur.

## 9. AI guardrail (GÖMÜLÜ — normatif)

Dört-aktör iş bölümü (`core-contract-pack` §3.0.1) burada değiştirilemez biçimde uygulanır: **AI önerir → insan onaylar → motor uygular.** AI mevcut kayıtlardan dedup adayı önerir ve benzerlik skoru gösterir (`autonomy: draft`); ML eşleştirici bir eşleşme *taslağı* üretir. Ancak **merge kararını AI veremez** — golden record'a yazma, survivorship kuralını değiştirme, kaydı birleştirme yalnız insan (`DataSteward`) onayıyla olur. Onaysız merge çağrısı `ApprovalRequiredError` fırlatır ve audit'lenir; her `merge`/`unmerge` bir `approval_ref` (onaylayan steward + zaman + gerekçe) taşır. AI merge audit trail'ini değiştiremez (append-only, hash-zinciri kırılırsa doğrulama başarısız). AI `SurvivorshipRule.enabled`'ı değiştiremez, `SourceSystem.trust_level`'ı override edemez, main branch'e push edemez, app/module düğümü üretemez, ruleset override edemez.

## 10. Bağlama

Survivorship kuralı = **Computation primitifi**: bir alanın kazananını seçme "en güncel / en güvenilir / en dolu" mantığı serbest kod değil, Computation ifade-grafiğidir (`strategy=computation_ref` → `k-computation`); böylece "bu golden değer neden bu kaynaktan?" sorusu Computation'ın izlenebilir hesap-hattıyla cevaplanır (deterministik, versiyonlu). Merge kararı = **PDP**: "bu steward bu golden record'u birleştirebilir mi?" sorusu `k-policy-pdp`'ye sorulur (yetki kararı MDM'de yeniden hesaplanmaz — tek doğruluk kaynağı PDP). Event-sourcing / audit: merge/unmerge `PIMEvent` olarak yayınlanır (v1 §2.3 outbox) ve tamper-evident audit'lenir (v1 §2.5). Provenance zinciri `k-genealogy-graph` ile hizalıdır (kaynak→golden köken izi). Steward = `k-party` aktörü. Tüketiciler: PIM Product/Supplier/Customer ArcheType'ları golden record'u okur; dedup inceleme, golden record çözümleme ve steward atama ekranları Surface'ten config-driven render edilir.

## 11. Test stratejisi

Test-önce zorunludur (önce kırmızı, sonra yeşil):

| # | Test | Tür |
|---|---|---|
| 1 | Exact dedup: birebir anahtarlı iki kayıt tek golden record'a birleşiyor | Unit |
| 2 | Fuzzy dedup: Levenshtein/Jaro-Winkler benzerlik eşik-üstü eşleşiyor, eşik-altı eşleşmiyor | Unit |
| 3 | Phonetic dedup: eş-sesli farklı-yazımlı kayıt yakalanıyor (Soundex/Metaphone) | Unit |
| 4 | Survivorship doğruluğu: kural (most_recent/source_priority/computation_ref) doğru kaynağı seçiyor | Integration |
| 5 | Alan-düzeyi provenance: golden record'un her alanı kaynağına + kurala + zamana bağlı izlenebiliyor | Integration |
| 6 | Merge audit trail: merge kaydı append-only, hash-zinciri doğrulanabilir, elle bozulursa fail | Integration |
| 7 | Unmerge (geri-alınabilirlik): birleşme geri alınıyor, kaynak kayıtlar + geçmiş korunuyor | Integration |
| 8 | AI guardrail: AI merge'i onaysız uygulayamaz; yalnız dedup adayı + skor önerir | Integration |
| 9 | Cross-tenant izolasyon: A tenant B'nin golden record/kaynak/merge geçmişini göremiyor | Integration |

## 12. Acceptance criteria (kabul kriterleri)

- AC-1: İki benzer kayıt (exact/fuzzy/phonetic/ML) tespit edilip benzerlik skoruyla eşleştiriliyor.
- AC-2: Survivorship kurallarına göre golden record'a birleştiriliyor; her alan doğru kaynaktan seçiliyor.
- AC-3: Alan-düzeyi provenance izlenebiliyor: her golden değer hangi kaynak + hangi kural + ne zaman.
- AC-4: Her merge değiştirilemez audit trail'e (hash-zinciri) yazılıyor; merge geri-alınabiliyor (unmerge).
- AC-5: Survivorship kuralı Computation grafiği olarak çalışıyor (serbest kod değil); merge kararı PDP'den geçiyor.
- AC-6: Merge yalnız insan (`DataSteward`) onayıyla uygulanıyor; AI draft + skor ile sınırlı.
- AC-7: Değişiklikler `PIMEvent` olarak yayınlanıyor (event-sourcing); durum-geçmişi yeniden kurulabiliyor.

## 13. Anti-patterns (yasak desenler)

- **Kör üzerine-yazma merge:** Provenance tutmadan kaynağı ezmek; "bu değer nereden geldi?" cevapsız kalır, yasak.
- **Survivorship'i koda gömmek:** Kazanan-seçme mantığını serbest Python'a yazmak; Computation grafiği zorunlu (denetlenebilirlik).
- **Geri-alınamaz merge:** Unmerge yolu olmayan birleştirme; yanlış eşleşme kalıcı hasar üretir.
- **Sessiz merge:** Merge'i audit'siz / `approval_ref`'siz uygulamak; kim-ne-zaman izlenemez.
- **AI'ın merge'i uygulaması:** AI çıktısını insan onayı olmadan golden record'a yazan yol; fail-closed ilkesini deler.
- **MDM'de yetki hesaplamak:** Merge iznini PDP'ye sormadan MDM içinde karar vermek; tek doğruluk kaynağı PDP.
- **Validation ile karıştırma:** "Değer doğru mu?" mantığını MDM'e koymak; o `DataQualityPolicy`'nin işi, ayrı eksen.
- **Tenant'ın platform tabanını genişletmesi:** Tenant override'ının izin-dışı alan eklemesi; katman yalnız daraltır.

## 14. DoD (Definition of Done)

§11'deki 9 testin tamamı yeşil; migration downgrade otomatik test geçti; alan-düzeyi provenance ve merge geri-alınabilirliği kanıtlandı; dedup dört stratejisi (exact/fuzzy/phonetic/ML) doğrulandı; survivorship Computation'a delege ediliyor ve merge PDP'den geçiyor; `check-core-contract`, `check-data-quality`, `check-dependency-policy` yeşil; PIM Product ArcheType golden record'u tüketiyor; PR açıldı, insan reviewer merge etti (main'e doğrudan push yok).

## 15. Requirement-ID tablosu

Aşağıdaki tablo sözleşmenin izlenebilir gereksinimlerini kimliklendirir; her satır bir gereksinim, katmanı, önceliği, test türü, ilgili acceptance criteria ve sahibiyle eşlenir.

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| MDM-01 | `GoldenRecord` şeması (entity_type/merged_from/status/confidence/version) | Backend | P0 | Unit | AC-2 | Kernel geliştirici |
| MDM-02 | `GoldenRecordSource` alan-düzeyi provenance (field→source→rule→zaman) | Backend | P0 | Integration | AC-3 | Kernel geliştirici |
| MDM-03 | `SurvivorshipRule` (strategy + computation_ref + source_priority + version) | Backend | P0 | Integration | AC-2 | Kernel geliştirici |
| MDM-04 | `SourceSystem` (trust_level / is_authoritative) kütüğü | Backend | P1 | Unit | AC-2 | Kernel geliştirici |
| MDM-05 | `DataSteward` (party_id + scope) atama modeli | Backend | P1 | Unit | AC-6 | Kernel geliştirici |
| MDM-06 | Exact dedup (normalize anahtar eşitliği) | Backend | P0 | Unit | AC-1 | Kernel geliştirici |
| MDM-07 | Fuzzy dedup (Levenshtein/Jaro-Winkler + eşik) | Backend | P0 | Unit | AC-1 | Kernel geliştirici |
| MDM-08 | Phonetic dedup (Soundex/Metaphone) | Backend | P1 | Unit | AC-1 | Kernel geliştirici |
| MDM-09 | ML dedup (öğrenilmiş eşleştirici + benzerlik skoru) | Backend | P2 | Integration | AC-1 | Kernel geliştirici |
| MDM-10 | Survivorship = Computation grafiği (serbest kod yasak) | Backend | P0 | Integration | AC-5 | Kernel geliştirici |
| MDM-11 | Merge audit trail (append-only, hash-zinciri, geri-alınabilir) | Governance | P0 | Integration | AC-4 | Kernel geliştirici |
| MDM-12 | Unmerge (birleşme geri alınır, geçmiş korunur) | Backend | P0 | Integration | AC-4 | Kernel geliştirici |
| MDM-13 | Merge kararı PDP'den geçer (yetki MDM'de hesaplanmaz) | Governance | P0 | Integration | AC-5 | Kernel geliştirici |
| MDM-14 | AI merge'i onaysız uygulayamaz; draft + skor sınırı | Governance | P0 | Integration | AC-6 | Kernel geliştirici |
| MDM-15 | `PIMEvent` event-sourcing yayını (outbox) | Backend | P1 | Integration | AC-7 | Kernel geliştirici |
| MDM-16 | Cross-tenant izolasyon + platform/tenant katman | Multi-tenant | P0 | Integration | AC-3 | Kernel geliştirici |
| MDM-17 | Celery `scan_for_duplicates` (steward kuyruğu, otomatik-merge yok) | Backend | P1 | Integration | AC-1 | Kernel geliştirici |
| MDM-18 | Field-Types tip güvenliği (golden alan tipleri) | Backend | P1 | Unit | AC-2 | Kernel geliştirici |
| MDM-19 | Dedup/golden/steward ekranları config-driven (Surface) | Frontend | P1 | Statik analiz | AC-1 | Frontend geliştirici |
| MDM-20 | Stack: FastAPI+SQLAlchemy 2.0/SQLModel+Alembic+PostgreSQL; Next/Supabase/Prisma YASAK | Backend | P0 | `check-dependency-policy` | AC-2 | Kernel geliştirici |

## 16. PIM-v2 karşılığı

Bu yönerge, `PIM-v2-Gereksinim-Analizi.md` §Faz 7 (MDM & Veri Yönetişimi) gereksinimlerini kernel primitifine bağlar. Aşağıdaki tablo PIM-v2 gereksinimini bu sözleşmedeki karşılığa eşler.

| PIM-v2 §Faz 7 gereksinimi | Bu yönergedeki karşılık |
|---|---|
| `merge_survive` portu: dedup (exact/fuzzy Levenshtein-JaroWinkler/phonetic/ML), benzerlik skoru | §7 `dedup()` dört strateji + skor; MDM-06..09 |
| `SurvivorshipRule` | §5 `SurvivorshipRule` tablosu (Computation-delege); MDM-03, MDM-10 |
| `GoldenRecord` (+ `GoldenRecordSource`) | §5 `GoldenRecord` + `GoldenRecordSource`; MDM-01, MDM-02 |
| `SourceSystem` | §5 `SourceSystem` (trust_level/is_authoritative); MDM-04 |
| `DataSteward` | §5 `DataSteward` (party_id + scope); MDM-05 |
| Alan-düzeyi provenance, merge audit trail | §5 `GoldenRecordSource` + `MergeDecision`; §7; MDM-02, MDM-11 |
| `PIMEvent` (event sourcing) | §7 `EventPublisher.publish()` → `PIMEvent`; MDM-15 |
| Celery: `scan_for_duplicates` | §7 Celery `scan_for_duplicates` (steward kuyruğu); MDM-17 |
| Frontend: dedup inceleme, golden record çözümleme, steward atama | §10 config-driven Surface ekranları; MDM-19 |
| Kabul: iki benzer ürün survivorship ile golden record'a birleşir, provenance izlenir | §12 AC-1..AC-4; §11 Test 1-7 |

**PIM-v2 Requirement matris karşılığı:** satır 25 (MDM golden record & survivorship, Faz 7, P2) ve satır 26 (Deduplication, Faz 7, P2) bu yönergeyle karşılanır; PIM-v2 portu `merge_survive` bu primitifin `platform_mdm` paket karşılığıdır.

---

*Kaynak yönerge: `PIM-v2-Gereksinim-Analizi.md` §Faz 7. Kardeş sözleşmeler: `computation-derivation-contract.md` (survivorship = computation), `pdp-policy-contract.md` (merge kararı = PDP), `core-contract-pack.md` §3.0.1 (AI guardrail). Bu doküman hiçbir kod/şema/JSON dosyasına dokunmaz; yalnız sözleşme metnidir. Çelişki halinde `core-contract-pack.md` (kernel runtime) önceliklidir; bu doküman güncellenir. Sözleşmeyi değiştirme yetkisi yalnız insan onayındadır; AI bu dosyayı doğrudan güncelleyemez.*
