# Marketplace / External-Module Security Yönergesi — Pazaryeri / Dış Modül Güvenlik Yaşam Döngüsü

**Tarih:** 2026-07-01
**Durum:** Taslak sözleşme (kilitlenmeyi bekliyor — bkz. §15 DoD, ADR-M1)
**Kaynak/bağlam:** `core-contract-pack.md §3.0.1` (ortak AI-güvenlik invariantı), P1-eleştiri #9 (pazaryeri/dış modül güvenlik yaşam döngüsü — "AI plugin sistemi üretirken güvenlik modeli delikli olmasın"), `capability-entitlement-contract.md` (modül entitlement — hangi yeteneğe hakkı var), `execution-context-envelope-directive.md` (modül action'ı da `ExecutionContext` taşır), `pdp-policy-contract.md` (modül eyleminin izin kararı), `k-storage-dam-directive.md` (kardeş kernel primitifi deseni), `wbs-field-semantics.md` (dependsOn anlamı).
**İlişki:** Bu doküman `capability-entitlement-contract.md`, `execution-context-envelope-directive.md` ve `pdp-policy-contract.md`'nin *dış-kod uzantısıdır*: onlar platformun *kendi* kodu için "hangi yeteneğe hakkı var?", "hangi bağlam taşınır?", "hangi yetki kararı?" sorularını yanıtlar; bu sözleşme aynı invariantları **platforma sonradan giren, güvenilmez üçüncü-taraf kod** (pazaryeri/dış modül) için sabitler. Bir dış modül platformun *ayrıcalık sınırlarını* delerse tüm kernel garantileri (tenant izolasyonu, PDP kararı, capability-gate) anlamsızlaşır; bu yüzden modül **kendi başına bir subject/aktör** gibi ele alınır: imzalanır, izinleri sözleşmelenir, çalışırken sandbox'lanır, güncellemesi karantinaya girer, açtığı tablo RLS'e tabidir. Bu doküman **kod yazmaz**; `k-module-security` kernel primitifinin davranış sözleşmesini normatif tanımlar. Makine-okunur karşılığı (SQLAlchemy 2.0 modeli, Alembic migration, imza doğrulama, sandbox runtime adaptörü) ADR-M1 kilitlendiğinde ajan-draft + insan-onay ile `platform` reposunda üretilir.

---

## 1. Amaç

