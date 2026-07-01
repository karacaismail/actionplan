# 05 — c13n Kanonikleştirme Standardı (Canonicalization)

Sürüm: 1.0 — 2026-07-01
Aile (`family`): `data` · Öncelik: P1 · Zorunluluk tabanı: `must`
Makine kontratı: `src/data/standards/c13n.json` (PLANLANDI — bu anlatı ile aynı PR'da merge edilir; `plan-02` PROMPT 3)
CI kapısı (hedef): `check-data-quality`
Tüketen primitifler: `k-schema` (`plan-03` §3.4 girdi alanları), `k-computation` (türetilmiş alanlar kanonik girdiden hesaplanır)

Bu doküman anlatı standardıdır: `c13n.json` makine-sözleşmesini *anlatır*, kuralın değerini yeniden tanımlamaz. Bir kural değişince yalnız JSON güncellenir; bu anlatı aynı sözleşmeyi işaret ettiği için tutarlı kalır (`00-standards-index.md` §1 "Reference, Don't Duplicate").

---

## 1. Numeronym ve Kapsam

Bu bölüm kısaltmayı açar ve standardın hangi soruyu cevapladığını tek cümlede verir.

c13n = "c" + 11 harf + "n" = *canonicalization* (kanonikleştirme). Kanonikleştirme, aynı anlamı taşıyan farklı biçimlerdeki bir değeri (ör. `E-Posta@Firma.COM` ile `eposta@firma.com`) tek, belirlenmiş, tekrar-üretilebilir bir *kanonik biçime* indirgeme disiplinidir. Standardın cevapladığı soru şudur: "iki kayıt aslında aynı gerçek-dünya varlığını mı gösteriyor?" — ve bu soru veritabanına ulaşmadan, girdi sınırında, deterministik biçimde cevaplanır.

Kapsam şu değerleri içerir: slug, URL, Unicode metin (NFC), e-posta, telefon (E.164), SKU ve ürün-varyant anahtarı. Kapsam DIŞI: serbest-metin arama normalizasyonu (bu `n6n` standardının konusu), para/vergi hesabı (bu `k-computation` primitifi), dil-çevirisi (bu `i18n-standards`).

---

## 2. Kanonikleştirme ile Normalizasyon Ayrımı (Sınır)

Bu bölüm c13n'i komşu standart n6n'den ayırır; ikisi karıştırılırsa aynı kural iki dosyada farklılaşır.

Kanonikleştirme (c13n) *kimlik* üretir: "bu değerin biricik biçimi nedir?" — çıktı bir eşitlik/tekillik anahtarıdır (slug, E.164 telefon, NFC metin). Normalizasyon (n6n) *disiplin* uygular: "bu değer hangi kurala göre temizlenir/parçalanır?" — çıktı depolamaya uygun, ilişkisel olarak bölünmüş veridir (3NF). c13n bir *fonksiyonun çıktısının biricikliğini* garanti eder; n6n bir *şemanın biçimini* garanti eder. Aşağıdaki kural şu şekilde uygulanır: bir alanın hem kanonik biçimi hem de duplicate-tespiti gerekiyorsa c13n; yalnız temizlik/ayrıştırma gerekiyorsa n6n devreye girer. `d10n` (denormalizasyon) ise `06-data-normalization-standard.md`'nin ikinci yarısıdır.

---

## 3. Çekirdek İlke — Idempotent Kanonik Fonksiyon

Bu bölüm tüm kanonikleştirmenin uyduğu tek matematiksel invariantı verir.

Her kanonik fonksiyon `canonicalize()` idempotent uygulanır: `canonicalize(canonicalize(x)) == canonicalize(x)`. Yani bir değeri iki kez kanonikleştirmek, bir kez kanonikleştirmekle aynı sonucu üretir. Bu invariant CI'da her kanonik fonksiyon için birim testi ile zorlanır; testi olmayan kanonik fonksiyon merge edilmez. İkinci invariant deterministiklik: aynı girdi, çalışma zamanından/locale'den/makineden bağımsız aynı çıktıyı üretir (kanonikleştirme locale-bağımsızdır; locale-bağımlı biçimleme `i18n-standards`'ın işidir). Backend'de fonksiyonlar `platform/kernel/canonical/` altında saf-fonksiyon olarak yaşar; frontend aynı kuralın *önizlemesini* (input mask) yapar ama kanonik biçimin tek doğruluk kaynağı backend'dir.

---

## 4. Slug Kanonikleştirme

Bu bölüm insan-okunur URL parçası olan slug'ın nasıl üretileceğini tanımlar.

Slug şu şekilde uygulanır: NFC normalize → küçük harfe indir (Unicode-aware, Türkçe `İ/ı` özel durumu dahil) → aksan/diakritik ayrıştır ve ASCII'ye indir (`ç→c`, `ğ→g`, `ş→s`) → alfanümerik olmayan her diziyi tek `-` ile değiştir → baş/son `-` kırp → azami uzunluğa (varsayılan 80) kes. Boş slug yasaktır; kaynak metin boşsa entity kimliğinden (UUID kısaltması) türetilir. Slug bir tenant içinde biriciktir; çakışmada sayısal sonek (`-2`, `-3`) eklenir, bu sonek de kanonik fonksiyonun parçasıdır. FastAPI tarafında `slugify(text: str) -> str` saf fonksiyondur; React tarafında kullanıcı yazarken canlı önizleme gösterilir ama gönderilen değer sunucuda yeniden kanonikleştirilir.

---

## 5. URL Kanonikleştirme

Bu bölüm iki farklı yazımın aynı kaynağa işaret ettiğini tespit etmek için URL'in kanonik biçimini tanımlar.

URL kanonikleştirme şu şekilde uygulanır: şemayı küçük harfe indir (`HTTPS→https`), host'u küçük harfe indir ve IDN/punycode'a çevir (`örnek.com→xn--rnek-...`), varsayılan portu kaldır (`:443` https'te, `:80` http'te), yol segmentlerinde `.`/`..` çöz, yüzde-kodlamayı büyük harfe normalize et (`%3a→%3A`), izlenmesi anlamsız takip parametrelerini (allowlist dışı `utm_*`) at, sorgu parametrelerini anahtar-sırasına diz, son `/` kuralını sabitle (kök hariç kaldır). Kanonik URL bir `check` sütununda saklanır; kullanıcı-girdili URL'ler bu fonksiyondan geçmeden karşılaştırılmaz. Açık-yönlendirme (open-redirect) riskine karşı yalnız allowlist şemalar (`https`, `mailto`, `tel`) kanonikleştirilir; `javascript:`/`data:` reddedilir.

---

## 6. Unicode Metin Kanonikleştirme (NFC)

Bu bölüm görsel olarak aynı ama byte olarak farklı metinlerin eşit sayılmasını sağlar.

Tüm kullanıcı-girdili metin depolama öncesi NFC (Normalization Form C, birleşik) biçimine indirgenir; sistem-genelinde tek normalizasyon formu NFC'dir ve NFD/NFKC karışımı yasaktır. Bunun nedeni `é` karakterinin iki ayrı byte dizisiyle (tek kod noktası U+00E9 veya `e`+birleştirici-aksan U+0301) yazılabilmesi ve NFC olmadan bu iki dizinin `==` karşılaştırmasında farklı görünmesidir. Kimlik/eşitlik amaçlı alanlarda (slug, kullanıcı-adı, arama anahtarı) ek olarak durum-katlama (case-fold) ve sıfır-genişlik karakter (U+200B) temizliği uygulanır. FastAPI'de `unicodedata.normalize("NFC", s)` sınır katmanında (Pydantic validator) çağrılır; PostgreSQL kolonları NFC-normalize veri saklar ve gerekli görülen kolonlarda `CHECK` ile NFC-eşitliği doğrulanır.

---

## 7. E-posta Kanonikleştirme

Bu bölüm aynı posta kutusuna işaret eden farklı yazımların tek kimliğe indirgenmesini tanımlar.

E-posta kanonikleştirme şu şekilde uygulanır: baş/son boşluk kırp → NFC normalize → yerel-parça (`@` öncesi) ile alan-parçası (`@` sonrası) ayır → alan-parçasını küçük harfe indir ve IDN'e çevir → yerel-parçayı RFC'ye uygun biçimde (varsayılan: alan-parçası küçük harfe indirilir, yerel-parça büyük-küçük harf korunur çünkü RFC 5321 yerel-parçayı büyük-küçük harf duyarlı sayar). Sağlayıcı-özel eşitleme (Gmail `.` yoksayma, `+etiket` ayırma) yalnız *duplicate-tespiti* için ayrı bir `email_identity_key` kolonunda tutulur; kullanıcının kayıtlı adresi (gönderim için) asıl biçimiyle saklanır. Böylece hem kimlik-eşitliği kurulur hem de gönderilebilir adres korunur. Doğrulama (geçerli mi?) `n6n` normalizasyonunun değil, sınır-validasyonunun (Pydantic `EmailStr`) işidir; c13n yalnız kanonik anahtarı üretir.

---

## 8. Telefon Kanonikleştirme (E.164)

Bu bölüm uluslararası telefon numarasının biricik depolama biçimini tanımlar.

Telefon numaraları E.164 biçiminde (`+` + ülke kodu + abone numarası, boşluksuz, azami 15 hane) kanonikleştirilir ve DB'de bu biçimde saklanır. Kanonikleştirme şu şekilde uygulanır: görünüm karakterlerini (boşluk, `-`, `(`, `)`, `/`) at → baştaki `00` uluslararası önekini `+`'a çevir → ülke kodu yoksa tenant/kullanıcı varsayılan bölgesinden tamamla → E.164 doğrulaması yap. Ayrıştırma güvenilir bir kütüphane (ör. `phonenumbers`, libphonenumber) ile yapılır; elle regex ile ülke-kodu tahmini yasaktır çünkü numara planları ülkeye göre değişir. Görüntüleme biçimi (ulusal/uluslararası) locale'e göre `i18n` katmanında üretilir; depolama daima E.164'tür. React tarafında giriş maskesi ülke seçimine göre önizleme verir, gönderilen değer sunucuda E.164'e indirilir.

---

## 9. SKU ve Ürün-Varyant Kanonikleştirme

Bu bölüm ürün stok-kodunun ve varyant-anahtarının biricikliğini tanımlar.

SKU kanonikleştirme şu şekilde uygulanır: NFC normalize → boşlukları kırp → izin-verilen karakter kümesine (büyük harf, rakam, `-`, `_`) indir → büyük harfe çevir (SKU kimlik-eşitliği büyük-küçük harf duyarsızdır) → tenant içinde biricik. Ürün-varyant anahtarı, varyant-eksenlerinin (renk, beden, materyal) *sıralı* ve *kanonik* birleşiminden üretilir: eksen adları kanonik sıraya dizilir, her değer kendi kanonik biçimine indirilir, sonra deterministik biçimde (ör. `color=black|size=l`) birleştirilir. Böylece `Size=L, Color=Black` ile `color=black, size=l` aynı varyant-anahtarını üretir ve çift-varyant oluşmaz. Bu birleşik anahtar `k-schema` alan-tanımına referans verir; varyant-eksenleri koda gömülmez, veridir.

---

## 10. Duplicate Tespiti

Bu bölüm kanonik biçimin duplicate-önlemede nasıl kullanıldığını tanımlar.

Duplicate tespiti şu şekilde uygulanır: her duplicate-hassas varlık için bir *kanonik kimlik anahtarı* kolonu (`canonical_key`) tanımlanır, bu kolon ilgili c13n fonksiyonunun çıktısını saklar ve üzerinde bir `UNIQUE` kısıtı bulunur. Böylece iki kayıt aynı kanonik anahtara indirgeniyorsa ikincisi veritabanı düzeyinde reddedilir — kontrol yalnız uygulama katmanı `if exists` sorgusuna bırakılmaz (yarış durumunda çift kayıt açar). Tenant-kapsamlı varlıklar için biriciklik `(tenant_id, canonical_key)` bileşiğidir. "Aynı mı?" kararı bulanık-eşleşme (fuzzy) değil, kanonik-eşitlik temellidir; bulanık öneri (ör. "şuna benziyor") ayrı bir arama katmanının işidir ve kimlik kararı vermez.

---

## 11. Veritabanı Kısıtları (UNIQUE / CHECK)

Bu bölüm kanonik biçimin veritabanı düzeyinde nasıl zorlandığını tanımlar.

Kısıtlar şu şekilde uygulanır: (1) her `canonical_key`/slug/E.164/SKU kolonuna `UNIQUE` (tenant-kapsamlıysa bileşik) kısıt; (2) biçim-invariantı için `CHECK` kısıtı (ör. telefon kolonunda `phone ~ '^\+[1-9][0-9]{6,14}$'`, slug kolonunda küçük-harf-ve-tire regex'i); (3) case-insensitive eşitlik gerektiğinde kolon zaten kanonik-küçük-harf sakladığı için ek `LOWER()` fonksiyonel indeksine gerek kalmaz — kanonik biçim depolamada sabittir. Uygulama katmanı kanonik fonksiyonu *çağırmayı unutursa* `CHECK` kısıtı yazımı reddeder; böylece veritabanı son savunma hattıdır. PostgreSQL `citext` yerine "depola-kanonik" tercih edilir çünkü kanonik biçim tek ve öngörülebilir olur (drift yok).

---

## 12. Migration Stratejisi (Expand-Contract)

Bu bölüm mevcut kirli veriye kanonikleştirme eklerken sıfır-kesinti sağlayan sırayı tanımlar.

Kanonik kolon/kısıt ekleme, `data-api-contract` standardının expand-contract kuralıyla aynı şekilde uygulanır: (1) *expand* — yeni `canonical_key` kolonu nullable eklenir, geri-dolum (backfill) migration'ı mevcut satırları kanonikleştirir, uygulama hem eski hem yeni yola yazar; (2) *çakışma çözümü* — backfill sırasında ortaya çıkan mevcut duplicate'ler bir rapora düşürülür ve insan kararıyla birleştirilir (kör silme yasak); (3) *contract* — duplicate'ler temizlendikten sonra ayrı bir migration `NOT NULL` + `UNIQUE` kısıtını ekler ve eski yol kaldırılır. Her migration'ın çalışan bir `down` (rollback) yolu ve idempotent olması zorunludur. Yıkıcı adım (`NOT NULL`, `UNIQUE`) asla expand fazında konmaz; aksi halde geri-dolum bitmeden çalışan eski sürüm kırılır.

---

## 13. Stack Karşılığı (FastAPI + SQLAlchemy + React)

Bu bölüm standardın somut teknoloji karşılıklarını tek yerde toplar.

Aşağıdaki tablo her c13n konusunun backend, veritabanı ve frontend karşılığını verir; kanonik biçimin tek doğruluk kaynağının daima backend olduğuna dikkat edilir.

| Konu | FastAPI / SQLAlchemy | PostgreSQL | React |
|---|---|---|---|
| Kanonik fonksiyon | `platform/kernel/canonical/` saf fonksiyon + Pydantic validator | — | input mask (önizleme, doğruluk-kaynağı değil) |
| Slug | `slugify()` + tenant-biricik sonek | `UNIQUE(tenant_id, slug)` + `CHECK` regex | canlı slug önizleme |
| URL | `canonicalize_url()` allowlist şema | kanonik-URL `check` kolonu | URL alan doğrulaması |
| Unicode NFC | `unicodedata.normalize("NFC")` sınırda | NFC-veri + gerekli kolonda `CHECK` | — (backend zorlar) |
| E-posta | ayrıştır + `email_identity_key` | `UNIQUE(email_identity_key)`, gönderim adresi ayrı | `EmailStr` sınır doğrulaması |
| Telefon | `phonenumbers` → E.164 | `CHECK ~ '^\+[1-9][0-9]{6,14}$'` | ülke-maskeli giriş |
| SKU / varyant | `canonicalize_sku()` + sıralı varyant anahtarı | `UNIQUE(tenant_id, sku)` | SKU giriş normalizasyonu |
| Duplicate | `canonical_key` üretimi | `UNIQUE` bileşik kısıt | çakışma uyarısı gösterimi |
| Migration | Alembic expand-contract + backfill | nullable→backfill→`NOT NULL`+`UNIQUE` | — |

---

## 14. Test Stratejisi

Bu bölüm standardın yeşil sayılma koşullarını test tipine göre listeler.

Test şu şekilde uygulanır: (1) *birim* — her kanonik fonksiyon için idempotentlik testi (`f(f(x))==f(x)`) ve deterministiklik testi (locale'den bağımsız aynı çıktı) zorunludur; ayrıca sınır-durum tablosu (boş girdi, Türkçe `İ/ı`, aksanlı harf, karışık büyük-küçük, NFD girdi). (2) *entegrasyon* — duplicate kayıt denemesinin veritabanı `UNIQUE`/`CHECK` kısıtına takılması (uygulama `if exists` atlanmış olsa dahi). (3) *migration* — backfill'in mevcut kirli veriyi doğru kanonikleştirdiği, `down` migration'ının çalıştığı, expand fazında yıkıcı kısıt olmadığı. (4) *concurrency* — aynı kanonik anahtarla eşzamanlı iki yazımdan yalnız birinin başarılı olması. Testi gate'i "geçsin diye" zayıflatmak (ör. idempotentlik assert'ini kaldırmak) standardı düşürmektir ve yasaktır.

---

## 15. Requirement-ID Tablosu

Bu bölüm standardın her kuralını izlenebilir bir kimlikle, uygulama katmanı, öncelik, test tipi ve kabul kriteriyle birlikte listeler; makine kontratındaki `rules[].id` alanları bu kimliklerle hizalanır.

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| C13N-01 | Her kanonik fonksiyon idempotent uygulanır (`f(f(x))==f(x)`) | Backend | P1 | Unit | İdempotentlik testi tüm kanonik fonksiyonlar için yeşil | Platform Kernel |
| C13N-02 | Kanonik fonksiyon deterministiktir; locale/makine bağımsız aynı çıktı | Backend | P1 | Unit | Farklı locale'de aynı girdi aynı çıktıyı verir | Platform Kernel |
| C13N-03 | Slug NFC→küçük-harf→ASCII-fold→tire; tenant-biricik | Backend/DB | P1 | Unit+Integration | Slug regex `CHECK` + `UNIQUE(tenant_id, slug)` zorlar | Platform Kernel |
| C13N-04 | URL yalnız allowlist şema (`https/mailto/tel`) ile kanonikleştirilir | Backend | P1 | Unit | `javascript:`/`data:` reddedilir; utm_* atılır | Platform Kernel |
| C13N-05 | Tüm kullanıcı metni depolama öncesi NFC'ye indirgenir | Backend/DB | P1 | Unit+Integration | NFD girdi NFC olarak saklanır; gerekli kolonda `CHECK` | Platform Kernel |
| C13N-06 | E-posta kimlik-anahtarı (`email_identity_key`) ayrı kolonda kanonikleşir | Backend/DB | P1 | Integration | Gönderim adresi korunur; kimlik-anahtarı biricik | Platform Kernel |
| C13N-07 | Telefon E.164 biçiminde saklanır; kütüphane ile ayrıştırılır | Backend/DB | P1 | Unit+Integration | `CHECK ~ '^\+[1-9][0-9]{6,14}$'`; regex-tahmin yasak | Platform Kernel |
| C13N-08 | SKU büyük-harf-kanonik; varyant-anahtarı sıralı-eksen birleşimi | Backend/DB | P1 | Unit | Farklı eksen sırası aynı varyant-anahtarını üretir | Commerce |
| C13N-09 | Duplicate kararı kanonik-eşitlik temelli; DB `UNIQUE` kısıtıyla zorlanır | DB | P1 | Integration | Uygulama `if exists` atlansa da ikinci kayıt reddedilir | Platform Kernel |
| C13N-10 | Her kanonik/anahtar kolonda `UNIQUE` + biçim `CHECK` kısıtı bulunur | DB | P1 | Integration | Kanonik-dışı yazım DB düzeyinde reddedilir | Platform Kernel |
| C13N-11 | Kanonik kolon/kısıt eklenmesi expand-contract ile yapılır | DB/Migration | P1 | Migration | Backfill→duplicate-rapor→`NOT NULL`+`UNIQUE`; `down` çalışır | Platform Kernel |
| C13N-12 | Kanonik biçimin tek doğruluk kaynağı backend; frontend yalnız önizler | Backend/Frontend | P2 | Integration | Frontend-atlatılmış istek yine kanonikleştirilir | Platform Kernel |
| C13N-13 | Duplicate backfill kör-silmez; çakışma insan onayıyla birleştirilir | Backend/Migration | P2 | Migration | Backfill mevcut duplicate'leri rapora düşürür, silmez | Platform Kernel |
