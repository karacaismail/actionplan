# 14 Üretim Boyutu — Eksik Analizi ve Genişletme Önerisi (2026-07-02)

**Durum:** taslak — insan onayı bekler (ADR adayı).
**Kapsam:** `src/schemas/task.ts` içindeki `DIMENSION_KEYS` (14 boyut), `src/data/strings.json` `dimensions` bloğu, ADR-0027 işletim katmanı, 467 WBS düğümü.
**Kardeş dosyalar:** `gap-2026-07-02-00-index.md` (master), `adr-0027-engineering-standards.md`, `dimension-migration-runbook.md`.

Terimler (ilk geçtikleri yer): Boyut (dimension) = her WBS düğümünde ayrı izlenen içerik kartı (iskelet/taslak/dolu). standardRef = düğümün tek-kaynak standart sözleşmesine verdiği referans; içerik kopyalamaz. Applicability = "bu boyut bu düğüme uygulanmaz" kaydı (gerekçe zorunlu). Lazy migration = yeni alanın dosyalara toplu yazılmaması; Zod şeması okuma anında varsayılanı doldurur. KVKK/GDPR = kişisel veri koruma mevzuatları. SLO = servis seviyesi hedefi. RTO/RPO = felaket sonrası dönüş süresi / kabul edilebilir veri kaybı penceresi.

---

## 0. Tek cümlelik hüküm

Mevcut 14 boyut "ürünü doğru inşa etme" eksenini iyi kapsıyor; boş kalan eksen **"ürün üretimde yaşarken ne olur"** eksenidir — veri yaşam döngüsü ve mevzuat uyumu, gözlemlenebilirlik/operasyonel hazırlık ve dayanıklılık/süreklilik için hiçbir boyutun, hiçbir standardRef'in ve hiçbir düğüm alanının tam sahibi yoktur. Öneri: 14 → **17** (üç yeni boyut); geri kalan sekiz aday eksik ise ADR-0027 gereği boyut değil, referans veya mevcut alan kanalıyla kapatılır.

---

## 1. Yöntem — "her eksik yeni boyut değildir" (ADR-0027 filtresi)

ADR-0027 açık bir karar verdi: mühendislik standartları serbest-metin boyut kartı olarak EKLENMEZ; tek-kaynak sözleşme + `standardRefs` referansı olur. Gerekçe: içerik kopyalanırsa düğümler arası drift (aynı standardın farklı düğümlerde farklı anlatılması) kaçınılmazdır. Bu yüzden her eksik üç kanaldan birine düşer; analiz her adayı önce bu filtreden geçirir:

1. **Yeni boyut kanalı** — içerik düğüme özgüyse (her düğümde farklı cevap üretiyorsa) ve çalışma-zamanı/ürün ekseninde ise. Örnek: "bu modülün veri saklama süresi nedir?" düğümden düğüme değişir.
2. **standardRefs kanalı** — içerik tüm düğümler için tek ve ortaksa. Örnek: loglama formatı standardı her yerde aynıdır; düğüm sadece referans verir.
3. **Mevcut alan kanalı** — şemada zaten yeri varsa (`traceability`, `cost`, `metrics`, `deliverables`, `evidence`). Yeni yapı açmak çift kayıt üretir.

Karar ölçütü tek cümle: **cevap düğüme göre değişiyorsa boyut, değişmiyorsa referans, şemada yeri varsa mevcut alan.**

---

## 2. Mevcut 14'ün kapsama haritası — ne yapar, ne yapmaz

Mevcut set (aile eşlemesiyle): featureDefs, moduleUsage, integration (functional) · security, securityOptimization, performance, mobileApps, wcag, owasp (runtime-quality) · codeOptimization (engineering) · deployment (operations) · eca, aiAgents (automation) · testing (verification).

**Ne yapar:** özellik tanımı, güvenlik önlemi, performans, erişilebilirlik, dağıtım topolojisi, otomasyon kuralı ve test kapsamını her düğümde ayrı ayrı izletir. ADR-0027'nin tespitiyle bu set ağırlıkla "ürünü kurma" anıdır.

