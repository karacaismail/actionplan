import fs from "node:fs";
import path from "node:path";
import { type TaskNode, TaskNodeSchema } from "@/schemas";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * JSON-as-DB bütünlük kapısı: üretilmiş veri seti diskten okunup
 * şema + referans tutarlılığı invariantları doğrulanır.
 */
const GEN = path.resolve(process.cwd(), "src/data/generated");
const NODES = path.join(GEN, "nodes");

let nodes: TaskNode[] = [];
let ids: Set<string>;

beforeAll(() => {
  const files = fs.readdirSync(NODES).filter((f) => f.endsWith(".json"));
  nodes = files.map((f) => JSON.parse(fs.readFileSync(path.join(NODES, f), "utf8")));
  ids = new Set(nodes.map((n) => n.id));
});

describe("üretilmiş veri seti", () => {
  it("en az 300 düğüm üretilmiş", () => {
    expect(nodes.length).toBeGreaterThanOrEqual(300);
  });

  it("her düğüm TaskNode şemasına uyar", () => {
    const failures: string[] = [];
    for (const n of nodes) {
      const r = TaskNodeSchema.safeParse(n);
      if (!r.success) failures.push(`${n.id}: ${r.error.issues[0]?.message}`);
    }
    expect(failures).toEqual([]);
  });

  it("id'ler benzersiz", () => {
    expect(ids.size).toBe(nodes.length);
  });

  it("her parentId mevcut bir düğüme işaret eder (veya null)", () => {
    const orphans = nodes.filter((n) => n.parentId && !ids.has(n.parentId));
    expect(orphans.map((n) => n.id)).toEqual([]);
  });

  it("hiyerarşide döngü yok", () => {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    for (const start of nodes) {
      const seen = new Set<string>();
      let cur: TaskNode | undefined = start;
      while (cur?.parentId) {
        if (seen.has(cur.id)) throw new Error(`Döngü: ${start.id}`);
        seen.add(cur.id);
        cur = byId.get(cur.parentId);
      }
    }
    expect(true).toBe(true);
  });

  it("wbsCode'lar benzersiz ve dolu", () => {
    const codes = nodes.map((n) => n.wbsCode);
    expect(codes.every((c) => c.length > 0)).toBe(true);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("index.json ve meta.json sayımları diskle tutarlı", () => {
    const index = JSON.parse(fs.readFileSync(path.join(GEN, "index.json"), "utf8"));
    const meta = JSON.parse(fs.readFileSync(path.join(GEN, "meta.json"), "utf8"));
    expect(index.length).toBe(nodes.length);
    expect(meta.counts.total).toBe(nodes.length);
  });

  it("her düğümün 14 boyutu ve 7 fazı var", () => {
    for (const n of nodes) {
      expect(Object.keys(n.dimensions)).toHaveLength(14);
      expect(Object.keys(n.phases)).toHaveLength(7);
    }
  });
});

describe("yürütülebilirlik invariantları (Faz P3)", () => {
  const validTeams = new Set<string>(
    (
      JSON.parse(
        fs.readFileSync(path.resolve(process.cwd(), "src/data/people.json"), "utf8"),
      ) as Array<{ id: string }>
    ).map((p) => p.id),
  );

  it("her düğümde owner dolu (sorumluluk boşluğu yok)", () => {
    const missing = nodes.filter((n) => !n.owner).map((n) => n.id);
    expect(missing).toEqual([]);
  });

  it("her owner geçerli bir ekip (people.json)", () => {
    const invalid = nodes
      .filter((n) => n.owner && !validTeams.has(n.owner))
      .map((n) => `${n.id}->${n.owner}`);
    expect(invalid).toEqual([]);
  });

  it("dependsOn/blocks/related referans bütünlüğü (dangling yok)", () => {
    const dangling: string[] = [];
    for (const n of nodes) {
      for (const field of ["dependsOn", "blocks", "related"] as const) {
        for (const ref of n[field] ?? []) {
          if (!ids.has(ref)) dangling.push(`${n.id}.${field}->${ref}`);
        }
      }
    }
    expect(dangling).toEqual([]);
  });

  it("dependsOn grafiği çevrimsiz (DAG)", () => {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const color = new Map<string, number>();
    const cycle: string[] = [];
    const dfs = (id: string, stack: string[]): boolean => {
      color.set(id, 1);
      stack.push(id);
      for (const dep of byId.get(id)?.dependsOn ?? []) {
        if (!byId.has(dep)) continue;
        const c = color.get(dep) ?? 0;
        if (c === 1) {
          cycle.push([...stack.slice(stack.indexOf(dep)), dep].join(" -> "));
          return true;
        }
        if (c === 0 && dfs(dep, stack)) return true;
      }
      stack.pop();
      color.set(id, 2);
      return false;
    };
    for (const n of nodes) {
      if ((color.get(n.id) ?? 0) === 0 && dfs(n.id, [])) break;
    }
    expect(cycle).toEqual([]);
  });
});
