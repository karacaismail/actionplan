import {
  DIMENSION_FAMILY,
  DIMENSION_KEYS,
  DIMENSION_META,
  LEGACY_DIMENSION_KEYS,
  TaskNodeSchema,
  WATERFALL_PHASES,
  WBS_LEVELS,
  filledDimensionCount,
  makeSkeletonDimensions,
  makeSkeletonPhases,
} from "@/schemas";
import { describe, expect, it } from "vitest";

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
      "feature",
      "component",
      "work_unit",
      "micro_step",
    ]);
  });

  it("7 waterfall fazı (test-önce sıra) tanımlı", () => {
    expect(WATERFALL_PHASES).toHaveLength(7);
    expect(WATERFALL_PHASES[1]).toBe("test-plan"); // test, geliştirmeden önce
    expect(WATERFALL_PHASES.indexOf("test-plan")).toBeLessThan(
      WATERFALL_PHASES.indexOf("development"),
    );
  });

  it("17 üretim boyutu tanımlı (14 miras + 3 day-2 operasyon)", () => {
    expect(DIMENSION_KEYS).toHaveLength(17);
    // Miras 14'ün sırası korunur (UI sıralaması bozulmaz), yeni üçlü sona eklenir.
    expect(DIMENSION_KEYS.slice(0, 14)).toEqual(LEGACY_DIMENSION_KEYS);
    expect(DIMENSION_KEYS.slice(14)).toEqual(["dataLifecycle", "observability", "reliability"]);
  });

  it("her boyutun TR başlığı, ikonu ve aile eşlemesi eksiksiz", () => {
    for (const key of DIMENSION_KEYS) {
      expect(DIMENSION_META[key].tr.trim().length).toBeGreaterThan(0);
      expect(DIMENSION_META[key].icon.startsWith("ph-")).toBe(true);
      expect(DIMENSION_FAMILY[key]).toBeTruthy();
    }
    expect(DIMENSION_FAMILY.dataLifecycle).toBe("operations");
    expect(DIMENSION_FAMILY.observability).toBe("operations");
    expect(DIMENSION_FAMILY.reliability).toBe("runtime-quality");
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
  it("17 boyut iskeleti üretir, hepsi skeleton", () => {
    const dims = makeSkeletonDimensions();
    expect(Object.keys(dims)).toHaveLength(17);
    expect(Object.values(dims).every((d) => d.status === "skeleton")).toBe(true);
  });

  it("7 faz iskeleti üretir, hepsi pending", () => {
    const phases = makeSkeletonPhases();
    expect(Object.keys(phases)).toHaveLength(7);
    expect(Object.values(phases).every((p) => p.status === "pending")).toBe(true);
  });

  it("filledDimensionCount iskelet düğümde 0 döner", () => {
    const node = TaskNodeSchema.parse(minimalNode({ dimensions: makeSkeletonDimensions() }));
    expect(filledDimensionCount(node)).toBe(0);
  });
});

describe("TaskNode izlenebilirlik (Faz P5)", () => {
  it("traceability'siz düğüm geriye uyumlu parse olur (alan opsiyonel)", () => {
    const parsed = TaskNodeSchema.parse(minimalNode());
    expect(parsed.traceability).toBeUndefined();
  });

  it("traceability verilince eksik alanları varsayılanla doldurur", () => {
    const parsed = TaskNodeSchema.parse(
      minimalNode({ traceability: { repoPath: ["github.com/karacaismail/actionplan"] } }),
    );
    expect(parsed.traceability?.implementationStatus).toBe("not-started");
    expect(parsed.traceability?.repoPath).toEqual(["github.com/karacaismail/actionplan"]);
    expect(parsed.traceability?.testCommand).toEqual([]);
    expect(parsed.traceability?.deployTarget).toBeNull();
  });

  it("geçersiz implementationStatus reddedilir", () => {
    expect(() =>
      TaskNodeSchema.parse(minimalNode({ traceability: { implementationStatus: "done" } })),
    ).toThrow();
  });

  it("implementationStatus 'verified' kabul edilir", () => {
    const parsed = TaskNodeSchema.parse(
      minimalNode({ traceability: { implementationStatus: "verified" } }),
    );
    expect(parsed.traceability?.implementationStatus).toBe("verified");
  });
});