Bu sözleşme, platforma dışarıdan giren her modülün (pazaryeri eklentisi, üçüncü-taraf entegrasyon, tenant'ın yüklediği özel modül) tam bir güvenlik yaşam döngüsünden geçmesini sabitler. Hedef: 50 uygulamanın ve özellikle AI'ın ürettiği bir "plugin sistemi"nin güvenlik modelinin delikli olmaması; bir dış modülün platforma yüklenmesinden çalışmasına, güncellenmesinden geri alınmasına kadar her adımda *kim onaylar / hangi sözleşme / hangi negatif test* sorularının tek, denetlenebilir cevabı olması. Modül güvenilmez kod olarak ele alınır: imzalanmadan yüklenmez, istediği izin insan onayı olmadan verilmez, keyfi ağ/dosya/process çağıramaz, açtığı tablo tenant-scoped + RLS zorunlu olmadan yaratılamaz, güncellemesi izin farkı onayı ve karantinadan geçmeden yayına alınmaz. Aktör-açık ifade: *ajan* modülle ilgili yalnız *draft* önerir (imza-doğrulama raporu, izin-diff özeti, SBOM analizi, karantina gerekçesi taslağı); *insan* (platform güvenlik yöneticisi / tenant yöneticisi) modülü yüklemeyi, izin vermeyi, karantinayı kaldırmayı **onaylar**; *motor* onaylı kararı deterministik ve geri-alınabilir uygular. **AI modül yükleyemez, izin veremez, karantina kaldıramaz; modül kodu AI'a güvenilmez girdidir** (§10).

## 2. Kapsam

Bu sözleşme şunları kapsar: (1) modül imzalama — imza + yayıncı kimliği doğrulaması, imzasız/geçersiz-imzalı modül fail-closed reddi; (2) SBOM / provenance — bağımlılık şeffaflığı (Software Bill of Materials) ve kaynak-kanıtı; (3) permission diff — güncellemede istenen izin farkının insan onayına sunulması (izin genişlemesi otomatik geçmez); (4) malicious update quarantine — şüpheli güncellemenin otomatik karantinaya alınması ve yayından tutulması; (5) tenant-specific enablement — modülün tenant bazında açılması (bir modül tüm kiracılarda global değil, entitlement ile tenant'a atanır); (6) secret access policy — modülün hangi secret'a eriştiğinin KMS-scoped sözleşmesi; (7) network/file/process limits — sandbox: modülün keyfi ağ/dosya/process çağıramaması; (8) revoke / rollback — izin geri alma + sürüm geri alma; (9) module-created DB table RLS enforcement — modülün açtığı tablonun tenant-scoped + RLS zorunlu olması; (10) exfiltration tests — veri sızdırma negatif testleri. Ek olarak: threat-model-to-test eşlemesi (§13), `check-module-security` CI kapısı önerisi (§12), kardeş sözleşmelerle reconcile (§11), `k-module-security` düğümünün WBS yerleşimi (§6). Backend, frontend, test ve AI-guardrail gereksinimleri ilgili bölümlerde tarif edilir.

## 3. Non-goals

Bu sözleşme şunları **kapsamaz**: (1) Yetki *kararı* — bir modül eyleminin allow/deny kararı PDP'nindir (`k-policy-pdp`); bu sözleşme modülün *hangi izin setini talep ettiğini ve bunun onaylandığını* sabitler, çalışma-anı kararını PDP'ye devreder (§11 reconcile). (2) Yetenek *çözümü* — modülün bir tenant'ta açık olup olmadığı `capability-entitlement`'ın entitlement mekanizmasıyla çözülür; bu sözleşme yalnız modülü bir *entitlement subject'i* olarak bağlar, plan×capability matrisini yeniden icat etmez (§11). (3) Bağlam *taşıma* — modül eylemi de `ExecutionContext` zarfı taşır (`actor_type=service` veya `agent`); zarf üretimi/imzası `execution-context-envelope`'ın işidir; bu sözleşme modülün zarfsız çalışamayacağını sabitler, zarf motorunu yeniden yazmaz (§11). (4) Kimlik doğrulama (authentication) — yayıncı hesabının login'i `k-identity`'nin işidir; bu sözleşme yalnız *yayıncı imzasının* kriptografik doğrulamasını yapar, hesabı doğrulamaz. (5) Sandbox altyapısının *seçimi* — hangi izolasyon teknolojisinin (ayrı process + seccomp, WASM, konteyner, gVisor) kullanılacağı bir altyapı kararıdır (ADR-M1); bu sözleşme sandbox'ın *sözleşmesini* (ağ/dosya/process default-deny) tutar, teknolojiyi dayatmaz. (6) İş mağazası/ödeme akışı — pazaryerinin ticari tarafı (satış, komisyon, fatura) `capability-entitlement`'ın da dışıdır; bu sözleşme yalnız güvenlik yaşam döngüsünü kapsar. (7) Serbest kodla modül yükleme — hiçbir app/AI doğrudan dosya sistemine kod bırakıp `import` edemez; modül yalnız bu primitifin imzalı-onaylı kurulum yolundan girer.

## 4. Tanım (nedir / ne yapar / ne yapmaz)

**Nedir:** `k-module-security`, platforma dışarıdan giren her modülü (pazaryeri eklentisi / üçüncü-taraf entegrasyon / tenant-özel modül) bir *güvenilmez subject* olarak ele alan; onun imzasını, yayıncı kimliğini, bağımlılık envanterini (SBOM), talep ettiği izin setini, tenant-bazlı etkinleştirmesini, secret erişim kapsamını, sandbox sınırlarını, güncelleme farkını ve geri-alma yolunu tek soyutlamada yöneten kernel modül-güvenlik yaşam-döngüsü katmanıdır.

**Ne yapar:** Bir modülü kurulumdan önce imza + yayıncı kimliğiyle doğrular (fail-closed: imza yoksa/geçersizse kurulum reddedilir); SBOM/provenance kaydını çıkarır ve bilinen-zafiyetli bağımlılığı işaretler; modülün talep ettiği izin setini (`module_permission`) insan onayına sunar; güncellemede istenen izinlerin *farkını* (permission diff) hesaplayıp yeni/genişleyen izin için ayrı insan onayı ister; şüpheli güncellemeyi otomatik karantinaya (`status=quarantined`) alır ve yayından tutar; modülü tenant bazında etkinleştirir (entitlement ile, global değil); modülün eriştiği secret'ları KMS-scoped tanımlar ve kapsam-dışı secret erişimini reddeder; modülü sandbox içinde çalıştırır (ağ/dosya/process default-deny, yalnız beyaz-liste); izin geri alma ve sürüm geri alma (revoke/rollback) yollarını deterministik ve geri-alınabilir sağlar; modülün açtığı her DB tablosunun tenant-scoped + RLS taşımasını zorunlu kılar; her modül yaşam-döngüsü olayını (`install/enable/update/quarantine/revoke/rollback`) audit'ler.

**Ne yapmaz:** Yetki *kararı* vermez — bir modül eyleminin allow/deny kararını PDP verir; bu katman yalnız modülün *izin setini ve kimliğini* sabitler, çalışma-anı kararını PDP'ye besler. Modülü *çalıştırırken* ona sınırsız güven vermez — modül kodu daima güvenilmez, sandbox'lı ve zarf-taşıyıcı çalışır. Modülün istediği secret'ı *otomatik* açmaz — secret erişimi KMS-scoped ve onaylıdır. İzin genişlemesini *sessizce* geçirmez — güncellemedeki her yeni izin insan onayı ister (permission diff). Modülün açtığı tabloyu *tenant-sız* bırakmaz — RLS'siz/tenant_id'siz modül tablosu `check-module-security` (§12) ile reddedilir. Karantinayı *AI ile* kaldırmaz — karantina kaldırma yalnız insan onayı (§10). Modülü *fiziksel silmez* — revoke soft-disable + audit; kalıcı kaldırma ayrı onaylı işlemdir. Yayıncı hesabını *doğrulamaz* (o `k-identity`); yalnız yayıncı imzasını kriptografik doğrular.

## 5. Sözleşme şekli (alan yapısı)

Aşağıdaki tablolar `k-module-security` primitifinin veri şeklini yalnızca *alan adı + tip + amaç* olarak tarif eder; dolu örnek/mock değer verilmez (alanlar tip ve amaçla anlatılır). Tipler PostgreSQL/SQLAlchemy 2.0 karşılıklarıdır. Modülün fiziksel paketi (kod artefaktı) veritabanında değil object storage'da/registry'de tutulur (`k-storage` deseni); tablolar yalnız kaydı, imzayı, izin setini ve yaşam-döngüsü durumunu taşır.

Bu tablo `module` çekirdek modül kaydının alanlarını tanımlar; bir modülün kimliği, yayıncısı, sürümü, imzası ve yaşam-döngüsü durumu burada tutulur.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Modülün benzersiz kimliği |
| `key` | Text (unique) | Modül anahtarı (insan-okur, kurulum referansı) |
| `publisher_id` | UUID (indexed, NOT NULL) | Yayıncı kimliği; imza bu yayıncının anahtarıyla doğrulanır (`k-identity` çözer) |
| `version` | Text (semver) | Modül sürümü; permission diff ve rollback bu eksende çalışır |
| `artifact_ref` | Text | Fiziksel paketin registry/object-storage referansı (kod DB'de değil) |
| `signature` | Text | Paketin yayıncı imzası; kurulumdan önce doğrulanır (fail-closed) |
| `signing_key_id` | Text | İmzayı üreten anahtarın kimliği (rotasyon için doğru anahtar seçimi) |
| `checksum` | Text | Paket içerik hash'i (SHA-256); imza + bütünlük çapraz-doğrulaması |
| `sbom_ref` | Text (nullable) | SBOM/provenance kaydına referans (bağımlılık envanteri, §5 `module_dependency`) |
| `status` | Enum(pending_review, approved, enabled, quarantined, revoked) | Modül yaşam döngüsü; enable/karantina/revoke burada izlenir |
| `origin` | Enum(marketplace, third_party, tenant_custom) | Modülün kaynağı; güven-derecesi ve inceleme derinliğini ayırır |
| `approval_ref` | UUID (nullable) | Kurulum/onay veren insan + zaman + gerekçe (AI kuramaz; zorunlu) |
| `created_at` | TIMESTAMPTZ (NOT NULL) | Audit/kayıt zamanı |
| `updated_at` | TIMESTAMPTZ (NOT NULL) | Son durum değişikliği zamanı |

Bu tablo `module_permission` ile modülün talep ettiği izin setini tanımlar; her satır modülün istediği bir yeteneği/eylemi ve onay durumunu taşır (permission diff bu tablo üzerinden hesaplanır).

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | İzin talebinin kimliği |
| `module_id` | UUID (FK → module.id) | Talebin ait olduğu modül |
| `module_version` | Text (semver) | Bu iznin talep edildiği modül sürümü (diff için sürüm-bazlı) |
| `scope_kind` | Enum(capability, action, secret, network, file, process) | İzin türü; hangi eksende yetki isteniyor |
| `scope_value` | Text | İznin somut hedefi (capability anahtarı / action-verb / secret-adı / host / path / komut sınıfı) |
| `state` | Enum(requested, approved, denied) | Onay durumu; `requested` çalışmaya yetmez, `approved` şart |
| `approval_ref` | UUID (nullable) | İzni onaylayan insan (genişleyen izin için zorunlu) |
| `created_at` | TIMESTAMPTZ (NOT NULL) | Talep zamanı |

Bu tablo `module_entitlement` ile modülün hangi tenant'ta açık olduğunu tanımlar; modül global değildir, tenant bazında etkinleştirilir (`capability-entitlement` deseni, §11 reconcile).

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Etkinleştirme kaydının kimliği |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu; modül bu tenant'ta açık |
| `module_id` | UUID (FK → module.id) | Etkinleştirilen modül |
| `enabled_version` | Text (semver) | Tenant'ta yürürlükteki sürüm (rollback bunu geri alır) |
| `state` | Enum(enabled, suspended, revoked) | Tenant-bazlı durum; `suspended` karantina yansıması |
| `approval_ref` | UUID (NOT NULL) | Tenant'ta etkinleştirmeyi onaylayan insan (tenant yöneticisi) |
| `valid_from` | TIMESTAMPTZ (NOT NULL) | Etkinleştirmenin başladığı an |
| `valid_to` | TIMESTAMPTZ (nullable) | Bitiş; NULL = süresiz; süre dolunca modül tenant'ta kapanır |

Bu tablo `module_dependency` ile SBOM/provenance envanterini tanımlar; modülün taşıdığı her bağımlılık şeffaflık için tek tek kaydedilir.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Bağımlılık kaydının kimliği |
| `module_id` | UUID (FK → module.id) | Bağımlılığın ait olduğu modül |
| `component` | Text | Bağımlılık adı (paket/kütüphane) |
| `component_version` | Text | Bağımlılık sürümü (bilinen-zafiyet eşlemesi için) |
| `license` | Text (nullable) | Bağımlılık lisansı (uyumluluk kontrolü) |
| `provenance` | Text (nullable) | Kaynak-kanıtı (repo/build referansı) |
| `advisory_flag` | Enum(none, known_vuln, blocked) | Bilinen-zafiyet işareti; `blocked` kurulumu durdurur |

Bu tablo `module_lifecycle_event` ile modül üzerindeki her güvenlik-olayını append-only kaydeder; install/enable/update/quarantine/revoke/rollback burada izlenir (audit + tamper-evident).

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID/ULID (PK) | Olayın kimliği (zaman-sıralı) |
| `module_id` | UUID (FK → module.id) | Olayın modülü |
| `event_kind` | Enum(install, review, enable, update, permission_change, quarantine, revoke, rollback) | Yaşam-döngüsü olayı tipi |
| `actor_ref` | UUID | Olayı yapan aktör (insan onaycı / motor / ajan-draft kaynağı) |
| `from_version` | Text (nullable) | Değişimden önceki sürüm (update/rollback için) |
| `to_version` | Text (nullable) | Değişimden sonraki sürüm |
| `reason` | Text | İnsan-okur gerekçe (karantina/revoke nedeni) |
| `approval_ref` | UUID (nullable) | Olayı onaylayan insan (AI-kaynaklı olayda zorunlu) |
| `ts` | TIMESTAMPTZ (NOT NULL) | Olay zamanı |
| `prev_hash` | Text | Bir önceki olay kaydının hash'i (zincir) |
| `entry_hash` | Text | Bu kaydın içerik hash'i = `hash(payload + prev_hash)`; tamper-evident |

## 6. WBS yerleşimi

`k-module-security`, kernel/layer0 kümesine (`k-*`) `module`-seviyesi bir düğüm olarak eklenir; `k-capability`, `k-policy-pdp`, `k-exec-context` ile aynı kernel katmanındadır ancak *dış-kod güvenlik uzantısıdır* — o üç primitifin invariantlarını platforma sonradan giren güvenilmez modüle taşır. Altında asıl kod-teslimatı olan en az bir `archetype` düğümü durur. Bağımlılıklar `wbs-field-semantics`'e uyar: `dependsOn` = teknik/yürütme sırası (kritik yol); `related` = yalnız gezinme.

Bu tablo `k-module-security` düğümünün WBS yerleşimini ve bağımlılıklarını tanımlar.

| Düğüm | Seviye | dependsOn | Küme |
|---|---|---|---|
| `k-module-security` | module | `k-tenancy`, `k-capability`, `k-exec-context`, `k-policy-pdp` | kernel/layer0 |

`dependsOn` gerekçesi: `k-module-security` teknik olarak dört primitife bağlıdır — kiracı bağlamı ve RLS için `k-tenancy` (modül tenant-scoped etkinleşir, açtığı tablo RLS taşır), modülün tenant-bazlı etkinleştirmesi entitlement deseni için `k-capability` (modül bir entitlement subject'i), modül eyleminin `ExecutionContext` taşıması için `k-exec-context` (modül action'ı zarfsız çalışamaz), modül eyleminin yetki kararı için `k-policy-pdp` (izin seti PDP'ye girdi). Bunlar hazır olmadan modül güvenli yönetilemez. `related` ile (karar üretmeden) `k-storage` (modül artefaktının depolanma deseni), `k-identity` (yayıncı imzasının hesap-eşlemesi) ve `k-secrets`/KMS (secret erişim kapsamı) düğümlerine bağlanır. İş modülleri ve pazaryeri surface'i kendi `dependsOn`'unda `k-module-security`'yi listeler — yani modül-güvenlik kapısı önce gelir, hiçbir dış modül bu kapıdan geçmeden yüklenemez/çalışamaz.

## 7. Backend gereksinimleri

Aşağıdaki gereksinimler P1-eleştiri #9 permission lifecycle kapsamını bağlar; her biri test-önce (kırmızı→yeşil) yaşam döngüsüne tabidir. Stack: FastAPI + SQLAlchemy 2.0 + Alembic + PostgreSQL.

- **Modül imzalama + yayıncı kimliği doğrulaması:** Kurulumdan önce paket imzası (`signature` + `signing_key_id`) yayıncının anahtarıyla kriptografik doğrulanır; `checksum` paketle çapraz-doğrulanır; imza yoksa/geçersizse/anahtar bilinmiyorsa `ModuleSignatureError` ile fail-closed reddedilir. **Aktör: motor doğrular, insan (güvenlik yöneticisi) kurulumu onaylar; AI hiçbirini yapamaz.** Yayıncı hesabı `k-identity`'ye çözülür (imza ≠ hesap doğrulama).
- **SBOM / provenance çıkarımı:** Kurulumda modülün bağımlılık envanteri (`module_dependency`) çıkarılır ve saklanır; bilinen-zafiyet veritabanıyla eşlenip `advisory_flag` işaretlenir; `blocked` işaretli bileşen kurulumu durdurur (`ModuleDependencyBlockedError`). Provenance (kaynak-kanıtı) kaydedilir; şeffaflık olmadan (SBOM üretilemeyen paket) kurulum insan onayına *ek gerekçe* ile takılır. **Aktör: motor çıkarır/işaretler, insan riskli bağımlılığı onaylar.**
- **Permission diff (güncelleme izin farkı):** Güncelleme geldiğinde yeni sürümün `module_permission` seti mevcut onaylı setle karşılaştırılır; *genişleyen/yeni* her izin (yeni secret, yeni host, yeni action) ayrı insan onayına sunulur; onaysız izin genişlemesi yürürlüğe *girmez* (eski izinle çalışmaya devam veya güncelleme bloklanır). İzin daralması onaysız uygulanabilir. **Aktör: motor diff'i hesaplar + draft sunar, insan genişleyen izni onaylar; AI onaylayamaz.**
- **Malicious update quarantine:** Şüpheli güncelleme (imza uyumsuzluğu, ani izin genişlemesi, bilinen-zafiyet bağımlılık, anomali sinyali) otomatik `status=quarantined` yapılır ve yayından tutulur; karantinadaki sürüm tenant'lara dağıtılmaz (`module_entitlement.state=suspended`). Karantina *kaldırma* yalnız insan onayıyla (`ApprovalRequiredError`); AI karantinayı kaldıramaz (§10). **Aktör: motor karantinaya alır (otomatik, güvenli yön), insan kaldırır.**
- **Tenant-specific enablement:** Modül global açılmaz; `module_entitlement` ile tenant bazında etkinleştirilir (bir tenant'ta açık modül diğerinde otomatik açık değildir). Etkinleştirme `approval_ref` (tenant yöneticisi) zorunlu; `capability-entitlement` deseniyle çözülür (§11). **Aktör: tenant yöneticisi tenant'ta etkinleştirir; AI etkinleştiremez.**
- **Secret access policy (KMS-scoped):** Modülün eriştiği her secret `module_permission` (`scope_kind=secret`) ile açıkça sözleşmelenir ve KMS-scoped verilir (yalnız beyaz-listedeki secret, en-az-ayrıcalık); kapsam-dışı secret erişimi runtime'da reddedilir (`SecretScopeViolationError`) ve audit'lenir. Modül secret'ı okuyabilir ama *dışa yazamaz/sızdıramaz* (§13 exfiltration). **Aktör: motor kapsamı uygular, insan secret erişimini onaylar; AI secret kapsamını genişletemez.**
- **Network / file / process limits (sandbox):** Modül izole bir sandbox'ta çalışır; ağ, dosya ve process erişimi **default-deny** — yalnız `module_permission` ile onaylanmış host/path/komut-sınıfı beyaz-listesi; keyfi outbound ağ, keyfi dosya okuma/yazma, keyfi process/subshell spawn *engellenir* (`SandboxViolationError`) ve audit'lenir. Sandbox teknolojisi altyapı kararıdır (§3); sözleşme yalnız default-deny + beyaz-liste + ihlal-reddi invariantını sabitler. **Aktör: motor sandbox'ı uygular; modül kodu sandbox'ı gevşetemez; AI sandbox sınırını değiştiremez.**
- **Revoke / rollback:** İzin geri alma (`module_permission.state` iptali + `module_entitlement.state=revoked`) ve sürüm geri alma (`enabled_version` önceki sürüme) deterministik ve geri-alınabilir; revoke soft-disable (modül çalışmayı durdurur, kayıt kalır), fiziksel silme ayrı onaylı işlem. Rollback izin setini de eski sürümün onaylı setine geri alır (genişleyen izin geri çekilir). **Aktör: insan revoke/rollback'i onaylar, motor uygular; AI geri alamaz.**
- **Module-created DB table RLS enforcement:** Modülün açtığı her tablo `tenant_id` kolonu + PostgreSQL RLS (`USING (tenant_id = current_setting('app.current_tenant')::uuid)`) taşımak zorundadır; tenancy-sınıfı (`tenant_scoped` — `execution-context-envelope §5, §8.4`) tablo tanımının parçasıdır; RLS'siz/tenant_id'siz/sınıfsız modül tablosu migration/CI aşamasında reddedilir (`check-module-security` §12). Modül `system`/`global` sınıfı tablo *açamaz* (yalnız çekirdek açar). **Aktör: motor zorlar, `check-module-security` bloklar; AI/modül RLS'siz tablo açamaz.**
- **Yaşam-döngüsü audit (tamper-evident):** Her olay (`install/enable/update/permission_change/quarantine/revoke/rollback`) `module_lifecycle_event`'e hash-zinciriyle append-only yazılır (`AuditLogger.log()`, v1 §2.5); append-only DB-seviyesi (UPDATE/DELETE reddi). **Aktör: motor yazar; hiçbir aktör (AI dahil) düzenleyemez/silemez.**
- **Modül action `ExecutionContext` taşır:** Her modül eylemi motor-üretimi `ExecutionContext` zarfı taşır (`actor_type=service` makine-modül veya `agent` AI-tetikli); zarfsız modül eylemi reddedilir (`EnvelopeIncompleteError`); PDP/RLS/capability-gate/audit girdiyi bu zarftan okur (§11). Modül zarf üretemez/değiştiremez (`execution-context-envelope §10` ile aynı sertlik).
- **Hata formatı:** `{code, message, trace_id, details}` (v1 §3.1); `get_logger()` kullanılır, `print()` yasak.

## 8. Frontend gereksinimleri

Aşağıdaki gereksinimler Vite + React + TanStack yığınına ve config-driven surface ilkesine uyar; pazaryeri/modül yönetim ekranını bağlar. YASAK: Next/Supabase/Prisma/Redux/Flowbite/antd/MUI/Chakra/Mantine.

- **Modül kurulum ekranı (onay-önce):** Bir modül kurulmadan önce UI, imza/yayıncı doğrulama sonucunu, talep edilen izin setini (`module_permission`) ve SBOM/bağımlılık özetini insan onaycıya *açıkça* gösterir; onay verilmeden kurulum tetiklenmez. İzin listesi "bu modül şunlara erişmek istiyor" biçiminde net; gizli/örtük izin yok.
- **Permission diff onayı:** Güncelleme geldiğinde UI, *eski vs yeni* izin farkını (yeni/genişleyen izinler vurgulu) gösterir; insan yalnız farkı görüp onaylar; hiçbir yeni izin sessizce uygulanmaz. Diff verisi backend'den gelir (`module_permission` sürüm karşılaştırması), UI hesaplamaz.
- **Karantina görünürlüğü:** Karantinadaki modül UI'da `quarantined` durumu ve gerekçesiyle ayrışır; "karantinayı kaldır" aksiyonu yalnız yetkili insan için ve açık gerekçeyle; AI önerisi (varsa) "draft" rozetiyle ayrı, yürürlükte değil.
- **Tenant-bazlı etkinleştirme:** Tenant yöneticisi modülü kendi tenant'ında etkinleştirir/askıya alır; UI modülün bu tenant'ta açık olup olmadığını runtime endpoint'inden okur, hardcoded modül listesi yazmaz.
- **AI-öneri ayrımı:** AI'ın ürettiği hiçbir modül-güvenlik önerisi (imza-raporu taslağı, izin-diff özeti, karantina gerekçesi) doğrudan uygulanmaz; UI'da "draft/öneri" olarak işaretlenir ve insan onayı beklenir.
- **Erişilebilirlik:** WCAG 2.2 AA taban; dokunmatik hedef ≥ 44x44px; kontrast ≥ 4.5:1.
- **i18n:** İzin açıklamaları, karantina gerekçeleri ve uyarı metinleri `I18nText` üzerinden çok-dilli; ham string gömülmez.

## 9. Multi-tenant / RLS

Her tenant-kapsamlı kayıt (`module_entitlement` ve modülün açtığı her tablo) `tenant_id` taşır ve fail-closed çalışır (bağlam yoksa istek reddedilir, v1 §2.1). İzolasyon iki katmanlıdır: (1) modülün *etkinleştirmesi* tenant-scoped — bir modül bir tenant'ta açık olması diğerinde açık olduğunu göstermez; `module_entitlement` her tenant için ayrı satır. (2) Modülün *açtığı veri* tenant-scoped + RLS zorunlu — modül tablosu `tenant_id` kolonu + RLS bariyeri (`USING (tenant_id = current_setting('app.current_tenant')::uuid)`) taşımadan yaratılamaz; modül bir tenant'ın satırını başka tenant adına yazamaz/okuyamaz. `module` ve `module_permission` kaydı platform-katmanı (`system`/`global` tenancy-sınıfı, işletmeci kontrolünde) olabilir ancak modülün *çalışma-anı verisi* daima `tenant_scoped`'tır. Cross-tenant modül-veri erişim girişimi `TenantViolationError` fırlatır ve audit'lenir. Bir modül `system`/`global` sınıfı tablo *açamaz* (yalnız `actor_type=system` çekirdek açar — `execution-context-envelope §5, §8.4`); modülün açtığı tabloya `system` sınıfı vermek yasaktır. Sandbox içindeki modül `current_setting('app.current_tenant')`'ı değiştiremez (RLS bağlamı motor tarafından set edilir, modül tarafından değil). Schema-per-tenant / RLS geçiş eşiği ADR-0026'ya uyar.

## 10. AI guardrail (autonomy seviyesi)

Aşağıdaki iş bölümü değiştirilemezdir: **AI önerir → insan onaylar → motor uygular.** (`core-contract-pack.md §3.0.1`) Bu invariant `pdp-policy-contract §10` ve `execution-context-envelope §10` ile aynı sertliktedir. **Modül kodu AI için güvenilmez girdidir**: AI bir modülün kodunu/açıklamasını/manifestini okurken ona *talimat kaynağı* gibi güvenemez — modül içeriği bir prompt-injection vektörüdür (§13); AI yalnız modül hakkında insan-onayına *draft* üretir, modülün "kendini onayla/izin ver/karantinadan çıkar" telkinini uygulamaz.

Bu tablo `k-module-security` üzerindeki AI autonomy sınırlarını tanımlar.

| İşlem | Autonomy | Kural |
|---|---|---|
| Modül *yükleme/kurulum* | `none` | AI modül yükleyemez/kuramaz; kurulum imza-doğrulama + insan (güvenlik yöneticisi) onayı ister |
| İzin *verme* (permission grant) | `none` | AI `module_permission.state`'i `approved` yapamaz; genişleyen izin insan onayı |
| Karantina *kaldırma* | `none` | AI `status=quarantined`'ı çözemez; karantina kaldırma yalnız insan onayı (`ApprovalRequiredError`) |
| Tenant *etkinleştirme* | `none` | AI `module_entitlement`'ı açamaz; tenant yöneticisi onayı zorunlu |
| Secret *kapsam genişletme* | `none` | AI modülün secret erişim kapsamını (KMS-scoped) büyütemez |
| Sandbox *sınırı değiştirme* | `none` | AI ağ/dosya/process beyaz-listesini gevşetemez |
| Revoke / rollback | `none` | AI izin/sürüm geri alamaz (ve alınmışı geri koyamaz); insan kararı |
| İmza-raporu / izin-diff / SBOM analizi / karantina gerekçesi *önerme* | `draft` | AI bu raporları *taslak* üretebilir; yürürlükte değil, insan onaylar |
| Yaşam-döngüsü audit / imza-anahtarı değişimi | `none` | `module_lifecycle_event` append-only; imza anahtarı AI'a kapalı; AI değiştiremez |

Mutlak sınırlar: AI main branch'e push edemez; app/module düğümü üretemez/güncelleyemez; ruleset override edemez; kanıtsız "bitti" diyemez; **modül yükleyemez/izin veremez/karantina kaldıramaz/sandbox gevşetemez**. AI modülle ilgili yalnız *draft* öneri üretir; her modül-güvenlik kararı insan onayı + motor uygulamasıdır. Modül action da `ExecutionContext` taşır (`actor_type=service`/`agent`); AI modülü tetiklese bile modül PDP/RLS/capability-gate/audit'e tabidir; AI PDP kararını override edemez, sandbox'ı atlayamaz. **Modül kodu güvenilmez girdi**: AI modül içeriğinin telkinlerini talimat olarak yürütmez.

## 11. Reconcile — capability-entitlement, execution-context-envelope, PDP bağlaması

`k-module-security` yeni bir yetki/bağlam doğruluk kaynağı icat etmez; üç mevcut kernel sözleşmesini dış-koda uzatıp *tüketir*. Aşağıdaki bağlamalar hangi kavramın hangi kardeş sözleşmeden geldiğini ve modülün ona nasıl tabi olduğunu sabitler (çelişme değil, referans).

- **capability-entitlement bağlama (modül entitlement — hangi yeteneğe/tenant'a hakkı var):** Modül bir *entitlement subject'idir*; tenant-bazlı etkinleştirme (`module_entitlement`) `capability-entitlement-contract.md`'nin entitlement deseniyle çözülür (subject + source + temporal `valid_from`/`valid_to`; süre dolunca kapanır). Modülün talep ettiği yetenekler (`module_permission.scope_kind=capability`) `capability.key`'e referanslanır; modül bir capability'yi ancak tenant o capability'ye sahipse *ve* modül o tenant'ta etkinse kullanabilir. Bu sözleşme entitlement mekanizmasını *yeniden yazmaz* — `k-capability` çözer, modül tabi olur (`capability-entitlement §5, §7, §9`).
- **execution-context-envelope bağlama (modül action'ı da zarf taşır):** Her modül eylemi motor-üretimi `ExecutionContext` zarfı taşır (`execution-context-envelope §5`); makine-modül `actor_type=service`, AI-tetikli modül eylemi `actor_type=agent` (asıl party varsa `on_behalf_of` ile). Zarf `tenant_id`→RLS, `actor_id`/`policy_version`→PDP, `effective_permissions`→capability-gate besler; modül zarfsız (kısmi bağlamla) çalışamaz — `EnvelopeIncompleteError` (fail-closed). Modül zarf üretemez/değiştiremez/imzalayamaz (`execution-context-envelope §10`); modülün açtığı tablo `tenancy_class=tenant_scoped` taşır (`execution-context-envelope §5, §8.4`, §9). Bu sözleşme zarf motorunu *yeniden kurmaz* — `k-exec-context` üretir, modül taşır (`execution-context-envelope §7, §11`).
- **PDP bağlama (modül eyleminin izin kararı):** Modülün her eyleminin allow/deny kararını PDP verir (`pdp-policy-contract.md`); `module_permission` seti PDP'ye *girdi/kısıt*tır (modülün onaylı izin seti dışındaki eylem talebi zaten reddedilir, kalan eylemler PDP `evaluate`'e gider). Modül eylemi `decision_log`'a yazılır (hash-zinciri); yetenek yoksa deny (capability-gate), onaylı izin yoksa deny, PDP `deny` ise eylem uygulanmaz. `system` katman policy modül için salt-okunur (modül ayrıcalık sınırını gevşetemez). Bu sözleşme yetki *kararını* vermez — PDP verir; modülün izin seti bu kararın kapsamını daraltan bir ön-kısıttır (`pdp-policy §4, §7, §11`).

Kısa reconcile-özeti (her satır bir kavramı kaynak sözleşmeye ve modülün tabiiyetine bağlar):

| Kavram | Kaynak sözleşme | Modülün tabiiyeti |
|---|---|---|
| Modül tenant-bazlı açılır | `capability-entitlement §5, §7` | `module_entitlement` entitlement subject; tenant-scoped, temporal |
| Modül talep ettiği yetenek | `capability-entitlement §5` | `module_permission.scope_kind=capability` → `capability.key`; tenant sahip değilse yok |
| Modül action bağlamı | `execution-context-envelope §5, §7` | `ExecutionContext` (`actor_type=service`/`agent`); zarfsız çalışamaz |
| Modül tablosu izolasyonu | `execution-context-envelope §5, §8.4` | `tenancy_class=tenant_scoped` + RLS; `system`/`global` yasak |
| Modül eylemi yetki kararı | `pdp-policy §4, §7, §11` | PDP `evaluate` karar verir; izin seti ön-kısıt; `system` policy salt-okunur |

## 12. check-module-security CI kapısı (öneri)

Aşağıdaki statik/otomatik kontrol, `check-core-contract` ailesine eklenmesi önerilen `check-module-security` CI kapısını tarif eder; amaç imzasız/aşırı-izinli/RLS'siz/karantina-atlayan modülü merge ve dağıtım öncesi bloklamaktır. Kapı öneri statüsündedir (ADR-M1 ile kilitlenir) ve `check-envelope` (`execution-context-envelope §12`) ile birlikte çalışır.

Bu tablo `check-module-security` CI kapısının denetlediği invariantları ve ihlal sonucunu tanımlar.

| Kontrol | Denetler | İhlalde |
|---|---|---|
| İmza-zorunluluğu | Kurulan/güncellenen her modül geçerli imza + bilinen `signing_key_id` + `checksum` uyumu taşır | Bloklanır (imzasız/geçersiz modül) |
| SBOM-zorunluluğu | Her modül SBOM/`module_dependency` envanteri taşır; `blocked` bağımlılık yok | Bloklanır (şeffaflıksız / zafiyetli bağımlılık) |
| Permission-diff onayı | Güncellemedeki genişleyen izin onaylı (`module_permission.state=approved`); onaysız genişleme yok | Bloklanır (sessiz izin genişlemesi) |
| Modül-tablo RLS/tenancy | Modülün açtığı her tablo `tenant_id` + RLS + `tenancy_class=tenant_scoped` taşır; `system`/`global` modül tablosu yok | Bloklanır (RLS'siz / yanlış-sınıf modül tablosu) |
| Sandbox-beyaz-liste | Modülün ağ/dosya/process erişimi yalnız onaylı `module_permission` beyaz-listesi; keyfi erişim kodu yok | Bloklanır (sandbox atlaması) |
| Secret-scope | Modülün eriştiği her secret onaylı (`scope_kind=secret`, KMS-scoped); kapsam-dışı secret erişimi yok | Bloklanır (kapsam-dışı secret) |
| Zarf-taşıma | Her modül eylem giriş noktası `ExecutionContext` alır/taşır (header-trust yok) | Bloklanır (bağlamsız modül eylemi) |
| Serbest-import yasağı | Doğrudan dosya-sistemine kod bırakıp `import` eden yol yok; modül yalnız imzalı-onaylı kurulumdan girer | Bloklanır (kurulum-yolu atlaması) |

Kapı `plan-01` D-lint ailesiyle, `check-core-contract.mjs` (tenant guard, resolver koruması, audit çağrısı, indeks) ve `check-envelope` ile birlikte çalışır; `check-module-security` dış-kod güvenlik eksenini ekler.

## 13. Threat-model-to-test — tehdit → negatif test eşlemesi

Aşağıdaki tablo, bu sözleşmenin savunduğu somut tehdit senaryolarını doğrudan negatif teste bağlar; her satır bir saldırı vektörünü, sözleşmedeki savunmayı ve onu kanıtlayan (önce kırmızı) negatif testi listeler. Tüm testler test-önce yazılır ve exfiltration/bypass senaryoları en az 10 negatif case içerir.

Bu tablo kötücül modül tehditlerini savunma-mekanizmasına ve doğrulayan negatif teste eşler.

| Tehdit | Savunma (§) | Negatif test |
|---|---|---|
| Kötücül pazaryeri modülü (imzasız/sahte-yayıncı yükleme) | İmza + yayıncı kimliği doğrulaması, fail-closed (§7) | İmzasız/geçersiz-imzalı/bilinmeyen-anahtar modül kurulumu reddediliyor (`ModuleSignatureError`) |
| Kötücül güncelleme (iyi modülün ele geçmiş yeni sürümü) | Permission diff onayı + malicious update quarantine (§7) | Ani izin genişleten/imza-uyumsuz güncelleme otomatik karantinaya alınıyor; AI kaldıramıyor |
| Secret exfiltration (modül secret'ı okuyup dışa sızdırır) | Secret KMS-scoped + sandbox ağ default-deny (§7, §9) | Kapsam-dışı secret erişimi reddediliyor; okunan secret'ı onaysız outbound host'a yazma engelleniyor (≥10 negatif case) |
| RLS bypass (modül başka tenant'ın verisini okur/yazar) | Modül-tablo RLS zorunlu + cross-tenant reddi + modül `current_setting` değiştiremez (§9) | Modülün cross-tenant object/tablo erişimi `TenantViolationError`; RLS'siz modül tablosu CI'da bloklanıyor (≥10 negatif case) |
| Prompt injection via module (modül kodu/manifesti AI'a talimat enjekte eder) | Modül kodu güvenilmez girdi; AI yalnız draft, uygulamaz (§10) | AI modül içeriğinin "kendini onayla/izin ver/karantinadan çık" telkinini uygulamıyor; yalnız insan-onaylı draft üretiyor |
| Sandbox kaçışı (modül keyfi ağ/dosya/process çağırır) | Network/file/process default-deny + beyaz-liste (§7) | Keyfi outbound ağ / keyfi dosya yazma / process spawn `SandboxViolationError` ile engelleniyor ve audit'leniyor |
| İzin sürünmesi (modül zamanla sessizce izin biriktirir) | Permission diff insan onayı (§7) + revoke (§7) | Onaysız izin genişlemesi yürürlüğe girmiyor; revoke sonrası eski izin çalışmıyor |
| Karantina atlama (şüpheli sürüm tenant'a dağıtılır) | Quarantine → `entitlement.state=suspended`, dağıtım durur (§7) | Karantinadaki sürüm tenant'lara dağıtılmıyor; kaldırma yalnız insan onayıyla |
| Ayrıcalık yükseltme (modül `system`/global tablo veya system-policy'yi değiştirir) | `system`/`global` modül tablosu yasak; system policy salt-okunur (§9, §11) | Modülün `system`/`global` sınıfı tablo açma girişimi reddediliyor; system policy modül için değiştirilemez |
| Bağımlılık zehirleme (modül bilinen-zafiyetli/kötücül bağımlılık taşır) | SBOM + `advisory_flag=blocked` kurulumu durdurur (§7) | `blocked` bağımlılıklı modül kurulumu reddediliyor (`ModuleDependencyBlockedError`) |

## 14. Acceptance criteria

- Her dış modül kurulumdan önce imza + yayıncı kimliğiyle doğrulanıyor; imzasız/geçersiz-imzalı/bilinmeyen-anahtar modül fail-closed reddediliyor; kurulum insan (güvenlik yöneticisi) onayı taşıyor.
- Her modül SBOM/provenance envanteri taşıyor; bilinen-zafiyetli bağımlılık işaretleniyor; `blocked` bağımlılık kurulumu durduruyor.
- Güncellemede istenen izin farkı (permission diff) insan onayına sunuluyor; onaysız izin genişlemesi yürürlüğe girmiyor.
- Şüpheli güncelleme otomatik karantinaya alınıyor ve tenant'lara dağıtılmıyor; karantina kaldırma yalnız insan onayıyla; AI kaldıramıyor.
- Modül global değil, tenant bazında (`module_entitlement`, tenant yöneticisi onayı) etkinleştiriliyor; süre dolunca kapanıyor.
- Modülün eriştiği secret'lar KMS-scoped ve onaylı; kapsam-dışı secret erişimi reddediliyor.
- Modül sandbox'ta çalışıyor; ağ/dosya/process default-deny + beyaz-liste; keyfi erişim engelleniyor ve audit'leniyor.
- İzin geri alma ve sürüm geri alma (revoke/rollback) deterministik, geri-alınabilir; rollback genişleyen izni geri çekiyor.
- Modülün açtığı her tablo `tenant_id` + RLS + `tenancy_class=tenant_scoped` taşıyor; RLS'siz/`system`/`global` modül tablosu reddediliyor.
- Exfiltration ve RLS-bypass negatif testleri (her biri ≥10 case) geçiyor; §13 tehdit-matrisindeki her senaryonun negatif testi yeşil.
- Modül action `ExecutionContext` taşıyor; PDP/RLS/capability-gate/audit'e tabi; modül zarf üretemiyor/değiştiremiyor.
- AI modül yükleyemiyor/izin veremiyor/karantina kaldıramıyor/sandbox gevşetemiyor (`autonomy: none`); yalnız draft öneriyor; modül kodu AI'a talimat kaynağı olamıyor (prompt-injection reddi).
- `check-module-security` (§12) ve `check-envelope` öneri kapıları tanımlı ve yeşil; migration downgrade CI'da geçiyor.

## 15. Definition of Done

- §13'teki tehdit-matrisinin her satırı için negatif test yeşil (test-önce kanıtı: kırmızı→yeşil geçişi belgeli); exfiltration ve RLS-bypass ≥10 case.
- `core-contract-pack` tenant + audit + indeks uyumu sağlandı; `check-core-contract.mjs` yeşil; `check-module-security` (§12) öneri kapısı tanımlı ve yeşil; `check-envelope` ile birlikte çalışıyor.
- İmza + yayıncı doğrulaması, SBOM/provenance, permission diff, malicious-update quarantine, tenant enablement, secret KMS-scope, sandbox default-deny, revoke/rollback, modül-tablo RLS zorunluluğu entegrasyon-kanıtlı çalışıyor.
- Modül reconcile kanıtı: `capability-entitlement` (`module_entitlement` subject), `execution-context-envelope` (modül action zarfı + `tenancy_class`), `pdp-policy` (modül eylemi PDP kararı) entegrasyonu çalışıyor; modül izin seti PDP'ye ön-kısıt.
- Modül yaşam-döngüsü audit (`module_lifecycle_event`) tamper-evident hash-zinciriyle append-only; AI/aktör değiştiremiyor.
- Alembic migration downgrade CI'da çalışıyor.
- ADR-M1 "Kilitli" statüsünde (insan onayı); `k-module-security` düğümü ve altındaki `archetype` düğümü WBS'te doğru `dependsOn` (`k-tenancy`, `k-capability`, `k-exec-context`, `k-policy-pdp`) ile mevcut.
- AI-guardrail testi: AI modül yükleyemiyor/izin veremiyor/karantina kaldıramıyor/sandbox gevşetemiyor; yalnız draft; modül kodu güvenilmez girdi (prompt-injection uygulanmıyor).
- Doküman `icerik-kalite-sozlesmesi` biçim kurallarına uyar (aktör-açık, emoji yok, her başlıkta nedir/yapar/yapmaz, her tablodan önce açıklama, mock yok).

## 16. Anti-patterns

- **İmzasız modül yükleme:** Paketi imza/yayıncı doğrulamadan kurmak — YASAK; imzasız/geçersiz-imzalı modül fail-closed reddedilir.
- **Sessiz izin genişletme:** Güncellemedeki yeni izni insan onayı olmadan uygulamak — YASAK; permission diff + insan onayı zorunlu.
- **Global modül:** Modülü tüm kiracılarda otomatik açmak — YASAK; tenant-bazlı `module_entitlement` + tenant yöneticisi onayı.
- **Sınırsız secret erişimi:** Modüle tüm secret'ları açmak — YASAK; KMS-scoped, en-az-ayrıcalık, onaylı secret.
- **Sandbox'sız çalıştırma:** Modüle keyfi ağ/dosya/process vermek — YASAK; default-deny + beyaz-liste + ihlal-reddi.
- **RLS'siz modül tablosu:** Modülün `tenant_id`/RLS'siz veya `system`/`global` sınıflı tablo açması — YASAK; `tenant_scoped` + RLS zorunlu.
- **Karantinayı AI ile kaldırma:** Şüpheli güncellemeyi otomatik/AI ile yayına almak — YASAK; karantina kaldırma yalnız insan onayı.
- **Modül koduna güven:** Modül manifesti/kodunu AI için talimat kaynağı saymak — YASAK; modül kodu güvenilmez girdi (prompt-injection).
- **Zarfsız modül eylemi:** Modül action'ı `ExecutionContext` olmadan çalıştırmak — YASAK; kısmi bağlam fail-closed reddedilir.
- **Serbest import:** Dosya-sistemine kod bırakıp `import` etmek — YASAK; modül yalnız imzalı-onaylı kurulum yolundan girer.
- **Fiziksel sessiz silme:** Modülü kayıt/audit bırakmadan silmek — YASAK; revoke soft-disable + audit; kalıcı kaldırma ayrı onaylı işlem.
- **AI'ın kurulum/izin/karantina kararı:** AI'ın modül yüklemesi/izin vermesi/karantina kaldırması — YASAK (`autonomy: none`); yalnız draft.

## 17. Requirement-ID tablosu

Aşağıdaki tablo, bu sözleşmenin izlenebilir gereksinimlerini kimlik + katman + öncelik (P0–P3) + test türü + kabul + sahip ile listeler. Öncelik: P0 = bloklayıcı invariant, P1 = çekirdek, P2 = önemli, P3 = iyileştirme.

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| MS-01 | Modül imza + yayıncı kimliği doğrulaması (fail-closed) | Security | P0 | Integration(neg) | İmzasız/geçersiz modül reddedilir | security-team |
| MS-02 | SBOM / provenance envanteri + `blocked` bağımlılık durdurma | Security/Data | P0 | Integration | Zafiyetli bağımlılık işaretlenir/durdurur | security-team |
| MS-03 | Permission diff (güncelleme izin farkı) insan onayı | Security | P0 | Integration | Onaysız izin genişlemesi girmez | security-team |
| MS-04 | Malicious update quarantine (otomatik karantina) | Security | P0 | Integration(neg) | Şüpheli güncelleme dağıtılmaz | security-team |
| MS-05 | Tenant-specific enablement (`module_entitlement`) | Backend/Data | P0 | Integration | Modül tenant-bazlı açılır, süreyle kapanır | kernel-team |
| MS-06 | Secret access policy (KMS-scoped, en-az-ayrıcalık) | Security | P0 | Integration(neg) | Kapsam-dışı secret erişimi reddedilir | security-team |
| MS-07 | Network/file/process sandbox (default-deny + beyaz-liste) | Security/Infra | P0 | Integration(neg) | Keyfi ağ/dosya/process engellenir | security-team |
| MS-08 | Revoke / rollback (izin + sürüm geri alma, geri-alınabilir) | Backend | P1 | Integration | Revoke/rollback deterministik uygulanır | kernel-team |
| MS-09 | Module-created tablo RLS + `tenancy_class=tenant_scoped` zorunlu | Security/Data | P0 | Integration(neg)+CI | RLS'siz/yanlış-sınıf modül tablosu reddedilir | security-team |
| MS-10 | Exfiltration negatif testleri (secret + veri sızdırma) | Security | P0 | Integration(neg) | ≥10 exfiltration case reddedilir | security-team |
| MS-11 | Cross-tenant modül-veri erişimi reddi (RLS bypass) | Security | P0 | Integration(neg) | ≥10 cross-tenant case reddedilir | security-team |
| MS-12 | Modül action `ExecutionContext` taşır (zarfsız reddedilir) | Backend/Integration | P0 | Integration | Modül eylemi zarfla PDP/RLS/audit'e tabi | kernel-team |
| MS-13 | Modül eylemi PDP kararına tabi (izin seti ön-kısıt) | Backend/Integration | P0 | Integration | Onaysız/yeteneksiz modül eylemi deny | kernel-team |
| MS-14 | Modül entitlement `capability-entitlement` deseniyle çözülür | Backend/Integration | P1 | Integration | Modül entitlement subject olarak çözülür | kernel-team |
| MS-15 | Yaşam-döngüsü audit (`module_lifecycle_event`) tamper-evident append-only | Security | P0 | Integration | install/update/quarantine/revoke audit'e düşer | security-team |
| MS-16 | AI modül yükleyemez/izin veremez/karantina kaldıramaz (`autonomy: none`) | AI-Governance | P0 | Integration(neg) | AI modül-güvenlik kararı veremez | governance |
| MS-17 | Modül kodu AI'a güvenilmez girdi (prompt-injection reddi) | AI-Governance | P0 | Integration(neg) | AI modül telkinini uygulamaz, yalnız draft | governance |
| MS-18 | AI modül-güvenlik önerisi yalnız `draft` (imza/diff/SBOM/karantina raporu) | AI-Governance | P1 | Integration | Öneri yürürlükte değil, insan onaylar | governance |
| MS-19 | Modül kurulum + permission-diff onay ekranı config-driven | Frontend | P1 | E2E | İzin/diff UI backend'den türetilir, hardcoded yok | ui-team |
| MS-20 | WCAG 2.2 AA + i18n izin/karantina metinleri | Frontend/A11y | P2 | A11y(axe) | axe critical=0; metinler çok-dilli | ui-team |
| MS-21 | `check-module-security` CI kapısı (imza/SBOM/diff/RLS/sandbox/secret/zarf) | Governance/CI | P1 | CI | İmzasız/aşırı-izinli/RLS'siz modül merge bloklanır | pmo |
| MS-22 | Alembic expand-contract + dolu downgrade | Backend/DevOps | P1 | CI | `alembic downgrade -1` veri kaybetmez | kernel-team |
| MS-23 | `k-module-security` WBS düğümü doğru dependsOn (k-tenancy, k-capability, k-exec-context, k-policy-pdp) | Governance/WBS | P1 | CI(data-quality) | DAG geçerli, dangling yok | pmo |
