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
type Placement = Omit<Row, "status" | "selected" | "refApplied"> & {
  status: string;
  selected: boolean;
  refApplied: boolean;
};
type PlacementReport = {
  gapId: string;
  status: string;
  gapClosed: boolean;
  authority: {
    finalAuthority: string;
    successorCoordinator: string;
    runtimeExecutor: string;
  };
  boundary: {
    generatedNodeMutationAllowed: boolean;
    refApplicationAllowed: boolean;
    codeStartAllowed: boolean;
    kernelReady: boolean;
    sdkReady: boolean;
    appBuildable: boolean;
    verdict: string;
  };
  placementDefaults: { selected: boolean; refApplied: boolean };
  placement: Placement[];
  rollback: { trigger: string; action: string; runtimeDataImpact: string };
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
const P = (r: PlacementReport, id: string) => r.placement.find((row) => row.id === id) as Placement;

const liveMissingDocRefs = (): string[] =>
  fs
    .readdirSync(path.join(ROOT, NODES))
    .filter((f) => f.endsWith(".json"))
    .map((f) => json(`${NODES}/${f}`) as { id: string; refs?: string[] })
    .filter((n) => n.id.startsWith("k-"))
    .filter((n) => !(n.refs ?? []).some((ref) => ref.includes("docs/")))
    .map((n) => n.id)
    .sort();

const FIXED_CONTRACT: Record<string, unknown> = {
  gapId: "KGA-G02",
  status: "pending",
  finalAuthority: "codex",
  successorCoordinator: "project-manager",
  runtimeExecutor: "human-developer-only",
  generatedNodeMutationAllowed: false,
  refApplicationAllowed: false,
  codeStartAllowed: false,
  kernelReady: false,
  sdkReady: false,
  appBuildable: false,
  verdict: "NO-GO",
  gapClosed: false,
  rollbackTrigger:
    "the live missing-doc set, candidate anchor, authority or readiness guard drifts",
  rollbackAction:
    "revert the consuming governance integration shard first, then revert this report with tests/kernelMissingDocRefPlacement.test.ts",
  rollbackRuntimeDataImpact: "none",
};

function contractErrors(report: PlacementReport): string[] {
  const actual: Record<string, unknown> = {
    gapId: report.gapId,
    status: report.status,
    ...report.authority,
    ...report.boundary,
    gapClosed: report.gapClosed,
    rollbackTrigger: report.rollback?.trigger,
    rollbackAction: report.rollback?.action,
    rollbackRuntimeDataImpact: report.rollback?.runtimeDataImpact,
  };
  return Object.entries(FIXED_CONTRACT)
    .filter(([key, value]) => JSON.stringify(actual[key]) !== JSON.stringify(value))
    .map(([key]) => `${key} drift`);
}

function candidateErrors(row: Placement, expected: Row, has: (p: string) => boolean): string[] {
  const errors: string[] = [];
  if (row.candidateDoc !== expected.candidateDoc) errors.push(`${row.id} candidateDoc`);
  if (row.anchor !== expected.anchor) errors.push(`${row.id} anchor`);
  if (row.blocker !== null) errors.push(`${row.id} blocker`);
  const document = expected.candidateDoc as string;
  const anchor = expected.anchor as string;
  if (!has(document)) errors.push(`missing ${document}`);
  else if (!read(document).includes(anchor)) errors.push(`anchor ${anchor} absent in ${document}`);
  return errors;
}

function missingSourceErrors(row: Placement): string[] {
  const errors: string[] = [];
  if (row.candidateDoc !== null) errors.push(`${row.id} candidateDoc`);
  if (row.anchor !== null) errors.push(`${row.id} anchor`);
  if (typeof row.blocker !== "string" || row.blocker.length === 0) errors.push(`${row.id} blocker`);
  return errors;
}

function placementErrors(row: Placement, has: (p: string) => boolean): string[] {
  const expected = byId.get(row.id);
  if (!expected) return [`unexpected ${row.id}`];
  const errors: string[] = [];
  if (row.selected !== false) errors.push(`${row.id} selected`);
  if (row.refApplied !== false) errors.push(`${row.id} refApplied`);
  if (row.status !== expected.status) errors.push(`${row.id} status`);
  return errors.concat(
    expected.status === "candidate-unselected"
      ? candidateErrors(row, expected, has)
      : missingSourceErrors(row),
  );
}

function validate(report: PlacementReport, has: (p: string) => boolean): string[] {
  const placements = (report.placement ?? []).map((row) => ({
    ...report.placementDefaults,
    ...row,
  }));
  const ids = placements.map((row) => row.id).sort();
  const errors = contractErrors(report);
  if (JSON.stringify(report.placementDefaults) !== JSON.stringify(DEFAULTS))
    errors.push("placementDefaults drift");
  if (JSON.stringify(ids) !== JSON.stringify(IDS)) errors.push("placement set drift");
  return errors.concat(placements.flatMap((row) => placementErrors(row, has)));
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
    const report = json(REPORT) as PlacementReport;
    expect(validate(report, exists)).toEqual([]);
    const cases: { mutate?: (r: PlacementReport) => void; miss?: string; error: string }[] = [
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
      { mutate: (r) => { r.rollback.trigger = "drift"; }, error: "rollbackTrigger drift" },
      { mutate: (r) => { r.rollback.action = "revert only the report"; }, error: "rollbackAction drift" },
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
