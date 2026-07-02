# Vibecoding Prompt Playbook — 60+ Yaş / 3 Kişilik Ekip için Kanıt-Zorlayan AI Üretim Rehberi

**Sürüm:** 1.0 · **Tarih:** 2026-07-02
**Durum:** Operasyonel geliştirici rehberi (playbook). Kod yazmaz; bir 60+ yaş, üç kişilik ekibin Claude/Cursor ile üretim yaparken **ne yapıştıracağını, hangi dosyanın oluşması gerektiğini, hangi testin yeşile döneceğini, AI'ı ne zaman reddedeceğini** adım adım tanımlar. P1 eleştiri #10 (60+ Vibecoding Prompt Playbook) karşılığı.
**Kime:** actionplan WBS düğümlerini `platform` monoreposunda gerçek koda çeviren, kalabalık olmayan, "AI kod yazsın ama biz kontrol edelim" diyen küçük ekip.
**Kaynak/bağlam (REFERANS — kopyalama):** `docs/prompt-template-library.md` (14 boyut prompt iskeleti — yapıştırılacak prompt deseni buradan gelir), `docs/dod-evidence-schema-directive.md` (yüksek-risk DoD + kanıt + sahte-yeşil tespiti + reddetme ritüeli — kanıt ve red kuralları buraya bağlanır), `docs/task-to-code-contract.md` (seviye→teslimat, faz→eylem, Customer dikey dilimi — hangi seviyede ne teslim edildiği buradan gelir).
**İlişki:** Bu doküman üç kanonik sözleşmenin **operasyonel yüzüdür**. `prompt-template-library.md` "boyut promptu nasıl yazılır?", `dod-evidence-schema-directive.md` "kanıt yeterli mi, AI çıktısı sahte-yeşil mi?", `task-to-code-contract.md` "bu seviye ne teslim eder?" sorularını yanıtlar; bu playbook üçünü tek bir **çalışma bloğu** halinde birleştirir: bir görev için AI'a ne yapıştırılır, ne beklenir, nasıl reddedilir. Üçüyle çelişmez; çelişki çıkarsa kaynak sözleşme kazanır (özellikle `task-to-code-contract.md` kanoniktir).

---

## 1. Amaç

Bu playbook, 60+ yaş üç kişilik bir ekibin AI (Claude/Cursor) ile üretim yaparken "AI çalıştı gibi görünüyor, herhalde bitti" tuzağına düşmemesini sağlar. Küçük ve deneyimli ama kalabalık olmayan bir ekip için tek gerçek kaldıraç, her AI çıktısını **açılıp doğrulanabilir bir artefakta** bağlamaktır: kod, dosya, test çalıştırma kaydı, ekran. "Anladım" veya "anlatabilirim" yetmez; her görev bloğu sonunda ölçülebilir bir çıktı bulunmalıdır. Aktör-açık ifade: *AI* kodu, testi ve kanıt taslağını **önerir**; *insan (ekip üyesi)* çıktıyı açar, testin kırmızıdan yeşile döndüğünü görür, ekranı kontrol eder ve **onaylar**; *CI* (actionplan tarafında `check-data-quality.mjs`, `platform` tarafında faz kapıları ve `check-dod-evidence`) kanıtın varlığını zorlar. AI kendi çıktısını "bitti" ilan **edemez** — bitti kararı, kanıt + insan onayıyla verilir.

## 2. Kapsam

Bu playbook şunları kapsar: (1) playbook ilkesi — her modül/ünite sonunda ölçülebilir artefakt (§4); (2) her görev bloğunu bitiren altı-parçalı şablon — yapıştır → dosyalar → test yeşil → negatif test kırmızı→yeşil → manuel kontrol → reddet (§5); (3) örnek domain sürekliliği — aynı Customer→Order örneği u01'den u08'e büyür, artefakt kopmaz (§6); (4) beş tam worked playbook bloğu (gerçek prompt + beklenen dosya + test + negatif test + manuel kontrol + reddetme) (§7–§11); (5) reddetme ritüeli — AI çıktısı "çalışıyor gibi ama yanlış" olduğunda 60+ ekip nasıl reddeder, checklist `dod-evidence-schema-directive.md §9`'a bağlı (§12); (6) reconcile — üç kaynak sözleşmeyle referanslı uzlaşma (§13); (7) AI guardrail — playbook AI'ı yönlendirir ama insan-onay + kanıt zorunlu (§14). Stack, seviye eşlemesi ve kabul kriterleri ilgili bölümlerdedir.

## 3. Non-goals

Bu playbook şunları **kapsamaz**: (1) Yeni prompt iskeleti tanımlamaz — prompt gövdesi `prompt-template-library.md §1`'in beş-blok deseninden gelir; bu doküman o iskeleti "yapıştırılabilir görev promptu"na uyarlar, yeniden yazmaz. (2) Yeni kanıt türü veya yeni reddetme kuralı icat etmez — kanıt/red kuralları `dod-evidence-schema-directive.md §5–§9`'da yaşar; bu doküman onları operasyonel bloğa **çağırır**. (3) Yeni seviye/faz/teslimat anlamı tanımlamaz — seviye→teslimat `task-to-code-contract.md §1`'de kanoniktir; bu doküman ona **uyar**. (4) Stack seçmez veya değiştirmez — actionplan/platform stack'i sabittir (FastAPI, SQLAlchemy/SQLModel, Alembic, GraphQL, React, Playwright, pytest, PostgreSQL RLS). **Next.js, Supabase, Prisma bu depoda yasaktır ve bu playbook'ta hiçbir örnek onları kullanmaz.** (5) Generator, git komutu veya CI kapısı kodu üretmez — makine-okunur karşılıklar ilgili sözleşmelerde tanımlıdır; bu doküman yalnız playbook metnidir. (6) AI'a "bitti" deme yetkisi vermez — bitti kararı §14'teki iş bölümüne tabidir.

## 4. Playbook İlkesi — Her Ünite Sonunda Ölçülebilir Artefakt

Bu playbook'un tek kuralı vardır: **bir ünite (u01, u02, …) "anladım" ile değil, açılabilir bir artefaktla biter.** 60+ ekibin en büyük riski, AI'ın akıcı diliyle "iş bitmiş gibi hissettirmesi"dir; oysa akıcı açıklama artefakt değildir. Her ünite, aşağıdaki tabloda tanımlı en az bir ölçülebilir çıktıyı üretmeden kapanmaz.

Aşağıdaki tablo, "artefakt sayılan" ve "artefakt SAYILMAYAN" çıktıları karşılaştırır; sol sütun kabul edilir (açılıp doğrulanabilir), sağ sütun reddedilir (yalnız iddia). Bu ayrım `dod-evidence-schema-directive.md §9 madde 1` (kanıt açılabilir mi?) ile birebir aynıdır; playbook onu ünite düzeyine uygular.

| Artefakt SAYILIR (kabul) | Artefakt SAYILMAZ (red) |
|---|---|
| `platform/backend/...` altında commit edilmiş kod dosyası (yol verilebilir) | "Kodu yazdım, çalışıyor" cümlesi (dosya yok) |
| Kırmızıdan yeşile döndüğü kaydedilen test çalıştırması (pytest/Vitest/Playwright logu) | "Test yazdım ve yeşildi" (kırmızı-önce kaydı yok) |
| Negatif testin önce kırmızı, implementasyon sonrası yeşil olduğu geçiş kaydı | "Negatif durumu da düşündüm" (çalıştırma kaydı yok) |
| Manuel kontrol edilen ekranın gözlem notu (ne görüldü, hangi URL/route) | "Ekranda düzgün görünüyor" (hangi ekran, ne görüldü belirsiz) |
| actionplan düğümünde `evidence[]`'a yazılmış URL/dosya-yolu | actionplan düğümünde `status="done"` ama `evidence[]` boş |

