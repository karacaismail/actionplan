# archetype-order-line-item — Sipariş / Satır-Kalem Metamodeli (TASLAK — kilitlenmeyi bekliyor)

Durum: taslak iskelet. CI'a bağlı değil. İnsan onayı gerekir.
Gerekçe: `customer.json` `relations`'ta `"target":"order"` referansı var ama Order ArcheType TANIMSIZ — yani zaten sarkan bir FK hedefi. Ecommerce, Fleetx (kargo/yemek), MRP satış-siparişi hepsi buna dayanır (P0, bkz. gap-2026-07-02-02-archetype §4 G-A3).

## 1. Amaç / Kapsam / Non-goals

- Amaç: sipariş başlığı + satır kalemleri + karşılama (fulfillment) durumunu tek metamodelde tanımlamak.
- Kapsam: order header (party, tarih, durum, para birimi), order_line (ürün ref, miktar+birim, birim fiyat: Money, indirim, vergi), fulfillment (sevkiyat, kısmi teslim), iptal/iade.
- Non-goals: fiyat/indirim kuralı motoru (Computation/pricing işi); ödeme (payment provider işi); stok düşme (inventory işi — çağırır, sahiplenmez).

## 2. Nedir / ne yapar / ne yapmaz

- Nedir: sipariş aggregate'i (header + lines) sözleşmesi.
- Ne yapar: "order total = satırların toplamı" değişmezini zorlar; durum geçişini (draft→confirmed→fulfilled→closed) workflow ile yönetir.
- Ne yapmaz: generated CRUD ile durum yazmaz (typed action); onaylı siparişin satırını sessizce değiştirmez.

## 3. Sözleşme şekli (backend — SQLAlchemy 2.0 / FastAPI)

TODO: `order` (id, party_ref, currency, status, tenant_id), `order_line` (order_ref, product_ref, quantity: Measure, unit_price: Money, discount, tax), `fulfillment` (order_ref, shipped_qty, carrier_ref). Değişmez: sum(line totals) = order total (Computation ile türetilir/denetlenir). Money + Measure atomları zorunlu.

## 4. WBS / bağımlılık

TODO: `archetype-order` düğümü. `dependsOn`: Money+Measure atomları, k-computation (total), archetype-inventory (stok), workflow (durum), scale-invariant (order etiketi). `blocks`: ecommerce, Fleetx, MRP satış.

## 5. Multi-tenant / AI guardrail

- Tenant: sipariş tenant-scoped; RLS.
- AI: sipariş taslağı önerebilir; onay/kapanış typed action + insan onayı ile.

## 6. Test stratejisi (test-önce)

TODO negatif testler: satır-toplamı ≠ başlık-toplamı reddi; onaylı siparişte doğrudan satır UPDATE reddi; stok yetersizken confirmed geçiş reddi; çapraz-tenant erişim reddi; kısmi teslimde tutarlılık.

## 7. Kabul kriterleri / DoD

TODO: Money+Measure gerçek; toplam değişmezi test-kanıtlı; inventory+workflow bağı; scale-invariant beyanı; insan onayı (kilit).
