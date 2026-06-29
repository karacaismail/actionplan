# Developer Workflow Gap Analizi

**Tarih:** 2026-06-29  
**Kapsam:** actionplan sitesi — "görev sayfasından gerçek ürün koduna geçiş" boşluk analizi  
**Durum:** main, 437 düğüm; tüm kapılar yeşil  
**Not:** Bu belge iki bağımsız LLM analizini (Claude + ChatGPT) tek, çelişkisiz rapora birleştirmektedir. ChatGPT analizinin kullandığı eski metrikler (owner 411/437, evidence 0, lint kırmızı) merge öncesi anlık görüntüye dayanıyordu; aşağıdaki tüm sayılar güncel main durumunu yansıtır.

---

## 1. Kısa Sonuç

actionplan sitesi "NE yapılacak"ı 437 düğümle ve her düğümde 14 üretim boyutuyla ayrıntılı biçimde tanımlar. "NASIL yapılacak"ı da isimlendirmektedir: her düğümde prompt alanı bir geliştirici talimatı gibi görünmektedir. Ancak bu promptlar içerik üretmek için tasarlanmıştır; gerçek bir execution workflow tarif etmemektedir. Sonuç olarak plan, çekirdek olarak ne bir teknik spec ne de bir kod iskeleti içermektedir. Bir geliştirici siteye bağlantı aldığında görevin ne olduğunu anlayabilir; ancak o görevden platforma ait gerçek kaynak koduna nasıl gideceğini, hangi branch adını kullanacağını, hangi testi çalıştıracağını, kanıtı nereye yazacağını ve bitince nereye geçeceğini siteye bakarak çözemez.

---

## 2. Mevcut Durum Ölçümü

Aşağıdaki tablo, iki raporun karşılaştırmalı metrik tablosunu güncel durumla birleştirmektedir.

| Metrik | ChatGPT Raporu (eski — geçersiz) | Güncel Durum (main) |
|---|---|---|
| Toplam düğüm | 437 | 437 |
| Owner dolu | 411/437 | 437/437 |
| Evidence > 0 | 0 | 437 (alan var, içerik dolu) |
| Schedule dolu | kısmen | 437/437 |
| check-content | geçiyor | geçiyor |
| quality-lint | kırmızı | yeşil |
| check-data-quality | geçiyor | geçiyor |
| check-execution-readiness | — | yeşil |

ChatGPT raporundaki owner-411, evidence-0 ve lint-kırmızı verileri artık geçersizdir; söz konusu analiz merge öncesi bir dal üzerinde yapılmıştır. Bu boşluklar kapatılmıştır. Aşağıdaki tüm bulgu maddeler mevcut durumu baz almaktadır.

---

## 3. Ana Boşluklar

### 3a. Yürütme Döngüsü Yazılı Değil

Sitenin hiçbir sayfasında bir geliştiricinin görevi almasından başlayarak kodu teslim etmesine kadar geçen adımlar sıralanmamıştır. "Görevi al → branch aç → ilgili modülü bul → kodu yaz → testi geçir → PR aç → kapıları geçir → evidence yaz → bir sonraki göreve geç" döngüsü yalnızca zımni bilgi olarak var olmaktadır. Yazılı olmayan bir döngü, ekip büyüdükçe her seferinde yeniden icat edilmek zorunda kalır.

### 3b. Kod-Üretim Promptları Yok

Her düğümdeki prompt alanı içerik üretmek için yazılmıştır, örneğin "CustomerList sorgusunu, DataLoader kullanımını ve N+1 önleme tekniğini kapsayan bir doküman üret." Bu promptlar bir geliştiriciyi doğrudan kod dosyasına yönlendirmez. Kod-üretim promptları şöyle bir yapı gerektirir: "platform/apps/customer/graphql/resolvers/customer_resolver.py dosyasını oluştur; DataLoader entegrasyonunu test_customer_resolver.py'de doğrula; PR açmadan önce quality-lint ve check-execution-readiness kapılarının geçmesini bekle." Bu tür talimatlar hiçbir düğümde bulunmamaktadır.

