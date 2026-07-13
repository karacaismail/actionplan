# panel-tier — Üç Panel Katmanı Surface Sözleşmesi (TASLAK — kilitlenmeyi bekliyor)

Durum: taslak iskelet. CI'a bağlı değil. İnsan onayı gerekir.
Gerekçe: kullanıcının kritik gereksinimi üç panel katmanıdır: (1) developer/kernel admin, (2) SaaS müşterisinin "süper admin" paneli, (3) o müşterinin kendi son kullanıcıları (rol gruplarıyla; WordPress gibi kur-çalıştır). `surface.ts`'te bu katmanları ayıran birinci sınıf alan YOKTUR; tek erişim alanı düz `permissions[]` string dizisidir. Bu olmadan her ürün ekibi kendi konvansiyonunu icat eder → kernel'in yeniden-kullanım vaadi çöker (P0, bkz. gap-2026-07-02-03-surface §4 G-S1).

## 1. Amaç / Kapsam / Non-goals

- Amaç: her Surface örneğinin hangi panel katmanına ait olduğunu birinci sınıf alan yapmak; katman-bazlı navigasyon ve rol grubu modelini tanımlamak.
- Kapsam: `panelTier` alanı; tenant-scoped rol grubu; izin-sürümlü menü/navigasyon; katman-bazlı white-label sınırı.
- Non-goals: gerçek yetki kararı (PDP işi — panelTier sunum katmanıdır, güvenlik sınırı DEĞİLDİR); iş mantığı.

## 2. Nedir / ne yapar / ne yapmaz

- Nedir: Surface'e katman kimliği + rol-grubu-farkında navigasyon ekleyen sözleşme.
- Ne yapar: developer / tenant-admin / tenant-enduser panellerini ayırır; her katmanın rol-kapsamlı menüsünü tanımlar.
- Ne yapmaz: alan gizlemeyi güvenlik sınırı saymaz (gizleme sunumdur; asıl sınır PDP'dedir — c12n uyarısı); tek panelde katman karıştırmaz.

## 3. Sözleşme şekli (şema — Zod / src/schemas/surface.ts genişletmesi)

TODO: `SurfaceContractSchema`'ya ekle:
- `panelTier: z.enum(["developer","tenant-admin","tenant-enduser","counterparty"])`
- `roleGroups: z.array(RoleGroupSchema)` — tenant-scoped rol grubu (id, label, permissions[]).
- `navigation: NavNodeSchema[]` — izin-sürümlü menü ağacı (label, route, requiredPermission, children[]).
Not: `counterparty` dördüncü, komşu ama ayrı aktör sınıfıdır (harici/davetli).

## 4. Kapı (CI) etkisi

TODO: `check-surface.mjs` genişletmesi — her surface `panelTier` taşımalı; `navigation[].requiredPermission` gerçek bir role/permission'a çözülmeli; `archetypeRef` çapraz-referansı (bugün denetlenmiyor).

## 5. Multi-tenant / AI guardrail

- Tenant: rol grupları tenant-scoped; developer paneli tenant-üstü, tenant-admin tenant-scoped, tenant-enduser tenant-içi rol-scoped.
- AI: menü/rol taslağı önerebilir; yetki etkisi PDP'de, insan onayıyla.

## 6. Test stratejisi (test-önce)

TODO: her surface panelTier taşır; çapraz-katman sızıntı yok (tenant-enduser developer surface'i göremez); navigasyon izinsiz düğüm göstermez; alan-gizleme güvenlik sınırı olarak KULLANILMADIĞI negatif testle kanıtlanır.

## 7. Kabul kriterleri / DoD

TODO: panelTier tüm surface'lerde dolu; navigasyon+rol grubu modellendi; check-surface genişletildi; insan onayı (kilit).
