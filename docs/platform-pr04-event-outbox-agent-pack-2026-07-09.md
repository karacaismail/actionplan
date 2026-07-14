# PR-04 Event/Outbox Agent Pack — 2026-07-09

> **AUTHORITY-LOCK:** `Codex → PM → uzman ajanlar → Claude workers/slaves`.
> Codex nihai karar merciidir; PM yalnız ardıl koordinatördür. Platform erişimi
> `read-only-audit`, uygulama ise `human-developer-only`dır. Claude'u yalnız Codex
> sınırlı bir worker/slave görevi için çağırabilir.

Durum: docs-only human-developer execution handoff
Queue item: `PR-04`
Branch: `task/k-bus-outbox-events`
WBS node'u: `k-bus`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
Queue status: `blocked-by-PR-03`

Bu belge product code üretmez. Amaç, PR-03 Authz/PDP kanıtı kapandıktan sonra açılacak PR-04 işini yalnız insan geliştiriciye verilecek sıkı prompt ve evidence sözleşmesine dönüştürmektir.

## Önkoşul

PR-04 yalnız şu kanıtlar geldikten sonra başlar:

- PR-01 remote/default-branch/CI baseline verified evidence
- PR-02 tenant context + tenant isolation verified evidence
- PR-03 Authz/PDP deny-by-default verified evidence
- PR-03 PDP golden decision fixture
- `platform-authn-authz`, `k-authz` ve `k-policy-pdp` actionplan writeback'i

Bu kanıtlar yoksa execution paketi insan geliştirici kuyruğuna alınmaz; yalnız hazırlık/handoff dokümanı olarak kalır.

## Amaç

PR-04'ün tek amacı event envelope + transactional outbox + idempotent consumer contract kurmaktır:

- Event envelope tenant, actor, correlation, idempotency, type ve version alanları taşır.
- Domain write ve outbox append aynı transaction boundary içinde kanıtlanır.
- Publish başarısızlığı event kaybına dönüşmez; outbox replay ile toparlanır.
- Duplicate delivery idempotency key ile tek kez işlenir.
- Retry/backoff ve dead-letter davranışı testle görünür olur.

## Non-Goal

PR-04 şunları yapmaz:

- ECA runtime, workflow rule engine veya visual workflow designer yazmaz.
- Customer/domain-specific event üretmez.
- Harici broker, Kafka, Redis stream veya object storage eklemez.
- Audit log implementation yazmaz.
- DLQ dashboard, operations UI veya marketplace event contract başlatmaz.
- "Exactly once" delivery iddiası kurmaz.

## Human Developer Execution Packet

İnsan geliştirici aşağıdaki execution paketini `/Users/karaca/DEV/mimari/platform` içinde, yalnız PR-03 evidence kapandıktan sonra kullanır:

```text
Görev: PR-04 Event/Outbox.

Workspace: /Users/karaca/DEV/mimari/platform
Branch: task/k-bus-outbox-events
WBS nodes: k-bus
Prerequisite: PR-01 CI baseline, PR-02 tenant context, PR-03 Authz/PDP evidence verified in actionplan.

Amaç:
1. Event envelope sözleşmesini tenant/actor/correlation/idempotency/type/version alanlarıyla kur.
2. Transactional outbox append contract yaz.
3. Domain write + outbox append aynı transaction boundary içinde test et.
4. Idempotent consumer contract ve duplicate delivery testini kur.
5. Retry/backoff ve dead-letter davranışını test edilebilir hale getir.
6. At-least-once delivery + idempotency modelini evidence note'a yaz.

Mutlak sınırlar:
- PR-03 evidence yoksa kod yazma; blocker raporu üret.
- ECA runtime, workflow designer veya action library yazma; bunlar PR-05 kapsamıdır.
- Customer/domain-specific event veya UI başlatma.
- Audit log implementation yazma; yalnız audit-compatible event fields gerekiyorsa not düş.
- Harici broker/Kafka/Redis stream/S3 ekleme.
- Exactly-once iddiası kullanma; at-least-once + idempotency kabul edilir.
- Event/outbox negatif testlerini silme, zayıflatma veya yalnız happy-path publish ile geçirme.
- Actionplan'da status/progress/evidence alanlarını gerçek PR/CI/test kanıtı olmadan ilerletme.

Önce kırmızı/eksik evidence'i göster:
- git status --short --branch
- PR-01/PR-02/PR-03 evidence referansları
- event/outbox/consumer/retry/DLQ arama sonucu
- mevcut DB/migration bağımlılığı durumu
- mevcut seed idempotency açıklamasının event idempotency kanıtı olmadığını not et

Beklenen minimum değişiklikler:
- apps/api/src/meta_api/events.py veya repo yapısına uygun EventEnvelope modülü
- apps/api/src/meta_api/outbox.py veya repo yapısına uygun transactional outbox modülü
- apps/api/src/meta_api/consumers.py veya repo yapısına uygun idempotent consumer modülü
- apps/api/tests/test_event_envelope.py
- apps/api/tests/test_outbox.py
- apps/api/tests/test_idempotent_consumer.py
- Gerekiyorsa küçük test fixture/helper; domain-specific Customer event başlatmadan izolasyon kanıtı

Test-first sıra:
1. Event envelope requires tenant/actor/correlation/idempotency/type/version.
2. Domain write and outbox append commit in one transaction.
3. Publish failure leaves replayable outbox record.
4. Duplicate delivery is processed once by idempotency key.
5. Retry/backoff exhaustion moves item to dead-letter state.
6. Event without tenant or actor is rejected.

Zorunlu doğrulama:
cd apps/api && uv run --python 3.12 pytest -q tests/test_event_envelope.py tests/test_outbox.py tests/test_idempotent_consumer.py

Çıkış:
- PR URL
- CI run URL
- transactional outbox test logu
- duplicate delivery idempotency test logu
- replay/DLQ note
- at-least-once + idempotency note
- rollback note
- manual-review note
```

