import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const REPORT = "reports/kernel-adr-collision-source-bindings-2026-07-15.json";
const ADDENDUM = "reports/kernel-governance-gap-addendum-2026-07-15.json";
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");
const json = (p: string) => JSON.parse(read(p));
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const exists = (p: string) => fs.existsSync(path.join(ROOT, p));

const CLASS = "src/data/doc-task-content-classification.json";
const BLOCKERS = "src/data/doc-task-content-rules/human-decision-blockers.json";
const GLOBAL = "src/data/doc-task-content-rules/global.json";
const GATES = "src/data/generated/nodes/std-ci-gates.json";
const CHECK = "tools/agents/check-execution-contract.mjs";
const DEPLOY = ".github/workflows/deploy.yml";
type Ref = { path: string; marker: string };
type Collision = {
  id: string; status: "ambiguous"; canonicalTopic: null; topics: string[];
  sourceBindings: Ref[]; machineConsumerRefs: Ref[];
};
const ref = (p: string, marker: string): Ref => ({ path: p, marker });
const col = (id: string, topics: string[], src: Ref[], mach: Ref[]): Collision => ({
  id, status: "ambiguous", canonicalTopic: null, topics, sourceBindings: src, machineConsumerRefs: mach,
});
const COLLISIONS: Collision[] = [
  col("ADR-E1", ["event-replay-projection", "evidence-seal"],
    [ref("docs/event-replay-projection-contract.md", "ADR-E1"), ref("docs/k-evidence-seal-directive.md", "ADR-E1")],
    [ref(CLASS, "ADR-E1"), ref(BLOCKERS, "ADR-E1")]),
  col("ADR-M1", ["migration-bridge", "module-security-sandbox"],
    [ref("docs/k-migration-bridge-directive.md", "ADR-M1"), ref("docs/marketplace-module-security-directive.md", "ADR-M1")],
    [ref(CLASS, "ADR-M1"), ref(BLOCKERS, "ADR-M1")]),
  col("ADR-S1", ["object-storage-dam", "surface-family"],
    [ref("docs/k-storage-dam-directive.md", "ADR-S1"), ref("docs/surface-spec.md", "ADR-S1")], []),
  col("ADR-X1", ["execution-contract-matrix", "execution-context-envelope"],
    [ref("docs/kernel-execution-contract-matrix.md", "ADR-X1"), ref("docs/execution-context-envelope-directive.md", "ADR-X1")],
    [ref(CLASS, "ADR-X1"), ref(GLOBAL, "ADR-X1"), ref(GATES, "ADR-X1")]),
  col("ADR-A5/ADR-0022", ["archetype-storage", "variant-fieldtype-extension", "duplicate-storage-identity"],
    [ref("docs/archetype-storage-canonical-directive.md", "ADR-A5"), ref("docs/archetype-variant-attribute-family-directive.md", "ADR-A5"), ref("src/data/generated/nodes/adr-0022.json", "adr-0022")],
    [ref(CHECK, "ADR-A5"), ref(DEPLOY, "ADR-A5")]),
];

function validate(report: any, has: (p: string) => boolean): string[] {
  const errors: string[] = [];
  const expected: Record<string, unknown> = {
    decisionId: "KGA-D08", status: "pending", decisionOwner: "user-admin",
    coordinator: "project-manager", finalAuthority: "codex", collisionsStatus: "ambiguous",
    approvalRefAllowed: false, renumber: false, alias: false, supersession: false,
    runtimeExecutor: "human-developer-only", codeStartAllowed: false, kernelReady: false,
    sdkReady: false, appBuildable: false, verdict: "NO-GO",
  };
  const actual: Record<string, unknown> = {
    decisionId: report.decisionId, ...report.decision,
    collisionsStatus: report.collisionsStatus, approvalRefAllowed: report.approvalRefAllowed,
    ...report.identityMutationAllowed, ...report.authorityBoundary,
  };
  for (const [key, value] of Object.entries(expected))
    if (JSON.stringify(actual[key]) !== JSON.stringify(value)) errors.push(`${key} drift`);
  if (JSON.stringify(report.collisions) !== JSON.stringify(COLLISIONS)) errors.push("collision table drift");
  if (JSON.stringify(report).includes('"approvalRef"')) errors.push("forbidden approvalRef");
  for (const collision of report.collisions ?? []) {
    if (collision.status !== "ambiguous") errors.push(`${collision.id} status`);
    if (collision.canonicalTopic !== null) errors.push(`${collision.id} canonicalTopic`);
    for (const source of [...(collision.sourceBindings ?? []), ...(collision.machineConsumerRefs ?? [])]) {
      if (!has(source.path)) errors.push(`missing ${source.path}`);
      else if (!read(source.path).toLowerCase().includes(String(source.marker).toLowerCase()))
        errors.push(`marker ${source.marker} absent in ${source.path}`);
    }
  }
  return errors;
}

describe("kernel ADR collision source bindings (KGA-D08)", () => {
  it("binds five collisions without selecting a canonical identity", () => {
    const addendum = json(ADDENDUM);
    const adr = addendum.structuralFindings.adrCollisions;
    expect(adr.map((c: { id: string }) => c.id)).toEqual(COLLISIONS.map((c) => c.id));
    expect(addendum.decisions.find((d: { id: string }) => d.id === "KGA-D08").status).toBe("pending");
    for (const collision of COLLISIONS) {
      const current = adr.find((item: { id: string }) => item.id === collision.id);
      expect(current).toMatchObject({ status: "ambiguous", topics: collision.topics });
      for (const source of [...collision.sourceBindings, ...collision.machineConsumerRefs]) {
        expect(exists(source.path)).toBe(true);
        expect(read(source.path).toLowerCase()).toContain(source.marker.toLowerCase());
      }
    }
    expect(fs.existsSync(path.join(ROOT, REPORT))).toBe(true);
    const report = json(REPORT);
    expect(validate(report, exists)).toEqual([]);
    const cases: { mutate?: (r: any) => void; miss?: string; error: string }[] = [
      { mutate: (r) => (r.collisions[0].canonicalTopic = "evidence-seal"), error: "collision table drift" },
      { mutate: (r) => (r.collisions[0].status = "accepted"), error: "collision table drift" },
      { mutate: (r) => (r.approvalRefAllowed = true), error: "approvalRefAllowed drift" },
      { mutate: (r) => (r.identityMutationAllowed.renumber = true), error: "renumber drift" },
      { mutate: (r) => (r.collisions[1].sourceBindings[0].path = "docs/nope.md"), error: "collision table drift" },
      { mutate: (r) => (r.collisions[3].sourceBindings[0].marker = "ADR-ZZ"), error: "marker ADR-ZZ absent in docs/kernel-execution-contract-matrix.md" },
      { mutate: (r) => r.collisions[0].machineConsumerRefs.pop(), error: "collision table drift" },
      { mutate: (r) => (r.decisionId = "KGA-D07"), error: "decisionId drift" },
      { miss: "docs/surface-spec.md", error: "missing docs/surface-spec.md" },
    ];
    for (const testCase of cases) {
      const candidate = clone(report);
      testCase.mutate?.(candidate);
      const has = testCase.miss ? (p: string) => p !== testCase.miss && exists(p) : exists;
      expect(validate(candidate, has)).toContain(testCase.error);
    }
  });
});
