import {
  type Burnup,
  type MilestoneProgress,
  type PhaseGate,
  effortBurnup,
  milestoneProgress,
  phaseGateProgress,
  statusCumulative,
} from "@/engine/reports";
import { type TaskNode, TaskNodeSchema } from "@/schemas";
import { describe, expect, it } from "vitest";

/**
 * Reports motoru (Faz 5) — SAF agregat fonksiyonları. Düğümler
 * TaskNodeSchema.parse ile kurulur (defaults dolar). Test-önce.
 */
const node = (p: Partial<TaskNode> & { id: string }): TaskNode =>
  TaskNodeSchema.parse({ level: "micro_step", title: p.id, slug: p.id, ...p });

const nodes: TaskNode[] = [
  node({
    id: "a",
    milestone: "R1",
    status: "done",
    progress: 100,
    effort: { estimate: 5, unit: "d", spent: 2 },
    phases: { requirements: { status: "passed", passed: true, criteria: [], notes: "" } },
  }),
  node({
    id: "b",
    milestone: "R1",
    status: "in-progress",
    progress: 40,
    effort: { estimate: 3, unit: "d", spent: 1 },
    phases: {
      requirements: { status: "active", passed: false, criteria: [], notes: "" },
      "test-plan": { status: "passed", passed: true, criteria: [], notes: "" },
    },
  }),
  node({
    id: "c",
    milestone: "R2",
    status: "todo",
    progress: 0,
    effort: { estimate: 8, unit: "h", spent: 4 },
  }),
  node({
    // milestone yok → "—" grubuna düşer
    id: "d",
    status: "backlog",
    progress: 20,
    effort: { estimate: 13, unit: "sp", spent: 0 },
  }),
];

describe("milestoneProgress (gruplama + ortalama)", () => {
  it("milestone'a göre gruplar; total/done ve ortalama progress hesaplar", () => {
    const res = milestoneProgress(nodes);
    const r1 = res.find((m) => m.milestone === "R1");
    expect(r1).toBeDefined();
    expect(r1?.total).toBe(2);
    expect(r1?.done).toBe(1);
    // (100 + 40) / 2 = 70
    expect(r1?.progress).toBe(70);
  });

  it("null milestone '—' grubuna düşer ve sonuç milestone adına göre sıralıdır", () => {
    const res: MilestoneProgress[] = milestoneProgress(nodes);
    // localeCompare ile milestone adına göre deterministik sıralama ("—" harflerden önce gelir).
    expect(res.map((m) => m.milestone)).toEqual(["—", "R1", "R2"]);
    const dash = res.find((m) => m.milestone === "—");
    expect(dash?.total).toBe(1);
    expect(dash?.progress).toBe(20);
  });

  it("ortalama progress yuvarlanır", () => {
    // 100 + 0 = 100; /3 = 33.33 → 33
    const odd = [
      node({ id: "x", milestone: "M", progress: 100 }),
      node({ id: "y", milestone: "M", progress: 0 }),
      node({ id: "z", milestone: "M", progress: 0 }),
    ];
    expect(milestoneProgress(odd)[0].progress).toBe(33);
  });
});

describe("effortBurnup (yalnız adam-gün)", () => {
  it("yalnız unit==='d' düğümlerin estimate ve spent toplamını alır", () => {
    const res: Burnup = effortBurnup(nodes);
    // a(5) + b(3) = 8 plan; a(2) + b(1) = 3 spent. c('h') ve d('sp') sayılmaz.
    expect(res.plannedDays).toBe(8);
    expect(res.spentDays).toBe(3);
  });

  it("adam-gün düğüm yoksa sıfır döner", () => {
    const noDays = [node({ id: "p", effort: { estimate: 5, unit: "h", spent: 1 } })];
    expect(effortBurnup(noDays)).toEqual({ plannedDays: 0, spentDays: 0 });
  });
});

describe("statusCumulative (STATUS_LIST sayımı)", () => {
  it("her durumu STATUS_LIST sırasında sayar", () => {
    const res = statusCumulative(nodes);
    expect(res.map((s) => s.status)).toEqual([
      "backlog",
      "todo",
      "in-progress",
      "blocked",
      "review",
      "done",
    ]);
    const map = Object.fromEntries(res.map((s) => [s.status, s.count]));
    expect(map.done).toBe(1);
    expect(map["in-progress"]).toBe(1);
    expect(map.todo).toBe(1);
    expect(map.backlog).toBe(1);
    expect(map.blocked).toBe(0);
    expect(map.review).toBe(0);
  });
});

describe("phaseGateProgress (passed/total)", () => {
  it("her faz için tanımlı düğüm (total) ve geçen (passed) sayısını döner", () => {
    const res: PhaseGate[] = phaseGateProgress(nodes);
    // 7 waterfall fazının hepsi listelenir
    expect(res.length).toBe(7);

    const requirements = res.find((p) => p.phase === "requirements");
    // a ve b'de requirements tanımlı → total 2; yalnız a passed=true → passed 1
    expect(requirements?.total).toBe(2);
    expect(requirements?.passed).toBe(1);

    const testPlan = res.find((p) => p.phase === "test-plan");
    // yalnız b'de test-plan tanımlı (passed=true) → total 1, passed 1
    expect(testPlan?.total).toBe(1);
    expect(testPlan?.passed).toBe(1);

    const dbSchema = res.find((p) => p.phase === "db-schema");
    // hiçbir düğümde tanımlı değil → total 0, passed 0
    expect(dbSchema?.total).toBe(0);
    expect(dbSchema?.passed).toBe(0);
  });
});
