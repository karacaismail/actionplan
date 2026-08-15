import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

// The MetaFramer Delivery conformance-suite CONTRACT: the planning record for the four-combination
// suite the ASGI Core Profile decision names but deliberately does not contain. The decision record
// stays the single authority for the combination ids, the nine business-outcome dimensions, outcome
// equality, the capability policy, the inner ring, the Node baseline and the MCP boundary. This
// contract PROJECTS a 4 x 9 coverage grid out of that authority and owns nothing of its own, so the
// test derives the authoritative ids and dimensions FROM the decision rather than restating them:
// a second hard-coded list here would be exactly the second owner the boundary forbids.
//
// The suite has not run. Every projected cell is therefore OPEN and planned-not-executed with no
// evidence, and a PASS, GREEN or executed claim without real evidence is refused rather than
// recorded. `capability delta = NONE`: no runtime, readiness, release, deploy, SDK, app, canonical
// language selection, Node cutover, inner-ring build enforcement or MCP surface is claimed by this
// package, and the five owner-comprehension fields say the suite has not run in plain Turkish.
const ROOT = process.cwd();
const CONTRACT = "reports/kernel-delivery-conformance-suite-contract-2026-08-15.json";
const SUITE = "tools/lib/kernel-delivery-conformance-suite.mjs";
const DECISION = "reports/kernel-asgi-core-profile-decision-2026-08-11.json";
const MANIFEST = "src/data/workspace-manifest.json";
const POINTER_KEY = "kernelDeliveryConformanceSuiteContract";
const APPLICABILITY = "metaframer-kernel-delivery-boundary";
const PLAIN_FIELDS = ["once", "simdi", "fark", "kullaniciYolculugu", "kalanEngel"];
// biome-ignore format: the record-side pointer field set, sorted; a shrunk pin surface is a diff
const POINTER_FIELDS = ["applicability", "changesCurrentPlatformStack", "file", "key", "runtimeImplementedByThisRecord", "scope"];
// The cell states a not-yet-run suite may carry. Anything else is a result the suite never produced.
const OPEN_STATE = "OPEN";
const PLANNED_EXECUTION = "planned-not-executed";
// biome-ignore format: every downstream claim this contract refuses, as [path, rejection]
const REFUSED_CLAIMS: [string, string][] = [
  ["prohibitions.runtimeImplementedByThisRecord", "runtime-implementation-claimed"],
  ["prohibitions.readinessClaimed", "readiness-claimed"],
  ["prohibitions.releaseAllowed", "release-claimed"],
  ["prohibitions.deployAllowed", "deploy-claimed"],
  ["prohibitions.sdkReady", "sdk-ready-claimed"],
  ["prohibitions.appBuildable", "app-buildable-claimed"],
  ["prohibitions.canonicalKernelLanguageSelected", "canonical-kernel-language-claimed"],
  ["prohibitions.nodeCutoverPerformed", "node-cutover-claimed"],
  ["prohibitions.innerRingImportBanBuildEnforced", "inner-ring-enforcement-claimed"],
  ["prohibitions.mcpSurfaceExists", "mcp-surface-claimed"],
];
// A dishonest owner paragraph with no marker a length gate would catch: only an honesty check refuses it.
const DISHONEST_OWNER =
  "Uyumluluk süiti çalıştırıldı ve dört kombinasyonun tamamı yeşil geçti; ürün hazır.";
// The same lie appended where a gate written only for the owner block never looks, and worded so no
// existing marker fires on it: the honesty sweep must cover every prose surface, not one named field.
const DISHONEST_NON_GOAL = "the suite is complete and all 36 cells are GREEN";
// One drift per row: [target, dotted path, value, named rejection(s)]. `c` is the contract, `d` the
// upstream decision, `m` the manifest. A function value receives the current value; DROP deletes.
type Drift = [string, string, unknown, string | string[]];
const DROP = Symbol("drop-key");
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const readJson = (relative: string) => JSON.parse(read(relative));
const exists = (relative: string) => fs.existsSync(path.join(ROOT, relative));
// biome-ignore lint/suspicious/noExplicitAny: the shipped pure JavaScript module has no declaration file.
const load = async (relative: string): Promise<any> =>
  import(pathToFileURL(path.join(ROOT, relative)).href);
