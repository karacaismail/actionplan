# k-migration-bridge Yönergesi — Audit-Koruyan İçe-Aktarım / Migrasyon Köprüsü Kernel Primitifi

**Tarih:** 2026-07-01
**Durum:** Taslak sözleşme (kilitlenmeyi bekliyor — bkz. §15 DoD, ADR-M1)
**Kaynak/bağlam:** `core-contract-pack.md §3.0.1` (ortak AI-güvenlik invariantı), `task-export-contract.md` (bu sözleşmenin *tersi* — dışa-aktarım), `k-mdm-provenance-directive.md` (kaynak-provenance + dedup deseni), `evidence-taxonomy.md` / `k-evidence` (kanıt kasası, append-only), `atomik-tip-katalogu-tam-2026-07-01.md §Katman C` (`ExternalId` = idempotent import anahtarı), `wbs-field-semantics.md` (dependsOn anlamı).
**İlişki:** Bu doküman `task-export-contract.md`'nin **tersidir**: o, iç veriyi üç dış tüketiciye *dışa* biçimlendirir; `k-migration-bridge` dış/eski sistemlerden (DocuSign, Adobe Sign, PandaDoc, Zoho Sign, Dropbox Sign veya legacy CLM/DMS) veriyi + kanıtı + audit'i **KORUYARAK** içe alır. `k-mdm`'in kardeşidir: `k-mdm` çok-kaynaklı kayıtları *tekilleştirir*; `k-migration-bridge` kaynaktan gelen kaydı *idempotent* içe alır ve dedup gerektiğinde ona devreder. Bu doküman **kod yazmaz**; `k-migration-bridge` kernel primitifinin davranış sözleşmesini normatif tanımlar. Makine-okunur karşılığı (SQLAlchemy 2.0 modeli, Alembic migration, Strawberry tipi, konnektör-agnostik ithalat servisi) ADR-M1 kilitlendiğinde ajan-draft + insan-onay ile `platform` reposunda üretilir.

**Stack:** FastAPI + SQLAlchemy 2.0/SQLModel + Alembic + PostgreSQL (backend); Vite + React + TanStack (frontend); SCSS + token (stil); Phosphor (ikon). **YASAK:** Next.js, Supabase, Prisma, Redux, Flowbite, antd, MUI, Chakra, Mantine, react-markdown.

---

## 1. Amaç

Bu sözleşme, platforma dışarıdan/eski sistemlerden giren her sözleşme, imza, kanıt ve audit kaydının tek bir kernel soyutlamasında, **kaynak izini kaybetmeden** içe alınmasını sabitler. Hedef: 50 uygulamanın hiçbirinin kendi CSV-yükleyicisini, kendi "DocuSign envelope → iç sözleşme" eşleyicisini veya kendi tekrar-koruma mantığını yeniden yazmaması; her içe-aktarım işinin tek bir `migration_job` kaydında tanımlanıp, kaynaktaki her kaydın bir `migration_record` ile iç varlığa eşlenmesi, içe alınan imza/audit-certificate'in **k-evidence kaydı olarak kaynak-provenance ile korunması** ve tüm sürecin idempotent (aynı kaynak tekrar = aynı sonuç, kopya yok), önizlenebilir (dry-run) ve geri-alınabilir (rollback) olması. Aktör-açık ifade: *ajan* alan eşlemesini önerir (draft) ve dry-run önizlemesi üretir; *insan* eşlemeyi ve yürütmeyi onaylar; *motor* onaylı içe-aktarımı deterministik, idempotent ve geri-alınabilir uygular. AI prod içe-aktarımı **yürütemez**.

## 2. Kapsam

Bu sözleşme şunları kapsar: (1) `migration_job` içe-aktarım işi kaydı (kaynak sistem, mod, eşleme referansı, istatistik), (2) `migration_record` kaynak→hedef kayıt eşlemesi (kaynak referansı, hedef tip/kimlik, kanıt-korundu bayrağı, checksum, çakışma durumu), (3) `field_mapping` kaynak alan → iç alan/archetype/atom eşlemesi, (4) idempotent import (kaynak-anahtarı üstünden tekrar-koruma; aynı kaynak iki kez = tek sonuç), (5) dry-run önizleme (yürütmeden önce ne olacağının hesaplanması), (6) conflict resolution (mevcut iç kayıtla çakışma çözümü: skip / overwrite / merge-to-mdm / manual), (7) evidence preservation (içe alınan imza/audit-certificate'in `k-evidence`'a kaynak-provenance ile korunması), (8) rollback (bir içe-aktarım işinin geri alınması, kaynak kanıtı korunarak), (9) `k-migration-bridge` düğümünün WBS yerleşimi, (10) çok-kiracılı izolasyon ve audit zorunlulukları. Backend, frontend, test ve AI-guardrail gereksinimleri ilgili bölümlerde tarif edilir.

## 3. Non-goals

