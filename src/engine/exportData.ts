import type { TaskNode } from "@/schemas";

/** Tüm görevleri tam-doğruluklu JSON olarak dışa aktarır. */
export function exportJSON(nodes: TaskNode[]): string {
  return JSON.stringify(
    { schemaVersion: "1.0.0", exportedAt: new Date().toISOString(), nodes },
    null,
    2,
  );
}

/**
 * Tek bir görevi tam JSON olarak verir (vibecoding prompt'u olarak kullanılır).
 * Kaynak: düğüm verisinin TAMAMI (DOM değil) → sayfaya bileşen eklense de bozulmaz.
 */
export function exportTask(node: TaskNode): string {
  return JSON.stringify(node, null, 2);
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
