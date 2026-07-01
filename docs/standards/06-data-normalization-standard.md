# 06 — n6n / d10n Veri Normalizasyon Standardı (Normalization & Controlled Denormalization)

Sürüm: 1.0 — 2026-07-01
Aile (`family`): `data` · Öncelik: n6n P1 (`must`), d10n P3 (`may`)
Makine kontratı: `src/data/standards/n6n.json` (PLANLANDI — bu anlatı ile aynı PR'da merge edilir; `plan-02` PROMPT 3)
CI kapısı (hedef): `check-data-quality`
Tüketen primitifler: `k-schema` (alan-tanımı ve ilişki), `k-computation` (`plan-03` §3.4 — türetilmiş/denormalize alan hesap hattı)

Bu doküman anlatı standardıdır: `n6n.json` makine-sözleşmesini *anlatır*, kuralın değerini yeniden tanımlamaz (`00-standards-index.md` §1). İki disiplini birlikte tanımlar çünkü zıt yönlü aynı madalyondur: n6n *bütünlük* için böler, d10n *okuma-performansı* için kontrollü biçimde geri-birleştirir. `c13n` (`05-c13n-canonicalization-standard.md`) kimlik/kanonik-anahtar üretir; bu standart ona *komşudur* ama farklıdır (bkz. §2).

---

## 1. Numeronym ve Kapsam

Bu bölüm iki kısaltmayı açar ve standardın hangi soruyu cevapladığını verir.

n6n = "n" + 6 harf + "n" = *normalization* (normalizasyon); d10n = "d" + 10 harf + "n" = *denormalization* (denormalizasyon). Normalizasyon, veriyi tekrar/anomali içermeyecek biçimde ilişkilere bölme (3NF hedefi) ve girdiyi depolamaya uygun kanonik-alt-parçalara ayrıştırma disiplinidir. Denormalizasyon, okuma-yoğun bir yol için bilinçli ve *kontrollü* biçimde bu bölünmüş veriyi geri-birleştirip (materialize) tutmaktır. Standardın cevapladığı soru: "veriyi nerede bölmeli (yazma-doğruluğu için), nerede birleştirilmiş tutmalı (okuma-hızı için) — ve ikincisi hangi güvencelerle *caiz*?"

Kapsam: idempotent normalize fonksiyonları, 3NF şema disiplini, adres/ad gibi bileşik alan ayrıştırması, kontrollü denormalizasyon (read-model/projection), senkron güvencesi. Kapsam DIŞI: kanonik-anahtar/duplicate (bu `c13n`), para/BOM hesabı (bu `k-computation`), tam-metin arama indeksi (arama altyapısı).

---

## 2. n6n / c13n / d10n Üçlü Ayrımı (Sınır)

Bu bölüm üç komşu disiplini birbirinden ayırır; karıştırılırlarsa aynı kural birden çok dosyada farklılaşır (drift).

Aşağıdaki cümle sınırı netleştirir: `c13n` bir değerin *biricik kimlik biçimini* üretir (E.164 telefon, slug); `n6n` bir alanı/tabloyu *doğru ilişkisel biçime* getirir (bileşik adı ad/soyad'a böler, tekrarı ayrı tabloya taşır); `d10n` doğru-biçimdeki veriyi *okuma için bilinçli tekrarlar*. Kural şu şekilde uygulanır: "bu iki değer aynı mı?" → c13n; "bu alan/tablo bütünlük kurallarına uyuyor mu?" → n6n; "bu rapor çok yavaş, veriyi önceden birleştirmeli miyim?" → d10n. Üçü ayrı `check` altında yaşar ama tek CI kapısı (`check-data-quality`) hepsini denetler.

---

## 3. Çekirdek İlke — Idempotent Normalize Fonksiyonu

Bu bölüm tüm normalize fonksiyonlarının uyduğu invariantı verir.

Her normalize fonksiyonu `normalize()` idempotent uygulanır: `normalize(normalize(x)) == normalize(x)`. Bir değeri iki kez normalize etmek bir kez normalize etmekle aynı sonucu verir; bu invariant CI'da birim testiyle zorlanır ve testi olmayan normalize fonksiyonu merge edilmez. Normalize fonksiyonları saf ve deterministiktir (yan-etkisiz, aynı girdi→aynı çıktı) ve `platform/kernel/` ilgili modülün `normalize` katmanında yaşar. Normalizasyon *depolama öncesi sınır katmanında* (Pydantic validator) çalışır; doğrulanmamış/normalize-edilmemiş veri iş katmanına ve veritabanına geçemez (`data-api-contract` sınır-doğrulama kuralıyla aynı hat).

---

## 4. Şema Normalizasyonu — 3NF Tabanı

Bu bölüm ilişkisel şemanın hangi normal biçime kadar getirileceğini tanımlar.

Şema tabanı 3NF (Üçüncü Normal Biçim) şu şekilde uygulanır: (1) tekrarlayan grup yok — çok-değerli ilişki ayrı tabloya taşınır (ör. bir siparişin çok kalemi `order_items` tablosundadır, virgülle-ayrılmış kolon yasak); (2) kısmi-bağımlılık yok — bileşik anahtarın yalnız bir parçasına bağlı alanlar ayrılır; (3) geçişli-bağımlılık yok — anahtar-olmayan bir alana bağlı alanlar ayrı tabloya çıkarılır (ör. `city` üzerinden gelen `country` tekrar edilmez, ayrı referans tablosuna gider). 3NF ihlali yalnız §7'deki kontrollü denormalizasyon kuralıyla ve açık etiketle caizdir; "kolay oldu diye" tekrar tutmak yasaktır. Tüm tablolar `data-api-contract` konvansiyonunu taşır (`id` UUID, `created_at`, `updated_at`, `tenant_id`, soft-delete `deleted_at`).

---

## 5. Bileşik Alan Ayrıştırması

Bu bölüm tek bir kullanıcı-girdisinin doğru alt-alanlara bölünmesini tanımlar.

Bileşik alanlar şu şekilde ayrıştırılır: tam-ad girdisi ad/soyad (ve varsa unvan) bileşenlerine; posta adresi cadde/şehir/posta-kodu/ülke bileşenlerine; para değeri tutar (integer, en küçük para birimi — kuruş) + para-birimi koduna (ISO 4217) bölünür. Para asla kayan-nokta (float) olarak saklanmaz; yuvarlama hatası finansal veriyi bozar — tutar tam-sayı en-küçük-birim + ayrı currency kolonu olarak tutulur (hesap `k-computation` primitifinde yapılır). Ayrıştırma belirsizse (ör. çok-parçalı ad) ham girdi ayrıca korunur; kör-tahminle veri kaybı yasaktır. Ayrıştırma kuralları koda gömülmez, `k-schema` alan-tanımına referans verir.

---

## 6. Enum / Referans-Veri Normalizasyonu

Bu bölüm serbest-metin yerine kontrollü değer kümesi kullanımını tanımlar.

Sonlu ve tekrar-eden değer kümeleri (durum, tip, ülke, para-birimi) serbest-metin kolon yerine referans/enum ile normalize edilir; böylece `Aktif`/`aktif`/`ACTIVE` üç ayrı değer olmaz. Uygulama şu şekildedir: değişmez ve koda-bağlı kümeler (ör. sipariş durumu) uygulama-seviyesi enum + DB `CHECK`/enum-tipi ile; tenant'a-göre genişleyebilen kümeler (ör. kategori) referans tablosu + foreign key ile tutulur. Serbest-metin girdisi enum'a eşlenirken c13n-benzeri girdi-temizliği (trim + NFC + case-fold) uygulanır ama karar kümesi sabittir. Locale'e-göre gösterim etiketi `i18n` katmanının işidir; depolanan değer daima kanonik makine-kodudur (`active`, `tr`, `TRY`).

---

## 7. Kontrollü Denormalizasyon (d10n) — Nerede Caiz

Bu bölüm denormalizasyonun hangi dar koşullarda kural-olarak izinli olduğunu tanımlar; bu, standardın en sık suistimal edilen kısmıdır.

Denormalizasyon yalnız şu koşulların *tümü* sağlandığında caizdir ve şu şekilde uygulanır: (1) yol *okuma-yoğun* ve ölçülmüş bir performans darboğazıdır (rapor/dashboard/liste — "belki hızlı olur" değil, kanıtlı yavaşlık); (2) denormalize veri açık bir *read-model / projection* olarak, sahiplik etiketiyle ayrı tutulur — kaynağın yerine geçmez, kaynak daima 3NF normalize tablodur; (3) kaynak↔projeksiyon senkronizasyonu belirli bir mekanizmayla (tetikleyici/olay-tüketimi/zamanlanmış yeniden-hesap) sağlanır ve senkron gecikmesi (staleness) bilinçli kabul edilir ve belgelenir. Yazma yolunda denormalizasyon (aynı gerçeği iki yazılabilir yerde tutmak) yasaktır; bu tutarsızlık üretir. `d10n` P3'tür: varsayılan normalize; denormalizasyon istisnadır ve gerekçesi PR'da yazılır.

---

## 8. Read-Model / Projection Deseni

Bu bölüm caiz denormalizasyonun somut yapısını tanımlar.

Read-model şu şekilde uygulanır: kaynak bounded-context'in yayınladığı olaydan/veriden türeyen bir projeksiyon tablosu (ör. `report_order_summary`) oluşturulur; bu tablo `data-api-contract`'ın "cross-context veri kopyası yalnız açık read-model/projection olarak, sahiplik etiketiyle" kuralına uyar. Projeksiyon *yeniden-üretilebilir* olmalı: kaynaktan sıfırdan yeniden inşa edilebilir (rebuild yolu vardır), böylece bozulursa kaynaktan tazelenir. Foreign key yalnız aynı context içinde tanımlanır; projeksiyon başka context'in tablosunu doğrudan JOIN etmez, yayınlanan sözleşmeyi tüketir. Materialized view veya ayrı projeksiyon tablosu tercih edilir; her ikisinde de tazeleme mekanizması ve staleness bütçesi açıkça tanımlanır.

---

## 9. Senkronizasyon ve Tutarlılık Güvencesi

Bu bölüm denormalize verinin kaynakla nasıl senkron tutulacağını tanımlar.

Senkron şu şekilde uygulanır: kaynak değiştiğinde projeksiyon ya olay-tüketimiyle (kaynak context bir olay yayınlar, projeksiyon onu tüketip günceller) ya da zamanlanmış yeniden-hesapla tazelenir; hangi yöntemin kullanıldığı ve kabul edilen gecikme (ör. "raporlar en çok 5 dk bayat olabilir") belgelenir. Para/sipariş/stok gibi *kritik* veriye dayalı denormalizasyonda, kaynak mutasyonu `scale-invariant` yönergesi (`plan-03` §5) uyarınca outbox+idempotency taşır; böylece projeksiyon güncellemesi kaybolmaz ve tekrar-oynatmada çift-saymaz. Projeksiyon güncellemesi başarısız olursa kaynak yazımı geri-alınmaz (kaynak doğruluk-kaynağıdır); projeksiyon yeniden-inşa ile onarılır. Kesin-tutarlılık gereken yerde (ör. bakiye kontrolü) denormalize okuma kullanılmaz, normalize kaynaktan okunur.

---

## 10. Migration Stratejisi (Expand-Contract)

Bu bölüm normalize/denormalize şema değişikliğinin sıfır-kesinti sırasını tanımlar.

Şema değişikliği `data-api-contract`'ın expand-contract kuralıyla aynı şekilde uygulanır. Normalizasyon (bir denormalize kolonu ayrı tabloya taşıma) sırası: (1) *expand* — yeni normalize tablo/kolon eklenir, backfill mevcut veriyi taşır, uygulama hem eski hem yeni yola yazar; (2) *contract* — eski denormalize kolon ayrı migration'da kaldırılır. Denormalizasyon eklerken (projeksiyon tablosu) tersi: projeksiyon eklenir, kaynaktan backfill/rebuild ile doldurulur, tazeleme kancası bağlanır, sonra okuma yolu projeksiyona çevrilir. Her migration idempotent ve çalışan `down` yoluna sahiptir; yıkıcı adım (kolon `DROP`, `NOT NULL`) expand fazında konmaz. Backfill kör-silmez; belirsiz veri rapora düşürülür ve insan onayıyla çözülür.

---

## 11. Stack Karşılığı (FastAPI + SQLAlchemy + React)

Bu bölüm standardın somut teknoloji karşılıklarını tek yerde toplar.

Aşağıdaki tablo n6n ve d10n konularının backend, veritabanı ve frontend karşılığını verir; doğruluk-kaynağının daima normalize kaynak tablo olduğu, denormalize projeksiyonun türev olduğu vurgulanır.

| Konu | FastAPI / SQLAlchemy | PostgreSQL | React |
|---|---|---|---|
| Normalize fonksiyon | `platform/kernel/**/normalize` saf fonksiyon + Pydantic validator | — | form doğrulama (RHF/Zod, önizleme) |
| 3NF şema | SQLAlchemy 2.0 model + ilişki (relationship) | ayrı tablo + foreign key; virgüllü kolon yasak | — |
| Bileşik alan | ad/adres/para ayrıştırıcı | tutar `BIGINT` (en-küçük-birim) + `currency` kolon | maskeli/parçalı giriş |
| Enum/referans | uygulama enum + referans tablo | DB enum/`CHECK` veya FK | seçim kutusu (referanstan) |
| Denormalizasyon (d10n) | read-model servis / projeksiyon repo | materialized view veya projeksiyon tablo | (okuma yalnızca) |
| Senkron | olay-tüketimi (Celery) veya zamanlanmış rebuild | tetikleyici/tazeleme + staleness bütçesi | — |
| Migration | Alembic expand-contract + backfill | nullable→backfill→contract; `down` çalışır | — |

---

## 12. Test Stratejisi

Bu bölüm standardın yeşil sayılma koşullarını test tipine göre listeler.

Test şu şekilde uygulanır: (1) *birim* — her normalize fonksiyonu için idempotentlik testi (`f(f(x))==f(x)`), deterministiklik ve sınır-durum tablosu (boş, çok-parçalı, karışık-biçim); para ayrıştırmasında float-yasağı testi. (2) *entegrasyon* — 3NF disiplini (tekrarlayan grup yok; virgüllü çok-değerli kolon yok), enum/`CHECK` kısıtının serbest-metni reddi. (3) *projeksiyon/senkron* — kaynak değişince projeksiyonun güncellendiği, projeksiyonun kaynaktan sıfırdan yeniden-inşa edilebildiği (rebuild eşitlik testi), staleness bütçesinin aşılmadığı. (4) *migration* — backfill doğruluğu, `down` migration çalışması, expand fazında yıkıcı-kısıt yokluğu. Testi "geçsin diye" zayıflatmak (ör. idempotentlik veya rebuild-eşitlik assert'ini kaldırmak) standardı düşürmektir ve yasaktır.

---

## 13. Requirement-ID Tablosu

Bu bölüm standardın her kuralını izlenebilir bir kimlikle listeler; makine kontratındaki `rules[].id` alanları bu kimliklerle hizalanır. n6n kuralları P1 (`must`), d10n kuralları P3 (`may`) tabanındadır.

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| N6N-01 | Her normalize fonksiyonu idempotent uygulanır (`f(f(x))==f(x)`) | Backend | P1 | Unit | İdempotentlik testi tüm normalize fonksiyonları için yeşil | Platform Kernel |
| N6N-02 | Normalize fonksiyon saf ve deterministiktir; sınırda çalışır | Backend | P1 | Unit | Normalize-edilmemiş veri iş katmanına/DB'ye geçemez | Platform Kernel |
| N6N-03 | Şema tabanı 3NF; tekrarlayan grup ve çok-değerli kolon yok | DB | P1 | Integration | Virgülle-ayrılmış çok-değerli kolon yok; ilişki ayrı tabloda | Platform Kernel |
| N6N-04 | Geçişli/kısmi bağımlılık ayrı tabloya çıkarılır | DB | P1 | Integration | 3NF ihlali yalnız etiketli d10n ile caiz | Platform Kernel |
| N6N-05 | Bileşik alan (ad/adres) doğru alt-alanlara ayrıştırılır | Backend/DB | P1 | Unit | Belirsizse ham girdi korunur; kör veri-kaybı yok | Platform Kernel |
| N6N-06 | Para tam-sayı en-küçük-birim + ISO 4217 currency olarak saklanır | Backend/DB | P1 | Unit | Para float olarak saklanmaz; yuvarlama-hatası testi yeşil | Platform Kernel |
| N6N-07 | Sonlu değer kümesi enum/referans ile normalize edilir | Backend/DB | P1 | Integration | Serbest-metin durum/tip yok; `CHECK`/FK zorlar | Platform Kernel |
| D10N-01 | Denormalizasyon yalnız ölçülmüş okuma-yoğun darboğazda caiz | Backend/DB | P3 | Integration | Gerekçe PR'da; kaynak daima 3NF normalize kalır | Data Platform |
| D10N-02 | Denormalize veri açık read-model/projection; kaynağın yerine geçmez | Backend/DB | P3 | Integration | Projeksiyon sahiplik-etiketli, kaynaktan yeniden-inşa edilebilir | Data Platform |
| D10N-03 | Kaynak↔projeksiyon senkron mekanizması ve staleness bütçesi tanımlı | Backend | P3 | Integration | Kaynak değişince projeksiyon tazelenir; gecikme belgeli | Data Platform |
| D10N-04 | Kritik-veri denormalizasyonu outbox+idempotency taşır (scale-invariant) | Backend | P3 | Integration | Tekrar-oynatmada çift-saymaz; olay kaybolmaz | Data Platform |
| D10N-05 | Yazma yolunda (iki yazılabilir yerde aynı gerçek) denormalizasyon yasak | Backend/DB | P3 | Integration | Yalnız türev okuma projeksiyonu; yazma tekildir | Data Platform |
| N6N-08 | Normalize/denormalize şema değişikliği expand-contract ile yapılır | DB/Migration | P1 | Migration | Backfill→contract; `down` çalışır; expand'de yıkıcı-kısıt yok | Platform Kernel |