Bu sözleşme şunları **kapsamaz**: (1) Konnektör/protokol taşıma (canlı API senkronu, webhook, OAuth akışı, rate-limit) — bu `i14y` (entegrasyon katmanı) işidir; `k-migration-bridge` `i14y`'nin *çektiği* veya bir dosyadan okunan ham kayıtları alır, kaynak sisteme kendisi *bağlanmaz*. (2) Dışa-aktarım — iç veriyi dış tüketiciye biçimlendirme `task-export-contract`'ın işidir; bu sözleşme yalnız *içe* yönü ve audit-korumayı taşır. (3) Kayıt tekilleştirme *kararı* (golden-record/survivorship) — dedup mantığı `k-mdm`'indir; `k-migration-bridge` yalnız çakışmayı *tespit eder* ve gerektiğinde `k-mdm`'e *devreder*, kendisi golden-record üretmez. (4) Değer doğrulama kuralı (validation) — o `DataQualityPolicy`'nin işidir; köprü değeri içe alır, iş-kuralıyla doğrulamaz. (5) İçe alınan imzanın kriptografik *yeniden-doğrulaması* / yeni imza üretimi — imza doğrulama/üretme `k-signature`'ın işidir; köprü mevcut imza kanıtını *olduğu gibi korur* (verbatim), yeniden imzalamaz. (6) Serbest kodla toplu içe-aktarım — hiçbir app kendi `pandas.read_csv → INSERT` yolunu açamaz; içe-aktarım yalnız bu primitifin sözleşmeli servisinden geçer.

## 4. Tanım (nedir / ne yapar / ne yapmaz)

**Nedir:** `k-migration-bridge`, dış/eski sistemlerden gelen kayıtları platformun iç archetype'larına idempotent olarak eşleyen; her kaynak kaydın izini (`ExternalId`) ve içe alınan kanıtı (imza, audit-certificate) `k-evidence` üstünde kaynak-provenance ile koruyan; içe-aktarımı dry-run önizlenebilir, çakışma-çözümlü ve geri-alınabilir kılan kernel içe-aktarım köprüsü primitifidir. `task-export-contract`'ın tersidir.

**Ne yapar:** Bir içe-aktarım işini bir kez tanımlar (`migration_job`: kaynak sistem, mod, eşleme referansı); kaynaktaki her kaydı iç varlığa eşler (`migration_record`) ve kaynak referansını (`ExternalId`) idempotent anahtar olarak taşır; alan eşlemesini (`field_mapping`) kaynak alandan iç alan/archetype/atoma bağlar; dry-run modunda hiçbir yazma yapmadan ne olacağını (kaç yeni, kaç güncelleme, kaç çakışma, kaç atlama) önceden hesaplar; execute modunda idempotent yazar (aynı kaynak-anahtarı ikinci kez gelirse yeni kayıt üretmez, mevcut eşlemeyi bulur); çakışmayı tespit eder ve çözüm stratejisine göre davranır; içe alınan imza/audit-certificate'i `k-evidence` kaydı olarak kaynak-provenance ile korur (`evidence_preserved` bayrağı); tüm işi audit'ler; bir işi geri alabilir (rollback), kaynak kanıtını koruyarak.

**Ne yapmaz:** Kaynak sisteme *bağlanmaz* (canlı API/webhook `i14y`'nin işi; köprü `i14y`'nin veya bir dosyanın verdiği ham kaydı alır). Dışa-aktarım *yapmaz* (o `task-export-contract`). Golden-record *üretmez* (tekilleştirme kararı `k-mdm`; köprü yalnız çakışmayı tespit edip devreder). İçe alınan imzayı *yeniden doğrulamaz/imzalamaz* (kanıtı verbatim korur; doğrulama `k-signature`). Aynı kaynağı iki kez içe alınca *kopya üretmez* (idempotent; kaynak-anahtarı tekilleştirir). Kanıtı içe alırken *değiştirmez/normalize etmez* (kanıt append-only korunur; kaynak-provenance eklenir, içerik dokunulmaz). AI'ın onayı olmadan prod içe-aktarımı *yürütmez* (dry-run serbest; execute insan-tetikli).

## 5. Sözleşme şekli (alan yapısı)

Aşağıdaki üç tablo, `k-migration-bridge` primitifinin veri şeklini yalnızca *alan adı + tip + amaç* olarak tarif eder; dolu örnek/mock değer verilmez. Tipler PostgreSQL/SQLAlchemy 2.0 karşılıklarıdır. `source_system` ve `mode` `EnumType` atomudur (Katman B); `source_ref` `ExternalId` atomudur (Katman C — idempotent import anahtarı). Tüm tablolar `tenant_id` ile izole edilir (v1 §2.1 fail-closed).

Bu tablo `migration_job` içe-aktarım işi kaydının alanlarını tanımlar; bir iş, bir kaynak sistemden tek bir toplu içe-aktarım turudur.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | İçe-aktarım işinin benzersiz kimliği |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu; v1 §2.1 fail-closed zorunluluğu |
| `source_system` | Enum(docusign, adobe_sign, pandadoc, zoho_sign, dropbox_sign, legacy_clm, legacy_dms, csv, other) | Kaynak sistem (`EnumType` atom); eşleme ve provenance için |
| `mode` | Enum(dry_run, execute) | İş modu (`EnumType` atom); dry_run yazma yapmaz, execute idempotent yazar |
| `mapping_ref` | UUID (FK → field_mapping.id, nullable) | Kullanılan alan-eşleme profili; boşsa AI-draft eşleme önerilir |
| `status` | Enum(draft, previewing, previewed, awaiting_approval, executing, completed, failed, rolled_back) | İş yaşam döngüsü; dry_run→previewed, execute insan onayından sonra |
| `approval_ref` | UUID (nullable) | Onaylayan insan + zaman + gerekçe; `mode=execute` için ZORUNLU (AI tek başına yürütemez) |
| `stats` | JSONB | İstatistik anlık görüntüsü (total, to_create, to_update, conflicts, skipped, evidence_preserved_count); dry-run önizlemesi de buraya yazılır |
| `source_batch_ref` | Text (nullable) | Kaynak parti/dosya referansı (yükleme kimliği, export dosya adı); tekrar-koruma kapsamı |
| `error_summary` | JSONB (nullable) | `status=failed` ise hata özeti (`{code, message, trace_id, details}` biçiminde) |
| `worker_job_ref` | UUID (nullable) | Batch yürütmeyi taşıyan `k-worker` iş referansı (uzun içe-aktarım offload) |
| `created_at` | TIMESTAMPTZ (NOT NULL) | Audit/oluşturulma zamanı |
| `updated_at` | TIMESTAMPTZ (NOT NULL) | Son değişiklik zamanı |

