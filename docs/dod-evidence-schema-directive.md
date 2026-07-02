# DoD + Kanıt Şeması Yönergesi — Yüksek-Riskli Düğüm/Sözleşme için Makine-Kontrol Edilebilir Tamamlanma

**Tarih:** 2026-07-02
**Durum:** Taslak sözleşme (kilitlenmeyi bekliyor — bkz. §15 DoD). Eyleme-dönük geliştirici/ajan/denetleyici yönergesi; **kod yazmaz** — bir yüksek-riskli düğümün "bitti" iddiasını nasıl makine-kontrol edilebilir Definition of Done (DoD) + kanıt şemasına bağlayacağını normatif tanımlar.
**Kapsam:** Para yazan, PII taşıyan, tenant-sınırı geçen, AI-mutasyon içeren, imza/kanıt üreten ve migration çalıştıran her düğüm/sözleşme. Bu düğümler için zorunlu DoD alanları, kanıt artefaktları, AI-üretilmiş test sahte-yeşil tespiti ve `check-dod-evidence` CI kapısı.
**Kaynak/bağlam (REFERANS — kopyalama):** `docs/icerik-kalite-sozlesmesi.md` (Definition of Deep — boyut ne zaman yeterli, yasak imza, çapraz-tekrar reddi), `docs/evidence-taxonomy.md` (kanıt taksonomisi — ne kanıt sayılır/sayılmaz, `check-execution-readiness` bağı), `docs/ready-for-dev-gate.md` (Definition of Ready — development kapısı 10/10), `docs/enterprise-dod.md` (18 DoD katmanı + şema-boşluk haritası), `docs/atomik-tip-gelistirici-yonergesi.md` + `docs/atomic-types-directive.md` (13 sözleşme boyutu + `check-atomic-types` deseni — genelleştirilen kaynak), `docs/k-storage-dam-directive.md` (17-bölüm şablon + AI-guardrail deseni), `docs/core-enterprise-maturity-ladder.md` (olgunluk merdiveni).
**İlişki:** Bu doküman `enterprise-dod.md`'nin kardeşidir: o "50+ app fabrikası için ortak 18 DoD katmanı ne içerir?" sorusunu, bu doküman "bir düğüm yüksek-riskliyse hangi DoD alanları ve kanıt artefaktları ZORUNLU olur ve makine bunu nasıl kapıda yakalar?" sorusunu yanıtlar. `atomik-tip-gelistirici-yonergesi.md`'nin de kardeşidir: o "atom seçtiysen 13 sözleşme boyutu beyan et, `check-atomic-types` zorlar" der; bu doküman aynı deseni **yüksek-riskli düğümün DoD+kanıt eksenine genelleştirir**. Makine-okunur karşılığı (`check-dod-evidence.mjs` kapısı, `TaskNode` alan zorlamaları) ADR kilitlendiğinde ajan-draft + insan-onay ile üretilir.

---

## 1. Amaç

Bu sözleşme, platformdaki her yüksek-riskli düğümün "bitti" iddiasını makine-kontrol edilebilir bir Definition of Done + kanıt şemasına sabitler. Hedef: 60+ ekibin ürettiği (insan veya AI) çıktının "çalışıyor gibi ama yanlış" halde üretime sızmaması; bir düğüm para yazıyor, PII taşıyor, tenant sınırı geçiyor, AI-mutasyon içeriyor, imza/kanıt üretiyor veya migration çalıştırıyorsa, "done" demenin insan güven ifadesiyle değil, bağımsız bir denetçinin açıp doğrulayabileceği kanıt artefaktlarıyla mümkün olması. Aktör-açık ifade: *ajan* DoD alan taslağını, negatif-test taslağını ve kanıt-toplama planını **önerir** (draft); *insan* kabul kriterlerini ve kanıtı **doğrular ve onaylar**; *motor/CI* (`check-dod-evidence`) yüksek-riskli düğümde owner + kabul kriteri + negatif-test referansı + kanıt artefaktının **VARLIĞINI** zorlar; hiçbiri eksikse kapı kırmızıdır. AI kendi ürettiği testi "yeşil" ilan **edemez** — kırmızı→yeşil geçişini ve anlamlı assertion'ı insan doğrular.

## 2. Kapsam

Bu sözleşme şunları kapsar: (1) yüksek-riskli düğümün altı-eksenli tanımı (§4), (2) yüksek-riskli düğümün zorunlu DoD alanları — owner, acceptance_criteria[], negative_test_refs[], evidence_artifacts[] (§5), (3) AI-üretilmiş test sahte-yeşil tespit ritüeli — kırmızı-önce zorunluluğu, anlamlı assertion, mutation-check, tautology/no-op reddi (§6), (4) atom'daki 13 sözleşme boyutu + `check-atomic-types` deseninin DoD+kanıt eksenine genelleştirilmesi (§7), (5) `check-dod-evidence` CI kapısı önerisi (§8), (6) 60+ ekip için "reddetme ritüeli" checklist'i — AI çıktısı "çalışıyor gibi ama yanlış" olduğunda (§9), (7) evidence-taxonomy / ready-for-dev-gate / icerik-kalite-sozlesmesi / enterprise-dod ile uzlaşma (§10–§11). AI-guardrail, anti-pattern, DoD, karşılık tabloları ve requirement-ID izlenebilirliği ilgili bölümlerdedir.

## 3. Non-goals

Bu sözleşme şunları **kapsamaz**: (1) Yeni waterfall fazı, yeni kanıt türü veya yeni DoD katmanı tanımlamaz — kanıt türleri `evidence-taxonomy.md §1`'de (URL/dosya-yolu/rapor/log), DoD katmanları `enterprise-dod.md §2`'de yaşar; bu doküman onları yüksek-riskli düğüme **uygular**, çoğaltmaz. (2) Düşük-riskli düğümlerin DoD'unu ağırlaştırmaz — bir metin etiketi düğümü veya salt-okuma listesi bu yönergenin zorunlu alanlarına tabi değildir; N/A disiplini `standards-applicability-matrix.md`'ye uyar (yüksek-risk değilse §5 zorunlulukları uygulanmaz). (3) `check-execution-readiness` / `check-ready-for-dev` / `check-atomic-types` kapılarını değiştirmez veya kaldırmaz — `check-dod-evidence` onların **yanına** eklenir, çakışan kontrol yapmaz (§8, §10). (4) Kanıtın actionplan'a nasıl/ne zaman geri yazılacağını tanımlamaz — bu `evidence-update-runbook.md`'nindir; bu doküman yalnız "hangi kanıt zorunlu ve nasıl makineyle garanti edilir"i tanımlar. (5) Test yazma tekniği veya framework seçimi öğretmez — hangi framework olursa olsun (pytest/Vitest/Playwright) kırmızı-önce + anlamlı-assertion kuralı aynıdır. (6) İmplementasyon kodu, generator veya git eylemi üretmez.

