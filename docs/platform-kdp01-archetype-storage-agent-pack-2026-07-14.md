# KDP-01 ArcheType Storage Agent Pack — 2026-07-14

Durum: docs-only, blocked implementation handoff
Queue item: `KDP-01`
Branch: `task/archetype-storage-contract-record-api`
WBS: `k-archetype-storage`, `archetype-storage-contract`
Workspace: `/Users/karaca/DEV/mimari/platform`

Bu paket **DIRECTIVE-ONLY**'dir. Platform ürün kodu yazarı `human-developer-only`dır.

## Başlama Kapısı

KDP-01 yalnız insan `human-queue-order-decision` kararı verdikten, seçilen predecessor'lar
gerçek PR/CI/test evidence ile verified olduktan, `k-schema` ile `k-tenancy` runtime portları
doğrulandıktan ve temiz task worktree açıldıktan sonra başlar. Kanonik `PR-01..PR-11`
sırası bu paketle değişmez. Bugünkü durum `blocked`; bu belge code-start veya runtime
evidence değildir.

## Amaç

- Shared `archetype_records` tablosu, fiziksel sistem kolonları ve JSONB payload.
- Metadata doğrulamalı storage-agnostik repository/service.
- generated CRUD yalnız read-only `get/list/filter` projeksiyonudur.
- Mutasyonlar typed action/command: create, patch, archive, restore.
- Tenant/actor/PDP/audit/outbox/idempotency/optimistic-version zarfları.

## Allowed Files

- `apps/api/src/meta_api/kernel/archetypes/**`
- `apps/api/tests/kernel/archetypes/**`
- `apps/api/migrations/versions/*_archetype_records.py`

`pyproject.toml`, DB session, tenancy, PDP, audit ve outbox portları predecessor paketlerin
sahibidir; KDP-01 bunları yeniden kurmaz.

## Non-Goals

- `k-surface`, frontend, SDK, computation veya app/module işi.
- Generated `INSERT/UPDATE/DELETE`, hard delete veya lifecycle alanına generic patch.
- Physical-promotion motoru, serbest DDL/SQL/JSONPath veya AI onaylı migration.
- `domainsx/kernel` kodunu kopyalamak; mevcut dirty platform dosyalarını ezmek.

## İnsan Geliştirici Promptu

```text
DIRECTIVE-ONLY handoff: KDP-01 ArcheType Storage.
Önce predecessor evidence ve temiz worktree'yi doğrula; eksikse kod yazma.
Yalnız allowed-files içinde çalış. İlk commit davranışsal kırmızı testleri taşısın.
Generated CRUD yalnız read-only olsun; her mutasyon typed action/command üzerinden
tenant + actor + PDP + audit + outbox ile tek AsyncSession transaction'ında yürüsün.
Fiziksel silme yapma; archive/restore ve optimistic version kullan.
RLS'yi superuser olmayan rol ve SET LOCAL tenant context ile kanıtla.
Promotion, surface, SDK, frontend ve predecessor port değişikliği kapsam dışıdır.
```

## Önce Kırmızı Testler

1. Migration'sız metadata alanı shared JSONB round-trip.
2. `jsonb/promoted × get/list/patch/archive/restore` için en az 10 tenant kaçış reddi.
3. Bilinmeyen alan/tip, reserved-field patch ve stale version reddi.
4. Create replay idempotency; duplicate kayıt oluşmaması.
5. Audit veya outbox append hatasında business-row rollback.
6. Archive/restore satırı korur; hard delete yolu yoktur.
7. Read projection storage modunu sızdırmaz; generated mutation şemada yoktur.
8. Alembic upgrade/downgrade ve non-owner RLS testi.

Planlanan komut (dosyalar scaffold edildikten sonra):

```bash
cd apps/api && uv run --python 3.12 pytest -q tests/kernel/archetypes
```

## Evidence ve Done

PR URL, merge SHA, CI URL, red→green test logu, migration round-trip, tenant-negative logu,
atomic audit/outbox logu ve rollback drill zorunludur. Bunlardan biri yoksa node `verified`
olamaz. Ortam/collection hatası geçerli kırmızı test sayılmaz.

## Rollback

Cross-tenant sızıntı, checksum farkı, atomiklik veya downgrade ihlali release-stop'tur. Route
önce kapatılır; eski uygulamaya dönülür; veri varsa tablo düşürülmez, canonical JSONB kayıtlar
korunur ve forward-fix uygulanır.
