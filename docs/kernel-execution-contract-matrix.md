# Kernel Execution Contract Matrix — "AI Bunu Üretti; Doğru/Güvenli/Tenant-Safe/Geri-Alınabilir/Production-Ready Olduğunu Nasıl Anlarım?"

**Tarih:** 2026-07-01
**Durum:** Taslak sözleşme (kilitlenmeyi bekliyor — bkz. §15 DoD, ADR-X1)
**Kaynak/bağlam:** `core-contract-pack.md` §3.0.1 (dört-aktör AI-güvenlik invariantı), §2.5 (audit), §2.6 (Archetype Registry), §2.7 (Workflow Registry), §2.8 (Migration Policy), §3.14 (Consumer-Surface Runtime); `pdp-policy-contract.md` (yetki kararı — PDP/PEP); `scale-invariant-directive.md` (outbox/idempotency/tamper-evident audit — yazma zarfı).
**İlişki:** Bu doküman yeni bir kernel *primitifi tanımlamaz*; mevcut primitifleri (PDP, scale-invariant, audit, archetype, surface) bir **yürütme sözleşmesi matrisi** altında uzlaştırır. Amaç: bir aksiyon/komut — insan eliyle ya da AI-draft'tan doğmuş olsun — **çalışmadan önce** hangi zorunlu alanları taşımak zorunda olduğunu tek tabloda sabitlemek ve "üretildi ama doğru mu?" sorusunu makine-zorlamalı bir kapıya bağlamak. Kritik katkı: bu doküman, mevcut sözleşmelerde dağınık duran tek boşluğu — *generated-CRUD ile typed-action/command arasındaki mutasyon sınırı* — normatif olarak çizer. Bu doküman **kod yazmaz**; yürütme sözleşmesinin davranışını normatif tanımlar. Makine-okunur karşılığı (dekoratör imzası, CI kapısı) ADR-X1 kilitlendiğinde ajan-draft + insan-onay ile `platform` reposunda üretilir.

---

## 1. Amaç

