import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Test-first provenance: report absence was the RED gate after live inventory passed.
const ROOT = process.cwd();
const REPORT = "reports/kernel-missing-doc-ref-placement-2026-07-15.json";
const NODES = "src/data/generated/nodes";
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");
const json = (p: string) => JSON.parse(read(p));
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const exists = (p: string) => fs.existsSync(path.join(ROOT, p));

const CORE = "docs/core-contract-pack.md";
type Row = {
  id: string;
  status: "candidate-unselected" | "canonical-source-missing";
  candidateDoc: string | null;
  anchor: string | null;
  blocker: string | null;
  selected: false;
  refApplied: false;
};
// placementDefaults merged into every row.
const DEFAULTS = { selected: false as const, refApplied: false as const };
// biome-ignore format: audited row factory stays compact for the shard budget
const cand = (id: string, doc: string, anchor: string): Row => ({
  id, status: "candidate-unselected", candidateDoc: doc, anchor, blocker: null, ...DEFAULTS,
});
// biome-ignore format: audited row factory stays compact for the shard budget
const gone = (id: string): Row => ({
  id, status: "canonical-source-missing", candidateDoc: null, anchor: null, blocker: "", ...DEFAULTS,
});

// biome-ignore format: audited placement table stays compact for shard budget
const EXPECTED: Row[] = [
  gone("k-archetype-bayraklari"),
  cand("k-archetype-computation", CORE, "### 3.5 Computation / Derivation"),
  cand("k-archetype-fieldtypes", CORE, "### 3.6 Field-Types"),
  cand("k-archetype-mode-profile", CORE, "### 3.4 Mode-Profile"),
  cand("k-calendar-capacity", CORE, "### 3.9 Calendar + Capacity"),
  cand("k-edge-gateway", CORE, "### 3.11 Edge Gateway"),
  cand("k-genealogy-graph", CORE, "### 3.10 Genealogy Graph"),
  cand("k-granulerlik", "docs/task-to-code-contract.md", "| micro_step | atom |"),
  cand("k-identity", CORE, "### 2.2 Identity / AuthZ"),
  cand("k-jurisdiction", CORE, "### 3.15 Jurisdiction"),
  cand("k-kpi-registry", CORE, "### 3.12 KPI Registry"),
  cand("k-mod-l", "docs/app-distribution-contract.md", "k-mod-l / k-plugin"),
  cand("k-plugin", "docs/marketplace-module-security-directive.md", "Marketplace / External-Module Security Yönergesi"),
  cand("k-sequence", CORE, "### 3.8 Sequence"),
  gone("k-sozlesme"),
  gone("k-tenancy-deep"),
  cand("k-terminoloji", "docs/kernel-sdk-app-delivery-sequence.md", "## Terimler"),
];
const IDS = EXPECTED.map((r) => r.id).sort();
const byId = new Map(EXPECTED.map((r) => [r.id, r] as const));
// biome-ignore lint/suspicious/noExplicitAny: helper navigates untyped JSON fixtures.
const P = (r: any, id: string) => r.placement.find((x: { id: string }) => x.id === id);

const liveMissingDocRefs = (): string[] =>
  fs
    .readdirSync(path.join(ROOT, NODES))
    .filter((f) => f.endsWith(".json"))
    .map((f) => json(`${NODES}/${f}`) as { id: string; refs?: string[] })
    .filter((n) => n.id.startsWith("k-"))
    .filter((n) => !(n.refs ?? []).some((ref) => ref.includes("docs/")))
    .map((n) => n.id)
    .sort();