İlke özeti: **her ünite bir artefakt bırakır; artefakt bir işarettir (dosya/log/URL/ekran-notu), akıcı bir cümle değildir.** Ünite artefaktsız kapanırsa, o ünite yapılmamış sayılır — AI ne kadar ikna edici konuşursa konuşsun. Bu, `task-to-code-contract.md §4` Evidence tablosunun ("metin iddiaları değil, URL veya dosya referansı") ünite düzeyindeki karşılığıdır.

## 5. Görev Bloğu Şablonu — Altı Parça (Her Blok Böyle Biter)

Bu playbook'taki her görev bloğu (§7–§11) tam olarak altı parçayla biter. Bu altı parça, AI'ı yönlendiren ama insanı ve kanıtı zorunlu tutan sabit iskelettir. Amaç: ekip üyesi bloğu okuyunca "ne yapıştıracağını, ne bekleyeceğini, ne zaman reddedeceğini" tahmin etmeden bilsin.

Aşağıdaki tablo altı parçayı, ne yaptığını, aktörünü ve hangi kaynak sözleşmeye bağlandığını tanımlar. Parça sırası zorunludur; alttaki parça (reddet) en son gelir çünkü ilk beş parçanın çıktısı üzerinde karar verir.

| # | Parça | Ne yapar | Aktör | Kaynak sözleşme bağı |
|---|---|---|---|---|
| 1 | **"Claude/Cursor'a yapıştır"** | Kopyalanabilir, bağlama-özgü prompt; AI'a ne üreteceğini söyler | İnsan yapıştırır, AI üretir | `prompt-template-library.md §1` beş-blok iskeleti |
| 2 | **"Şu dosyalar oluşmalı"** | Beklenen çıktı: hangi dosyalar hangi yolda oluşmalı | AI üretir, insan varlığını doğrular | `task-to-code-contract.md §1` seviye→teslimat |
| 3 | **"Şu test yeşil olmalı"** | Happy-path testi; komut + beklenen yeşil sonuç | İnsan çalıştırır, sonucu görür | `task-to-code-contract.md §4` Evidence (test logu) |
| 4 | **"Şu negatif test kırmızıdan yeşile dönmeli"** | Yanlış olanı reddeden test; önce kırmızı, sonra yeşil | İnsan geçişi görür ve kaydeder | `dod-evidence-schema-directive.md §6 Denetim 1` (kırmızı-önce) |
| 5 | **"Şu ekranı manuel kontrol et"** | Gözle görülecek ekran/route + ne gözleneceği | İnsan ekranı açar, gözlemler | `task-to-code-contract.md §4` test-qa/verification |
| 6 | **"AI şu hatayı yaparsa REDDET"** | Reddetme kriteri; bu blokta AI'ın en olası sahte-yeşili | İnsan reddeder, AI kanıt sunar | `dod-evidence-schema-directive.md §9` reddetme ritüeli |

Şablonun altın kuralı: **ilk beş parça AI'ı yönlendirir; altıncı parça insanı korur.** AI birinci parçadaki promptla üretir; ikinci–beşinci parçalarda insan artefaktları (dosya/test/negatif-test/ekran) açıp doğrular; altıncı parçada, bu bloğa özgü en olası "çalışıyor gibi ama yanlış" deseni verilir ve insan onu reddeder. Hiçbir blok altıncı parça olmadan bitmez — çünkü reddetme kriteri olmayan blok, AI'ın sahte-yeşilini geçirir.

## 6. Örnek Domain Sürekliliği — Customer→Order (u01 → u08)

Bu playbook tek bir örnek domain kullanır ve onu adım adım büyütür; örnek artefakt üniteler arasında **kopmaz**. Domain, `task-to-code-contract.md §7`'deki kanonik Customer dikey dilimiyle aynıdır ve ona bir `Order` archetype'ı eklenerek genişletilir. Böylece ekip her ünitede yeni bir örnek öğrenmez; aynı `Customer` ve `Order`'ın üzerine bir katman daha koyar. Bu süreklilik, 60+ ekibin bilişsel yükünü düşürür ve her ünitenin bir öncekinin artefaktını kullanmasını sağlar.

Aşağıdaki tablo sekiz üniteyi, her ünitenin seviye karşılığını (`task-to-code-contract.md §1`), ürettiği örnek artefaktı ve bir önceki üniteye bağını gösterir. Sürekliliğin kanıtı sağ sütundur: her ünite bir öncekinin çıktısını girdi alır.

| Ünite | Konu | Seviye (contract §1) | Ürettiği örnek artefakt | Önceki üniteye bağı |
|---|---|---|---|---|
| u01 | Kimlik / atomlar | atom / element | `CustomerId`, `Email`, `Money` atom tanımları + test-vektörleri | — (başlangıç) |
| u02 | CRUD | stone | `Customer` create/read/update servis metodu + testler | u01 atomlarını kullanır (`CustomerId`, `Email`) |
| u03 | ArcheType | archetype | `Customer` entity + GraphQL tipi + UI bileşen haritası | u02 servisini sözleşmeye projekte eder |
| u04 | Veritabanı | archetype (db-schema fazı) | `customers` tablosu Alembic migration + RLS + downgrade | u03 entity'sini tabloya bağlar |
| u05 | GraphQL API | archetype | `customer` query + `createCustomer` mutation resolver | u03/u04 üzerine API yüzeyi kurar |
| u06 | İlişki (Order) | archetype | `Order` entity + `customer_id` FK + `orders` migration | u04 `customers` tablosunu FK ile referans eder |
| u07 | Tenant izolasyonu | archetype (test-qa fazı) | cross-tenant negatif testler (≥10 case) + RLS kanıtı | u04/u06 tablolarına tenant sınırı uygular |
| u08 | UI + doğrulama | archetype (verification) | `Customer`/`Order` liste-form React ekranı + a11y kanıtı | u05 API'sini ve u03 bileşen haritasını tüketir |

Süreklilik özeti: **u01'in ürettiği `Money` atomu, u06'da `Order.total` alanında hâlâ yaşar; u04'ün `customers` tablosu u06'da `orders.customer_id` FK'siyle referans edilir.** Örnek kopmaz — bu, ekibin her ünitede "hangi Customer?" diye sormamasını ve artefaktların birbirine bağlanmasını sağlar. Aşağıdaki beş worked blok (§7–§11) bu ünitelerden seçilmiştir ve altı-parçalı şablonu (§5) tam uygular.

## 7. Worked Blok 1 — u01: Kimlik / Atom Tanımı (`Money` atomu)

Bu blok, örnek domainin ilk taşını koyar: `Money` atomu. `task-to-code-contract.md §1`'e göre atom seviyesi "en küçük bölünemez adım"dır ve üst kanıt yeterlidir, ama `Money` yüksek-risklidir (`dod-evidence-schema-directive.md §5` "para yazan" ekseni), bu yüzden negatif test ve kanıt zorunludur. Bu blok, "empty ≠ zero" ve "kur-karışımı" hatalarını yakalayan bir atomu üretir. Aktör: ekip üyesi promptu yapıştırır; AI atom + testi önerir; insan kırmızı→yeşil geçişini doğrular.

