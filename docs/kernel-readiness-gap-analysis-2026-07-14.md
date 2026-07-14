# Kernel Readiness Gap Analysis — 2026-07-14

Durum: repo-gerçekliğiyle doğrulanmış, docs-only readiness kaydı
Kapsam: `actionplan` planı ile `/Users/karaca/DEV/mimari/platform` ve
`/Users/karaca/DEV/domainsx/kernel` salt-okunur karşılaştırması

## Karar

Kernel, SDK başlatacak veya gerçek app/module üretecek düzeyde hazır değildir. Code-start
**NO-GO**; test-plan ve insan geliştirici handoff hazırlığı GO'dur. Aktif execution queue'da
tek açılabilir iş `PR-01` remote/default-branch/CI baseline'dır.

## Doğrulanmış Kapsam

| Ölçü | 2026-07-14 kanonik JSON sonucu |
|---|---:|
| Tüm düğümler | 617 |
| Toplam efor | 10.082 SP |
| `level=app` | 148 |
| `level=module` | 267 |
| `k-*` kimliği | 41 (38 module + 3 feature) |
| `k-*` eforu | 787 SP |
| `sdk-*` | 3 |
| `app-*` | 88 |
| `s-*` | 198 |

617/41/787/88/198 sayıları doğrulandı. Önceki 9.836 SP toplamı güncel checkout ile uyuşmaz;
`src/data/generated/meta.json` ve 617 node toplamı 10.082 SP üretir.

## Kod Gerçekliği

| Checkout | Gözlem | Karar |
|---|---|---|
| `platform` | `master@930c09b`, remote yok, 11 mevcut kullanıcı değişikliği | Kanonik hedef; yalnız read-only audit |
| `platform/apps/api` | DB/ORM/Alembic/kernel yok; `/healthz` + GraphQL `ping`; 2 backend testi yeşil | Faz-0 iskeleti |
| `platform` web | Vitest, eksik Rollup native modülü nedeniyle başlayamadı | Green kanıt yok |
| `domainsx/kernel` | Ayrı Metawork REST/pipeline spike'ı; 2 health testi | Platform kerneline kopyalanmaz |
| `metaframer-kernel` | `/Users/karaca/DEV` altında checkout bulunamadı | 28 test ve 7-kısmi/34-yok sınıfı doğrulanmadı |

Bu nedenle “28 testli control-plane walking skeleton” mevcut platform gerçekliği olarak
yazılamaz. Kaynak checkout gelirse testler yeniden çalıştırılır ve yalnız uyumlu sözleşmeler
semantic port ile değerlendirilir.

## Üç Hazırlık Kapısı

| Kapı | Gereken | Bugünkü durum |
|---|---|---|
| Kernel-ready | tenant, PDP, audit, outbox, registry, hata/versioning zarfları + veri düzlemi | NO-GO |
| SDK-ready | sürümlü public sözleşme ve deterministik typed codegen | NO-GO; `packages/sdk` yok |
| App-buildable | SDK + app-core + storage/surface/computation zinciri | NO-GO |

## WBS Uzlaşması

- Bugünkü machine-readable model `k-archetype-storage`ı `module`, altındaki
  `archetype-storage-contract`ı `archetype` olarak taşır; kanonik direktif ise
  `k-archetype-storage`ı doğrudan `archetype` diye tanımlar. Bu bir WBS drift'idir.
- Üst düğümün `edu-u25/scale-cache/cc-obs-deep` bağımlılıkları da direktifteki
  `k-schema + k-tenancy` kararıyla uyuşmaz. `module` güncellemesi insan yetkisinde olduğu
  için parent JSON bu pakette değiştirilmez; ayrı, insan-onaylı changeset gerekir.
- İnsan kararı gelene kadar izinli docs/handoff hedefi alt `archetype-storage-contract`
  düğümüdür; bu geçici seçim parent sınıflandırmasını kanonikleştirmez.
- Alt düğüm `backlog/requirements`, evidence boş ve implementation `not-started` kalır.
- Planlanan hedef kökler yalnız KDP-01 agent pack'te tutulur; task JSON `traceability`
  taşımaz ve mevcut kod/evidence iddiası üretmez.

## “Generic CRUD” Sınırı

`kernel-execution-contract-matrix.md` gereği generated CRUD yalnız read-only
`get/list/filter` projeksiyonudur. Create/patch/archive/restore mutasyonları typed
action/command üzerinden tenant + actor + PDP + audit ve gerektiğinde outbox taşır. Generic
`INSERT/UPDATE/DELETE`, hard delete, ham tenant header güveni ve serbest JSONPath/SQL yoktur.

## Kanonik Sıra ve Readiness Overlay

Makine-okunur ek kuyruk: `reports/kernel-data-plane-readiness-queue-2026-07-14.json`.

1. Kanonik execution queue'nun `PR-01..PR-11` ve devamındaki CUST/W dalgaları değişmez;
   tek `next-actionable` kayıt `PR-01`dir.
2. `KDP-00..03` executable sıra değil, `contract-readiness-only` konu kayıtlarıdır; bu
   overlay'in queue sıralama yetkisi yoktur.
3. Her KDP kaydı `human-queue-order-decision` ile blokludur ve `codeStartAllowed=false`
   taşır. İnsan kararı olmadan base queue arasına veya sonuna eklenmez.
4. `KDP-01` için yalnız `archetype-storage-contract` code-bearing adaydır. KDP-00/02/03
   için insan-onaylı archetype/alt düğüm seçilmeden product-code işi açılamaz.
5. `KDP-02`, `be-sdk/k-surface/stack-editions` döngüsü çözülene kadar lineer kritik yolun
   dışında ayrı NO-GO olarak kalır.

## KDP-01 Çıkış Kapısı

- Gerçek PostgreSQL'de RLS/FORCE-RLS ve en az 10 cross-tenant negatif vaka.
- Metadata doğrulama, optimistic version, idempotency ve archive/restore; hard delete yok.
- Business row + audit + outbox tek transaction; herhangi biri kırılırsa tümü rollback.
- Alembic upgrade/downgrade; JSONB canonical veri korunur.
- Generated mutasyon yolunun bulunmadığını kanıtlayan contract testi.
- Gerçek PR, merge SHA, CI URL, test logu ve rollback drill olmadan `verified` yok.

## Rollback

Plan değişikliği geri alınırsa yeni refs/requirements notu ve KDP ek kuyruğu revert edilir; eski
queue'nun `PR-01` durumu değişmez. Runtime safhasında route önce kapatılır, canonical JSONB
kayıtları korunur, veri varken tablo düşürülmez ve forward-fix uygulanır.

## Codex Kararı

Gap yönü doğru, fakat 28 test ve yüzde hesabı kanıtlı değildir. Güvenli sonraki artış product
kodu değil: insan-onaylı WBS uzlaşması + KDP-01 developer handoff. Platform uygulaması ancak
PR-01 ve predecessor evidence kapıları insan geliştirici tarafından kapatıldıktan sonra başlar.
