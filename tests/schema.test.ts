import { describe, expect, it } from "vitest";
import {
  DIMENSION_KEYS,
  TaskNodeSchema,
  WATERFALL_PHASES,
  WBS_LEVELS,
  filledDimensionCount,
  makeSkeletonDimensions,
  makeSkeletonPhases,
} from "@/schemas";

/**
 * Test-önce: şema sözleşmesi gövdeden önce kilitlenir.
 * Bu testler eylem planının veri sözleşmesinin invariantlarını korur.
 */

function minimalNode(overrides: Record<string, unknown> = {}) {
  return {
    id: "ornek-gorev",
    level: "module",
    title: "Örnek Görev",
    slug: "ornek-gorev",
    ...overrides,
  };
}

describe("TaskNode şema sabitleri", () => {
  it("7 WBS seviyesi (doğa metaforu) tanımlı", () => {
    expect(WBS_LEVELS).toHaveLength(7);
    expect(WBS_LEVELS).toEqual([
      "app",
      "module",
      "archetype",
      "stone",
      "molecule",
      "element",
      "atom",
    ]);
  });

  it("7 waterfall fazı (test-önce sıra) tanımlı", () => {
    expect(WATERFALL_PHASES).toHaveLength(7);
    expect(WATERFALL_PHASES[1]).toBe("test-plan"); // test, geliştirmeden önce
    expect(WATERFALL_PHASES.indexOf("test-plan")).toBeLessThan(
      WATERFALL_PHASES.indexOf("development"),
    );
  });

  it("14 üretim boyutu tanımlı", () => {
    expect(DIMENSION_KEYS).toHaveLength(14);
  });
});

describe("TaskNode parse", () => {
  it("minimal düğümü varsayılanlarla doldurur", () => {
    const parsed = TaskNodeSchema.parse(minimalNode());
    expect(parsed.status).toBe("backlog");
    expect(parsed.priority).toBe("medium");
    expect(parsed.parentId).toBeNull();
    expect(parsed.progress).toBe(0);
    expect(parsed.phase).toBe("requirements");
  });

  it("büyük-harfli id'yi reddeder (kebab-case zorunlu)", () => {
    expect(() => TaskNodeSchema.parse(minimalNode({ id: "Ornek_Gorev" }))).toThrow();
  });

  it("bilinmeyen alanı reddeder (strict sözleşme)", () => {
    expect(() => TaskNodeSchema.parse(minimalNode({ surprise: 1 }))).toThrow();
  });

  it("progress 0-100 aralığı dışını reddeder", () => {
    expect(() => TaskNodeSchema.parse(minimalNode({ progress: 140 }))).toThrow();
  });
});

describe("iskelet üreticiler", () => {
  it("14 boyut iskeleti üretir, hepsi skeleton", () => {
    const dims = makeSkeletonDimensions();
    expect(Object.keys(dims)).toHaveLength(14);
    expect(Object.values(dims).every((d) => d.status === "skeleton")).toBe(true);
  });

  it("7 faz iskeleti üretir, hepsi pending", () => {
    const phases = makeSkeletonPhases();
    expect(Object.keys(phases)).toHaveLength(7);
    expect(Object.values(phases).every((p) => p.status === "pending")).toBe(true);
  });

  it("filledDimensionCount iskelet düğümde 0 döner", () => {
    const node = TaskNodeSchema.parse(
      minimalNode({ dimensions: makeSkeletonDimensions() }),
    );
    expect(filledDimensionCount(node)).toBe(0);
  });
});