### 3c. Giriş Noktası ve Signpost Yok

Bir geliştirici siteye bağlantı aldığında hangi repoyu klonlayacağını, hangi dizine gideceğini, hangi ortam değişkenlerini ayarlayacağını siteye bakarak öğrenemez. platform monorepo kararı alınmış olmakla birlikte site hiçbir yerde bu kararı geliştirici deneyimiyle ilişkilendiren bir "ilk gün rehberi" sunmamaktadır.

### 3d. Geri-Yazma Döngüsü Yok

Evidence alanları dolmuştur; ancak bir geliştiricinin görevi tamamladıktan sonra kanıtı nasıl güncelleyeceği, hangi formatta yazacağı ve güncellenmiş verinin siteye nasıl yansıyacağı tarif edilmemektedir. Plan tek yönlü bir belgedir: planlama → görev ataması. Gerçekleşme → plana geri yansıma döngüsü işlemez durumdadır.

### 3e. Görev ile Kod Arasında Semantik Sözleşme Yok

Bir görev düğümünün gerçekte hangi kaynak dosyasına, hangi modüle veya hangi servis sözleşmesine karşılık geldiği belirsizdir. platform-customer-graphql düğümü bir JSON varlığıdır; ancak bu varlığın platform monoreposundaki platform/apps/customer/graphql/ diziniyle olan bağlantısını tanımlayan hiçbir sözleşme belgesi yoktur. Bu durum, iki farklı geliştiricinin aynı görev için farklı dosya yolları açmasına zemin hazırlar.

---

## 4. En Kritik Boşluk: Kernel/Core Hayalet Bağımlılık

437 düğümün büyük çoğunluğu platform-auth, platform-db, platform-tenancy ve platform-factory modüllerine bağımlıdır. Bu dört modül bir Core Contract oluşturmaktadır; AppBase, JWTMiddleware, AppFactory.bootstrap() ve TenantContext bunların somut arayüzleridir.

Söz konusu arayüzlerin hiçbiri için bağımsız bir kod iskeleti veya sözleşme belgesi bulunmamaktadır. Bir geliştirici platform-customer-graphql görevini almadan önce bu dört modülün en azından stub düzeyinde mevcut olması gerekir; aksi takdirde resolver yazmak, çalıştırmak ve test etmek imkansızdır. Tüm dikey dilimlerin bu hayalet bağımlılıkla bloke olduğu bir durumda 437 görevin kaçının gerçekten bağımsız olarak başlatılabileceği belirsizdir. Bu tek boşluk kapatılmadan diğer boşlukların kapatılmasının pratik getirisi sınırlıdır.

---

## 5. Çözülen Çelişki: İlk Dikey Dilim

Önceki iki rapor "ilk dilim nedir?" sorusunu farklı yanıtlamaktaydı: Claude raporu Customer'ı, ChatGPT raporu OrderOps'u öne çıkarıyordu. Kanonik karar şudur:

- **İlk dikey dilim:** Customer (auth → DB → GraphQL → UI zincirinin tam referans implementasyonu)
- **OrderOps'un rolü:** Öğretici örnek — ikinci dilim olarak, CustomerApp'in nasıl genişletileceğini gösteren rehber

Bu karar platform-factory.json içindeki "Customer dikey dilimi referans implementasyonu" notuna ve AppFactory dokümantasyonundaki "CustomerApp, AppFactory'den türer... yeni dikey eklenirken bu referans kopyalanarak 5 dosya değişikliğiyle iskelet tamamlanır" ifadesine dayanmaktadır. İki rapor arasındaki çelişki kapatılmıştır; OrderOps bir rakip "ilk dilim" değildir.

---

## 6. Unknown-Unknowns — Birleşik Liste

