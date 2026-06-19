import { filterNodes, isQueryError, parseQuery } from "@/engine/query";
import { type TaskNode, TaskNodeSchema } from "@/schemas";
import { describe, expect, it } from "vitest";

const node = (p: Partial<TaskNode> & { id: string }): TaskNode =>
  TaskNodeSchema.parse({ level: "atom", title: p.id, slug: p.id, ...p });

const nodes: TaskNode[] = [
  node({
    id: "a",
    status: "done",
    level: "app",
    priority: "high",
    owner: "crm-ekibi",
    assignees: ["crm-ekibi"],
    milestone: "R1",
    tags: ["crm", "ai"],
    progress: 100,
    effort: { estimate: 5, unit: "d", spent: 0 },
    source: { corpus: "synthetic", cluster: "core-operations", originalId: "", granularity: "" },
  }),
  node({
    id: "b",
    status: "todo",
    level: "module",
    priority: "low",
    tags: ["hr"],
    progress: 0,
    source: { corpus: "synthetic", cluster: "hr", originalId: "", granularity: "" },
  }),
];

const ok = (q: string) => {
  const ast = parseQuery(q);
  if (isQueryError(ast)) throw new Error(`parse hatası: ${ast.error}`);
  return ast;
};

describe("filtre DSL parser + matchNode", () => {
  it("boş sorgu tümünü geçirir", () => {
    expect(filterNodes(nodes, ok("")).length).toBe(2);
  });
  it("eq (string)", () => {
    expect(filterNodes(nodes, ok("status = done")).map((n) => n.id)).toEqual(["a"]);
  });
  it("OR birleşimi", () => {
    expect(filterNodes(nodes, ok("status = done OR level = module")).map((n) => n.id).sort()).toEqual(["a", "b"]);
  });
  it("NOT", () => {
    expect(filterNodes(nodes, ok("NOT status = done")).map((n) => n.id)).toEqual(["b"]);
  });
  it("AND + parantez önceliği", () => {
    expect(filterNodes(nodes, ok("(status = done OR status = todo) AND level = app")).map((n) => n.id)).toEqual(["a"]);
  });
  it("in [liste]", () => {
    expect(filterNodes(nodes, ok("level in [app, module]")).length).toBe(2);
  });
  it("array contains (tag)", () => {
    expect(filterNodes(nodes, ok("tag contains crm")).map((n) => n.id)).toEqual(["a"]);
  });
  it("sayısal karşılaştırma (progress)", () => {
    expect(filterNodes(nodes, ok("progress >= 50")).map((n) => n.id)).toEqual(["a"]);
  });
  it("exists (milestone)", () => {
    expect(filterNodes(nodes, ok("milestone exists")).map((n) => n.id)).toEqual(["a"]);
  });
  it("cluster eq", () => {
    expect(filterNodes(nodes, ok("cluster = hr")).map((n) => n.id)).toEqual(["b"]);
  });
  it("bilinmeyen alan → hata", () => {
    expect(isQueryError(parseQuery("foo = bar"))).toBe(true);
  });
  it("eksik operatör → hata", () => {
    expect(isQueryError(parseQuery("status"))).toBe(true);
  });
  it("fazladan girdi → hata", () => {
    expect(isQueryError(parseQuery("status = done level = app"))).toBe(true);
  });
});