**Ne yapmaz:** ürün üretimde çalışırken sorulacak soruların sahibi yoktur. Somut olarak: (a) `deployment` boyutu "nereye ve nasıl deploy edilir"i anlatır ama "deploy edildikten sonra nasıl izlenir, alarm eşiği nedir, gece 03:00'te kim hangi runbook'u açar" sorusunun kartı yoktur — `observabilityRef` bir standart sözleşmesine bağlar, fakat düğüme özgü SLO/alarm içeriğinin yazılacağı kart yoktur; (b) `security`+`owasp` saldırıya karşı korumayı anlatır ama KVKK/GDPR ekseni (saklama süresi, silme hakkı, veri envanteri, açık rıza) saldırı güvenliği değildir ve hiçbir kartta yer bulamaz; (c) hata modları, retry/idempotency (aynı isteğin iki kez işlenmesinin tek etki üretmesi), yedekleme/geri dönüş tatbikatı, RTO/RPO hedefleri — ne bir boyutta ne bir referansta.

Ayrıca yapısal bir örtüşme var: güvenlik üç karta yayılmış durumda (`security`, `securityOptimization`, `owasp`). ADR-0027 bunu ontoloji (aile eşlemesi) ile görünür kıldı ama birleştirmeyi bilinçli olarak non-goal ilan etti. Bu rapor da birleştirme önermez; §6'da v2 kaydı olarak bırakır.

---

## 3. Eksik envanteri — 11 aday, kanal kararlarıyla

### P0 — yeni boyut önerilen üç eksik

