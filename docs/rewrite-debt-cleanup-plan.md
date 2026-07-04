# Kalan Gerçek Rewrite Borcu Temizliği — Plan (mini tur, W5 değil)

Taban: main 5aad044. Envanter: `reports/rewrite-debt-cleanup-before.json` — **43 madde / 36 kart**.
Dağılım: {"performance": 19, "securityOptimization": 4, "mobileApps": 4, "owasp": 1, "integration": 4, "featureDefs": 2, "deployment": 3, "security": 3, "wcag": 2, "testing": 1}.

## Borç tanımı ve neden bilinçli-kısa değiller

Bilinçli-kısa = <35 karakter AMA ölçü işareti (sayı/%/p95/≥…) VE node alan-jetonu birlikte var.
Bu 43 madde iki sınıfta kalıyor: 40'ı "ölçü/eşik YOK" (alan bağlamı var ama kanıtsız beyan),
3'ü "ölçü + alan-jetonu birlikte YOK" (at-crm-score-range-check.deployment, dist-travel.deployment,
s-mail.performance[2]).

## Yöntem (W2-W4 protokolünün aynısı, hedefli)

Yalnız bu 43 maddeye dokunulur; append YOK. Format: `eski madde — ölçülü ek` (eski metin birebir
başta korunur). Ek, pattern-pools'tan KULLANIM-DENGELİ seçilir: pattern-layer use haritasında
9 kullanıma ulaşmış imza ADAY DEĞİLDİR (mevcut kalıp grupları büyüyemez; max 9 korunur).
Eski niyetle uyumlu aile tercih edilir (ör. "önbellekli"→cache ailesi, "asenkron/kuyruk"→lag ailesi,
"tembel başlatılır"→cold-start ailesi). Guard'lar: BANNED ifade, FORBIDDEN imza, kart-içi tekrar,
semantik gerileme (yazım öncesi kart yeniden değerlendirilir), 40+ karakter.

## Kabul ölçütleri

borç 43→0 · short-items 96→<60 beklenen (36 borç-kartın tamamı kapanırsa 96-36=60; bilinçli-kısa
kartlar kalır) · WARN artmaz · kalıp 0/9 korunur · skor düşüşü 0 · madde sayısı değişimi 0.
