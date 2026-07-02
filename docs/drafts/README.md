# drafts/ — TARİHSEL TASLAKLAR (promote edildi; artık kaynak-doğru değil)

Durum (2026-07-02, "uygula" turu): bu klasördeki taslakların TAMAMI promote edildi. Bu klasör
yalnız tarihsel kayıt olarak durur; kaynak-doğru sürümler aşağıdaki yerlerdedir. Bir çelişki
olursa promote edilmiş sürüm geçerlidir.

## Promosyon eşlemesi

Yönerge taslakları → TAM yönergeler (docs/):
- `k-kms-directive.md` → `docs/k-kms-directive.md`
- `workflow-directive.md` → `docs/workflow-directive.md`
- `archetype-ledger-directive.md` → `docs/archetype-ledger-directive.md`
- `archetype-order-line-item-directive.md` → `docs/archetype-order-line-item-directive.md`
- `panel-tier-contract.md` → `docs/panel-tier-contract.md`
- (ayrıca yeni: `docs/archetype-inventory-stock-directive.md`, `docs/archetype-messaging-thread-directive.md`)

Kapı taslakları → GERÇEK kapılar (tools/agents/) + CI'a bağlı (`.github/workflows/deploy.yml`):
- `check-event-semantics.mjs` → `tools/agents/check-event-semantics.mjs`
- `check-archetype-relation.mjs` → `tools/agents/check-archetype-relation.mjs`
- `check-state-machine-consistency.mjs` → `tools/agents/check-state-machine-consistency.mjs`
- (ayrıca yeni: `tools/agents/check-secrets.mjs`)

## Kapıların tasarım ilkesi (ratchet)

Sert-fail (build kırar) yalnız imkansız/yasak durumda: `status=done` iken kod `not-started`;
geçersiz `relation.kind`; `exactly-once` iddiası; gerçek sır deseni. Eksik-ama-beklenen durumlar
(requirements fazında beyan eksikliği, sarkan fixture hedefi, pilot düğüm ileri-kayması) WARN olarak
raporlanır; insan içerik olgunlaştıkça bunlar bloklayıcıya çevrilebilir. Amaç: "boş-yeşil"i
büyütmeden yanlış-güveni kapatmak.

Bu klasör silinmedi (kullanıcı silmeyi reddetti); tarihsel referans olarak korunur.