**15. `dataLifecycle` — Veri Yaşam Döngüsü & Uyum (KVKK/GDPR).**
*Bu nedir?* Düğümün ürettiği/işlediği verinin doğum-yaşam-ölüm planı. *Ne işe yarar?* "Bu modül hangi kişisel veriyi tutar, ne kadar saklar, nasıl siler, nasıl yedekler, migration'ı hangi modla yapar?" sorularını düğüm başına cevaplatır. *Ne yapar?* Saklama süresi, silme/anonimleştirme prosedürü, yedekleme-geri yükleme, migration modu (append-only / expand-contract), veri envanteri maddelerini taşır. *Ne yapmaz?* Veri normalizasyon standardını yeniden yazmaz (`dataNormalizationRef` oradadır); veriyi kendisi taşımaz/silmez — plan kartıdır.
*Neden boyut, referans değil:* saklama süresi ve veri envanteri düğüme göre değişir (CRM iletişim kaydı ≠ audit log). Şemadaki `ProdDataPolicy` yalnız `agentPolicy` kapsamındadır (AI'ın prod veriye dokunma sınırı); insan ekibin veri planını taşımaz. Multi-tenant bir platformda KVKK/GDPR eksikliği kurucu boşluktur → P0.

**16. `observability` — Gözlemlenebilirlik & Operasyonel Hazırlık.**
*Bu nedir?* Düğümün üretimde nasıl izleneceğinin planı. *Ne işe yarar?* Log/metrik/trace kapsamı, alarm eşikleri, SLO hedefi, dashboard ve runbook (operasyon el kitabı) ihtiyacını düğüm başına netleştirir. *Ne yapar?* "Bu özellik bozulursa bunu hangi metrikten, kaç dakikada anlarız; kim, hangi adımla müdahale eder" içeriğini taşır. *Ne yapmaz?* Loglama formatı/araç standardını tanımlamaz — o `observabilityRef`'in bağlandığı tek-kaynak sözleşmededir; izlemeyi kendisi çalıştırmaz.
*Neden boyut:* SLO ve alarm eşiği düğüme özgüdür. Mevcut `observabilityRef` yalnız "hangi standarda uyulacak"ı söyler; "bu düğüm için ne izlenecek"in kartı yoktur → P0.

**17. `reliability` — Dayanıklılık & Süreklilik.**
*Bu nedir?* Hata anı davranış planı. *Ne işe yarar?* Hata modları, retry/timeout/circuit-breaker (arızalı bağımlılığa istek yağdırmayı kesen devre kesici), idempotency, graceful degradation (kademeli işlev kaybı), felaket kurtarma ve RTO/RPO hedeflerini düğüm başına yazdırır. *Ne yapar?* "Bu bileşenin bağımlılığı düşerse kullanıcı ne görür, veri ne olur, dönüş kaç dakikadır" sorularını cevaplatır. *Ne yapmaz?* Test stratejisini kopyalamaz (`testing` kaos/yük testini kanıtlar; `reliability` hedefi tanımlar).
*Neden boyut:* hata modu ve RTO/RPO düğüme göre değişir. `risks[]` alanı proje riskini tutar (plan riski), çalışma-zamanı arıza davranışını değil → P0.

### P1 — referans/mevcut alan kanalıyla kapatılacak eksikler (yeni boyut AÇILMAZ)

- **Çok-kiracılık (multi-tenancy):** eksik gerçek, kanal yanlış olurdu. `traceability.tenantStrategy` alanı var; tenant izolasyon standardı tek-kaynak sözleşme olmalı ve düğümler referans vermeli (yeni bir `tenancyRef` — `StandardRefsSchema`'daki opsiyonel ref deseniyle). Tenant'a özgü davranış maddeleri `security` ve yeni `dataLifecycle` kartlarına girer.
- **Kimlik & erişim (SSO/OIDC/MFA/yetkilendirme):** `ssoRef, oidcRef, mfaRef, authzRef` zaten şemada. Eksik olan referansların dolu olması ve `check-standards-coverage` kapısının bunları gerçekten zorlaması — yeni kart değil, aktivasyon işi.
- **i18n/g11n (çok dillilik):** `i18nRef` + `g11nRef` var; `check-i18n.mjs` kapısı var. Düğüme özgü çeviri işi zaten `deliverables`/`acceptanceCriteria`'ya yazılabilir.
- **API sözleşmesi & sürümleme:** `dataApiContractRef` var; kırıcı-değişiklik politikası o sözleşmenin içine yazılır, boyut açılmaz.

### P2 — mevcut alan yeterli, izlenecek

- **Maliyet/FinOps:** `cost` alanı (budget, currency, resources) şemada mevcut ve neredeyse hiç kullanılmıyor. Kanal: mevcut alan + raporlama görünümü. Boyut açmak çift kayıt olur.
- **Ürün analitiği/KPI:** `metrics[]` alanı var; aynı durum.
- **Dokümantasyon/runbook üretimi:** runbook ihtiyacı yeni `observability` kartına girer; kullanıcı/API dokümanı `deliverables` kanalıdır.
- **UX/design kalitesi:** `designSystemRef`, `uiComponentRef`, `uxStandardRef` var; `wcag` boyutu erişilebilirlik tarafını zaten taşır.

---

## 4. Önerilen 17'li set — adlandırma, aile, ikon

Yeni üç anahtarın tam tanımı (strings.json `dimensions` bloğu + `DIMENSION_META`/`DIMENSION_FAMILY` eşlemesi için spec; ikonlar Phosphor):

| Anahtar | TR başlık | Aile | İkon |
|---|---|---|---|
| `dataLifecycle` | Veri Yaşam Döngüsü & Uyum | `operations` | `ph-database` |
| `observability` | Gözlemlenebilirlik & Operasyon | `operations` | `ph-chart-line-up` |
| `reliability` | Dayanıklılık & Süreklilik | `runtime-quality` | `ph-shield-plus` |

Aile seti (6) değişmez; `operations` ailesi 1 → 3 üyeye çıkar ve "day-2 operations" (yayın sonrası işletim) ekseni ilk kez gerçek kapsama kavuşur. `DIMENSION_KEYS` sırasında yeni üçlü sona eklenir — sıra değişikliği mevcut UI sıralamasını bozmaz.

Ek referans önerisi (boyut değil): `StandardRefsSchema`'ya opsiyonel `tenancyRef` (+ gerekiyorsa `privacyRef`) — mevcut opsiyonel-ref deseniyle, geriye uyumlu.

---

## 5. Etki planı — test-önce sırayla

Aktörler: **insan (sen)** ADR onayı ve içerik kararı verir; **AI ajan** taslak üretir, PR açar; **CI** kapıları zorlar; hiçbir adım main'e doğrudan yazmaz.

**Adım 1 — önce testler.** Değişiklik yazılmadan kırmızı yakılacak testler: `tests/schema.test.ts` (17 anahtar, aile eşlemesi eksiksiz, `makeSkeletonDimensions` 17 üretir), `tests/content/contentQuality.test.ts` (yeni anahtarların strings.json'da TR başlığı var), `check-dimension-applicability` senaryosu ("atom seviyesinde observability applies=false + gerekçe" geçerli sayılır).

**Adım 2 — veri modeli.** `src/schemas/task.ts`: `DIMENSION_KEYS`'e 3 anahtar, `DIMENSION_META`, `DIMENSION_FAMILY`. `src/data/strings.json`: `dimensions` bloğuna 3 TR başlık. Şema kuralı gereği kodda gömülü TR metin yok; tek kaynak strings.json kalır.

**Adım 3 — lazy migration, dosya yazımı YOK.** `dimensions` alanı `z.record(...).default({})` olduğundan 467 düğüm dosyasına dokunulmaz; eski JSON'lar yeni anahtarları taşımadan geçerli parse olur (dimension-migration-runbook.md ilkesi aynen geçerli). `makeSkeletonDimensions` yalnız YENİ düğümlerde 17 iskelet üretir.

**Adım 4 — kapılar ve denetim.** `tools/agents/check-content.mjs` ve `check-dimension-applicability.mjs` yeni anahtarları tanır. `src/engine/audit.ts` skorlaması güncellenir — kritik risk: 467 düğümde 3 yeni boş kart, denetim sayfasında "Boş" sayısını bir gecede ~1.400 artırır ve ortalama skoru düşürür. Önlem: audit, applicability=N/A kartları paydadan düşer (mevcut davranış korunur) + seviye-bazlı varsayılan N/A politikası insan onayıyla belirlenir (öneri: `work_unit`/`micro_step` seviyesinde `observability` ve `dataLifecycle` varsayılan N/A, gerekçe şablonlu).

**Adım 5 — çapraz repo.** projector `content-source` üreteçleri ve overlay'ler yeni anahtarları tanımalı; aksi halde docs sitesi 17'liyi 14 gösterir. Bu, actionplan PR'ı merge edildikten sonra ayrı bir projector PR'ıdır.

**Riskler / edge case'ler:** (a) içerik yükü — 3 kart × dolu doldurulmaya kalkışılırsa jenerik çöp üretilir; ADR-0027'nin N/A ilkesi burada da bağlayıcıdır, kart ancak gerçek içerik varsa doldurulur; (b) swarm prompt'ları (`tools/agents/prompt-template.md`) 14'e gömülü referans içeriyorsa güncellenmeli; (c) eski export/import edilmiş JSON'lar `.strict()` şemada sorun çıkarmaz çünkü eksik anahtar hata değildir — fakat 17'li export'u 14'lü eski sürüme geri import etmek bilinmeyen anahtar hatası verir (şema sürümü `1.1.0`'a yükseltilmeli).

---

## 6. Bilinçli yapılmayanlar (non-goals)

Mevcut 14 boyuttan hiçbiri silinmez/yeniden adlandırılmaz (ADR-0027 non-goal'u korunur). `security`+`securityOptimization`+`owasp` birleştirmesi bu kapsamda değildir; ayrı bir v2 ADR'ında, veri migration maliyetiyle birlikte tartılmalıdır. Mühendislik standartları boyutlaştırılmaz. Bu rapor kod değiştirmez — insan onayından sonra yukarıdaki sırayla ayrı bir PR'da uygulanır.

## 7. Karar noktaları (insan onayı gereken)

1. 17'li set onayı: `dataLifecycle`, `observability`, `reliability` — adlar/aileler bu haliyle mi?
2. Seviye-bazlı varsayılan N/A politikası (Adım 4 önerisi) kabul mü?
3. `tenancyRef` (ve `privacyRef`) standardRefs'e eklensin mi, yoksa tenancy içeriği mevcut ref'lerle mi idare edilsin?
4. Şema sürümü `1.0.0 → 1.1.0` yükseltmesi bu PR'da mı, ayrı mı?
