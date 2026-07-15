import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// KGA-D10 tenancy physical-storage & isolation authority inventory. TEST-FIRST (RED):
// specifies reports/kernel-tenancy-authority-inventory-2026-07-15.json, absent now so the
// report-existence assertion FAILS. The live-scan/node-inventory assertions above it are the
// deterministic contract the report must reproduce; they pass against current canonical sources.

const ROOT = process.cwd();
const REPORT = "reports/kernel-tenancy-authority-inventory-2026-07-15.json";
const NODES_DIR = "src/data/generated/nodes";
const DECISION_PACK = "docs/kernel-governance-decision-pack-2026-07-15.md";
const STD_CI_GATES = "src/data/generated/nodes/std-ci-gates.json";

const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const readJson = (rel: string) => JSON.parse(read(rel));
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const sorted = (a: string[]) => [...a].sort();
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// Scan roots: docs, generated nodes, tools. Public aggregates and the new reports
// directory are ignored (neither is a scan root; `public` is skipped defensively).
const SCAN_ROOTS = ["docs", NODES_DIR, "tools"];
const TEXT_EXT = new Set([".md", ".json", ".mjs", ".js", ".ts", ".txt", ".yml", ".yaml"]);
const ADR = /adr-0026/i;
// tenancy terms: schema-per-tenant, row-level, RLS, hybrid/hibrit, tenantStrategy/tenant,
// kiraci, izolasyon, isolation. Case-insensitive so Tenant/Isolation/Hybrid also qualify.
const TENANCY =
  /schema-per-tenant|row-level|rls|hybrid|hibrit|tenantstrategy|tenant|kiraci|izolasyon|isolation/i;
const qualifies = (line: string) => ADR.test(line) && TENANCY.test(line);
// std-ci-gates embeds aggregate DOC-APPLY catalog tokens; those matched lines are
// false positives, not real tenancy-strategy statements.
const isAggregateToken = (line: string) => line.includes("[DOC-APPLY:");

function walk(absDir: string, acc: string[]): void {
  for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "public")
      continue;
    const full = path.join(absDir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (TEXT_EXT.has(path.extname(entry.name))) acc.push(full);
  }
}

type Row = { path: string; review: number; fp: number };

function liveScan() {
  const rows: Row[] = [];
  for (const root of SCAN_ROOTS) {
    const files: string[] = [];
    walk(path.join(ROOT, root), files);
    for (const abs of files) {
      const rel = path.relative(ROOT, abs).split(path.sep).join("/");
      let review = 0;
      let fp = 0;
      for (const line of read(rel).split(/\r?\n/)) {
        if (qualifies(line)) {
          if (isAggregateToken(line)) fp += 1;
          else review += 1;
        }
      }
      if (review + fp > 0) rows.push({ path: rel, review, fp });
    }
  }
  const group = (rs: Row[], n: (r: Row) => number) => ({
    paths: sorted(rs.filter((r) => n(r) > 0).map((r) => r.path)),
    lineCount: rs.reduce((s, r) => s + n(r), 0),
  });
  const afterSelf = rows.filter((r) => r.path !== DECISION_PACK);
  return {
    raw: group(rows, (r) => r.review + r.fp),
    excludingSelfReference: group(afterSelf, (r) => r.review + r.fp),
    reviewRequired: group(afterSelf, (r) => r.review),
    falsePositives: group(rows, (r) => r.fp),
  };
}

function tenantStrategyInventory() {
  const b = {
    hybrid: [] as string[],
    falseSelectedSchemaRls: [] as string[],
    ambiguousEvaluating: [] as string[],
    dependencyOrFutureContext: [] as string[],
  };
  for (const file of fs.readdirSync(path.join(ROOT, NODES_DIR))) {
    if (!file.endsWith(".json")) continue;
    const node = readJson(`${NODES_DIR}/${file}`);
    const v = node?.traceability?.tenantStrategy;
    if (v == null) continue;
    if (/hybrid/i.test(v)) b.hybrid.push(node.id);
    else if (/değerlendiriliyor|bekliyor/i.test(v)) b.ambiguousEvaluating.push(node.id);
    else if (v.includes("(ADR-0026)")) b.falseSelectedSchemaRls.push(node.id);
    else b.dependencyOrFutureContext.push(node.id);
  }
  for (const k of Object.keys(b) as (keyof typeof b)[]) b[k] = sorted(b[k]);
  return { totalNonNull: Object.values(b).reduce((n, a) => n + a.length, 0), ...b };
}

