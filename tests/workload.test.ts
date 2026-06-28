import { type Load, allocationStatus, workloadByAssignee } from "@/engine/workload";
import { type Person, type TaskNode, TaskNodeSchema } from "@/schemas";
import { describe, expect, it } from "vitest";

/** Düğüm fabrikası — şema varsayılanlarını uygular, testte yalnız ilgili alanlar verilir. */
const node = (p: Partial<TaskNode> & { id: string }): TaskNode =>
  TaskNodeSchema.parse({ level: "atom", title: p.id, slug: p.id, ...p });

/** Adam-gün eforlu kısayol. */
const dNode = (id: string, estimate: number, extra: Partial<TaskNode> = {}): TaskNode =>
  node({ id, effort: { estimate, unit: "d", spent: 0 }, ...extra });

const person = (id: string, capacityPerDay: number): Person => ({
  id,
  name: id,
  role: "",
  capacityPerDay,
  active: true,
});

/** assignee → Load eşlemesi (kolay erişim için). */
const byId = (loads: Load[]): Record<string, Load> =>
  Object.fromEntries(loads.map((l) => [l.assignee, l]));

describe("allocationStatus eşikleri", () => {
  it("capacity<=0 → unknown", () => {
    expect(allocationStatus(3, 0)).toBe("unknown");
    expect(allocationStatus(0, -2)).toBe("unknown");
  });
  it("oran >1.0 → over", () => {
    expect(allocationStatus(6, 5)).toBe("over");
  });
  it("oran <0.5 → under", () => {
    expect(allocationStatus(2, 5)).toBe("under");
  });
  it("0.5 ≤ oran ≤ 1.0 → ok (sınırlar dahil)", () => {
    expect(allocationStatus(2.5, 5)).toBe("ok"); // tam 0.5
    expect(allocationStatus(5, 5)).toBe("ok"); // tam 1.0
    expect(allocationStatus(3, 5)).toBe("ok");
  });
});

describe("workloadByAssignee", () => {
  it("çoklu-assignee eforu eşit böler (estimate 6, 2 assignee → her birine 3)", () => {
    const nodes = [dNode("t1", 6, { assignees: ["ali", "veli"] })];
    const people = [person("ali", 5), person("veli", 5)];
    const map = byId(workloadByAssignee(nodes, people));
    expect(map.ali.days).toBe(3);
    expect(map.veli.days).toBe(3);
    expect(map.ali.ratio).toBeCloseTo(0.6);
    expect(map.ali.status).toBe("ok");
  });

  it("assignees boşsa owner'a düşer (fallback)", () => {
    const nodes = [dNode("t1", 4, { owner: "ada", assignees: [] })];
    const people = [person("ada", 5)];
    const map = byId(workloadByAssignee(nodes, people));
    expect(map.ada.days).toBe(4);
    expect(map.ada.status).toBe("ok");
  });

  it("assignees doluysa owner yok sayılır", () => {
    const nodes = [dNode("t1", 4, { owner: "ada", assignees: ["bora"] })];
    const people = [person("ada", 5), person("bora", 5)];
    const map = byId(workloadByAssignee(nodes, people));
    expect(map.bora.days).toBe(4);
    expect(map.ada.days).toBe(0); // owner yük almaz
  });

  it("unit !== 'd' düğümler sayılmaz (sp/h atlanır)", () => {
    const nodes = [
      node({ id: "sp1", owner: "ali", effort: { estimate: 8, unit: "sp", spent: 0 } }),
      node({ id: "h1", owner: "ali", effort: { estimate: 8, unit: "h", spent: 0 } }),
      dNode("d1", 2, { owner: "ali" }),
    ];
    const people = [person("ali", 5)];
    const map = byId(workloadByAssignee(nodes, people));
    expect(map.ali.days).toBe(2); // yalnız d1
  });

  it("owner/assignee yoksa düğüm tümüyle atlanır", () => {
    const nodes = [dNode("t1", 9)]; // owner=null, assignees=[]
    expect(workloadByAssignee(nodes, [])).toEqual([]);
  });

  it("over / under / unknown durumları", () => {
    const nodes = [
      dNode("o1", 6, { owner: "over" }), // 6 > cap 5 → over
      dNode("u1", 1, { owner: "under" }), // 1 / 5 = 0.2 → under
      dNode("x1", 3, { owner: "ghost" }), // people'da yok → cap 0 → unknown
    ];
    const people = [person("over", 5), person("under", 5)];
    const map = byId(workloadByAssignee(nodes, people));
    expect(map.over.status).toBe("over");
    expect(map.under.status).toBe("under");
    expect(map.ghost.capacity).toBe(0);
    expect(map.ghost.ratio).toBe(0);
    expect(map.ghost.status).toBe("unknown");
  });

  it("people'da olup yük almayan kişi 0 günle görünür ve sonuç assignee'ye göre sıralı", () => {
    const nodes = [dNode("t1", 4, { owner: "bora" })];
    const people = [person("ali", 5), person("bora", 5)];
    const loads = workloadByAssignee(nodes, people);
    expect(loads.map((l) => l.assignee)).toEqual(["ali", "bora"]); // deterministik (tr) sıralama
    expect(byId(loads).ali.days).toBe(0);
    // ali: capacity 5 > 0, days 0 → ratio 0 < 0.5 → under (capacity bilindiği için "unknown" değil).
    expect(byId(loads).ali.status).toBe("under");
  });

  it("birden çok düğümün payları aynı kişide toplanır", () => {
    const nodes = [
      dNode("t1", 6, { assignees: ["ali", "veli"] }), // ali +3
      dNode("t2", 2, { owner: "ali" }), // ali +2
    ];
    const people = [person("ali", 10), person("veli", 10)];
    const map = byId(workloadByAssignee(nodes, people));
    expect(map.ali.days).toBe(5);
    expect(map.veli.days).toBe(3);
  });
});