Aşağıdaki 14 madde her iki raporun unknown-unknown listelerinin tekrarsız birleşimidir.

| # | Bilinmeyen | Açıklama |
|---|---|---|
| 1 | Repo konumu | Hangi repo klonlanacak? Platform monorepo kararı alınmış; ancak URL, dizin yapısı ve erişim izni siteye bakarak anlaşılmıyor. |
| 2 | "Seviye" ve "kodlama" anlamı | Düğümlerdeki seviye ve effort-coding alanlarının kod organizasyonuyla veya sprint planlamasıyla ilişkisi belgesiz. |
| 3 | Prompt ile gereksinim karışması | Prompt alanı bazen teknik gereksinim, bazen içerik üretim talimatı gibi davranıyor; hangi promptun gereksinim, hangisinin üretim talimatı olduğu ayrışmıyor. |
| 4 | Core/Kernel iskeleti yok | platform-auth, platform-db, platform-tenancy, platform-factory stub'ları olmadan hiçbir dikey dilim başlatılamaz. |
| 5 | Export formatı agent sözleşmesi değil | JSON/CSV export özellikleri listeleniyor; ancak bu formatların bir AI agent veya CI pipeline tarafından okunacak şekilde bir sözleşmeye bağlandığına dair belge yok. |
| 6 | DoR (Definition of Ready) yok | Bir görevin "başlanabilir" sayılabilmesi için hangi koşulların sağlanması gerektiği tanımlanmamış. |
| 7 | Evidence geri-yazma ritüeli yok | Evidence alanı var; ancak kim, ne zaman, hangi formatta güncelleyecek ve güncelleme PR mı gerektiriyor yoksa doğrudan push mu yapılabilecek belirsiz. |
| 8 | Deep-link durumu bilinmiyor | Sitenin bir görev sayfasına verilen doğrudan bağlantının SPA routing altında 404 döndürüp döndürmediği, ve eğer döndürüyorsa hangi koşullarda bu olduğu test edilmemiş. |
| 9 | "Bugün ne yapmalıyım?" kuyruğu yok | Bir geliştirici sabah siteye geldiğinde sıradaki görevi belirleyecek bir önceliklendirme veya kuyruk mekanizması bulunmuyor. |
| 10 | Ekipler gerçek GitHub aktörlerle eşleşmiyor | Owner alanları dolu; ancak bu sahiplik bilgisinin CODEOWNERS dosyasıyla veya GitHub ekipleriyle nasıl ilişkilendirileceği tanımlanmamış. |
| 11 | Modül bağımlılığı ile kod bağımlılığı eşlenmemiş | Düğümler arası refs ve deps ilişkileri JSON'da tanımlı; ancak bu ilişkilerin package.json peerDependencies veya import grafı ile nasıl eşleştiği belgesiz. |
| 12 | 50+ uygulama dalga planı yok | Platform 50+ uygulamayı hedefliyor; ancak hangi uygulamaların hangi sırayla hayata geçirileceği, her dalganın enterprise-ready eşiğinin ne olduğu tanımlanmamış. |
| 13 | Uygulama bazlı enterprise-ready durum makinesi yok | Her uygulama için "plan → iskelet → alpha → beta → production" adımlarının ve geçiş koşullarının belgesiz olması, 50+ uygulama senaryosunda izlemeyi olanaksız kılıyor. |
| 14 | İlk gün rehberi yok | Yeni bir geliştiricinin repo kurulumundan ilk PR'a kadar geçen adımları anlatan bir "first-day guide" hiçbir yerde yok. |

---

## 7. Kapatma Planı

Aşağıdaki belgeler ve mekanizmalar bu boşlukları kapatacaktır. Her satır bir veya daha fazla boşluğu hedefler.

### 7a. Yeni Belgeler

