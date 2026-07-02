# Uygulama Raporu — PR #7 Doc-Only Temizleme (2026-07-02)

Bu rapor, PR #7'nin `main`/#8 sonrasındaki daraltılmış halini kaydeder. Amaç:
gap analizinin gerçek doküman/yönerge katkılarını korumak, generated node/veri/tool katmanında
main'in 17 boyut sistemini ve semantik kapılarını bozmamaktır.

## 1. Taşınan doküman/yönergeler

Analizde eksik bulunan yönergeler TAM metin olarak taşındı; durumları "taslak — insan onayı ile
kilitlenecek" olarak kalır.

| Dosya | Katman | Kapatılan boşluk |
|---|---|---|
| `docs/workflow-directive.md` | archetype/kernel | Workflow birinci sınıf motoru |
| `docs/k-kms-directive.md` | kernel | Sır/anahtar yönetimi |
| `docs/archetype-ledger-directive.md` | archetype | Çift-taraflı muhasebe |
| `docs/archetype-order-line-item-directive.md` | archetype | Sipariş/satır kalemi |
| `docs/archetype-inventory-stock-directive.md` | archetype | Stok/envanter |
| `docs/archetype-messaging-thread-directive.md` | archetype | Mesajlaşma/thread/feed |
| `docs/panel-tier-contract.md` | surface | Panel katmanı sözleşmesi |

Gap analiz serisi (`gap-2026-07-02-00/01/02/03`) ve bu rapor da doc-only kapsamda taşındı.
`docs/drafts/` altındaki taslaklar tarihsel kayıt olarak korunur.

## 2. Bilinçli olarak taşınmayanlar

Bu temizleme turu aşağıdaki katmanları PR #7'den çıkardı ve `main`/#8 halini korudu:

- `.github/workflows/deploy.yml`
- `tools/agents/**`
- `tools/lib/**`
- `src/data/**`
- `src/data/generated/**`
- `public/data/nodes.json`
- `src/schemas/**`
- `src/engine/**`
- `tests/**`
- WBS teknik ad/metafor refactor'ına ait kök veya mevcut-doc değişiklikleri

Özellikle `src/data/archetypes/order.json` ve buna bağlı test değişikliği bu doc-only PR'da yoktur.
Bu fixture ayrı bir veri/test PR'ı olarak ele alınmalıdır.

## 3. Main/#8 ile çakışma çözümü

PR #7 branch'i #8'den geride olduğu için doğrudan merge, generated node dosyalarını ve 17 boyut
semantik kapısını geri alırdı. Temiz branch `origin/main` tabanından açıldı; yalnız yukarıdaki
doküman/yönerge dosyaları taşındı. Böylece:

- 17 üretim boyutu ve day-2 semantic gate korunur.
- Backfill ve generated node çıktıları yeniden üretilmez.
- Tool/CI katmanında PR #7 kaynaklı deletion veya eski sürüm uygulanmaz.
- `docs/gap-2026-07-02-06-boyut-analizi.md` main'de kalır; PR #7 onu silmez.

## 4. Doğrulama

Doc-only branch için beklenen doğrulama: `git diff --stat`, `npm run test:content`, içerik
kapıları ve gerekli görülen lint/typecheck. Son koşu sonuçları PR temizleme raporunda tutulur.
