# k-legal-hold-retention Yönergesi — Yasal Saklama, Saklama/İmha Politikası ve E-Discovery Kernel Primitifi

**Tarih:** 2026-07-01
**Durum:** Taslak sözleşme (kilitlenmeyi bekliyor — bkz. §15 DoD, ADR-LHR1)
**WBS düğümü:** `k-legal-hold-retention`
**Kaynak/bağlam:** `core-contract-pack.md §3.0.1` (ortak AI-güvenlik invariantı), `atomik-netlestirme-2026-07-01.md` (Atom/Fragment/ArcheType kademe modeli; `PartyRef`/`EnumType`/`Range<date>`/`Duration` atomları), `atom-archetype-bagi-clm-ornegi-2026-07-01.md` (CLM agreement graph: evidence/attachments/dates), `pdp-policy-contract.md` (retention/hold kuralı policy-as-data referansı), `evidence-taxonomy.md` (kanıtın kendisi ≠ hold; ayrım), `k-storage-dam-directive.md` (binary'yi kilitleyen kardeş primitif), `k-mdm-provenance-directive.md` (append-only + hash-zinciri + `approval_ref` deseni).
**İlişki:** Bu doküman `k-evidence` ve `k-storage`'ın kardeşidir: `k-evidence` "bu kayıt hukuki delil değeri taşıyor mu?" (tamper-evidence/LTV), `k-storage` "binary nerede, hangi türevle?" sorusunu yanıtlar; `k-legal-hold-retention` ise **"bu kayıt dava/denetim yüzünden dokunulamaz mı, ne kadar saklanmalı, ne zaman imha edilmeli?"** sorusunu yanıtlar. Bu doküman **kod yazmaz**; `k-legal-hold-retention` kernel primitifinin davranış sözleşmesini normatif tanımlar. Makine-okunur karşılığı (SQLAlchemy 2.0/SQLModel modeli, Alembic migration, Strawberry tipi, PEP guard) ADR-LHR1 kilitlendiğinde ajan-draft + insan-onay ile `platform` reposunda üretilir.

**Stack:** FastAPI + SQLAlchemy 2.0/SQLModel + Alembic + PostgreSQL. Frontend: Vite + React + TanStack. **YASAK:** Next.js, Supabase, Prisma, Redux, Flowbite, antd, MUI, Chakra, Mantine, react-markdown.

---

## 1. Amaç

Bu sözleşme, platformdaki herhangi bir kaydın (sözleşme, kanıt, doküman, binary varlık, taraf verisi, denetim izi) dava, soruşturma veya denetim durumunda **değiştirilemez ve silinemez** biçimde kilitlenmesini; kilit dışındaki kayıtların ise saklama süresi dolduğunda kurala bağlı, denetlenebilir ve geri-alınamaz biçimde imha/anonimleştirme/arşivleme ile yönetilmesini sabitler. Hedef: 50 uygulamanın hiçbirinin kendi "silme yasağı" bayrağını, kendi ad-hoc saklama takvimini veya kendi e-discovery dışa-aktarımını yeniden yazmaması; yasal saklama (legal hold), saklama/imha (retention) ve keşif (e-discovery) tek bir kernel soyutlamasında yaşaması. İki eksen tek modelde birleşir ve bir çatışma kuralına bağlanır: **aktif legal hold, retention imhasını her zaman ezer** (held kayıt saklama süresi dolsa da imha edilemez). Aktör-açık ifade: *ajan* hold/retention *önerir* (draft: eksik saklama politikası, süresi dolmuş imha adayı, ilgili kayıt kapsamı); *insan* (hukuk/uyum yetkilisi) onaylar; *motor* onaylı kilidi/imhayı deterministik ve denetlenebilir uygular. Legal hold uygulama/kaldırma kararı **yalnız insandır**; AI bir kaydı hold'a alamaz, hold'dan çıkaramaz, retention'ı override edemez, held bir kaydı silemez.

## 2. Kapsam

Bu sözleşme şunları kapsar: (1) `legal_hold` kaydı (kapsam sorgusu/etiketi, gerekçe, custodian `PartyRef`, durum, geçerlilik aralığı), (2) `retention_policy` kaydı (özne tipi, saklama süresi, imha yönetimi, yasal dayanak), (3) `hold_lock` kilit kaydı (bir subject'i bir hold'a bağlayıp silme/retention'ı engelleyen köprü), (4) WORM (write-once-read-many) kilit semantiği ve değiştirilemezlik zorlaması, (5) legal-hold ↔ retention çatışma çözümü (hold kazanır), (6) GDPR/KVKK erasure (silme/unutulma hakkı) talebinin aktif hold ile çatışma çözümü, (7) saklama süresi dolan kaydın disposition yaşam döngüsü (delete/anonymize/archive), (8) e-discovery için kapsamlı kilitli-kayıt sorgusu ve dışa-aktarım paketi, (9) `k-legal-hold-retention` düğümünün WBS yerleşimi, (10) çok-kiracılı izolasyon, append-only audit ve tamper-evidence zorunlulukları. Backend, frontend, test ve AI-guardrail gereksinimleri ilgili bölümlerde tarif edilir.

## 3. Non-goals

Bu sözleşme şunları **kapsamaz**: (1) Kanıtın kendisini üretmez veya delil değerini (tamper-evidence, RFC 3161 zaman damgası, LTV) hesaplamaz — bu `k-evidence`'ın işidir; `k-legal-hold-retention` yalnız o kanıt kaydını dava süresince **kilitler** (dokunulmaz kılar), kanıt üretmez. (2) Genel yetki/erişim kararı vermez — "bu aktör bu kaydı görebilir/dışa-aktarabilir mi?" kararı PDP'nindir (`k-policy-pdp`); bu primitif retention/hold politikasını **policy-as-data** olarak PDP'ye referans verir ama kararı yeniden hesaplamaz. (3) Binary'yi fiziksel saklamaz/servis etmez — binary object storage'da `k-storage`'dadır; bu primitif yalnız o `digital_asset`'in **silinemez/retention-muaf** olduğunu işaretler ve WORM kilidini uygular. (4) Golden-record/merge yaşam döngüsü değildir (`k-mdm`); merge/unmerge yerine hold/retention/disposition yaşam döngüsüdür. (5) Yedekleme/felaket-kurtarma (backup/DR) altyapısı değildir — arşiv disposition'ı bir *retention* eylemidir, DR bir dayanıklılık katmanıdır; ayrı eksen. (6) Serbest kodla silme — hiçbir app doğrudan `DELETE FROM ...` veya `boto3 delete_object` ile korunan bir kaydı silemez; imha yalnız bu primitifin sözleşmeli disposition servisinden ve hold-lock kontrolünden geçer.

## 4. Tanım (nedir / ne yapar / ne yapmaz)

**Nedir:** `k-legal-hold-retention`, sistemdeki herhangi bir kaydı dava/denetim gerekçesiyle değiştirilemez/silinemez kılan (legal hold), kilit dışındaki kayıtların saklama ömrünü ve süre sonu imhasını kurala bağlayan (retention) ve dava keşfi için kilitli kayıtları sorgulanabilir/dışa-aktarılabilir yapan (e-discovery) kernel kilit ve yaşam-döngüsü katmanıdır. Hold ve retention veri olarak saklanır; kilit bir `hold_lock` köprüsüyle somut kayda (subject) bağlanır.

**Ne yapar:** Bir hukuk/uyum yetkilisi tanımlar, motor uygular. Bir legal hold tanımlar (`legal_hold`: kapsam sorgusu/etiket, gerekçe, custodian `PartyRef`, geçerlilik aralığı); hold kapsamındaki her kaydı bir `hold_lock` ile kilitler; kilitli kayıt için değiştirme (`update`) ve silme (`delete`) girişimini reddeder (`LegalHoldActiveError`) ve retention imhasından muaf tutar. Bir retention politikası tanımlar (`retention_policy`: subject_type, `retention_period` süre, disposition, yasal dayanak); saklama süresi dolan kayıtları disposition kuralına göre imha/anonimleştirme/arşiv **adayı** olarak üretir (uygulama onaylı). Legal-hold ↔ retention çatışmasını **hold lehine** çözer; GDPR/KVKK erasure talebi ile aktif hold çatıştığında hold'u önceler ve talebi askıya alır (gerekçeli). Her hold/release/disposition eylemini tamper-evident append-only audit'e (hash-zinciri) yazar. Kapsamlı e-discovery sorgusu ve dışa-aktarım paketi (kilitli kayıt kümesi + metadata + custody zinciri) üretir.

**Ne yapmaz:** Kanıt *üretmez* (tamper-evidence/LTV `k-evidence` işidir; bu yalnız kilitler). Binary'yi *saklamaz/servis etmez* (`k-storage` işidir; bu yalnız silinemez işaretler). Yetki kararı *vermez* — bunu PDP yapar; retention/hold politikasını policy-as-data olarak sunar. Kilitli bir kaydı **fiziksel silmez, üzerine yazmaz, güncellemez** (WORM). Süre dolar dolmaz **otomatik imha etmez** — disposition bir *aday* üretir, imha insan onayı (`approval_ref`) ister; kalıcı yıkım geri-alınamaz olduğu için onaysız çalışmaz. AI'ın hold uygulamasına/kaldırmasına, retention override etmesine veya held kaydı silmesine **izin vermez** (bu insan/hukuk kararıdır). Hold gerekçesini/aralığını audit'siz değiştirmez (append-only).

## 5. Sözleşme şekli (alan yapısı)

Aşağıdaki üç tablo, `k-legal-hold-retention` primitifinin veri şeklini yalnızca *alan adı + tip + amaç* olarak tarif eder; dolu örnek/mock değer verilmez. Tipler PostgreSQL/SQLAlchemy 2.0 karşılıklarıdır ve atomik kademe modeline (`atomik-netlestirme-2026-07-01.md`) oturur: `PartyRef` referans-değer atomu (custodian/talep-eden), `EnumType` alias+i18n taşıyan tek-değer atomu (status/disposition), `Range<date>` parametreli aralık atomu (geçerlilik penceresi), `Duration` süre atomu (saklama süresi). Held kayıt hiçbir zaman fiziksel silinmez; kilit ve politika yalnız referansı ve yaşam-döngüsü durumunu taşır, korunan kaydın kendisi ilgili primitifte (evidence/storage/agreement) kalır.

Bu tablo `legal_hold` yasal-saklama kaydının alanlarını tanımlar. Aktör: hukuk/uyum yetkilisi tanımlar; motor okur ve kilit üretir.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Hold'un benzersiz kimliği; `hold_lock.hold_id` bunu referanslar |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu; v1 §2.1 fail-closed zorunluluğu |
| `scope_query` | JSONB | Kapsam seçicisi: hangi kayıtlar hold'a girer (subject_type + filtre/etiket ifadesi, yapısal — serbest SQL değil) |
| `scope_tag` | Text (nullable) | Kapsam etiketi (dava/konu kodu); etiketli kayıtları toplu hold'a bağlar |
| `reason` | Text (NOT NULL) | Hold gerekçesi (dava adı/no, denetim referansı, hukuki dayanak metni) |
| `custodian` | `PartyRef` (NOT NULL) | Sorumlu emanetçi/yetkili (hukuk-birim aktörü); `k-party`'ye tipli referans |
| `status` | `EnumType`(active, released) | Hold durumu; `active` iken kilit yürürlükte, `released` sonrası retention yeniden işler |
| `effective_range` | `Range<date>` | Hold geçerlilik penceresi (başlangıç + açık/kapalı bitiş); açık-uç = süresiz aktif |
| `matter_ref` | Text (nullable) | Dış dava/denetim yönetim kimliği (e-discovery bağı, idempotent) |
| `released_reason` | Text (nullable) | `released` yapılırken gerekçe (dava kapandı/mahkeme kararı); audit için zorunlu |
| `approval_ref` | UUID (nullable) | Hold uygulama/kaldırma onayı (insan hukuk yetkilisi + zaman + gerekçe); AI-draft ise zorunlu |
| `created_at` | TIMESTAMPTZ (NOT NULL) | Audit/oluşturulma zamanı |
| `updated_at` | TIMESTAMPTZ (NOT NULL) | Son durum değişikliği zamanı |

Bu tablo `retention_policy` saklama/imha politikasının alanlarını tanımlar; bir özne tipinin ne kadar saklanacağını ve süre sonunda ne yapılacağını beyan eder. Aktör: uyum/veri-yönetişim yetkilisi tanımlar; motor süre dolumunda disposition adayı üretir.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Politikanın benzersiz kimliği |
| `tenant_id` | UUID (nullable, indexed) | `null` = platform tabanı (yasal minimum); dolu = tenant override (yalnız daha katı yönde) |
| `subject_type` | Text (indexed) | Politikanın uygulandığı kayıt tipi (ör. `contract`, `evidence`, `invoice`, `digital_asset`); ArcheType id'ye eşlenir |
| `scope_filter` | JSONB (nullable) | Alt-kapsam (yapısal filtre); ör. yalnız belirli jurisdiction/kategori |
| `retention_period` | `Duration` (NOT NULL) | Saklama süresi (ör. "10 yıl", "P7Y"); süre başlangıcı `anchor_event`'ten sayılır |
| `anchor_event` | `EnumType`(created, closed, last_activity, contract_end) | Sürenin hangi olaydan itibaren sayıldığı (ör. sözleşme bitişinden 10 yıl) |
| `disposition` | `EnumType`(delete, anonymize, archive) | Süre sonu eylemi: kalıcı silme / kişisel-veri anonimleştirme / soğuk arşiv |
| `legal_basis` | Text (NOT NULL) | Yasal dayanak (ör. VUK 253, TTK 82, KVKK m.7, GDPR Art.17/5(e); saklama zorunluluğu/muafiyeti) |
| `jurisdiction` | `EnumType` (nullable) | Politikayı doğuran yargı alanı (çok-yargı kuralı; en katı süre kazanır) |
| `hold_overrides` | Boolean (NOT NULL, default true) | Aktif legal hold bu politikanın imhasını ezer mi (varsayılan `true`; hold her zaman kazanır) |
| `version` | Text | Politika sürümü; hangi kaydın hangi sürümle imha edildiğini izlemek için |
| `enabled` | Boolean (NOT NULL, default true) | Politika aktif mi; AI bunu değiştiremez (§10) |
| `approval_ref` | UUID (nullable) | Politika tanım/değişim onayı (insan uyum yetkilisi); AI-draft ise zorunlu |
| `created_at` | TIMESTAMPTZ (NOT NULL) | Audit |
| `updated_at` | TIMESTAMPTZ (NOT NULL) | Son değişiklik zamanı |

Bu tablo `hold_lock` kilit köprüsünü tanımlar; bir somut kaydı (subject) bir hold'a bağlar ve o kayıt held iken silme/retention imhasını engeller. Kilit motor tarafından, hold kapsamı çözüldüğünde üretilir; append-only.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Kilidin benzersiz kimliği |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu |
| `hold_id` | UUID (FK → legal_hold.id) | Kaydı kilitleyen hold; hold `released` olunca kilit çözülür |
| `subject_type` | Text (indexed) | Kilitlenen kayıt tipi (evidence/contract/digital_asset/audit_entry) |
| `subject_id` | UUID (indexed) | Kilitlenen somut kaydın kimliği (ilgili primitifteki gerçek kayıt) |
| `subject_ref` | Text (nullable) | Çapraz-primitif işaret (ör. `k-storage:digital_asset:<uuid>`); binary/kanıt bağı |
| `lock_state` | `EnumType`(held, released) | Kilit durumu; `held` iken WORM zorunlu ve retention muaf |
| `locked_at` | TIMESTAMPTZ (NOT NULL) | Kilidin konduğu an (audit/custody zinciri başlangıcı) |
| `released_at` | TIMESTAMPTZ (nullable) | Kilidin çözüldüğü an (hold release ile; null = hâlâ kilitli) |
| `prev_hash` | Text | Bir önceki kilit-olayının hash'i (tamper-evident zincir) |
| `entry_hash` | Text | Bu kaydın içerik hash'i = `hash(payload + prev_hash)`; değiştirilemezlik kanıtı |

## 6. WBS / kernel yerleşimi

`k-legal-hold-retention`, kernel/layer0 kümesine (`k-*`) `module`-seviyesi bir düğüm olarak eklenir; `k-party`, `k-tenancy`, `k-policy-pdp` ile aynı `app-layer0` altındadır. Altında asıl kod-teslimatı olan en az bir `archetype` düğümü durur (`task-to-code-contract` gereği: `module` sözleşme/şema taşır, kod alt `archetype`'ta yazılır). Bağımlılıklar `wbs-field-semantics`'e uyar: `dependsOn` = teknik/yürütme sırası (kritik yol); `related` = yalnız gezinme.

Bu tablo `k-legal-hold-retention` düğümünün WBS yerleşimini ve bağımlılıklarını tanımlar.

| Düğüm | Seviye | dependsOn | Küme |
|---|---|---|---|
| `k-legal-hold-retention` | module | `k-tenancy`, `k-party`, `k-policy-pdp` | kernel/layer0 |

`dependsOn` gerekçesi: `k-legal-hold-retention` kiracı bağlamına (`k-tenancy`) teknik olarak bağlıdır — bir hold/kilit/politika kiracısız var olamaz (tenant-scoped RLS hazır olmadan yazılamaz). `k-party`'ye bağlıdır çünkü custodian ve GDPR/KVKK talep-eden `PartyRef` olarak çözülür (aktör kütüğü önce gelmeli). `k-policy-pdp`'ye bağlıdır çünkü retention/hold **policy-as-data**'dır ve "bu aktör bu kaydı dışa-aktarabilir/imha edebilir mi?" yetki kararı PDP'ye sorulur (kilit kararı ≠ yetki kararı; ikisi ayrı katman). `related` ile (karar üretmeden) `k-evidence` (kanıtı kilitler), `k-storage` (binary'yi kilitler), `k-mdm` (append-only/hash-zinciri deseni), `archetype-agreement` (sözleşme kaydı hold/retention öznesi) düğümlerine bağlanır. Tüketici primitifler (`k-evidence`, `k-storage`, `archetype-agreement`) silme/güncelleme yolunda bu primitifin `hold_lock` kontrolünü çağırır — yani kilit **önce** gelir, imha girişimi buradan geçer.

## 7. Backend gereksinimleri (WORM kilit + disposition motoru)

Aşağıdaki gereksinimler CLM Legal Hold + Retention portunu bağlar; her biri test-önce (kırmızı→yeşil) yaşam döngüsüne tabidir. Motor tarafı `platform_legal_hold` paketinde yaşar. Çekirdek imzalar: `apply_hold(scope, reason, custodian, approval_ref, tenant_id) -> LegalHold` (kapsamı çözer, `hold_lock` üretir, kilitler, audit'ler); `release_hold(hold_id, released_reason, approval_ref) -> [HoldLock]` (kilidi çözer, retention'ı yeniden etkinleştirir, audit'ler); `evaluate_retention(subject_type, tenant_id) -> [DispositionCandidate]` (süresi dolan kayıtları listeler, held olanları hariç tutar); `apply_disposition(candidate_id, approval_ref) -> DispositionResult` (delete/anonymize/archive uygular, geri-alınamaz, audit'ler); `is_held(subject_type, subject_id, tenant_id) -> bool` (silme/güncelleme yolunda çağrılan kilit-kontrolü).

- **WORM kilidi (write-once-read-many):** `hold_lock.lock_state = held` olan bir subject için `update` ve `delete` girişimi motor katmanında reddedilir (`LegalHoldActiveError`); ek olarak DB-seviyesi bariyer (row-level trigger / izin reddi) held kaydın UPDATE/DELETE'ini engeller. WORM iki katmanlıdır: uygulama guard'ı + veritabanı zorlaması; app kodu kilidi atlayamaz.
- **Kilit-kontrol köprüsü:** Korunan her primitif (`k-evidence`, `k-storage`, `archetype-agreement`) kendi silme/güncelleme yolunda `is_held()` çağırır; `true` dönerse işlem reddedilir. Bu çağrı zorunludur — doğrudan `DELETE`/`boto3.delete_object` **yasaktır** (bkz. §14 anti-pattern).
- **Kapsam çözümü (scope resolution):** `legal_hold.scope_query`/`scope_tag` yapısal bir seçicidir (subject_type + filtre/etiket; serbest SQL değil). Hold uygulanınca motor kapsamı çözer ve eşleşen her kayıt için bir `hold_lock` üretir; hold'dan **sonra** oluşan ve kapsama giren kayıtlar için de kilit üretilir (rolling hold — kapsam sürekli genişleyen davada yeni kayıtları da yakalar).
- **Retention değerlendirme (idempotent, async):** `evaluate_retention` `anchor_event` + `retention_period` ile süresi dolan kayıtları bulur; **held olanları hariç tutar** (hold kazanır); sonucu bir disposition *adayı* olarak steward/uyum kuyruğuna düşürür — otomatik imha etmez. İş ölçek-değişmez ve idempotenttir (aynı kayıt iki kez imha adayı olmaz).
- **Disposition uygulama (geri-alınamaz, onaylı):** `apply_disposition` üç yönetimi ayırır: `delete` (kalıcı yıkım — audit'te tombstone/manifest kalır, veri gider), `anonymize` (kişisel-veri geri-döndürülemez maskeleme; kayıt yapısı kalır, GDPR/KVKK için), `archive` (soğuk depolamaya taşı; erişim kısıtlı, retention devam eder). Her disposition `approval_ref` ister; onaysız çağrı `ApprovalRequiredError` fırlatır.
- **Legal-hold ↔ retention çatışması:** `retention_policy.hold_overrides = true` (varsayılan) iken, bir subject held ise `evaluate_retention` onu **imha adayı üretmez** ve `apply_disposition` held subject'te `LegalHoldActiveError` fırlatır. Hold `released` olunca retention süresi kaldığı yerden işler (hold süresi retention saatini durdurur, sıfırlamaz — konfigürasyonla toggle).
- **GDPR/KVKK erasure çatışması:** Bir silme/unutulma-hakkı (erasure) talebi geldiğinde motor önce `is_held()` sorar; subject held ise erasure **askıya alınır** (`ErasureBlockedByHoldError`), talep-eden `PartyRef` + gerekçe (aktif hold + matter_ref) audit'lenir ve talep "hold kalkınca yeniden değerlendirilecek" statüsüne düşer. **Aktif hold kazanır**; yasal saklama zorunluluğu silme hakkını geçici olarak önceler (GDPR Art.17(3)(b/e), KVKK m.7 istisna). Hold kalkınca erasure yeniden değerlendirilir.
- **E-discovery dışa-aktarım:** `export_hold(hold_id, tenant_id)` kilitli kayıt kümesini + metadata'yı + custody zincirini (kilit-olay hash zinciri) yapılandırılmış bir pakete (ör. manifest + kayıt referansları) toplar; bu paket dava keşfi için üretilir, PDP'nin "bu aktör dışa-aktarabilir mi?" kararından *sonra* çağrılır.
- **Audit:** Her `apply_hold`/`release_hold`/`apply_disposition`/erasure-block eylemi `AuditLogger.log()` ile `actor` + `resource` yazılır ve tamper-evident `hold_lock` hash-zincirine (`prev_hash`/`entry_hash`) eklenir (v1 §2.5; `k-mdm` `MergeDecision` ruhuyla aynı). Zincir kırılırsa doğrulama başarısız olur.
- **Hata formatı:** `{code, message, trace_id, details}` (v1 §3.1); `get_logger()` kullanılır, `print()` yasak.

## 8. Frontend gereksinimleri

Aşağıdaki gereksinimler Vite + React + TanStack yığınına ve config-driven surface ilkesine uyar; CLM Legal Hold + Retention yönetim ekranlarını bağlar. Bileşenler SCSS + token ile biçimlenir; ikonlar Phosphor'dur. Mock veri yasaktır — her şey runtime endpoint'inden gelir.

- **Legal hold yönetimi:** Hukuk yetkilisi için hold oluşturma/kaldırma ekranı: kapsam sorgusu/etiket seçici, gerekçe, custodian (`PartyRef` picker), geçerlilik aralığı (`Range<date>` widget). Kaldırma insan onayı ister ve `released_reason` zorunludur; asset ve kilit verisi TanStack Query ile çekilir, hardcoded subject/tenant referansı **yasak**.
- **Retention politikası editörü:** subject_type, `retention_period` (`Duration` girişi), `anchor_event`, disposition (delete/anonymize/archive seçici), yasal dayanak metni. `hold_overrides` görünür ve varsayılan açık; kullanıcı imha kuralını **hold'un ezdiğini** açıkça görür.
- **Disposition kuyruğu:** Süresi dolan kayıtların imha *aday* listesi; `held` kayıtlar "yasal saklama nedeniyle muaf" rozetiyle ayrışır ve imha butonu **disabled** gelir. İmha yalnız insan onayıyla (`approval_ref`), geri-alınamazlık uyarısıyla tetiklenir; toplu imha da tek tek onay gerektirir.
- **E-discovery paneli:** Bir matter (dava) için kilitli kayıt kümesi, custody zinciri görünürlüğü ve dışa-aktarım tetikleyici. Dışa-aktarım butonu PDP kararına bağlıdır (yetki yoksa görünmez/disabled — permission-aware).
- **Guardrail görünürlüğü:** AI önerileri (eksik retention politikası, süresi dolmuş imha adayı, ilgili kayıt kapsamı) "draft" rozetiyle ayrışır ve yürürlükte değildir; hold uygula/kaldır ve imha eylemleri yalnız insan tarafından tetiklenebilir (AI tetikleyemez).
- **Erişilebilirlik + i18n:** WCAG 2.2 AA taban; dokunmatik hedef ≥ 44x44px; renk kontrastı ≥ 4.5:1. Hold/retention durum, disposition tür ve yasal dayanak metinleri `I18nText`/`EnumType` alias üzerinden çok-dilli; ham string gömülmez (yasal dayanak jurisdiction'a göre dile-özel).

## 9. Multi-tenant / RLS (tenant-scoped hold/retention/kilit)

Her `legal_hold`, `retention_policy` (tenant override satırı), `hold_lock` satırı `tenant_id` taşır ve fail-closed çalışır (bağlam yoksa istek reddedilir, v1 §2.1). PostgreSQL RLS ile bir tenant başka tenant'ın hold/politika/kilit kaydını göremez veya etkileyemez: `USING (tenant_id = current_setting('app.current_tenant')::uuid)`. Katman modeli PDP ile uyumludur: `retention_policy.tenant_id = NULL` platform tabanı yasal minimumu verir (ör. "fatura 10 yıl — VUK"); tenant kendi override'ını tanımlayabilir ama **yalnız daha katı yönde** — alt katman (tenant) üst katmanı (platform) gevşetemez, saklama süresini kısaltamaz veya `hold_overrides`'ı kapatamaz (yasal minimum mutlaktır). Çok-yargı çatışmasında **en katı süre kazanır**. E-discovery dışa-aktarımı tenant sınırını *genişletemez*: bir hold yalnız kendi tenant'ının kayıtlarını kapsar; cross-tenant subject kilitleme/dışa-aktarma girişimi `TenantViolationError` fırlatır ve audit'lenir. Schema-per-tenant / RLS geçiş eşiği ADR-0026'ya uyar.

## 10. AI guardrail (autonomy seviyesi)

Aşağıdaki iş bölümü değiştirilemezdir: **AI önerir → insan onaylar → motor uygular.** (`core-contract-pack.md §3.0.1`) Bu primitif hukuki sonuç doğurduğu için AI'ın autonomy'si en dar seviyededir: AI hiçbir kaydı kilitleyemez/serbest bırakamaz ve hiçbir kaydı imha edemez.

Bu tablo `k-legal-hold-retention` üzerindeki AI autonomy sınırlarını tanımlar.

| İşlem | Autonomy | Kural |
|---|---|---|
| Retention politikası *önerme* | `draft` | AI eksik/zayıf saklama politikası, çelişen süre önerir (`RetentionPolicyDraft`); doğrudan yürürlüğe koyamaz |
| İmha adayı *önerme* | `draft` | AI süresi dolmuş kayıt, orphan retention adayı işaretler; imhayı **uygulayamaz** |
| İlgili-kayıt kapsamı *önerme* | `draft` | AI bir davaya ilişkili olabilecek kayıtları *önerir* (kapsam taslağı); hold'a **alamaz** |
| Legal hold uygulama | `none` | Hold uygulama insan (hukuk/uyum) kararı; AI bir kaydı hold'a **alamaz** |
| Legal hold kaldırma | `none` | Hold release insan kararı; AI kilidi **çözemez** (dava kapanışı hukuki karardır) |
| Retention override / süre değişimi | `none` | AI saklama süresini/`hold_overrides`'ı değiştiremez; yasal dayanak insan kararı |
| Held kaydı silme / disposition | `none` | AI held bir kaydı **silemez**; disposition (delete/anonymize/archive) yalnız insan onayı (`approval_ref`) |
| Erasure ile hold çatışma kararı | `none` | GDPR/KVKK talebi ile hold çatışmasında kararı AI veremez; aktif hold kazanır (motor kuralı + insan) |
| Karar-logu / audit değişimi | `none` | Audit ve `hold_lock` zinciri append-only; AI değiştiremez |

Mutlak sınırlar: AI main branch'e push edemez; app/module düğümü üretemez/güncelleyemez; ruleset override edemez; kanıtsız "bitti" diyemez. En kritik iki sınır: (1) **AI hold uygulayamaz veya kaldıramaz** — kilit koyma/çözme insan (hukuk) kararıdır; (2) **AI retention'ı override edemez ve held bir kaydı silemez** — kalıcı imha geri-alınamaz olduğu ve yasal sonuç doğurduğu için yalnız insan onayıyla motor uygular. PDP kararı erişimi/dışa-aktarımı belirler; AI PDP kararını override edemez.

## 11. Bağlama (k-evidence kilitler; k-storage kilitler; PDP policy-as-data; audit; archetype-agreement)

**`k-evidence` bağlama:** `k-evidence` kanıtın delil değerini (tamper-evidence, RFC 3161 zaman damgası, LTV) *üretir ve tutar*; `k-legal-hold-retention` o kanıt kaydını dava süresince *kilitler* — held iken kanıt silinemez/değiştirilemez ve retention imhasından muaftır (`hold_lock.subject_type = evidence`). Kanıt kasası zaten append-only'dir; hold ek olarak retention-muafiyeti ve WORM kilidini getirir. İki primitif ayrıdır: kanıt "delil mi?", hold "dava yüzünden dokunulamaz mı?".

**`k-storage` bağlama:** `k-storage` binary/medya varlığını (`digital_asset`) object storage'da *saklar/servis eder*; `k-legal-hold-retention` o varlığın **silinemez/retention-muaf** olduğunu `hold_lock`(subject_type=`digital_asset`) ile işaretler. `k-storage` zaten "bir varlığı fiziksel silmez (soft-delete + arşiv)" der; hold bunu sertleştirir: held binary object storage'dan da silinemez (WORM), `k-storage`'ın disposition/retention işi held anahtarı atlar.

**PDP bağlama (policy-as-data):** Retention ve hold **kural = veri**dir; `retention_policy` ve `legal_hold` PDP'nin policy-as-data dünyasına referans verir. "Bu aktör bu kaydı dışa-aktarabilir/imha edebilir mi?" yetki kararı PDP'ye sorulur (`k-policy-pdp`); bu primitif kilit/imha *mekaniğini* uygular ama *yetkiyi* PDP'de bırakır (tek doğruluk kaynağı). Kilit kararı (held mi?) ≠ yetki kararı (izinli mi?); ikisi ayrı katman.

**Audit bağlama:** Her hold/release/disposition/erasure-block eylemi append-only audit'e ve tamper-evident `hold_lock` hash-zincirine yazılır (`k-mdm` `MergeDecision` deseniyle aynı: `prev_hash`/`entry_hash`). Kilit-olayları bir custody zinciri oluşturur; e-discovery dışa-aktarımı bu zinciri delil bütünlüğü kanıtı olarak taşır. Audit girişleri de bir hold öznesi olabilir (denetim izinin kendisi dava kapsamına girerse kilitlenir).

**`archetype-agreement` bağlama:** CLM'in merkezi archetype'ı `archetype-agreement`'ın kayıtları (sözleşme, ekli kanıt `evidence`, ek `attachments` → `AssetRef`, tarih alanları) hold/retention öznesidir. Bir dava açıldığında ilgili sözleşme + kanıtları + ekleri toplu hold'a alınır (`scope_tag = matter`); sözleşme retention'ı (ör. "sözleşme bitişinden 10 yıl", `anchor_event = contract_end`) bir `retention_policy` ile yönetilir. Agreement kendi silme yolunda `is_held()` çağırır; held sözleşme silinemez.

## 12. Test stratejisi

Aşağıdaki testler CLM Legal Hold + Retention kabul kriterlerini ve `core-contract-pack` DoD'unu karşılar; hepsi test-önce (önce kırmızı) yazılır.

Bu tablo `k-legal-hold-retention` için zorunlu test senaryolarını ve türlerini tanımlar.

| # | Senaryo | Test türü |
|---|---|---|
| 1 | WORM: `held` kayıtta `update`/`delete` reddediliyor (`LegalHoldActiveError`); DB tetiği de engelliyor | Entegrasyon |
| 2 | Kapsam çözümü: hold uygulanınca kapsamdaki kayıtlar kilitleniyor; hold'dan sonra oluşan kapsam-içi kayıt da kilitleniyor (rolling) | Entegrasyon |
| 3 | Hold kazanır: süresi dolmuş ama `held` kayıt imha adayı üretilmiyor; `apply_disposition` reddediliyor | Entegrasyon |
| 4 | Release: hold `released` olunca kilit çözülüyor, retention kaldığı yerden işliyor | Entegrasyon |
| 5 | Disposition: `delete`/`anonymize`/`archive` doğru uygulanıyor; hepsi `approval_ref` istiyor (onaysız `ApprovalRequiredError`) | Entegrasyon |
| 6 | GDPR/KVKK erasure vs hold: aktif hold varken erasure askıya alınıyor (`ErasureBlockedByHoldError`), gerekçe audit'leniyor | Entegrasyon |
| 7 | Tamper-evident: `hold_lock` hash-zinciri doğrulanıyor; bir kilit-olay elle bozulursa doğrulama başarısız | Entegrasyon |
| 8 | Tenant izolasyonu: A tenant B'nin subject'ini kilitleyemiyor/dışa-aktaramıyor (≥10 negatif case) | Entegrasyon (negatif) |
| 9 | AI guardrail: AI hold uygulayamıyor/kaldıramıyor, retention override edemiyor, held kaydı silemiyor; yalnız `draft` öneriyor | Entegrasyon |
| 10 | Katman: tenant retention politikası platform yasal minimumu gevşetemiyor (süre kısaltma/`hold_overrides` kapatma reddi) | Birim |
| 11 | E-discovery: bir matter için kilitli kayıt kümesi + custody zinciri dışa-aktarılıyor; PDP kararından sonra | Entegrasyon |
| 12 | Migration downgrade: `alembic downgrade -1` veri kaybetmeden çalışıyor | CI |
| 13 | GraphQL/PEP koruması: her resolver/endpoint `permission_classes`/`Depends(require_tenant)` taşıyor | Contract |

## 13. Acceptance criteria

- Held bir kayıt değiştirilemiyor ve silinemiyor (WORM); `update`/`delete` girişimi hem uygulama katmanında hem DB'de reddediliyor (CLM Legal Hold kabul kriteri).
- Hold uygulama/kaldırma yalnız insan (hukuk/uyum) tarafından yapılıyor; kapsam çözülüp `hold_lock` üretiliyor; hold'dan sonra oluşan kapsam-içi kayıtlar da kilitleniyor (rolling hold).
- Retention politikası süresi dolan kaydı disposition adayı (delete/anonymize/archive) olarak üretiyor; imha yalnız `approval_ref` ile uygulanıyor; onaysız imha reddediliyor.
- Legal-hold retention'ı eziyor: `held` kayıt süresi dolsa da imhadan muaf; hold `released` olunca retention yeniden işliyor.
- GDPR/KVKK erasure talebi aktif hold ile çatıştığında **hold kazanıyor**: erasure askıya alınıyor, gerekçe + talep-eden audit'leniyor, hold kalkınca yeniden değerlendiriliyor.
- Her hold/release/disposition eylemi tamper-evident append-only audit'e (hash-zinciri) düşüyor; zincir doğrulanabiliyor ve elle bozulunca fail veriyor.
- Cross-tenant subject kilitleme/dışa-aktarma en az 10 negatif test case ile reddediliyor ve audit'leniyor; tenant retention platform yasal minimumu gevşetemiyor.
- E-discovery dışa-aktarımı bir matter için kilitli kayıt kümesini + custody zincirini üretiyor (PDP kararından sonra).
- AI hold uygulayamıyor/kaldıramıyor, retention override edemiyor, held kaydı silemiyor; yalnız `draft` öneriyor (test-kanıtlı).
- Alembic migration downgrade otomatik test geçiyor; `check-core-contract` (tenant guard, resolver koruması, audit çağrısı, indeks) yeşil.

## 14. Anti-patterns

- **Doğrudan silme:** App'te `DELETE FROM ...` veya `boto3.delete_object` ile korunan kaydı silmek — YASAK; imha yalnız `apply_disposition` + `hold_lock` kontrolünden.
- **Kilit-kontrol atlama:** Bir primitifin silme/güncelleme yolunda `is_held()` çağırmaması — YASAK; held kayıt her silme yolunda kontrol edilir.
- **App-özel silme-yasağı bayrağı:** Bir ArcheType'ın kendi `is_locked`/`do_not_delete` kolonunu açması — YASAK; `hold_lock` referansı zorunlu, tek kilit kaynağı.
- **Otomatik imha:** Süre dolar dolmaz onaysız kalıcı silme — YASAK; disposition bir *aday* üretir, imha `approval_ref` ister.
- **Retention'ın hold'u ezmesi:** Held kaydı retention süresi doldu diye imha etmek — YASAK; hold her zaman kazanır (`hold_overrides = true`).
- **Erasure'ın hold'u ezmesi:** GDPR/KVKK silme talebini aktif hold varken uygulamak — YASAK; aktif hold kazanır, erasure askıya alınır.
- **Held kaydı güncelleme:** Kilitli kayıt üzerine yazmak/değiştirmek — YASAK; WORM, yalnız oku.
- **Tenant'ın yasal minimumu gevşetmesi:** Tenant override'ının saklama süresini kısaltması veya `hold_overrides`'ı kapatması — YASAK; katman yalnız daha katı yönde.
- **Sessiz imha:** Disposition'ı audit'siz / `approval_ref`'siz uygulamak — YASAK; kim-ne-zaman-hangi-yasal-dayanakla izlenmeli.
- **AI'ın hold/imha uygulaması:** AI'ın bir kaydı hold'a alması, hold'dan çıkarması, retention override etmesi veya held kaydı silmesi — YASAK; hepsi `autonomy: none`, insan/hukuk kararı.
- **Audit zinciri kırma:** `hold_lock` hash-zincirini UPDATE/DELETE ile bozmak — YASAK; append-only + tamper-evident.

## 15. Definition of Done

- §12'deki 13 test senaryosu yeşil (test-önce kanıtı: kırmızı→yeşil geçişi belgeli).
- `core-contract-pack` tenant + audit + indeks uyumu sağlandı; `check-core-contract.mjs` yeşil.
- Alembic migration downgrade CI'da çalışıyor; `hold_lock`/`legal_hold`/`retention_policy` append-only bariyerleri (held UPDATE/DELETE reddi + hash-zinciri) DB-seviyesinde kanıtlı.
- WORM kilidi hem uygulama guard'ı hem DB tetiği ile zorlanıyor (entegrasyon kanıtı); legal-hold retention'ı ve GDPR/KVKK erasure'ı eziyor (çatışma testleri yeşil).
- E-discovery dışa-aktarımı kilitli kayıt kümesi + custody zinciri üretiyor; CLM uçtan-uca akış (dava aç → ilgili kayıtları hold'a al → süre yönet → dava kapat → release → retention devam) çalışıyor.
- ADR-LHR1 "Kilitli" statüsünde (insan onayı); `k-legal-hold-retention` düğümü ve altındaki `archetype` düğümü WBS'te doğru `dependsOn` (`k-tenancy`, `k-party`, `k-policy-pdp`) ile mevcut.
- AI-guardrail testi: AI'ın hold uygulama/kaldırma, retention override, held-kayıt silme denemeleri reddediliyor; yalnız `draft` öneri üretilebiliyor.
- Doküman `icerik-kalite-sozlesmesi` biçim kurallarına uyar (aktör-açık, emoji yok, her başlıkta nedir/yapar/yapmaz, her tablodan önce açıklama, mock yok).

## 16. CLM karşılığı (Legal Hold + Retention Policy + Compliance)

Aşağıdaki tablo, bu sözleşmenin CLM (Contract Lifecycle Management) Legal Hold + Retention Policy + Compliance gereksinimlerini `k-legal-hold-retention` sözleşme öğelerine nasıl eşlediğini gösterir; her satır bir CLM yeteneğini kernel primitifine bağlar. Uyum ekseni GDPR (AB veri koruma), KVKK (Türkiye kişisel verilerin korunması) ve eIDAS (AB elektronik kimlik/güven hizmetleri; delil saklama) çerçevelerini kapsar.

| CLM / Compliance gereksinimi | k-legal-hold-retention karşılığı |
|---|---|
| Legal hold: dava/denetimde sözleşme + kanıt kaydını kilitle | §5 `legal_hold` + `hold_lock`; §7 `apply_hold`/WORM; §11 agreement/evidence bağlama |
| Retention policy: sözleşme türü başına saklama süresi + süre sonu eylemi | §5 `retention_policy` (`retention_period`/`anchor_event`/`disposition`); §7 `evaluate_retention` |
| Disposition: süre sonu silme / anonimleştirme / arşiv | §5 `disposition` EnumType; §7 `apply_disposition` (onaylı, geri-alınamaz) |
| Legal hold retention'ı ezer (held kayıt imhadan muaf) | §7 çatışma çözümü; §5 `hold_overrides=true`; §13 AC (hold kazanır) |
| WORM (write-once-read-many) değiştirilemezlik | §7 WORM (uygulama guard + DB tetiği); §5 `hold_lock.lock_state=held` |
| GDPR/KVKK erasure (silme/unutulma hakkı) vs legal-hold çatışması | §7 `ErasureBlockedByHoldError` (aktif hold kazanır, GDPR Art.17(3), KVKK m.7 istisna) |
| Yasal dayanak (saklama zorunluluğu/muafiyeti) | §5 `retention_policy.legal_basis` (VUK/TTK/KVKK/GDPR); §9 çok-yargı en katı süre |
| eIDAS delil saklama (imzalı doküman + kanıt LTV korunumu) | §11 `k-evidence` kilitleme (held kanıt silinemez); custody zinciri |
| E-discovery: dava için kilitli kayıt keşfi + dışa-aktarım | §7 `export_hold` (kilitli küme + metadata + custody); §8 e-discovery paneli |
| Custody zinciri / delil bütünlüğü (tamper-evidence) | §5 `hold_lock` hash-zinciri (`prev_hash`/`entry_hash`); §7 audit |
| Tenant izolasyon + platform yasal minimum (override yalnız katı yönde) | §9 tenant-scoped RLS + platform taban politikası; §13 katman AC |
| Kabul: dava aç → ilgili kayıtları hold'a al → süre yönet → release → retention devam | §13 acceptance criteria; §12 Test 1-6, 11 |

## 17. Requirement-ID tablosu

Aşağıdaki tablo, bu sözleşmenin izlenebilir gereksinimlerini kimlik + katman + öncelik (P0–P3) + test türü + kabul + sahip ile listeler. Öncelik: P0 = bloklayıcı invariant, P1 = çekirdek, P2 = önemli, P3 = iyileştirme.

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| LHR-01 | `legal_hold` kaydı tenant-kapsamlı (scope/reason/custodian/status/range) | Backend/Data | P0 | Integration | Hold tenant izolasyonlu tanımlanır | kernel-team |
| LHR-02 | `retention_policy` kaydı (subject_type/period/disposition/legal_basis) | Backend/Data | P0 | Integration | Politika tanımlanır ve süre çözülür | kernel-team |
| LHR-03 | `hold_lock` kilit köprüsü (subject_id + hold_id, append-only) | Backend/Data | P0 | Integration | Kayıt hold'a bağlanır, kilitlenir | kernel-team |
| LHR-04 | WORM: held kayıt update/delete reddi (uygulama + DB tetiği) | Backend/Security | P0 | Integration | Held kayıt değiştirilemez/silinemez | security-team |
| LHR-05 | Kilit-kontrol köprüsü: primitifler silme yolunda `is_held()` çağırır | Backend | P0 | Contract | Kontrol atlayan silme yolu yok | kernel-team |
| LHR-06 | Kapsam çözümü + rolling hold (sonradan gelen kapsam-içi kayıt kilitlenir) | Backend | P1 | Integration | Kapsam-içi tüm kayıt kilitlenir | kernel-team |
| LHR-07 | Legal-hold retention'ı ezer (held kayıt imha adayı olmaz) | Backend/Compliance | P0 | Integration | Held kayıt imhadan muaf | kernel-team |
| LHR-08 | Disposition (delete/anonymize/archive) onaylı + geri-alınamaz | Backend/Compliance | P0 | Integration | İmha `approval_ref` ister | kernel-team |
| LHR-09 | GDPR/KVKK erasure vs aktif hold: hold kazanır, erasure askıya | Compliance | P0 | Integration | Aktif hold varken erasure engellenir | governance |
| LHR-10 | Hold release → kilit çözülür, retention kaldığı yerden işler | Backend | P1 | Integration | Release sonrası retention devam eder | kernel-team |
| LHR-11 | Tamper-evident `hold_lock` hash-zinciri (append-only) | Security | P0 | Integration | Zincir doğrulanır, bozulunca fail | security-team |
| LHR-12 | Tenant-scoped RLS + cross-tenant kilitleme/dışa-aktarma reddi | Security | P0 | Integration(neg) | ≥10 cross-tenant negatif case reddedilir | security-team |
| LHR-13 | Katman: tenant retention platform yasal minimumu gevşetemez | Compliance | P0 | Unit | Süre kısaltma/`hold_overrides` kapatma reddi | governance |
| LHR-14 | Hold/release/disposition audit (append-only, actor + gerekçe) | Security | P0 | Integration | Her eylem audit'e düşer | security-team |
| LHR-15 | E-discovery dışa-aktarım (kilitli küme + custody zinciri, PDP-sonrası) | Backend/Compliance | P1 | Integration | Matter için kilitli küme dışa-aktarılır | kernel-team |
| LHR-16 | AI hold uygulayamaz/kaldıramaz (autonomy none) | AI-Governance | P0 | Integration | AI kilit koyamaz/çözemez | governance |
| LHR-17 | AI retention override edemez / held kaydı silemez (autonomy none) | AI-Governance | P0 | Integration | AI override/silme reddedilir | governance |
| LHR-18 | AI yalnız `draft` önerir (politika/imha adayı/kapsam) | AI-Governance | P1 | Integration | Draft dışı AI eylemi yok | governance |
| LHR-19 | Retention/hold = policy-as-data; PDP'ye yetki referansı | Backend/API | P1 | Integration | İmha/dışa-aktarım yetkisi PDP'den | kernel-team |
| LHR-20 | Alembic expand-contract + dolu downgrade | Backend/DevOps | P1 | CI | `alembic downgrade -1` veri kaybetmez | kernel-team |
| LHR-21 | Strawberry resolver `permission_classes` + PEP `Depends` zorunlu | Backend/API | P1 | Contract | Korumasız resolver/endpoint yok | kernel-team |
| LHR-22 | Frontend hold/retention/disposition/e-discovery ekranı config-driven | Frontend | P1 | E2E | UI runtime verisinden; hardcoded subject yok | ui-team |
| LHR-23 | WCAG 2.2 AA + i18n + yasal-dayanak dile-özel etiket | Frontend/A11y | P2 | A11y(axe) | axe critical=0; held-muaf rozeti erişilebilir | ui-team |
| LHR-24 | `k-legal-hold-retention` WBS düğümü doğru dependsOn (k-tenancy, k-party, k-policy-pdp) | Governance/WBS | P1 | CI(data-quality) | DAG geçerli, dangling yok | pmo |

---

*Kaynak yönerge: CLM Legal Hold + Retention Policy + Compliance (GDPR/KVKK/eIDAS). Kardeş sözleşmeler: `k-evidence` (kanıtı kilitler, delil değeri), `k-storage-dam-directive.md` (binary'yi kilitler/saklar), `pdp-policy-contract.md` (retention/hold = policy-as-data, yetki kararı), `k-mdm-provenance-directive.md` (append-only + hash-zinciri + `approval_ref` deseni), `atomik-netlestirme-2026-07-01.md` (PartyRef/EnumType/Range<date>/Duration atomları), `core-contract-pack.md §3.0.1` (AI guardrail). Bu doküman hiçbir kod/şema/JSON dosyasına dokunmaz; yalnız sözleşme metnidir. Çelişki halinde `core-contract-pack.md` (kernel runtime) önceliklidir; bu doküman güncellenir. Sözleşmeyi değiştirme yetkisi yalnız insan onayındadır; AI bu dosyayı doğrudan güncelleyemez. Legal hold uygulama/kaldırma ve retention override yalnız insan (hukuk/uyum) kararıdır.*
