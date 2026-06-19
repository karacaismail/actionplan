import { groupNodes, sortNodes } from "@/engine";
import { type TaskNode, TaskNodeSchema } from "@/schemas";
import { describe, expect, it } from "vitest";

const node = (p: Partial<TaskNode> & { id: string }): TaskNode =>
  TaskNodeSchema.parse({ level: "atom", title: p.id, slug: p.id, ...p });

const nodes: TaskNode[] = [
  node({ id: "a", progress: 10, level: "app", status: "todo" }),
  node({ id: "b", progress: 90, level: "module", status: "done" }),
  node({ id: "c", progress: 50, level: "app", status: "todo" }),
];
const scoreOf = () => 0;

describe("tablo sort/group", () => {
  it("progress asc sıralar", () => {
    expect(sortNodes(nodes, "progress", "asc", scoreOf).map((n) => n.id)).toEqual(["a", "c", "b"]);
  });
  it("progress desc sıralar", () => {
    expect(sortNodes(nodes, "progress", "desc", scoreOf).map((n) => n.id)).toEqual(["b", "c", "a"]);
  });
  it("title'a göre stabil string sıralama", () => {
    expect(sortNodes(nodes, "title", "asc", scoreOf).map((n) => n.id)).toEqual(["a", "b", "c"]);
  });
  it("level'e göre gruplar", () => {
    const g = groupNodes(nodes, "level");
    expect(g.map((x) => x.key)).toEqual(["app", "module"]);
    expect(g.find((x) => x.key === "app")?.nodes).toHaveLength(2);
  });
});
