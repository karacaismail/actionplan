# W3-03 Enterprise Accessibility Gates Agent Pack — 2026-07-09

Durum: docs-only implementation agent pack
Queue item: `W3-03`
Branch: `task/enterprise-a11y-gates`
WBS node'ları: `build-enterprise-readiness`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
Queue status: `blocked-by-W3-02`

Bu belge product code üretmez. Amaç, W3-02 Enterprise Performance Gates kanıtı kapandıktan sonra açılacak W3-03 işini implementation operatörünün Claude Code/Cursor/Aider gibi bir kod ajanına verebileceği sıkı prompt ve evidence sözleşmesine dönüştürmektir.

## Önkoşul

W3-03 yalnız şu kanıtlar geldikten sonra başlar:

- W2-06 repeatability verified evidence
- W3-01 security gates verified evidence
- W3-02 performance gates verified evidence
- Customer, OrderOps ve Inventory web e2e smoke evidence

Bu kanıtlar yoksa W3-03 prompt'u kod ajanına verilmez; yalnız hazırlık/handoff dokümanı olarak kalır.

## Amaç

W3-03'ün tek amacı enterprise accessibility gate kanıtını üretmektir:

- Customer, OrderOps ve Inventory route'ları axe-core ihlal raporu taşır.
- Keyboard navigation ve focus order üç domain için test edilir.
- Contrast/token uyumu raporlanır.
- A11y gate kırmızıysa PR çıkışı fail-closed olur.
- UI redesign, görsel yenileme veya feature işi başlatılmaz.

## Non-Goal

W3-03 şunları yapmaz:

- UI redesign, yeni component kit veya layout refactor üretmez.
- Performance, reliability, observability veya release governance işlerini başlatmaz.
- Axe/keyboard/focus testlerini skip/waiver ile sahte yeşil yapmaz.
- Customer/OrderOps/Inventory business davranışını değiştirmez.
- Actionplan evidence/status alanlarını gerçek PR/CI/test kanıtı olmadan ilerletmez.

## Agent Prompt

Implementation operatörü aşağıdaki prompt'u `/Users/karaca/DEV/mimari/platform` içinde, yalnız W3-02 evidence kapandıktan sonra kullanır:

```text
Görev: W3-03 Enterprise Accessibility Gates.

Workspace: /Users/karaca/DEV/mimari/platform
Branch: task/enterprise-a11y-gates
WBS nodes: build-enterprise-readiness
Prerequisite: W3-02 verified evidence in actionplan.

Amaç:
1. Customer, OrderOps ve Inventory route'ları için enterprise a11y e2e spec'i ekle.
2. Axe-core, keyboard navigation, focus order ve contrast report üret.
3. A11y gate kırmızıysa PR çıkışını fail-closed yap.
4. UI redesign veya feature davranışı başlatmadan erişilebilirlik evidence üret.
5. PR/CI/test/report evidence ve actionplan writeback patch'ini hazırla.

Mutlak sınırlar:
- W3-02 evidence yoksa kod yazma; blocker raporu üret.
- UI redesign, feature work, reliability/observability/release governance işi başlatma.
- Axe/keyboard/focus testlerini skip, xfail veya selective route kapsamıyla gizleme.
- Contrast/token bulgusunu gerçek report olmadan temiz yazma.
- Actionplan'da status/progress/evidence alanlarını gerçek PR/CI/test kanıtı olmadan ilerletme.

Önce kırmızı/eksik evidence'i göster:
- git status --short --branch
- W3-02 performance evidence referansları
- mevcut a11y-enterprise spec var/yok durumu
- Customer/OrderOps/Inventory route coverage listesi
- mevcut axe/keyboard/focus/contrast report var/yok durumu
- UI redesign veya feature diff'i olmadığını gösteren note

Beklenen minimum değişiklikler:
- apps/web/e2e/a11y-enterprise.spec.ts
- reports/accessibility/customer-a11y.md
- reports/accessibility/orderops-a11y.md
- reports/accessibility/inventory-a11y.md
- reports/accessibility/keyboard-focus-report.md
- reports/accessibility/contrast-report.md
- reports/accessibility/a11y-gate-summary.md

Test-first sıra:
1. Enterprise a11y route coverage testi önce kırmızı olur.
2. Customer axe/keyboard/focus report üretimi yeşile döner.
3. OrderOps axe/keyboard/focus report üretimi yeşile döner.
4. Inventory axe/keyboard/focus report üretimi yeşile döner.
5. Contrast/token report gate'i geçer veya blocker note üretir.
6. UI redesign/feature diff'i olmadığı kanıtlanır.

Zorunlu doğrulama:
pnpm --filter @platform/web run e2e -- a11y-enterprise.spec.ts

Çıkış:
- PR URL
- CI run URL
- merge commit SHA
- Customer axe/keyboard/focus report
- OrderOps axe/keyboard/focus report
- Inventory axe/keyboard/focus report
- contrast report
- UI redesign/feature non-goal diff note
- rollback/smoke note
- manual-review note
```

