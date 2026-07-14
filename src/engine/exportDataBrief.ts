import type { TaskNode } from "@/schemas";
import { codeStartVerdict, enterpriseDefinitionMarkdown } from "./exportDataEnterprise";
import {
  EXPORT_DATE,
  PRIMARY_WORKSPACE,
  linesList,
  refsMarkdown,
  resolvedDirectivesMarkdown,
  resolvedStandardsMarkdown,
  taskRefs,
  taskUrl,
  traceability,
  uiDeliverySection,
  visibleDirectiveContent,
} from "./exportDataShared";

export function exportDeveloperBrief(node: TaskNode, index?: Map<string, TaskNode>): string {
  const tr = traceability(node);
  const dependsOn = taskRefs(node.dependsOn, index);
  const related = taskRefs(node.related, index);
  const tests = tr.testCommand.length
    ? tr.testCommand.join("; ")
    : "Eksik: test-plan fazında doldur.";
  const acRows = node.acceptanceCriteria.length
    ? node.acceptanceCriteria
        .map(
          (criterion, idx) =>
            `| AC-${idx + 1} | ${visibleDirectiveContent(criterion)} | ${tests} |`,
        )
        .join("\n")
    : "| — | Eksik acceptance criterion | Eksik |";

  return `# Developer Brief — ${node.title}

Export: ${EXPORT_DATE()}
Task: \`${node.id}\` · WBS: \`${node.wbsCode || "-"}\`
URL: ${taskUrl(node)}

## 1. Görev Özeti

- Level: \`${node.level}\`
- Phase: \`${node.phase}\`
- Status: \`${node.status}\`
- Owner: ${node.owner ?? "atanmadı"}
- Priority: \`${node.priority}\`
- Code-start verdict: ${codeStartVerdict(node)}

${node.summary || "_Özet yok._"}

## 2. Implementation Workspace

- Workspace: \`${PRIMARY_WORKSPACE.id}\` — ${PRIMARY_WORKSPACE.name}
- Local path: \`${PRIMARY_WORKSPACE.localPath}\`
- Repo status: \`${PRIMARY_WORKSPACE.repoStatus}\`
- Branch pattern: \`${PRIMARY_WORKSPACE.branchPattern}\`

## 3. Yapılacaklar

${linesList(node.deliverables)}

## 4. Yapılmayacaklar

- Kapsam dışı app/module üretme.
- Ruleset, CI veya güvenlik politikasını override etme.
- \`main\` / \`master\` branch'e doğrudan push etme.
- Acceptance criteria dışı refactor veya mimari genişletme yapma.

## 5. Acceptance Criteria → Test Eşlemesi

| Kriter | Beklenen davranış | Test komutu |
|---|---|---|
${acRows}

## 6. Traceability

- repoPath: ${tr.repoPath.length ? tr.repoPath.map((p) => `\`${p}\``).join(", ") : "_Eksik_"}
- testCommand: ${tr.testCommand.length ? tr.testCommand.map((c) => `\`${c}\``).join(", ") : "_Eksik_"}
- deployTarget: ${tr.deployTarget ? `\`${tr.deployTarget}\`` : "_Eksik / N/A_"}
- implementationStatus: \`${tr.implementationStatus}\`

## 7. Risk ve Rollback

${linesList(node.risks.map((r) => `${r.id}: ${r.desc} — mitigation: ${r.mitigation}`))}

Rollback: ${node.rollback || "_Eksik._"}

## 8. Bağımlılıklar

${refsMarkdown(dependsOn)}

## 9. İlişkili Referanslar

${refsMarkdown(related)}

## 10. Evidence Checklist

Mevcut evidence:

${linesList(node.evidence)}

Done için beklenen kanıt:

${linesList(PRIMARY_WORKSPACE.evidence.requiredForDone)}

## 11. Storybook / UI Delivery

${uiDeliverySection(node)}

## 12. Enterprise App / Module Definition

${enterpriseDefinitionMarkdown(node, index)}

## 13. Canonical Engineering Standards — Resolved From JSON

${resolvedStandardsMarkdown(node)}

## 14. Resolved Document Directives — From JSON

${resolvedDirectivesMarkdown(node, index)}
`;
}