// biome-ignore lint/suspicious/noExplicitAny: the validator consumes untyped JSON documents.
const clone = (value: any): any => JSON.parse(JSON.stringify(value));
// biome-ignore lint/suspicious/noExplicitAny: one dotted path of untyped JSON is moved per drift.
const setAt = (root: any, dotted: string, value: unknown) => {
  const keys = dotted.split(".");
  const last = keys.pop() as string;
  // biome-ignore lint/suspicious/noExplicitAny: the parent of the drifted key is untyped JSON.
  const parent = keys.reduce((v: any, k) => v[k], root);
  const next =
    typeof value === "function" ? (value as (c: unknown) => unknown)(parent[last]) : value;
  if (next === DROP) delete parent[last];
  else parent[last] = next;
};
// The cell key the whole grid is named by. Combination and dimension are joined with a separator
// neither of them contains, so a named rejection always resolves back to exactly one cell.
const cellKey = (combinationId: string, dimension: string) => `${combinationId}::${dimension}`;

describe("MetaFramer Delivery conformance suite contract", () => {
  it("projects exactly the mandatory 4 x 9 grid the upstream decision owns", async () => {
    expect(exists(DECISION), `upstream-decision-missing:${DECISION}`).toBe(true);
    expect(exists(CONTRACT), `suite-contract-missing:${CONTRACT}`).toBe(true);
    expect(exists(SUITE), `suite-validator-missing:${SUITE}`).toBe(true);
    const decision = readJson(DECISION);
    const contract = readJson(CONTRACT);
    const { deriveMandatoryCells } = await load(SUITE);
    // The authority, read from the decision: the mandatory combinations are the ones the equality
    // invariant applies to, and the dimensions are the decision's own nine. Neither is retyped here.
    const combinations: string[] = decision.outcomeEquality.appliesTo;
    const dimensions: string[] = decision.businessOutcomeDimensions;
    expect(combinations.length, "mandatory-combination-count-drift").toBe(4);
    expect(dimensions.length, "outcome-dimension-count-drift").toBe(9);
    // The derivation is a projection of the decision, cell for cell, with no invention and no gap.
    const expected = combinations.flatMap((c) => dimensions.map((d) => cellKey(c, d)));
    // biome-ignore format: the derived grid is compared as one flat key list
    const derived = deriveMandatoryCells(decision).map((cell: { combinationId: string; dimension: string }) => cellKey(cell.combinationId, cell.dimension));
    expect(derived, "derived-grid-drift").toEqual(expected);
    expect(derived.length, "derived-cell-count-drift").toBe(36);
    // The contract PROJECTS that grid; it does not author one. Same cells, same count, no extras.
    // biome-ignore format: the projected coverage is compared as one flat key list
    const projected = contract.coverage.cells.map((cell: { combinationId: string; dimension: string }) => cellKey(cell.combinationId, cell.dimension));
    expect([...projected].sort(), "projected-coverage-drift").toEqual([...expected].sort());
    // The contract names its upstream owner rather than becoming one.
    expect(contract.upstreamDecisionRef, "upstream-decision-ref-drift").toBe(DECISION);
    expect(contract.authority?.secondIndependentAuthority, "second-authority-claimed").toBe(false);
  });

  it("keeps every canonical cell OPEN, planned-not-executed and evidence-free", () => {
    expect(exists(CONTRACT), `suite-contract-missing:${CONTRACT}`).toBe(true);
    const contract = readJson(CONTRACT);
    // biome-ignore format: each cell is named individually, so a single drifted cell is legible
    for (const cell of contract.coverage.cells) {
      const key = cellKey(cell.combinationId, cell.dimension);
      expect(cell.state, `cell-state-drift:${key}`).toBe(OPEN_STATE);
      expect(cell.execution, `cell-execution-drift:${key}`).toBe(PLANNED_EXECUTION);
      expect(cell.evidence, `cell-evidence-claimed:${key}`).toEqual([]);
      expect(cell.result, `cell-result-claimed:${key}`).toBe(null);
    }
    // The suite itself has not run, so nothing above the cells claims a run either.
    // biome-ignore format: the closed execution-claim set stays one flag per line
    expect(contract.suiteExecution).toMatchObject({
      executed: false, passClaimed: false, greenClaimed: false, evidenceRequiredBeforeResult: true,
    });
    // capability delta NONE, in machine form and in the plain Turkish the owner actually reads.
    expect(contract.capabilityDelta, "capability-delta-drift").toBe("NONE");
    // biome-ignore format: every downstream claim is refused field by field, each by its own name
    for (const [dotted, error] of REFUSED_CLAIMS) {
      const value = dotted.split(".").reduce((v: unknown, k) => (v as Record<string, unknown>)?.[k], contract);
      expect(value, error).toBe(false);
    }
    // AP-OC1: exactly five plain-language fields, none a stub.
    expect(Object.keys(contract.ownerComprehension).sort()).toEqual([...PLAIN_FIELDS].sort());
    // biome-ignore format: an empty or stub plain-language field is not a report
    for (const field of PLAIN_FIELDS) expect(contract.ownerComprehension[field]?.length ?? 0, `plain-field-empty:${field}`).toBeGreaterThan(40);
    expect(DISHONEST_OWNER.length, "dishonest-control-too-short").toBeGreaterThan(40);
    // The pointer is closed and honest: it claims no stack change and no runtime.
    // biome-ignore format: the minimal scoped pointer stays compact
    expect(contract.manifestPointer).toMatchObject({ file: MANIFEST, key: POINTER_KEY, applicability: APPLICABILITY, changesCurrentPlatformStack: false, runtimeImplementedByThisRecord: false });
    // biome-ignore format: the pointer pin surface itself, so a field cannot be quietly dropped
    expect(Object.keys(contract.manifestPointer).sort(), "record-pointer-pin-surface-drift").toEqual(POINTER_FIELDS);
  });

  it("fails closed on missing, unknown, duplicate, executed and drifted cells", async () => {
    expect(exists(SUITE), `suite-validator-missing:${SUITE}`).toBe(true);
    const contract = readJson(CONTRACT);
    const decision = readJson(DECISION);
    const manifest = readJson(MANIFEST);
    // biome-ignore format: the validator's pinned surface stays one group per line
    const {
      evaluateDeliveryConformanceSuiteContract, deriveMandatoryCells, CONTRACT_REF,
      MANIFEST_POINTER_KEY, OPEN_CELL_STATE, PLANNED_CELL_EXECUTION, PLAIN_FIELDS: PINNED_FIELDS,
      NOT_RUN_MARKERS, REFUSED_CLAIM_PINS,
    } = await load(SUITE);
    expect(CONTRACT_REF, "contract-ref-drift").toBe(CONTRACT);
    expect(MANIFEST_POINTER_KEY, "pointer-key-drift").toBe(POINTER_KEY);
    expect(OPEN_CELL_STATE).toBe(OPEN_STATE);
    expect(PLANNED_CELL_EXECUTION).toBe(PLANNED_EXECUTION);
    expect(PINNED_FIELDS).toEqual(PLAIN_FIELDS);
    // The pin surface of the refused claims, so a claim cannot be quietly dropped from the gate.
    // biome-ignore format: the refused-claim pin surface is compared against this file's table
    expect(REFUSED_CLAIM_PINS.map(([p]: [string]) => p), "refused-claim-unpinned").toEqual(expect.arrayContaining(REFUSED_CLAIMS.map(([p]) => p)));
    // The positive control: without it, a validator that rejects everything would look correct.
    const clean = evaluateDeliveryConformanceSuiteContract({ contract, decision, manifest });
    expect(clean.errors, "clean-contract-rejected").toEqual([]);
    expect(clean.accepted).toBe(true);
    const first = deriveMandatoryCells(decision)[0];
    const firstKey = cellKey(first.combinationId, first.dimension);
    // biome-ignore format: the closed-grid, execution-claim, honesty and pointer sweep, one forgery per line
    const DRIFTS: Drift[] = [
      // 1-2: the grid is closed — dropped, invented, doubled and miscounted cells are each named.
      ["c", "coverage.cells", (cells: unknown[]) => cells.slice(1), [`missing-conformance-cell:${firstKey}`, "conformance-cell-count-drift"]],
      ["c", "coverage.cells", (cells: unknown[]) => [...cells, { combinationId: "metaframer-asgi-daphne", dimension: "latency", state: OPEN_STATE, execution: PLANNED_EXECUTION, evidence: [], result: null }], ["unknown-conformance-cell:metaframer-asgi-daphne::latency", "conformance-cell-count-drift"]],
      ["c", "coverage.cells", (cells: unknown[]) => [...cells, clone(cells[0])], [`duplicate-conformance-cell:${firstKey}`, "conformance-cell-count-drift"]],
      ["c", "coverage.cells.0.dimension", "latency", [`missing-conformance-cell:${firstKey}`, `unknown-conformance-cell:${cellKey(first.combinationId, "latency")}`]],
      ["c", "coverage.cells.0.combinationId", "metaframer-asgi-daphne", [`missing-conformance-cell:${firstKey}`, `unknown-conformance-cell:${cellKey("metaframer-asgi-daphne", first.dimension)}`]],
      // 4-5: a not-yet-run suite carries no state, execution, evidence or result of a run.
      ["c", "coverage.cells.0.state", "GREEN", `cell-state-drift:${firstKey}`],
      ["c", "coverage.cells.0.state", "PASS", `cell-state-drift:${firstKey}`],
      ["c", "coverage.cells.0.execution", "executed", `cell-execution-drift:${firstKey}`],
      ["c", "coverage.cells.0.result", "PASS", `cell-result-claimed:${firstKey}`],
      ["c", "coverage.cells.0.evidence", ["ci-run-url"], `cell-evidence-claimed:${firstKey}`],
      ["c", "coverage.cells.0.state", DROP, `cell-state-drift:${firstKey}`],
      ["c", "suiteExecution.executed", true, "suite-execution-claimed"],
      ["c", "suiteExecution.passClaimed", true, "suite-pass-claimed"],
      ["c", "suiteExecution.greenClaimed", true, "suite-green-claimed"],
      ["c", "suiteExecution.evidenceRequiredBeforeResult", false, "suite-evidence-requirement-waived"],
      // 6: capability delta NONE and every downstream claim refused, each by its own name.
      ["c", "capabilityDelta", "runtime-enabled", "capability-delta-drift"],
      ...REFUSED_CLAIMS.map(([dotted, error]) => ["c", dotted, true, error] as Drift),
      // 7: the owner paragraphs stay present and honest about a suite that has not run.
      ["c", "ownerComprehension.simdi", "", ["plain-field-empty:simdi", "owner-comprehension-omits-not-run"]],
      // A long run of spaces passes a length gate while saying nothing: blank is a property of the text, not of its size.
      ["c", "ownerComprehension.once", " ".repeat(41), "plain-field-empty:once"],
      // A four-letter stub padded to clear the length gate: the padding is not the report, so the gate must measure the text.
      ["c", "ownerComprehension.once", `kısa${" ".repeat(40)}`, "plain-field-empty:once"],
      ["c", "ownerComprehension.extra", "x", ["unknown-plain-field:extra", "plain-field-count-drift"]],
      ["c", "ownerComprehension.kalanEngel", DROP, ["missing-plain-field:kalanEngel", "plain-field-count-drift"]],
      ["c", "ownerComprehension.kalanEngel", DISHONEST_OWNER, ["prose-claims-suite-executed", "prose-claims-readiness"]],
      // 3 and 8: the contract owns nothing upstream, and the pointer stays closed and honest.
      ["c", "upstreamDecisionRef", "reports/other-decision.json", "upstream-decision-ref-drift"],
      ["c", "authority.secondIndependentAuthority", true, "second-authority-claimed"],
      ["c", "manifestPointer.changesCurrentPlatformStack", true, "manifest-pointer-drift:record"],
      ["c", "manifestPointer.runtimeImplementedByThisRecord", true, "manifest-pointer-drift:record"],
      ["c", "manifestPointer.scope", DROP, "manifest-pointer-drift:record"],
      ["m", POINTER_KEY, DROP, "manifest-pointer-missing"],
      ["m", `${POINTER_KEY}.contractRef`, "reports/other.json", "manifest-pointer-drift:contractRef"],
      ["m", `${POINTER_KEY}.changesCurrentPlatformStack`, true, "manifest-pointer-drift:changesCurrentPlatformStack"],
      ["m", `${POINTER_KEY}.runtimeImplementedByThisRecord`, true, "manifest-pointer-drift:runtimeImplementedByThisRecord"],
      ["m", `${POINTER_KEY}.suiteExecuted`, true, "manifest-pointer-unknown-field:suiteExecuted"],
      // 9: drift in the upstream decision invalidates the stale projection, cell by named cell.
      ["d", "businessOutcomeDimensions.0", "latency", [`missing-conformance-cell:${cellKey(first.combinationId, "latency")}`, `unknown-conformance-cell:${firstKey}`]],
      ["d", "outcomeEquality.appliesTo.0", "metaframer-asgi-daphne", [`missing-conformance-cell:${cellKey("metaframer-asgi-daphne", first.dimension)}`, `unknown-conformance-cell:${firstKey}`]],
      ["d", "businessOutcomeDimensions", (d: string[]) => d.slice(1), ["conformance-cell-count-drift", `unknown-conformance-cell:${firstKey}`]],
      // 10: every nested container is CLOSED. A pinned flag says false while an unknown SIBLING says
      // the opposite, so a gate that only reads the pinned keys records the contradiction as accepted.
      ...([
        ["coverage.verdict", "GREEN", "unknown-coverage-field:verdict"],
        ["suiteExecution.actuallyRan", true, "unknown-suite-execution-field:actuallyRan"],
        ["suiteExecution.realResult", "GREEN", "unknown-suite-execution-field:realResult"],
        ["authority.ownCombinations", true, "unknown-authority-field:ownCombinations"],
        ["prohibitions.releaseAllowedNow", true, "unknown-prohibition-field:releaseAllowedNow"],
        ["rollback.approved", true, "unknown-rollback-field:approved"],
      ] as [string, unknown, string][]).map(([dotted, value, error]) => ["c", dotted, value, error] as Drift),
      // 11: the cell is closed too, and its rejection names the cell AND the key, one cell or all 36.
      ["c", "coverage.cells.0.observedResult", "PASS", `unknown-conformance-cell-field:${firstKey}:observedResult`],
      ["c", "coverage.cells", (cells: unknown[]) => cells.map((cell) => ({ ...(cell as object), observedResult: "PASS", executed: true, evidenceRef: "ci-run-url" })), [`unknown-conformance-cell-field:${firstKey}:observedResult`, `unknown-conformance-cell-field:${firstKey}:executed`, `unknown-conformance-cell-field:${firstKey}:evidenceRef`]],
      // 12: the coverage counts are DERIVED from the same upstream grid, so a count that contradicts
      // the projected cells is a metadata lie even while all 36 correct cells are still carried.
      ["c", "coverage.combinationCount", 99, "coverage-combination-count-drift"],
      ["c", "coverage.dimensionCount", 1, "coverage-dimension-count-drift"],
      ["c", "coverage.cellCount", 1, "coverage-cell-count-metadata-drift"],
      ["c", "coverage.cellCount", DROP, "coverage-cell-count-metadata-drift"],
      // 13: honesty is a property of the record's prose, not of one field the gate happens to read.
      ["c", "nonGoals", (goals: string[]) => [...goals, DISHONEST_NON_GOAL], "prose-claims-suite-executed"],
      // 14: provenance. The record names ONE upstream owner and two source paths; a drifted, self-pointing,
      // empty or unreadable provenance is a second authority wearing a projection label.
      ["c", "authority.upstreamOwner", "reports/other-decision.json", "authority-upstream-owner-drift"],
      ["c", "authority.combinationsSource", "coverage.cells", "authority-combinations-source-drift"],
      ["c", "authority.dimensionsSource", "coverage.cells", "authority-dimensions-source-drift"],
      ["c", "authority.statement", "", "authority-statement-drift"],
      ["c", "authority.statement", "Bu sözleşme dört kombinasyon ve dokuz boyut listesinin tek bağımsız sahibidir ve yukarı akış kararını geçersiz kılar.", "authority-statement-drift"],
      ...([{}, `${CONTRACT}#coverage.cells`, { combinations: `${CONTRACT}#coverage.cells`, dimensions: `${CONTRACT}#coverage.cells` }] as unknown[]).map((value) => ["c", "coverage.derivedFrom", value, "coverage-derived-from-drift"] as Drift),
      // 15: a future result is bought with real evidence, so self-attestation, a waiver and list drift are refused.
      ...([["self-attestation"], ["ci-run-url"], ["ci-run-url", "test-log", "waiver-accepted"]] as unknown[]).map((value) => ["c", "suiteExecution.requiredEvidenceBeforeResult", value, "suite-required-evidence-drift"] as Drift),
      // 16: the plain Turkish capability sentence is the only capability truth the owner actually reads.
      ...(["", "Bu paket çalışan üründe yeni bir yetenek açtı ve kullanıcı ekranında form artık kaydediliyor."] as unknown[]).map((value) => ["c", "capabilityDeltaSadeTurkce", value, "capability-delta-sade-turkce-drift"] as Drift),
      // 17: a present-but-blank text is an absent contract, not a compact one, wherever it is required.
      // Whitespace-only is the stricter case and implies the empty one under the same eventual predicate.
      ...["rollback.action", "rollback.trigger", "suiteExecution.note"].map((dotted) => ["c", dotted, "   ", `required-text-empty:${dotted}`] as Drift),
      // 18: the non-goals are a real, non-empty list of real sentences, not a placeholder shaped like one.
      ...([[], "not-an-array", [...contract.nonGoals, "   "]] as unknown[]).map((value) => ["c", "nonGoals", value, "non-goals-invalid"] as Drift),
    ];
    // biome-ignore format: the single-drift harness stays one statement per step
    const evaluate = (target: string, dotted: string, value: unknown) => {
      const [c, d, m] = [clone(contract), clone(decision), clone(manifest)];
      setAt(target === "m" ? m : target === "d" ? d : c, dotted, value);
      return evaluateDeliveryConformanceSuiteContract({ contract: c, decision: d, manifest: m });
    };
    // Every drift must earn every reason it names AND be refused; unguarded rows are reported by name.
    // biome-ignore format: the adversarial sweep stays one clause per line
    const unguarded = DRIFTS.filter(([target, dotted, value, reasons]) => {
      const result = evaluate(target, dotted, value);
      return result.accepted || [reasons].flat().some((reason) => !result.errors.includes(reason));
    }).map(([, dotted, , reasons]) => `${dotted} => ${[reasons].flat().join(" + ")}`);
    expect(unguarded, "fail-closed-drift-unguarded").toEqual([]);
    // The harness is not rejecting everything on its own: an unmutated evaluation still accepts.
    expect(evaluate("c", "capabilityDelta", "NONE").errors, "harness-rejects-clean").toEqual([]);
    // The honesty markers are the validator's, and at least one really is in the pinned paragraphs.
    // biome-ignore format: the not-run markers are a real, non-empty honesty vocabulary
    expect(NOT_RUN_MARKERS.length, "not-run-markers-empty").toBeGreaterThan(0);
    // biome-ignore format: the owner text the contract ships already carries one of them
    const ownerText = PLAIN_FIELDS.map((f) => contract.ownerComprehension[f]).join(" ");
    // biome-ignore format: honesty is proved against the shipped text, not merely declared
    expect(NOT_RUN_MARKERS.some((marker: string) => ownerText.includes(marker)), "owner-comprehension-omits-not-run").toBe(true);
  });

  it("never throws on malformed or absent input and derives nothing from it", async () => {
    expect(exists(SUITE), `suite-validator-missing:${SUITE}`).toBe(true);
    const { evaluateDeliveryConformanceSuiteContract, deriveMandatoryCells } = await load(SUITE);
    // biome-ignore format: the malformed-input surface stays one shape per entry
    const MALFORMED: unknown[] = [
      undefined, null, {}, { contract: null, decision: null, manifest: null },
      { contract: "a string", decision: 7, manifest: [] },
      { contract: [], decision: {}, manifest: {} },
      { contract: { coverage: null }, decision: { outcomeEquality: null }, manifest: null },
      { contract: { coverage: { cells: "not-an-array" } }, decision: {}, manifest: {} },
      { contract: { coverage: { cells: [null, 3, "x"] } }, decision: { businessOutcomeDimensions: {} }, manifest: {} },
    ];
    // biome-ignore format: absent and malformed input is refused with reasons, never by throwing
    for (const [index, input] of MALFORMED.entries()) {
      const result = evaluateDeliveryConformanceSuiteContract(input as never);
      expect(result.accepted, `malformed-input-accepted:${index}`).toBe(false);
      expect(result.errors.length, `malformed-input-unnamed:${index}`).toBeGreaterThan(0);
      // biome-ignore format: every reason is a named, non-empty string, never an object or a stack
      for (const error of result.errors) expect(typeof error, `malformed-input-reason-not-named:${index}`).toBe("string");
    }
    // The derivation is total too: a decision it cannot read yields no cells rather than an exception.
    // biome-ignore format: derivation over unusable input stays empty and silent
    for (const bad of [undefined, null, {}, { outcomeEquality: {} }, { businessOutcomeDimensions: "nine" }]) expect(deriveMandatoryCells(bad as never), "malformed-derivation-invented-cells").toEqual([]);
  });
});
