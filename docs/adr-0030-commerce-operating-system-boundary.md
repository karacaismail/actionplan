# ADR-0030 — Commerce Operating System: Bağımsız Ürün-Ailesi/App Sınırı

**Durum:** ACCEPTED — 2026-07-13 (bağlayıcı insan direktifine dayanır)
**Kapsam:** Yalnızca dokümantasyon sınırı. Bu ADR kod/şema/JSON üretmez; app/module düğümü açmaz.
**Kaynak yetki:** Karar, insanın verdiği bağlayıcı ürün yönüne dayanır. AI ajan bu sınırı genişletemez, app/module üretemez ([`AGENTS.md`](../AGENTS.md) §0, §4.4).

## Bağlam

Taksonomi sabittir: `app`=ada, `module`/bounded-context=dağ, `archetype`=kaya, `feature`=taş ([`AGENTS.md`](../AGENTS.md) §1, [`task-to-code-contract.md`](./task-to-code-contract.md) §1). Mevcut commerce düğümleri (`s-commerce` archetype, `s-ecommerce-models` module, `s-marketplace`, `s-pim`, `s-cpq`, `s-billing`, `s-channel-hub` …) tek üründe değil, dağınık stack parçaları olarak yaşıyor. İnsan, bu parçaları kuşatan **jenerik, bağımsız satılabilir bir ürün-ailesi/app** istedi.

Paralel olarak geniş bir araştırma korpusu (Drupal/Magento türevleri, feature-ID aileleri) verildi. Bu korpus **kanonik modül/backlog listesi değildir**; sınıflandırılmadan implementasyona giremez.

ADR numarası: **0029 ayrı REOC worktree tarafından rezerve edilmiştir**; çakışmayı önlemek için bu karar **0030** numarasını alır (mevcut set: 0026–0028).

## Kavram ayrımı (bağlayıcı)

| Kavram | Taksonomi | Anlam |
|---|---|---|
| Ürün-ailesi / app (ada) | `app` | Bağımsız paketlenebilir/lisanslanabilir/deploy edilebilir satış birimi ([`app-distribution-contract.md`](./app-distribution-contract.md) §1.3) |
| Bounded-context module (dağ) | `module` | Tek iş alanına kapalı sınır; ayrı sözleşme + bağımlılık listesi |
| Archetype (kaya) | `archetype` | Domain model + projeksiyon; en küçük deploy birimi |
| Feature (taş) | `feature` | Tek kullanıcı hikayesi / servis metodu |
| Edition | konfigürasyon | Aynı module seti + pazara-çıkış paketi ([`stack-editions`](../src/data/generated/nodes/stack-editions.json)) |
| Mode (iş modeli) | runtime bileşim | B2C/B2B/… capability bileşimi ([`mode-profile-contract.md`](./mode-profile-contract.md), [ADR-A3](./adr-A3-mode-profile.md)) |
| Tenant | runtime izolasyon | Kiracı; her tenant her capability'yi almaz |

Edition ≠ mode ≠ tenant: Edition ticari ambalaj, mode runtime davranış bileşimi, tenant izolasyon birimidir. Karıştırılmaz.

## Karar

1. **Commerce Operating System** adıyla, mevcut kernel/SDK üzerinde çalışan **ayrı bir jenerik ürün-ailesi/app (ada)** sınırı tanımlanır.
   - Teknik ad: `Commerce Operating System`
   - App slug: `commerce-operating-system`
   - Kısa kod: `commerce-os`
