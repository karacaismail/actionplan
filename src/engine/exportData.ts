import workspaceManifest from "@/data/workspace-manifest.json";
import type { TaskNode } from "@/schemas";

/** GitHub Pages mutlak taban (export referans URL'leri için). */
export const PAGES_BASE = "https://karacaismail.github.io/actionplan";

type WorkspaceManifest = typeof workspaceManifest;
type Workspace = WorkspaceManifest["workspaces"][number];
type CommandSpec = Workspace["commands"]["setup"][number];
export type TaskArtifactMode =
  | "raw-json"
  | "developer-brief"
  | "agent-prompt"
  | "evidence-patch"
  | "vobecoder-card";

const PRIMARY_WORKSPACE =
  workspaceManifest.workspaces.find((w) => w.id === workspaceManifest.primaryWorkspaceId) ??
  workspaceManifest.workspaces[0];

const EXPORT_DATE = () => new Date().toISOString();

export interface TaskRef {
  id: string;
  title: string;
  /** Mutlak (GitHub Pages) URL. */
  absoluteUrl: string;
  /** Uygulama-içi rota (local indirilip çalıştırıldığında da geçerli). */
  relativeUrl: string;
}

/** Bir düğüm id'sini tanım + mutlak + göreli URL ile çözer (index varsa başlık dolu). */
function taskRef(id: string, index?: Map<string, TaskNode>): TaskRef {
  return {
    id,
    title: index?.get(id)?.title ?? id,
    absoluteUrl: `${PAGES_BASE}/task/${id}`,
    relativeUrl: `/task/${id}`,
  };
}

function taskRefs(ids: string[], index?: Map<string, TaskNode>): TaskRef[] {
  return ids.map((id) => taskRef(id, index));
}

function taskUrl(node: TaskNode): string {
  return `${PAGES_BASE}/task/${node.id}`;
}

function taskFilename(node: TaskNode, suffix: string, ext: string): string {
  const prefix = (node.wbsCode || node.id).replace(/[^a-zA-Z0-9._-]+/g, "-");
  return `${prefix}-${node.id}-${suffix}.${ext}`;
}

function linesList(items: string[], empty = "_Yok._"): string {
  if (!items.length) return empty;
  return items.map((item) => `- ${item}`).join("\n");
}

function commandList(commands: CommandSpec[]): string {
  return commands.map((c) => `- \`${c.command}\` (cwd: \`${c.cwd}\`)`).join("\n");
}

function traceability(node: TaskNode) {
  return {
    repoPath: node.traceability?.repoPath ?? [],
    testCommand: node.traceability?.testCommand ?? [],
    deployTarget: node.traceability?.deployTarget ?? null,
    implementationStatus: node.traceability?.implementationStatus ?? "not-started",
  };
}

function codeStartVerdict(node: TaskNode): string {
  const tr = traceability(node);
  if (node.phase !== "development") {
    return `NO-GO for code-start: phase is \`${node.phase}\`. Run the waterfall phase work first.`;
  }
  if (!tr.repoPath.length || !tr.testCommand.length || tr.implementationStatus === "not-started") {
    return "NO-GO for code-start: fill `traceability.repoPath`, `traceability.testCommand`, and set `implementationStatus` before coding.";
  }
  return "GO for code-start: repoPath, testCommand, and implementationStatus are present.";
}

function refsMarkdown(indexRefs: TaskRef[], empty = "_Yok._"): string {
  if (!indexRefs.length) return empty;
  return indexRefs.map((ref) => `- \`${ref.id}\` — ${ref.title} — ${ref.absoluteUrl}`).join("\n");
}

/**
 * Tüm görevleri tam-doğruluklu JSON olarak dışa aktarır. `links`: her düğüm id'sinin
 * başlık + mutlak (Pages) + göreli URL çözüm tablosu → dependsOn/blocks/related id'leri çözülebilir.
 */
export function exportJSON(nodes: TaskNode[]): string {
  const links = Object.fromEntries(
    nodes.map((n) => [
      n.id,
      { title: n.title, absoluteUrl: `${PAGES_BASE}/task/${n.id}`, relativeUrl: `/task/${n.id}` },
    ]),
  );
  return JSON.stringify(
    { schemaVersion: "1.0.0", exportedAt: new Date().toISOString(), nodes, links },
    null,
    2,
  );
}

/**
 * Tek bir görevi EKSİKSİZ JSON olarak verir (vibecoding prompt'u). İçerik: düğümün TAMAMI
 * (14 boyut + prompt'lar + 7 faz + standardRefs/applicability/waivers + evidence) + çözülmüş
 * `references`: bağımlılık/ilişki her biri tanım (title) + mutlak (Pages) + göreli URL ile.
 * Kaynak DOM değil veri → sayfaya bileşen eklense de export bozulmaz.
 */
