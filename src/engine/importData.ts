import {
  type TaskNode,
  TaskNodeSchema,
  makeSkeletonDimensions,
  makeSkeletonPhases,
} from "@/schemas";

export interface ImportResult {
  nodes: TaskNode[];
  errors: string[];
}

/** Tam-doğruluklu JSON içe aktarımı (export çıktısıyla simetrik). */
export function importJSON(text: string): ImportResult {
  const errors: string[] = [];
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    return { nodes: [], errors: [`Geçersiz JSON: ${(e as Error).message}`] };
  }
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as { nodes?: unknown }).nodes)
      ? (raw as { nodes: unknown[] }).nodes
      : null;
  if (!list) return { nodes: [], errors: ["Beklenen biçim: dizi veya { nodes: [...] }"] };

  const nodes: TaskNode[] = [];
  list.forEach((item, i) => {
    const parsed = TaskNodeSchema.safeParse(item);
    if (parsed.success) nodes.push(parsed.data);
    else errors.push(`#${i}: ${parsed.error.issues.map((x) => x.message).join("; ")}`);
  });
  return { nodes, errors };
}

/** Basit ama tırnak/escape farkında CSV ayrıştırıcı (zero-dep). */
export function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  if (rows.length === 0) return [];
  const header = rows[0];
  return rows
    .slice(1)
    .filter((r) => r.some((v) => v.trim() !== ""))
    .map((r) => Object.fromEntries(header.map((h, idx) => [h, r[idx] ?? ""])));
}

/** CSV içe aktarımı — düz PM alanlarını TaskNode'a yeniden kurar. */
export function importCSV(text: string): ImportResult {
  const errors: string[] = [];
  const records = parseCSV(text);
  const nodes: TaskNode[] = [];
  records.forEach((rec, i) => {
    // Tam-fidelity: _node sütunu varsa tüm düğümü oradan kur (14 boyut + 7 faz + kabul/risk dahil).
    if (rec._node) {
      try {
        const full = TaskNodeSchema.safeParse(JSON.parse(rec._node));
        if (full.success) {
          nodes.push(full.data);
          return;
        }
        errors.push(`Satır ${i + 2}: ${full.error.issues.map((x) => x.message).join("; ")}`);
        return;
      } catch (e) {
        errors.push(`Satır ${i + 2}: _node JSON ayrıştırılamadı (${(e as Error).message})`);
        return;
      }
    }
    const candidate = {
      id: rec.id,
      wbsCode: rec.wbsCode ?? "",
      level: rec.level,
      title: rec.title,
      slug: rec.id,
      parentId: rec.parentId ? rec.parentId : null,
      status: rec.status || "backlog",
      priority: rec.priority || "medium",
      phase: rec.phase || "requirements",
      progress: Number(rec.progress || 0),
      owner: rec.owner ? rec.owner : null,
      effort: {
        estimate: Number(rec.effortEstimate || 0),
        unit: (rec.effortUnit || "sp") as "sp" | "h" | "d",
        spent: 0,
      },
      tags: rec.tags ? rec.tags.split("|").filter(Boolean) : [],
      dependsOn: rec.dependsOn ? rec.dependsOn.split("|").filter(Boolean) : [],
      criticalPath: rec.criticalPath === "true",
      state: rec.state || "taslak",
      dimensions: makeSkeletonDimensions(),
      phases: makeSkeletonPhases(),
    };
    const parsed = TaskNodeSchema.safeParse(candidate);
    if (parsed.success) nodes.push(parsed.data);
    else errors.push(`Satır ${i + 2}: ${parsed.error.issues.map((x) => x.message).join("; ")}`);
  });
  return { nodes, errors };
}
