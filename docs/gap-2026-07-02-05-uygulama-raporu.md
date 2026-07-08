# Uygulama Raporu — Gap Kapatma Turu (2026-07-02, "uygula")

- Bağlam: `gap-2026-07-02-00-index.md`'deki P0 backlog'un mekanik olarak güvenli kısmı uygulandı.
- İlke: AI taslak/dosya üretir; insan inceler (PR); main'e doğrudan yazılmaz. CI'ı kıracak veya proje-yönetimi kararı gerektiren adımlar zorlanmadı.
- Doğrulama: `biome check .` (232+ dosya) + `tsc --noEmit` + tüm CI kapıları (mevcut 19 + yeni 4) + `vitest run` yeşil.

## 1. Yazılan tam yönergeler (docs/)

Analizde "eksik" bulunan yönergeler TAM (stub değil) yazıldı; repo normatif şablonunu izler; durum "taslak — insan onayı ile kilitlenecek".

Aşağıdaki tablo yeni yönergeleri ve kapattıkları boşluğu gösterir.

| Dosya | Katman | Kapatılan boşluk |
|---|---|---|
| `docs/workflow-directive.md` | archetype/kernel | Workflow birinci sınıf motoru (her yerde referanslanıyordu, dosyası yoktu) |
| `docs/k-kms-directive.md` | kernel | Sır/anahtar yönetimi (başka primitifler buna bağımlıydı) |
| `docs/archetype-ledger-directive.md` | archetype | Çift-taraflı muhasebe (accounting/MRP/payroll temeli) |
| `docs/archetype-order-line-item-directive.md` | archetype | Sipariş/satır kalemi (ecommerce/Fleetx/MRP; sarkan referans) |
| `docs/archetype-inventory-stock-directive.md` | archetype | Stok/envanter (MRP/ecommerce/depo) |
| `docs/archetype-messaging-thread-directive.md` | archetype | Mesajlaşma/thread/feed (sosyal/Teams/e-posta) |
| `docs/panel-tier-contract.md` | surface | Üç panel katmanı (developer/süper-admin/son müşteri) |

## 2. Gerçek kapıya dönüşen + CI'a bağlanan denetimler

Taslak kapılar `tools/agents/`'a taşındı, gerçek şemaya hizalandı ve `.github/workflows/deploy.yml` build job'ına eklendi. Böylece dokümanların "CI'da çalışıyor" dediği ama var olmayan kapılar (yanlış-güven) gerçek oldu.

Aşağıdaki tablo her kapının neyi SERT-fail ettiğini (build kırar) ve neyi WARN ettiğini (izler, kırmaz) ayırır.

| Kapı | Sert-fail (build kırar) | WARN (izler) |
|---|---|---|
| `check-event-semantics.mjs` | `exactly-once` iddiası (anti-pattern); zarf dokümanı yok | olay-tüketici düğümde idempotent/DLQ/replay beyanı eksikse |
| `check-archetype-relation.mjs` | geçersiz `relation.kind`; tree/dag'de döngü beyanı yok; zarf yok | sarkan hedef (fixture henüz yok) |
| `check-state-machine-consistency.mjs` | `status=done` iken kod `not-started`/`scaffolded` (imkansız) | ileri-kayma: kod ilerledi ama status backlog (7 pilot düğüm) |
| `check-secrets.mjs` | gerçek PAT/AWS/Slack/özel-anahtar deseni | — |

Ratchet ilkesi: bugün sert-fail yalnız imkansız/yasak durumda; eksik-ama-beklenen durum WARN. İçerik olgunlaştıkça (insan onayıyla) WARN sert-fail'e çevrilebilir. Bu, "boş-yeşil" eklemeden yanlış-güveni kapatır.

## 3. Veri/şema değişikliği

- `src/data/archetypes/order.json` eklendi: `product.json` politika bloklarını (aiPolicy/migrationPolicy/steelWalls) birebir izler; `customer → order` sarkan ilişkisini çözer.
- `tests/archetype.test.ts` FIXTURES listesine `order` eklendi → `order.json` Zod şemasına + AI/migration güvenlik iddialarına karşı gerçekten doğrulanır (vitest yeşil).

## 4. İnsan kararı bekleyen (bu turda bilinçli olarak ZORLANMADI)

Bunlar mekanik değil; proje/mimari kararıdır ve CI'ı kırma veya yanlış proje-durumu iddia etme riski taşır:

- Pilot CRM zincirindeki 7 düğümün `status`/`phase` ilerletilmesi (şu an WARN). Aktör: insan.
- A-serisi ADR'lerin (actor/capability/mode/computation/pdp) ve yeni v3 yönergelerin "taslak"tan "kilitli"ye alınması. Aktör: insan onayı.
- Kanonik portföy sayısı (README 28/50+, başka doküman 16, brief 18) ve JOB-BOARD için gerçek düğüm; `app-edu`/`app-egitim` çift kaydının birleştirilmesi. Aktör: insan.
- Yeni primitifler için WBS düğümü üretimi — repo'nun `seed-*`/`gen-*` pipeline'ıyla (elle düğüm eklemek check-content'i kırar). Aktör: tooling + insan.
- `AGENTS.md` AA/AAA netleştirmesi (canon dosya). Aktör: insan.
- `docs/drafts/` silinmesi (kullanıcı reddetti; tarihsel korunur).

## 5. Değişen/eklenen dosyalar (özet)

Eklenen: `docs/{workflow,k-kms,archetype-ledger,archetype-order-line-item,archetype-inventory-stock,archetype-messaging-thread,panel-tier-contract}.md` (+ bu rapor), `tools/agents/{check-event-semantics,check-archetype-relation,check-state-machine-consistency,check-secrets}.mjs`, `src/data/archetypes/order.json`.
Değişen: `.github/workflows/deploy.yml` (+4 kapı adımı), `tests/archetype.test.ts` (+order fixture), `docs/gap-2026-07-02-0{0,1,2,3}-*.md` (referans güncellemesi), `docs/drafts/README.md` (superseded notu).
