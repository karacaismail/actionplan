# W3-02 Enterprise Performance Gates Agent Pack — 2026-07-09

Durum: docs-only implementation agent pack
Queue item: `W3-02`
Branch: `task/enterprise-performance-gates`
WBS node'ları: `build-enterprise-readiness`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
Queue status: `blocked-by-W3-01`

Bu belge product code üretmez. Amaç, W3-01 Enterprise Security Gates kanıtı kapandıktan sonra açılacak W3-02 işini implementation operatörünün Claude Code/Cursor/Aider gibi bir kod ajanına verebileceği sıkı prompt ve evidence sözleşmesine dönüştürmektir.

## Önkoşul

W3-02 yalnız şu kanıtlar geldikten sonra başlar:

- PR-01..PR-11 Foundation zinciri verified evidence
- CUST-01..CUST-06 Customer vertical slice verified evidence
- W2-01..W2-06 repeatability verified evidence
- W3-01 security report, authz bypass, tenant escape, audit/security ve secret scan evidence
- Customer, OrderOps ve Inventory regression/e2e evidence writeback'leri

Bu kanıtlar yoksa W3-02 prompt'u kod ajanına verilmez; yalnız hazırlık/handoff dokümanı olarak kalır.

## Amaç

W3-02'nin tek amacı enterprise performance gate kanıtını üretmektir:

- k6 veya eşdeğer load smoke p95 raporu üretir.
- N+1 query detection testleri Customer/OrderOps/Inventory path'leri için çalışır.
- Cache policy note hangi yüzeyde cache var/yok ve invalidation yaklaşımını açıklar.
- Performance threshold kırmızıysa PR çıkışı fail-closed olur.
- Security gate'i veya domain davranışını performans için zayıflatmadan evidence üretilir.

## Non-Goal

W3-02 şunları yapmaz:

- Yeni domain, feature veya UI redesign üretmez.
- Accessibility, reliability, observability veya release governance işlerini başlatmaz; bunlar W3-03..W3-06 kapsamıdır.
- Testleri geçsin diye authz/tenant/audit guard'larını bypass etmez.
- Load report metriklerini elle uydurmaz veya tek local happy path ölçümünü enterprise p95 diye yazmaz.
- Cache policy'yi invalidation/tenant ayrımı olmadan "var" saymaz.
- Actionplan evidence/status alanlarını gerçek PR/CI/test kanıtı olmadan ilerletmez.

## Agent Prompt

Implementation operatörü aşağıdaki prompt'u `/Users/karaca/DEV/mimari/platform` içinde, yalnız W3-01 evidence kapandıktan sonra kullanır:

```text
Görev: W3-02 Enterprise Performance Gates.

Workspace: /Users/karaca/DEV/mimari/platform
Branch: task/enterprise-performance-gates
WBS nodes: build-enterprise-readiness
Prerequisite: W3-01 verified evidence in actionplan.

Amaç:
1. k6 veya eşdeğer load smoke script'i ile p95 performance report üret.
2. Customer/OrderOps/Inventory API path'leri için N+1 detection testlerini kur.
3. Cache policy note'u tenant izolasyonu, invalidation ve no-cache kararlarıyla yaz.
4. Performance thresholds kırmızıysa PR çıkışını fail-closed yap.
5. Security/tenant/authz/audit guard'larını zayıflatmadan performance evidence üret.
6. PR/CI/test/report evidence ve actionplan writeback patch'ini hazırla.

Mutlak sınırlar:
- W3-01 evidence yoksa kod yazma; blocker raporu üret.
- Yeni domain, feature, UI redesign, reliability/observability/release governance işi başlatma.
- Authz/tenant/audit guard'larını performans için kapatma veya mock bypass etme.
- p95 report'u tek defalık manuel çıktı veya tahminle doldurma.
- N+1 detection testlerini skip/xfail yapma.
- Actionplan'da status/progress/evidence alanlarını gerçek PR/CI/test kanıtı olmadan ilerletme.

Önce kırmızı/eksik evidence'i göster:
- git status --short --branch
- W3-01 security evidence referansları
- mevcut tests/perf var/yok durumu
- mevcut N+1 detection ve cache policy testleri var/yok durumu
- Customer/OrderOps/Inventory p95 hedefleri ve endpoint listesi
- yeni domain/feature diff'i olmadığını gösteren note

Beklenen minimum değişiklikler:
- tests/perf/k6-smoke.js
- tests/perf/k6-thresholds.js
- apps/api/tests/test_n_plus_one.py
- apps/api/tests/test_cache_policy.py
- reports/performance/p95-load-report.md
- reports/performance/n-plus-one-detection.md
- reports/performance/cache-policy.md
- reports/performance/performance-gate-summary.md

Test-first sıra:
1. N+1 detection testi önce kırmızı olur.
2. Cache policy testleri tenant-aware invalidation/no-cache kararlarını doğrular.
3. k6 smoke p95 threshold report üretir.
4. Customer/OrderOps/Inventory endpoint coverage report içinde görünür.
5. Threshold kırmızıysa gate fail-closed kalır.
6. Security/tenant/authz/audit guard bypass diff'i olmadığı kanıtlanır.

Zorunlu doğrulama:
k6 run tests/perf/k6-smoke.js
cd apps/api && uv run --python 3.12 pytest -q tests/test_n_plus_one.py tests/test_cache_policy.py

Çıkış:
- PR URL
- CI run URL
- merge commit SHA
- p95 load report ref'i
- N+1 detection logu
- cache policy note
- threshold pass/fail sonucu
- security/tenant/authz/audit non-bypass diff note
- rollback/smoke note
- manual-review note
```