## Human Developer Checklist

PR açmadan önce:

- [ ] PR-01, PR-02 ve PR-03 evidence actionplan'da doğrulandı.
- [ ] Branch `task/k-bus-outbox-events` olarak açıldı.
- [ ] İlk commit kırmızı outbox transaction veya duplicate delivery testi taşıyor.
- [ ] Event envelope tenant/actor/correlation/idempotency/type/version alanlarıyla testleniyor.
- [ ] Domain write + outbox append transaction testi var.
- [ ] Publish failure replay testi var.
- [ ] Duplicate delivery idempotency testi var.
- [ ] Retry/backoff ve dead-letter davranışı testleniyor.
- [ ] ECA, Customer, UI, audit implementation ve external broker diff'i yok.
- [ ] PR body WBS node, scope, non-goal, tests, rollback ve evidence patch içeriyor.

PR merge sonrası:

- [ ] CI run URL alındı.
- [ ] Transactional outbox test logu alındı.
- [ ] Duplicate delivery idempotency test logu alındı.
- [ ] Replay/DLQ note yazıldı.
- [ ] At-least-once + idempotency note yazıldı.
- [ ] Merge commit SHA alındı.
- [ ] Rollback/smoke note yazıldı.
- [ ] Actionplan evidence patch hazırlandı.

## Evidence Patch Taslağı

Gerçek değerler gelmeden uygulanmaz:

```json
{
  "id": "k-bus",
  "refs": [
    "docs/platform-pr04-event-outbox-agent-pack-2026-07-09.md",
    "pr:<real-pr-url>",
    "commit:<merge-commit-sha>",
    "ci:<github-actions-run-url>",
    "test:<event-outbox-test-log-ref>"
  ],
  "evidence": [
    "PR-04 Event/Outbox geçti: <github-actions-run-url>",
    "Event envelope tenant/actor/correlation/idempotency/type/version alanlarıyla kanıtlandı: <test-log-ref>",
    "Domain write + outbox append aynı transaction boundary içinde kanıtlandı: <test-log-ref>",
    "Duplicate delivery idempotency testi geçti: <test-log-ref>",
    "Replay/DLQ note: <ref>",
    "Delivery semantics: at-least-once + idempotency; exactly-once iddiası yok",
    "Rollback note: outbox/event wiring revert edilebilir; ECA/Customer/UI kodu eklenmedi"
  ],
  "traceability": {
    "implementationStatus": "verified",
    "queueStatus": "verified:PR-04"
  }
}
```

## PR-04 Done Kapısı

PR-04 ancak şu koşullarla kapanır:

- PR-01, PR-02 ve PR-03 evidence daha önce verified durumdadır.
- Event envelope tenant, actor, correlation, idempotency, type ve version taşır.
- Domain write ve outbox append aynı transaction içinde kanıtlanır.
- Publish failure event kaybına dönüşmez; replay path testlidir.
- Duplicate delivery idempotency key ile tek kez işlenir.
- Retry/backoff ve dead-letter davranışı testle doğrulanır.
- "Exactly once" claim yoktur; at-least-once + idempotency evidence vardır.
- `k-bus` node'una PR/CI/test/evidence geri yazılmıştır.

Bu done kapısı kapanmadan PR-05 ECA Runtime başlamaz.
