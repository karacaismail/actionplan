---
name: ultra-fast-development
description: Actionplan'da atomik, bant-içi değişiklik paketlerini ULTRA_FAST_V1 politikasına göre teslim eder — hedeflenmiş test bandı, sabit checkpoint kadansı, `qaDiscipline.fullQaSequence` sırası ve JIT tek-worktree Pane admisyonu (sayı/eşik/sıra kanonik JSON'dadır). Bir Codex Desktop MASTER paketi allowed-files + non-goals ile sınırlanmış, kısa-kod bütçesi içinde kalan bir Claude worker görevi tanımladığında OTOMATİK devreye gir; sayı/eşik sorusu geldiğinde de kullan.
---

# Ultra Hızlı Teslim

Bu skill kural METNİ taşımaz. TEK kanonik makine sahibi
`src/data/standards/short-code.json#changePackageBudget.ultraFastV1`dir (bağ:
`src/data/standards/short-code.json#changePackageBudget.ultraFastPolicyRef`). Sayı/eşik
sorulduğunda o JSON'u oku; burada tekrar etme.

## Ne zaman devreye girer

- Codex Desktop MASTER, tek bir Claude worker'a (test yazarı / implementasyon yazarı /
  salt-okunur reviewer) `allowed-files` + en az bir `non-goal` ile sınırlanmış, kısa-kod
  bant içinde kalan bir paket verdiğinde — otomatik.
- "ultra fast", "hızlı teslim", "checkpoint kadansı", "test bandı" gibi ifadeler geçtiğinde.

## Rol ayrımı (her zaman üç ayrı kişi/oturum)

1. **Test yazarı** — `tests/ultraFastDeliveryPolicy.test.ts` benzeri RED-establishing
   suite'i yazar; implementasyonu yazmaz.
2. **İmplementasyon yazarı** — RED testi GREEN'e getirir; testi düzenlemez.
3. **Salt-okunur reviewer** — aynı donmuş anlık görüntü hash'i üzerinde bağımsız GREEN
   verir; kendi yazdığı paketi review edemez.

## Akış (özet)

1. Kapsamı `ultraFastV1.testScoping`'in `activeDefault`/`nonBehavioral` bantlarına göre
   daralt; bant dışına çıkış yalnız `namedRiskException`'ın üç koşulunu (adlandırılmış
   risk + sınırlı yerel tavan + bağımsız review) birlikte sağlayarak mümkündür.
2. `ultraFastV1.checkpointCadence` kadansında ilerle ve yalnız o alanın `terminalOutcomes`
   listesindeki sonuçlardan biriyle kapan; JSON'da yazılı sayı/liste burada tekrar
   edilmez — çalışma zamanında oku.
3. QA'yı `ultraFastV1.qaDiscipline.fullQaSequence`'in belirttiği sırayla koştur; değişmemiş
   anlık görüntüde tekrar koşma. Tarayıcı doğrulaması yalnız görünür UI yolculuğu değiştiyse.
4. Pane admisyonu `ultraFastV1.paneAdmission`'a uyar: JIT + tek tam-eşleşen worktree,
   spekülatif oluşturma yok; GC yalnız olay-güdümlü (bkz. `pane-garbage-collector` skill).
5. Geri-alınabilir kararları (`decisionAuthority.masterDecidesWithoutAsking`) MASTER
   sormadan verir; yalnız `decisionAuthority.ownerQuestionCategories` kapsamındaki
   kararlar sahibe sorulur.

## Doğrulama

`node tools/agents/check-ultra-fast-delivery.mjs` — deterministik, salt-okunur, ağa/Git'e
çıkmaz; sözleşmeyi, işaretçi projeksiyonlarını, kanıt hash'lerini ve eski-rota yokluğunu
kontrol eder, `ULTRA_FAST_DELIVERY_GREEN` yazıp 0 ile çıkar veya adlandırılmış hatayla RED
döner.

## Referanslar

- `src/data/standards/short-code.json#changePackageBudget.ultraFastV1` (kanonik sözleşme)
- `RULES.md` (kısa işaretçi indeksi)
- `.claude/agents/ultra-fast-test-writer.md`, `ultra-fast-implementation-writer.md`,
  `ultra-fast-reviewer.md` (üç ayrı rol profili)