export function exportTask(node: TaskNode, index?: Map<string, TaskNode>): string {
  const references = {
    self: {
      id: node.id,
      absoluteUrl: `${PAGES_BASE}/task/${node.id}`,
      relativeUrl: `/task/${node.id}`,
    },
    dependsOn: node.dependsOn.map((id) => taskRef(id, index)),
    blocks: node.blocks.map((id) => taskRef(id, index)),
    related: node.related.map((id) => taskRef(id, index)),
  };
  return JSON.stringify(
    { schemaVersion: "1.0.0", exportedAt: new Date().toISOString(), task: node, references },
    null,
    2,
  );
}

export function exportDeveloperBrief(node: TaskNode, index?: Map<string, TaskNode>): string {
  const tr = traceability(node);
  const dependsOn = taskRefs(node.dependsOn, index);
  const related = taskRefs(node.related, index);
  const tests = tr.testCommand.length
    ? tr.testCommand.join("; ")
    : "Eksik: test-plan fazında doldur.";
  const acRows = node.acceptanceCriteria.length
    ? node.acceptanceCriteria
        .map((criterion, idx) => `| AC-${idx + 1} | ${criterion} | ${tests} |`)
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
`;
}

export function exportAgentPrompt(node: TaskNode, index?: Map<string, TaskNode>): string {
  const tr = traceability(node);
  const allowed = tr.repoPath.length ? tr.repoPath : ["NO-GO: traceability.repoPath is empty"];
  const tests = tr.testCommand.length
    ? tr.testCommand
    : ["NO-GO: traceability.testCommand is empty"];
  const dependsOn = taskRefs(node.dependsOn, index);

  return `# Agent Task Contract — ${node.id}

You are a coding agent working from an actionplan task export.
Do not ask clarifying questions. If the task is not code-start ready, stop after producing the missing readiness patch proposal.

## Task

- Title: ${node.title}
- URL: ${taskUrl(node)}
- Level: ${node.level}
- Phase: ${node.phase}
- Status: ${node.status}
- Code-start verdict: ${codeStartVerdict(node)}

## Workspace

- Use workspace: ${PRIMARY_WORKSPACE.name}
- Local path: \`${PRIMARY_WORKSPACE.localPath}\`
- Backend root: \`${PRIMARY_WORKSPACE.roots.backend}\`
- Frontend root: \`${PRIMARY_WORKSPACE.roots.frontend}\`
- Shared UI root: \`${PRIMARY_WORKSPACE.roots.sharedUi}\`
- Infra root: \`${PRIMARY_WORKSPACE.roots.infra}\`

Setup commands:

${commandList(PRIMARY_WORKSPACE.commands.setup)}

Default verification:

${commandList(PRIMARY_WORKSPACE.commands.defaultVerification)}

## Allowed Files

${linesList(allowed.map((p) => `\`${p}\``))}

## Forbidden Files and Actions

- Do not push to \`main\` or \`master\`.
- Do not edit CI, lint, security policy, or ruleset files unless this task explicitly names them in repoPath.
- Do not create new apps or modules outside this task scope.
- Do not change unrelated tasks, generated roadmap data, or actionplan JSON while coding in the implementation repo.
- Do not use forbidden stack: ${PRIMARY_WORKSPACE.stack.forbidden.join(", ")}.

## Acceptance Criteria

${linesList(node.acceptanceCriteria)}

## Required Tests

${linesList(tests.map((cmd) => `\`${cmd}\``))}

## Dependencies

${refsMarkdown(dependsOn)}

## Output Contract

1. Create branch \`${PRIMARY_WORKSPACE.branchPattern.replace("<task-id>", node.id).replace("<slug>", node.slug)}\`.
2. Write failing tests first for every acceptance criterion.
3. Implement the smallest code change that turns tests green.
4. Return changed files, test output, risk notes, and rollback notes.
5. Open a PR; do not mark the task done without evidence.

## Stop Conditions

- repoPath or testCommand is missing.
- Required test fails after 5 iterations.
- You need to edit a forbidden file.
- You cannot prove red-to-green test transition.
- You need product-owner or security approval.
`;
}