## 4. Tanım (nedir / ne yapar / ne yapmaz)

**Nedir:** Bu yönerge, bir düğüm/sözleşme "yüksek-riskli" olduğunda (para/PII/tenant-cross/AI-mutasyon/imza-kanıt/migration eksenlerinden en az biri) o düğümün DoD'una eklenen zorunlu alan setini, kanıt artefakt şemasını ve AI-üretilmiş testin sahte-yeşil olup olmadığını yakalayan tespit ritüelini tanımlayan sözleşmedir. Bu, `enterprise-dod.md`'nin genel DoD'unun üzerine binen bir **risk-tetiklemeli zorlaştırma katmanıdır**.

**Ne yapar:** Bir düğümü altı riziko-ekseninden geçirir (§4 tablosu); en az bir eksen "evet" ise düğümü "yüksek-riskli" işaretler ve §5'teki dört zorunlu DoD alanını (owner, acceptance_criteria[], negative_test_refs[], evidence_artifacts[]) tetikler. Her yüksek-riskli düğüm için ilgili kanıt artefaktını (test logu, alembic downgrade kanıtı, ≥N cross-tenant negatif case, audit kanıtı, negatif-test kırmızı→yeşil geçiş kaydı) `evidence-taxonomy.md` türlerine bağlar. AI-üretilmiş testin sahte-yeşil olmadığını doğrulayan ritüeli (kırmızı-önce, anlamlı assertion, mutation-check) zorunlu kılar. 13-boyut+kapı desenini genelleştirerek her yüksek-riskli düğümün "sözleşme + kanıt taşıması"nı sabitler. `check-dod-evidence` CI kapısı önerir. 60+ ekip için reddetme checklist'i verir.

