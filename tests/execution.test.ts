import { rollupExecution } from "@/engine";
import { type TaskNode, TaskNodeSchema } from "@/schemas";
import { describe, expect, it } from "vitest";

/**
 * Yürütme katmanı (dev-ekip): milestone + takvim (schedule) şema alanları ve
 * adam-gün efor rollup + milestone/atama gruplaması. Test-önce.
 */
const base = (p: Partial<TaskNode> & { id: string; level: TaskNode["level"]; title: string; slug: string }): TaskNode =>
  TaskNodeSchema.parse(p);

describe("yürütme şeması (milestone + takvim)", () => {
  it("milestone ve schedule alanları varsayılanla gelir (geriye uyumlu)", () => {
    const n = base({ id: "x", level: "atom", title: "X", slug: "x" });
    expect(n.milestone).toBeNull();
    expect(n.schedule).toEqual({
      start: null,
      end: null,
      actualStart: null,
      actualEnd: null,
      baselineStart: null,
      baselineEnd: null,
    });
  });

  it("schedule ve milestone değerleri parse edilir", () => {
    const n = base({
      id: "y",
      level: "atom",
      title: "Y",
      slug: "y",
      milestone: "R1",
      schedule: { start: "2026-01-01", end: "2026-01-10", actualStart: null, actualEnd: null, baselineStart: null, baselineEnd: null },
    });
    expect(n.milestone).toBe("R1");
    expect(n.schedule.start).toBe("2026-01-01");
  });
});

describe("rollupExecution (adam-gün + milestone + atama)", () => {
  const nodes: TaskNode[] = [
    base({ id: "root", level: "module", title: "Root", slug: "root", parentId: null }),
    base({
      id: "a",
      level: "atom",
      title: "A",
      slug: "a",
      parentId: "root",
      owner: "alice",
      milestone: "M1",
      status: "in-progress",
      effort: { estimate: 5, unit: "d", spent: 2 },
      schedule: { start: "2026-01-01", end: "2026-01-10", actualStart: null, actualEnd: null, baselineStart: null, baselineEnd: null },
    }),
    base({
      id: "b",
      level: "atom",
      title: "B",
      slug: "b",
      parentId: "root",
      owner: "bob",
      milestone: "M2",
      status: "done",
      effort: { estimate: 3, unit: "d", spent: 1 },
      schedule: { start: "2026-01-05", end: "2026-01-20", actualStart: null, actualEnd: null, baselineStart: null, baselineEnd: null },
    }),
  ];

  it("alt ağaçta adam-gün efor ve harcanan toplanır", () => {
    const r = rollupExecution(nodes, "root");
    expect(r.effortDays).toBe(8);
    expect(r.spentDays).toBe(3);
  });

  it("milestone ve atama kümeleri toplanır", () => {
    const r = rollupExecution(nodes, "root");
    expect(r.milestones.sort()).toEqual(["M1", "M2"]);
    expect(r.assignees.sort()).toEqual(["alice", "bob"]);
  });

  it("takvim aralığı en erken başlangıç / en geç bitiş", () => {
    const r = rollupExecution(nodes, "root");
    expect(r.start).toBe("2026-01-01");
    expect(r.end).toBe("2026-01-20");
  });

  it("durum sayıları alt ağaçtan türetilir", () => {
    const r = rollupExecution(nodes, "root");
    expect(r.statusCounts["in-progress"]).toBe(1);
    expect(r.statusCounts.done).toBe(1);
    expect(r.count).toBe(2);
  });
});