export function exportEvidencePatch(node: TaskNode): string {
  const tr = traceability(node);
  const patch: Array<{ op: "add" | "replace"; path: string; value: unknown }> = [];
  if (!node.traceability) {
    patch.push({
      op: "add",
      path: "/traceability",
      value: {
        repoPath: [],
        testCommand: [],
        deployTarget: null,
        implementationStatus: "not-started",
        tenantStrategy: null,
        auditLogRef: null,
      },
    });
  }
  patch.push(
    {
      op: "add",
      path: "/evidence/-",
      value:
        "TODO: PR geçti: <pr-url>; CI: <ci-run-url>; test-log: <test-log-url>; manuel kontrol: <note>",
    },
    {
      op: "replace",
      path: "/traceability/implementationStatus",
      value: "verified",
    },
  );
  if (!tr.repoPath.length) {
    patch.push({ op: "add", path: "/traceability/repoPath/-", value: "TODO: implementation path" });
  }
  if (!tr.testCommand.length) {
    patch.push({
      op: "add",
      path: "/traceability/testCommand/-",
      value: "TODO: verified test command",
    });
  }
  if (!tr.deployTarget) {
    patch.push({
      op: "replace",
      path: "/traceability/deployTarget",
      value: "TODO: staging/prod target or N/A",
    });
  }
  patch.push(
    { op: "replace", path: "/schedule/actualEnd", value: "TODO: YYYY-MM-DD" },
    { op: "replace", path: "/status", value: "done" },
  );
  return JSON.stringify(
    {
      schemaVersion: "1.0.0",
      exportedAt: EXPORT_DATE(),
      taskId: node.id,
      mode: "evidence-update-patch",
      patch,
    },
    null,
    2,
  );
}

export function exportVobecoderCard(node: TaskNode): string {
  const tr = traceability(node);
  const primaryTest = tr.testCommand[0] ?? "NO-GO: testCommand eksik";
  const primaryPath = tr.repoPath[0] ?? "NO-GO: repoPath eksik";
  return `# Vobecoder Task Card — ${node.id}

## Yapıştırılacak Prompt

Bu görevi uygula: ${node.title}
Actionplan URL: ${taskUrl(node)}
Çalışma kökü: ${PRIMARY_WORKSPACE.localPath}
Hedef yol: ${primaryPath}
Test komutu: ${primaryTest}

Kurallar:
- Önce kırmızı test yaz.
- Sonra en küçük kod değişikliğiyle testi yeşile çevir.
- Yasak stack kullanma: ${PRIMARY_WORKSPACE.stack.forbidden.join(", ")}.
- Main/master branch'e push etme.
- Test çıktısı ve PR linki olmadan "bitti" deme.

## Beklenen Dosyalar

${linesList(
  tr.repoPath.map((p) => `\`${p}\``),
  "_Önce repoPath doldurulmalı._",
)}

## Çalıştırılacak Test

\`\`\`bash
${primaryTest}
\`\`\`

## Red Flag

- Test yoksa reddet.
- Negatif test yoksa reddet.
- Dosya yolu hedef dışına taşıyorsa reddet.
- AI sadece açıklama yazıp dosya üretmezse reddet.
`;
}

export function exportTaskArtifact(
  node: TaskNode,
  mode: TaskArtifactMode,
  index?: Map<string, TaskNode>,
): { filename: string; content: string; mime: string } {
  switch (mode) {
    case "developer-brief":
      return {
        filename: taskFilename(node, "developer-brief", "md"),
        content: exportDeveloperBrief(node, index),
        mime: "text/markdown",
      };
    case "agent-prompt":
      return {
        filename: taskFilename(node, "agent-prompt", "md"),
        content: exportAgentPrompt(node, index),
        mime: "text/markdown",
      };
    case "evidence-patch":
      return {
        filename: taskFilename(node, "evidence-patch", "json"),
        content: exportEvidencePatch(node),
        mime: "application/json",
      };
    case "vobecoder-card":
      return {
        filename: taskFilename(node, "vobecoder-card", "md"),
        content: exportVobecoderCard(node),
        mime: "text/markdown",
      };
    case "raw-json":
      return {
        filename: taskFilename(node, "raw", "json"),
        content: exportTask(node, index),
        mime: "application/json",
      };
  }
}

const CSV_COLUMNS = [
  "id",
  "wbsCode",
  "level",
  "title",
  "parentId",
  "status",
  "priority",
  "phase",
  "progress",
  "owner",
  "effortEstimate",
  "effortUnit",
  "tags",
  "dependsOn",
  "criticalPath",
  "state",
  "_node",
] as const;

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** Görevleri düz CSV satırlarına indirger (PM alanları). */
export function exportCSV(nodes: TaskNode[]): string {
  const header = CSV_COLUMNS.join(",");
  const rows = nodes.map((n) =>
    [
      n.id,
      n.wbsCode,
      n.level,
      n.title,
      n.parentId ?? "",
      n.status,
      n.priority,
      n.phase,
      String(n.progress),
      n.owner ?? "",
      String(n.effort.estimate),
      n.effort.unit,
      n.tags.join("|"),
      n.dependsOn.join("|"),
      String(n.criticalPath),
      n.state,
      // Tam-fidelity: 14 boyut + 7 faz + kabul/risk/teslimat dahil tüm düğüm JSON olarak.
      JSON.stringify(n),
    ]
      .map((v) => csvEscape(String(v)))
      .join(","),
  );
  return [header, ...rows].join("\n");
}

export { CSV_COLUMNS };

/** Tarayıcıda dosya indirme tetikler (UI yardımcı). */
export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
