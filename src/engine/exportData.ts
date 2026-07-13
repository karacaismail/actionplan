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
 * Storybook / UI Delivery bölümü (docs/storybook-master-component-integration-directive.md §11 +
 * docs/task-export-contract.md "UI Delivery Beyanı"). Üç durumda da açık metin üretir — alan
 * sessizce boş bırakılmaz; gerçek evidence yokken storybookUrl uydurulmaz. Export kör kelime
 * eşlemesi yapmaz: yalnız düğümün uiDelivery sözleşmesini ve uiArtifactRole beyanını taşır.
 * `compact=true` Vobecoder Card için tek satırlık kısa biçim döndürür.
 */
function uiDeliverySection(node: TaskNode, compact = false): string {
  const ui = node.uiDelivery;
  if (ui) {
    if (!ui.applies) return `Storybook: N/A — ${ui.reason}`;
    const url = ui.storybookUrl ?? "evidence henüz yok — uydurma URL yazılmaz";
    const review = `\`${ui.reviewStatus}\`${ui.reviewer ? ` (reviewer: ${ui.reviewer})` : ""}`;
    if (compact) {
      return `Storybook: impact=\`${ui.impact}\` · kind=\`${ui.componentKind}\` · risk=\`${ui.riskClass}\` · story ref=${ui.storyRefs.length} · review=${review} · URL: ${url}`;
    }
    const refList = (items: string[]) =>
      items.length ? items.map((r) => `\`${r}\``).join(", ") : "_Yok._";
    const states = ui.requiredStoryStates.length ? ui.requiredStoryStates.join(", ") : "_Yok._";
    const reason = ui.reason.trim();
    return [
      `- Impact: \`${ui.impact}\`${reason ? ` — ${reason}` : ""}`,
      `- Component kind: \`${ui.componentKind}\` · Risk sınıfı: \`${ui.riskClass}\``,
      `- Master Component ref'leri: ${refList(ui.masterComponentRefs)}`,
      `- Story ref'leri: ${refList(ui.storyRefs)}`,
      `- Zorunlu story state'leri: ${states}`,
      `- Review: ${review}`,
      `- Storybook URL: ${url}`,
    ].join("\n");
  }
  const role = node.uiArtifactRole;
  if (role === "governs-ui" || role === "consumes-ui" || role === "no-ui") {
    return `Storybook: N/A — rol: ${role} (UI artifact üretmez)`;
  }
  if (role === "produces-ui" || role === "changes-ui-contract") {
    return "Storybook: SÖZLEŞME EKSİK — bu düğüm UI-impact adayıdır, uiDelivery doldurulmadan development'a giremez (check-ui-delivery)";
  }
  return "Storybook: karar bekleniyor — uiArtifactRole/uiDelivery henüz atanmadı (migration)";
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
 * (17 boyut + prompt'lar + 7 faz + standardRefs/applicability/waivers + evidence) + çözülmüş
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

## 11. Storybook / UI Delivery

${uiDeliverySection(node)}
`;
}

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

## İnsan Geliştiricinin Hedef Dosyaları

${linesList(
  tr.repoPath.map((p) => `\`${p}\``),
  "_Önce repoPath doldurulmalı._",
)}

## İnsan Geliştiricinin Çalıştıracağı Test

\`\`\`bash
${primaryTest}
\`\`\`

## Red Flag

- AI platform dosyasına yazarsa reddet.
- AI patch, branch, commit veya PR üretirse reddet.
- Negatif test, rollback veya evidence beklentisi yoksa reddet.
- İnsan evidence'ı uydurulursa reddet.
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
      // Tam-fidelity: 17 boyut + 7 faz + kabul/risk/teslimat dahil tüm düğüm JSON olarak.
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