Bu tablo `migration_record`'ı, kaynaktaki tek bir kaydın iç varlığa eşlemesini tanımlar; bir `migration_job` çok sayıda `migration_record` taşır. Idempotentliğin taşıyıcısıdır: `(tenant_id, source_system, source_ref)` üçlüsü tekil (unique) olmalıdır — aynı kaynak-anahtarı ikinci kez gelirse yeni satır değil, mevcut eşleme bulunur.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Eşleme kaydının benzersiz kimliği |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu |
| `job_id` | UUID (FK → migration_job.id) | Ait olduğu içe-aktarım işi |
| `source_ref` | ExternalId | Kaynak sistemdeki orijinal kayıt kimliği (`ExternalId` atom); idempotent anahtar, geri-izleme |
| `target_type` | Text | İç hedef archetype tipi (contract / party / clause / obligation …); ArcheType id'ye eşlenir |
| `target_id` | UUID (nullable) | Üretilen/güncellenen iç kaydın kimliği; dry_run'da null (henüz yazılmadı) |
| `evidence_preserved` | Boolean | İçe alınan imza/audit-certificate `k-evidence`'a kaynak-provenance ile korundu mu |
| `checksum` | Text | Kaynak kaydın içerik hash'i (SHA-256); idempotent-değişim tespiti ve bütünlük doğrulama |
| `conflict` | Enum(none, target_exists, checksum_mismatch, ambiguous_match) | Çakışma durumu; iç kayıtla çelişki türü |
| `resolution` | Enum(pending, created, updated, skipped, merged_mdm, manual_review) | Çakışma çözümü sonucu; `merged_mdm` = `k-mdm`'e devredildi |
| `evidence_refs` | list[UUID] (nullable) | Korunan `k-evidence` kayıtlarının referansları (imza + audit-certificate) |
| `created_at` | TIMESTAMPTZ (NOT NULL) | Audit |

