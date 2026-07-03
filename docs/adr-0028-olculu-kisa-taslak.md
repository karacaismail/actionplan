# ADR-0028 (TASLAK) — "Ölçülü-Kısa" Madde Muafiyeti

Statü: **taslak — insan onayı bekler; bu PR'da audit motoruna DEĞİŞİKLİK YOKTUR.**
Bağlam: audit motoru <35 karakterli her maddeyi `short-items` cezasına sokar. W2-W4
ölçümleri kısa maddelerin bir alt-sınıfının (W4 sonu: 60 madde) bilgi kaybı olmadan
kısa olduğunu gösterdi — ör. "p95 < 200ms", "RLS: tenant_id filtre". Bunları uzatmak
bilgi eklemez, kalıp-ek üretir.

## Tanım — "ölçülü-kısa" nedir?

Bir madde AYNI ANDA şu üç koşulu sağlıyorsa ölçülü-kısadır:
1. **Ölçü işareti** taşır: sayı, %, p95/p99, ≥/≤/</>, süre birimi (ms/sn/dk/gün) veya
   sabit-değerli teknik kısaltma (RLS, 2FA, AAA).
2. **Alan-jetonu** taşır: düğümün id/title/tags/summary'sinden ≥4 karakterlik bir jeton
   maddede geçer (bağlam kanıtı — jenerik kopya değil).
3. **Tek önerme**dir: tek eşik/tek kural beyan eder; "ve benzeri", "vb.", "gerekli"
   gibi genişletici-belirsiz ifade içermez.

## Kabul edilebilir / edilemez örnekler

Kabul: "p95 < 200ms (skorlama ucu)" · "retention: 24 ay" · "axe AAA: 0 ihlal".
Red: "Hızlı olmalı" (ölçü yok) · "%99 uptime" tek başına (alan-jetonu yok) ·
"p95 hedefi tanımlanacak" (belirsiz-gelecek, generic-marker).

## Yanlış muafiyet nasıl engellenir?

1. Muafiyet YALNIZ `short` cezasını kaldırır; vague/generic/duplicate cezaları ve
   semantik must+anyOf kuralları aynen işler.
2. Muafiyet oranı ratchet'e bağlanır: ölçülü-kısa sayısı baseline'a kilitlenir,
   artış kapıyı kırar (kısa yazmayı teşvik etmesin).
3. Ölçü-işareti regex'i dar tutulur (yukarıdaki liste); "hedef" gibi kelimeler
   TEK BAŞINA ölçü sayılmaz.
4. Test-önce: `tests/audit.test.ts`'e ölçülü-kısa fixture'ları (geçen 3 + kalan 3)
   motor değişikliğiyle AYNI PR'da eklenir; audit-parity (score.mjs) korunur.

## Uygulama önerisi

- `scoreDimension` içinde `short` sayacı, ölçülü-kısa koşulunu sağlayan maddeleri
  atlar (ceza yok, bayrak yok); `measuredShort` ayrı sayaç olarak raporlanır.
- Etki tahmini (W4 verisi): short-items 96→~40; skor etkisi +0.00..0.02/node (küçük).

## Karar önerisi: AYRI PR

Bu ADR'ın uygulaması **ayrı PR** olmalıdır: (a) motor değişikliği tüm skorları oynatır
— karışık PR'da içerik-değişimi etkisiyle ayrıştırılamaz; (b) ratchet baseline'ları
motor-değişimi PR'ında tek başına yeniden kilitlenmeli (temiz atıf); (c) parite +
fixture testleri kendi kırmızı→yeşil döngüsünü ister. Bu turda motor DEĞİŞMEDİ.
