# ADR-0028 (TASLAK) — "Ölçülü-Kısa" Madde Muafiyeti

Statü: **kabul — W5 uygulandı (2026-07-04).**
Bağlam: audit motoru <35 karakterli her maddeyi `short-items` cezasına sokar. W2-W4
ölçümleri kısa maddelerin bir alt-sınıfının (W4 sonu: 60 madde) bilgi kaybı olmadan
kısa olduğunu gösterdi — ör. "p95 < 200ms", "RLS: tenant_id filtre". Bunları uzatmak
bilgi eklemez, kalıp-ek üretir.

W5 dry-run sonucu bu varsayımı daralttı: mevcut 60 kısa kartın 59'u ADR/LandX
kimlik numarası taşıyan kalıp cümleydi, ölçü değildi. Bu yüzden kimlik numarası
tek başına ölçü sayılmaz; yalnız gerçek eşik/oran/birim/teknik sabit muafiyet alır.

## Tanım — "ölçülü-kısa" nedir?

Bir madde AYNI ANDA şu üç koşulu sağlıyorsa ölçülü-kısadır:
1. **Ölçü işareti** taşır: sayı, %, p95/p99, ≥/≤/</>, süre birimi (ms/sn/dk/gün) veya
   sabit-değerli teknik kısaltma (RLS, 2FA, AAA). Çıplak kimlik numarası
   (`ADR-0001`, `LandX L1` gibi) ölçü değildir.
2. **Alan-jetonu** taşır: düğümün id/title/tags/summary'sinden ≥4 karakterlik bir jeton
   maddede geçer (bağlam kanıtı — jenerik kopya değil).
3. **Tek önerme**dir: tek eşik/tek kural beyan eder; "ve benzeri", "vb.", "gerekli"
   gibi genişletici-belirsiz ifade içermez.

## Kabul edilebilir / edilemez örnekler

Kabul: "p95 < 200ms (skorlama ucu)" · "retention: 24 ay" · "axe AAA: 0 ihlal" ·
"Skor 7:1 kontrast".
Red: "Hızlı olmalı" (ölçü yok) · "%99 uptime" tek başına (alan-jetonu yok) ·
"p95 hedefi tanımlanacak" (belirsiz-gelecek, generic-marker) ·
"ADR-0001 tipli arayüzle bağlanır" (kimlik numarası ölçü değil).

## Yanlış muafiyet nasıl engellenir?

1. Muafiyet YALNIZ `short` cezasını kaldırır; vague/generic/duplicate cezaları ve
   semantik must+anyOf kuralları aynen işler.
2. Muafiyet oranı ratchet'e bağlanır: ölçülü-kısa sayısı baseline'a kilitlenir,
   artış kapıyı kırar (kısa yazmayı teşvik etmesin).
3. Ölçü-işareti regex'i dar tutulur (yukarıdaki liste); "hedef" gibi kelimeler
   ve `ADR-0001` gibi kimlik numaraları TEK BAŞINA ölçü sayılmaz.
4. Test-önce: `tests/audit.test.ts`'e ölçülü-kısa fixture'ları (geçen 3 + kalan 3)
   motor değişikliğiyle AYNI PR'da eklenir; audit-parity (score.mjs) korunur.

## Uygulama önerisi

- `scoreDimension` içinde `short` sayacı, ölçülü-kısa koşulunu sağlayan maddeleri
  atlar (ceza yok, bayrak yok); `measuredShort` ayrı sayaç olarak raporlanır.
- W5 sonucu: short-items 60→59; `measuredShort` 1. Kalan 59 kart gerçek kısa borçtur.

## Karar

Bu ADR'ın uygulaması motor/test/rapor/ratchet değişikliğiyle sınırlıdır; içerik
node'larına dokunulmaz. Baseline motor değişimiyle birlikte yeniden kilitlenir.