Bu tablo `field_mapping`'i, bir kaynak alanın hangi iç alan/archetype/atoma nasıl eşleneceğini tanımlar; bir eşleme profili çok sayıda alan-kuralı taşır (satır = bir kaynak-alan eşlemesi). Eşleme profili yeniden kullanılabilir: aynı kaynak sistem için bir kez onaylanır, sonraki işler `mapping_ref` ile onu tüketir.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Alan-eşleme kuralının kimliği |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu |
| `profile_ref` | UUID | Eşleme profil kimliği (aynı profildeki kuralları gruplar; `migration_job.mapping_ref` bunu işaret eder) |
| `source_system` | Enum(…§migration_job ile aynı küme) | Hangi kaynak sistemin şemasına ait (`EnumType` atom) |
| `source_field` | Text | Kaynak sistemdeki alan yolu (ör. `envelope.recipients[].email`, `deal.value`) |
| `target_path` | Text | İç hedef: archetype.alan yolu (ör. `contract.total_value`, `party.tax_id`) |
| `target_atom` | Text (nullable) | Hedef alanın atom/fragment tipi (Money, ExternalId, Address …); dönüşüm türetimi için |
| `transform` | Enum(direct, cast, enum_alias, split, join, constant, drop) | Dönüşüm türü; `enum_alias` kaynak etiketini iç `EnumType` alias'ına eşler |
| `is_evidence_field` | Boolean | Bu alan bir imza/audit-certificate mi (öyleyse `k-evidence`'a korunur, iç alana değil) |
| `origin` | Enum(ai_draft, human_approved) | Eşlemenin kökeni; `ai_draft` üretimde kullanılamaz, insan `human_approved`'a yükseltir |
| `created_at` | TIMESTAMPTZ (NOT NULL) | Audit |

## 6. WBS / kernel yerleşimi

`k-migration-bridge`, kernel/layer0 kümesine (`k-*`) `module`-seviyesi bir düğüm olarak eklenir; `k-mdm`, `k-storage` ile aynı `app-layer0` altındadır. Altında asıl kod-teslimatı olan en az bir `archetype` düğümü durur (`task-to-code-contract` gereği: `module` sözleşme/şema taşır, kod alt `archetype`'ta yazılır). Bağımlılıklar `wbs-field-semantics`'e uyar: `dependsOn` = teknik/yürütme sırası (kritik yol); `related` = yalnız gezinme.

Bu tablo `k-migration-bridge` düğümünün WBS yerleşimini ve bağımlılıklarını tanımlar.

| Düğüm | Seviye | dependsOn | Küme |
|---|---|---|---|
| `k-migration-bridge` | module | `k-evidence`, `k-storage` | kernel/layer0 |

`dependsOn` gerekçesi: `k-migration-bridge` içe alınan kanıtı korumak için `k-evidence`'a (kanıt kasası, append-only) ve kanıt/kaynak binary'yi tutmak için `k-storage`'a (object storage) teknik olarak bağlıdır; bu iki primitif hazır olmadan kanıt-koruyan içe-aktarım yazılamaz. `related` ile (karar üretmeden) `task-export-contract` (ters yön — dışa-aktarım), `k-mdm` (çakışma → dedup devri), `i14y` (konnektör; ham kaydın kaynağı), `k-worker` (batch offload), `archetype-agreement` (içe alınan sözleşmenin hedef archetype'ı) ve `k-signature` (içe alınan imzanın verbatim korunması) düğümlerine bağlanır. `k-migration-bridge` `k-mdm`'i `dependsOn`'a **koymaz** (çakışma çözümü opsiyoneldir, devir runtime'da olur); ilişki `related`'dır.

## 7. Backend gereksinimleri (idempotent import motoru + async)

Aşağıdaki gereksinimler CLM migrasyon portunu bağlar; her biri test-önce (kırmızı→yeşil) yaşam döngüsüne tabidir. Motor tarafı `platform_migration` paketinde yaşar.

- **Konnektör-agnostik ithalat servisi:** Tek `ImportSource` arayüzü (read/normalize) ham kaydı kaynaktan-bağımsız verir; DocuSign/Adobe/PandaDoc/Zoho/Dropbox/legacy/CSV her biri bir adaptör, aynı arayüzde. Adaptör ham veriyi *okur ve normalize eder*, iç yazmayı motor yapar. Doğrudan `pandas.read_csv → INSERT` app'te **yasak**. Canlı kaynak-bağlantısı `i14y`'nindir; köprü `i14y`'nin çıktısını girdi alır.
- **İki mod — dry_run / execute:** `dry_run` hiçbir kalıcı yazma yapmaz; her kaynak kaydı eşler, çakışmayı tespit eder ve `stats` önizlemesini (to_create/to_update/conflicts/skipped/evidence_preserved_count) üretip döner. `execute` yalnız `approval_ref` (insan) varsa çalışır; idempotent yazar. `dry_run` çıktısı ile `execute` sonucu deterministik tutarlı olmalı (aynı girdi = aynı plan).
- **Idempotent import:** `(tenant_id, source_system, source_ref)` unique kısıtı; motor önce mevcut `migration_record` arar. Aynı kaynak-anahtarı ikinci kez gelirse yeni kayıt üretilmez — `checksum` eşitse atlanır (skip), farklıysa çakışma-çözümüne göre güncellenir. Aynı işin yeniden çalıştırılması yan-etkisizdir (aynı sonuç, dup yok).
- **Conflict resolution:** İç kayıtla çakışma dört türde tespit edilir (`target_exists`, `checksum_mismatch`, `ambiguous_match`, `none`); çözüm stratejisi işin/eşlemenin politikasıyla belirlenir (`skip` / `overwrite` / `merge-to-mdm` / `manual_review`). `ambiguous_match` (birden çok iç aday) otomatik-birleştirilmez; `k-mdm`'e devredilir (`resolution=merged_mdm`) veya insan incelemesine (`manual_review`) düşer.
- **Evidence preservation:** `is_evidence_field=true` alan (içe alınan imza görüntüsü, imza audit-certificate, tamamlanma sertifikası, hash-değeri) iç alana yazılmaz; `k-evidence`'a **append-only** bir kayıt olarak korunur. Kanıt kaydı kaynak-provenance taşır: hangi `source_system`, hangi `source_ref`, hangi `migration_job`, orijinal `checksum`; içerik verbatim korunur (normalize/değişiklik YASAK). Binary kanıt (imzalı PDF) `k-storage`'a yüklenir, referansı kanıt kaydına bağlanır. `migration_record.evidence_preserved=true` ve `evidence_refs` doldurulur.
- **Rollback:** Bir `migration_job` geri alınabilir (`status=rolled_back`); üretilen iç kayıtlar geri sarılır ama **korunan kanıt ve `migration_record` izi silinmez** (append-only; ne olduğu izlenebilir kalır). Rollback bir `approval_ref` taşır ve audit'lenir. Güncellenen (overwrite) kayıtlar için önceki değer anlık görüntüsünden (`stats`/kanıt) geri yüklenir.
- **Batch offload:** Büyük içe-aktarım (binlerce kayıt) `k-worker`'a offload edilir (senkron istek yolunda değil); idempotent (yarıda kesilip yeniden başlarsa dup üretmez), retry+backoff, dead-letter. İş ilerlemesi `stats` üstünden izlenir.
- **Audit:** Her job-oluşturma / dry-run / execute / conflict-çözümü / rollback `AuditLogger.log()` ile `actor` + `resource=migration_job` yazılır (v1 §2.5); append-only.
- **Hata formatı:** `{code, message, trace_id, details}` (v1 §3.1); `get_logger()` kullanılır, `print()` yasak.

## 8. Frontend gereksinimleri

Aşağıdaki gereksinimler Vite + React + TanStack yığınına, SCSS + token stiline, Phosphor ikon setine ve config-driven surface ilkesine uyar; CLM migrasyon sihirbazını bağlar.

- **İçe-aktarım sihirbazı:** Kaynak seç → dosya/veri yükle → alan eşlemesini gözden geçir → dry-run önizle → onayla → yürüt akışı; her adım TanStack Query ile veri çeker, hardcoded kaynak/şema referansı **yasak** (her şey runtime endpoint'inden). Yürütme adımı `approval_ref` olmadan aktifleşmez.
- **Alan eşleme editörü:** Kaynak alan → iç alan eşlemesi görsel gösterilir; AI-draft eşleme (`origin=ai_draft`) "öneri — onay bekliyor" olarak ayrışır, insan `human_approved`'a yükseltir. Eşlenmeyen zorunlu iç alan uyarı ile işaretlenir.
- **Dry-run önizleme paneli:** `stats` önizlemesi (kaç yeni / güncelleme / çakışma / atlama / korunan-kanıt) yürütmeden önce gösterilir; çakışan kayıtlar (`conflict != none`) listelenir ve çözüm stratejisi seçilir. Yürütme yalnız önizleme görüldükten sonra etkinleşir.
- **Kanıt-koruma göstergesi:** `evidence_preserved=true` kayıtlar korunan-kanıt rozetiyle ayrışır; kanıt kaydına (imza + audit-certificate, kaynak-provenance) tıklanabilir bağ verilir.
- **Erişilebilirlik:** WCAG 2.2 AA taban (AAA yüzey-bazlı opt-in); dokunmatik hedef ≥ 44x44px; renk kontrastı ≥ 4.5:1; sihirbaz adımları klavye ile gezilebilir; ilerleme durumu erişilebilir bildirilir.
- **i18n:** Kaynak sistem/mod/çakışma/çözüm/hata metinleri `I18nText` üzerinden çok-dilli; ham string gömülmez.

## 9. Multi-tenant / RLS

Her `migration_job`, `migration_record` ve `field_mapping` satırı `tenant_id` taşır ve fail-closed çalışır (bağlam yoksa istek reddedilir, v1 §2.1). İzolasyon iki katmanlıdır: (1) idempotent unique kısıt `(tenant_id, source_system, source_ref)` tenant-kapsamlıdır — bir tenant'ın kaynak-anahtarı diğerinin satırına çarpamaz. (2) PostgreSQL RLS ikinci bariyer: `USING (tenant_id = current_setting('app.current_tenant')::uuid)`. Bir içe-aktarım işi başka tenant'ın kaydını hedefleyemez: `migration_record.target_id` mutlaka aktif tenant kapsamında olmalı; cross-tenant hedef girişimi `TenantViolationError` fırlatır ve audit'lenir. Korunan `k-evidence` kanıtı da içe-aktaran tenant kapsamında saklanır; kaynak-provenance tenant sınırını genişletemez. Eşleme profilleri tenant-scoped'tur; platform tabanı eşlemesi (`tenant_id = NULL`) opsiyoneldir ve tenant yalnız daraltır/özelleştirir (üst katmanı genişletemez).

## 10. AI guardrail (autonomy seviyesi)

Aşağıdaki iş bölümü değiştirilemezdir: **AI önerir → insan onaylar → motor uygular.** (`core-contract-pack.md §3.0.1`) Bu primitifte en kritik sınır: **AI prod içe-aktarımı yürütemez.** AI alan eşlemesini önerir (draft) ve dry-run önizlemesi üretir; eşleme onayı ve execute yürütmesi insan-tetiklidir.

Bu tablo `k-migration-bridge` üzerindeki AI autonomy sınırlarını tanımlar.

| İşlem | Autonomy | Kural |
|---|---|---|
| Alan eşlemesi *önerme* | `draft` | AI kaynak→iç alan eşlemesi önerir (`field_mapping.origin=ai_draft`); doğrudan üretimde kullanılamaz |
| Dry-run önizleme üretme | `draft` | AI `mode=dry_run` önizlemesi (stats/çakışma) üretebilir; hiçbir kalıcı yazma yapmaz |
| Eşleme onayı (`human_approved`) | onay-zorunlu | `ai_draft` → `human_approved` yükseltmesi yalnız insan; AI kendi eşlemesini onaylayamaz |
| İçe-aktarım yürütme (`mode=execute`) | onay-zorunlu | `approval_ref` (insan) olmadan `execute` çağrısı `ApprovalRequiredError` fırlatır; **AI prod import yürütemez** |
| Çakışma çözümü (overwrite/merge) | onay-zorunlu | Veri ezen/birleştiren çözüm insan onayıyla; `ambiguous_match` otomatik-birleşmez |
| Rollback | onay-zorunlu | Geri alma `approval_ref` taşır; AI tek başına iş geri alamaz |
| Kanıt/audit değişimi | `none` | Korunan `k-evidence` ve audit append-only; AI değiştiremez/silemez |
| Kaynak-sistem adaptör politikası | `none` | Adaptör/şema kararı çekirdek ekip PR'ı; AI değiştiremez |

Mutlak sınırlar: AI main branch'e push edemez; app/module düğümü üretemez/güncelleyemez; ruleset override edemez; kanıtsız "bitti" diyemez; **prod içe-aktarımı doğrudan yürütemez** (yalnız draft eşleme + dry-run önizleme önerir); korunan kanıtı/audit'i değiştiremez. Bu dosyayı da AI doğrudan güncelleyemez; değiştirme yetkisi yalnız insan onayındadır.

## 11. Bağlama

**`task-export-contract` bağlama (ters yön):** `task-export-contract` iç veriyi üç dış tüketiciye *dışa* biçimlendirir; `k-migration-bridge` dış/eski veriyi *içe* alır. İkisi bir çiftin iki ucudur: export dışarı, migration-bridge içeri; ikisi de iç şemaya dokunmaz, biçim/eşleme sözleşmesi taşır. Export ham JSON üretir; migration-bridge ham kaydı iç archetype'a eşler.

**`k-evidence` bağlama (kanıt koru):** İçe alınan imza, imza-audit-certificate ve tamamlanma sertifikası `k-evidence`'a **append-only** kaydedilir; içerik verbatim korunur, üstüne kaynak-provenance (`source_system` + `source_ref` + `migration_job.id` + orijinal `checksum`) eklenir. `migration_record.evidence_refs` bu kanıt kayıtlarını işaret eder. Köprü kanıtı *üretmez/yeniden-doğrulamaz*, olduğu gibi *korur*.

**`k-mdm` bağlama (dedup devri):** `ambiguous_match` (bir kaynak kaydı birden çok iç adaya benziyor) veya kasıtlı `merge-to-mdm` çözümünde köprü tekilleştirme kararını `k-mdm`'e devreder (`resolution=merged_mdm`); golden-record/survivorship kararını MDM verir, köprü vermez. Köprü yalnız çakışmayı *tespit eder*.

**`i14y` bağlama (konnektör):** Canlı kaynak-bağlantısı (API, webhook, OAuth, rate-limit) `i14y`'nindir; `k-migration-bridge` `i14y`'nin çektiği veya bir dosyadan gelen ham kaydı *girdi* alır. Köprü kaynak sisteme kendisi bağlanmaz; ithalat adaptörü ham veriyi okur ve normalize eder.

**`k-worker` bağlama (batch):** Büyük içe-aktarım `k-worker`'a offload edilir (senkron istek yolunda değil); idempotent, retry+backoff, dead-letter. `migration_job.worker_job_ref` batch işi işaret eder.

**`archetype-agreement` bağlama:** İçe alınan sözleşme hedef olarak `archetype-agreement` (ve Party/Clause) archetype'ına eşlenir; `migration_record.target_type` bu archetype'ı işaret eder. Köprü kendi sözleşme tablosunu açmaz; iç archetype'a yazar.

## 12. Test stratejisi

Aşağıdaki testler CLM migrasyon kabul kriterlerini ve `core-contract-pack` DoD'unu karşılar; hepsi test-önce (önce kırmızı) yazılır.

Bu tablo `k-migration-bridge` için zorunlu test senaryolarını ve türlerini tanımlar.

| # | Senaryo | Test türü |
|---|---|---|
| 1 | Idempotent import: aynı kaynak parti iki kez içe alınıyor, ikinci turda dup üretilmiyor (aynı sonuç) | Entegrasyon |
| 2 | Dry-run: `mode=dry_run` hiçbir kalıcı yazma yapmadan doğru `stats` önizlemesi (to_create/to_update/conflicts) döndürüyor | Entegrasyon |
| 3 | Dry-run ↔ execute tutarlılığı: dry-run planı ile execute sonucu deterministik aynı | Entegrasyon |
| 4 | Evidence preservation: içe alınan imza + audit-certificate `k-evidence`'a kaynak-provenance ile append-only korunuyor, içerik verbatim | Entegrasyon |
| 5 | Conflict resolution: `target_exists` / `checksum_mismatch` / `ambiguous_match` doğru tespit + strateji (skip/overwrite/merge_mdm/manual) uygulanıyor | Entegrasyon |
| 6 | Rollback: iş geri alınıyor, iç kayıt geri sarılıyor ama korunan kanıt + `migration_record` izi silinmiyor | Entegrasyon |
| 7 | AI guardrail: `approval_ref`'siz `execute` reddediliyor (AI prod import yürütemez); AI yalnız draft eşleme + dry-run üretiyor | Entegrasyon |
| 8 | Tenant izolasyonu: A tenant B'nin `source_ref` anahtarını / hedef kaydını içe alamıyor (≥10 negatif case) | Entegrasyon (negatif) |
| 9 | Alan eşleme: kaynak alan → iç archetype/atom eşlemesi + dönüşüm (enum_alias, cast, split) doğru uygulanıyor | Birim |
| 10 | Migration downgrade: `alembic downgrade -1` veri kaybetmeden çalışıyor | CI |
| 11 | GraphQL koruması: her resolver `permission_classes` taşıyor | Contract |

## 13. Acceptance criteria

- Bir DocuSign/Adobe/PandaDoc/Zoho/Dropbox export'u (veya legacy CLM/CSV) içe alınıyor → kaynaktaki her kayıt iç archetype'a eşleniyor → `migration_record` üretiliyor → içe alınan imza/audit `k-evidence`'a korunuyor.
- Aynı kaynak iki kez içe alındığında kopya üretilmiyor (idempotent); `(tenant_id, source_system, source_ref)` unique; ikinci tur checksum-eşitse atlıyor, farklıysa çözüme göre güncelliyor.
- `mode=dry_run` yürütmeden önce doğru önizleme (`stats`) üretiyor; dry-run planı ile `execute` sonucu deterministik tutarlı.
- Çakışma dört türde tespit ediliyor; `ambiguous_match` otomatik-birleşmiyor (`k-mdm`'e devir veya `manual_review`).
- İçe alınan imza/audit-certificate `k-evidence`'a append-only, verbatim, kaynak-provenance (`source_system`+`source_ref`+`job`+`checksum`) ile korunuyor.
- Rollback iş geri sarıyor; korunan kanıt ve `migration_record` izi silinmiyor.
- AI içe-aktarımı yalnız `draft` (eşleme) + `dry_run` (önizleme) olarak öneriyor; `approval_ref` olmadan `execute`/rollback/overwrite reddediliyor. **AI prod import yürütemiyor.**
- Alembic migration downgrade otomatik test geçiyor; `check-core-contract` (tenant guard, resolver koruması, audit çağrısı, indeks) yeşil.

## 14. Anti-patterns

- **Serbest CSV yükleyici:** App'te `pandas.read_csv → INSERT` — YASAK; içe-aktarım yalnız `ImportSource` sözleşmeli servisinden.
- **Non-idempotent import:** Aynı kaynağı iki kez içe alıp dup üretmek — YASAK; `(tenant_id, source_system, source_ref)` unique + checksum tekilleştirir.
- **Dry-run atlama:** Önizleme yapmadan doğrudan `execute` — YASAK; execute öncesi dry-run planı ve `approval_ref` zorunlu.
- **Kanıt normalize/değiştirme:** İçe alınan imza/audit'i "temizleyip" içe almak — YASAK; kanıt verbatim + append-only, kaynak-provenance eklenir, içerik dokunulmaz.
- **Kanıtı iç alana gömme:** İmza-certificate'i düz metin alana yazmak — YASAK; kanıt `k-evidence`'a korunur (`is_evidence_field`).
- **Kaynak izini atma:** `source_ref` (`ExternalId`) taşımadan içe almak — YASAK; idempotentlik ve geri-izleme kaynak-anahtarına bağlı.
- **Köprüde golden-record üretme:** `ambiguous_match`'i köprüde otomatik birleştirmek — YASAK; tekilleştirme kararı `k-mdm`'e devredilir.
- **Kaynak sisteme köprüden bağlanma:** Canlı API/webhook mantığını köprüye gömmek — YASAK; konnektör `i14y`'nin işi.
- **AI'ın prod import yürütmesi:** `approval_ref`'siz `execute` — YASAK; `ApprovalRequiredError`. AI yalnız draft + dry-run.
- **Geri-alınamaz import:** Rollback yolu olmayan içe-aktarım — YASAK; iş geri-alınabilir, kanıt izi korunur.
- **Senkron ağır import:** Binlerce kaydı istek yolunda içe almak — YASAK; `k-worker`'a offload, idempotent.

## 15. Definition of Done

- §12'deki 11 test senaryosu yeşil (test-önce kanıtı: kırmızı→yeşil geçişi belgeli).
- `core-contract-pack` tenant + audit + indeks uyumu sağlandı; `check-core-contract.mjs` yeşil.
- Alembic migration downgrade CI'da çalışıyor.
- Idempotentlik kanıtlandı (aynı kaynak tekrar = dup yok); dry-run ↔ execute tutarlılığı entegrasyon kanıtı ile gösterildi.
- Evidence preservation kanıtlandı: içe alınan imza/audit `k-evidence`'a verbatim + kaynak-provenance ile korunuyor; rollback kanıt izini silmiyor.
- ADR-M1 "Kilitli" statüsünde (insan onayı); `k-migration-bridge` düğümü ve altındaki `archetype` düğümü WBS'te doğru `dependsOn` (`k-evidence`, `k-storage`) ile mevcut.
- AI-guardrail testi: `approval_ref`'siz `execute`/rollback/overwrite reddediliyor; AI prod import yürütemiyor (yalnız draft + dry-run).
- Doküman `icerik-kalite-sozlesmesi` biçim kurallarına uyar (aktör-açık, emoji yok, her başlıkta nedir/yapar/yapmaz, her tablodan önce açıklama, mock yok).

## 16. CLM Migration Bridge ("migration-first" farklılaştırıcı)

Aşağıdaki tablo, bu sözleşmenin CLM (Contract Lifecycle Management) migrasyon gereksinimlerini `k-migration-bridge` sözleşme öğelerine nasıl eşlediğini gösterir; her satır bir rakip-göç senaryosunu kernel primitifine bağlar. Farklılaştırıcı tez: rakip e-imza/CLM sistemleri veriyi *dışa* verirken audit izini ve kanıt-provenance'ı çoğu zaman *koparır*; `k-migration-bridge` "migration-first" yaklaşımıyla veriyi + kanıtı + audit'i **koruyarak** içe alır — geçiş maliyeti ve kilit-riski (vendor lock-in) bu primitifle düşer.

| CLM/e-imza migrasyon gereksinimi | k-migration-bridge karşılığı |
|---|---|
| DocuSign envelope + tamamlanma-certificate içe alımı | §5 `migration_job(source_system=docusign)` + `migration_record` + `k-evidence` korunan certificate |
| Adobe Sign / PandaDoc / Zoho / Dropbox Sign export | §5 `source_system` `EnumType` küme + konnektör-agnostik `ImportSource` adaptör |
| Legacy CLM/DMS toplu sözleşme göçü | §5 `legacy_clm`/`legacy_dms`; §7 batch offload (`k-worker`) |
| İçe alınan imza + audit-certificate kaybını önleme | §7/§11 evidence preservation → `k-evidence` append-only + kaynak-provenance (verbatim) |
| Aynı export'un tekrar yüklenmesinde çift kayıt olmaması | §7 idempotent import; `(tenant_id, source_system, source_ref)` unique + checksum |
| Göçten önce "ne olacak?" önizlemesi | §7 dry-run (`mode=dry_run`) + `stats`; §8 önizleme paneli |
| Mevcut iç kayıtla çakışma | §7 conflict resolution (skip/overwrite/merge_mdm/manual); `k-mdm` devri |
| Yanlış göçü geri alma | §7 rollback (kanıt izi korunur) |
| Kaynak alan → iç sözleşme alanı eşlemesi | §5 `field_mapping` (source_field → target_path/atom + transform) |
| AI'ın eşleme önerip yürütmemesi | §10 AI draft eşleme + dry-run; execute insan-tetikli (AI prod import yürütemez) |
| Hedef archetype (sözleşme/taraf/madde) | §11 `archetype-agreement` bağlama; `migration_record.target_type` |

## 17. Requirement-ID tablosu

Aşağıdaki tablo, bu sözleşmenin izlenebilir gereksinimlerini kimlik + katman + öncelik (P0–P3) + test türü + kabul + sahip ile listeler. Öncelik: P0 = bloklayıcı invariant, P1 = çekirdek, P2 = önemli, P3 = iyileştirme.

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| MB-01 | `migration_job` içe-aktarım işi kaydı (source_system/mode/mapping_ref/stats) tenant-kapsamlı | Backend/Data | P0 | Integration | İş tenant izolasyonlu yazılır/okunur | kernel-team |
| MB-02 | `migration_record` kaynak→hedef eşleme (source_ref/target/conflict/resolution) | Backend/Data | P0 | Integration | Kaynak kayıt iç varlığa eşlenir | kernel-team |
| MB-03 | `field_mapping` kaynak alan → iç alan/atom + transform | Backend/Data | P1 | Unit | Alan eşlemesi + dönüşüm uygulanır | kernel-team |
| MB-04 | Idempotent import: `(tenant_id, source_system, source_ref)` unique + checksum | Backend | P0 | Integration | Aynı kaynak tekrar = dup yok | kernel-team |
| MB-05 | Dry-run önizleme (`mode=dry_run`, yazma yok, doğru stats) | Backend | P0 | Integration | Yürütmeden önce doğru önizleme | kernel-team |
| MB-06 | Dry-run ↔ execute deterministik tutarlılık | Backend | P1 | Integration | Aynı girdi = aynı plan/sonuç | kernel-team |
| MB-07 | Evidence preservation → `k-evidence` append-only + kaynak-provenance (verbatim) | Backend/Security | P0 | Integration | İmza/audit korunur, içerik değişmez | kernel-team |
| MB-08 | Conflict resolution (target_exists/checksum_mismatch/ambiguous_match + strateji) | Backend | P1 | Integration | Çakışma tespit + doğru çözüm | kernel-team |
| MB-09 | `ambiguous_match` → `k-mdm` devri (köprü golden-record üretmez) | Backend | P1 | Integration | Belirsiz eşleşme MDM'e devredilir | kernel-team |
| MB-10 | Rollback (iş geri sarılır, kanıt + record izi korunur) | Backend | P0 | Integration | Geri alma kanıt izini silmez | kernel-team |
| MB-11 | Konnektör-agnostik `ImportSource` adaptör (DocuSign/Adobe/PandaDoc/Zoho/Dropbox/legacy/CSV) | Backend | P1 | Integration | Aynı motor çoklu kaynağa çalışır | kernel-team |
| MB-12 | Batch offload (`k-worker`, idempotent, retry+backoff, dead-letter) | Backend/Perf | P1 | Integration | Büyük import istek yolunu bloklamaz | kernel-team |
| MB-13 | İçe-aktarım mutasyonu audit (append-only) | Security | P0 | Integration | job/execute/rollback audit'e düşer | security-team |
| MB-14 | Tenant-scoped unique + RLS ikinci bariyer | Security | P0 | Integration(neg) | ≥10 cross-tenant negatif case reddedilir | security-team |
| MB-15 | Alembic expand-contract + dolu downgrade | Backend/DevOps | P1 | CI | `alembic downgrade -1` veri kaybetmez | kernel-team |
| MB-16 | Strawberry resolver `permission_classes` zorunlu | Backend/API | P1 | Contract | Korumasız resolver yok | kernel-team |
| MB-17 | AI eşleme `draft` + dry-run; `execute` insan-tetikli (`approval_ref`) | AI-Governance | P0 | Integration | approval_ref'siz execute reddedilir | governance |
| MB-18 | AI prod import yürütemez / kanıt-audit değiştiremez (autonomy none) | AI-Governance | P0 | Unit | AI execute/rollback/kanıt kararı veremez | governance |
| MB-19 | Frontend içe-aktarım sihirbazı + eşleme editörü + dry-run paneli config-driven | Frontend | P1 | E2E | UI runtime verisinden türetilir, hardcoded kaynak yok | ui-team |
| MB-20 | WCAG 2.2 AA + i18n (kaynak/mod/çakışma metinleri) | Frontend/A11y | P2 | A11y(axe) | axe critical=0; klavye-gezilebilir sihirbaz | ui-team |
| MB-21 | `k-migration-bridge` WBS düğümü doğru dependsOn (k-evidence, k-storage) | Governance/WBS | P1 | CI(data-quality) | DAG geçerli, dangling yok | pmo |

---

*Kaynak/kardeş sözleşmeler: `task-export-contract.md` (ters yön — dışa-aktarım), `k-mdm-provenance-directive.md` (dedup devri), `evidence-taxonomy.md`/`k-evidence` (kanıt koruma), `k-storage-dam-directive.md` (binary), `atomik-tip-katalogu-tam-2026-07-01.md` (`ExternalId` idempotent import anahtarı, `EnumType` atom), `core-contract-pack.md §3.0.1` (AI guardrail). Bu doküman hiçbir kod/şema/JSON dosyasına dokunmaz; yalnız sözleşme metnidir. Çelişki halinde `core-contract-pack.md` (kernel runtime) önceliklidir; bu doküman güncellenir. Sözleşmeyi değiştirme yetkisi yalnız insan onayındadır; AI bu dosyayı doğrudan güncelleyemez.*
