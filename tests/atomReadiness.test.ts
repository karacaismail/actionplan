import { describe, expect, it } from "vitest";
// @ts-expect-error Node gate is an ESM .mjs module without a declaration file.
import { auditAtomReadiness } from "../tools/agents/check-atom-readiness.mjs";

const legacy = { id: "legacy", level: "micro_step", status: "backlog", phase: "requirements" };
const complete = {
  id: "complete",
  level: "micro_step",
  status: "todo",
  phase: "test-plan",
  atomDefinition: {
    kind: "task-micro-step",
    allowedFiles: ["x.ts"],
    nonGoals: ["y"],
    evidenceRollup: "parent-node",
    reviewer: "reviewer",
    testVectors: [{ kind: "positive" }, { kind: "negative" }],
  },
};

describe("atom readiness durumları", () => {
  it("aday yoksa PASS yerine NO_CANDIDATES döner", () => {
    const result = auditAtomReadiness([legacy], {
      legacy: { kind: "task-demonstration" },
    });
    expect(result.state).toBe("NO_CANDIDATES");
    expect(result.definitionState).toBe("PASS");
  });

  it("aktif atom eksik tanımla FAIL olur", () => {
    const result = auditAtomReadiness([{ ...legacy, status: "todo" }]);
    expect(result.state).toBe("FAIL");
    expect(result.violations).toContain("legacy: atomDefinition eksik");
  });

  it("backlog atomunda registry tanımı da eksikse FAIL olur", () => {
    const result = auditAtomReadiness([legacy]);
    expect(result.state).toBe("FAIL");
    expect(result.definitionState).toBe("FAIL");
  });

  it("tam aktif atom PASS olur", () => {
    expect(auditAtomReadiness([complete]).state).toBe("PASS");
  });
});
