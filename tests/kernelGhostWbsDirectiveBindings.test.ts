import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const REPORT = "reports/kernel-ghost-wbs-directive-bindings-2026-07-15.json";
const ADDENDUM = "reports/kernel-governance-gap-addendum-2026-07-15.json";
const INVENTORY = "reports/kernel-gap-inventory-2026-07-14.json";
const NODES = "src/data/generated/nodes";
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");
const json = (p: string) => JSON.parse(read(p));
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const sort = (v: string[]) => [...v].sort();

type Binding = {
  missingNodeId: string;
  directiveRef: string;
  proposedCanonicalId: string | null;
  selected: false;
};
const BINDINGS: Binding[] = [
  ["archetype-agreement", "docs/archetype-agreement-lifecycle-negotiation-directive.md", null],
  ["archetype-document-composition", "docs/archetype-document-composition-directive.md", null],
  ["k-event-projection", "docs/event-replay-projection-contract.md", null],
  ["k-evidence", "docs/k-evidence-seal-directive.md", "k-evidence-seal"],
  ["k-exec-context", "docs/execution-context-envelope-directive.md", null],
  ["k-kms", "docs/k-kms-directive.md", "k-kms"],
  ["k-legal-hold-retention", "docs/k-legal-hold-retention-directive.md", "k-legal-hold"],
  ["k-migration-bridge", "docs/k-migration-bridge-directive.md", "k-migration-bridge"],
  ["k-module-security", "docs/marketplace-module-security-directive.md", null],
  ["k-obligation", "docs/k-obligation-commitment-directive.md", "k-obligation"],
  ["k-provider-adapter", "docs/k-provider-adapter-directive.md", "k-provider-adapter"],
  ["k-signature", "docs/k-signature-trust-directive.md", "k-signature-trust"],
  ["privacy-retention-matrix", "docs/privacy-retention-decision-matrix.md", null],
].map(([missingNodeId, directiveRef, proposedCanonicalId]) => ({
  missingNodeId: missingNodeId as string,
  directiveRef: directiveRef as string,
  proposedCanonicalId: proposedCanonicalId as string | null,
  selected: false,
}));
const GHOSTS = BINDINGS.map((b) => b.missingNodeId);
const PROPOSALS = BINDINGS.flatMap((b) => (b.proposedCanonicalId ? [b.proposedCanonicalId] : []));
const nodeIds = () =>
  new Set(
    fs
      .readdirSync(path.join(ROOT, NODES))
      .filter((f) => f.endsWith(".json"))
      .map((f) => json(`${NODES}/${f}`).id),
  );

// biome-ignore format: audited validation table stays compact for shard budget
// biome-ignore lint/suspicious/noExplicitAny: validator consumes untyped JSON fixtures.
function validate(report: any, ids: Set<string>): string[] {
  const errors: string[] = [];
  const expected = {
    decisionId: "KGA-D09",
    status: "pending",
    decisionOwner: "user-admin",
    coordinator: "project-manager",
    finalAuthority: "codex",
    nodeCreationAllowed: false,
    bindingsStatus: "candidate-unselected",
    runtimeExecutor: "human-developer-only",
    codeStartAllowed: false,
    kernelReady: false,
    sdkReady: false,
    appBuildable: false,
    verdict: "NO-GO",
  };
  const actual = {
    decisionId: report.decisionId,
    ...report.decision,
    nodeCreationAllowed: report.nodeCreationAllowed,
    bindingsStatus: report.bindingsStatus,
    ...report.authorityBoundary,
  };
  for (const [key, value] of Object.entries(expected))
    if (JSON.stringify(actual[key]) !== JSON.stringify(value)) errors.push(`${key} drift`);
  if (JSON.stringify(report.bindings) !== JSON.stringify(BINDINGS)) errors.push("binding table drift");
  if (report.bindings?.some((b: { selected?: unknown }) => b.selected !== false)) errors.push("binding selected");
  const text = JSON.stringify(report);
  for (const token of ['"ownerId"', '"disposition"', '"approved"', '"approvalRef"'])
    if (text.includes(token)) errors.push(`forbidden ${token}`);
  for (const id of GHOSTS) if (ids.has(id)) errors.push(`ghost ${id} exists`);
  for (const id of PROPOSALS) if (ids.has(id)) errors.push(`proposal ${id} exists`);
  return errors;
}

// biome-ignore format: audited negative matrix stays compact for shard budget
describe("kernel ghost WBS directive bindings (KGA-D09)", () => {
  it("binds all claims without choosing an owner or disposition", () => {
    const ids = nodeIds();
    const addendum = json(ADDENDUM);
    const inventory = json(INVENTORY);
    const g05 = inventory.structuralGaps.find((g: { id: string }) => g.id === "KGA-G05");
    expect(sort(addendum.structuralFindings.ghostWbsClaims.missingNodeIds)).toEqual(GHOSTS);
    expect(addendum.decisions.find((d: { id: string }) => d.id === "KGA-D09").status).toBe("pending");
    expect(sort(g05.candidateOwnerIds)).toEqual(sort(PROPOSALS));
    expect(GHOSTS).toHaveLength(13);
    expect(PROPOSALS).toHaveLength(7);
    for (const binding of BINDINGS) {
      expect(fs.existsSync(path.join(ROOT, binding.directiveRef))).toBe(true);
      expect(read(binding.directiveRef)).toContain(binding.missingNodeId);
      expect(ids.has(binding.missingNodeId)).toBe(false);
      if (binding.proposedCanonicalId) expect(ids.has(binding.proposedCanonicalId)).toBe(false);
    }
    expect(fs.existsSync(path.join(ROOT, REPORT))).toBe(true);
    const report = json(REPORT);
    expect(validate(report, ids)).toEqual([]);
    expect(report.rollback.action).toContain("governance integration shard");
    expect(report.rollback.runtimeDataImpact).toBe("none");
    // biome-ignore lint/suspicious/noExplicitAny: negative clones intentionally mutate JSON.
    const cases: [((r: any, s: Set<string>) => void), string][] = [
      [(r) => r.bindings.push(clone(r.bindings[0])), "binding table drift"],
      [(r) => r.bindings.pop(), "binding table drift"],
      [(r) => { r.bindings[2].directiveRef = "docs/missing.md"; }, "binding table drift"],
      [(r) => { r.bindings[2].selected = true; }, "binding table drift"],
      [(r) => { r.nodeCreationAllowed = true; }, "nodeCreationAllowed drift"],
      [(r) => { r.decisionId = "KGA-D06"; }, "decisionId drift"],
      [(_, s) => s.add("archetype-agreement"), "ghost archetype-agreement exists"],
      [(_, s) => s.add("k-legal-hold"), "proposal k-legal-hold exists"],
    ];
    for (const [mutate, error] of cases) {
      const candidate = clone(report);
      const candidateIds = new Set(ids);
      mutate(candidate, candidateIds);
      expect(validate(candidate, candidateIds)).toContain(error);
    }
  });
});
