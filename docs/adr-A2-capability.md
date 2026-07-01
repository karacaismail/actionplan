# ADR-A2 — Capability / Entitlement: Yetenek ve Yetkilendirme Primitifi

**Durum:** Kilitli — 2026-07-01 (insan onayı: ismail)

## Bağlam

Portföyde bir yeteneğin (rfq, escrow, e_invoice, volume_pricing, net_terms) bir tenant, aktör veya plan için açık mı kapalı mı olduğu bugün dağınık ve tutarsız biçimde ele alınıyor: kimi yerde feature-flag, kimi yerde lisans kontrolü, kimi yerde koda gömülü koşul. Bu dağınıklık iki ayrı ekseni birbirine karıştırıyor. RBAC "bu kullanıcı bu kaydı silebilir mi?" (rol→izin) sorusunu sorar; Capability ise "bu tenant RFQ kullanabilir mi?" (plan→yetenek) sorusunu sorar. İkisi karıştırıldığında, bir SaaS planının kapattığı özellik yanlışlıkla RBAC ile açılabilir ya da tersine, yetkili bir kullanıcının erişimi lisans katmanına takılır. `plan-00 §4` (C6) beş primitifin kodda olmadığını; `plan-03 §3.2` ise Capability/Entitlement'ın "user ∩ capability ∩ plan" modeliyle tek yerde tutulması ve RBAC'tan ayrı bir eksen olması gerektiğini işaretler. Bu ADR, feature-gate ve lisans/entitlement'ı tek primitifte birleştirir.

## Karar

- **Capability/Entitlement primitifi tanımlanır.** Bir yeteneğin açık/kapalı olması "user ∩ capability ∩ plan" olarak modellenir; feature-gate ve lisans/entitlement tek yerde tutulur. Capability seti, Mode-Profile'a (ADR-A3) girdi olur.
- **RBAC'tan ayrı eksen.** RBAC = rol→izin; Capability = plan→yetenek. İkisi ayrı eksendir ve karıştırılmaz.
- **Sözleşme şekli (alanlar):**
  - `capability`: `id`, `key` (escrow | rfq | net_terms | …), `description`, `category`.
  - `plan`: `id`, `name`, `tier`.
  - `plan_capability`: `plan_id`, `capability_id`.
  - `entitlement`: `subject` (tenant/actor), `capability_id`, `source` (plan | grant | trial), `valid_from`, `valid_to`.
- **WBS yerleşimi:** Kernel primitifi. Yeni düğüm `k-capability`, seviye `module`, altında archetype. Bağımlılık (`dependsOn`): `k-party`, `k-tenancy`.
- **Bağlama:** Surface ve ArcheType, alan/aksiyonu capability-gate ile gösterir/gizler. PDP capability'ye bakar: yetenek yoksa deny.
- **AI guardrail:** AI lisans/entitlement değiştiremez (`autonomy: none` lisans için); yeni capability önerisi en fazla `autonomy: draft`.

## Gerekçe

Feature-gate ile lisans/entitlement'ı tek primitifte birleştirmek, "bu tenant bunu kullanabilir mi?" sorusuna tek doğruluk kaynağı verir; dağınık flag'lerin yarattığı tutarsızlığı ortadan kaldırır. RBAC'tan ayrı eksen tutmak, plan-tabanlı ticari kararların (satış paketleri) izin-tabanlı güvenlik kararlarıyla karışmasını engeller — ikisi farklı sahiplere ve farklı yaşam döngülerine sahiptir. `source` alanı (plan | grant | trial), bir yeteneğin nereden geldiğini (satın alma, tekil hak, deneme) ayırır; bu, deneme süresi bitince otomatik kapanmayı ve tekil hakların ayrı yönetimini mümkün kılar. Capability setini Mode-Profile'ın okuyabilmesi, iş modeli bileşiminin (ADR-A3) tek kaynaktan beslenmesini sağlar.

## Sonuçlar

Olumlu:
- Yetenek açık/kapalı kararı tek yerde; UI gizleme ve API reddi aynı kaynaktan.
- Ticari eksen (plan→yetenek) ve güvenlik ekseni (rol→izin) net ayrılır.
- Deneme/tekil-hak/plan kaynakları ayrık; süre bitince otomatik kapanır.

Olumsuz:
- Capability ve RBAC ayrımı ekipçe içselleştirilene dek yanlış katmana kural yazma riski; test bunu yakalamalı.
- Entitlement temporal alanları (valid_from/valid_to), süre-sonu kapanışının doğru tetiklenmesi için düzenli değerlendirme gerektirir.
- Lisans için `autonomy: none` olduğundan, AI hiçbir entitlement'ı otomatik açamaz; bu bilinçli bir yavaşlatmadır.

## Değerlendirilen alternatifler

- **Feature-flag kütüphanesi (koda gömülü bayraklar).** Reddedildi: lisans/entitlement ile birleşmez, denetlenebilir tek kaynak vermez.
- **Capability'yi RBAC izinleri içine katmak.** Reddedildi: ticari ve güvenlik eksenlerini karıştırır; plan değişimi izin modeline sızar.
- **Lisansı ayrı bir dış servise bırakmak.** Reddedildi: Mode-Profile ve PDP'nin senkron okuması gereken bir girdiyi ağ-gecikmesine ve ayrı tutarlılığa mahkûm eder.
- **Her yeteneği ArcheType alanına gömmek.** Reddedildi: çapraz-kesen yetenek kararını modüle hapseder; Mode-Profile bileşimini imkânsızlaştırır.

## İlgili ADR / doküman

- `plan-03-yeni-yonergeler §3.2` (Capability/Entitlement yönergesi — içerik kaynağı)
- `plan-00-kontrol-sentez §4` (C6)
- `core-contract-pack` v2 (Capability sözleşme taslağı)
- ADR-A1 (Party — entitlement subject), ADR-A3 (Mode-Profile — capability setini okur), ADR-P1 (PDP — capability yoksa deny)
- Sözleşme dokümanı: `capability-entitlement-contract.md` (üretilecek)
