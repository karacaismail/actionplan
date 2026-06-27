import { dayspan, diffBaseline, toGanttBars } from "@/engine/gantt";
import { type Schedule, type TaskNode, TaskNodeSchema } from "@/schemas";
import { describe, expect, it } from "vitest";

/**
 * Minimal TaskNode kurucu — zorunlu alanları doldurur, gerisi default.
 * `schedule` kısmi verilebilir (yalnız ilgilenilen alanlar); şema kalanını
 * null'a doldurur. Çıktı `TaskNodeSchema.parse` ile doğrulanır.
 */
const node = (
  p: Partial<Omit<TaskNode, "schedule">> & { id: string; schedule?: Partial<Schedule> },
): TaskNode => TaskNodeSchema.parse({ level: "atom", title: p.id, slug: p.id, ...p });

describe("toGanttBars", () => {
  it("tarihsiz (start veya end null) düğümleri dışlar", () => {
    const nodes = [
      node({ id: "full", schedule: { start: "2026-01-01", end: "2026-01-05" } }),
      node({ id: "no-end", schedule: { start: "2026-01-01" } }),
      node({ id: "no-start", schedule: { end: "2026-01-05" } }),
      node({ id: "empty" }),
    ];
    const bars = toGanttBars(nodes);
    expect(bars.map((b) => b.id)).toEqual(["full"]);
    expect(bars[0]).toMatchObject({
      id: "full",
      title: "full",
      start: "2026-01-01",
      end: "2026-01-05",
      criticalPath: false,
      milestone: null,
    });
  });

  it("milestone filtresi yalnız eşleşen düğümleri tutar", () => {
    const nodes = [
      node({ id: "a", milestone: "R1", schedule: { start: "2026-01-01", end: "2026-01-02" } }),
      node({ id: "b", milestone: "R2", schedule: { start: "2026-01-03", end: "2026-01-04" } }),
      node({ id: "c", milestone: "R1", schedule: { start: "2026-01-05", end: "2026-01-06" } }),
    ];
    expect(toGanttBars(nodes, { milestone: "R1" }).map((b) => b.id)).toEqual(["a", "c"]);
  });

  it("criticalPath bayrağını taşır", () => {
    const nodes = [
      node({ id: "cp", criticalPath: true, schedule: { start: "2026-02-01", end: "2026-02-10" } }),
    ];
    expect(toGanttBars(nodes)[0].criticalPath).toBe(true);
  });
});

describe("dayspan", () => {
  it("b - a gün farkını döndürür", () => {
    expect(dayspan("2026-01-01", "2026-01-11")).toBe(10);
  });

  it("ters yönde negatif döner", () => {
    expect(dayspan("2026-01-11", "2026-01-01")).toBe(-10);
  });

  it("aynı gün 0 döner", () => {
    expect(dayspan("2026-01-01", "2026-01-01")).toBe(0);
  });

  it("ay/yıl sınırını doğru aşar (DST'den bağımsız, UTC)", () => {
    expect(dayspan("2026-01-31", "2026-02-01")).toBe(1);
    expect(dayspan("2025-12-31", "2026-01-01")).toBe(1);
  });

  it("geçersiz tarihte 0 döner", () => {
    expect(dayspan("not-a-date", "2026-01-01")).toBe(0);
    expect(dayspan("2026-01-01", "")).toBe(0);
  });
});

describe("diffBaseline", () => {
  it("tüm alanlar doluysa slip'i hesaplar (baselineEnd=2026-01-10, end=2026-01-13 → +3)", () => {
    const n = node({
      id: "slip",
      schedule: {
        start: "2026-01-03",
        end: "2026-01-13",
        baselineStart: "2026-01-01",
        baselineEnd: "2026-01-10",
      },
    });
    expect(diffBaseline(n)).toEqual({
      plannedDays: 10,
      baselineDays: 9,
      slipDays: 3,
    });
  });

  it("erken bitişte negatif slip döner", () => {
    const n = node({
      id: "early",
      schedule: {
        start: "2026-03-01",
        end: "2026-03-08",
        baselineStart: "2026-03-01",
        baselineEnd: "2026-03-10",
      },
    });
    expect(diffBaseline(n)?.slipDays).toBe(-2);
  });

  it("baseline yoksa (baselineStart/baselineEnd null) null döner", () => {
    const n = node({ id: "no-baseline", schedule: { start: "2026-01-01", end: "2026-01-05" } });
    expect(diffBaseline(n)).toBeNull();
  });

  it("plan tarihi eksikse null döner", () => {
    const n = node({
      id: "no-plan",
      schedule: { baselineStart: "2026-01-01", baselineEnd: "2026-01-10" },
    });
    expect(diffBaseline(n)).toBeNull();
  });
});
