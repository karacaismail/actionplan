# Core → Enterprise Olgunluk Merdiveni — Üç Kademeli DoD

**Tarih:** 2026-07-01
**Durum:** Taslak sözleşme (kilitlenmeyi bekliyor — bkz. §7 ADR-D3)
**Kapsam:** ~50 app'in "önce core, sonra enterprise" büyüme modelini üç kademeye (L1/L2/L3) ayıran, her kademe için Definition of Done (DoD) ve graduation (terfi) kapısı tanımlayan sözleşme.
**Kaynak/bağlam:** `enterprise-dod.md` (L3 bitiş-DoD — 18 katman; **bu doküman onu yeniden yazmaz, referans verir**), `kernel-dokuman-gap-2026-07-01.md` §4 (merdiven teşhisi), `app-distribution-contract.md` (bağımsız satılabilirlik — L1'in ön koşulu), `core-contract-pack.md` (kernel sözleşmesi).
**İlişki:** Bu doküman `app-distribution-contract.md`'nin kardeşidir. Dağıtım sözleşmesi "app nasıl ayrı satılır?" sorusunu, bu doküman "app ne kadar olgun ve bir sonraki kademeye ne zaman terfi eder?" sorusunu yanıtlar.

---

## 1. Amaç — Neden "Bitiş-DoD"su Yetmiyor

`enterprise-dod.md` mükemmel bir **bitiş çizgisi** tanımlar: 18 katmanlı, enterprise-grade bir app'in "tamam" sayılması için gereken tüm kriterler (tenant, authz, DB/migration, API sözleşmesi, UI, audit, import/export, observability, testler, a11y, deployment, rollback, docs, owner, risk, dependency). Ama tek bir sorun var: **bu bir bitiş DoD'sidir, bir yol haritası değil.**

İş modeli "önce core, sonra enterprise" diyor. Bir app'i ilk sürümde 18 katmanın tamamıyla shipping etmek beklenmez ve gerekmez — bir app **önce bağımsız satılabilir bir çekirdek (core) olarak** piyasaya çıkar, gelir getirir, sonra büyür. Bugünkü belge bu ara durakları tanımlamıyor: "core ne demek? Bir app'i satmaya başlamak için minimum ne yeterli? Ne zaman enterprise sayılır?" sorularının yazılı, denetlenebilir cevabı yok.

Bu doküman o boşluğu üç kademeli bir merdivenle doldurur:

- **L1 — Core:** Bağımsız satılabilir MVP. Bir app'i satmaya başlamak için MINIMUM.
- **L2 — Growth:** Büyüyen, çok-müşterili, çok-dilli, gözlemlenebilir app.
- **L3 — Enterprise:** `enterprise-dod.md`'nin 18 katmanı + residency + DR + compliance + çok-bölge.

Kritik ilke: **her app bağımsız olduğu için farklı kademede olabilir.** `app-distribution-contract.md`'nin tanımladığı gibi app'ler ayrı ürünlerdir; bu yüzden bir app L1'de satılırken bir diğeri L3 enterprise sözleşmesinde olabilir. Merdiven, tüm portföyü aynı anda ilerletmez; her app'i kendi hızında terfi ettirir.

Bu doküman **kod yazmaz** ve `enterprise-dod.md`'yi **kopyalamaz**. L3 kriterlerini tekrar etmek yerine oraya referans verir; katkısı L1 ve L2 kademelerini tanımlamak ve üç kademe arasına graduation kapıları koymaktır.

---

## 2. Merdivenin Yapısı ve Terimler

### 2.1 Terimler (ilk geçişte açıklama)

- **DoD (Definition of Done):** Bir kademenin "tamamlandı" sayılması için karşılanması gereken davranışsal, denetlenebilir kriter listesi. Her kriter ya CI ile ölçülür ya da kanıt (evidence) ister.
- **Graduation kapısı (terfi kapısı):** Bir app'in bir kademeden bir üste geçebilmesi için geçmesi gereken kapı. İki parçalıdır: **CI denetimi** (o kademenin DoD kriterleri makine tarafından yeşil) + **insan onayı** (release owner terfiyi imzalar). CI kademe-DoD'sini ayrı denetler; graduation'ı **insan** onaylar.
- **Kademe (L1/L2/L3):** App'in olgunluk seviyesi. App manifest'inde (`app-distribution-contract.md §2`) veya WBS düğümünde app-başı taşınır; her app kendi kademesindedir.
- **RLS (Row-Level Security):** PostgreSQL satır düzeyi güvenliği; bir tenant'ın satırlarını diğerinden yalıtan veritabanı mekanizması (`enterprise-dod §2.1`).
- **RBAC / ReBAC / ABAC:** Rol-tabanlı / ilişki-tabanlı / öznitelik-tabanlı erişim kontrolü. L1 RBAC ister; L2 ReBAC/ABAC'e (PDP üzerinden) yükseltir.
- **PDP (Policy Decision Point):** Yetki kararını veren merkezi motor (`k-policy-pdp`). "Bu actor bu kaynağa bu eylemi yapabilir mi?" sorusunu ReBAC/ABAC ile yanıtlar.
- **SSO (Single Sign-On):** Tek oturum açma; kurumsal kimlik sağlayıcıyla (SAML/OIDC) entegrasyon.
- **SLO (Service Level Objective):** Hizmet seviyesi hedefi; ör. "p99 gecikme < 1s, hata oranı < %1" (`enterprise-dod §2.8`).
- **Residency (veri-residency):** Verinin hangi coğrafi bölge/jurisdiction'da tutulacağı kısıtı (`k-jurisdiction`; KVKK/GDPR bağlamı).
- **DR (Disaster Recovery):** Felaket kurtarma; yedek + geri yükleme + tatbikat.

### 2.2 Kademeler bir bakışta

Aşağıdaki tablo üç kademeyi tek bakışta özetler; ayrıntılı DoD ve graduation kapıları §3-§6'dadır.

| Kademe | Tek cümlelik tanım | Ticari anlam | DoD kaynağı |
|---|---|---|---|
| L1 — Core | Bağımsız satılabilir MVP: basit multi-tenant, CRUD + temel workflow, RBAC, i18n-hazır, temel audit, compose deploy, temel testler | App satılmaya başlanabilir | Bu doküman §3 |
| L2 — Growth | Capability/entitlement gate, ReBAC/ABAC (PDP), SSO, observability + SLO, yedek/restore, çok-dil aktif + RTL, marketplace-listelenebilir | App ölçeklenir, çoklu müşteri + global | Bu doküman §4 |
| L3 — Enterprise | `enterprise-dod.md` 18 katman + residency + DR-tatbikatı + tam SDK + çok-bölge + compliance (KVKK/GDPR/SOC2) | App kurumsal/regüle müşteriye satılır | `enterprise-dod.md` + bu doküman §5 |

Kademeler **eklemelidir (cumulative):** L2, L1'in tüm kriterlerini içerir ve üstüne ekler; L3, L2'nin tümünü içerir. Bir app L3'teyse L1 ve L2 kriterlerini de karşılıyor demektir.

---

## 3. L1 — Core (Bağımsız Satılabilir MVP)

### 3.1 L1 nedir

L1, bir app'in **bağımsız satılabilir minimum** halidir. Buradaki hedef enterprise mükemmelliği değil; **satılabilir, güvenli, izole bir çekirdek**. Bir müşteri bu app'i alıp tek başına kurabilmeli, kendi verisi başkasından yalıtılmış olmalı, temel işi yapabilmeli. L1 aynı zamanda `app-distribution-contract.md`'deki dört bağımsız-satılabilirlik yükümlülüğünü (ayrı paketlenebilir + lisanslanabilir + deploy edilebilir + izole) fiilen karşılayan ilk kademedir.

### 3.2 L1 DoD kriterleri

Sade özet: L1, "güvenli çalışan ve tek başına kurulabilen bir çekirdek" için gereken en küçük ama tavizsiz kümedir. Her satır bir DoD kriteridir; "denetim" sütunu nasıl doğrulandığını verir.

| # | L1 kriteri | Ne zaman DONE | Denetim |
|---|---|---|---|
| L1-1 | Basit multi-tenant (RLS) | Her istek `tenant_id` bağlamı taşır; RLS ile tenant izolasyonu; çapraz-tenant erişim 403 | `enterprise-dod §2.1` (temel seviye) + tenant izolasyon testi |
| L1-2 | CRUD + temel workflow | App'in çekirdek varlıkları için oluştur/oku/güncelle/sil + en az bir temel iş akışı çalışır | Kabul kriteri testleri (happy path) |
| L1-3 | RBAC | Kimlik doğrulama (JWT) + rol-tabanlı yetki; her endpoint/resolver korumalı | `core-contract-pack §2.2` (RBAC seviyesi) |
| L1-4 | i18n-hazır (metin dışarıda) | Kullanıcıya görünen tüm metin koddan ayrık (kaynak dosyada); en az bir locale; ham anahtar asla gösterilmez | Manifest `i18n_locales[]` dolu; hardcoded string taraması |
| L1-5 | Temel audit | Durum değiştiren işlemler audit'e yazılır (actor, tenant, kaynak, eylem, zaman) | `core-contract-pack §2.5` (temel append-only) |
| L1-6 | Docker-compose deploy | App tek başına `docker compose up` ile ayağa kalkar (kernel + o app module'leri) | `app-distribution-contract §5` standalone kurulum |
| L1-7 | Temel testler | Kritik iş mantığı birim testli + kritik akış için en az happy-path E2E | Test raporu (kapsam eşiği L1 için makul taban) |
| L1-8 | Bağımsız satılabilir (izolasyon) | App manifest'i geçerli; çapraz-app doğrudan import yok; capability-gate iskeleti mevcut | `app-distribution-contract §2, §3, §7` kapıları |

### 3.3 L1 graduation kapısı (L1 → L2)

Bir app'in "L1 tamam, L2'ye geçebilir" sayılması için:

- **CI denetimi (L1-DoD):** L1-1..L1-8 kriterlerini denetleyen kapılar yeşil. Özellikle: tenant izolasyon testi geçer, RBAC her giriş noktasında var, manifest geçerli, standalone compose ayağa kalkar, izolasyon kapıları (`check-app-isolation`, `check-app-manifest`) yeşil.
- **İnsan onayı:** Release owner, app'in bağımsız satılabilir olduğunu (dört yükümlülük karşılandı) ve L1-DoD'nin gerçekten tamamlandığını doğrulayıp terfiyi imzalar.

L1 graduation, aynı zamanda **"bu app artık satılabilir" kararıdır.** Bir app L1 kapısını geçmeden marketplace'e (`app-distribution-contract §6`) core sürüm olarak listelenemez.

---

## 4. L2 — Growth

### 4.1 L2 nedir

L2, L1'de satılan bir app'in **büyüme** kademesidir: birden çok müşteriye, birden çok dilde, ölçeklenerek hizmet verir. Buradaki yeni yetenekler L1'in üstüne biner: lisanslama olgunlaşır (capability/entitlement gate), yetki ReBAC/ABAC'e yükselir (PDP), kurumsal kimlik entegrasyonu (SSO) gelir, sistem gözlemlenebilir olur (SLO), veri yedeklenir/geri yüklenir, i18n çok-dil + RTL ile aktifleşir, ve app marketplace'te tam listelenebilir olur.

### 4.2 L2 DoD kriterleri (L1'in üstüne)

Sade özet: L2, "tek app satışı"ndan "ölçeklenen, çok-müşterili, global ürün"e geçişin kriterleridir. L1'in tümünü içerir; aşağıdakiler eklenir.

| # | L2 kriteri | Ne zaman DONE | Denetim |
|---|---|---|---|
| L2-1 | Capability/entitlement gate | Lisans anahtarı → `k-capability` → feature-gate; müşteri yalnız aldığı capability'yi çalıştırır; opsiyonel özellik gate | `app-distribution-contract §4`; `check-capability-gate` |
| L2-2 | ReBAC/ABAC (PDP) | Yetki kararı `k-policy-pdp` üzerinden; ilişki + öznitelik tabanlı (RBAC'ten yükseltme) | PDP karar testleri; yetki matrisi |
| L2-3 | SSO | Kurumsal kimlik sağlayıcı entegrasyonu (SAML/OIDC); token akışı SSO ile çalışır | SSO entegrasyon testi |
| L2-4 | Observability + SLO | Structured log + metrik + trace; SLO tanımlı (p99/hata oranı) + alert kuralları | `enterprise-dod §2.8` (SLO dahil) |
| L2-5 | Yedek / restore | Otomatik yedek + belgelenmiş geri yükleme; restore en az bir kez test edilmiş | Restore testi logu |
| L2-6 | i18n çok-dil aktif + RTL | En az iki dil canlı; RTL tam düzen; CLDR biçimlendirme (tarih/para/sayı); pseudo-localization testi | i18n standardı (bkz. `kernel-standart-kapsama-derin-2026-07-01.md`); manifest `i18n_locales[]` çoklu |
| L2-7 | Marketplace-listelenebilir | App tam manifest + uyumluluk matrisi girdisi + `kernel_range` beyanı ile marketplace'te listelenir | `app-distribution-contract §6`; `check-kernel-range` |

### 4.3 L2 graduation kapısı (L2 → L3)

- **CI denetimi (L2-DoD):** L2-1..L2-7 (+ L1 tümü) kriterlerini denetleyen kapılar yeşil. Özellikle: capability-gate her lisanslı giriş noktasında (`check-capability-gate`), PDP karar testleri geçer, observability/SLO alert kuralları tanımlı, restore testi kanıtlı, çok-dil + RTL aktif.
- **İnsan onayı:** Release owner, app'in growth kriterlerini karşıladığını ve enterprise'a (L3) genişletilmeye hazır olduğunu doğrulayıp terfiyi imzalar.

L2 graduation, app'in **kurumsal/regüle müşteri yolculuğuna** girmeye hazır olduğu kararıdır. L3 kriterleri (residency, DR, compliance) L2 tabanı olmadan anlamsızdır.

---

## 5. L3 — Enterprise

### 5.1 L3 nedir

L3, app'in **kurumsal ve regüle** kademesidir. Burada tam olgunluk beklenir: `enterprise-dod.md`'nin 18 katmanının tamamı + veri-residency + DR tatbikatı + tam SDK + çok-bölge + compliance. Bu, kurumsal/regüle müşteriye (banka, kamu, sağlık, çok-uluslu) satış kademesidir.

### 5.2 L3 DoD — `enterprise-dod.md` referansı (yeniden yazılmaz)

L3'ün çekirdeği zaten yazılıdır: **`enterprise-dod.md`'nin 18 katmanı L3-DoD'nin temelidir.** Bu doküman o 18 katmanı **tekrar etmez**; L3'e ulaşmak isteyen app doğrudan `enterprise-dod.md`'yi karşılamalıdır. Kısa hatırlatma (ayrıntı için `enterprise-dod.md`):

> 18 katman: Tenant · Auth/Authz · DB Şema+Migration · API Sözleşmesi · UI Surface · Audit Log · Import/Export · Observability · Unit Testler · Integration Testler · E2E Testler · a11y (WCAG 2.2) · Deployment · Rollback · Docs/Runbook · Owner · Risk Kaydı · Dependency.

L1 ve L2, bu 18 katmanın bir alt kümesini **daha düşük olgunlukta** karşılar (ör. L1 tenant'ı basit RLS ile, L3 tam izolasyon + pen-test ile). L3'te 18 katmanın **tamamı, tam kanıtla (evidence)** karşılanır. `enterprise-dod.md`'nin waterfall-faz bağı ve kanıt tabloları L3 için bağlayıcıdır.

### 5.3 L3 ek kriterleri (18 katmanın üstüne)

`enterprise-dod.md` 18 katmanı verir ama "önce core sonra enterprise" modelinin en üst basamağı birkaç ek yetenek daha ister. Bunlar 18 katmanın üstüne eklenir:

| # | L3 ek kriteri | Ne zaman DONE | Denetim |
|---|---|---|---|
| L3-1 | Veri-residency (bölge/jurisdiction) | Verinin bölgesi `k-jurisdiction` ile zorlanır ("TR verisi TR'de"); failover'da residency-kapısı | `k-jurisdiction` residency ekseni + query-layer zorlaması |
| L3-2 | DR tatbikatı | Yedek/restore ötesinde: felaket senaryosu tatbik edilmiş, RTO/RPO ölçülmüş, runbook doğrulanmış | DR tatbikat raporu |
| L3-3 | Tam SDK | OpenAPI/GraphQL → typed client üretimi; app'in dış entegrasyon SDK'sı belgeli ve yayınlı | SDK/codegen runbook + yayınlı client |
| L3-4 | Çok-bölge | App birden çok coğrafi bölgede çalışabilir (K8s topolojisi); residency ile tutarlı | Çok-bölge deploy doğrulama |
| L3-5 | Compliance (KVKK/GDPR/SOC2) | Rıza/DSR/silme/taşınabilirlik/ihlal bildirimi; denetim izi compliance-hazır | `cc-privacy`/`s-kvkk` bağı + compliance checklist |

Bu ek kriterlerin çoğu `enterprise-dod.md`'de üstü kapalı geçer (ör. deployment içinde çok-bölge, audit içinde compliance izi) ama "önce core sonra enterprise" modelinde **açık L3 basamağı olarak** ayrılır ki bir app'in ne zaman gerçekten enterprise sayıldığı denetlenebilir olsun.

### 5.4 L3 graduation kapısı (L3 = enterprise-ready)

- **CI denetimi (L3-DoD):** `enterprise-dod.md`'nin 18 katman kapıları (mevcut `check-*` kapıları + `enterprise-dod` evidence tabloları) **tamamı yeşil** + L3-1..L3-5 ek kriterleri kanıtlı.
- **İnsan onayı:** Release owner + (regüle satışta) compliance sorumlusu, app'in enterprise-ready olduğunu doğrulayıp imzalar.

L3 graduation, app'in **kurumsal/regüle müşteriye satılabilir** olduğu nihai karardır. Bu, `enterprise-dod.md`'nin bitiş çizgisiyle örtüşür — merdivenin en üst basamağıdır.

---

## 6. Aktör Açıklığı ve Portföy Görünümü

### 6.1 Kim ne yapar

Her kademe ve her graduation kapısında üç aktör vardır; hiçbir terfi "kendiliğinden" olmaz (ADR-0027 aktör-açıklığı ilkesi).

- **Geliştirici (insan):** App'i bir kademede ship eder. Bir sonraki kademenin kriterlerini karşılayacak işi yapar (ör. L1'den L2'ye geçmek için capability-gate + PDP + SSO ekler). Kademe atlamak için tüm ara kriterleri karşılar (L1→L3 atlaması yok; L2 karşılanmadan L3 anlamsız).
- **CI (makine):** Her kademenin DoD'sini **ayrı denetler**. L1-DoD, L2-DoD, L3-DoD için ayrı kapı setleri çalışır. Bir kademe kapısı kırmızıysa o kademe "tamam" sayılmaz; graduation başlatılamaz. CI graduation'ı **onaylamaz**, yalnız kriterlerin karşılandığını doğrular.
- **İnsan (release owner):** Graduation'ı **onaylar**. CI yeşil olsa bile terfi kararı insanındır; owner app'in ticari/olgunluk durumunu değerlendirip imzalar (`release-policy.md`: tag/release insan tarafından atılır). Regüle L3 satışta compliance sorumlusu da onaylar.

Özet: **geliştirici ship eder, CI kademe-DoD'sini ayrı denetler, insan graduation'ı onaylar.**

### 6.2 Her app kendi kademesinde — portföy görünümü

En kritik yapısal ilke: **app'ler bağımsız olduğu için her app farklı kademede olabilir.** `app-distribution-contract.md` app'leri ayrı ürünler olarak tanımlar; dolayısıyla merdiven bir portföy-genelinde-tek-hız dayatmaz. Örnek bir portföy anlık görüntüsü:

| App | Kademe | Ticari durum |
|---|---|---|
| invoice | L3 | Kurumsal müşteriye satılıyor (residency + compliance) |
| crm | L2 | Çoklu müşteri, çok-dil aktif; marketplace'te listeli |
| inventory | L1 | Yeni; core olarak satışa yeni çıktı |
| analytics | L1 (graduation bekliyor) | L1-DoD yeşil; owner terfiyi henüz imzalamadı |

Bu tablo bir örnektir; gerçek kademe her app'in manifest'inde/WBS düğümünde app-başı taşınır. Merdiven her app'i **kendi hızında** ilerletir: biri L1'de gelir getirirken diğeri L3 enterprise sözleşmesinde olabilir. Bu, "önce core, sonra enterprise" modelinin operasyonel karşılığıdır.

### 6.3 Kademe ile bağımsız-satılabilirlik ilişkisi

İki doküman birbirine kenetlidir:

- `app-distribution-contract.md` **dört bağımsız-satılabilirlik yükümlülüğünü** (ayrı paketle/lisansla/deploy/izole) tanımlar.
- Bu doküman **L1'i o dört yükümlülüğün karşılandığı ilk kademe** yapar (L1-6, L1-8).
- Yani: **bir app L1 graduation'ı geçmeden bağımsız satılabilir sayılmaz; ve bağımsız satılabilir olmayan bir app L2/L3'e terfi edemez.** İki sözleşme aynı iş modelinin iki yüzüdür.

---

## 7. Kilitlenecek ADR Taslakları

Aşağıdaki ADR'ler bu merdiveni bağlayıcı hale getirir. `kernel-dokuman-gap-2026-07-01.md` §8'deki ADR-D3'ün ayrıştırılmış halidir; kilitlenince `docs/` altına ADR düğümü olarak eklenir (README §1).

- **ADR-D3 — Core/Growth/Enterprise olgunluk merdiveni (ana karar).** Bu dokümanın kanonik sözleşme olarak kabulü; `enterprise-dod.md`'nin L3-DoD olarak konumlanması + L1/L2 kademelerinin eklenmesi. Öneri: **evet** ("önce core sonra enterprise" iş modelinin kapı sistemi; bu olmadan "core ne demek" tanımsız).
- **ADR-D3.1 — L1/L2/L3 kademe alanı.** App-başı kademe alanının nerede taşınacağı (manifest `maturity_level` veya WBS düğüm alanı) + kademenin makine-okunur temsili. Öneri: evet.
- **ADR-D3.2 — Kademe-DoD CI kapıları.** L1-DoD / L2-DoD / L3-DoD'yi ayrı denetleyen kapı setleri; mevcut `enterprise-dod` kapılarıyla (`check-execution-readiness` vb.) hizalama; L3'te 18 katman kapılarının tam yeşil zorunluluğu. Öneri: evet (kademe kapısı yoksa graduation ölü metin — ADR-0027 ilkesi).
- **ADR-D3.3 — Graduation onay akışı.** CI-yeşil + insan-onay ikili kapısı; release owner (+ regüle L3'te compliance) imza akışının `release-policy.md` ile bağı. Öneri: evet.

---

## Çelişki ve Bağlam Notları

- Bu doküman `enterprise-dod.md`'yi **kaynak** kabul eder ve L3-DoD için ona referans verir; 18 katmanı **yeniden yazmaz**. `enterprise-dod.md` ile bu doküman arasında L3 tanımında çelişki çıkarsa **`enterprise-dod.md` önceliklidir** ve bu doküman hizalanır.
- L1/L2/L3 kademe içerikleri `kernel-dokuman-gap-2026-07-01.md` §4'teki taslakla hizalıdır; bu doküman onu graduation kapıları + denetim + portföy görünümü ile detaylandırır.
- Kullanılan primitif adları (`k-tenancy`, `k-authz`, `k-capability`, `k-policy-pdp`, `k-jurisdiction`) ve i18n/residency bağı, kernel gap/kapsama raporlarıyla (`kernel-dokuman-gap-2026-07-01.md`, `kernel-standart-kapsama-derin-2026-07-01.md`) tutarlıdır. i18n'in 15. standarda terfisi (ADR-D1/I1) L2-6'yı zorunlu-standart olarak bağlayacaktır.
- Stack kısıtı (`core-contract-pack §1` ile aynı, mutlak yasak): Next.js, Supabase, Prisma yasak; üretim DB'si yalnız PostgreSQL; ORM yalnız SQLAlchemy 2.0 / SQLModel; deploy Hetzner + Debian + Docker (K8s L3'te çok-bölge için opsiyonel).
- Bu doküman **hiçbir kod/şema/JSON dosyasına dokunmaz**; yalnız sözleşme metnidir. Kademe alanı ve kademe-DoD CI kapıları ADR-D3 ailesi kilitlendiğinde ayrı iş kalemi olarak üretilir.

*Kardeş doküman: `app-distribution-contract.md` (bağımsız satılabilirlik sözleşmesi). Referans: `enterprise-dod.md` (L3 bitiş-DoD, 18 katman), `core-contract-pack.md` (kernel sözleşmesi), `release-policy.md` (semver/tag/release), `standards-applicability-matrix.md` (seviye × standart).*