Bu sözleşme, 60+ yaş üç kişilik "vibecoding" ekibinin — kod satırını tek tek denetlemeden — bir aksiyonun/komutun (özellikle bir AI ajanının ürettiği taslaktan doğmuş olanın) beş özelliğini tek bakışta doğrulayabilmesini sabitler: **doğru** (deterministik, test-kanıtlı), **güvenli** (yetki PDP'den geçmiş), **tenant-safe** (kiracı-izolasyonlu, fail-closed), **geri-alınabilir** (rollback/void yolu tanımlı), **production-ready** (audit + kanıt + gate yeşil). Hedef: her mutasyonun tek bir denetlenebilir yoldan (typed action/command) geçmesi; hiçbir üretilmiş CRUD'un PDP/audit/outbox'ı atlayarak doğrudan durum değiştirmemesi. Aktör-açık ifade: *AI* aksiyon/ArcheType taslağı **önerir** (draft); *insan* onaylar; *motor* onaylı işi deterministik ve geri-alınabilir uygular. AI, generated-CRUD ile PDP/audit'i **bypass edemez**.

## 2. Kapsam

Bu sözleşme şunları kapsar: (1) her action/command için zorunlu alanlar matrisi (`actor`, `tenant`, `idempotency`, `audit`, `policy`, `side_effect`, `rollback`) ve hangisinin ne zaman zorunlu olduğu, (2) typed-action/command ile generated-CRUD arasındaki mutasyon sınırı, (3) bir ArcheType üretildiğinde zorunlu olan yürütme invariant'ları (tenant guard, resolver permission, audit call, migration expand-contract, indeks), (4) surface'in yalnız workflow-state + policy sonucunun izin verdiği aksiyonu göstermesi (yetkisiz buton yasağı), (5) yüksek-riskli her aksiyon için negatif-test-vektörü + evidence zorunluluğu, (6) `check-execution-contract` CI kapısı önerisi, (7) AI-draft → insan-onay → motor-apply yürütme hattının call-path kuralı. Mevcut primitiflerin (PDP, scale-invariant, audit) *iç sözleşmeleri* burada tekrar edilmez; referansla bağlanır.

## 3. Non-goals

Bu sözleşme şunları **kapsamaz**: (1) Yetki *kararının* nasıl verildiği (RBAC/ABAC/ReBAC değerlendirmesi) — bu `pdp-policy-contract.md`'nin işidir; bu matris yalnız "her mutasyon PDP'ye sordu mu?"yu zorlar. (2) Outbox/idempotency/hash-chain'in *iç mekaniği* — bu `scale-invariant-directive.md`'nin işidir; bu matris yalnız "yazan aksiyon `scaled_write` taşıyor mu?"yu bağlar. (3) İş mantığı/hesap (fiyat/vergi) — `platform_computation` (`core-contract-pack.md` §3.5) işidir. (4) Yeni bir kernel primitifi icadı — bu doküman mevcut primitifleri *uzlaştırır*, yenisini eklemez. (5) UI bileşen kütüphanesi/tasarım — frontend `core-contract-pack.md` §3.4'e tabidir. (6) Kod üretiminin *kendisi* (generator) — bu matris üretilen çıktının *sözleşme uygunluğunu* tarif eder, üretim mekanizmasını değil.

## 4. Tanım (nedir / ne yapar / ne yapmaz)

**Nedir:** Kernel Execution Contract Matrix, platformdaki her durum-değiştiren yürütme biriminin (typed action / typed command) — kaynağı insan ya da AI-draft olsun — üretim durumunu değiştirmeden önce taşımak zorunda olduğu zorunlu alanların ve geçmek zorunda olduğu kapıların normatif matrisidir. Bir "doğrulama sözleşmesi"dir: primitifleri değil, primitiflerin *birlikte nasıl çağrıldığını* (call-path) sabitler.

**Ne yapar:** Her action/command'ı yedi zorunlu-alan ekseninde (`actor`, `tenant`, `idempotency`, `audit`, `policy`, `side_effect`, `rollback`) sınıflar ve hangi eksenin hangi işlem sınıfında zorunlu olduğunu tabloyla verir (§5); durum-değiştiren her yolu typed action/command'a hapseder ve generated-CRUD'a yalnız read-only projeksiyon izni verir (§6); bir ArcheType üretildiğinde otomatik geçerli olan yürütme invariant'larını listeler (§7); surface'in yalnız policy+workflow-state'in izin verdiği aksiyonu göstermesini zorlar (§8); yüksek-riskli aksiyona negatif-test-vektörü + evidence bağlar (§9); bunların hepsini `check-execution-contract` CI kapısıyla makine-zorlamalı yapar (§10); AI-draft → insan-onay → motor-apply hattını call-path kuralı olarak sabitler (§11).

**Ne yapmaz:** Yetki *kararı vermez* (PDP verir; matris kararı çağırmayı zorlar). Yeni yazma zarfı *icat etmez* (scale-invariant sağlar; matris zarfın varlığını zorlar). Bir mutasyonun serbest kodla yazılmasına *izin veren yol açmaz* (generated-CRUD state değiştiremez). İnsan onayını *atlatacak* bir AI yolu tanımlamaz. Read-only projeksiyonu *yavaşlatmaz* (okuma yolu bu matrisin dışındadır). Mevcut primitiflerin sözleşmesini *tekrar etmez veya gevşetmez* — yalnızca birlikte çağrılışlarını denetler.

## 5. Sözleşme şekli (zorunlu-alan matrisi)

Bu bölüm sözleşmenin çekirdeğidir: her typed action/command'ın taşıdığı yürütme-zarfının (execution envelope) yedi eksenini ve her eksenin *hangi işlem sınıfında* zorunlu olduğunu tanımlar. Zarf, aksiyon çalışmadan önce motor tarafından doğrulanır; eksik zorunlu eksen `ExecutionContractViolationError` üretir ve `check-execution-contract` (§10) merge'i bloklar. Örnek/mock değer verilmez; alanlar tip ve amaçla anlatılır.

İşlem sınıfları (bir aksiyon tam olarak birine düşer):

- **read-only projeksiyon:** durum değiştirmeyen sorgu/görünüm (generated CRUD'un tek izinli biçimi).
- **typed mutation (etiketsiz):** durum değiştiren ama `financial|order|inventory` etiketi taşımayan aksiyon (örn. bir taslağı adlandırma, bir tercihi güncelleme).
- **typed mutation (etiketli):** `financial|order|inventory` etiketli, para/sipariş/stok yazan aksiyon (`scale-invariant-directive.md` §2 kapsamı).
- **typed command (yan-etkili/dış):** platform-dışına ya da fiziksel dünyaya etki eden komut (saha komutu, e-posta gönderimi, geri-çağırma başlatma).

Bu tablo yürütme-zarfının yedi eksenini alan+tip+amaç olarak tanımlar; hangi primitifin bu ekseni sağladığını referansla bağlar.

| Eksen | Tip | Amaç | Sağlayan primitif (referans) |
|---|---|---|---|
| `actor` | object (party-id + kind + `actor_type`) | Aksiyonu kimin/neyin tetiklediği; `user\|system\|agent` ayrımı zorunlu | `platform_actor` (§3.1) + audit `actor_type` (§2.5) |
| `tenant` | UUID (fail-closed) | Kiracı bağlamı; yoksa istek reddedilir | Tenant Context (§2.1) |
| `idempotency` | str \| null (idempotency-key) | Aynı isteğin tekrarını tek etkiye indirger | `platform_scale_invariant` idempotency (§3.7) |
| `audit` | ref (AuditLogger.log çağrısı) | Durum değişikliğinin tamper-evident kaydı | Audit Log (§2.5) + hash-chain (scale-invariant §5.3) |
| `policy` | Decision (allow/deny + reason + matched_policy_id) | Aksiyonun izinli olup olmadığı kararı | PDP `evaluate` (`pdp-policy-contract.md` §7) |
| `side_effect` | enum(`none\|db\|external\|physical`) | Yan-etkinin sınıfı; komut mu mutasyon mu ayrımı | bu matris (call-path beyanı) |
| `rollback` | ref (`downgrade\|void\|compensate\|mode-rollback`) | Geri-alma yolu; kalıcı-yıkım yasağı | Migration (§2.8) / Sequence void (§3.8) / Mode rollback (§3.4) |

Bu tablo yukarıdaki yedi eksenin her işlem sınıfında zorunlu (Z), koşullu (K) ya da uygulanmaz (—) olduğunu belirler. "Koşullu" hücreler bir sonraki paragrafta açıklanır.

| Eksen | read-only projeksiyon | typed mutation (etiketsiz) | typed mutation (etiketli) | typed command (yan-etkili/dış) |
|---|---|---|---|---|
| `actor` | Z | Z | Z | Z |
| `tenant` | Z | Z | Z | Z |
| `idempotency` | — | K | Z | Z |
| `audit` | — | Z | Z | Z |
| `policy` | Z | Z | Z | Z |
| `side_effect` | `none` (sabit) | `db` | `db` | `external\|physical` |
| `rollback` | — | K | Z | Z |

Koşullu (K) hücrelerin kuralı: (1) `idempotency` etiketsiz mutasyonda yalnız istemci-tekrarına açık uçlar (POST-benzeri yeni-kayıt yaratımı) için zorunludur; salt güncelleme (idempotent-by-nature PUT) için opsiyoneldir ama önerilir. (2) `rollback` etiketsiz mutasyonda, kaydı fiziksel silen hiçbir yol olmadığından, soft-delete/geri-yükleme ile karşılanır; kalıcı-yıkım hiçbir sınıfta izinli değildir. (3) `policy` read-only projeksiyonda da zorunludur çünkü PDP kararı bir surface'in veriyi *gösterip göstermeyeceğini* de belirler (`pdp-policy-contract.md` §8); okuma "herkese açık" varsayılamaz — default-deny. (4) Etiketli mutasyonda `idempotency`+`audit`+`rollback` üçü birden zorunludur ve bu, `scale-invariant-directive.md`'nin `scaled_write` zarfıyla **birebir** karşılanır; bu matris o zarfın *varlığını* zorlar, içeriğini yeniden tanımlamaz.

## 6. Typed-Action/Command vs Generated-CRUD Sınırı (KRİTİK)

Bu bölüm sözleşmenin en kritik ayrımıdır ve mevcut dokümanlarda dağınık duran boşluğu kapatır. Kural tek cümleyle: **generated CRUD doğrudan durum DEĞİŞTİREMEZ; her mutasyon bir typed action/command üzerinden PDP + audit + outbox ile geçer; generated CRUD yalnız read-only projeksiyona izinlidir.** Gerekçe: üretilmiş (jenerik/otomatik) CRUD, tanımı gereği yürütme-zarfını (actor/policy/audit/idempotency/rollback) taşımaz; state'i doğrudan değiştirmesine izin vermek, PDP'yi ve scale-invariant'ı tek hamlede baypas etmek demektir. 50 app × jenerik CRUD = 50 kez tekrarlanan baypas yüzeyi.

Aşağıdaki tablo iki yürütme biçimini yetki, denetim ve durum-değişimi açısından ayırır; hangi biçimin neye izinli olduğunu normatif verir.

| Boyut | Generated CRUD | Typed Action / Command |
|---|---|---|
| Durum değiştirebilir mi | Hayır (yalnız read-only projeksiyon) | Evet (tek izinli mutasyon yolu) |
| Yürütme-zarfı (§5) taşır mı | Taşımaz (bu yüzden yazamaz) | Taşır (actor/tenant/policy/audit/…) |
| PDP kararı | Okuma için `evaluate` (görünürlük) | Her çağrıda `evaluate` (mutasyon izni) |
| Audit | Okuma audit'lenmez | Her mutasyon `AuditLogger.log` |
| Outbox/idempotency | Uygulanmaz | Etiketliyse `scaled_write` zarfı |
| Rollback | Uygulanmaz (state değişmez) | `downgrade\|void\|compensate\|mode-rollback` |
| AI erişimi | AI okuyabilir/önerebilir | AI yalnız *draft* önerir; motor uygular |

Bu ayrımın call-path sonucu: bir surface ya da API, veri *okurken* generated projeksiyonu doğrudan çağırabilir; veri *değiştirmek* istediğinde zorunlu olarak bir typed action/command adı çözülür (örn. `order.cancel`, `invoice.issue`), o aksiyon §5 zarfını taşır ve motor onu PDP→audit→(etiketliyse outbox)→uygula sırasında yürütür. Generated CRUD'un `INSERT/UPDATE/DELETE` yolu *tanımlı değildir* — CI (§10) böyle bir yolu tespit ederse merge'i bloklar. Not: "typed" demek, aksiyonun girdisi/çıktısı/etkisi şema-tanımlı ve adlandırılmış olması demektir (serbest gövde değil); bu, `platform_workflow` (§2.7) ve ArcheType typed-action deseniyle (`pdp-policy-contract.md` §11) hizalıdır.

## 7. ArcheType Üretildiğinde Zorunlu Yürütme Invariant'ları

Bir ArcheType (ve onun typed-action'ları) üretildiğinde — insan tarafından ya da AI-draft'tan onaylanarak — aşağıdaki invariant'lar *otomatik ve pazarlıksız* geçerlidir; hiçbiri opt-in değildir. Bunlar `core-contract-pack.md` §5 checklist'i ile hizalıdır; bu matris onları ArcheType-üretim anına bağlar ve tek yerde toplar.

Bu tablo bir ArcheType üretildiğinde zorunlu olan yürütme invariant'larını, onu sağlayan sözleşmeyi ve doğrulama yöntemini listeler.

| # | Invariant | Sağlayan sözleşme (referans) | Doğrulama |
|---|---|---|---|
| 1 | Tenant guard: her model `tenant_id` + fail-closed | Tenant Context (§2.1) | `check-core-contract` tenant taraması |
| 2 | Resolver permission: her GraphQL resolver `permission_classes` (PDP-çağıran) | Identity/AuthZ (§2.2) + PDP (§7) | Strawberry SDL analizi |
| 3 | Audit call: her mutasyon `AuditLogger.log` | Audit Log (§2.5) | statik analiz (§6 core) |
| 4 | Migration expand-contract + dolu `downgrade()` | Migration Policy (§2.8) | `alembic downgrade -1` CI |
| 5 | İndeks: `(tenant_id, created_at DESC)` bileşik indeks | Migration Policy (§2.8) | migration lint |
| 6 | Etiketli mutasyon `scaled_write` (outbox+idempotency+consistency) | Scale-invariant (§3.7) | `check-scale-invariant` |
| 7 | Her typed-action PDP `evaluate` çağırır (serbest izin kodu yok) | PDP (§7, §11) | policy-as-data lint |
| 8 | Kalıcı-yıkım yok: silme = soft-delete/arşiv + geri-yükleme | bu matris §5 `rollback` | statik analiz + review |

Kritik nokta: bu sekiz invariant, ArcheType'ın *üretilmiş olmasından bağımsız* olarak geçerlidir. Bir AI ajanı bir ArcheType taslağı üretse bile, taslak bu invariant'ları taşımıyorsa insan onayına *sunulamaz* (draft geçersiz); onaylanıp motora verilse bile CI kapısı (§10) invariant eksikse merge'i durdurur. Yani üretim hızı, doğruluk zarfını gevşetmez.

## 8. Surface Yalnız İzin Verilen Aksiyonu Gösterir (Yetkisiz Buton Yasağı)

Bu bölüm frontend'in yürütme-sözleşmesindeki payını sabitler. Kural: bir surface (feed, grid, storefront, form; `core-contract-pack.md` §3.14) yalnızca (a) o anki **workflow-state**'in ve (b) **PDP kararının** birlikte izin verdiği aksiyonu/butonu gösterir; yetkisiz ya da geçersiz-durum aksiyonu **hiç render edilmez** (gizli veya disabled). Gerekçe: kullanıcıya basamayacağı bir buton göstermek, hem yanıltır hem de "belki geçer" saldırı yüzeyi açar. Bu, `pdp-policy-contract.md` §8 permission-aware rendering ile birebir aynı ilkedir; bu matris ona workflow-state eksenini ekler.

Bu tablo bir surface aksiyonunun render edilip edilmeyeceğini belirleyen iki koşulu ve sonucu tanımlar.

| PDP kararı | Workflow-state uygun mu | Surface davranışı |
|---|---|---|
| allow | Evet (aksiyon şu adımda geçerli) | Aksiyon/buton gösterilir ve tıklanabilir |
| allow | Hayır (aksiyon bu adımda geçersiz) | Buton gizlenir veya disabled (durum-dışı) |
| deny | (fark etmez) | Buton hiç render edilmez (yetki yok) |
| — (karar yok) | — | Default-deny: render edilmez |

İki katmanlı zorunluluk: (1) surface kararı backend PDP'den `evaluate_batch` ile sayfa açılışında toplu alır (`pdp-policy-contract.md` §8, N+1 yok) ve TanStack Query ile cache'ler; frontend **yetki hesaplamaz**, yalnız yansıtır. (2) Butonun görünmesi *yetmez*: tıklandığında tetiklenen typed action yine motor tarafında PDP'ye yeniden sorulur (PEP her mutasyonu doğrular; client-side yetki anti-pattern). Yani surface bir *kolaylık* katmanıdır, güvenlik sınırı değil; güvenlik sınırı motordaki typed-action + PDP'dir. AI, surface düzeni önerebilir ama yayımlanan surface'in gösterdiği aksiyon kümesini PDP kararının dışına *genişletemez*.

## 9. Yüksek-Riskli Aksiyon → Negatif-Test-Vektörü + Evidence

Bu bölüm "doğru mu?" sorusunun kanıt tarafını sabitler. Kural: yüksek-riskli her aksiyon (para/sipariş/stok yazan; kalıcı-etkili komut; görünürlük/yetki değiştiren) yalnız pozitif testle değil, en az bir **negatif-test-vektörü** ile ve üretilmiş **evidence** (kanıt) ile birlikte teslim edilir. Gerekçe: pozitif test "çalışıyor"u gösterir; negatif test "kötüye kullanılamıyor"u kanıtlar — ve bu ikincisi kurumsal-ağır alanda (para, stok, uyum) asıl güvencedir. Bu, `core-contract-pack.md` §3.5 "negatif test her pozitif test kadar zorunludur; cross-tenant sızıntı ≥10 case" kuralının aksiyon-seviyesine indirgenmiş halidir.

Bu tablo yüksek-riskli aksiyon tiplerini, zorunlu negatif-test-vektörünü ve talep edilen evidence'ı eşler.

| Aksiyon tipi | Zorunlu negatif-test-vektörü | Evidence (kanıt) |
|---|---|---|
| Etiketli mutasyon (`financial\|order\|inventory`) | Çift-tetik → tek etki; cross-tenant yazma reddi (≥10 case) | idempotency testi yeşil + outbox olay sayımı |
| Yetki/görünürlük değiştiren | Yetkisiz aktör deny; katman-override (tenant, system-deny'i gevşetemez) | PDP decision_log + deny gerekçesi |
| Kalıcı-etkili komut (saha/e-posta/geri-çağırma) | `approval_ref`'siz çağrı `ApprovalRequiredError` | audit kaydı (actor_type + approval_ref) |
| Silme/arşiv | Kalıcı-yıkım yolu yok; soft-delete geri-yüklenebilir | downgrade/restore testi yeşil |
| Mode/profil geçişi | Veri-yıkımsız; rollback önceki profile döner | preview/dry-run + rollback testi |

Evidence formatı: her yüksek-riskli aksiyonun testi, geçiş kanıtını (kırmızı→yeşil) ve ilgili primitif çağrısının izini (audit ref / decision_log id / outbox olay id) bir kanıt-paketinde bırakır. `check-execution-contract` (§10), yüksek-riskli olarak işaretlenmiş bir aksiyonda negatif-test-vektörü *veya* evidence eksikse merge'i bloklar. Bu, "AI üretti ama kanıtsız" durumunu — `core-contract-pack.md` §3.0.1 "kanıtsız bitti diyemez" invariantına uygun olarak — merge'den önce yakalar.

## 10. CI Kapısı — `check-execution-contract` Önerisi

Bu bölüm matrisi makine-zorlamalı yapar; §5–§9 kağıt üstünde kalmaz. Önerilen kapı, mevcut iki kapının (`check-core-contract.mjs` §6 core; `check-scale-invariant.mjs` scale-invariant §6) *üstüne* oturan üçüncü bir konformans kapısıdır ve onları tekrar etmez — onların yeşil olduğunu varsayıp yalnız *call-path/zarf bütünlüğünü* denetler. `.github/workflows/deploy.yml` `build` job'ında `node tools/agents/check-execution-contract.mjs` olarak çalışır (bkz. `scale-invariant-directive.md` §6 deseni); sıfırdan farklı çıkış kodu deploy'u durdurur.

Bu tablo `check-execution-contract` kapısının neyi zorladığını ve yeşil koşulunu tanımlar.

| Ne zorlar | Yeşil koşul |
|---|---|
| Generated CRUD state değiştirmiyor (§6) | Jenerik CRUD yolunda `INSERT/UPDATE/DELETE` yok; mutasyon yalnız typed-action üzerinden |
| Her typed mutation yürütme-zarfını taşıyor (§5) | `actor+tenant+policy+audit` eksiksiz; etiketliyse `idempotency+rollback` de mevcut |
| Her typed action PDP `evaluate` çağırıyor (§6, §7) | Serbest izin kodu yok; her mutasyon kararı PDP'den |
| Surface aksiyon kümesi PDP+workflow-state ile sınırlı (§8) | Render edilen aksiyon `evaluate_batch` sonucunun dışına çıkmıyor; yetkisiz buton yok |
| Yüksek-riskli aksiyonda negatif-test + evidence var (§9) | İşaretli aksiyonun negatif-test-vektörü ve kanıt-paketi mevcut |
| AI-draft apply yolu `approval_ref` taşıyor (§11) | `*Draft`→`*Applied` geçişinde onay referansı zorunlu; onaysız apply reddedilir |

Reddetme mesajı örneği: `typed action 'order.cancel' PDP evaluate çağırmadan tanımlanamaz` veya `generated CRUD 'customer' UPDATE yolu tanımlı — mutasyon typed-action'dan geçmeli`. Kapı, `check-core-contract` ve `check-scale-invariant` *geçtikten sonra* çalışır (onların bulgusunu tekrarlamaz); üç kapı birlikte "primitif doğru + zarf doğru + call-path doğru" üçlüsünü tamamlar. Kapı `docs/ci-conformance-gates.md` matrisine üçüncü konformans kapısı olarak işlenir.

## 11. AI Guardrail (AI-Draft → İnsan-Onay → Motor-Apply Call-Path'i)

Aşağıdaki iş bölümü değiştirilemezdir ve `core-contract-pack.md` §3.0.1 dört-aktör invariantının bu matristeki yürütme-hattı karşılığıdır: **AI önerir → insan onaylar → motor uygular.** Bu matris o invariantı bir *call-path kuralına* çevirir: bir aksiyon/ArcheType hangi kaynaktan doğarsa doğsun, üretim durumunu değiştirmeden önce zorunlu bir `approval_ref` (onaylayan insan + zaman + gerekçe) taşır; taşımayan apply `ApprovalRequiredError` fırlatır ve audit'lenir.

Bu tablo yürütme hattındaki aktörlerin ne yapabildiğini ve fail-closed sınırını tanımlar.

| Aktör | Yapabildiği | Yapamadığı (fail-closed) |
|---|---|---|
| AI (öneri motoru) | Action/ArcheType taslağı (`*Draft`) önerir; dry-run/preview üretir; anomali işaretler | Prod state'i doğrudan yazamaz; generated-CRUD ile PDP/audit'i baypas edemez; onay adımını atlayamaz |
| İnsan (yetkili) | Taslağı inceler, düzeltir, **onaylar** (`approval_ref`) veya reddeder | Motoru baypas edip ham yazamaz (yine typed-action'dan geçer) |
| Motor (runtime) | Onaylı typed-action'ı PDP→audit→(outbox)→uygula sırasında deterministik yürütür | İnsan onayı olmadan `*Draft`'ı uygulamaz |
| CI (doğrulama) | Zarf/call-path ihlalini merge'de yakalar (§10) | — |

Mutlak sınırlar (mevcut sözleşmelerle hizalı, tekrar değil pekiştirme): AI main'e push edemez ve app/module düğümü üretemez (`k-storage` §10 ruhu); AI PDP kararını override edemez ve `system` policy'ye dokunamaz (`pdp-policy-contract.md` §10); AI default-on korumayı (outbox/idempotency) baypas eden kod yolu üretemez ve Waiver'ı onaylayamaz (`scale-invariant-directive.md` §8, SCV-8); AI generated-CRUD'u bir mutasyon yoluna *dönüştüremez* (bu matris §6 — yeni ve normatif). Kritik yeni sınır: AI'ın "typed-action yerine generated-CRUD ile doğrudan yaz" yolu **tanımlı değildir**; böyle bir call-path CI'da bloklanır.

## 12. Test Stratejisi

Aşağıdaki testler §5–§11 invariant'larının gerçekten çalıştığını kanıtlar; hepsi test-önce (önce kırmızı) yazılır ve mevcut primitif testlerini *tekrar etmez*, onların *birlikte çağrılışını* doğrular.

Bu tablo Kernel Execution Contract Matrix için zorunlu test senaryolarını ve türlerini tanımlar.

| # | Senaryo | Test türü |
|---|---|---|
| 1 | Generated CRUD ile doğrudan UPDATE denemesi reddediliyor; mutasyon yalnız typed-action'dan geçiyor | Contract |
| 2 | Etiketsiz typed mutation zarfı (actor+tenant+policy+audit) eksikse `ExecutionContractViolationError` | Birim |
| 3 | Etiketli typed mutation `scaled_write` olmadan tanımlanamıyor (scale-invariant'a devreder) | Contract |
| 4 | Her typed-action PDP `evaluate` çağırıyor; çağırmayan CI'da yakalanıyor | Contract |
| 5 | Surface yalnız PDP+workflow-state izinli aksiyonu render ediyor; yetkisiz buton yok | E2E |
| 6 | Yüksek-riskli aksiyon negatif-test-vektörü + evidence olmadan merge edilemiyor | CI |
| 7 | `*Draft`→`*Applied` `approval_ref`'siz `ApprovalRequiredError`; AI onaysız uygulayamıyor | Entegrasyon |
| 8 | Kalıcı-yıkım yolu yok: silme soft-delete + geri-yükleme ile kanıtlanıyor | Entegrasyon |
| 9 | Cross-tenant typed-action reddi (≥10 negatif case), audit'e düşüyor | Entegrasyon (negatif) |

## 13. Acceptance Criteria

- Her durum-değiştiren yol bir typed action/command'dan geçiyor; generated CRUD'un `INSERT/UPDATE/DELETE` yolu tanımlı değil (§6).
- §5 yürütme-zarfı her işlem sınıfı için doğru zorunlulukla uygulanıyor; eksik eksen `ExecutionContractViolationError` üretiyor.
- Etiketli mutasyon `scaled_write` taşıyor; bu matris zarfın *varlığını* zorluyor, scale-invariant içeriği sağlıyor (çelişki yok).
- Her typed-action PDP `evaluate` çağırıyor; serbest izin kodu yok (PDP §11 ile hizalı).
- Bir ArcheType üretildiğinde §7'deki 8 invariant otomatik geçerli; eksikse taslak insan onayına sunulamıyor ve CI merge'i blokluyor.
- Surface yalnız PDP+workflow-state izinli aksiyonu gösteriyor; yetkisiz buton render edilmiyor; her mutasyon motor tarafında yeniden doğrulanıyor.
- Yüksek-riskli her aksiyon negatif-test-vektörü + evidence ile teslim ediliyor; eksikse merge bloklanıyor.
- `check-execution-contract` yazıldı ve `deploy.yml`'a `check-core-contract` + `check-scale-invariant`'tan sonra bloklayıcı adım olarak eklendi.
- AI `*Draft` öneriyor; `approval_ref`'siz apply reddediliyor; AI generated-CRUD ile PDP/audit baypas edemiyor.

## 14. Anti-patterns

- **Generated CRUD ile yazma:** Jenerik/otomatik CRUD üzerinden `INSERT/UPDATE/DELETE` — YASAK; mutasyon yalnız typed action/command'dan (§6).
- **Zarfsız mutasyon:** actor/tenant/policy/audit taşımayan bir durum-değiştiren yol — YASAK; §5 zarfı zorunlu.
- **PDP'siz aksiyon:** typed-action içine serbest izin kodu gömmek — YASAK; her mutasyon PDP `evaluate` çağırır (PDP §15 anti-pattern ile aynı).
- **Yetkisiz buton:** surface'te PDP-deny ya da durum-dışı aksiyonu göstermek — YASAK; §8 default-deny render.
- **Client-side yetki:** butonu gösterip mutasyonu motor tarafında yeniden doğrulamamak — YASAK (PDP §15 ile aynı); surface güvenlik sınırı değildir.
- **Kanıtsız yüksek-risk:** para/yetki/komut aksiyonunu negatif-test-vektörü veya evidence olmadan merge etmek — YASAK; §9.
- **Onaysız apply:** `*Draft`'ı `approval_ref` olmadan uygulamak — YASAK; `ApprovalRequiredError` (§11, core §3.0.1).
- **AI baypas yolu:** AI'ın generated-CRUD'u mutasyona dönüştürerek PDP/audit'i atlaması — YASAK; call-path tanımlı değil (§6, §11).
- **Kalıcı-yıkım:** fiziksel silme yolu açmak — YASAK; soft-delete + geri-yükleme (§5 `rollback`).
- **Kapı tekrarı:** `check-execution-contract`'ın PDP/scale-invariant iç kurallarını yeniden denetlemesi — YASAK; kapı yalnız call-path/zarf bütünlüğünü denetler, primitif kapılarını tekrar etmez.

## 15. Definition of Done

- §12'deki 9 test senaryosu yeşil (test-önce kanıtı: kırmızı→yeşil geçişi belgeli).
- `check-execution-contract` yazıldı, `deploy.yml`'a bloklayıcı adım olarak eklendi (`check-core-contract` + `check-scale-invariant`'tan sonra), `docs/ci-conformance-gates.md` matrisine üçüncü konformans kapısı olarak işlendi.
- §5 yürütme-zarfı ve §6 typed/generated sınırı, mevcut primitiflerle (PDP, scale-invariant, audit, migration) çelişmiyor; her biri referansla bağlı, hiçbiri tekrar edilmedi.
- §7'deki 8 ArcheType-üretim invariantı `core-contract-pack.md` §5 checklist'i ve §3.16 v2 katkı tablosuyla hizalı.
- ADR-X1 "Kilitli" statüsünde (insan onayı); matris `check-core-contract` ve `check-scale-invariant` kapılarının *üstüne* oturuyor, onları geçersizleştirmiyor.
- AI-guardrail testi: AI `*Draft`-dışı doğrudan apply reddediliyor; generated-CRUD ile PDP/audit baypas yolu CI'da bloklanıyor.
- Doküman `icerik-kalite-sozlesmesi` biçim kurallarına uyar (aktör-açık, emoji yok, §4 nedir/yapar/yapmaz, her tablodan önce açıklama, mock yok).

## 16. Mevcut Sözleşmelerle Uzlaşma Haritası

Aşağıdaki tablo, bu matrisin her ekseninin hangi mevcut sözleşmeye dayandığını ve *neyi eklediğini* (tekrar değil) gösterir; amaç çelişki yaratmadan uzlaştırmaktır. Her satır bir mevcut primitife referans verir ve bu matrisin katkısını ayrıştırır.

| Matris ekseni | Dayandığı mevcut sözleşme | Bu matrisin eklediği (yeni katkı) |
|---|---|---|
| `policy` zarfı | `pdp-policy-contract.md` (evaluate, default-deny, PEP) | "her typed mutation PDP'ye sordu mu?"yu call-path'te zorlar |
| `idempotency`+`outbox` | `scale-invariant-directive.md` (`scaled_write`, `write_scope`) | zarfın *varlığını* aksiyon-matrisine bağlar; içeriği tekrar etmez |
| `audit` zarfı | `core-contract-pack.md` §2.5 (append-only + hash-chain) | her typed mutation'da `AuditLogger.log` zorunluluğunu matrise oturtur |
| `actor` (`actor_type`) | §3.1 Actor + §2.5 `user\|system\|agent` | insan/motor/ajan ayrımını yürütme-zarfı ekseni yapar |
| `rollback` | §2.8 Migration + §3.8 Sequence void + §3.4 Mode rollback | kalıcı-yıkım yasağını tüm işlem sınıflarına genelleştirir |
| typed/generated sınırı | (dağınık; §2.6 Archetype, §2.7 Workflow, §3.14 Surface, PDP §11) | **normatif olarak ilk kez çizer:** generated CRUD state değiştiremez |
| surface aksiyon kısıtı | `pdp-policy-contract.md` §8 + `core-contract-pack.md` §3.14 | permission-aware rendering'e *workflow-state* eksenini ekler |
| AI call-path | `core-contract-pack.md` §3.0.1 (draft→onay→apply) | invariantı yürütme *call-path kuralına* çevirir; generated-CRUD baypasını kapatır |

## 17. Requirement-ID Tablosu

Aşağıdaki tablo, bu sözleşmenin izlenebilir gereksinimlerini kimlik + katman + öncelik (P0–P3) + test türü + kabul + sahip ile listeler. Öncelik: P0 = bloklayıcı invariant, P1 = çekirdek, P2 = önemli, P3 = iyileştirme.

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| XC-01 | Generated CRUD state değiştiremez; mutasyon yalnız typed action/command | Backend/Arch | P0 | Contract | Jenerik CRUD `INSERT/UPDATE/DELETE` yolu yok | kernel-team |
| XC-02 | Her typed mutation §5 yürütme-zarfını taşır (actor+tenant+policy+audit) | Backend | P0 | Unit | Eksik zarf `ExecutionContractViolationError` | kernel-team |
| XC-03 | Etiketli mutasyon `scaled_write` taşır (scale-invariant'a devreder) | Backend/Data | P0 | Contract | Etiketli handler zarfsız tanımlanamaz | kernel-team |
| XC-04 | Her typed-action PDP `evaluate` çağırır; serbest izin kodu yok | Backend/Security | P0 | Contract | PDP çağırmayan aksiyon reddedilir | security-team |
| XC-05 | Read-only projeksiyon dahil `policy` (default-deny) zorunlu | Backend/Security | P0 | Contract | Eşleşme yoksa görünürlük deny | security-team |
| XC-06 | ArcheType üretiminde §7'deki 8 invariant otomatik geçerli | Governance/Arch | P0 | CI | Invariant eksik ArcheType merge edilemez | kernel-team |
| XC-07 | Surface yalnız PDP+workflow-state izinli aksiyonu render eder | Frontend/Security | P0 | E2E | Yetkisiz/durum-dışı buton render edilmez | ui-team |
| XC-08 | Butonun görünürlüğü yetmez; mutasyon motorda yeniden doğrulanır | Backend/Security | P0 | Integration | Client-side yetki yok; PEP her mutasyonu doğrular | security-team |
| XC-09 | Yüksek-riskli aksiyon negatif-test-vektörü + evidence ile teslim | QA/Governance | P0 | CI | Negatif-test/evidence eksik aksiyon merge edilemez | governance |
| XC-10 | Kalıcı-yıkım yok: silme = soft-delete/arşiv + geri-yükleme | Backend/Data | P1 | Integration | Fiziksel silme yolu yok; restore çalışır | kernel-team |
| XC-11 | `*Draft`→`*Applied` `approval_ref` zorunlu (AI onaysız uygulayamaz) | AI-Governance | P0 | Integration | approval_ref'siz apply reddedilir | governance |
| XC-12 | AI generated-CRUD ile PDP/audit baypas edemez | AI-Governance | P0 | Contract | Baypas call-path'i tanımlı değil, CI bloklar | governance |
| XC-13 | `check-execution-contract` CI kapısı bloklayıcı ve mevcut kapıların üstünde | DevOps/Governance | P1 | CI | Kapı yeşilse deploy; ihlalde durur | pmo |
| XC-14 | Idempotency: yeni-kayıt yaratan etiketsiz mutasyonda zorunlu | Backend | P1 | Integration | Çift-tetik → tek etki | kernel-team |
| XC-15 | `actor_type` (user\|system\|agent) her mutasyon audit'inde ayrışır | Security | P1 | Integration | Ajan/insan/motor kaydı ayrı izlenir | security-team |
| XC-16 | Kapı primitif kapılarını tekrar etmez; yalnız call-path/zarf denetler | DevOps | P2 | CI | `check-execution-contract` PDP/scale-invariant iç kuralını tekrar etmiyor | pmo |
| XC-17 | Matris mevcut primitiflerle çelişmiyor; her eksen referansla bağlı | Governance/Docs | P1 | Review | §16 uzlaşma haritası eksiksiz | pmo |
