# Dalga 4 — Kalıp Normalizasyonu + Kalan Borç Planı ve Sonucu (2026-07-03)

Taban (main f6a3465): short-items 256 / gerçek borç 166 (performance 81) / WARN 2.549 /
mapping-serisi kalıp 40 (10+) ve max 62. Rapor: `reports/wave4-before.json`.

## FAZ 1 bulgusu — TAM envanter resmi değiştirdi

`report-pattern-inventory.mjs` (yeni, kalıcı; node-tabanlı, append/enrich DAHİL,
title birebir maskelenir): korpus-genelinde 25.516 madde; birebir-tekrar(≥5) yalnız 4
(hepsi bilinçli-üniform sınır satırı); maskeli 10+ grup 145, **en büyük 436** —
bu 436'lar day-2 backfill temel katmanı (PR #8'de bilinçli kabul), 368/367'ler içerik
sözleşmesinin ALLOWED_BOUNDARY satırları. Üç sınıf ayrıştırıldı:
(a) bilinçli-üniform (normalizasyon hedefi DEĞİL), (b) backfill temel katman
(derinleştirme W5+ içerik kararı), (c) **rewrite-katmanı** (W2-W4 ekleri + enrich) —
bu turun hedefi.

## Uygulanan işler

1. **pattern-pools.mjs** (yeni TEK KAYNAK): performance 5→30 varyant (cache/stale,
   queue-lag/backpressure, bundle/hydration, cold-start, DB-lock, dış-API timeout,
   batch-SLO aileleri dahil); toplam ~200 varyant, 17 üretim boyutu.
2. **normalize-patterns.mjs** (yeni, kalıcı): rewrite-katmanında 9+ grupların fazlasını
   kullanım-dengeli + SEMANTİK-GEÇEN varyantla değiştirir (base'li maddede orijinal
   kısa base AYNEN korunur; enrich maddesinde tam-değişim). **918 madde normalize edildi.**
3. **Borç rewrite**: 182 kısa madde (90 node) yeni havuzla dönüştürüldü.
4. **WARN takviyesi**: 484 hedefli append (65 node; W3-onaylı desen; borç kapatmada
   KULLANILMADI — borç yalnız rewrite ile indi).
5. **W3 sınır vakaları**: fe-theme.owasp ve s-kvkk.deployment ekleri madde-KONUSUNA
   hizalı elle yeniden yazıldı.
6. **ADR-0028 taslağı** (ölçülü-kısa muafiyeti): motor DEĞİŞMEDİ; ayrı PR önerisi.

## W4.1 düzeltmesi — ölçüm-uygulama sapması ve kapanışı

Merge-öncesi denetimde bulundu: WARN-takviye append dalgası normalizasyondan SONRA
koştuğu için rewrite-katmanı yeniden şişmişti (max 63'e dönmüştü) ve ilk rapor bayat
ölçüme dayanıyordu. Kalıcı çözüm: gruplama mantığı `tools/lib/pattern-layer.mjs`'e
tekilleştirildi — normalize-patterns (yazıcı) ve check-weak-content (CI ratchet)
AYNI fonksiyonu kullanır; kapıdaki sayı ile aracın gördüğü sayı bir daha ayrışamaz.
Ek olarak 10 boyuta must+anyOf-garantili ~60 yeni varyant eklendi ve normalize
yakınsayana kadar koşuldu.

## Sonuç (W4.1 sonrası)

short 256→96, borç 166→43, performance-borcu 81→19, WARN 2.549→2.254,
rewrite-katmanı (canonical, append dahil): **10+ grup 0, en büyük grup 9** —
her iki kalıp hedefi TAM tuttu. Skor düşüşü 0. Kalıp-normalize toplamı 1.179 madde.
Ratchet: patterns10plus=0 ve maxPatternGroup=9 weak-content baseline'ına kilitli;
history mapping-serisi ara ölçümü (42/24) denetim izi olarak korur.
