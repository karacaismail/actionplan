# Privacy / Audit / Bitemporal / Retention Karar Matrisi — Veri-Sınıfı × Muamele Çelişki-Çözüm Yönergesi

**Tarih:** 2026-07-02
**Durum:** Taslak sözleşme (kilitlenmeyi bekliyor — bkz. §15 DoD, ADR-PRM1)
**WBS düğümü:** `privacy-retention-matrix` (karar katmanı; `k-legal-hold-retention` genişletmesi)
**Kaynak/bağlam:** `core-contract-pack.md §2.5` (Audit Log append-only, `REVOKE UPDATE, DELETE`), `core-contract-pack.md §3.0.1` (ortak AI-güvenlik invariantı), `k-legal-hold-retention-directive.md` (bu turda yazıldı — **genişletilir**; legal-hold ↔ retention ↔ erasure çatışması), `k-storage-dam-directive.md` (binary/backup silme, soft-delete + arşiv), `k-mdm-provenance-directive.md` (append-only + hash-zinciri deseni), `pdp-policy-contract.md` (yetki kararı policy-as-data), `evidence-taxonomy.md` (kanıt ≠ hold; ikisi ayrı), `atomik-netlestirme-2026-07-01.md` (`PartyRef`/`EnumType`/`Duration`/`Range<date>` atomları).
**İlişki:** Bu doküman `k-legal-hold-retention`'ın **karar-matrisi genişletmesidir**: `k-legal-hold-retention` "bu kayıt kilitli mi, ne kadar saklanır, ne zaman imha edilir?" **mekaniğini** kurar; bu doküman ise "**silme hakkı** ile **değişmez finansal saklama** ile **append-only audit** ile **bitemporal tarih** ile **backup** ile **AI-trace** ile **vector-embedding** aynı anda çatıştığında, her VERİ SINIFI için hangi MUAMELE'nin izinli olduğunu" tek matriste **normatif** çözer. Çelişme değil, çakışma-çözümü: bu doküman yeni bir kilit motoru **yazmaz**; `k-legal-hold-retention`'ın `retention_policy`/`hold_lock`/`disposition` mekaniğine **muamele-sınıfı** (treatment class) beyanı ekler. Bu doküman **kod yazmaz**; bir karar sözleşmesi ve CI-kapı önerisidir. Makine-okunur karşılığı (matris kayıt tablosu, `check-privacy-retention` kapısı) ADR-PRM1 kilitlendiğinde ajan-draft + insan-onay ile `platform` reposunda üretilir.

**Stack:** FastAPI + SQLAlchemy 2.0/SQLModel + Alembic + PostgreSQL. Frontend: Vite + React + TanStack. **YASAK:** Next.js, Supabase, Prisma, Redux, Flowbite, antd, MUI, Chakra, Mantine, react-markdown.

---

## 1. Amaç

Bu sözleşme, platformdaki gizlilik/silme (GDPR/KVKK erasure), değişmez denetim (append-only audit), değişmez finansal saklama (VUK/TTK), bitemporal iş-zamanı tarihi, yedekleme (backup), AI/LLM izleri ve vektör gömmeleri (embedding) arasındaki **çözülmemiş çelişkiyi** tek bir karar matrisine indirmeyi sabitler. Sorun şudur: aynı gerçek kayıt (ör. bir müşteri e-postası) hem "silinmeli" (kişisel veri, unutulma hakkı), hem "silinemez" (bir faturanın parçası, VUK 253), hem "değiştirilemez" (denetim izinde geçiyor), hem "geçmişe dönük görülebilir" (bitemporal), hem "yedekte kopyası var" (backup), hem "LLM prompt'una girmiş" (AI-trace), hem "vektör index'inde gömülü" (embedding) olabilir. Bu yedi kuvvet aynı veriye farklı — ve kısmen zıt — muameleler dayatır. Hedef: 50 uygulamanın hiçbirinin bu çatışmayı ad-hoc çözmemesi; her PII/finansal/denetim alanının **tek bir muamele-sınıfı** beyan etmesi ve çatışmanın **tek bir normatif kural kümesiyle** (bu doküman §7) çözülmesi. Ana çelişki-çözüm kuralı bir cümledir: **kişinin silme hakkı, kaydın değişmez finansal/denetim yükümlülüğünü yok etmez — bunun yerine kişisel-veri pseudonymize/anonymize edilir, kaydın iskeleti (tutar, tarih, denetim izi) yasal saklama süresince değişmez kalır; aktif legal hold ise bu ikisini de ezer.** Aktör-açık ifade: *ajan* her alan için muamele-sınıfı ve çatışma-çözümü *önerir* (draft: eksik sınıflandırma, çelişen muamele, süresi geçmiş imha adayı); *insan* (hukuk/uyum/veri-yönetişim yetkilisi) onaylar; *motor* onaylı muameleyi deterministik ve denetlenebilir uygular. Bir veriyi silme/pseudonymize/hold kararı **yalnız insandır**; AI bir kaydın muamele-sınıfını değiştiremez, veri silemez, çatışma kuralını override edemez.

## 2. Kapsam

Bu sözleşme şunları kapsar: (1) **Ana karar matrisi** — sekiz veri sınıfı (PII-kişisel, finansal-işlem, audit-log, sözleşme-kanıtı, vector-embedding, LLM-trace, backup, operasyonel) × dokuz muamele (hard delete, soft delete, pseudonymization, legal hold, immutable retention, audit redaction, backup expiry, vector deletion, LLM-trace deletion); her hücre izin/koşul beyanı taşır. (2) **Çatışma-çözüm kuralları** (normatif) — silme hakkı ⟂ değişmez finansal kayıt, erasure ⟂ aktif legal hold, bitemporal ⟂ audit ayrımı, silme ⟂ backup, silme ⟂ vector store, silme ⟂ LLM-trace. (3) **Zor sorular** — silmenin backup/vektör/LLM-provider'da somut mekaniği (backup expiry + crypto-shredding; embedding silme/yeniden-üretim; zero-retention sözleşmesi/redaction). (4) **`check-privacy-retention` CI kapısı önerisi** — her PII/finansal alan bir muamele-sınıfı beyan eder; sınıfsız alan build'i kırar. (5) Muamele-sınıfı beyanının şekli (alan yapısı). (6) `k-legal-hold-retention`, audit (append-only) ve PDP ile reconcile referansı. (7) AI guardrail: AI veri silemez/muamele-sınıfı değiştiremez. WBS yerleşimi, çok-kiracılı izolasyon ve test stratejisi ilgili bölümlerde tarif edilir.

## 3. Non-goals