## Operator Checklist

PR açmadan önce:

- [ ] W3-01 evidence actionplan'da doğrulandı.
- [ ] Branch `task/enterprise-performance-gates` olarak açıldı.
- [ ] İlk commit kırmızı N+1, cache policy veya k6 threshold testi taşıyor.
- [ ] p95 load report k6/eşdeğer tool çıktısıyla üretiliyor.
- [ ] Customer/OrderOps/Inventory endpoint coverage report içinde var.
- [ ] N+1 detection ve cache policy testleri var.
- [ ] Threshold kırmızıysa PR çıkışı fail-closed.
- [ ] Security/tenant/authz/audit guard bypass diff'i yok.
- [ ] Yeni domain veya feature diff'i yok.
- [ ] PR body WBS node, scope, non-goal, tests, rollback ve evidence patch içeriyor.

PR merge sonrası:

- [ ] CI run URL alındı.
- [ ] p95 load report ref'i alındı.
- [ ] N+1 detection logu alındı.
- [ ] Cache policy note alındı.
- [ ] Threshold pass/fail sonucu yazıldı.
- [ ] Non-bypass diff note yazıldı.
- [ ] Rollback/smoke note yazıldı.
- [ ] Merge commit SHA alındı.
- [ ] Actionplan evidence patch hazırlandı.

## Evidence Patch Taslağı

Gerçek değerler gelmeden uygulanmaz:

```json
[
  {
    "id": "build-enterprise-readiness",
    "refs": [
      "docs/platform-w3-02-enterprise-performance-gates-agent-pack-2026-07-09.md",
      "pr:<real-pr-url>",
      "commit:<merge-commit-sha>",
      "ci:<github-actions-run-url>",
      "report:<p95-load-report-ref>"
    ],
    "evidence": [
      "W3-02 Enterprise Performance Gates geçti: <github-actions-run-url>",
      "p95 load report threshold geçti: <p95-load-report-ref>",
      "N+1 detection testleri geçti: <test-log-ref>",
      "Cache policy note yazıldı: <cache-policy-ref>",
      "Security/tenant/authz/audit guard bypass diff'i yok: <diff-note-ref>",
      "Rollback note: performance scripts/tests/report değişiklikleri revert edilebilir; yeni domain veya feature eklenmedi"
    ],
    "traceability": {
      "implementationStatus": "verified",
      "performanceEvidenceStatus": "verified",
      "queueStatus": "verified:W3-02"
    }
  }
]
```

## W3-02 Done Kapısı

W3-02 ancak şu koşullarla kapanır:

- W3-01 evidence daha önce verified durumdadır.
- p95 load report gerçek tool çıktısıyla üretilmiştir.
- N+1 detection testleri geçmiştir.
- Cache policy tenant-aware invalidation/no-cache kararlarını belgeler.
- Threshold kırmızıysa blocker note vardır ve done yazılmaz.
- Security/tenant/authz/audit guard bypass yapılmamıştır.
- Yeni domain, feature veya diğer Wave 3 işleri eklenmemiştir.
- `build-enterprise-readiness` node'una PR/CI/test/evidence geri yazılmıştır.

Bu done kapısı kapanmadan W3-03 Accessibility Gates başlamaz.
