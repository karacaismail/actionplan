import type { TaskNode } from "@/schemas";

/** GitHub Pages mutlak taban (export referans URL'leri için). */
export const PAGES_BASE = "https://karacaismail.github.io/actionplan";

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