Bu sözleşme şunları **kapsamaz**: (1) Kilit/imha motorunun kendisini yeniden yazmaz — WORM kilidi, `hold_lock`, `disposition` (delete/anonymize/archive), `evaluate_retention` mekaniği `k-legal-hold-retention`'dadır; bu doküman ona **muamele-sınıfı** ekseni ekler, mekanik üretmez. (2) Audit deposunu kurmaz — append-only audit ve `REVOKE UPDATE, DELETE` `core-contract-pack §2.5`'tedir; bu doküman audit'in silme/pseudonymize karşısında **nasıl davrandığını** (redaction ≠ delete) tanımlar, audit'i yeniden inşa etmez. (3) Yetki kararı vermez — "bu aktör bu kaydı silebilir/pseudonymize edebilir mi?" kararı PDP'nindir (`k-policy-pdp`); bu doküman muamele-sınıfını policy-as-data olarak sunar, yetkiyi PDP'de bırakır. (4) Şifreleme altyapısını (KMS/anahtar-yönetimi) kurmaz — crypto-shredding bir *muamele*dir; anahtar-döndürme/saklama ayrı bir güvenlik-kenarı eksenidir (`standards/11-security-edge-standard.md`). (5) Bitemporal veri modelini (system-time/valid-time kolonları) tanımlamaz — bitemporal bir **modelleme** kararıdır; bu doküman yalnız bitemporal tarihin audit'in **yerine geçmediğini** ve erasure karşısında nasıl davrandığını sabitler. (6) Vektör store / LLM sağlayıcı seçimini yapmaz — hangi vektör DB, hangi LLM provider ayrı bir altyapı kararıdır; bu doküman yalnız silmenin bu iki katmanda **nasıl** yürütüldüğünü sözleşmeye bağlar. (7) Serbest kodla silme — hiçbir app doğrudan `DELETE FROM ...`, `boto3.delete_object`, `index.delete(ids)` veya provider-trace API'siyle bir muamele-sınıflı kaydı silemez; her muamele bu matrisin kuralından ve `k-legal-hold-retention` kilit-kontrolünden geçer.

## 4. Tanım (nedir / ne yapar / ne yapmaz)

**Nedir:** `privacy-retention-matrix`, platformdaki her veri sınıfının hangi muameleye (silme/pseudonymization/hold/immutable retention/redaction/backup-expiry/vector-deletion/LLM-trace-deletion) hangi koşulla tabi olduğunu tek bir matriste sabitleyen, ve gizlilik/audit/bitemporal/retention kuvvetleri çatıştığında hangisinin kazandığını normatif kurallarla çözen bir **karar sözleşmesi ve muamele-sınıfı kayıt katmanıdır**. Matris veri olarak yaşar; her PII/finansal alan bir muamele-sınıfına bağlanır ve çatışma bu sözleşmenin kuralıyla çözülür.

