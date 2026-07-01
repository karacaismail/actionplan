import { STANDARDS, coverageByStandard, dimensionsByFamily, nodeStandards } from "@/engine";
import { DIMENSION_KEYS, TaskNodeSchema } from "@/schemas";
import { describe, expect, it } from "vitest";

const node = (refs: Record<string, string>) =>
  TaskNodeSchema.parse({ id: "x", level: "atom", title: "x", slug: "x", standardRefs: refs });

describe("standards motoru (ADR-0027)", () => {
  it("15 standart yüklenir ve şemaya uyar", () => {
    expect(STANDARDS.length).toBe(15);
    expect(STANDARDS.every((s) => s.rules.length >= 3)).toBe(true);
  });

  it("dimensionsByFamily 14 boyutun tümünü kapsar", () => {
    const all = dimensionsByFamily().flatMap((g) => g.keys);
    expect(new Set(all).size).toBe(DIMENSION_KEYS.length);
  });

  it("coverageByStandard referans veren düğümü sayar", () => {
    const cov = coverageByStandard([node({ codingStandardRef: "coding-standards" })]);
    expect(cov.find((c) => c.id === "coding-standards")?.refCount).toBe(1);
    expect(cov.find((c) => c.id === "architecture")?.refCount).toBe(0);
  });

  it("nodeStandards çözülmüş referansları (techProfileRef dahil) döner", () => {
    const ns = nodeStandards(
      node({ designSystemRef: "design-system", techProfileRef: "saas-app" }),
    );
    expect(ns.find((r) => r.key === "designSystemRef")?.id).toBe("design-system");
    expect(ns.some((r) => r.key === "techProfileRef")).toBe(true);
  });
});