// Pinned live-derived truth (2026-07-15 canonical sources). Kept sorted to match scan output.
const D = "src/data/generated/nodes/";
// biome-ignore format: audited path snapshot stays compact for shard budget
const EXPECTED_RAW_PATHS = [
  "docs/actor-party-contract.md", "docs/archetype-agreement-lifecycle-negotiation-directive.md",
  "docs/archetype-document-composition-directive.md", "docs/core-contract-pack.md",
  "docs/enterprise-saas-phase-5b-identity-tenant-org-candidates.md", "docs/k-evidence-seal-directive.md",
  "docs/k-kms-directive.md", "docs/k-legal-hold-retention-directive.md",
  "docs/k-obligation-commitment-directive.md", "docs/k-provider-adapter-directive.md",
  "docs/k-signature-trust-directive.md", "docs/k-storage-dam-directive.md", DECISION_PACK,
  "docs/marketplace-module-security-directive.md", "docs/mode-profile-contract.md",
  "docs/privacy-retention-decision-matrix.md", "docs/standards/10-business-model-switching-standard.md",
  "docs/standards/12-devops-infrastructure-standard.md", `${D}k-archetype-mode-profile.json`,
  `${D}k-mode.json`, `${D}platform-customer-model.json`, `${D}platform-db-schema.json`,
  `${D}platform-tenancy.json`, STD_CI_GATES, "tools/gen-platform.mjs",
  "tools/platform-content/platform-tenancy.json",
];
const EXPECTED_AFTER_SELF = EXPECTED_RAW_PATHS.filter((p) => p !== DECISION_PACK);
const EXPECTED_REVIEW = EXPECTED_AFTER_SELF.filter((p) => p !== STD_CI_GATES);
// biome-ignore format: audited node pattern stays compact for shard budget
const EXPECTED_HYBRID = Array.from({ length: 17 }, (_, i) => `urlp-${String(i).padStart(2, "0")}`)
  .concat("urlp-program-work-unit");
const EXPECTED_FALSE_SELECTED = ["platform-customer-model", "platform-db-schema"];
const EXPECTED_AMBIGUOUS = ["platform-tenancy"];
// biome-ignore format: audited node snapshot stays compact for shard budget
const EXPECTED_DEPENDENCY = ["be-sdk", "k-bus", "k-capability", "l1-audit", "l1-workflow", "platform-migration-contract"];

// The report contract as [actual, expected, error] rows; each doubles as a negative-clone guard.
// `same` (JSON deep-equal) covers scalars, null and exact path/count arrays alike.
// biome-ignore format: audited snapshot stays compact for shard budget
// biome-ignore lint/suspicious/noExplicitAny: validator consumes untyped JSON fixtures.
function checks(r: any, scan: ReturnType<typeof liveScan>, inv: ReturnType<typeof tenantStrategyInventory>) {
  const d = r.decision ?? {};
  const t = r.tenancy ?? {};
  const ia = t.invalidAuthority ?? {};
  const ab = r.authorityBoundary ?? {};
  const m = ab.mutationAllowed ?? {};
  const s = r.scan ?? {};
  const ti = r.tenantStrategyInventory ?? {};
  return [
    [r.decisionId, "KGA-D10", "decisionId must remain KGA-D10"],
    [d.status, "pending", "decision status must remain pending"],
    [d.decisionOwner, "user-admin", "decisionOwner must remain user-admin"],
    [d.coordinator, "project-manager", "coordinator must remain project-manager"],
    [d.finalAuthority, "codex", "finalAuthority must remain codex"],
    [t.physicalStrategy, null, "physicalStrategy must stay null (no strategy selected)"],
    [t.threshold, null, "threshold must stay null (no threshold selected)"],
    [t.mandatoryRls, true, "mandatoryRls must stay true (RLS not weakened)"],
    [ia.id, "ADR-0026", "invalid authority id must remain ADR-0026"],
    [ia.actualScope, "frontend-tech-profiles", "ADR-0026 actual scope must remain frontend-tech-profiles"],
    [ia.isTenancyAuthority, false, "ADR-0026 is not the tenancy authority"],
    [m.generatedNodes, false, "generated node mutation must stay false"],
    [m.generator, false, "generator mutation must stay false"],
    [m.queue, false, "queue mutation must stay false"],
    [ab.runtimeExecutor, "human-developer-only", "runtime executor must stay human-developer-only"],
    [ab.codeStartAllowed, false, "code start must stay false"],
    [ab.kernelReady, false, "kernelReady must stay false"],
    [ab.sdkReady, false, "sdkReady must stay false"],
    [ab.appBuildable, false, "appBuildable must stay false"],
    [ab.verdict, "NO-GO", "verdict must remain NO-GO"],
    // Exact path + count inventories compared against the live scan, not only totals.
    [s.raw?.paths, scan.raw.paths, "raw path inventory drift"],
    [s.raw?.lineCount, scan.raw.lineCount, "raw line count drift"],
    [s.excludingSelfReference?.paths, scan.excludingSelfReference.paths, "self-reference-excluded path inventory drift"],
    [s.excludingSelfReference?.lineCount, scan.excludingSelfReference.lineCount, "self-reference-excluded line count drift"],
    [s.reviewRequired?.paths, scan.reviewRequired.paths, "review-required path inventory drift"],
    [s.reviewRequired?.lineCount, scan.reviewRequired.lineCount, "review-required line count drift"],
    [s.falsePositives?.paths, scan.falsePositives.paths, "false-positive path inventory drift"],
    [s.falsePositives?.lineCount, scan.falsePositives.lineCount, "false-positive line count drift"],
    [ti.totalNonNull, inv.totalNonNull, "tenantStrategy non-null total drift"],
    [ti.hybrid, inv.hybrid, "hybrid inventory drift"],
    [ti.falseSelectedSchemaRls, inv.falseSelectedSchemaRls, "false-selected schema+RLS inventory drift"],
    [ti.ambiguousEvaluating, inv.ambiguousEvaluating, "ambiguous/evaluating inventory drift"],
    [ti.dependencyOrFutureContext, inv.dependencyOrFutureContext, "dependency/future-context inventory drift"],
  ] as [unknown, unknown, string][];
}
// biome-ignore format: audited validation pipeline stays compact for shard budget
// biome-ignore lint/suspicious/noExplicitAny: validator consumes untyped JSON fixtures.
const validate = (r: any, scan: ReturnType<typeof liveScan>, inv: ReturnType<typeof tenantStrategyInventory>) =>
  checks(r, scan, inv).filter(([a, e]) => !same(a, e)).map(([, , msg]) => msg);

