import { describe, expect, it } from "vitest";
import {
  buildTree,
  computeCriticalPath,
  exportCSV,
  exportJSON,
  getAncestors,
  importCSV,
  importJSON,
  indexById,
} from "@/engine";
import { type TaskNode, TaskNodeSchema } from "@/schemas";

function node(over: Record<string, unknown>): TaskNode {
  return TaskNodeSchema.parse({
    id: "x",
    level: "module",
    title: "X",
    slug: "x",
    ...over,
  });
}

describe("buildTree + rollup", () => {
  const data = [
    node({ id: "root", level: "app", title: "Kök", slug: "root", wbsCode: "1" }),
    node({ id: "a", parentId: "root", wbsCode: "1.1", progress: 100, status: "done", effort: { estimate: 2, unit: "sp", spent: 0 } }),
    node({ id: "b", parentId: "root", wbsCode: "1.2", progress: 0, status: "in-progress", effort: { estimate: 2, unit: "sp", spent: 0 } }),
  ];

  it("ağacı kurar ve çocukları bağlar", () => {
    const tree = buildTree(data);
    expect(tree).toHaveLength(1);
    expect(tree[0].children.map((c) => c.id)).toEqual(["a", "b"]);
  });

  it("ebeveyn ilerlemesini ağırlıklı türetir", () => {
    const tree = buildTree(data);
    // eşit ağırlık (2,2): (100+0)/2 = 50
    expect(tree[0].rollup.progress).toBe(50);
  });

  it("hepsi bitmediyse ebeveyn durumu done değildir", () => {
    const tree = buildTree(data);
    expect(tree[0].rollup.status).not.toBe("done");
  });
});

describe("export/import round-trip", () => {
  const nodes = [
    node({ id: "alpha", title: "Alpha", slug: "alpha", wbsCode: "1", tags: ["x", "y"], dependsOn: ["beta"] }),
    node({ id: "beta", title: "Beta, virgüllü", slug: "beta", wbsCode: "2", owner: "ismail", progress: 40 }),
  ];

  it("JSON tam-doğruluklu döner", () => {
    const result = importJSON(exportJSON(nodes));
    expect(result.errors).toEqual([]);
    expect(result.nodes).toEqual(nodes);
  });

  it("CSV düz alanları korur (virgül/escape dahil)", () => {
    const result = importCSV(exportCSV(nodes));
    expect(result.errors).toEqual([]);
    expect(result.nodes.map((n) => n.title)).toEqual(["Alpha", "Beta, virgüllü"]);
    expect(result.nodes[0].tags).toEqual(["x", "y"]);
    expect(result.nodes[0].dependsOn).toEqual(["beta"]);
    expect(result.nodes[1].progress).toBe(40);
  });

  it("bozuk JSON hatayı yakalar, çökmez", () => {
    const result = importJSON("{ bozuk");
    expect(result.nodes).toEqual([]);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("CSV tam-fidelity: _node ile 14 boyut/7 faz/risk round-trip korunur", () => {
    const full = node({
      id: "gamma",
      title: "Gamma",
      slug: "gamma",
      wbsCode: "3",
      dimensions: {
        featureDefs: { key: "featureDefs", title: "Özellik", status: "filled", items: ["a", "b"], notes: "n" },
      },
      deliverables: ["d1", "d2"],
      risks: [{ id: "r1", desc: "risk", severity: "high", mitigation: "m" }],
      acceptanceCriteria: ["k1"],
    });
    const result = importCSV(exportCSV([full]));
    expect(result.errors).toEqual([]);
    expect(result.nodes[0]).toEqual(full); // tam eşitlik (boyut/faz/risk dahil)
  });
});

describe("kritik yol", () => {
  it("en uzun bağımlılık zincirini bulur", () => {
    const nodes = [
      node({ id: "a", title: "A", slug: "a", effort: { estimate: 1, unit: "sp", spent: 0 } }),
      node({ id: "b", title: "B", slug: "b", dependsOn: ["a"], effort: { estimate: 1, unit: "sp", spent: 0 } }),
      node({ id: "c", title: "C", slug: "c", dependsOn: ["b"], effort: { estimate: 1, unit: "sp", spent: 0 } }),
      node({ id: "d", title: "D", slug: "d", effort: { estimate: 1, unit: "sp", spent: 0 } }),
    ];
    const cp = computeCriticalPath(nodes);
    expect(cp.path).toEqual(["a", "b", "c"]);
    expect(cp.ids.has("d")).toBe(false);
    expect(cp.length).toBe(3);
  });

  it("döngüde sonsuz döngüye girmez", () => {
    const nodes = [
      node({ id: "x", title: "X", slug: "x", dependsOn: ["y"] }),
      node({ id: "y", title: "Y", slug: "y", dependsOn: ["x"] }),
    ];
    expect(() => computeCriticalPath(nodes)).not.toThrow();
  });
});

describe("resolve", () => {
  it("breadcrumb zincirini kökten kurar", () => {
    const nodes = [
      node({ id: "app1", level: "app", title: "App", slug: "app1" }),
      node({ id: "mod1", parentId: "app1", title: "Mod", slug: "mod1" }),
      node({ id: "leaf", parentId: "mod1", title: "Leaf", slug: "leaf" }),
    ];
    const chain = getAncestors(indexById(nodes), "leaf");
    expect(chain.map((n) => n.id)).toEqual(["app1", "mod1", "leaf"]);
  });
});
