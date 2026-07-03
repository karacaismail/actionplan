# Dalga 3 — Kısa Madde + WARN Azaltma Planı ve Sonucu (2026-07-03)

Taban (main 0772034): short-items 466 kart / 534 kısa madde (126 bilinçli-kısa + 408 gerçek borç, 182 node); WARN 2.874.

## Üç mekanizma

1. **Yeni rewrite dalgası** (W2 protokolü + v3 aracı): 210 kart / 249 madde. Araç v3 farkları:
   havuzlar boyut başına 3→5 varyanta çıkarıldı; kalıp seçimi hash yerine KULLANIM-DENGELİ
   (min-count; önceki dalgaların kullanımları mapping'ten yüklenir; varyant-başına 9 limit).
2. **Kalıp inceltme (thin)**: W2'nin 10+ tekrarlı eklerinden 365 madde, orijinal kısa base
   korunarak yeni varyantlarla yeniden çeşitlendirildi (2 tur; ikinci turda havuz +2'şer varyant).
3. **Hedefli enrich** (PR #10 append deseni): en zayıf 60 node'un warn'lı kartlarına 464
   kavram-taşıyan madde + 62 ref — WARN'ı 2.783→2.562'ye indiren adım.

## Ölçüm metodolojisi düzeltmesi (dürüstlük notu)

W2 raporundaki "21 kalıp 10+ / en yüksek 24" ölçümü title-maskeleme kaçakları nedeniyle
DÜŞÜK sayıyordu. Düzeltilmiş (title-birebir + sayı-maskeli) ölçüm: W3 öncesi 42 kalıp 10+ /
en yüksek 62. İki seri de raporlanır: eski metodla 21→19 (en yüksek 24→20); yeni metodla
42→40 (en yüksek 62 — kapasite sınırı). Tam ≤9 normalizasyonu dalga-4 işi: havuzların
8-10 varyanta çıkarılması + tam yeniden-dengeleme gerektirir.

## Sonuçlar

short-items 466→**256** (<300 ✓) · kısa madde 534→285 · gerçek borç 408→**166** (<250 ✓) ·
bilinçli-kısa 126→119 · WARN 2.874→**2.562** (<2.600 ✓) · generic 0 · empty-but-not-na 0 ·
FAIL 0 · skoru düşen node 0/467 · top-40 ort. 2.786→2.831.

## Dalga 4 adayları

Kalıp tam-normalizasyonu (≤9); kalan 166 gerçek borç maddesi; WARN 2.562 kalan kütle;
126 bilinçli-kısa için audit motorunda "ölçülü-kısa muaf" sınıfı (ADR filtresiyle);
missing-evidence 460 (kod bağı) ve missing-ref 1.763 kademeli doldurma.