### 7.1 Claude/Cursor'a yapıştır

Aşağıdaki prompt `prompt-template-library.md §1` beş-blok iskeletini izler (Başlık / Bağlam / Çıktı / Güvenlik sınırı / Kapsa) ve `Money` atomuna uyarlanmıştır. Olduğu gibi kopyalanır:

```
"Money atomu" üret. Bu, platform-customer kümesinin en küçük para-taşıyan tipidir.
Bağlam: u01 — "Money atomu" (atom/en küçük bölünemez adım; küme: platform-customer).
Özet: Tutar + para birimi taşıyan değişmez değer tipi; Customer ve Order tarafından kullanılacak.
Etiketler: money, atom, immutable, high-risk.

Çıktı: Python. Bir Money değer tipi (dataclass/frozen) ve pytest testleri üret.
- Money(amount: Decimal, currency: str) — amount Decimal, currency ISO-4217 3 harf.
- Toplama: yalnız AYNI currency; farklı currency toplanırsa hata fırlat.
- Boş (None/eksik) ile sıfır (0) ayrı: empty != zero.
- Yuvarlama kuralı açık (banker's rounding değil, HALF_UP, 2 ondalık).
Generic ifade kullanma; her davranışı bu para tipinin gerçek kullanımına bağla.

Güvenlik sınırı: AI maliyeti önemsizdir; güvenlik önceliklidir.
AI app/module üretemez, app/module güncelleyemez, ruleset override edemez, doğrudan prod write yapamaz.

Kapsa: empty!=zero ayrımı, kur-karışımı reddi (farklı currency toplama hatası),
HALF_UP yuvarlama, negatif tutar davranışı. Stack: sadece Python + Decimal + pytest.
Next/Supabase/Prisma KULLANMA. Mock kullanma; gerçek Decimal ile test et.
```

### 7.2 Şu dosyalar oluşmalı

`task-to-code-contract.md §1`'e göre atom kod + test görevidir; beklenen çıktı iki dosyadır. AI bu iki dosyayı üretmeden blok bitmez:

