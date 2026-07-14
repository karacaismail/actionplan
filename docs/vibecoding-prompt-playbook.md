# Vibecoding Kanıt Playbook'u — Human Developer Handoff

**Sürüm:** 2.0 · **Tarih:** 2026-07-14
**Durum:** `ARCHIVED-HUMAN-HANDOFF` — doğrudan model/worker promptları kaldırılmıştır.
**Yetki:** `Codex → PM → uzman ajanlar → Claude workers/slaves`.
**Sınır:** Platform `read-only-audit`; ürün uygulaması `human-developer-only`.

## 1. Amaç

Bu playbook küçük bir insan ekibinin her platform işini açılabilir artefakt, test ve
rollback kanıtıyla kapatması için kullanılır. Actionplan doc-maintainer platform kodu,
testi, migration'ı veya branch/PR üretmez. Claude yalnız Codex'in doğrulanmış ve sınırlı
worker çağrısında öneri/ara çıktı verir.

## 2. Altı parçalı human-developer kartı

Her kart aşağıdaki alanları eksiksiz taşır:

1. **Amaç ve kapsam:** iş sonucu, allowed-files ve non-goals.
2. **Beklenen dosyalar:** insan geliştiricinin oluşturacağı veya değiştireceği kesin yollar.
3. **Pozitif test:** komut, beklenen assertion ve yeşil kanıt türü.
4. **Negatif test:** implementation öncesi kırmızı, sonrasında yeşil davranış.
5. **Manuel kontrol:** route/ekran/operasyon ve gözlenecek sonuç.
6. **Red ve rollback:** sahte-yeşil koşulu, geri alma tetikleyicisi ve runbook.

Kart model komutu değildir. Codex/PM/uzman/Claude katmanı kartı platformda çalıştırmaz;
yalnız tutarlılık, risk ve kanıt yeterliliğini salt-okunur denetler.

## 3. Kanıt sayılan ve sayılmayan

| Kabul edilen | Reddedilen |
|---|---|
| Açılabilir dosya veya gerçek PR URL'si | “Kod hazır” metin iddiası |
| Kırmızı→yeşil test kaydı | Yalnız son yeşil ekranı |
| Negatif tenant/authz/migration assertion'ı | Assertion'sız smoke |
| CI run ve merge SHA | Placeholder SHA/URL |
| Manuel route gözlem notu | “Ekran düzgün” cümlesi |
| Çalıştırılmış rollback/drill kaydı | Yalnız rollback planı |

Docs build'i, Actionplan Pages yayını veya WBS coverage testi platform runtime kanıtı
değildir.

## 4. Customer→Order örnek sürekliliği

| Ünite | İnsan geliştirici teslimi | Zorunlu negatif |
|---|---|---|
| u01 | Money/Email/CustomerId değer tipleri | Para birimi karışımı ve empty≠zero |
| u02 | Customer CRUD | Duplicate ve geçersiz email |
| u03 | Customer contract/API yüzeyi | Yetkisiz alan erişimi |
| u04 | Customer migration + downgrade | Tenantlar arası okuma |
| u05 | GraphQL query/mutation | Depth/complexity ve authz |
| u06 | Order + customer FK | Orphan order ve yanlış tenant FK |
| u07 | Tenant izolasyonu | En az bir cross-tenant mutation |
| u08 | Liste/form UI | Klavye, odak, hata anonsu ve kontrast |

Her ünite öncekinin kanıtlı public sözleşmesini tüketir. Bir ünite backlog veya
requirements durumundaysa beklenen kanıt planlanır; gerçekleşmiş gibi yazılmaz.

## 5. Örnek human-developer execution kartı

**Amaç:** Money değer tipinde aynı para birimli toplama ve HALF_UP yuvarlama.

**Allowed files:** İnsan geliştiricinin gerçek platform mimarisinde seçtiği Money kaynak ve
test dosyaları. Actionplan bu yolları uydurmaz; workspace manifest ve gerçek checkout ile
doğrular.

**Önce kırmızı:** TRY ile USD toplamının reddedildiğini ve eksik tutarın sıfır olmadığını
assert eden testler implementation öncesinde kırmızı olmalıdır.

**Implementation:** Yalnız insan geliştirici immutable değer tipini ve doğrulamayı yazar.

**Green:** Aynı para birimi toplama, HALF_UP, currency mismatch ve empty≠zero testleri
gerçek komut çıktısıyla yeşil olur.

**Red/rollback:** Float kullanımı, currency guard eksikliği, testin zayıflatılması veya
kanıtsız “passed” kaydı reddedilir. Paket bağımsız revert edilir.

## 6. Yetki ve güvenlik

- Codex MASTER ve tek nihai denetçidir.
- PM yalnız ardıl koordinatördür; fallback master değildir.
- Uzman ajanlar PM üzerinden alan bulgusu verir.
- Claude workers/slaves alt görev devredemez, Git yapamaz ve kapsam genişletemez.
- Claude yalnız `claude.ai / firstParty / max` doğrulamasıyla Codex tarafından çağrılır;
  doğrulama yoksa fail-closed durur.
- Platform yazımı gerekirse AI çalışması durur ve kart insan geliştiriciye teslim edilir.

## 7. Kapanış kapısı

İnsan geliştirici artefaktları, pozitif+negatif testler, manuel kontrol, CI ve rollback
kanıtı yoksa kart kapanmaz. PM evidence paketini hazırlar; Codex gerçek dosya ve
deterministik kapıları bağımsız doğrulayıp yalnız Actionplan teslim kararını verir.
