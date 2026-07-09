# Wave 2 SDK Repeatability Readiness Gap — 2026-07-09

Durum: W2.1-W2.6 salt-okunur readiness gap kaydı
Kapsam: `/Users/karaca/DEV/mimari/platform`
İlgili WBS node'ları: `be-sdk`, `dx-cli`, `dx-workflow`, `build-ilk-dikey-dilim`, `build-referans-uygulama`, `build-enterprise-readiness`

Bu rapor implementation kodu üretmez. Amaç, Customer sonrası SDK ile aynı app üretim deseninin ikinci ve üçüncü domain'e kopya kodsuz uygulanabilmesi için eksik sözleşmeleri ve code-start blocker'larını netleştirmektir.

## Özet

`platform` checkout'unda `packages/sdk`, app-core template, module template, generator guardrail, OrderOps vertical slice veya Inventory vertical slice yoktur. Customer vertical slice da henüz uygulanmadığı için Wave 2 product code başlatılamaz. Doğru durum "SDK/meta-framework bitti" değil, "SDK tekrar-üretilebilirlik wave'i için no-go kapıları ve hedef kanıt seti tanımlandı"dır.

Wave 2 domain sırası karar verilmiş kabul edilir: ikinci vertical slice `OrderOps`, üçüncü vertical slice `Inventory` olacaktır. Bu sıra, mevcut actionplan korpusundaki OrderOps referans uygulama ve inventory metamodel sözleşmeleriyle uyumludur; yeni seçenek bekletmez.

## Salt-Okunur Bulgular

| Kontrol | Sonuç |
|---|---|
| `packages/sdk/templates/app-core` | Yok |
| `packages/sdk/templates/module` | Yok |
| SDK generator CLI | Yok |
| Generated output guardrail | Yok |
| Forbidden stack template testi | Yok |
| Customer vertical slice | Yok |
| OrderOps implementation slice | Yok |
| Inventory implementation slice | Yok |
| Customer/Order/Inventory diff raporu | Yok |
| W0 remote/CI evidence | Eksik |

## Wave 2 No-Go Kapıları

- W0.2 remote/CI baseline kanıtı yokken SDK/generator product code başlatılmaz.
- W0.3-W0.10 kernel evidence tamamlanmadan SDK public contract üretilmez.
- W0.11 SDK package ve deterministic codegen tamamlanmadan template/generator kabul edilmez.
- Wave 1 Customer uçtan uca yeşil olmadan OrderOps veya Inventory slice development'a alınmaz.
- Generator çıktısı elle düzenleniyorsa PR reddedilir.
- Forbidden stack taraması template ve generated output üzerinde kırmızıysa PR reddedilir.
- Customer, OrderOps ve Inventory arasında kopya domain kodu fark raporuyla ayrıştırılmadan Wave 2 çıkışı verilmez.

## Handoff Hedefleri

| Sıra | Hedef | Minimum implementation path | Minimum test |
|---|---|---|---|
| W2.1 | SDK app-core template | `packages/sdk/templates/app-core/` | `pnpm --filter @platform/sdk run test -- app-core-template` |
| W2.2 | SDK module template | `packages/sdk/templates/module/` | `pnpm --filter @platform/sdk run test -- module-template` |
| W2.3 | Generator guardrails | `packages/sdk/src/generator.ts`, `packages/sdk/tests/generator-guardrails.test.ts` | `pnpm --filter @platform/sdk run test -- generator-guardrails` |
| W2.4 | OrderOps vertical slice | `apps/api/src/meta_api/order_*`, `apps/web/src/apps/order/` | `cd apps/api && uv run --python 3.12 pytest -q tests/test_order_*` + `pnpm --filter @platform/web run test -- order` |
| W2.5 | Inventory vertical slice | `apps/api/src/meta_api/inventory_*`, `apps/web/src/apps/inventory/` | `cd apps/api && uv run --python 3.12 pytest -q tests/test_inventory_*` + `pnpm --filter @platform/web run test -- inventory` |
| W2.6 | Pattern extraction | `packages/sdk/docs/repeatability-report.md` | Customer/Order/Inventory diff report check |

## Kabul Kanıtı

Wave 2 done sayılmaz; aşağıdakilerin tamamı actionplan'a gerçek evidence olarak geri yazılmalıdır:

- SDK app-core template testi yeşil.
- SDK module template testi yeşil.
- Generator aynı input ile byte-stable output üretir.
- Generated output manual edit guard testi yeşil.
- Forbidden stack taraması SDK templates ve generated output için yeşil.
- Customer, OrderOps ve Inventory aynı kernel/SDK/app-core sözleşmesiyle çalışır.
- Tenant izolasyonu her üç vertical slice için negatif testle kanıtlanır.
- Route/menu/capability görünürlüğü her üç slice için capability'ye bağlıdır.
- Customer/Order/Inventory diff raporu kopya domain logic eşiğini belgeler.
- PR URL, CI run URL, test log, smoke note ve rollback note geri yazılır.

## Actionplan Etkisi

- `be-sdk`, `dx-cli`, `dx-workflow`, `build-ilk-dikey-dilim`, `build-referans-uygulama` ve `build-enterprise-readiness` refs listesine bu rapor eklenir.
- İlgili node'lara Wave 2 `traceability.repoPath` ve `traceability.testCommand` hedefleri yazılır.
- `status`, `phase`, `progress`, `evidence` ve `implementationStatus` ilerletilmez.
- Bu rapor platformda SDK, generator, OrderOps veya Inventory kodu üretildiği anlamına gelmez.
