import workspaceManifest from "@/data/workspace-manifest.json";
import type { TaskNode } from "@/schemas";
import {
  type EffectiveDirectiveApplication,
  effectiveDirectiveApplications,
} from "./effectiveDirectives";
import { indexById } from "./resolve";
import { nodeStandards } from "./standards";

/** GitHub Pages mutlak taban (export referans URL'leri için). */
export const PAGES_BASE = "https://karacaismail.github.io/actionplan";

type WorkspaceManifest = typeof workspaceManifest;
type Workspace = WorkspaceManifest["workspaces"][number];
type CommandSpec = Workspace["commands"]["setup"][number];

export const PRIMARY_WORKSPACE =
  workspaceManifest.workspaces.find((w) => w.id === workspaceManifest.primaryWorkspaceId) ??
  workspaceManifest.workspaces[0];

export const EXPORT_DATE = () => new Date().toISOString();

export interface TaskRef {
  id: string;
  title: string;
  /** Mutlak (GitHub Pages) URL. */
  absoluteUrl: string;
  /** Uygulama-içi rota (local indirilip çalıştırıldığında da geçerli). */
  relativeUrl: string;
}

/** Bir düğüm id'sini tanım + mutlak + göreli URL ile çözer (index varsa başlık dolu). */
export function taskRef(id: string, index?: Map<string, TaskNode>): TaskRef {
  return {
    id,
    title: index?.get(id)?.title ?? id,
    absoluteUrl: `${PAGES_BASE}/task/${id}`,
    relativeUrl: `/task/${id}`,
  };
}

export function taskRefs(ids: string[], index?: Map<string, TaskNode>): TaskRef[] {
  return ids.map((id) => taskRef(id, index));
}

export function taskUrl(node: TaskNode): string {
  return `${PAGES_BASE}/task/${node.id}`;
}

export function taskFilename(node: TaskNode, suffix: string, ext: string): string {
  const prefix = (node.wbsCode || node.id).replace(/[^a-zA-Z0-9._-]+/g, "-");
  return `${prefix}-${node.id}-${suffix}.${ext}`;
}

export function visibleDirectiveContent(value: string): string {
  return value.replace(/\[\/?DOC-APPLY:[^\]]+\]\n?/g, "").trim();
}

export function linesList(items: string[], empty = "_Yok._"): string {
  if (!items.length) return empty;
  return items.map((item) => `- ${visibleDirectiveContent(item)}`).join("\n");
}

export function resolvedDirectives(
  node: TaskNode,
  index?: Map<string, TaskNode>,
): EffectiveDirectiveApplication[] {
  return effectiveDirectiveApplications(node, index ?? indexById([node]));
}

export function resolvedDirectivesMarkdown(node: TaskNode, index?: Map<string, TaskNode>): string {
  const applications = resolvedDirectives(node, index);
  if (!applications.length) return "_Bu görev için çözümlenmiş doküman yönergesi yok._";
  return applications
    .map(
      (application) => `### ${application.ruleId}

- Canonical source: \`${application.source}\`
- Application mode: \`${application.mode}\`
- Execution owner: \`${application.ownerNodeId}\`

Applied JSON task clause:

${visibleDirectiveContent(application.item)}

Task prompt:

${visibleDirectiveContent(application.prompt)}`,
    )
    .join("\n\n");
}

export function resolvedStandardsMarkdown(node: TaskNode): string {
  const standards = nodeStandards(node);
  if (!standards.length) return "_Bu görev için çözümlenmiş standart sözleşmesi yok._";
  return standards
    .map((standard) => {
      const rules = standard.rules.length
        ? standard.rules
            .map(
              (rule) =>
                `- [${rule.severity}] \`${rule.id}\`: ${rule.rule}\n  - Check: ${rule.check || "İnsan review"}\n  - Rationale: ${rule.rationale || "—"}`,
            )
            .join("\n")
        : "- Kural paketi bu katalog türü için ayrı kaynaktan çözülür.";
      return `### ${standard.name} (\`${standard.id}\`)\n\n- Canonical JSON: \`${standard.source}\`\n- Summary: ${standard.summary || "—"}\n- References: ${standard.references.length ? standard.references.join(", ") : "—"}\n\n${rules}`;
    })
    .join("\n\n");
}

export function commandList(commands: CommandSpec[]): string {
  return commands.map((c) => `- \`${c.command}\` (cwd: \`${c.cwd}\`)`).join("\n");
}

export function traceability(node: TaskNode) {
  return {
    repoPath: node.traceability?.repoPath ?? [],
    testCommand: node.traceability?.testCommand ?? [],
    deployTarget: node.traceability?.deployTarget ?? null,
    implementationStatus: node.traceability?.implementationStatus ?? "not-started",
  };
}

export function refsMarkdown(indexRefs: TaskRef[], empty = "_Yok._"): string {
  if (!indexRefs.length) return empty;
  return indexRefs.map((ref) => `- \`${ref.id}\` — ${ref.title} — ${ref.absoluteUrl}`).join("\n");
}

/** Storybook / UI Delivery bölümünü açık, evidence-safe metne dönüştürür. */
export function uiDeliverySection(node: TaskNode, compact = false): string {
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