- `platform/backend/domain/atoms/money.py` — `Money` frozen dataclass (amount: Decimal, currency: str; `__add__` currency-guard'lı).
- `platform/backend/tests/atoms/test_money.py` — pozitif + negatif pytest testleri.

### 7.3 Şu test yeşil olmalı

Happy-path testi: aynı currency toplama ve yuvarlama doğru çalışır. Komut ve beklenen sonuç:

```
cd platform/backend && pytest tests/atoms/test_money.py -k "test_add_same_currency or test_half_up_rounding" -v
```

Beklenen: iki test de PASSED. `Money(10.005, "TRY") + Money(0, "TRY")` çıktısı `10.01 TRY` (HALF_UP); `Money(5, "TRY") + Money(3, "TRY")` çıktısı `8.00 TRY`.

### 7.4 Şu negatif test kırmızıdan yeşile dönmeli

`dod-evidence-schema-directive.md §6 Denetim 1` (kırmızı-önce): kur-karışımı reddedilmeli. Bu test, `money.py`'de currency-guard **yokken** kırmızı, ekleyince yeşil olmalı:

```
cd platform/backend && pytest tests/atoms/test_money.py -k "test_mixed_currency_raises" -v
```

Sıra: (1) `__add__` guard'ı olmadan çalıştır → `test_mixed_currency_raises` KIRMIZI (hata fırlatılmıyor, yanlış toplam üretiliyor). (2) `if self.currency != other.currency: raise CurrencyMismatchError` ekle → test YEŞİL. (3) Bu kırmızı→yeşil geçişini `evidence[]`'a kaydet. Ayrıca `test_empty_is_not_zero` (None ile 0 farkı) aynı şekilde kırmızıdan yeşile dönmeli.

### 7.5 Şu ekranı manuel kontrol et

Atom seviyesinde UI ekranı yoktur; manuel kontrol test çıktısının **kendisidir**. Ekip üyesi terminalde şunu gözlemler: kur-karışımı testini guard eklemeden çalıştırınca gerçekten kırmızı mı? (Sahte-yeşil değil.) `pytest -k test_mixed_currency_raises` çıktısında, guard silinmiş halde `FAILED` satırı ve "DID NOT RAISE" mesajı görülmeli. Bu, testin gerçekten yanlışı yakaladığının gözle kanıtıdır.

### 7.6 AI şu hatayı yaparsa REDDET

Bu blokta AI'ın en olası sahte-yeşilleri ve reddetme kriteri (`dod-evidence-schema-directive.md §9` + `§6`):

- **AI `test_mixed_currency_raises` testini `assert True` veya boş `pytest.raises` ile yazarsa** → REDDET (tautoloji, §9 madde 4). Test gerçekten farklı currency toplayıp hatayı beklemeli.
- **AI empty ve zero'yu aynı sayarsa** (`Money(None)` ile `Money(0)` eşit dönerse) → REDDET (para ekseni "empty≠zero", §5). `None` amount ya yasak ya ayrı davranış olmalı.
- **AI kırmızı-önce göstermeden "test yeşil, bitti" derse** → REDDET (§6 Denetim 1). Guard'ı silip testin kırmızı olduğunu görmeden yeşil kabul edilmez.
- **AI `Decimal` yerine `float` kullanırsa** → REDDET (para yuvarlaması float'ta sessizce bozulur; kanıt: `0.1 + 0.2 != 0.3`).

## 8. Worked Blok 2 — u02: CRUD (`Customer` create servisi)

Bu blok, u01 atomlarını kullanarak `Customer` create/read servis metodunu üretir. `task-to-code-contract.md §1`'e göre stone seviyesi "tek bir kullanıcı hikayesini karşılayan, bağımsız test edilebilir kod parçası"dır. Örnek süreklilik: bu servis u01'in `CustomerId` ve `Email` atomlarını kullanır (kopmaz). Aktör: ekip üyesi promptu yapıştırır; AI servis + testi önerir; insan doğrulama testinin ve validasyon-red testinin geçişini görür.

### 8.1 Claude/Cursor'a yapıştır

`prompt-template-library.md §1` iskeleti, `Customer` CRUD'a uyarlanmış:

```
"Customer create servisi" üret. u01'de tanımlı CustomerId ve Email atomlarını kullan.
Bağlam: u02 — "Customer CRUD" (stone/somut özellik; küme: platform-customer).
Özet: Customer create ve read servis metodu; geçersiz email reddedilir, id atomu üretilir.
Etiketler: customer, crud, stone, validation.

Çıktı: Python + FastAPI servis katmanı. Bir CustomerService üret:
- create_customer(email: Email, name: str) -> Customer — Email atomunu doğrular.
- get_customer(id: CustomerId) -> Customer | None.
- Geçersiz email (RFC'ye uymayan) create'te reddedilir (hata fırlatılır).
- İsim boşsa reddedilir.
Generic ifade kullanma; her metodu bu Customer'ın gerçek yaşam döngüsüne bağla.

Güvenlik sınırı: AI maliyeti önemsizdir; güvenlik önceliklidir.
AI app/module üretemez/güncelleyemez, ruleset override edemez, doğrudan prod write yapamaz.

Kapsa: geçersiz email reddi, boş isim reddi, CustomerId üretimi, get_customer None yolu.
Stack: sadece Python + FastAPI + pytest + u01 atomları. Next/Supabase/Prisma KULLANMA.
Mock kullanma; gerçek in-memory repository ya da test-container ile test et (mock'un dönüşünü assert etme).
```

### 8.2 Şu dosyalar oluşmalı

Stone seviyesi kod + test teslim eder (`task-to-code-contract.md §1`):

- `platform/backend/domain/customer/service.py` — `CustomerService` (create_customer, get_customer).
- `platform/backend/domain/customer/repository.py` — in-memory veya SQLAlchemy repository arayüzü.
- `platform/backend/tests/customer/test_service.py` — pozitif + negatif testler.

### 8.3 Şu test yeşil olmalı

Happy-path: geçerli email + isimle customer oluşur ve geri okunur.

```
cd platform/backend && pytest tests/customer/test_service.py -k "test_create_and_read_customer" -v
```

Beklenen: PASSED. `create_customer(Email("a@b.com"), "Ada")` bir `Customer` döner; aynı id ile `get_customer` aynı customer'ı döner; `Email` atomu u01'den gelir.

### 8.4 Şu negatif test kırmızıdan yeşile dönmeli

Geçersiz email reddedilmeli (`dod-evidence-schema-directive.md §6 Denetim 5` negatif-case):

```
cd platform/backend && pytest tests/customer/test_service.py -k "test_invalid_email_rejected" -v
```

Sıra: (1) `create_customer` içinde email doğrulaması **yokken** → `test_invalid_email_rejected` KIRMIZI (geçersiz email kabul ediliyor). (2) `Email` atomunun doğrulamasını create'te çağır → test YEŞİL. (3) Geçiş `evidence[]`'a kaydedilir. `test_empty_name_rejected` aynı şekilde kırmızıdan yeşile döner.

### 8.5 Şu ekranı manuel kontrol et

Stone seviyesinde henüz UI yoktur; manuel kontrol, servisin FastAPI üzerinden elle çağrılmasıdır. Ekip üyesi `platform/backend`'de bir REPL veya `pytest -s` ile `create_customer(Email("gecersiz"), "X")` çağırır ve **hata fırlatıldığını gözle** doğrular. Beklenen gözlem: geçersiz email `ValidationError` fırlatır, sessizce kabul edilmez. Bu, negatif testin gerçek davranışı yakaladığının ekran-dışı manuel kanıtıdır.

### 8.6 AI şu hatayı yaparsa REDDET

`dod-evidence-schema-directive.md §9` reddetme kriterleri, bu bloğa özgü:

- **AI repository'yi mock'layıp mock'un döndürdüğü Customer'ı assert ederse** → REDDET (§9 madde 5; MOCK YOK). Test gerçek (in-memory/container) repository ile çalışmalı; mock'un kendi dönüşünü doğrulamak sahte-yeşildir.
- **AI email doğrulamasını u01 `Email` atomu yerine servis içinde yeniden yazarsa** → REDDET (`prompt-template-library.md §4` standart-kopyalama yasağı; atom tek yerde yaşar, süreklilik korunur).
- **AI `test_invalid_email_rejected`'i kırmızı görmeden yazıp "geçti" derse** → REDDET (§6 Denetim 1).
- **AI `get_customer` None yolunu test etmezse** → REDDET (§6 Denetim 5; happy-path-only yüksek-risk değil ama eksik-kapsam; bulunmayan id None dönmeli, exception değil).

## 9. Worked Blok 3 — u04: Veritabanı (`customers` migration + downgrade)

Bu blok, u03'te tanımlanan `Customer` entity'sini bir veritabanı tablosuna bağlar. `task-to-code-contract.md §1`'e göre bu archetype'ın db-schema fazıdır ve `upgrade()` + `downgrade()` ikisi de dolu olmalıdır. Migration `dod-evidence-schema-directive.md §5` "migration" eksenindedir (yüksek-risk): `alembic downgrade -1` kanıtı zorunludur. Örnek süreklilik: bu tablo u06'da `orders.customer_id` FK'siyle referans edilecek. Aktör: ekip üyesi promptu yapıştırır; AI migration önerir; insan downgrade'in veri kaybetmeden çalıştığını doğrular.

### 9.1 Claude/Cursor'a yapıştır

`prompt-template-library.md §1` iskeleti, migration'a uyarlanmış:

```
"customers tablosu Alembic migration" üret. u03 Customer entity'sini tabloya bağla.
Bağlam: u04 — "Customer veritabanı" (archetype/db-schema fazı; küme: platform-customer).
Özet: customers tablosu için Alembic migration; tenant_id ile RLS; geri-alınabilir downgrade.
Etiketler: migration, alembic, rls, tenant, high-risk.

Çıktı: Python + Alembic. Bir migration dosyası üret:
- upgrade(): customers tablosu (id, tenant_id, email, name, created_at).
- downgrade(): customers tablosunu geri al (VERİ KAYBETMEDEN geri-alınabilir; boş bırakma).
- tenant_id NOT NULL; RLS politikası: bir tenant yalnız kendi satırlarını görür.
- email unique (tenant içinde).
Generic ifade kullanma; her sütunu Customer'ın gerçek alanına bağla.

Güvenlik sınırı: AI maliyeti önemsizdir; güvenlik önceliklidir.
AI app/module üretemez/güncelleyemez, ruleset override edemez, doğrudan prod write yapamaz.
AI migration'ı prod'a UYGULAYAMAZ; yalnız dosya önerir; apply insan onayıyla olur.

Kapsa: upgrade+downgrade (downgrade boş OLAMAZ), tenant_id RLS, email tenant-içi unique,
created_at default. Stack: sadece Alembic + SQLAlchemy + PostgreSQL RLS. Next/Supabase/Prisma KULLANMA.
```

### 9.2 Şu dosyalar oluşmalı

archetype db-schema fazı migration + model teslim eder (`task-to-code-contract.md §4` Evidence):

- `platform/backend/alembic/versions/xxxx_create_customers.py` — `upgrade()` + `downgrade()` (ikisi de dolu).
- `platform/backend/domain/customer/model.py` — `Customer` SQLAlchemy modeli (u03 entity'siyle hizalı).
- RLS politikası migration içinde veya `platform/backend/alembic/versions/xxxx_customers_rls.py`'de.

### 9.3 Şu test yeşil olmalı

Migration ileri yönde uygulanır ve tablo oluşur:

```
cd platform/backend && alembic upgrade head && pytest tests/customer/test_migration.py -k "test_customers_table_exists" -v
```

Beklenen: `alembic upgrade head` hatasız; `test_customers_table_exists` PASSED (customers tablosu ve tenant_id sütunu mevcut, RLS aktif).

### 9.4 Şu negatif test kırmızıdan yeşile dönmeli

`dod-evidence-schema-directive.md §5` migration ekseni: **downgrade veri kaybetmeden çalışmalı** (§14 "downgrade'siz migration" anti-pattern'i):

```
cd platform/backend && alembic upgrade head && alembic downgrade -1 && alembic upgrade head
```

Sıra: (1) `downgrade()` boş/eksikken → `alembic downgrade -1` KIRMIZI (hata verir veya tabloyu bırakamaz). (2) `downgrade()`'e `op.drop_table("customers")` ve bağlı RLS temizliği eklenince → komut zinciri YEŞİL (upgrade→downgrade→upgrade sorunsuz döner). (3) Bu çalıştırma logu `evidence[]`'a `alembic downgrade -1` kanıtı olarak kaydedilir (`dod-evidence-schema-directive.md §5` migration artefaktı).

### 9.5 Şu ekranı manuel kontrol et

DB seviyesinde "ekran" psql çıktısıdır. Ekip üyesi şunu manuel çalıştırır ve gözlemler:

```
psql -d platform_test -c "\d customers"
psql -d platform_test -c "SELECT relrowsecurity FROM pg_class WHERE relname='customers';"
```

Beklenen gözlem: `\d customers` çıktısında `tenant_id` sütunu `not null`; `relrowsecurity` `t` (RLS açık). Ekip üyesi, RLS'in gerçekten tabloda etkin olduğunu gözle doğrular — "migration çalıştı" demek yetmez, RLS bayrağı görülmeli.

### 9.6 AI şu hatayı yaparsa REDDET

`dod-evidence-schema-directive.md §9 + §14` reddetme kriterleri:

- **AI `downgrade()`'i boş bırakırsa veya `pass` yazarsa** → REDDET (§14 "downgrade'siz migration"; migration ekseni downgrade kanıtı ister). Rollback imkânsız migration prod'da felakettir.
- **AI RLS'i migration'a koymayıp "sonra ekleriz" derse** → REDDET (tenant-cross ekseni; `dod-evidence-schema-directive.md §5`). tenant_id RLS olmadan tablo cross-tenant sızdırır.
- **AI `alembic downgrade -1` çalıştırmadan "migration hazır" derse** → REDDET (§6 kritik hatırlatma (c); downgrade test edilmeden migration done sayılmaz).
- **AI `alembic upgrade` çıktısını göstermeden "tablo oluştu" derse** → REDDET (§9 madde 1; kanıt açılabilir olmalı, iddia değil).

## 10. Worked Blok 4 — u07: Tenant İzolasyonu (cross-tenant negatif testler)

Bu blok, u04/u06'da oluşturulan tablolara tenant sınırını uygular ve cross-tenant sızıntıyı yakalar. `task-to-code-contract.md §1`'e göre bu archetype'ın test-qa fazıdır; `dod-evidence-schema-directive.md §5` "tenant-cross" ekseni **≥10 negatif case** ister (storage/PDP eşiği). Bu, playbook'un en kritik yüksek-risk bloğudur çünkü cross-tenant sızıntı bir blocker'dır. Aktör: ekip üyesi promptu yapıştırır; AI negatif testleri önerir; insan her denemenin gerçekten 403/reddedildiğini doğrular.

### 10.1 Claude/Cursor'a yapıştır

`prompt-template-library.md §1` iskeleti + §3.2 security kapsamı (tenant izolasyonu / PostgreSQL RLS):

```
"Customer cross-tenant negatif testleri" üret. u04 customers tablosunun RLS'ini doğrula.
Bağlam: u07 — "Tenant izolasyonu" (archetype/test-qa fazı; küme: platform-customer).
Özet: Tenant A, Tenant B'nin customer verisini GÖREMEZ; her deneme reddedilir/boş döner.
Etiketler: tenant, rls, security, negative-test, high-risk.

Çıktı: Python + pytest + gerçek PostgreSQL (test-container). En az 10 cross-tenant negatif case üret:
- Tenant A oturumu Tenant B'nin customer'ını id ile okuyamaz (None/403).
- Tenant A, Tenant B customer'ını güncelleyemez.
- Tenant A, Tenant B customer'ını silemez.
- Tenant A'nın listesi yalnız kendi customer'larını içerir (B'ninkiler yok).
- Filtre/arama Tenant B'ye sızmaz; sayfalama Tenant B'ye sızmaz; toplam sayı Tenant B'yi saymaz.
Generic ifade kullanma; her case gerçek bir sızıntı yolunu kapatsın.

Güvenlik sınırı: AI maliyeti önemsizdir; güvenlik önceliklidir.
AI app/module üretemez/güncelleyemez, ruleset override edemez, doğrudan prod write yapamaz.

Kapsa: ≥10 cross-tenant negatif case (oku/güncelle/sil/liste/filtre/arama/sayfalama/sayım),
her biri 403 veya boş döner. Stack: pytest + gerçek PostgreSQL RLS. Next/Supabase/Prisma KULLANMA.
Mock kullanma; gerçek iki-tenant DB session ile test et (mock'lanmış "izin yok" sahte-yeşildir).
```

### 10.2 Şu dosyalar oluşmalı

test-qa fazı negatif test dosyası + kanıt teslim eder (`task-to-code-contract.md §4`):

- `platform/backend/tests/customer/test_tenant_isolation.py` — ≥10 cross-tenant negatif case.
- Test fixture: iki gerçek tenant (A, B) seed eden `conftest.py` girdisi (mock değil, gerçek session).

### 10.3 Şu test yeşil olmalı

Tüm cross-tenant negatif case'ler yeşil (her sızıntı yolu kapalı):

```
cd platform/backend && pytest tests/customer/test_tenant_isolation.py -v
```

Beklenen: ≥10 test PASSED. Her test, Tenant A oturumunun Tenant B verisine erişememesini (None/403/boş liste) doğrular. Test sayısı `dod-evidence-schema-directive.md §5` eşiğini (≥10) karşılamalı.

### 10.4 Şu negatif test kırmızıdan yeşile dönmeli

Bu blokta tüm testler zaten negatiftir; kırmızı→yeşil geçişi RLS'in **eklenmesiyle** kanıtlanır:

```
# 1) RLS politikası DEVRE DIŞI iken:
cd platform/backend && pytest tests/customer/test_tenant_isolation.py -v   # KIRMIZI (sızıntı var)
# 2) RLS politikası aktif edildikten sonra:
cd platform/backend && pytest tests/customer/test_tenant_isolation.py -v   # YEŞİL (sızıntı kapalı)
```

Sıra: (1) u04'teki RLS politikasını geçici kapat → ≥10 test KIRMIZI (Tenant A, B'yi görüyor). (2) RLS'i geri aç → hepsi YEŞİL. (3) Bu kırmızı→yeşil geçişi ve ≥10 case sayısı `evidence[]`'a "cross-tenant negatif rapor" olarak kaydedilir (`dod-evidence-schema-directive.md §5` tenant-cross artefaktı). RLS kapalıyken testin kırmızı olması, testin gerçekten sızıntıyı yakaladığının kanıtıdır — sahte-yeşil değildir.

### 10.5 Şu ekranı manuel kontrol et

Manuel kontrol, iki tenant oturumuyla gerçek sorgudur. Ekip üyesi psql'de iki ayrı tenant rolüyle bağlanır:

```
psql -d platform_test -c "SET app.tenant_id = 'tenant-A'; SELECT count(*) FROM customers;"
psql -d platform_test -c "SET app.tenant_id = 'tenant-B'; SELECT count(*) FROM customers;"
```

Beklenen gözlem: Tenant A'nın sayımı yalnız A'nın satırları; Tenant B'nin sayımı yalnız B'nin satırları; toplamları global toplama eşit ama biri diğerini saymıyor. Ekip üyesi, RLS'in gerçekten satır-düzeyi filtre uyguladığını gözle görür.

### 10.6 AI şu hatayı yaparsa REDDET

`dod-evidence-schema-directive.md §9 + §14` reddetme kriterleri (bu blok en katıdır):

- **AI 10'dan az case üretirse** (ör. 4 case) → REDDET (§14 "N-altı cross-tenant"; tenant-cross ekseni ≥10 ister).
- **AI RLS'i mock'layıp "izin yok" döndüren bir sahte session ile test ederse** → REDDET (§9 madde 5; MOCK YOK). Gerçek PostgreSQL RLS ile test edilmeli; mock'lanmış izin-reddi hiçbir gerçek sızıntıyı kapatmaz.
- **AI yalnız "oku" case'ini test edip güncelle/sil/liste/filtre'yi atlarsa** → REDDET (§9 madde 7; riziko-eksenine uygun kanıt; sızıntı çok yollu, her yol kapanmalı).
- **AI RLS kapalıyken testin kırmızı olduğunu göstermeden "izolasyon çalışıyor" derse** → REDDET (§6 Denetim 1 + §9 madde 3; kırmızı-önce görülmeden yeşil kabul edilmez).

## 11. Worked Blok 5 — u08: UI + Doğrulama (`Customer` liste-form ekranı + a11y)

Bu blok, örnek domaini kullanıcıya gösterir: u05 GraphQL API'sini ve u03 bileşen haritasını tüketen bir React ekranı. `task-to-code-contract.md §1`'e göre bu archetype'ın verification'a giden test-qa yüzeyidir; `prompt-template-library.md §3.7` WCAG 2.2 AAA kapsamı ve `task-to-code-contract.md §4` test-qa Evidence (axe-core 0 ihlal) uygulanır. Örnek süreklilik: ekran u05'in `customer` query'sini ve `createCustomer` mutation'ını çağırır (kopmaz). Aktör: ekip üyesi promptu yapıştırır; AI React bileşeni + testleri önerir; insan ekranı açar ve a11y taramasını çalıştırır.

### 11.1 Claude/Cursor'a yapıştır

`prompt-template-library.md §1` iskeleti + §3.7 WCAG kapsamı, React ekranına uyarlanmış:

```
"Customer liste-form ekranı" üret. u05'in customer query ve createCustomer mutation'ını kullan.
Bağlam: u08 — "Customer UI" (archetype/test-qa; küme: platform-customer).
Özet: Customer listesini gösteren ve yeni Customer ekleyen React ekranı; WCAG 2.2 AAA.
Etiketler: react, ui, wcag, a11y, graphql.

Çıktı: React + TypeScript. Bir CustomerListForm bileşeni üret:
- u05 GraphQL "customer" query ile listeyi çeker.
- Form ile "createCustomer" mutation'ı çağırır (email + name).
- Geçersiz email formda hata gösterir (submit engellenir).
- Kontrast >=7:1, tam klavye erişimi, ARIA etiketleri, görünür odak.
Generic ifade kullanma; her etkileşimi bu Customer ekranının gerçek akışına bağla.

Güvenlik sınırı: AI maliyeti önemsizdir; güvenlik önceliklidir.
AI app/module üretemez/güncelleyemez, ruleset override edemez, doğrudan prod write yapamaz.

Kapsa: liste render, form submit (createCustomer), geçersiz email form-red, klavye erişimi,
ARIA etiketleri, kontrast >=7:1. Stack: React + TypeScript + Vitest + Playwright + axe-core.
Next.js KULLANMA (bu depo Next kullanmaz); Supabase/Prisma KULLANMA. GraphQL client u05'ten.
```

### 11.2 Şu dosyalar oluşmalı

archetype UI test-qa fazı bileşen + test teslim eder (`task-to-code-contract.md §1` archetype: UI bileşen haritası):

- `platform/frontend/src/customer/CustomerListForm.tsx` — liste + form bileşeni.
- `platform/frontend/src/customer/CustomerListForm.test.tsx` — Vitest bileşen testleri.
- `platform/frontend/e2e/customer.spec.ts` — Playwright e2e + axe-core a11y taraması.

### 11.3 Şu test yeşil olmalı

Happy-path: liste render olur, geçerli form submit `createCustomer` çağırır.

```
cd platform/frontend && npx vitest run src/customer/CustomerListForm.test.tsx
```

Beklenen: PASSED. Bileşen u05 query sonucunu listeler; geçerli email+isimle submit `createCustomer` mutation'ını çağırır ve listeyi günceller.

### 11.4 Şu negatif test kırmızıdan yeşile dönmeli

Geçersiz email formda submit'i engellemeli (`dod-evidence-schema-directive.md §6 Denetim 5`):

```
cd platform/frontend && npx vitest run src/customer/CustomerListForm.test.tsx -t "rejects invalid email"
```

Sıra: (1) Form validasyonu **yokken** → "rejects invalid email" KIRMIZI (geçersiz email ile mutation çağrılıyor). (2) Form validasyonu (submit-guard) eklenince → test YEŞİL (geçersiz email'de mutation çağrılmıyor, hata mesajı görünüyor). (3) Geçiş `evidence[]`'a kaydedilir.

### 11.5 Şu ekranı manuel kontrol et

Bu blok gerçek bir ekran içerir; manuel kontrol tarayıcıda ekranı açmaktır. Ekip üyesi:

```
cd platform/frontend && npm run dev
# Tarayıcıda: http://localhost:5173/customers
# a11y taraması:
cd platform/frontend && npx playwright test e2e/customer.spec.ts
```

Beklenen gözlem (route `/customers`): (1) Customer listesi görünür; (2) form Tab tuşuyla sırayla gezilebilir (klavye erişimi), odak görünür; (3) geçersiz email girip submit'e basınca hata mesajı görünür, liste değişmez; (4) `axe-core` raporu **0 ihlal** (`task-to-code-contract.md §4` test-qa Evidence: axe-core 0 ihlal). Ekip üyesi ekranı gözle ve klavyeyle dener — "çalışıyor gibi görünüyor" yetmez; Tab ile gezilebildiği ve axe raporunun 0 olduğu görülmeli.

### 11.6 AI şu hatayı yaparsa REDDET

`dod-evidence-schema-directive.md §9` + `prompt-template-library.md §3.7` reddetme kriterleri:

- **AI axe-core taramasını çalıştırmadan "erişilebilir" derse** → REDDET (§9 madde 1; kanıt açılabilir olmalı; axe raporu 0 ihlal gösterilmeli).
- **AI form validasyonunu client'ta atlayıp yalnız API'ye bırakırsa** → REDDET (bu blok form-red testi ister; geçersiz email'de submit engellenmeli, kırmızı→yeşil kaydı §6).
- **AI GraphQL çağrısını mock'layıp mock'un döndürdüğü listeyi assert ederse** ama gerçek mutation akışını test etmezse → REDDET (§9 madde 5; e2e Playwright gerçek akışı doğrulamalı).
- **AI kontrast/klavye/ARIA'yı "eklendi" der ama Tab-gezinme testini göstermezse** → REDDET (§9 madde 6 kanıtsız-bitti; WCAG kapsamı klavye erişimi ve görünür odak ister, `prompt-template-library.md §3.7`).

## 12. Reddetme Ritüeli — "Çalışıyor Gibi Ama Yanlış" için 60+ Ekip Checklist'i

Bu bölüm, bir AI çıktısı "done" iddiasıyla geldiğinde 60+ ekibin uygulayacağı reddetme checklist'ini verir. Checklist yeniden yazılmaz; `dod-evidence-schema-directive.md §9`'un dokuz maddesi bu playbook'un altı-parçalı şablonuna (§5) eşlenerek operasyonel hale getirilir. 60+ ekibin ortak riski, AI'ın akıcı diliyle "çalışıyor" demesi ve ekibin bunu kanıt sanmasıdır; bu checklist, her worked bloğun altıncı parçasının (§7.6–§11.6) genel halidir. Aktör: *ekip üyesi (denetleyici)* checklist'i uygular; *AI* çıktıyı savunamaz, yalnız kanıt sunar; kanıt yetmezse red.

Aşağıdaki tablo, reddetme checklist'inin her maddesini, bu playbook'taki karşılığını (hangi şablon parçası) ve kaynak sözleşmedeki maddeyi eşler. Sıra `dod-evidence-schema-directive.md §9` ile aynıdır: üstteki maddeler ucuz elemeler (kanıt var mı?), alttakiler derin (kanıt gerçekten yanlışı mı reddediyor?).

| # | Reddetme maddesi | Bu playbook'taki karşılık | Kaynak (`dod-evidence` §9) | "Hayır" ise |
|---|---|---|---|---|
| 1 | Artefakt açılabilir mi? | Şablon parça 2 (dosya) + §4 artefakt-sayılır tablosu | §9 madde 1 | Red — dosya/log/URL yoksa "çalışıyor" iddiadır |
| 2 | Negatif test var mı? | Şablon parça 4 (negatif test) | §9 madde 2 | Red — happy-path (parça 3) tek başına yetmez |
| 3 | Kırmızı-önce görüldü mü? | Şablon parça 4'ün "kırmızıdan yeşile" sırası | §9 madde 3 | Red — kırmızı görülmeden yeşil kabul edilmez |
| 4 | Assertion anlamlı mı? | Worked blok reddetme kriterleri (tautoloji-red) | §9 madde 4 | Red — `assert True`/boş `raises` hiçbir şey doğrulamaz |
| 5 | Mock'a mı bakıyor? | Her promptta "mock kullanma" satırı + §8.6/§10.6 | §9 madde 5 | Red — MOCK YOK; mock'un dönüşünü assert etmek sahte-yeşil |
| 6 | Mutation-check geçti mi? | RLS/guard silip testin kırmızıya döndüğünü görmek (§10.4) | §9 madde 6 | Red — yeşil kalan test koruyucu değil |
| 7 | Riziko-eksenine uygun kanıt mı? | u04 downgrade kanıtı, u07 ≥10 cross-tenant (§9.4, §10.3) | §9 madde 7 | Red — her eksen kendi kanıtını ister |
| 8 | Owner + AC tam mı? | actionplan düğümünde owner + acceptanceCriteria | §9 madde 8 | Red — sahipsiz/ölçülemez kabul kriteri geçmez |
| 9 | Done-tutarlı mı? | actionplan `status="done"` + `evidence[]` + faz kapısı | §9 madde 9 | Red — kanıtsız "done" sahte-tamamlanma |

Ritüelin 60+ ekip için altın kuralı: **bir AI çıktısı, onu üreten AI olmadan, bir ekip üyesi tarafından açılıp yanlışı reddettiği doğrulanabiliyorsa "done"dır; aksi halde "çalışıyor gibi görünen" bir iddiadır ve reddedilir** (`dod-evidence-schema-directive.md §9` altın kuralı). Küçük ekip için pratik kısayol: her worked bloğun altıncı parçası (§7.6–§11.6) bu checklist'in o bloğa özgü, önceden düşünülmüş halidir; ekip üyesi checklist'i baştan çıkarmaz, bloğun reddetme kriterine bakar. AI'ın "işe yarıyor gibi" olması bu checklist'ten geçmesini sağlamaz; yalnız kanıt + negatif test + kırmızı→yeşil + mutation-check birlikte geçer.

## 13. Reconcile — Üç Kaynak Sözleşmeyle Uzlaşma

Bu playbook üç kanonik sözleşmenin operasyonel türevidir ve hiçbiriyle çelişmez; her biriyle nasıl uzlaştığı aşağıda tanımlanır. Çelişki çıkarsa kaynak sözleşme kazanır ve bu playbook hizalanır; özellikle `task-to-code-contract.md` kanoniktir (`task-to-code-contract.md` Çelişki Bildirimi).

Aşağıdaki tablo, playbook'un her kaynak sözleşmeyle ilişkisini, hangi öğesini kullandığını ve bu playbook'un ne eklediğini gösterir. Amaç: hiçbir kural kaynaksız uydurulmadı; playbook yalnız üçünü operasyonel bloğa birleştirdi.

| Kaynak sözleşme | İlişki | Bu playbook'un kullandığı öğe | Bu playbook ne ekler |
|---|---|---|---|
| `prompt-template-library.md` | Türev; prompt gövdesi buradan | §1 beş-blok iskelet (Başlık/Bağlam/Çıktı/Güvenlik/Kapsa); §3 boyut kapsamları; §4 jenerik-yasak | İskeleti "yapıştırılabilir görev promptu"na uyarlar (§5 parça 1); her worked blokta gerçek prompt üretir (§7.1–§11.1) |
| `dod-evidence-schema-directive.md` | Türev; kanıt + red + sahte-yeşil buradan | §5 yüksek-risk eksenleri + kanıt artefaktları; §6 sahte-yeşil altı-denetim; §9 reddetme checklist'i; §14 anti-patterns | Kanıt/red kurallarını altı-parçalı bloğa çağırır (§5 parça 4, 6); reddetme checklist'ini blok-özel hale getirir (§12) |
| `task-to-code-contract.md` | Kanonik; seviye/faz/teslimat buradan | §1 seviye→teslimat; §4 faz-Evidence; §7 Customer dikey dilimi | Seviye→teslimatı worked bloklara (u01–u08) uygular (§6); Customer örneğini Order ile genişletir |

Pratik uzlaşma: bir worked blok üç sözleşmeyi aynı anda kullanır — prompt gövdesi `prompt-template-library.md`'den (parça 1), beklenen dosya/seviye `task-to-code-contract.md`'den (parça 2), negatif-test/kanıt/red `dod-evidence-schema-directive.md`'den (parça 4, 6). Üçü ortogonaldir; playbook onları çakıştırmadan tek bloğa dizer. Bu playbook yeni kural koymaz; yalnız üç sözleşmenin "bir görev için birlikte nasıl uygulanacağını" gösterir.

## 14. AI Guardrail — Playbook Yönlendirir, İnsan Onaylar, AI "Bitti" Diyemez

Aşağıdaki iş bölümü değiştirilemezdir ve `dod-evidence-schema-directive.md §11` ile `task-to-code-contract.md` (Aktörler; Çelişki Bildirimi) ile birebir aynıdır: **AI önerir → insan doğrular/onaylar → CI zorlar.** Bu playbook AI'ı yönlendirir (yapıştırılacak prompt verir), ama üretilen çıktı insan-onayı ve kanıt olmadan "bitti" olamaz. En kritik sınır: **AI kendi ürettiği kodu/testi "bitti" veya "yeşil" ilan edemez; kırmızı→yeşil geçişini ve ekranı insan doğrular.**

Bu tablo, playbook akışındaki AI autonomy sınırlarını tanımlar; her satır `dod-evidence-schema-directive.md §11`'in bir kuralının playbook karşılığıdır.

| İşlem | Autonomy | Kural |
|---|---|---|
| Görev promptuyla kod/test üretme | `draft` | AI parça 1 promptuyla kod ve test önerir; insan onaylamadan artefakt "kabul" olmaz |
| Kendi testini "yeşil/bitti" ilan etme | `none` | AI parça 3/4 testini yeşil sayamaz; kırmızı→yeşil geçişi ve ekranı **insan doğrular** (§5 parça 4, 5) |
| Negatif test yazma | `draft` | AI negatif testi (parça 4) önerir; kırmızı-önce çalıştırma kaydını sunar; "onaylandı" damgası insanındır |
| actionplan düğümünü "done" işaretleme | `none` | AI `status="done"` yapamaz; done kapısı insan onayı + `evidence[]` + faz kapısı + `check-dod-evidence` yeşili (`task-to-code-contract.md §2` faz kapısı) |
| Migration'ı prod'a uygulama | `none` | AI `alembic upgrade` prod'a uygulayamaz; yalnız dosya önerir (§9.1); apply insan onayıyla |
| Örnek domaini değiştirme | `draft` | AI u01–u08 örnek sürekliliğini (Customer→Order) tek başına bozamaz; yeni örnek insan kararı |

Mutlak sınırlar: AI main branch'e push edemez (`task-to-code-contract.md §4`); üretilen kodu/testi "bitti" ilan edemez (kanıtı ve ekranı insan doğrular); kanıtsız "çalışıyor" diyemez; actionplan düğümünü done işaretleyemez; migration'ı prod'a uygulayamaz; `check-dod-evidence`/faz kapısını override edemez. AI'ın rolü: yapıştırılan promptla taslak öneri + kırmızı→yeşil çalıştırma kaydı sunmak; **kabul, doğrulama ve "bitti" kararı insanındır.** Playbook AI'ı hızlandırır; onaylamaz.

## 15. Kabul Kriterleri (Bu Playbook'un)

- Playbook, "anladım/anlatabilirim yetmez; her ünite ölçülebilir artefakt bırakır" ilkesini net koyar (§4); artefakt-sayılır/sayılmaz ayrımı açık.
- Her worked blok (§7–§11) altı parçayla biter: yapıştır → dosyalar → test yeşil → negatif test kırmızı→yeşil → manuel kontrol → reddet (§5).
- Örnek domain (Customer→Order) u01'den u08'e kopmadan büyür; her ünite bir öncekinin artefaktını kullanır (§6).
- En az beş tam worked blok gerçek prompt + beklenen dosya + test komutu + negatif test geçişi + manuel kontrol + reddetme kriteri içerir (§7–§11).
- Reddetme ritüeli `dod-evidence-schema-directive.md §9`'a bağlıdır; dokuz madde playbook'un altı-parçalı şablonuna eşlenmiştir (§12).
- Reconcile: `prompt-template-library.md` (prompt), `dod-evidence-schema-directive.md` (kanıt+red), `task-to-code-contract.md` (seviye) referans verilmiştir; yeni kural uydurulmamıştır (§13).
- AI-guardrail: AI kendi çıktısını "bitti" ilan edemez; insan-onay + kanıt zorunludur; AI done işaretleyemez, migration'ı prod'a uygulayamaz (§14).
- Stack yasağı korunur: hiçbir örnek Next.js/Supabase/Prisma kullanmaz; tüm örnekler FastAPI/SQLAlchemy/Alembic/GraphQL/React/Playwright/pytest/PostgreSQL RLS üzerindedir (§3, §7–§11).

## 16. Anti-patterns

- **Artefaktsız ünite:** Bir üniteyi "anladım/AI açıkladı" ile kapatmak, dosya/log/ekran bırakmadan — YASAK; her ünite artefakt bırakır (§4).
- **Beşinci parçasız blok:** Görev bloğunu "manuel kontrol" ve "reddet" parçaları olmadan bitirmek — YASAK; altı parça zorunlu (§5).
- **Sahte prompt:** Yapıştırılacak prompta gerçek bağlam yerine "buraya kodu yaz" gibi jenerik dolgu koymak — YASAK; prompt bağlama-özgü olmalı (`prompt-template-library.md §4`).
- **Kırmızı görülmeden yeşil:** Negatif testi (parça 4) kırmızı görmeden "yeşil, bitti" saymak — YASAK; kırmızı→yeşil kaydı zorunlu (§5, `dod-evidence §6`).
- **Mock'un dönüşünü doğrulama:** GraphQL/repository/RLS mock'layıp mock'un döndürdüğünü assert etmek — YASAK; MOCK YOK, gerçek DB/test-container (§8.6, §10.6).
- **Örnek kopması:** Her ünitede yeni bir örnek domain uydurmak, Customer→Order sürekliliğini bırakmak — YASAK; örnek adım adım büyür (§6).
- **N-altı cross-tenant:** u07'de 10'dan az cross-tenant negatif case üretmek — YASAK; ≥10 (§10, `dod-evidence §5`).
- **Downgrade'siz migration:** u04'te `downgrade()` boş bırakıp "migration hazır" demek — YASAK; `alembic downgrade -1` kanıtı zorunlu (§9, `dod-evidence §14`).
- **AI'ın kendi çıktısını onaylaması:** AI "kod yazdım, test yeşil, done" demesi — YASAK; kabul/doğrulama/bitti kararı insanındır (§14).
- **Stack ihlali:** Bir worked blokta Next.js/Supabase/Prisma önermek — YASAK; depo stack'i sabittir (§3).

## 17. Kaynak-Sözleşme Karşılığı

Aşağıdaki tablo, bu playbook'un her ana öğesinin hangi kaynak sözleşmenin hangi öğesini operasyonel bloğa uyarladığını gösterir; her satır bir kaynak öğeyi bu dokümanın bir bölümüne bağlar. Amaç izlenebilirlik: hiçbir öğe kaynaksız uydurulmadı.

| Kaynak öğe | Bu playbook'taki karşılık |
|---|---|
| `prompt-template-library.md §1` beş-blok iskelet | §5 parça 1 + her worked blok prompt gövdesi (§7.1–§11.1) |
| `prompt-template-library.md §3.2/§3.7` (security/wcag kapsamı) | u07 tenant promptu (§10.1) + u08 wcag promptu (§11.1) |
| `prompt-template-library.md §4` jenerik-yasak | §16 "sahte prompt" anti-pattern + prompt "generic ifade kullanma" satırları |
| `dod-evidence-schema-directive.md §5` yüksek-risk eksenleri + kanıt artefaktları | u01 para (§7), u04 migration (§9), u07 tenant-cross (§10) |
| `dod-evidence-schema-directive.md §6` sahte-yeşil altı-denetim | §5 parça 4 (kırmızı-önce) + her worked blok reddetme kriteri |
| `dod-evidence-schema-directive.md §9` reddetme checklist'i (9 madde) | §12 reddetme ritüeli (9 madde playbook karşılığı) |
| `dod-evidence-schema-directive.md §11` AI guardrail | §14 AI guardrail tablosu |
| `task-to-code-contract.md §1` seviye→teslimat | §6 ünite→seviye eşlemesi + §5 parça 2 (beklenen dosya) |
| `task-to-code-contract.md §4` faz-Evidence | §5 parça 3/5 (test/manuel kontrol) + u04/u07/u08 kanıtları |
| `task-to-code-contract.md §7` Customer dikey dilimi | §6 örnek domain sürekliliği (Customer→Order) |

---

*Son güncelleme: 2026-07-02. Bu playbook üç kaynak sözleşmenin operasyonel yüzüdür; kaynak sözleşme değişirse bu doküman hizalanır. Değiştirme yetkisi: yalnızca insan onayı; AI ajan bu dosyayı doğrudan güncelleyemez.*
