import type { TaskNode } from "@/schemas";
import { codeStartVerdict, enterpriseDefinitionMarkdown } from "./exportDataEnterprise";
import { kernelIntegrationMarkdown } from "./exportDataKernel";
import {
  PRIMARY_WORKSPACE,
  commandList,
  linesList,
  refsMarkdown,
  resolvedDirectivesMarkdown,
  resolvedStandardsMarkdown,
  taskRefs,
  taskUrl,
  traceability,
  uiDeliverySection,
} from "./exportDataShared";

export function exportAgentPrompt(node: TaskNode, index?: Map<string, TaskNode>): string {
  const tr = traceability(node);
  const allowed = tr.repoPath.length ? tr.repoPath : ["NO-GO: traceability.repoPath is empty"];
  const tests = tr.testCommand.length
    ? tr.testCommand
    : ["NO-GO: traceability.testCommand is empty"];
  const dependsOn = taskRefs(node.dependsOn, index);

  return `# Agent Task Contract — ${node.id} — DIRECTIVE-ONLY

You are a directive-authoring AI working from an actionplan task export.
Do not modify the platform workspace. Your platform access is read-only-audit.
The human developer is the only product-code writer.
Do not write source code, tests, migrations, Storybook/config files or generated output.
Do not create a branch, commit, push or pull request.

## Task

- Title: ${node.title}
- URL: ${taskUrl(node)}
- Level: ${node.level}
- Phase: ${node.phase}
- Status: ${node.status}
- Code-start verdict: ${codeStartVerdict(node)}

## Human Implementation Target — Read Only for AI

- Target workspace for the human developer: ${PRIMARY_WORKSPACE.name}
- Local path: \`${PRIMARY_WORKSPACE.localPath}\`
- Backend root: \`${PRIMARY_WORKSPACE.roots.backend}\`
- Frontend root: \`${PRIMARY_WORKSPACE.roots.frontend}\`
- SDK root: \`${PRIMARY_WORKSPACE.roots.sdk}\`
- URL policy root: \`${PRIMARY_WORKSPACE.roots.urlPolicy}\`
- Shared UI root: \`${PRIMARY_WORKSPACE.roots.sharedUi}\`
- Infra root: \`${PRIMARY_WORKSPACE.roots.infra}\`

Setup commands for the human developer:

${commandList(PRIMARY_WORKSPACE.commands.setup)}

Default verification for the human developer:

${commandList(PRIMARY_WORKSPACE.commands.defaultVerification)}

## Human Target Files — AI Read Only

${linesList(allowed.map((p) => `\`${p}\``))}

## Forbidden AI Actions

- Do not modify any file under \`${PRIMARY_WORKSPACE.localPath}\`.
- Do not apply a patch, run a scaffold/codegen/migration, or format platform files.
- Do not create a branch, commit, tag, push, pull request or release.
- Do not fabricate PR, CI, test, Storybook preview or deployment evidence.
- Do not use forbidden stack: ${PRIMARY_WORKSPACE.stack.forbidden.join(", ")}.

## Acceptance Criteria

${linesList(node.acceptanceCriteria)}

## Tests for the Human Developer

${linesList(tests.map((cmd) => `\`${cmd}\``))}

## Dependencies

${refsMarkdown(dependsOn)}

## Storybook / UI Delivery

${uiDeliverySection(node)}

## Enterprise App / Module Definition

${enterpriseDefinitionMarkdown(node, index)}

${kernelIntegrationMarkdown(node, index)}

## Canonical Engineering Standards — Resolved From JSON

${resolvedStandardsMarkdown(node)}

## Resolved Document Directives — From JSON

${resolvedDirectivesMarkdown(node, index)}

## DIRECTIVE-ONLY Output Contract

1. Report the read-only repo reality and any conflicts with the task contract.
2. Define the failing tests the human developer must write, including assertion and expected failure reason.
3. Define the minimum implementation sequence without emitting source code or a patch.
4. Provide security-negative tests, rollback, Storybook obligations when UI-related, and evidence requirements.
5. Recommend human branch \`${PRIMARY_WORKSPACE.branchPattern.replace("<task-id>", node.id).replace("<slug>", node.slug)}\`; do not create it.
6. Return the complete directive under actionplan; do not mark runtime implemented or verified.

## Stop Conditions

- repoPath or testCommand is missing.
- Any platform write, test-file creation, migration, scaffold or configuration change is required.
- A branch, commit, push or pull request would be created.
- Human-produced PR/CI/test/preview/deployment evidence is unavailable.
- You need product-owner or security approval.
`;
}

export function exportVobecoderCard(node: TaskNode, index?: Map<string, TaskNode>): string {
  const tr = traceability(node);
  const primaryTest = tr.testCommand[0] ?? "NO-GO: testCommand eksik";
  const primaryPath = tr.repoPath[0] ?? "NO-GO: repoPath eksik";
  return `# Vobecoder Task Card — ${node.id} — DIRECTIVE-ONLY

## Yapıştırılacak Prompt

Bu görev için insan uygulama yönergesi üret: ${node.title}
Actionplan URL: ${taskUrl(node)}
Platform hedefi (AI salt-okunur): ${PRIMARY_WORKSPACE.localPath}
İnsan hedef yolu: ${primaryPath}
İnsan test komutu: ${primaryTest}
${uiDeliverySection(node, true)}

Kurallar:
- Platform dosyalarına yazma; ürün kodu yazarı yalnız İnsan geliştirici.
- Kırmızı testin dosyasını, assertion'ını ve failure reason'ını tarif et; testi yazma.
- Minimum implementation sırasını tarif et; kod veya patch üretme.
- Yasak stack kullanma: ${PRIMARY_WORKSPACE.stack.forbidden.join(", ")}.
- Branch, commit, push veya PR oluşturma.
- İnsan test çıktısı ve PR linki olmadan "bitti" deme.

## Enterprise App / Module Definition

${enterpriseDefinitionMarkdown(node, index)}

${kernelIntegrationMarkdown(node, index)}

## İnsan Geliştiricinin Hedef Dosyaları

${linesList(
  tr.repoPath.map((p) => `\`${p}\``),
  "_Önce repoPath doldurulmalı._",
)}

## İnsan Geliştiricinin Çalıştıracağı Test

\`\`\`bash
${primaryTest}
\`\`\`

## Canonical Engineering Standards — Resolved From JSON

${resolvedStandardsMarkdown(node)}

## Resolved Document Directives — From JSON

${resolvedDirectivesMarkdown(node, index)}

## Red Flag

- AI platform dosyasına yazarsa reddet.
- AI patch, branch, commit veya PR üretirse reddet.
- Negatif test, rollback veya evidence beklentisi yoksa reddet.
- İnsan evidence'ı uydurulursa reddet.
`;
}