describe("kernel tenancy authority inventory (KGA-D10)", () => {
  it("live-scans tenancy authority evidence and pins the pending NO-GO report", () => {
    const scan = liveScan();
    const inv = tenantStrategyInventory();

    // Raw candidates (incl. the decision-pack negative self-reference): 26 paths / 53 lines.
    expect(scan.raw.paths).toEqual(EXPECTED_RAW_PATHS);
    expect(scan.raw.paths).toHaveLength(26);
    expect(scan.raw.lineCount).toBe(53);
    expect(scan.raw.paths).toContain(DECISION_PACK);

    // Excluding the decision-pack self-reference: 25 paths / 52 lines.
    expect(scan.excludingSelfReference.paths).toEqual(EXPECTED_AFTER_SELF);
    expect(scan.excludingSelfReference.paths).toHaveLength(25);
    expect(scan.excludingSelfReference.lineCount).toBe(52);
    expect(scan.excludingSelfReference.paths).not.toContain(DECISION_PACK);

    // std-ci-gates two embedded aggregate-token lines are false positives.
    expect(scan.falsePositives.paths).toEqual([STD_CI_GATES]);
    expect(scan.falsePositives.lineCount).toBe(2);

    // Leaves 24 paths / 50 review-required lines.
    expect(scan.reviewRequired.paths).toEqual(EXPECTED_REVIEW);
    expect(scan.reviewRequired.paths).toHaveLength(24);
    expect(scan.reviewRequired.lineCount).toBe(50);
    expect(scan.reviewRequired.paths).not.toContain(STD_CI_GATES);
    expect(scan.reviewRequired.paths).toContain("src/data/generated/nodes/platform-tenancy.json");

    // traceability.tenantStrategy inventory: 27 non-null.
    expect(inv.totalNonNull).toBe(27);
    expect(inv.hybrid).toEqual(EXPECTED_HYBRID);
    expect(inv.hybrid).toHaveLength(18);
    expect(inv.hybrid.every((id) => id.startsWith("urlp"))).toBe(true);
    expect(inv.falseSelectedSchemaRls).toEqual(EXPECTED_FALSE_SELECTED);
    expect(inv.ambiguousEvaluating).toEqual(EXPECTED_AMBIGUOUS);
    expect(inv.dependencyOrFutureContext).toEqual(EXPECTED_DEPENDENCY);
    expect(inv.dependencyOrFutureContext).toHaveLength(6);

    // Test-first provenance: report absence was the RED gate before the ledger was added.
    expect(fs.existsSync(path.join(ROOT, REPORT))).toBe(true);

    const report = readJson(REPORT);
    expect(validate(report, scan, inv)).toEqual([]);
    expect(report.rollback).toContain("governance integration shard");

    // Negative clones: selecting a strategy/threshold, flipping D10→D06, enabling
    // mutations/code-start, weakening RLS or the verdict must each be rejected.
    // biome-ignore format: audited snapshot stays compact for shard budget
    // biome-ignore lint/suspicious/noExplicitAny: negative clones intentionally mutate JSON.
    const negatives: [(c: any) => void, string][] = [
      [(c) => { c.tenancy.physicalStrategy = "schema-per-tenant"; }, "physicalStrategy must stay null (no strategy selected)"],
      [(c) => { c.tenancy.threshold = 500; }, "threshold must stay null (no threshold selected)"],
      [(c) => { c.tenancy.mandatoryRls = false; }, "mandatoryRls must stay true (RLS not weakened)"],
      [(c) => { c.decisionId = "KGA-D06"; }, "decisionId must remain KGA-D10"],
      [(c) => { c.authorityBoundary.mutationAllowed.generatedNodes = true; }, "generated node mutation must stay false"],
      [(c) => { c.authorityBoundary.codeStartAllowed = true; }, "code start must stay false"],
      [(c) => { c.authorityBoundary.verdict = "GO"; }, "verdict must remain NO-GO"],
    ];
    for (const [mutate, error] of negatives) {
      const c = clone(report);
      mutate(c);
      expect(validate(c, scan, inv)).toContain(error);
    }
  });
});