2. App, iç iş alanlarını **dağ (module/bounded-context)** olarak taşır; hiçbir dağ "app" diye anılmaz. BC önerileri: [`commerce-os-bounded-context-map.md`](./commerce-os-bounded-context-map.md).
3. **Araştırma korpusu = araştırma girdisi.** Feature-ID aileleri (B2B, PRC, MKT, SRV, SUB, RNT, AUC, CFG, REC, OMN, DIG, XBR, TEN; CAT2…AGT2; DRC, MAG, EXT; composite) implementasyondan önce [`commerce-os-capability-classification.md`](./commerce-os-capability-classification.md)'de sınıflandırılır.
4. **Sayısal-hedef reddi:** Feature sayısı bir hedef veya tamamlanma ölçütü değildir. "N özellik var → N düğüm aç" akışı geçersizdir; bu ADR hiçbir implementasyon iddiası taşımaz.
5. **Drupal/Magento provenansı:** `DRC`/`MAG` ve tüm "muadili" adlar **karşılaştırmalı araştırma/köken** işaretidir; runtime bağımlılığı, zorunlu teknoloji seçimi veya import değildir. Stack kilidi değişmez ([ADR-K1](./adr-K1-kernel-kimlik.md): FastAPI + SQLAlchemy 2.0 + PostgreSQL; Next/Prisma/Supabase yasak).
6. **Platform yeniden kullanımı:** Commerce OS, kernel/SDK primitiflerini **tüketir**, kopyalamaz. Tenancy, identity/authz, capability/entitlement, PDP, mode, computation, party, jurisdiction, audit, event bus, extension runtime yeniden yazılmaz ([`capability-entitlement-contract.md`](./capability-entitlement-contract.md), [`app-distribution-contract.md`](./app-distribution-contract.md) §3.4).
7. **Düzenlenmiş sağlayıcı sınırı:** Ödeme/escrow/MoR/kredi/sigorta/vergi-hesaplama/noter benzeri düzenlenmiş yürütme, aksi bir insan kararı olana dek **dış lisanslı sağlayıcı entegrasyonudur**; Commerce OS bunu orchestrate eder, kendisi lisanslı yürütücü olmaz.
8. **Kompozisyon:** App, edition/mode ile bileşilebilir; her tenant her capability'yi almaz. Minimum ticari dilim ilk ve dardır ([`commerce-os-product-scope.md`](./commerce-os-product-scope.md)).
9. **Test-önce/kanıt-önce handoff:** Herhangi bir queue/node/kod üretimi implementasyon rolüne aittir ve test-önce + evidence-önce zorunludur ([`task-to-code-contract.md`](./task-to-code-contract.md) §2–3). Bu ADR bunu **başlatmaz**.

## Değerlendirilen alternatifler

- **Her feature-ID ailesini ayrı app saymak.** Reddedildi: dağ'ı app'e terfi eder, izolasyon/satış birimini anlamsızlaştırır, sayısal-hedef tuzağına düşer.
- **Commerce OS'u `s-commerce` archetype'ının içine gömmek.** Reddedildi: archetype (kaya) ürün-ailesi (ada) sınırı taşıyamaz; kompozisyon/edition/lisans katmanı kaybolur.
- **Korpusu doğrudan backlog kabul edip düğüm açmak.** Reddedildi: sınıflandırma olmadan platform primitifi ile business capability, provenans ile runtime bağımlılık karışır.
- **Drupal/Magento'yu runtime bağımlılık yapmak.** Reddedildi: stack ([ADR-K1](./adr-K1-kernel-kimlik.md)) ve headless ([ADR-0026](./adr-0026-tech-profiles.md)) kilidine aykırı.
- **Düzenlenmiş yürütmeyi (escrow/MoR/vergi) app içinde inşa etmek.** Reddedildi: lisans/uyum riski; sağlayıcı entegrasyonu tercih edilir.

## Sonuçlar

Olumlu:
- Dağınık commerce parçaları için tek, bağımsız satılabilir sınır ve isim doğar.
- Korpus, sınıflandırma kapısıyla implementasyondan ayrılır; drift ve sahte-tamamlanma önlenir.
- Platform primitifleri tek yerde kalır; 50-app tekrarından kaçınılır.

Olumsuz / maliyet:
- BC ve capability haritası, korpus derinleştikçe insan-onaylı revizyon gerektirir (provisional işaretler).
- İlk dilim dar olduğu için "eksik" algısı olabilir; bu bilinçli kapsam kararıdır.

Migration / değişim etkileri:
- Bu ADR **hiçbir mevcut düğümü değiştirmez.** Mevcut `s-*` commerce düğümlerinin Commerce OS BC'lerine eşlenmesi ayrı, insan-onaylı bir item-level triyaj işidir; burada yapılmaz.
- Yeni app/module düğümü **açılmaz** ([`AGENTS.md`](../AGENTS.md) §4.4).

## Sonraki kapılar

1. İnsan onayı: slug/kısa-kod ve BC ayrımının kabulü.
2. Item-level triyaj: her feature-ID ailesinin tek tek disposition'ı ([`commerce-os-capability-classification.md`](./commerce-os-capability-classification.md)).
3. Minimum ticari dilim için requirements kapısı (implementasyon rolü, test-önce).
4. Mevcut `s-*` düğümlerinin BC eşlemesi için ayrı changeset önerisi (insan onayı).

## İlgili doküman

- [`commerce-os-product-scope.md`](./commerce-os-product-scope.md), [`commerce-os-capability-classification.md`](./commerce-os-capability-classification.md), [`commerce-os-bounded-context-map.md`](./commerce-os-bounded-context-map.md)
- [`app-distribution-contract.md`](./app-distribution-contract.md), [`mode-profile-contract.md`](./mode-profile-contract.md), [`capability-entitlement-contract.md`](./capability-entitlement-contract.md)
- [ADR-A3](./adr-A3-mode-profile.md), [ADR-K1](./adr-K1-kernel-kimlik.md), [ADR-0026](./adr-0026-tech-profiles.md), [ADR-0027](./adr-0027-engineering-standards.md)