**Ne yapmaz:** Düşük-riskli düğüme zorunlu alan **eklemez** (risk-tetiklemeli; §4'ten geçmezse §5 uygulanmaz). AI'ın kendi ürettiği testi "yeşil" saymasına **izin vermez** — yeşil kabulü insan doğrulamasına bağlar (§6, §12). Kanıtı metne kopyalamaya izin **vermez** — kanıt bir işaret (URL/yol/referans) olmalıdır (`evidence-taxonomy.md §1`). Mock/örnek-değerle DoD doldurmaz. Mevcut kapıları çoğaltmaz veya override etmez. Bir düğümü "done" yapma yetkisini AI'a **vermez** — done kapısı insan onayı + `check-execution-readiness` + `check-dod-evidence` yeşiliyle geçilir.

## 5. Zorunlu DoD alanları (yüksek-riskli düğüm)

Önce bir düğümün yüksek-riskli olup olmadığı belirlenir. Aşağıdaki tablo, bir düğümü yüksek-riskli yapan altı riziko-eksenini, tetikleyicisini ve neden ağırlaştırıldığını tanımlar; bir düğüm bu eksenlerden **en az birini** karşılıyorsa yüksek-risklidir ve bu bölümün dört zorunlu alanı devreye girer. Eksenler ortogonaldir; bir düğüm birden çok eksende olabilir (örn. hem para hem tenant-cross).

| Riziko-ekseni | Tetikleyici | Neden ağırlaştırılır |
|---|---|---|
| **Para yazan** | Düğüm parasal değeri yazar/hesaplar/aktarır (`Money` atomu, fatura, ödeme, bakiye, fiyat mutasyonu) | Yanlış toplama/kur-karışımı/yuvarlama sessizce yanlış tutar üretir; empty≠zero ayrımı kaybolursa finansal hata üretime sızar |
| **PII taşıyan** | Düğüm kişisel/kimlik verisi tutar veya işler (NationalId/TaxId/email/GPS/sağlık) | Alan-düzeyi şifreleme/maskeleme türetilemezse KVKK/GDPR ihlali; sızıntı geri-alınamaz |
| **Tenant-cross** | Düğüm birden çok kiracının verisine erişebilir veya tenant sınırı belirler (RLS, imzalı URL kapsamı, cross-tenant sorgu) | Bir tenant'ın diğerinin verisini görmesi = blocker; sınır atlanırsa çok-kiracılı izolasyon çöker |
| **AI-mutasyon** | Bir AI ajanının önerdiği/uyguladığı veri veya yapı mutasyonu içerir (draft→uygula akışı, otomatik etiketleme, öneri) | AI "çalışıyor gibi" ama yanlış çıktı üretebilir; kanıtsız kabul edilirse denetlenemez mutasyon üretime girer |
| **İmza/kanıt üreten** | Düğüm e-imza, hash-zinciri, audit kaydı, kanıt-mühürü veya inkâr-edilemezlik üretir | İmza/kanıt manipüle edilir veya append-only bozulursa yasal/adli değer kaybolur |
| **Migration** | Düğüm şema değişikliği (Alembic upgrade/downgrade), veri taşıma veya geri-alınamaz DDL çalıştırır | Geri-alınamayan migration prod'da felakete döner; `downgrade()` boşsa rollback imkânsız |

Bir düğüm yukarıdaki en az bir eksende "evet" ise aşağıdaki dört alanın **tümü** dolu olmalıdır; tek eksik alan düğümü "done" yapılamaz kılar. Bu alanlar `TaskNode` şemasındaki karşılıklarıyla listelenmiştir (yeni alan uydurulmaz; mevcut `owner`, `acceptanceCriteria[]`, `refs[]`/`notes`, `evidence[]` üzerine oturur).

| Zorunlu alan | TaskNode karşılığı | Kural | Neden |
|---|---|---|---|
| **owner** | `owner` (non-null) | Tek, sorumlu sahip; null olamaz; escalation path `assignees[]`/`notes`'ta | Sahipsiz yüksek-riskli düğüm kanıtsız kalır; kanıtı toplayacak ve doğrulatacak kişi belirli olmalı |
| **acceptance_criteria[]** | `acceptanceCriteria[]` (≥1) | Ölçülebilir, test edilebilir ifade; her kriter en az bir negatif test veya kanıtla eşleşir; belirsiz sıfat yasak (`icerik-kalite-sozlesmesi §1` "somut") | "Çalışıyor" kabul kriteri değildir; "cross-tenant erişim 403 döner" kabul kriteridir |
| **negative_test_refs[]** | `acceptanceCriteria[]` + `refs[]`/`evidence[]` içinde negatif-test dosya yolu | ≥1 negatif test referansı; test-tipi (cross-tenant/kur-karışımı/imza-kırılma/downgrade) belirli; kırmızı-önce kanıtı §6'ya bağlı | Yüksek-riskli düğüm yalnız happy-path'le geçemez; "yanlış olanı reddettiğini" kanıtlamalı |
| **evidence_artifacts[]** | `evidence[]` (≥1, `evidence-taxonomy.md §1` türlerinden) | Aşağıdaki artefakt-tablosundan ilgili tür(ler); her artefakt bir işaret (URL/yol/referans), metin iddiası değil | Kanıtsız "done" reddedilir (`evidence-taxonomy.md §3`; `check-execution-readiness` Done Evidence kuralı) |

Zorunlu alanlar dolduktan sonra, düğümün riziko-eksenine göre hangi kanıt artefaktının zorunlu olduğu netleşir. Aşağıdaki tablo, her riziko-ekseni için `evidence_artifacts[]`'a girilmesi gereken minimum kanıt artefaktını ve `evidence-taxonomy.md §1` türünü eşler; kanıt fazla-yetkili değildir (bir eksenin kanıtı diğerini karşılamaz, `evidence-taxonomy.md §2`).

| Riziko-ekseni | Zorunlu kanıt artefaktı | Kanıt türü (taksonomi §1) |
|---|---|---|
| Para yazan | Kur-karışımı/empty≠zero negatif test logu (reddedildiği görülen çalıştırma); hesap-doğruluk test raporu | Log + Rapor |
| PII taşıyan | Alan-düzeyi maskeleme/şifreleme test logu; PII-sınıf beyanı; GPS/konum strip kanıtı | Log + Dosya yolu |
| Tenant-cross | **≥N cross-tenant negatif case** (N düğüm-özel; storage/PDP için ≥10) her denemenin 403/reddedildiğini gösteren test raporu | Rapor (negatif) |
| AI-mutasyon | AI-draft'ın `approval_ref`'siz reddedildiği test logu; insan-onay kaydı; mutation-check sonucu | Log + Dosya yolu |
| İmza/kanıt üreten | Audit append-only test logu (kayıt sil → audit'te hâlâ görünür); imza-kırılma/tamper reddi kanıtı | Log + Rapor |
| Migration | **Alembic downgrade kanıtı** (`alembic downgrade -1` veri kaybetmeden çalışır) + snapshot; CI çalıştırma logu | Log + Dosya yolu |
| (tüm eksenler, ortak) | **Negatif-test kırmızı→yeşil geçiş kaydı** — testin önce kırmızı, sonra yeşil olduğunu gösteren çalıştırma kaydı (§6) | Log |

Ortak kural: `evidence_artifacts[]`'ın her girişi bağımsız bir denetçinin **açıp doğrulayabileceği** bir işarettir (`evidence-taxonomy.md` altın kuralı); "test geçti, güven" metni geçersizdir. Negatif-test kırmızı→yeşil geçiş kaydı **her** yüksek-riskli düğümde zorunludur, çünkü sahte-yeşil tespitinin (§6) tek makine-okunur kanıtı budur.

## 6. AI-üretilmiş test sahte-yeşil tespit ritüeli (kritik)

Bu bölüm yönergenin en kritik parçasıdır. AI-üretilmiş bir test "yeşil" görünebilir ama hiçbir şey doğrulamıyor olabilir (sahte-yeşil): yanlış olanı reddetmiyor, anlamlı bir şey iddia etmiyor, ya da her koşulda geçiyordur. `evidence-taxonomy.md §3` "Kırmızı/atlanan testi geçti saymak kanıt değildir" der; bu bölüm o kuralı AI-üretilmiş teste özgü altı denetime açar. Aktör: *AI* testi ve implementasyonu **önerir**; *insan* aşağıdaki altı denetimi **doğrular**; AI kendi testini "yeşil" **ilan edemez**.

Aşağıdaki tablo, bir AI-üretilmiş testin geçerli sayılması için tümü sağlanması gereken altı denetimi, neyi yakaladığını ve nasıl kanıtlandığını tanımlar; herhangi biri sağlanmazsa test "sahte-yeşil" sayılır ve kanıt reddedilir.

| # | Denetim | Neyi yakalar | Nasıl kanıtlanır |
|---|---|---|---|
| 1 | **Kırmızı-önce zorunluluğu** | Test hiç kırmızı görülmeden yazıldıysa, doğru olanı doğruladığı belirsizdir | Negatif-test kırmızı→yeşil geçiş kaydı (§5): implementasyon-öncesi çalıştırmada test kırmızı, sonrasında yeşil; kırmızı görülmeden yeşil kabul edilmez |
| 2 | **≥1 anlamlı assertion** | Assertion'sız veya yalnız "çağrı hata atmadı" testi hiçbir davranış iddia etmez | Her testte en az bir davranışsal assertion (beklenen değer/hata/durum); yalnız `assert response is not None` veya boş `try/except` yetmez |
| 3 | **Mutation-check** | İmplementasyon bozulunca test hâlâ yeşil kalıyorsa, testi hiçbir şey korumuyor | İmplementasyona kasıtlı bozma (mutant) sokulduğunda testin kırmızıya döndüğü gösterilir (mutmut/stryker veya elle mutant); yeşil kalan test koruyucu değildir |
| 4 | **Tautology/no-op reddi** | `assert True`, `assert 1==1`, girdi=çıktı eşitleme, mock'un kendi dönüşünü doğrulama her koşulda geçer | Test bir tautoloji veya no-op ise reddedilir; assertion gerçek bir davranışı (hesap/red/sınır) doğrulamalı, kendini değil |
| 5 | **Negatif-case varlığı** | Yalnız happy-path test eden yüksek-riskli düğüm "yanlış olanı reddettiğini" kanıtlamaz | En az bir negatif case: yanlış girdi/yetkisiz erişim/sınır-ihlali reddedilir (`negative_test_refs[]` §5); yüksek-riskli düğümde negatif-case yoksa DoD eksik |
| 6 | **Kanıtsız "bitti" reddi** | AI "test geçti" veya "çalışıyor" der ama açılabilir kanıt yok | `evidence_artifacts[]` boşsa veya yalnız metin iddiası içeriyorsa "done" reddedilir (`evidence-taxonomy.md §3`; `check-execution-readiness` Done Evidence) |

Ritüelin işleyişi (aktör-açık sıra): (1) *AI* negatif testi ve implementasyonu önerir; (2) test **implementasyondan önce çalıştırılır ve kırmızı olduğu görülür** (Denetim 1) — bu kaydedilir; (3) implementasyon eklenir, test yeşile döner — geçiş kaydı `evidence_artifacts[]`'a yazılır; (4) *insan* mutation-check uygular (Denetim 3): implementasyonu kasıtlı bozar, testin kırmızıya döndüğünü doğrular; (5) *insan* assertion'ların anlamlı ve tautoloji-olmadığını denetler (Denetim 2, 4); (6) yalnız altı denetim de geçerse test "yeşil" kabul edilir. AI bu kabul kararını **veremez**; AI'ın rolü öneri ve çalıştırma kaydını sunmaktır, "onaylandı" damgası insanındır.

Kritik hatırlatma (en sık sahte-yeşil üç deseni): (a) **Mock'un kendi dönüşünü doğrulamak** — bir bağımlılık mock'lanıp sonra mock'un döndürdüğü değer assert edilirse test hiçbir gerçek davranışı kontrol etmez; yüksek-riskli düğümde MOCK YOK ilkesi (gerçek DB/test-container) bunu engeller. (b) **Kırmızı görülmeden yazılan test** — "yazdım ve yeşildi" testin doğru olanı doğruladığını göstermez; yanlış assertion da ilk seferde yeşil olabilir. (c) **Downgrade'i test etmeden migration'ı done saymak** — `alembic downgrade -1` çalıştırılmadan migration kanıtı sayılmaz (`evidence-taxonomy.md §3` "downgrade() boş" anti-pattern'i).

## 7. 13-boyut + check-atomic-types deseninin genelleştirilmesi

`atomik-tip-gelistirici-yonergesi.md` ve `atomic-types-directive.md` bir deseni kurar: bir atom seçildiğinde 13 sözleşme boyutu (storage-mapping, validation, parameterization, null/empty/zero, compare/order, index, i18n, serialization, surface-projection, security/PII, equality, computation, versioning) **beyan edilir**, ve `check-atomic-types` beyansız boyutu kırmızı yapar — "sözleşme + makine-kontrolü" birlikte. Bu bölüm o deseni **yüksek-riskli düğümün DoD+kanıt eksenine genelleştirir**: nasıl her atom 13 boyut taşıyorsa, her yüksek-riskli düğüm de bir **DoD-sözleşmesi + kanıt-artefaktı** taşır ve bir CI kapısı bunu zorlar.

Aşağıdaki tablo, atom-katmanındaki deseni yüksek-riskli düğüm katmanına birebir eşler; sol sütun atom sözleşmesindeki mekanizmayı, sağ sütun bu yönergedeki genelleştirilmiş karşılığını verir. Amaç: aynı disiplin (beyan → kanıt → kapı) iki farklı katmanda çalışır.

| Atom katmanı (kaynak desen) | Yüksek-riskli düğüm katmanı (genelleştirme) |
|---|---|
| Atom seçilince 13 sözleşme boyutu beyan edilir | Düğüm yüksek-riskliyse §5'in dört zorunlu DoD alanı beyan edilir |
| Uygulanmayan boyut için `applicability` yazılır, jenerik dolgu yok (`AGENTS.md §2`) | Uygulanmayan riziko-ekseni için "N/A" işaretlenir (`standards-applicability-matrix.md`), sahte-kanıt yok |
| `check-atomic-types` 13 boyut beyanını + registry sürüm-kilidini zorlar | `check-dod-evidence` owner + AC + negatif-test + kanıt varlığını zorlar (§8) |
| Beyansız `FieldType` merge bloklanır | Kanıtsız/negatif-testsiz yüksek-riskli düğüm "done" bloklanır |
| Her ArcheType alanı bir atoma `dependsOn` verir; motor 13 boyutu türetir | Her yüksek-riskli düğüm bir riziko-eksenine bağlanır; kapı ilgili kanıt artefaktını türetir (§5 artefakt tablosu) |
| Kritik boyut (null/empty/zero, security/PII, computation) en sık kaçar | Kritik kanıt (cross-tenant negatif ≥N, downgrade kanıtı, kırmızı→yeşil kaydı) en sık kaçar |
| Test-önce: atom test-vektörü kırmızı→yeşil geçmeden alan ArcheType'a girmez | Test-önce: negatif test kırmızı→yeşil geçmeden düğüm "done" olmaz (§6) |

Genelleştirmenin özü: `check-atomic-types` **13 boyutun VARLIĞINI** makineyle garanti eder; içeriğin doğruluğu insan disiplinidir. `check-dod-evidence` de aynı biçimde **owner + AC + negatif-test + kanıt VARLIĞINI** makineyle garanti eder; kanıtın gerçekten yanlışı reddedip reddetmediği (mutation-check, anlamlı assertion) insan disiplinidir (§6). İki kapı da "varlık" katmanını kapatır, "kalite" katmanını insana bırakır — ama kalite katmanı için de somut ritüel (§6, §9) verir. Böylece atom'daki "her yüksek-riskli tip sözleşme + kanıt taşır" ilkesi tüm yüksek-riskli düğümlere yayılır.

## 8. check-dod-evidence CI kapısı önerisi

Bu bölüm yeni bir CI kapısı önerir; bu kapı `evidence-taxonomy.md §4`'teki `check-execution-readiness` ve `ready-for-dev-gate.md §4`'teki `check-ready-for-dev` kapılarının **yanına** eklenir, onları değiştirmez veya çakışmaz. Kapı, atom katmanındaki `check-atomic-types`'ın DoD+kanıt eksenine genelleştirilmiş halidir (§7).

Kapının davranışı (aktör-açık):

**Girdi:** `src/data/generated/nodes` altındaki düğüm listesi (veya tek `TaskNode` JSON).

**Kontrol kapsamı:** Yalnız **yüksek-riskli** düğümler (§4'ten geçen: para/PII/tenant-cross/AI-mutasyon/imza-kanıt/migration eksenlerinden en az biri). Düşük-riskli düğüm atlanır; uyarı üretilmez (N/A disiplini). Risk-işareti düğümde `tags[]`/`dimensions["security"]` üzerinden veya riziko-ekseni belirteciyle okunur.

Aşağıdaki tablo, kapının yüksek-riskli her düğümde zorunlu kıldığı kontrolleri, yeşil koşulunu ve kırmızı koşulunu tanımlar; her kontrol §5/§6'nın makine-okunur karşılığıdır. Kısmi skor kabul edilmez — bir yüksek-riskli düğüm için tüm kontroller yeşil olmalı.

| # | Kontrol | Yeşil koşul | Kırmızı koşul |
|---|---|---|---|
| 1 | **owner** | `owner` non-null | Boş veya null |
| 2 | **acceptance_criteria** | `acceptanceCriteria[]` ≥1, ölçülebilir | Boş dizi veya belirsiz-sıfat maddesi |
| 3 | **negative_test_refs** | ≥1 negatif-test referansı, riziko-eksenine uygun tip | Yüksek-riskli düğümde negatif test yok |
| 4 | **evidence_artifacts** | `evidence[]` ≥1, riziko-eksenine uygun artefakt (§5 tablosu) | Kanıt yok veya yalnız metin iddiası |
| 5 | **kırmızı→yeşil kaydı** | Negatif-test geçiş kaydı `evidence[]`'ta mevcut | Kırmızı-önce kanıtı yok (§6 Denetim 1) |
| 6 | **done-tutarlılığı** | `status="done"` ise verification `passed` VE 1–5 yeşil | `done` ama kanıt/negatif-test eksik |
| 7 | **cross-tenant N-eşiği** | Tenant-cross ekseninde negatif case sayısı ≥N (storage/PDP ≥10) | N-altı cross-tenant negatif case |
| 8 | **downgrade kanıtı** | Migration ekseninde `alembic downgrade -1` kanıtı mevcut | `downgrade()` boş veya kanıt yok |

**Çıktı formatı:** Her yüksek-riskli düğüm için makine-okunur satır: `[PASS] node-id — yüksek-risk (eksen: tenant-cross) — kanıt tam` veya `[FAIL] node-id — eksik: negative_test_refs, cross-tenant N=4<10`.

**Çıkış kodu:** En az bir FAIL varsa exit 1; CI bunu engel olarak yorumlar; kapıyı geçemeyen commit merge edilemez.

**Mevcut kapılarla ilişki:** `check-ready-for-dev` "geliştirmeye başlanabilir mi?" (development kapısı, 10/10); `check-execution-readiness` "done kapısı geçilebilir mi?" (kanıt + verification varlığı); `check-atomic-types` "atom 13 boyut beyan etti mi?"; `check-dod-evidence` "yüksek-riskli düğüm negatif-test + riziko-eksenine uygun kanıt taşıyor mu?". Dördü ortogonaldir; çakışan kontrol yoktur. `check-dod-evidence`, `check-execution-readiness`'in Done Evidence kuralını yüksek-risk için **derinleştirir** (yalnız "≥1 kanıt" değil, "riziko-eksenine uygun kanıt + negatif-test + kırmızı→yeşil kaydı").

## 9. Reddetme ritüeli — 60+ ekip için "çalışıyor gibi ama yanlış" checklist'i

60+ ekibin ortak sorunu: AI (veya insan) bir çıktı üretir, demo eder, "çalışıyor" der — ama çıktı sessizce yanlıştır (yanlış kur toplar, cross-tenant sızdırır, downgrade edilemez, sahte-yeşil testle geçer). Bu bölüm, bir yüksek-riskli çıktı "done" iddiasıyla geldiğinde denetleyicinin uygulayacağı **reddetme checklist'ini** verir; herhangi bir madde "hayır" ise çıktı reddedilir ve düğüm "done" yapılmaz. Aktör: *denetleyici insan* bu checklist'i uygular; *AI* çıktıyı savunamaz, kanıt sunar; kanıt yetmezse red.

Aşağıdaki tablo, reddetme kararının her kontrol maddesini, "ne aranır" ve "hayırsa sonuç" ile listeler; sıra önemlidir — üstteki maddeler daha ucuz elemelerdir (kanıt var mı?), alttakiler daha derin (kanıt gerçekten yanlışı mı reddediyor?).

| # | Kontrol maddesi | Ne aranır | "Hayır" ise |
|---|---|---|---|
| 1 | Kanıt açılabilir mi? | `evidence[]` girişleri açılıp doğrulanabilir işaret mi (URL/yol), metin iddiası değil mi | Red — "çalışıyor" iddiası kanıt değildir (`evidence-taxonomy.md §3`) |
| 2 | Negatif test var mı? | Yüksek-riskli düğümde `negative_test_refs[]` dolu mu | Red — happy-path tek başına yetmez (§5, §6 Denetim 5) |
| 3 | Kırmızı-önce görüldü mü? | Negatif-test kırmızı→yeşil geçiş kaydı var mı | Red — kırmızı görülmeden yeşil kabul edilmez (§6 Denetim 1) |
| 4 | Assertion anlamlı mı? | Her test ≥1 davranışsal assertion taşıyor mu, tautoloji değil mi | Red — assertion'sız/tautoloji test hiçbir şey doğrulamaz (§6 Denetim 2, 4) |
| 5 | Mock'a mı bakıyor? | Test gerçek davranışı mı yoksa mock'un kendi dönüşünü mü doğruluyor | Red — MOCK YOK; mock'un dönüşünü assert etmek sahte-yeşildir (§6) |
| 6 | Mutation-check geçti mi? | İmplementasyon kasıtlı bozulunca test kırmızıya dönüyor mu | Red — yeşil kalan test koruyucu değildir (§6 Denetim 3) |
| 7 | Riziko-eksenine uygun kanıt mı? | Kanıt düğümün riziko-eksenini karşılıyor mu (cross-tenant için ≥N negatif, migration için downgrade) | Red — fazla-yetkili kanıt yok; her eksen kendi kanıtını ister (§5, `evidence-taxonomy.md §2`) |
| 8 | Owner + AC tam mı? | `owner` non-null, `acceptanceCriteria[]` ölçülebilir mi | Red — sahipsiz/ölçülemez kabul kriteri yüksek-riskte geçmez (§5) |
| 9 | Done-tutarlı mı? | `status="done"` ise verification `passed` ve `check-dod-evidence` yeşil mi | Red — kanıtsız "done" sahte-tamamlanmadır (§8) |

Ritüelin altın kuralı (`icerik-kalite-sozlesmesi` "sayfaya-özel" + `evidence-taxonomy` altın kuralının birleşimi): bir yüksek-riskli çıktı, onu üreten (insan veya AI) olmadan, bağımsız bir denetçi tarafından **açılıp yanlışı reddettiği doğrulanabiliyorsa** "done"dır; aksi halde "çalışıyor gibi görünen" bir iddiadır ve reddedilir. AI çıktısının "işe yarıyor gibi" olması bu checklist'ten geçmesini sağlamaz; yalnız kanıt + negatif-test + kırmızı→yeşil + mutation-check birlikte geçer.

## 10. Uzlaşma — mevcut sözleşmelerle çelişmeme

Bu doküman dört kanonik sözleşmenin türevidir ve hiçbiriyle çelişmez; her biriyle nasıl uzlaştığı aşağıda tanımlanır. Çelişki çıkarsa kaynak sözleşme kazanır ve bu doküman hizalanır.

Aşağıdaki tablo, bu yönergenin her kaynak sözleşmeyle ilişkisini ve hangi maddeyi türetip hangisini genişlettiğini gösterir.

| Kaynak sözleşme | İlişki | Bu doküman ne ekler |
|---|---|---|
| `evidence-taxonomy.md` | Türev; kanıt türü (URL/yol/rapor/log) ve "ne kanıt sayılmaz" oradan alınır | Yüksek-riskli düğüme **riziko-eksenine özel** kanıt artefaktı zorunluluğu (§5) + AI sahte-yeşil ritüeli (§6) |
| `ready-for-dev-gate.md` | Kardeş kapı; o "development'a başlanabilir mi?" (10/10), bu "yüksek-riskli done kanıtı tam mı?" | Ayrı bir kapı (`check-dod-evidence`); ready-for-dev'in owner+AC+evidence-checklist alanlarını yüksek-risk için **negatif-test + kırmızı→yeşil** ile derinleştirir (§8) |
| `icerik-kalite-sozlesmesi.md` | Türev; "somut, sayfaya-özel, yasak-imza yok" ilkesi kabul kriteri kalitesine uygulanır | AC maddelerine "belirsiz sıfat yasak, ölçülebilir" kuralı (§5, §9 madde 8); kanıt için "açılabilir işaret" (§9 madde 1) |
| `enterprise-dod.md` | Kardeş; o 18 DoD katmanını genel tanımlar, bu yüksek-risk için **risk-tetiklemeli zorlaştırma** ekler | Genel DoD üzerine binen risk-katmanı; owner/tenant/audit/migration/rollback katmanlarını yüksek-riskte zorunlu-kanıtla bağlar (§5, §7) |
| `atomik-tip-gelistirici-yonergesi.md` / `atomic-types-directive.md` | Genelleştirilen desen; 13-boyut+`check-atomic-types` deseni DoD+kanıt eksenine taşınır | "Her yüksek-riskli düğüm sözleşme + kanıt taşır" ilkesi + `check-dod-evidence` kapısı (§7, §8) |

Pratik uzlaşma: bir yüksek-riskli düğüm dört kapının tümünden geçer — `check-ready-for-dev` (development'a hazır), `check-atomic-types` (dayandığı atom 13 boyut beyan etti), `check-dod-evidence` (negatif-test + riziko-kanıtı tam), `check-execution-readiness` (done anında kanıt + verification passed). Dördü sıralı ve ortogonaldir; biri diğerini atlatmaz.

## 11. AI guardrail (autonomy seviyesi)

Aşağıdaki iş bölümü değiştirilemezdir: **AI önerir → insan doğrular/onaylar → motor/CI zorlar.** (`core-contract-pack.md §3.0.1`, `k-storage-dam-directive.md §10` deseni). Bu bölüm, DoD ve kanıt üretimine özgü AI sınırlarını tanımlar; en kritik sınır: **AI kendi ürettiği testi "yeşil" ilan edemez; kanıtı insan doğrular.**

Bu tablo, DoD/kanıt üretimi üzerindeki AI autonomy sınırlarını tanımlar.

| İşlem | Autonomy | Kural |
|---|---|---|
| DoD alan taslağı önerme (AC/negatif-test/kanıt planı) | `draft` | AI owner-önerisi, AC taslağı, negatif-test taslağı önerir; insan onaylamadan "kabul kriteri" olmaz |
| Kanıtı "yeşil/geçti" ilan etme | `none` | AI kendi testini yeşil sayamaz; kırmızı→yeşil geçişi ve mutation-check'i **insan doğrular** (§6) |
| Negatif test yazma | `draft` | AI negatif testi yazar/önerir; kırmızı-önce çalıştırma kaydını sunar; "onaylandı" damgası insanındır |
| Düğümü "done" işaretleme | `none` | AI `status="done"` yapamaz; done kapısı insan onayı + `check-dod-evidence` + `check-execution-readiness` yeşiliyle geçilir |
| Riziko-eksen sınıflandırması | `draft` | AI düğümü "yüksek-riskli" önerir (para/PII/…); insan doğrular; AI risk-etiketini tek başına düşüremez |
| `check-dod-evidence` kuralı değiştirme | `none` | Kapı kuralı çekirdek ekip PR'ı; AI eşiği/kontrolü gevşetemez |
| Kanıt artefaktını audit'ten silme | `none` | Kanıt/audit append-only; AI değiştiremez/silemez |

Mutlak sınırlar: AI main branch'e push edemez; DoD/kanıt "onaylandı" kararını veremez; kendi ürettiği testi "yeşil" ilan edemez (kanıtı insan doğrular); kanıtsız "bitti" diyemez; yüksek-risk etiketini tek başına kaldıramaz; `check-dod-evidence` kapısını override edemez. AI'ın rolü: taslak öneri + çalıştırma kaydı (kırmızı→yeşil) sunmak; **kabul ve doğrulama insanındır.**

## 12. Test stratejisi

Aşağıdaki testler bu yönergenin `check-dod-evidence` kapısını ve sahte-yeşil ritüelini (§6) doğrular; hepsi test-önce (önce kırmızı) yazılır — kapının kendisi de sahte-yeşil olamaz.

Bu tablo, `check-dod-evidence` kapısı ve DoD+kanıt disiplini için zorunlu test senaryolarını tanımlar.

| # | Senaryo | Test türü |
|---|---|---|
| 1 | Yüksek-riskli düğümde `owner` boşsa kapı kırmızı | Contract (CI) |
| 2 | Yüksek-riskli düğümde `negative_test_refs[]` boşsa kapı kırmızı | Contract (CI) |
| 3 | Yüksek-riskli düğümde `evidence[]` yalnız metin iddiasıysa kapı kırmızı | Contract (CI) |
| 4 | Tenant-cross ekseninde negatif case N-altıysa (ör. 4<10) kapı kırmızı | Contract (CI) |
| 5 | Migration ekseninde downgrade kanıtı yoksa kapı kırmızı | Contract (CI) |
| 6 | Kırmızı→yeşil geçiş kaydı yoksa kapı kırmızı | Contract (CI) |
| 7 | `status="done"` ama verification `passed` değilse kapı kırmızı | Contract (CI) |
| 8 | Düşük-riskli düğümde kapı hiçbir zorunluluk üretmiyor (N/A) | Contract (CI) |
| 9 | Sahte-yeşil örnek test (assertion'sız/tautoloji) reddediliyor | Birim |
| 10 | Mutation-check: implementasyon bozulunca örnek test kırmızıya dönüyor | Birim |

## 13. Acceptance criteria

- Bir düğüm §4'ten geçiyorsa (para/PII/tenant-cross/AI-mutasyon/imza-kanıt/migration) §5'in dört zorunlu alanı (owner, acceptance_criteria[], negative_test_refs[], evidence_artifacts[]) dolu olmadan "done" yapılamıyor.
- Her yüksek-riskli düğümün `evidence_artifacts[]`'ı riziko-eksenine uygun artefakt taşıyor (§5 tablosu); metin iddiası reddediliyor.
- Negatif-test kırmızı→yeşil geçiş kaydı her yüksek-riskli düğümde mevcut; kırmızı görülmeden yeşil kabul edilmiyor (§6 Denetim 1).
- AI-üretilmiş test altı denetimden (kırmızı-önce, anlamlı assertion, mutation-check, tautoloji-red, negatif-case, kanıtsız-bitti-red) geçmeden "yeşil" sayılmıyor (§6).
- Tenant-cross ekseninde ≥N cross-tenant negatif case (storage/PDP ≥10); migration ekseninde `alembic downgrade -1` kanıtı zorunlu (§5).
- `check-dod-evidence` yalnız yüksek-riskli düğümleri değerlendiriyor; düşük-riskli düğüm atlanıyor (N/A); eksik alanda exit 1 veriyor (§8).
- AI DoD/kanıt "onaylandı" kararı veremiyor; kendi testini "yeşil" ilan edemiyor; done işaretleyemiyor (§11).
- Doküman `evidence-taxonomy` / `ready-for-dev-gate` / `icerik-kalite-sozlesmesi` / `enterprise-dod` ile çelişmiyor; her birine referans veriyor (§10).

## 14. Anti-patterns

- **Kanıtsız "done":** `status="done"` ama `evidence[]` boş veya yalnız "çalışıyor" metni — YASAK; `check-dod-evidence`/`check-execution-readiness` kırmızı yapar.
- **Kırmızı görülmeden yeşil:** Negatif testi hiç kırmızı görmeden yazıp "yeşil" saymak — YASAK; kırmızı→yeşil geçiş kaydı zorunlu (§6).
- **Assertion'sız/tautoloji test:** `assert True`, boş `try/except`, girdi=çıktı eşitleme — YASAK; sahte-yeşildir (§6 Denetim 2, 4).
- **Mock'un dönüşünü doğrulama:** Bağımlılığı mock'layıp mock'un döndürdüğü değeri assert etmek — YASAK; MOCK YOK, gerçek DB/test-container.
- **Happy-path-only yüksek-risk:** Yüksek-riskli düğümü yalnız mutlu-yol testiyle geçirmek — YASAK; negatif test zorunlu (§5, §6 Denetim 5).
- **Downgrade'siz migration:** `alembic downgrade -1` test edilmeden migration'ı done saymak — YASAK; downgrade kanıtı zorunlu (§5).
- **N-altı cross-tenant:** Tenant-cross ekseninde eşik-altı negatif case (ör. 2 case) — YASAK; ≥N (storage/PDP ≥10).
- **Fazla-yetkili kanıt:** Bir eksenin kanıtını diğerine saymak (development yeşil CI'sini a11y/tenant kanıtı sanmak) — YASAK; her eksen kendi kanıtını ister (`evidence-taxonomy §2`).
- **AI'ın kendi testini onaylaması:** AI "test geçti, done" demesi — YASAK; kabul/doğrulama insanındır (§11).
- **Düşük-riske gereksiz ağırlık:** Bir metin-etiketi düğümüne §5 zorunluluklarını dayatmak — YASAK; risk-tetiklemeli, N/A disiplini (§3).

## 15. Definition of Done

- §12'deki 10 test senaryosu yeşil (test-önce kanıtı: kırmızı→yeşil geçişi belgeli); kapının kendisi de mutation-check'ten geçmiş.
- `check-dod-evidence` kapısı yüksek-riskli düğümde owner + AC + negatif-test + riziko-eksenine uygun kanıt + kırmızı→yeşil kaydı varlığını zorluyor; eksikse exit 1.
- Kapı düşük-riskli düğümleri atlıyor (N/A); mevcut `check-ready-for-dev`/`check-atomic-types`/`check-execution-readiness` ile çakışmıyor (§8, §10).
- AI-guardrail: AI kendi testini "yeşil" ilan edemiyor, done işaretleyemiyor, risk-etiketini düşüremiyor (§11).
- Doküman dört kaynak sözleşmeyle uzlaşmış ve her birine referans vermiş (§10); çelişki yok.
- Doküman `icerik-kalite-sozlesmesi` biçim kurallarına uyar (aktör-açık, emoji yok, her başlıkta nedir/yapar/yapmaz §4, her tablodan önce açıklama, mock yok).

## 16. Kaynak-sözleşme karşılığı

Aşağıdaki tablo, bu yönergenin her maddesinin hangi kaynak sözleşmenin hangi öğesini yüksek-riskli düğüme uyarladığını gösterir; her satır bir kaynak öğeyi bu dokümanın bir bölümüne bağlar. Amaç izlenebilirlik: hiçbir zorunluluk kaynaksız uydurulmadı.

| Kaynak öğe | Bu dokümandaki karşılık |
|---|---|
| `evidence-taxonomy §1` kanıt türleri (URL/yol/rapor/log) | §5 kanıt artefakt tablosu türleri |
| `evidence-taxonomy §3` "ne kanıt sayılmaz" (metin iddiası, kırmızı-geçti, downgrade-boş) | §6 sahte-yeşil ritüeli + §14 anti-patterns |
| `evidence-taxonomy §4` `check-execution-readiness` Done Evidence | §8 kontrol 6 (done-tutarlılığı) + derinleştirme |
| `ready-for-dev-gate §1/§2` zorunlu alanlar (owner/AC/evidence-checklist) | §5 dört zorunlu DoD alanı (yüksek-risk için derinleştirilmiş) |
| `ready-for-dev-gate §4` `check-ready-for-dev` kapı deseni | §8 `check-dod-evidence` kapı deseni (kardeş kapı) |
| `icerik-kalite-sozlesmesi §1` "somut, sayfaya-özel, belirsiz-sıfat yasak" | §5 AC kuralı + §9 madde 8 |
| `enterprise-dod §2.1/2.3/2.6/2.14/2.16` (tenant/migration/audit/rollback/owner) | §4 riziko-eksenleri + §5 artefakt eşlemesi |
| `enterprise-dod §2.9` mutation testing (>%70) | §6 Denetim 3 (mutation-check) |
| `atomic-types-directive` 13 boyut + `check-atomic-types` | §7 genelleştirme + §8 kapı |
| `atomik-tip-gelistirici-yonergesi §9` test-önce (kırmızı→yeşil) | §6 kırmızı-önce zorunluluğu + §12 |

## 17. Requirement-ID tablosu

Aşağıdaki tablo, bu sözleşmenin izlenebilir gereksinimlerini kimlik + katman + öncelik (P0–P3) + test türü + kabul + sahip ile listeler. Öncelik: P0 = bloklayıcı invariant, P1 = çekirdek, P2 = önemli, P3 = iyileştirme.

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| DE-01 | Yüksek-risk altı-eksenli tanım (para/PII/tenant-cross/AI-mutasyon/imza-kanıt/migration) | Governance/Contract | P0 | Contract | Düğüm en az bir eksende yüksek-riskli işaretlenir | governance |
| DE-02 | Yüksek-riskli düğüm `owner` non-null | Governance | P0 | Contract | Sahipsiz yüksek-risk done olamaz | governance |
| DE-03 | Yüksek-riskli düğüm `acceptanceCriteria[]` ≥1 ölçülebilir | Governance | P0 | Contract | Belirsiz-sıfat AC reddedilir | governance |
| DE-04 | Yüksek-riskli düğüm `negative_test_refs[]` ≥1 | Testing/Governance | P0 | Contract | Happy-path-only reddedilir | governance |
| DE-05 | Yüksek-riskli düğüm `evidence_artifacts[]` riziko-eksenine uygun | Evidence | P0 | Contract | Metin iddiası kanıt sayılmaz | governance |
| DE-06 | Negatif-test kırmızı→yeşil geçiş kaydı zorunlu | Testing | P0 | Contract | Kırmızı görülmeden yeşil kabul edilmez | qa-team |
| DE-07 | AI-üretilmiş test ≥1 anlamlı assertion (tautoloji/no-op red) | Testing | P0 | Unit | Assertion'sız/tautoloji test reddedilir | qa-team |
| DE-08 | Mutation-check (implementasyon bozulunca test kırmızı) | Testing | P1 | Unit | Yeşil kalan test koruyucu değil | qa-team |
| DE-09 | MOCK YOK — mock dönüşü assert edilemez (gerçek DB/container) | Testing | P0 | Integration | Mock'un dönüşünü doğrulayan test reddedilir | qa-team |
| DE-10 | Tenant-cross ekseninde ≥N negatif case (storage/PDP ≥10) | Security | P0 | Integration(neg) | N-altı cross-tenant reddedilir | security-team |
| DE-11 | Migration ekseninde `alembic downgrade -1` kanıtı | Backend/DevOps | P0 | CI | Downgrade'siz migration done olamaz | kernel-team |
| DE-12 | İmza/kanıt ekseninde audit append-only kanıtı | Security | P0 | Integration | Kayıt sil → audit'te hâlâ görünür | security-team |
| DE-13 | AI DoD/kanıt "onaylandı" veremez; testi "yeşil" ilan edemez | AI-Governance | P0 | Unit | AI kabul/doğrulama yapamaz | governance |
| DE-14 | AI düğümü "done" işaretleyemez; risk-etiketini düşüremez | AI-Governance | P0 | Unit | AI done/risk-düşürme reddedilir | governance |
| DE-15 | `check-dod-evidence` CI kapısı (yüksek-risk owner+AC+negatif-test+kanıt) | DevOps/CI | P0 | CI | Eksik alanda exit 1 | kernel-team |
| DE-16 | Kapı yalnız yüksek-riskli düğüm değerlendirir (N/A disiplini) | DevOps/CI | P1 | CI | Düşük-riskli düğüm atlanır | kernel-team |
| DE-17 | Kapı `check-ready-for-dev`/`check-atomic-types`/`check-execution-readiness` ile çakışmaz | DevOps/CI | P1 | CI | Ortogonal, çakışan kontrol yok | kernel-team |
| DE-18 | 13-boyut+`check-atomic-types` deseni DoD+kanıt eksenine genelleştirilmiş | Contract | P1 | Contract | Her yüksek-risk düğüm sözleşme+kanıt taşır | kernel-team |
| DE-19 | 60+ ekip reddetme ritüeli checklist'i (9 madde) | Governance | P1 | Contract | "Çalışıyor gibi ama yanlış" red edilir | governance |
| DE-20 | Dört kaynak sözleşmeyle uzlaşma + referans | Docs/Governance | P1 | Contract | Çelişki yok, her kaynağa referans | pmo |