// biome-ignore format: audited validation table stays compact for shard budget
// biome-ignore lint/suspicious/noExplicitAny: validator consumes untyped JSON fixtures.
function validate(report: any, has: (p: string) => boolean): string[] {
  const errors: string[] = [];
  if (JSON.stringify(report.placementDefaults) !== JSON.stringify(DEFAULTS))
    errors.push("placementDefaults drift");
  const expected: Record<string, unknown> = {
    gapId: "KGA-G02", status: "pending", finalAuthority: "codex",
    successorCoordinator: "project-manager", runtimeExecutor: "human-developer-only",
    generatedNodeMutationAllowed: false, refApplicationAllowed: false, codeStartAllowed: false,
    kernelReady: false, sdkReady: false, appBuildable: false, verdict: "NO-GO", gapClosed: false,
    rollbackRuntimeDataImpact: "none",
  };
  const actual: Record<string, unknown> = {
    gapId: report.gapId, status: report.status,
    ...report.authority, ...report.boundary, gapClosed: report.gapClosed,
    rollbackRuntimeDataImpact: report.rollback?.runtimeDataImpact,
  };
  for (const [key, value] of Object.entries(expected))
    if (JSON.stringify(actual[key]) !== JSON.stringify(value)) errors.push(`${key} drift`);
  const placements = (report.placement ?? []).map((r: Row) => ({ ...report.placementDefaults, ...r }));
  const ids = placements.map((r: { id: string }) => r.id).sort();
  if (JSON.stringify(ids) !== JSON.stringify(IDS)) errors.push("placement set drift");
  for (const row of placements) {
    const exp = byId.get(row.id);
    if (!exp) { errors.push(`unexpected ${row.id}`); continue; }
    if (row.selected !== false) errors.push(`${row.id} selected`);
    if (row.refApplied !== false) errors.push(`${row.id} refApplied`);
    if (row.status !== exp.status) errors.push(`${row.id} status`);
    if (exp.status === "candidate-unselected") {
      if (row.candidateDoc !== exp.candidateDoc) errors.push(`${row.id} candidateDoc`);
      if (row.anchor !== exp.anchor) errors.push(`${row.id} anchor`);
      if (row.blocker !== null) errors.push(`${row.id} blocker`);
      if (!has(exp.candidateDoc as string)) errors.push(`missing ${exp.candidateDoc}`);
      else if (!read(exp.candidateDoc as string).includes(exp.anchor as string))
        errors.push(`anchor ${exp.anchor} absent in ${exp.candidateDoc}`);
    } else {
      if (row.candidateDoc !== null) errors.push(`${row.id} candidateDoc`);
      if (row.anchor !== null) errors.push(`${row.id} anchor`);
      if (typeof row.blocker !== "string" || row.blocker.length === 0) errors.push(`${row.id} blocker`);
    }
  }
  return errors;
}

// biome-ignore format: audited negative matrix stays compact for shard budget
describe("kernel missing doc-ref placement (KGA-G02)", () => {
  it("binds seventeen doc-less kernel nodes without applying refs", () => {
    const live = liveMissingDocRefs();
    expect(live).toEqual(IDS);
    for (const id of live) {
      const node = json(`${NODES}/${id}.json`) as { refs?: string[] };
      expect((node.refs ?? []).some((ref) => ref.includes("docs/"))).toBe(false);
    }
    for (const row of EXPECTED) {
      if (row.status !== "candidate-unselected") continue;
      expect(exists(row.candidateDoc as string), `doc yok: ${row.candidateDoc}`).toBe(true);
      expect(read(row.candidateDoc as string), `anchor yok: ${row.anchor}`).toContain(row.anchor as string);
    }
    expect(fs.existsSync(path.join(ROOT, REPORT))).toBe(true);
    const report = json(REPORT);
    expect(validate(report, exists)).toEqual([]);
    // biome-ignore lint/suspicious/noExplicitAny: negative clones intentionally mutate JSON.
    const cases: { mutate?: (r: any) => void; miss?: string; error: string }[] = [
      { mutate: (r) => { P(r, "k-archetype-computation").selected = true; }, error: "k-archetype-computation selected" },
      { mutate: (r) => { P(r, "k-archetype-computation").refApplied = true; }, error: "k-archetype-computation refApplied" },
      { mutate: (r) => { P(r, "k-identity").candidateDoc = "docs/wrong.md"; }, error: "k-identity candidateDoc" },
      { mutate: (r) => { P(r, "k-identity").anchor = "### 9.9 Nope"; }, error: "k-identity anchor" },
      { mutate: (r) => { P(r, "k-sozlesme").blocker = ""; }, error: "k-sozlesme blocker" },
      { mutate: (r) => { r.authority.finalAuthority = "human-developer"; }, error: "finalAuthority drift" },
      { mutate: (r) => { r.boundary.codeStartAllowed = true; }, error: "codeStartAllowed drift" },
      { mutate: (r) => { r.boundary.kernelReady = true; }, error: "kernelReady drift" },
      { mutate: (r) => { r.boundary.sdkReady = true; }, error: "sdkReady drift" },
      { mutate: (r) => { r.boundary.appBuildable = true; }, error: "appBuildable drift" },
      { mutate: (r) => { r.boundary.verdict = "GO"; }, error: "verdict drift" },
      { mutate: (r) => { r.gapClosed = true; }, error: "gapClosed drift" },
      { mutate: (r) => { r.rollback.runtimeDataImpact = "runtime"; }, error: "rollbackRuntimeDataImpact drift" },
      { miss: CORE, error: `missing ${CORE}` },
    ];
    for (const testCase of cases) {
      const candidate = clone(report);
      testCase.mutate?.(candidate);
      const has = testCase.miss ? (p: string) => p !== testCase.miss && exists(p) : exists;
      expect(validate(candidate, has)).toContain(testCase.error);
    }
  });
});
