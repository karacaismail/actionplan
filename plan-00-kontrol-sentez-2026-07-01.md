# Plan Paketi — Kontrol, Sentez ve Kritik Bulgular

> **ARCHIVED-HUMAN-HANDOFF** — 2026-07-01 tarihli karar ve gap anlık görüntüsü.
> Yetki zinciri: `Codex → PM → uzman ajanlar → Claude workers/slaves`.
> Codex nihai karar merciidir; PM ardıl koordinasyon yetkilisidir. AI erişimi
> `read-only-audit`, platform yürütücüsü `human-developer-only`dır.

Bu belge çalıştırılabilir prompt, model görevi veya platform yazma izni değildir. Tarihsel
bulguları ve bunların hangi kanonik belgelere taşındığını gösteren insan geliştirici handoff
özetidir. Güncel repo/test gerçeği her zaman bu anlık görüntüden üstündür.

## 1. Tarihsel kontrol sonucu

2026-07-01 denetiminde ArcheType, Kernel ve Surface için üç eleştiri raporu ile ortak indeks
mevcuttu:

| Katman | Tarihsel kaynak | Ana mercek |
|---|---|---|
| ArcheType | `elestiri-01-archetype-2026-07-01.md` | AI-First, yüksek trafik, UX |
| Kernel | `elestiri-02-kernel-2026-07-01.md` | yüksek trafik, AI-First, UX |
| Surface | `elestiri-03-surface-2026-07-01.md` | UX, AI-First, yüksek trafik |
| Ortak indeks | `elestiri-00-index-2026-07-01.md` | ortak tez ve girdi denetimi |

O tarihte Actor/Party, Capability, Mode-Profile, Computation/Derivation ve PDP sözleşme
taslağı düzeyindeydi. Bu tarihsel tespit runtime implementation kanıtı değildir. Güncel
durum için `docs/kernel-readiness-gap-analysis-2026-07-14.md` ve
`reports/kernel-gap-inventory-2026-07-14.json` kullanılır.

## 2. Plan dosyalarının bugünkü statüsü

| Dosya | Korunan değer | Bugünkü statü |
|---|---|---|
| `plan-01-vibecoding-eylem-faz-faz-2026-07-01.md` | dalga ve bağımlılık geçmişi | arşivlenmiş human-developer handoff |
| `plan-02-numeronym-standart-prompt-paketi-2026-07-01.md` | numeronym sınıflandırması | arşivlenmiş insan geliştirici checklist'i |
| `plan-03-yeni-yonergeler-2026-07-01.md` | primitif mimari tarifleri | arşivlenmiş karar girdisi |
| `plan-04-paralel-ajan-orkestrasyon-2026-07-01.md` | eski orkestrasyon riskleri | arşivlenmiş human-developer handoff |
| `plan-05-durum-raporu-ve-sirada-ne-var-2026-07-01.md` | 2026-07-01 durum fotoğrafı | arşivlenmiş durum kaydı |

Hiçbiri model, worker veya uzman ajana branch, commit, PR, test ya da platform kodu yazma
yetkisi vermez. Yalnız insan geliştirici onaylanmış handoff'u implementation reposunda uygular.

## 3. Korunan kritik gap sınıfları

Tarihsel C1–C6 sınıfları şunlardı:

1. backend stack terminolojisi drift'i;
2. seed kaynaklarının kanonik içerikle ayrışması;
3. WCAG taban/AAA hedef ayrımı;
4. Surface i18n sözleşmesi;
5. outbox/idempotency gibi scale invariant'ların opsiyonel kalması;
6. beş çekirdek primitifin runtime implementation kanıtının olmaması.

Bu maddeler yalnız güncel kanonik dosya, makine-okunur JSON ve deterministik test kanıtıyla
kapatılabilir. Doküman varlığı runtime green anlamına gelmez.

## 4. İnsan geliştirici handoff kapısı

- Codex gerçek repo ve testleri inceler, kapsamı ve nihai kararı verir.
- PM yalnız sırayı, bağımlılıkları ve evidence zarfını koordine eder.
- Uzman ajanlar salt-okunur bulgu üretir.
- Claude ancak Codex'in sınırlı çağrısıyla ara çıktı verir; bağımsız yürütme yapmaz.
- Platform değişikliği yalnız insan geliştirici tarafından test-first uygulanır.
- PR/CI/test/deploy kanıtı olmadan hiçbir düğüm `verified` veya `done` yapılmaz.

## 5. Kanonik devam noktası

Kernel için sıradaki kanonik kapı, mevcut base queue sırasını bozmayan ve bugün bloklu olan
`KDP-01` handoff'udur. Code-start kararı verilmez; önce `PR-01..PR-11` predecessor evidence,
tenant/schema portları ve insan queue-order kararı doğrulanır.
