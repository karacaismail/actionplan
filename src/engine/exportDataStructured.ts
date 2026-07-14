import type { TaskNode } from "@/schemas";
import { enterpriseEvidenceReadiness } from "./exportDataEnterprise";
import {
  EXPORT_DATE,
  PAGES_BASE,
  resolvedDirectives,
  taskRef,
  traceability,
} from "./exportDataShared";
import { indexById } from "./resolve";
import { nodeStandards } from "./standards";

/** Tüm görevleri tam-doğruluklu JSON olarak dışa aktarır. */
export function exportJSON(nodes: TaskNode[]): string {
  const index = indexById(nodes);
  const links = Object.fromEntries(
    nodes.map((n) => [
      n.id,
      { title: n.title, absoluteUrl: `${PAGES_BASE}/task/${n.id}`, relativeUrl: `/task/${n.id}` },
    ]),
  );
  const resolvedStandardsByNode = Object.fromEntries(
    nodes.map((node) => [node.id, nodeStandards(node)]),
  );
  const resolvedDirectivesByNode = Object.fromEntries(
    nodes.map((node) => [node.id, resolvedDirectives(node, index)]),
  );
  return JSON.stringify(
    {
      schemaVersion: "1.0.0",
      exportedAt: new Date().toISOString(),
      nodes,
      links,
      resolvedStandardsByNode,
      resolvedDirectivesByNode,
    },
    null,
    2,
  );
}

/** Tek bir görevi tam JSON ve çözülmüş referans sidecar'larıyla verir. */
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
    {
      schemaVersion: "1.0.0",
      exportedAt: new Date().toISOString(),
      task: node,
      references,
      resolvedStandards: nodeStandards(node),
      resolvedDirectives: resolvedDirectives(node, index),
    },
    null,
    2,
  );
}

export function exportEvidencePatch(node: TaskNode): string {
  const tr = traceability(node);
  const readiness = enterpriseEvidenceReadiness(node);
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
  patch.push({
    op: "add",
    path: "/evidence/-",
    value:
      "TODO: PR geçti: <pr-url>; CI: <ci-run-url>; test-log: <test-log-url>; manuel kontrol: <note>",
  });
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
  if (readiness.canProposeVerifiedDone) {
    patch.push(
      { op: "replace", path: "/traceability/implementationStatus", value: "verified" },
      { op: "replace", path: "/schedule/actualEnd", value: "TODO: YYYY-MM-DD" },
      { op: "replace", path: "/status", value: "done" },
    );
  }
  return JSON.stringify(
    {
      schemaVersion: "1.0.0",
      exportedAt: EXPORT_DATE(),
      taskId: node.id,
      mode: "evidence-update-patch",
      readiness,
      patch,
    },
    null,
    2,
  );
}

export const CSV_COLUMNS = [
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
      JSON.stringify(n),
    ]
      .map((v) => csvEscape(String(v)))
      .join(","),
  );
  return [header, ...rows].join("\n");
}

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