## Operator Checklist

PR açmadan önce:

- [ ] W3-02 evidence actionplan'da doğrulandı.
- [ ] Branch `task/enterprise-a11y-gates` olarak açıldı.
- [ ] İlk commit kırmızı a11y-enterprise route coverage testi taşıyor.
- [ ] Customer/OrderOps/Inventory axe reportları var.
- [ ] Keyboard navigation ve focus order reportları var.
- [ ] Contrast/token report var.
- [ ] A11y gate kırmızıysa PR çıkışı blocker.
- [ ] UI redesign veya feature diff'i yok.
- [ ] PR body WBS node, scope, non-goal, tests, rollback ve evidence patch içeriyor.

PR merge sonrası:

- [ ] CI run URL alındı.
- [ ] Üç domain a11y reportları alındı.
- [ ] Keyboard/focus report alındı.
- [ ] Contrast report alındı.
- [ ] UI redesign/feature non-goal diff note yazıldı.
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
      "docs/platform-w3-03-enterprise-accessibility-gates-agent-pack-2026-07-09.md",
      "pr:<real-pr-url>",
      "commit:<merge-commit-sha>",
      "ci:<github-actions-run-url>",
      "report:<a11y-gate-summary-ref>"
    ],
    "evidence": [
      "W3-03 Enterprise Accessibility Gates geçti: <github-actions-run-url>",
      "Customer/OrderOps/Inventory axe/keyboard/focus reportları geçti: <a11y-report-ref>",
      "Contrast report geçti: <contrast-report-ref>",
      "UI redesign veya feature diff'i yok: <diff-note-ref>",
      "Rollback note: a11y tests/reports değişiklikleri revert edilebilir"
    ],
    "traceability": {
      "implementationStatus": "verified",
      "accessibilityEvidenceStatus": "verified",
      "queueStatus": "verified:W3-03"
    }
  }
]
```

## W3-03 Done Kapısı

W3-03 ancak şu koşullarla kapanır:

- W3-02 evidence daha önce verified durumdadır.
- Customer/OrderOps/Inventory axe reportları geçer.
- Component-story axe matrisi geçer: her Master Component'in story'leri (state × variant × theme × density × RTL) story-level axe + klavye testinden geçmiştir; story a11y ihlali uyarı olarak bırakılmamıştır (`docs/standards/02-a11y-accessibility-standard.md` §11 story-a11y satırı; e2e axe'in yerine geçmez, ikisi ayrı bloklayıcıdır).
- Keyboard navigation ve focus order reportları geçer.
- Contrast/token report geçer veya blocker note üretir.
- UI redesign, feature work veya diğer Wave 3 işleri eklenmemiştir.
- `build-enterprise-readiness` node'una PR/CI/test/evidence geri yazılmıştır.

Bu done kapısı kapanmadan W3-04 Reliability Gates başlamaz.
