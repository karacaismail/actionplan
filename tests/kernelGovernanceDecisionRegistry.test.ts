import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const INVENTORY = "reports/kernel-gap-inventory-2026-07-14.json";
const ADDENDUM = "reports/kernel-governance-gap-addendum-2026-07-15.json";
const REGISTRY = "reports/kernel-governance-decision-registry-2026-07-15.json";
const PACK = "docs/kernel-governance-decision-pack-2026-07-15.md";
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const readJson = (relative: string) => JSON.parse(read(relative));

describe("kernel governance decision registry", () => {
  it("discovers KGA-D01..D10 once and keeps every decision fail-closed", () => {
    expect(fs.existsSync(path.join(ROOT, REGISTRY))).toBe(true);

    const inventory = readJson(INVENTORY);
    const addendum = readJson(ADDENDUM);
    const registry = readJson(REGISTRY);
    const sourceDecisions = [...inventory.decisions, ...addendum.decisions];
    const expectedIds = Array.from(
      { length: 10 },
      (_, index) => `KGA-D${String(index + 1).padStart(2, "0")}`,
    );
    const sourceIds = sourceDecisions.map((decision: { id: string }) => decision.id);
    const registryIds = registry.decisions.map((decision: { id: string }) => decision.id);

    expect(registry.sourceReports).toEqual([INVENTORY, ADDENDUM]);
    expect(sourceIds).toEqual(expectedIds);
    expect(new Set(sourceIds).size).toBe(sourceIds.length);
    expect(registryIds).toEqual(expectedIds);
    expect(new Set(registryIds).size).toBe(registryIds.length);
    expect(
      registry.decisions.map((decision: { id: string; topic: string; status: string }) => ({
        id: decision.id,
        topic: decision.topic,
        status: decision.status,
      })),
    ).toEqual(
      sourceDecisions.map((decision: { id: string; topic: string; status: string }) => ({
        id: decision.id,
        topic: decision.topic,
        status: decision.status,
      })),
    );
    expect(
      registry.decisions.every(
        (decision: {
          status: string;
          decisionOwner: string;
          coordinator: string;
          deliveryAuthority: string;
          selectedOption: unknown;
          codeStartAllowed: boolean;
        }) =>
          decision.status === "pending" &&
          decision.decisionOwner === "user-admin" &&
          decision.coordinator === "project_manager" &&
          decision.deliveryAuthority === "codex" &&
          decision.selectedOption === null &&
          decision.codeStartAllowed === false,
      ),
    ).toBe(true);
    expect(registry.finalDecision).toMatchObject({
      verdict: "NO-GO",
      kernelReady: false,
      sdkReady: false,
      appBuildable: false,
      codeStartAllowed: false,
      nextActionable: "PR-01",
    });
  });

  it("makes all ten decisions visible in the central pack and named governance gate", () => {
    const pack = read(PACK);
    const scripts = readJson("package.json").scripts;
    const gate = scripts["qa:kernel-governance"] as string;

    for (let index = 1; index <= 10; index += 1)
      expect(pack).toContain(`### KGA-D${String(index).padStart(2, "0")}`);
    for (const ref of [INVENTORY, ADDENDUM, REGISTRY]) expect(pack).toContain(ref);
    expect(gate).toContain("tests/kernelGapInventory.test.ts");
    expect(gate).toContain("tests/kernelGovernanceDecisionRegistry.test.ts");
  });
});