| Belge | Kapatılan Boşluklar |
|---|---|
| `docs/developer-guide.md` | 1, 3, 14 — repo URL, ortam kurulumu, ilk gün rehberi |
| `docs/task-to-code-contract.md` | 5, 11 — görev ile kaynak kod yolu eşlemesi, modül-bağımlılık sözleşmesi |
| `docs/core-contract-pack.md` | 4 — AppBase, JWTMiddleware, AppFactory, TenantContext stub arayüzleri |
| `docs/task-export-contract.md` | 5 — JSON/CSV export formatı makine-okunabilir sözleşmesi |
| `docs/ready-for-dev-gate.md` | 6 — Definition of Ready koşulları |
| `docs/evidence-update-runbook.md` | 7 — evidence güncelleme adımları, format, PR zorunluluğu |

### 7b. Yeni CI Kapısı

`check-ready-for-dev` kapısı, bir görev düğümünün "başlanabilir" sayılabilmesi için aşağıdaki koşulları kontrol eder:

- Core Contract bağımlılıkları (platform-auth, platform-db, platform-tenancy, platform-factory) için en az stub-level dosya varlığı
- task-to-code-contract.md'deki modül yolu eşlemesinin geçerli bir dizine işaret etmesi
- DoR koşullarının sağlandığının onaylanmış olması

### 7c. UI Paneli

Görev detay sayfasına "Şimdi Ne Yapılır?" başlıklı bir panel eklenmesi hedeflenmektedir. Bu panel şu bilgileri içerecektir:

- İlgili kaynak dosya yolu veya modül dizini
- Çalıştırılacak test komutu
- PR açılmadan önce geçmesi gereken kapılar
- Tamamlanınca güncellenmesi gereken evidence alanı ve format rehberi

### 7d. Dalga Planı (50+ Uygulama)

| Dalga | Kapsam | Giriş Koşulu | Çıkış Eşiği |
|---|---|---|---|
| Wave 0 | platform core + Customer referans | Core Contract tamalandı | Customer production'da, tüm kapılar yeşil, evidence dolu |
| Wave 1 | 3 uygulama (AppFactory türevleri) | CustomerApp referansı kopyalanabilir | 3 app için alpha kanıtı |
| Wave 2 | 10 uygulama | Wave 1 kapıları geçti | Her app için enterprise-ready skor >= 3.0 |
| Wave 3 | 25 uygulama | Wave 2 production kanıtı | Otonom smoke test döngüsü çalışıyor |
| Wave 4 | 50+ uygulama | Wave 3 dalga planı stabil | Her app için durum makinesi eksiksiz izleniyor |

Her dalganın geçiş koşulu production evidence içermelidir; yalnızca "plan tamamlandı" veya "kod yazıldı" yeterli sayılmaz.

---

## 8. Sonuç

Plan, bir ürün geliştirme sürecinin "ne" boyutunu kapsamlı biçimde belgelemektedir. "Nasıl" boyutundaki boşluk üç katmanda kendini göstermektedir: (a) görevi alıp kodu teslim etme döngüsü yazılı değil, (b) Core Contract iskeleti kod olarak mevcut değil, (c) görev-kod semantik eşlemesi tanımlanmamış. Bu üç boşluk kapatılmadan 437 düğümün kaçının bağımsız olarak başlatılabileceği belirsiz kalmaya devam edecektir.

İki LLM raporu arasındaki tek gerçek çelişki olan "ilk dilim" sorusu çözülmüştür: Customer dikey dilimi kanonik referanstır, OrderOps öğretici örnektir. Bunun dışında raporlar birbirini tamamlamaktadır; metrik tutarsızlıkları ise merge öncesi veri kullanımından kaynaklanmaktaydı ve artık geçerli değildir.

---

*Bu belge, actionplan projesindeki DX serisinin (DX1-DX5) başlangıç noktasını oluşturmaktadır. Kapatma planındaki belgeler DX1, kapı DX2 kapsamında üretilecektir.*
