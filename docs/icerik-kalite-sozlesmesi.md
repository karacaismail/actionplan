# İçerik Kalite Sözleşmesi (Definition of Deep)

Sürüm: 1.0 · Faz: A1 · Bağlı kapı: `tests/content/contentQuality.test.ts` (Faz A2)

Bu sözleşme, "derin enterprise içerik" iddiasını ölçülebilir kritere çevirir. 422 görev sayfasının 14 boyutu bu kritere göre yazılır; `contentQuality` kapısı kontrolü otomatik yapar. Sözleşme hem insan (yazar/denetleyici) hem makine (kapı) için tek referanstır.

## 1. Temel ilkeler

- **Sayfaya-özel:** Her boyutun maddeleri o sayfanın gerçek işlevine/verisine bağlı olmalı; başka sayfaya kopyalanınca anlamsızlaşmalı.
- **Şablon yasağı:** Aşağıdaki "yasak imza" listesindeki kalıp ifadeler kullanılamaz (zorunlu güvenlik-sınır satırları hariç).
- **Somut:** Belirsiz sıfat ("güçlü", "hızlı") yerine teknik kriter ("p95 < 200ms", "deny-by-default + audit").
- **Dil:** Türkçe; teknik terim ilk geçtiği yerde açıklanır.

## 2. Boyut başına eşik

Her dolu (skeleton olmayan) boyut için (eşikler B0 pilotunda altın düğümlerle kalibre edildi):

- Madde sayısı: **2–5**. Altın düğümler 2 substantif maddeyle de kaliteli olabildiği için alt sınır 2'dir. `moduleUsage` app/yaprak (atom/element/molecule) seviyelerde **1** madde olabilir.
- En az **1 sınır-dışı madde**: dolu boyut yalnız zorunlu güvenlik-sınır satırından (Bölüm 5) oluşamaz; en az bir sayfaya-özel madde taşımalı.
- Hiçbir madde yasak imza taşımaz (Bölüm 4) — istisna: zorunlu sınır satırları (Bölüm 5).
- Aynı madde 5+ düğümde birebir tekrar etmez (sınır satırları hariç).
- Boş/placeholder madde yok.

Not: Asıl kalıp (şablon) tespitini Bölüm 4 yasak imzaları + çapraz-tekrar kontrolü yapar; madde-sayısı ve sınır-dışı kontrolleri tamamlayıcıdır.

Boyut-özel beklentiler Bölüm 5 (master plan) rubriğindedir; bu doküman onun makineye-bakan eşiğidir.

## 3. Provenance (köken) damgası

Her boyut bir köken taşır (Faz A3 şeması):

- `template` — `gen-items.mjs` kalıbından; **derin değil**, değiştirilmeli.
- `swarm` — AI ajan (yerel Claude) üretti; kapıdan geçti.
- `human` — insan yazdı/onayladı; swarm bunu ezmez.

Hedef (Küme B sonu): `template ≈ 0`, kalan `swarm` + `human`.

## 4. Yasak şablon imzaları (kapı bunları reddeder)

`gen-items.mjs`'in ürettiği kalıp parçalar. Bir maddede geçerse o boyut "şablon" (derin değil) sayılır:

- `net işlevsel sınır`
- `yaşam döngüsü + durum makinesi`
- `Girdi/çıktı sözleşmesi ve hata yolları`
- `ölü kod elemesi + kod bölme`
- `Döngüsel karmaşıklık eşiği + lint kapısı`
- `secret rotasyonu + en az ayrıcalık`
- `bileşik indeks + imleç sayfalama`
- `N+1 önleme + önbellek`
- `p95 gecikme hedefi ve ölçüm` (jenerik haliyle; gerçek sayı verilirse serbest)
- `dokunma hedefi ≥44px` (jenerik tekrar)
- `label↔input + ARIA hata mesajı`
- `klavye gezinme + kontrast ≥7:1`
- `Görünür odak sırası + ekran okuyucu denetimi`
- `Docker Swarm + sağlık kontrolü`
- `HPA + liveness/readiness probe`
- `AI-destekli senaryo + testing-loop`
- `autonomous QA + golden fixture`
- `Güvenlik olay loglaması + denetim izi`

Not: Liste, kapı testindeki `FORBIDDEN_MARKERS` ile birebir tutulur. Yeni kalıp tespit edilirse iki yere de eklenir.

## 5. İzinli zorunlu sınır satırları (üniform olmaları KASITLI)

Bu satırlar güvenlik güvencesidir; her sayfada aynı olması beklenir ve kapı bunları **reddetmez**:

- `eca` boyutu: "... backend ECA ruleset AI app/module mutasyonunu ve ruleset override denemesini deny eder".
- `aiAgents` boyutu: "... AI app/module üretemez veya güncelleyemez; yalnız ArcheType taslağı/prod-update önerisi üretebilir".
- `aiAgents` boyutu: "sub_prompt güvenilmez girdi; ruleset override/disable denemesi anında deny".

Ek olarak `testing` boyutundaki standart QA-döngü direktifi de bilinçli üniformdur ve allowlist'tedir:

- `testing` boyutu: "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır" (testing-loop maks 6).

Kapı bu satırları `ALLOWED_BOUNDARY` allowlist'i ile tanır. Bu satırlar dışındaki maddeler sayfaya-özel ve derin olmalıdır.

## 6. Altın referans düğümler (kıyas ve koruma)

Bu düğümler örnek-kalite kabul edilir, `provenance=human` damgalanır ve swarm tarafından **ezilmez**. Yeni içerik bu örneklere benzer derinlikte olmalı:

- Kernel: `k-surface`, `k-control-planes`, `k-agent-runtime`, `k-sozlesme`
- CRM dalı: `s-crm`, `m-crm-sales`, `st-crm-lead-mgmt`, `mol-crm-lead-scoring`, `mol-crm-lead-dedup`, `at-crm-email-regex`, `at-crm-domain-blocklist`, `at-crm-score-range-check`, `el-crm-score-field-validator`, `el-crm-score-weight-config`
- App özeti: `app-core-operations`

Not: Bir altın düğümün belirli bir boyutu zayıfsa, o boyut da iyileştirme kapsamındadır; "altın" etiketi düğümün tamamını dokunulmaz yapmaz, yalnız swarm'ın varsayılan ezme davranışından korur.

## 7. Kapı sonucu nasıl okunur

`npm run test:content` (Faz A2) çıktısı:

- **Kırmızı (başlangıç):** 407 şablon düğüm yasak imza taşır — beklenen durum.
- **Yeşil (Küme B sonu):** Tüm dolu boyutlar sözleşmeye uyar.

Bu kapı, Faz F2'ye kadar ana CI'dan (`npm test`) ayrıdır; böylece içerik doldurulurken yayın hattı yeşil kalır. F2'de bloklayıcı yapılır.