**Ne yapar:** Sekiz veri sınıfını dokuz muamele ekseninde tablolaştırır (§6) ve her hücre için "izinli mi, hangi koşulla?" cevabını verir. Çelişkiyi normatif kurala bağlar (§7): erasure talebi geldiğinde veri sınıfına göre yol ayırır — PII hard/soft silinir veya pseudonymize edilir; finansal-işlem **silinmez, pseudonymize edilir** (yasal saklama iskeleti korunur); audit-log **silinmez, redaksiyon uygulanır** (append-only, üstüne yazılmaz); aktif legal hold her ikisini de **askıya alır** (hold kazanır, `k-legal-hold-retention`'a bağlanır). Bitemporal tarihi audit'ten **ayrı tutar** (bitemporal = iş-zamanı gerçeği, audit = kim-ne-yaptı değişmez izi; biri diğerinin yerine geçmez). Backup'ta silmeyi backup-expiry + crypto-shredding'e; vektör store'da silmeyi embedding-deletion + yeniden-üretim'e; LLM-trace'te silmeyi zero-retention sözleşmesi + redaction'a bağlar (§8). Her muamele-uygulamasını `k-legal-hold-retention`'ın `disposition` motoruna ve append-only audit'e devreder.

**Ne yapmaz:** Kilit/imha motorunu **çalıştırmaz** (bu `k-legal-hold-retention`'ın `apply_disposition`/`is_held` işidir; bu doküman sınıfı beyan eder, motor uygular). Audit'i **silmez/üzerine yazmaz** — audit'e yalnız redaction (hassas alan maskeleme, yapı korunur) uygulanabilir; audit satırı fiziksel silinmez (`REVOKE DELETE`). Finansal-işlem kaydını **silmez** — yalnız kişisel-veri alanları pseudonymize edilir; tutar/tarih/vergi-iskeleti yasal saklama süresince değişmez. Aktif legal hold'lu kaydı **hiçbir muamele ile dokunmaz** (hold WORM'u ezer). Bitemporal geçmişi audit'in **yerine koymaz** ve "geçmişi düzelttik" diye audit'i değiştirmez. Bir veriyi crypto-shredding olmadan backup'tan "sildim" **demez** (backup immutable snapshot'ta fiziksel kalır; erişilemezlik anahtar-yıkımıyla sağlanır). AI'ın veri silmesine, muamele-sınıfı değiştirmesine veya çatışma kuralını override etmesine **izin vermez** (bu insan/hukuk kararıdır).

## 5. Sözleşme şekli (muamele-sınıfı beyanı — alan yapısı)

Aşağıdaki tablo, bir PII/finansal/denetim alanının hangi muamele-sınıfına bağlandığını beyan eden `field_treatment_class` kaydının veri şeklini yalnızca *alan adı + tip + amaç* olarak tarif eder; dolu örnek/mock değer verilmez. Tipler PostgreSQL/SQLAlchemy 2.0 karşılıklarıdır ve atomik kademe modeline (`atomik-netlestirme-2026-07-01.md`) oturur: `EnumType` alias+i18n taşıyan tek-değer atomu (data_class/erasure_treatment), `Duration` süre atomu (retention süresi referansı), `PartyRef` referans-değer atomu (sınıflandırmayı onaylayan yetkili). Bu kayıt bir *beyan*dır — muameleyi uygulamaz, yalnız hangi muamelenin izinli olduğunu ve çatışmada hangi kuralın işlediğini işaretler; fiili imha/pseudonymize `k-legal-hold-retention` `disposition` motoruyla, onaylı yürütülür.

Bu tablo `field_treatment_class` muamele-sınıfı beyanının alanlarını tanımlar. Aktör: veri-yönetişim/uyum yetkilisi tanımlar (AI draft önerir); motor okur ve çatışma-çözüm kuralını uygular.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Beyanın benzersiz kimliği |
| `tenant_id` | UUID (nullable, indexed) | `null` = platform tabanı (yasal minimum sınıflandırma); dolu = tenant override (yalnız daha katı yönde) |
| `subject_type` | Text (indexed) | Alanın ait olduğu kayıt tipi (ör. `customer`, `invoice`, `audit_entry`, `agreement`, `llm_trace`, `embedding`); ArcheType id'ye eşlenir |
| `field_path` | Text (indexed) | Alanın yapısal yolu (ör. `customer.email`, `invoice.buyer_tax_id`); serbest metin değil, şema-doğrulanabilir |
| `data_class` | `EnumType`(pii_personal, financial_transaction, audit_log, contract_evidence, vector_embedding, llm_trace, backup, operational) | Verinin sınıfı; matris satırını seçer (§6) |
| `erasure_treatment` | `EnumType`(hard_delete, soft_delete, pseudonymize, retain_immutable, redact) | Erasure talebi geldiğinde bu alana uygulanacak muamele (matris hücresi); finansal-işlem için `pseudonymize`/`retain_immutable`, audit için `redact` |
| `retention_ref` | UUID (FK → retention_policy.id, nullable) | Alanı yöneten `k-legal-hold-retention` politikası; süre/anchor/disposition oradan gelir (tek kaynak) |
| `legal_basis` | Text (nullable) | Silinemezlik/pseudonymize gerekçesinin yasal dayanağı (ör. VUK 253, TTK 82, KVKK m.7, GDPR Art.17(3)); `retain_immutable`/`pseudonymize` için zorunlu |
| `pii_in_class` | Boolean (NOT NULL, default false) | Bu alan finansal/audit sınıfında olsa da kişisel-veri **içeriyor** mu (ör. faturadaki alıcı adı); erasure'da pseudonymize hedefi |
| `backup_shred` | Boolean (NOT NULL, default false) | Erasure'da backup'taki kopyanın crypto-shredding kapsamında mı (anahtar-yıkımıyla erişilemez kılınır) |
| `vector_derived` | Boolean (NOT NULL, default false) | Bu alandan vektör embedding üretiliyor mu; erasure'da embedding-deletion + yeniden-üretim tetikler |
| `llm_exposed` | Boolean (NOT NULL, default false) | Bu alan LLM prompt/trace'ine giriyor mu; erasure'da zero-retention/redaction gerektirir |
| `hold_overrides` | Boolean (NOT NULL, default true) | Aktif legal hold bu alanın her muamelesini ezer mi (varsayılan `true`; hold her zaman kazanır — `k-legal-hold-retention` ile hizalı) |
| `approval_ref` | UUID (nullable) | Sınıflandırma tanım/değişim onayı (insan yetkili + zaman + gerekçe); AI-draft ise zorunlu |
| `enabled` | Boolean (NOT NULL, default true) | Beyan aktif mi; AI bunu değiştiremez (§10) |
| `created_at` | TIMESTAMPTZ (NOT NULL) | Audit/oluşturulma zamanı |
| `updated_at` | TIMESTAMPTZ (NOT NULL) | Son değişiklik zamanı |

## 6. Ana karar matrisi (veri-sınıfı × muamele)

Aşağıdaki matris sözleşmenin çekirdeğidir. Satırlar sekiz veri sınıfını, sütunlar dokuz muameleyi taşır. Her hücre üç değerden birini alır: **İzinli** (koşulsuz izinli), **Koşullu** (yalnız belirtilen koşulla — çatışma-çözümü §7'ye bakar), **Yasak** (bu sınıfa bu muamele hiçbir koşulla uygulanamaz). Kısaltmalar sütun başlıklarında: HD=hard delete (fiziksel kalıcı silme), SD=soft delete (tombstone + arşiv, geri-alınabilir), PS=pseudonymization (kişisel-veri geri-döndürülemez maskeleme, kayıt iskeleti kalır), LH=legal hold (dava/denetim kilidi), IR=immutable retention (yasal saklama, değişmez), AR=audit redaction (denetim izinde hassas alan maskeleme, satır silinmez), BE=backup expiry (yedeğin süre-sonu döngüsü + crypto-shredding), VD=vector deletion (embedding silme + yeniden-üretim), LD=LLM-trace deletion (sağlayıcı zero-retention + redaction). Matris **veri sınıfını** çözer; somut bir alan birden fazla sınıfa dokunuyorsa (ör. faturadaki isim = financial_transaction satırı ama `pii_in_class=true`), en katı yükümlülük kazanır ve §7 kuralı uygulanır. Aktör: hücre kararı sözleşmeyle sabittir; alan sınıflandırması insan onaylıdır; muameleyi motor uygular.

Bu tablo veri sınıfı × muamele ana karar matrisini tanımlar; her hücre izinli/koşullu/yasak durumunu ve koşulunu taşır.

| Veri sınıfı \ Muamele | HD | SD | PS | LH | IR | AR | BE | VD | LD |
|---|---|---|---|---|---|---|---|---|---|
| **PII-kişisel** (ad, e-posta, TC/GPS, iletişim) | Koşullu: hold yoksa + saklama zorunluluğu yoksa | İzinli | İzinli | Koşullu: yalnız insan/hukuk | Koşullu: yalnız yasal saklama gerekçesiyle | Yasak (PII saf hâlde audit'te tutulmaz; kaynakta silinir/pseudonymize) | Koşullu: crypto-shred kapsamında | Koşullu: türev embedding varsa zorunlu | Koşullu: LLM'e girdiyse zorunlu |
| **Finansal-işlem** (fatura, tutar, vergi no, mutabakat) | Yasak (yasal saklama; VUK/TTK) | Koşullu: yalnız saklama süresi sonrası | Koşullu: içerdiği PII için (iskelet kalır) | Koşullu: yalnız insan/hukuk | İzinli (varsayılan; süre + anchor) | Yasak (finansal denetim izi silinmez) | Koşullu: süre-sonu + hold yoksa | Koşullu: PII türeviyse | Koşullu: PII LLM'e girdiyse |
| **Audit-log** (kim-ne-yaptı değişmez iz) | Yasak (`REVOKE DELETE`, append-only) | Yasak (append-only; tombstone bile yok) | Koşullu: yalnız gömülü PII alanı için redaction yoluyla | Koşullu: denetim izi dava kapsamındaysa kilitlenir | İzinli (min 2 yıl; §2.5) | İzinli (hassas alan maskelenir, satır+zincir korunur) | Koşullu: süre-sonu + hold yoksa (zincir bütünlüğüyle) | Yasak (audit'ten embedding üretilmez) | Yasak (audit LLM trace'i değildir) |
| **Sözleşme-kanıtı** (imzalı doküman, LTV, delil) | Yasak (delil değeri; eIDAS) | Yasak (kanıt kasası append-only) | Koşullu: yalnız gömülü PII, delil bütünlüğü bozulmadan | İzinli (dava/denetimde kilitlenir) | İzinli (delil saklama süresi) | Koşullu: yalnız PII alanı, imza/hash korunarak | Koşullu: süre-sonu + hold yoksa | Koşullu: metinden embedding varsa | Koşullu: OCR/özet LLM'e girdiyse |
| **Vector-embedding** (türev vektör index) | İzinli (türev; kaynaktan yeniden üretilir) | İzinli | Yasak (embedding maskelenmez; silinip yeniden üretilir) | Koşullu: kaynak held ise türev de erişilmez | Koşullu: kaynağın saklaması gerektiriyorsa | Yasak (embedding audit değildir) | Koşullu: vektör backup'ı varsa | İzinli (kaynak silinince türev de silinir/yeniden üretilir) | Yasak (embedding LLM trace'i değildir) |
| **LLM-trace** (prompt, completion, ara-izler) | Koşullu: sağlayıcı zero-retention yoksa yerelde silinir | İzinli | Koşullu: yalnız gömülü PII redaction | Koşullu: trace dava kapsamındaysa kilitlenir | Koşullu: uyum gereği tutuluyorsa (kısa süre) | Koşullu: PII alanı maskelenir | Koşullu: trace backup'ı varsa crypto-shred | Yasak (trace'ten embedding üretilmez) | İzinli (zero-retention sözleşmesi + yerel redaction) |
| **Backup** (yedek snapshot, DR kopyası) | Yasak (immutable snapshot fiziksel silinmez) | Yasak | Yasak (snapshot değiştirilemez) | Koşullu: snapshot içi held kayıt restore'da atlanır | İzinli (backup retention takvimi) | Yasak (snapshot üzerine yazılmaz) | İzinli (süre-sonu döngüsü + crypto-shredding ile erişilemez) | Koşullu: vektör snapshot'ı ise | Koşullu: trace snapshot'ı ise |
| **Operasyonel** (log, metrik, cache, geçici) | İzinli | İzinli | İzinli | Koşullu: dava kapsamına girdiyse | Koşullu: uyum gereği kısa saklama | Koşullu: PII sızmışsa redaction | İzinli (kısa döngü) | İzinli | İzinli |

## 7. Çatışma-çözüm kuralları (normatif)

Aşağıdaki altı kural, iki veya daha fazla kuvvet aynı veriye zıt muamele dayattığında hangisinin kazandığını **bağlayıcı** biçimde çözer. Bu kurallar matrisin (§6) "Koşullu" hücrelerinin koşuludur ve `k-legal-hold-retention`'ın çatışma kurallarını **genişletir** (onunla çelişmez; onun üstüne PII/finansal/audit/bitemporal/backup/vektör/LLM eksenini koyar). Aktör: kuralı motor uygular; sonuç (askıya alma, pseudonymize, redaction) audit'lenir; kararı doğuran insan onayı gerektiren adımlar açıkça işaretlidir.

Bu tablo altı çatışma-çözüm kuralını (çelişki → kazanan → mekanik) tanımlar.

| # | Çelişki | Kazanan / kural | Mekanik |
|---|---|---|---|
| K1 | Silme hakkı (erasure) ⟂ değişmez finansal kayıt | **Finansal iskelet kazanır; PII pseudonymize** | Finansal-işlem kaydı **silinmez** (VUK/TTK saklama); yalnız içerdiği kişisel-veri alanları (`pii_in_class=true`) geri-döndürülemez pseudonymize edilir; tutar/tarih/vergi-no-iskeleti yasal saklama süresince değişmez kalır. `erasure_treatment=pseudonymize`, `disposition=anonymize` ile yürütülür. |
| K2 | GDPR/KVKK erasure ⟂ aktif legal hold | **Hold kazanır** (her şeyi ezer) | Bir erasure talebi geldiğinde motor önce `k-legal-hold-retention.is_held()` sorar; subject held ise **hiçbir muamele uygulanmaz** — talep `ErasureBlockedByHoldError` ile askıya alınır, gerekçe + talep-eden `PartyRef` audit'lenir, hold kalkınca yeniden değerlendirilir (GDPR Art.17(3)(b/e), KVKK m.7 istisna). Bu kural `k-legal-hold-retention §7`'nin aynısıdır — **buradan referans verilir, tekrar tanımlanmaz.** |
| K3 | Bitemporal tarih ⟂ audit izi | **İkisi ayrı — biri diğerinin yerine geçmez** | Bitemporal history = **iş-zamanı gerçeği** ("bu kayıt 1 Ocak'ta şu değerdeydi, 1 Mart'ta düzeltildi"); audit = **kim-ne-yaptı değişmez izi** ("Ali bu kaydı 1 Mart'ta şu IP'den değiştirdi"). Bitemporal düzeltme audit'i **değiştirmez**; audit her iki temporal değişikliği de ayrı satır olarak kaydeder. Bir kayıt bitemporal olarak "geçmişte düzeltildi" olsa bile audit izi silinmez/redakte edilmez (yalnız gömülü PII için AR). Bitemporal, erasure'da valid-time verisini kapatabilir ama system-time audit izini asla silmez. |
| K4 | Silme hakkı ⟂ backup kopyası | **Backup immutable; erişilemezlik crypto-shredding'le** | Kişisel veri backup snapshot'ından **fiziksel silinmez** (immutable snapshot, tutarlılık ve DR bütünlüğü için). Erasure sonrası: (a) canlı sistemde veri silinir/pseudonymize edilir; (b) backup'taki kopya **backup-expiry** takviminde döner (süre dolunca snapshot imha); (c) erasure süre-sonundan önce etkiliyse **crypto-shredding** uygulanır — verinin şifre anahtarı yıkılır, ciphertext backup'ta kalsa da çözülemez (erişilemez = pratikte silinmiş). `backup_shred=true` alanları bu kapsamdadır. Restore sırasında held/erased kayıtlar yeniden-uygulama filtresinden geçer. |
| K5 | Silme hakkı ⟂ vector store (embedding) | **Embedding türevdir; silinir + yeniden üretilir** | Vektör embedding kaynağın **türevidir**, bağımsız gerçek değildir. Kaynak PII silinince/pseudonymize edilince: (a) o kaynaktan üretilen embedding vektör index'ten **silinir** (`vector deletion`, id-bazlı); (b) gerekiyorsa pseudonymize kaynaktan **yeniden üretilir** (PII'siz). Embedding **maskelenmez/redakte edilmez** (vektör uzayında maskeleme anlamsız) — silinip yeniden üretilir. `vector_derived=true` alanlar erasure'da bu adımı zorunlu tetikler; türev silinmeden kaynak silme "tamamlanmış" sayılmaz. |
| K6 | Silme hakkı ⟂ LLM sağlayıcı trace'i | **Zero-retention sözleşmesi + redaction** | LLM prompt/completion sağlayıcı tarafında iz bırakabilir. Kural: (a) sözleşme düzeyinde **zero-retention** (sağlayıcı prompt/completion'ı eğitime/saklamaya almaz — sözleşmeli veri-işleme addendum'u); (b) yerelde tutulan LLM-trace kaydı erasure'da **redaksiyon** (PII alanı maskelenir) veya silinir; (c) `llm_exposed=true` alanlar için erasure, sağlayıcıya iletilen izin **yerel kopyasını** temizler ve zero-retention teyidini şart koşar. Sağlayıcı zero-retention vermiyorsa o alan LLM'e **verilmez** (kaynakta engellenir). |

## 8. Zor sorular (net cevap)

Aşağıdaki üç soru, "silme hakkı"nın canlı-DB dışındaki üç zorlu yüzeyde (backup, vektör, LLM) somut olarak nasıl karşılandığını **kesin** cevaplar; her biri §7'deki bir kurala (K4/K5/K6) dayanır ve `k-legal-hold-retention` `disposition` motoruna bağlanır. Aktör: yürütmeyi motor yapar, onayı insan verir, sonucu audit taşır.

Bu tablo üç zor soruyu (soru → net cevap → yürütme) tanımlar.

| Soru | Net cevap | Yürütme |
|---|---|---|
| Silme **backup'ta** nasıl olur? | Backup snapshot immutable'dır; fiziksel satır silinmez. Erasure iki mekanizmayla karşılanır: **backup expiry** (snapshot süre-sonu takviminde imha edilir) + **crypto-shredding** (süre-sonundan önce erişilemezlik gerekiyorsa verinin anahtarı yıkılır; ciphertext kalır, çözülemez). Restore'da erased/held kayıtlar yeniden-uygulama filtresinden geçer. | K4; `backup_shred=true`; anahtar-yıkımı KMS'te, audit'li; `disposition` motoru snapshot'a değil canlıya + anahtara etki eder |
| Silme **vector store'da** nasıl olur? | Embedding kaynağın türevidir. Kaynak silinince/pseudonymize edilince ilgili embedding **id-bazlı silinir**; pseudonymize kaynaktan gerekirse **yeniden üretilir** (PII'siz). Embedding maskelenmez — silinir. Türev temizlenmeden kaynak silme tamamlanmış sayılmaz. | K5; `vector_derived=true`; vektör index `delete(ids)` + yeniden-embed işi (scale-invariant, idempotent); audit'li |
| Silme **LLM provider trace'inde** nasıl olur? | Sözleşme düzeyinde **zero-retention** (sağlayıcı prompt/completion'ı saklamaz/eğitmez — veri-işleme addendum'u). Yerel LLM-trace kaydı erasure'da **redakte edilir/silinir**. Sağlayıcı zero-retention vermezse o alan LLM'e hiç verilmez. | K6; `llm_exposed=true`; zero-retention teyidi provider-adapter sözleşmesinde (`k-provider-adapter`); yerel trace redaction/delete audit'li |

## 9. Multi-tenant / RLS + platform yasal minimumu

Her `field_treatment_class` beyanı (tenant override satırı) `tenant_id` taşır ve fail-closed çalışır (bağlam yoksa istek reddedilir, `core-contract-pack §2.1`). PostgreSQL RLS ile bir tenant başka tenant'ın muamele-sınıfı beyanını göremez/etkileyemez: `USING (tenant_id = current_setting('app.current_tenant')::uuid)`. Katman modeli `k-legal-hold-retention §9` ile aynıdır: `field_treatment_class.tenant_id = NULL` platform tabanı yasal minimum sınıflandırmayı verir (ör. "fatura vergi-no = financial_transaction, retain_immutable, VUK 253"); tenant kendi override'ını tanımlayabilir ama **yalnız daha katı yönde** — alt katman (tenant) üst katmanı (platform) gevşetemez, `retain_immutable`'ı `hard_delete`'e çeviremez, `hold_overrides`'ı kapatamaz, saklama süresini kısaltamaz (yasal minimum mutlaktır). Çok-yargı çatışmasında **en katı yükümlülük kazanır** (en uzun saklama + en güçlü silme-yasağı). Muamele uygulaması (pseudonymize/delete/redaction) tenant sınırını *genişletemez*: bir tenant'ın erasure'ı yalnız kendi verisine etki eder; cross-tenant muamele girişimi `TenantViolationError` fırlatır ve audit'lenir. Schema-per-tenant / RLS geçiş eşiği ADR-0026'ya uyar.

## 10. AI guardrail (autonomy seviyesi)

Aşağıdaki iş bölümü değiştirilemezdir: **AI önerir → insan onaylar → motor uygular.** (`core-contract-pack.md §3.0.1`) Bu doküman hukuki/gizlilik sonucu doğurduğu için AI'ın autonomy'si en dar seviyededir: AI hiçbir veriyi silemez, hiçbir alanın muamele-sınıfını değiştiremez ve hiçbir çatışma kuralını override edemez.

Bu tablo `privacy-retention-matrix` üzerindeki AI autonomy sınırlarını tanımlar.

| İşlem | Autonomy | Kural |
|---|---|---|
| Muamele-sınıfı *önerme* | `draft` | AI bir alan için eksik/zayıf sınıflandırma, çelişen muamele önerir (`TreatmentClassDraft`); doğrudan yürürlüğe koyamaz |
| Sınıflandırma-boşluğu *işaretleme* | `draft` | AI muamele-sınıfı beyan edilmemiş PII/finansal alanı işaretler (CI-kapı adayı); sınıfı **atayamaz** |
| İmha/pseudonymize adayı *önerme* | `draft` | AI süresi dolmuş/erasure-uygun kayıt işaretler; muameleyi **uygulayamaz** |
| Veri silme / pseudonymize / redaction | `none` | AI hiçbir veriyi **silemez/pseudonymize/redakte edemez**; muamele yalnız insan onayı (`approval_ref`) + `k-legal-hold-retention` motoru |
| Muamele-sınıfı değiştirme (`erasure_treatment`) | `none` | AI bir alanın sınıfını/muamelesini değiştiremez; `retain_immutable`↔`hard_delete` geçişi insan/hukuk kararı |
| Çatışma kuralı override (K1–K6) | `none` | AI silme-hakkı vs finansal/audit/hold çatışmasında kuralı **değiştiremez**; hold kazanır, finansal iskelet korunur (motor kuralı + insan) |
| Legal hold uygulama/kaldırma | `none` | Hold kararı insan (hukuk); AI kilit koyamaz/çözemez (`k-legal-hold-retention`'a devredilir) |
| Backup crypto-shred / vector-delete tetikleme | `none` | AI anahtar yıkamaz, embedding silemez; yalnız aday önerir, insan onaylar |
| Karar-logu / audit değişimi | `none` | Audit append-only; AI değiştiremez/redakte edemez |

Mutlak sınırlar: AI main branch'e push edemez; app/module düğümü üretemez/güncelleyemez; ruleset override edemez; kanıtsız "bitti" diyemez. En kritik iki sınır: (1) **AI hiçbir veriyi silemez ve hiçbir muamele-sınıfını değiştiremez** — silme/pseudonymize/redaction geri-alınamaz ve yasal sonuç doğurur; yalnız insan onayıyla motor uygular; (2) **AI çatışma kuralını (K1–K6) override edemez** — özellikle "silme hakkı finansal saklamayı yok etsin" veya "hold'u atla" gibi bir yol açamaz. PDP kararı erişimi/muamele-yetkisini belirler; AI PDP kararını override edemez.

## 11. Bağlama (k-legal-hold-retention genişletir; audit append-only; PDP; k-storage; k-provider-adapter)

**`k-legal-hold-retention` bağlama (genişletme):** Bu doküman `k-legal-hold-retention`'ı **genişletir**, tekrar etmez. `k-legal-hold-retention` kilit/imha *mekaniğini* (`hold_lock`, WORM, `retention_policy`, `disposition=delete/anonymize/archive`, `evaluate_retention`, `is_held`, `ErasureBlockedByHoldError`) kurar; bu doküman onun üstüne **veri-sınıfı × muamele karar ekseni** koyar: hangi alanın hangi `disposition`'a (delete↔anonymize↔archive↔redact) gideceğini ve çatışmada hangi kuralın (K1–K6) işleyeceğini beyan eder. `field_treatment_class.retention_ref` doğrudan `retention_policy.id`'yi işaret eder (tek kaynak); erasure yürütmesi `apply_disposition(approval_ref)`'e devredilir. Hold-kazanır kuralı (K2) `k-legal-hold-retention §7`'nin **aynısıdır ve oradan referanslanır**.

**Audit (append-only) bağlama:** Audit `core-contract-pack §2.5`'te append-only'dir (`REVOKE UPDATE, DELETE ON platform_audit_log`). Bu doküman audit'i **silmez/üzerine yazmaz**; audit sınıfı (audit-log satırı §6) yalnız **redaction** (AR — gömülü PII alanı maskelenir, satır ve varsa hash-zinciri korunur) muamelesine izinlidir, `hard_delete`/`soft_delete` **yasaktır**. Her muamele-uygulaması (pseudonymize/delete/redaction/shred) `AuditLogger.log()` ile actor + resource + yasal-dayanak yazılır; muamelenin kendisi bir audit olayıdır. Bitemporal düzeltme audit'in yerine geçmez (K3).

**PDP bağlama (policy-as-data):** Muamele-sınıfı ve çatışma kuralı **kural = veri**dir; "bu aktör bu kaydı silebilir/pseudonymize edebilir/redakte edebilir mi?" yetki kararı PDP'ye sorulur (`k-policy-pdp`). Bu doküman muameleyi *sınıflandırır* ama *yetkiyi* PDP'de bırakır (tek doğruluk kaynağı). Sınıf kararı (hangi muamele izinli?) ≠ yetki kararı (bu aktör yetkili mi?); ikisi ayrı katman.

**`k-storage` bağlama:** `k-storage` binary/medya varlığını saklar ve zaten "fiziksel silmez (soft-delete + arşiv)" der; backup snapshot ve crypto-shredding (K4) `k-storage`'ın object-storage retention işini kullanır. Binary bir kaydın erasure'ı `k-storage`'ın disposition işine ve backup-expiry'ye bağlanır; held binary muameleden muaftır.

**`k-provider-adapter` bağlama:** LLM sağlayıcı zero-retention sözleşmesi (K6) `k-provider-adapter`'ın sağlayıcı-sözleşmesi katmanında yaşar; `llm_exposed=true` alanların sağlayıcıya iletimi zero-retention teyidine bağlıdır. Zero-retention vermeyen sağlayıcıya PII iletimi kaynakta engellenir.

## 12. Test stratejisi

Aşağıdaki testler bu karar sözleşmesinin çatışma-çözüm kurallarını (K1–K6) ve matris hücrelerini (§6) ve `core-contract-pack` DoD'unu karşılar; hepsi test-önce (önce kırmızı) yazılır. Muamele yürütmesi `k-legal-hold-retention` motoruna devredildiği için testler burada **karar doğruluğunu** (hangi sınıf → hangi muamele, çatışmada hangi kural) kanıtlar; motor mekaniğinin kendisi `k-legal-hold-retention §12`'de test edilir.

Bu tablo `privacy-retention-matrix` için zorunlu test senaryolarını ve türlerini tanımlar.

| # | Senaryo | Test türü |
|---|---|---|
| 1 | Matris: her (veri-sınıfı × muamele) hücresi beklenen izinli/koşullu/yasak değerini döndürüyor (kapsam 8×9) | Birim |
| 2 | K1: finansal-işlem erasure'ında kayıt **silinmiyor**, yalnız PII alanları pseudonymize; iskelet (tutar/tarih/vergi-no) değişmez | Entegrasyon |
| 3 | K2: aktif legal hold varken erasure **hiçbir** muamele uygulamıyor, `ErasureBlockedByHoldError`, gerekçe audit'leniyor (k-legal-hold'a devir) | Entegrasyon |
| 4 | K3: bitemporal düzeltme audit izini değiştirmiyor; her iki temporal değişiklik ayrı audit satırı; audit silinmiyor | Entegrasyon |
| 5 | K4: backup erasure crypto-shredding + backup-expiry ile karşılanıyor; restore'da erased kayıt yeniden-uygulanmıyor | Entegrasyon |
| 6 | K5: kaynak PII silinince türev embedding id-bazlı siliniyor / pseudonymize kaynaktan yeniden üretiliyor; türev temizlenmeden silme tamamlanmıyor | Entegrasyon |
| 7 | K6: `llm_exposed` alan zero-retention teyidi olmadan LLM'e iletilmiyor; yerel trace erasure'da redakte/siliniyor | Entegrasyon |
| 8 | Audit muafiyeti: audit-log satırına `hard_delete`/`soft_delete` reddediliyor; yalnız AR (redaction) izinli, zincir korunuyor | Entegrasyon (negatif) |
| 9 | Katman: tenant beyanı platform yasal minimumu gevşetemiyor (`retain_immutable`→`hard_delete` / `hold_overrides` kapatma / süre kısaltma reddi) | Birim |
| 10 | Tenant izolasyonu: A tenant B'nin muamele-sınıfını göremiyor/değiştiremiyor; cross-tenant muamele reddediliyor (≥10 negatif case) | Entegrasyon (negatif) |
| 11 | AI guardrail: AI veri silemiyor/pseudonymize/redakte edemiyor, muamele-sınıfı değiştiremiyor, K1–K6 override edemiyor; yalnız `draft` öneriyor | Entegrasyon |
| 12 | `check-privacy-retention`: muamele-sınıfı beyan edilmemiş PII/finansal alan CI'da build'i kırıyor | CI |

## 13. Acceptance criteria

- Ana matris (§6) sekiz veri sınıfı × dokuz muameleyi kapsıyor; her hücre izinli/koşullu/yasak değerini ve koşulunu taşıyor; motor hücre kararını doğru döndürüyor.
- K1 (silme hakkı ⟂ finansal): finansal-işlem kaydı erasure'da **silinmiyor**; yalnız içerdiği PII pseudonymize; tutar/tarih/vergi-iskeleti yasal saklama süresince değişmez kalıyor.
- K2 (erasure ⟂ hold): aktif legal hold varken hiçbir muamele uygulanmıyor; erasure askıya alınıyor, gerekçe + talep-eden audit'leniyor; kural `k-legal-hold-retention`'a devrediliyor (tekrar tanımlanmıyor).
- K3 (bitemporal ⟂ audit): bitemporal iş-zamanı düzeltmesi audit'in **yerine geçmiyor**; her iki temporal değişiklik ayrı audit satırı; audit izi silinmiyor/redakte edilmiyor (yalnız gömülü PII için AR).
- K4 (silme ⟂ backup): backup erasure crypto-shredding + backup-expiry ile karşılanıyor; immutable snapshot fiziksel silinmiyor; restore'da erased/held kayıt filtreleniyor.
- K5 (silme ⟂ vektör): kaynak silinince/pseudonymize edilince türev embedding siliniyor/yeniden üretiliyor; türev temizlenmeden silme tamamlanmıyor.
- K6 (silme ⟂ LLM): zero-retention sözleşmesi olmadan PII LLM'e iletilmiyor; yerel trace erasure'da redakte/siliniyor.
- Audit-log sınıfı `hard_delete`/`soft_delete`'i reddediyor; yalnız redaction izinli; append-only zincir korunuyor.
- Tenant beyanı platform yasal minimumu gevşetemiyor (en katı yükümlülük kazanıyor); cross-tenant muamele en az 10 negatif case ile reddediliyor.
- AI hiçbir veriyi silemiyor/pseudonymize/redakte edemiyor, muamele-sınıfı değiştiremiyor, K1–K6 override edemiyor; yalnız `draft` öneriyor (test-kanıtlı).
- `check-privacy-retention` CI kapısı sınıfsız PII/finansal alanda build'i kırıyor; `check-core-contract` (tenant guard, resolver koruması, audit çağrısı, indeks) yeşil.

## 14. Anti-patterns

- **Silme hakkının finansal kaydı yok etmesi:** Erasure talebiyle bir faturayı/işlemi fiziksel silmek — YASAK; finansal iskelet korunur, yalnız PII pseudonymize (K1).
- **Audit'i silmek/üzerine yazmak:** Denetim izini erasure gerekçesiyle `DELETE`/`UPDATE` etmek — YASAK; append-only, yalnız gömülü PII için redaction (AR).
- **Hold'u atlamak:** Aktif legal hold'lu kayda erasure/pseudonymize/silme uygulamak — YASAK; hold her muameleyi ezer (K2), `k-legal-hold-retention`'a devredilir.
- **Bitemporal'i audit yerine koymak:** "Geçmişi bitemporal düzelttik, audit'e gerek yok" demek veya bitemporal düzeltmeyle audit'i değiştirmek — YASAK; ikisi ayrı eksen (K3).
- **Backup'ta "sildim" yanılsaması:** Canlı DB'den silip backup snapshot'ta ciphertext/plaintext bırakıp "erasure tamam" demek — YASAK; crypto-shredding veya backup-expiry şart (K4).
- **Vektör türevini unutmak:** Kaynak PII'yi silip embedding'i vektör index'te bırakmak — YASAK; türev silinir/yeniden üretilir, yoksa silme tamamlanmamıştır (K5).
- **LLM'e zero-retention'sız PII:** Kişisel veriyi zero-retention sözleşmesi olmayan sağlayıcıya prompt olarak göndermek — YASAK; kaynakta engellenir (K6).
- **App-özel muamele bayrağı:** Bir ArcheType'ın kendi `is_pii`/`do_not_delete` kolonunu açması — YASAK; `field_treatment_class` beyanı zorunlu, tek sınıf kaynağı.
- **Sınıfsız PII/finansal alan:** Kişisel/finansal bir alanı muamele-sınıfı beyan etmeden bırakmak — YASAK; `check-privacy-retention` build'i kırar (§4 CI kapısı).
- **Tenant'ın yasal minimumu gevşetmesi:** Tenant override'ının `retain_immutable`'ı `hard_delete`'e çevirmesi veya `hold_overrides`'ı kapatması — YASAK; katman yalnız daha katı yönde.
- **Embedding'i maskelemek:** Vektör embedding'e redaction/pseudonymize uygulamaya çalışmak — YASAK; embedding maskelenmez, silinip yeniden üretilir (K5).
- **AI'ın silme/sınıf-değişimi:** AI'ın veri silmesi, pseudonymize/redakte etmesi veya muamele-sınıfını/çatışma kuralını değiştirmesi — YASAK; hepsi `autonomy: none`, insan/hukuk kararı.

## 15. Definition of Done

- §12'deki 12 test senaryosu yeşil (test-önce kanıtı: kırmızı→yeşil geçişi belgeli).
- `core-contract-pack` tenant + audit (append-only) + indeks uyumu sağlandı; `check-core-contract.mjs` yeşil; audit-log sınıfının silme-reddi DB-seviyesinde (`REVOKE DELETE`) kanıtlı.
- Ana matris (§6) 8×9 tam; her "Koşullu" hücre bir K1–K6 kuralına bağlanıyor; matris kararı `k-legal-hold-retention` `disposition`'a doğru eşleniyor (delete/anonymize/archive/redact).
- K1–K6 çatışma-çözüm testleri yeşil; özellikle finansal-iskelet-korunumu (K1), hold-kazanır (K2, k-legal-hold'a devir), bitemporal-audit-ayrımı (K3), backup-crypto-shred (K4), vektör-türev-silme (K5), LLM-zero-retention (K6).
- `check-privacy-retention` CI kapısı önerisi tanımlı ve pilot: sınıfsız PII/finansal alan build'i kırıyor.
- ADR-PRM1 "Kilitli" statüsünde (insan onayı); `privacy-retention-matrix` düğümü WBS'te `k-legal-hold-retention` genişletmesi olarak doğru `dependsOn` (`k-legal-hold-retention`, `k-policy-pdp`) ile mevcut.
- AI-guardrail testi: AI'ın veri silme, pseudonymize/redaction, muamele-sınıfı değiştirme, K1–K6 override denemeleri reddediliyor; yalnız `draft` öneri üretilebiliyor.
- Reconcile kanıtı: `k-legal-hold-retention` (genişletme, çelişmiyor), audit (append-only, silinmiyor) ve PDP (yetki) referansları §11'de net; K2 kuralı `k-legal-hold-retention`'dan referanslanıyor, tekrar tanımlanmıyor.
- Doküman `icerik-kalite-sozlesmesi` biçim kurallarına uyar (aktör-açık, emoji yok, her başlıkta nedir/yapar/yapmaz, her tablodan önce açıklama, mock yok).

## 16. Compliance karşılığı (GDPR / KVKK / VUK / TTK / eIDAS)

Aşağıdaki tablo, bu karar sözleşmesinin gizlilik/saklama/denetim çerçevelerini matris ve çatışma-çözüm öğelerine nasıl eşlediğini gösterir; her satır bir uyum yükümlülüğünü bu dokümanın normatif kararına bağlar. Çerçeveler: GDPR (AB veri koruma, silme/unutulma hakkı Art.17), KVKK (Türkiye kişisel verilerin korunması m.7 silme/yok etme), VUK/TTK (Türkiye vergi/ticaret hukuku saklama zorunluluğu), eIDAS (AB delil/imza saklama).

| Uyum yükümlülüğü | privacy-retention-matrix karşılığı |
|---|---|
| GDPR Art.17 / KVKK m.7: silme/unutulma hakkı | §6 PII satırı (hard/soft delete, pseudonymize); §7 K1 (finansal iskelet korunur), K4–K6 (backup/vektör/LLM yüzeyleri) |
| GDPR Art.17(3)(b/e) / KVKK m.7 istisna: yasal saklama/dava | §7 K2 (aktif hold kazanır, `k-legal-hold-retention`'a devir); §6 legal-hold sütunu |
| VUK 253 / TTK 82: finansal/ticari kayıt saklama zorunluluğu | §6 finansal-işlem satırı (hard_delete YASAK, retain_immutable); §7 K1; §5 `legal_basis` |
| Denetlenebilirlik: kim-ne-yaptı değişmez izi | §6 audit-log satırı (delete/soft-delete YASAK, redaction izinli); §11 audit append-only (`§2.5`); §7 K3 |
| Veri minimizasyonu: türev/kopya kontrolü | §7 K5 (vektör embedding türevi), K6 (LLM trace); §8 zor sorular |
| Bitemporal doğruluk vs denetim ayrımı | §7 K3 (iş-zamanı gerçeği ≠ kim-ne-yaptı izi; biri diğerini ezmez) |
| eIDAS delil/imza saklama (LTV korunumu) | §6 sözleşme-kanıtı satırı (delete YASAK, PII redaction imza/hash korunarak); `k-evidence` bağı |
| Backup/DR gizlilik uyumu (silinen veri yedekte kalmasın) | §7 K4 (backup-expiry + crypto-shredding); §8; `k-storage` bağı |
| AI/LLM veri işleme uyumu (zero-retention) | §7 K6; §8; `k-provider-adapter` zero-retention sözleşmesi |
| Tenant izolasyon + platform yasal minimum (override yalnız katı yönde) | §9 tenant-scoped RLS + platform taban sınıflandırma; §13 katman AC |

## 17. Requirement-ID tablosu

Aşağıdaki tablo, bu sözleşmenin izlenebilir gereksinimlerini kimlik + katman + öncelik (P0–P3) + test türü + kabul + sahip ile listeler. Öncelik: P0 = bloklayıcı invariant, P1 = çekirdek, P2 = önemli, P3 = iyileştirme.

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| PRM-01 | Ana matris (8 veri sınıfı × 9 muamele) her hücre izinli/koşullu/yasak | Compliance/Data | P0 | Unit | Matris hücre kararı doğru döner | governance |
| PRM-02 | `field_treatment_class` beyanı tenant-kapsamlı (data_class/erasure_treatment/legal_basis) | Backend/Data | P0 | Integration | Beyan tenant izolasyonlu tanımlanır | kernel-team |
| PRM-03 | K1: silme hakkı ⟂ finansal → kayıt silinmez, PII pseudonymize, iskelet değişmez | Compliance | P0 | Integration | Finansal iskelet korunur | governance |
| PRM-04 | K2: erasure ⟂ aktif hold → hold kazanır (k-legal-hold'a devir) | Compliance | P0 | Integration | Held kayıtta erasure askıya alınır | governance |
| PRM-05 | K3: bitemporal ⟂ audit → ayrı eksen, audit silinmez | Backend/Compliance | P0 | Integration | Bitemporal düzeltme audit'i değiştirmez | kernel-team |
| PRM-06 | K4: silme ⟂ backup → backup-expiry + crypto-shredding | Backend/Security | P1 | Integration | Backup erasure crypto-shred ile karşılanır | security-team |
| PRM-07 | K5: silme ⟂ vektör → embedding silme + yeniden üretim | Backend | P1 | Integration | Türev embedding temizlenir | kernel-team |
| PRM-08 | K6: silme ⟂ LLM-trace → zero-retention + redaction | Backend/AI-Governance | P1 | Integration | Zero-retention'sız PII LLM'e gitmez | governance |
| PRM-09 | Audit muafiyeti: audit-log silinemez, yalnız redaction | Security | P0 | Integration(neg) | Audit hard/soft delete reddedilir | security-team |
| PRM-10 | Katman: tenant beyanı platform yasal minimumu gevşetemez | Compliance | P0 | Unit | Süre kısaltma/retain→delete/hold kapatma reddi | governance |
| PRM-11 | Tenant-scoped RLS + cross-tenant muamele reddi | Security | P0 | Integration(neg) | ≥10 cross-tenant negatif case reddedilir | security-team |
| PRM-12 | Muamele-sınıfı = policy-as-data; PDP'ye yetki referansı | Backend/API | P1 | Integration | Muamele yetkisi PDP'den | kernel-team |
| PRM-13 | `k-legal-hold-retention` genişletmesi: retention_ref + disposition eşlemesi | Backend/Compliance | P0 | Integration | Matris kararı disposition'a eşlenir | kernel-team |
| PRM-14 | Her muamele-uygulaması audit'e düşer (actor + yasal-dayanak) | Security | P0 | Integration | Pseudonymize/delete/redaction audit'lenir | security-team |
| PRM-15 | AI veri silemez / pseudonymize / redaction (autonomy none) | AI-Governance | P0 | Integration | AI muamele uygulayamaz | governance |
| PRM-16 | AI muamele-sınıfı değiştiremez / K1–K6 override edemez (autonomy none) | AI-Governance | P0 | Integration | AI sınıf/kural değişimi reddedilir | governance |
| PRM-17 | AI yalnız `draft` önerir (sınıflandırma/imha adayı/boşluk) | AI-Governance | P1 | Integration | Draft dışı AI eylemi yok | governance |
| PRM-18 | `check-privacy-retention` CI kapısı: sınıfsız PII/finansal alan build'i kırar | DevOps/Compliance | P1 | CI | Sınıfsız alan reddedilir | governance |
| PRM-19 | `privacy-retention-matrix` WBS düğümü doğru dependsOn (k-legal-hold-retention, k-policy-pdp) | Governance/WBS | P1 | CI(data-quality) | DAG geçerli, dangling yok | pmo |

---

*Kaynak yönerge: Privacy / Audit / Bitemporal / Retention Decision Matrix (GDPR/KVKK/VUK/TTK/eIDAS). Bu doküman `k-legal-hold-retention-directive.md`'nin **karar-matrisi genişletmesidir** (çelişmez; muamele-sınıfı × veri-sınıfı ekseni ekler); K2 (hold kazanır) kuralı oradan referanslanır. Kardeş sözleşmeler: `k-legal-hold-retention-directive.md` (kilit/imha mekaniği), `core-contract-pack.md §2.5` (audit append-only — silinmez), `pdp-policy-contract.md` (muamele = policy-as-data, yetki kararı), `k-storage-dam-directive.md` (backup/binary silme, crypto-shredding), `k-provider-adapter-directive.md` (LLM zero-retention sözleşmesi), `atomik-netlestirme-2026-07-01.md` (EnumType/Duration/PartyRef atomları), `core-contract-pack.md §3.0.1` (AI guardrail). Bu doküman hiçbir kod/şema/JSON dosyasına dokunmaz; yalnız sözleşme metnidir. Çelişki halinde `core-contract-pack.md` (kernel runtime) ve `k-legal-hold-retention` (kilit mekaniği) önceliklidir; bu doküman güncellenir. Sözleşmeyi değiştirme, veri silme, muamele-sınıfı atama ve çatışma-kuralı override yetkisi yalnız insan (hukuk/uyum/veri-yönetişim) onayındadır; AI bu dosyayı doğrudan güncelleyemez ve hiçbir veriyi silemez.*
