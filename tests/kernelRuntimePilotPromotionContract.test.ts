import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

// The frozen GO-RUNTIME-PILOT promotion contract and its machine evaluator. The contract carries
// exactly ten gates, GRP-01..GRP-10, frozen by a digest recomputed here rather than trusted.
// Promotion needs 10/10 GREEN plus an independent verifier plus a human countersign; the writer
// never self-closes, the countersign defaults false, and GO-RUNTIME-PILOT is never GO-PRODUCTION.
// The contract is not its own authority either: it is judged against pins the evaluator holds, so a
// contract forged together with a matching submission fails as well.
//
// Reading the application-state ledger makes this a ledger-touching sibling of
// tests/kernelGovernanceApplicationState.test.ts, which classifies such files by this exact literal.
// This file owns no KGA-Dxx row — the promotion contract is a new GRP artifact — so it declares
// itself a consumer. Referenced, not asserted: a literal equalling itself proves nothing.
const APPLICATION_STATE_ROLE = "non-decision-consumer";
void APPLICATION_STATE_ROLE;
const ROOT = process.cwd();
const CONTRACT = "reports/kernel-runtime-pilot-promotion-contract-2026-08-06.json";
const EVALUATOR = "tools/lib/kernel-runtime-pilot-promotion.mjs";
const CHAIN = "reports/kernel-effective-authority-chain-2026-07-31.json";
const STATE = "reports/kernel-governance-application-state-2026-08-01.json";
const CHAIN_LIB = "tools/lib/kernel-effective-authority-chain.mjs";
// This Actionplan commit, the live chain head with its whole-chain digest, and the read-only Kernel
// main the EPOCH-04 head already binds.
const ACTIONPLAN_COMMIT = "673a23c3093cf254d9d59b5c109f065f93416d29";
const KERNEL_COMMIT = "f62dc8e8cbacaa510aea1187212dc7171cbffa0a";
const CHAIN_HEAD_SEQ = 4;
const CHAIN_HEAD_ENTRY = "90a0a9ba795fcff67d48829d9d0083cbac956e4d1b277527862fa19586228c37";
const CHAIN_SHA256 = "f2315ba09192e3614e272bb7256ae41a288f1a6fdc435cb67aca74954ec3a1b8";
// The verdict that governs now, the one this contract may at most unlock, and the one it never is.
const CURRENT_VERDICT = "GO-KERNEL-DEVELOPMENT-ONLY";
const PROMOTION_VERDICT = "GO-RUNTIME-PILOT";
const FORBIDDEN_VERDICT = "GO-PRODUCTION";
// The closed gate set: exactly these ten ids in exactly this order. No eleventh gate, ever.
// biome-ignore format: the frozen gate id set stays compact for the shard budget
const GATE_IDS = ["GRP-01", "GRP-02", "GRP-03", "GRP-04", "GRP-05", "GRP-06", "GRP-07", "GRP-08", "GRP-09", "GRP-10"];
// The frozen definition text, id by id. Freezing ids without definitions would let a gate keep its
// name and change what it means.
// biome-ignore format: the frozen gate definition table stays compact for the shard budget
const GATE_DEFINITIONS: Array<[string, string]> = [["GRP-01", "authority/consumer sync"], ["GRP-02", "contract, dependency and Onion boundary lock"], ["GRP-03", "one pilot app/module/archetype scope"], ["GRP-04", "baseline, SLO, RTO, RPO"], ["GRP-05", "PostgreSQL, RLS, transaction, outbox, audit baseline"], ["GRP-06", "typed action/envelope, PDP, primitive contracts"], ["GRP-07", "generated SDK"], ["GRP-08", "golden-slice end-to-end evidence"], ["GRP-09", "security, rollback, independent verification"], ["GRP-10", "atomic promotion and human countersign"]];
// The only three classifications a later-found topic may receive. A fourth would be a new gate.
// biome-ignore format: the closed later-topic classification set stays compact for the shard budget
const CLASSIFICATIONS = ["existing-gate-evidence", "post-pilot-backlog", "production-blocker"];
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const readJson = (relative: string) => JSON.parse(read(relative));
const exists = (relative: string) => fs.existsSync(path.join(ROOT, relative));
// biome-ignore lint/suspicious/noExplicitAny: the shipped pure JavaScript validators have no declaration file.
const load = async (relative: string): Promise<any> =>
  import(pathToFileURL(path.join(ROOT, relative)).href);
// A submission that would otherwise promote: ten GREEN gates, an independent verifier, a signed
// countersign, every pin correct. Each negative below mutates exactly one thing, so a rejection can
// only come from that one thing and never from unrelated noise.
// biome-ignore format: the otherwise-promoting submission stays compact for the shard budget
// biome-ignore lint/suspicious/noExplicitAny: the evaluator consumes untyped JSON submissions.
const submission = (gateSetSha256: string): any => ({ actionplanCommit: ACTIONPLAN_COMMIT, kernelCommit: KERNEL_COMMIT, chainHeadEntrySha256: CHAIN_HEAD_ENTRY, gateSetSha256, targetVerdict: PROMOTION_VERDICT, gates: GATE_IDS.map((id) => ({ id, status: "GREEN", evidenceRefs: [`evidence/${id}.json`] })), writer: { id: "claude-writer" }, independentVerifier: { id: "codex-master", independentOfWriter: true }, humanCountersign: { signed: true, signatory: "human-admin" } });

describe("GO-RUNTIME-PILOT promotion contract", () => {
  it("freezes exactly ten gates by id, order and definition against pinned authority", async () => {
    // biome-ignore format: the missing-contract marker stays on one line
    expect(exists(CONTRACT), `runtime-pilot-promotion-contract-missing:${CONTRACT}`).toBe(true);
    const contract = readJson(CONTRACT);
    const chain = readJson(CHAIN);
    // The contract is closed: exactly these roots, so a quietly added field is a diff.
    // biome-ignore format: the closed contract root key set stays compact for the shard budget
    expect(Object.keys(contract).sort(), "contract-root-key-drift").toEqual(["authorityBinding", "currentStatus", "frozen", "gateSetSha256", "gates", "generatedAt", "id", "invariants", "laterTopicPolicy", "nextChangePackage", "nonGoals", "promotionRule", "rollback", "schemaVersion", "status"]);
    // biome-ignore format: the exact contract identity stays compact for the shard budget
    expect(contract).toMatchObject({ schemaVersion: "1.0.0", id: "kernel-runtime-pilot-promotion-contract-2026-08-06", generatedAt: "2026-08-06", frozen: true, status: "frozen-promotion-contract-not-promoted" });

    // Ten gates, in order, with the exact frozen definitions. Order is carried explicitly so the
    // freeze does not silently depend on JSON array position alone.
    expect(contract.gates.map((gate: { id: string }) => gate.id)).toEqual(GATE_IDS);
    // biome-ignore format: order is 1..10 and matches the declared position exactly
    expect(contract.gates.map((gate: { order: number }) => gate.order)).toEqual(GATE_IDS.map((_, index) => index + 1));
    // biome-ignore format: every frozen definition is present verbatim, id by id
    expect(contract.gates.map((gate: { id: string; definition: string }) => [gate.id, gate.definition])).toEqual(GATE_DEFINITIONS);
    expect(new Set(GATE_IDS).size).toBe(GATE_IDS.length);

    // The freeze digest is recomputed here from the canonical rule, never read back from the
    // contract, so a renamed, reordered or rewritten gate set cannot restate its way to valid.
    const { canonicalJson } = await load(CHAIN_LIB);
    // biome-ignore format: the canonical freeze rule is the ordered [order, id, definition] triple set
    const frozen = contract.gates.map((gate: { order: number; id: string; definition: string }) => [gate.order, gate.id, gate.definition]);
    const recomputed = createHash("sha256").update(canonicalJson(frozen), "utf8").digest("hex");
    expect(contract.gateSetSha256, "gate-set-freeze-digest-drift").toBe(recomputed);
    // The evaluator computes that digest AND pins it as a constant, so neither the contract nor a
    // caller can supply a self-consistent digest over a different gate set.
    // biome-ignore format: the missing-evaluator marker stays on one line
    expect(exists(EVALUATOR), `runtime-pilot-promotion-evaluator-missing:${EVALUATOR}`).toBe(true);
    // biome-ignore format: the evaluator's pinned freeze surface stays compact for the shard budget
    const { freezeDigest, GATE_IDS: evaluatorIds, EXPECTED_GATE_SET_SHA256, EXPECTED_AUTHORITY, GATE_DEFINITIONS: evaluatorGates } = await load(EVALUATOR);
    expect(freezeDigest(contract.gates)).toBe(recomputed);
    expect(evaluatorIds).toEqual(GATE_IDS);
    expect(EXPECTED_GATE_SET_SHA256, "evaluator-freeze-pin-drift").toBe(recomputed);
    // biome-ignore format: the evaluator's own frozen triples are the contract's, id and definition alike
    expect(evaluatorGates.map(([, id, definition]: [number, string, string]) => [id, definition])).toEqual(GATE_DEFINITIONS);

    // One Actionplan commit, one authority chain head with its digest, one read-only Kernel commit.
    // biome-ignore format: the pinned authority binding stays compact for the shard budget
    expect(contract.authorityBinding).toEqual({ actionplanCommit: ACTIONPLAN_COMMIT, chainRef: CHAIN, chainHeadSeq: CHAIN_HEAD_SEQ, chainHeadEntrySha256: CHAIN_HEAD_ENTRY, chainSha256: CHAIN_SHA256, stateRef: STATE, kernelRepository: "metaframer-kernel", kernelCommit: KERNEL_COMMIT, kernelAccess: "read-only", currentVerdict: CURRENT_VERDICT });
    // The evaluator holds that anchor independently, which is what lets it refuse a forged contract
    // instead of accepting whatever binding the contract happens to carry.
    expect(EXPECTED_AUTHORITY, "evaluator-anchor-drift").toEqual(contract.authorityBinding);
    // biome-ignore format: the pinned head is the head the chain actually carries right now
    expect([chain.chainHeadSeq, chain.chainHeadEntrySha256, chain.chainSha256]).toEqual([CHAIN_HEAD_SEQ, CHAIN_HEAD_ENTRY, CHAIN_SHA256]);
    // The ledger it derives from is real and still open, so this is written over an unclosed gap.
    expect(readJson(STATE).gate.gapClosed).toBe(false);
    expect(readJson(STATE).gate.verdict).toBe(CURRENT_VERDICT);
  });

  it("promotes only at 10/10 GREEN with an independent verifier and a human countersign", async () => {
    // biome-ignore format: the missing-contract marker stays on one line
    expect(exists(CONTRACT), `runtime-pilot-promotion-contract-missing:${CONTRACT}`).toBe(true);
    const contract = readJson(CONTRACT);
    // The rule: all ten green, independent verification, countersign defaulting false, no self-close.
    // biome-ignore format: the closed promotion rule stays compact for the shard budget
    expect(contract.promotionRule).toEqual({ requiredGreenGates: 10, requiresIndependentVerifier: true, requiresHumanCountersign: true, humanCountersignDefault: false, writerMaySelfClose: false, writerMaySelfVerify: false, targetVerdict: PROMOTION_VERDICT, impliesProduction: false, gateAdditionAllowed: false });
    expect(contract.promotionRule.targetVerdict).not.toBe(FORBIDDEN_VERDICT);
    // biome-ignore format: the production non-equivalence is stated as an invariant, not implied
    expect(contract.invariants.some((line: string) => line.includes(PROMOTION_VERDICT) && line.includes(FORBIDDEN_VERDICT))).toBe(true);

    // Current truth: the Kernel consumer is stale, so GRP-01 is not GREEN and nothing promotes.
    const status = contract.currentStatus;
    // biome-ignore format: the current status is explicit about how far from promotion it stands
    expect(status).toMatchObject({ greenGates: 0, promotionAllowed: false, humanCountersign: false, independentVerifierRecorded: false, verdict: CURRENT_VERDICT });
    const grp01 = status.gates.find((gate: { id: string }) => gate.id === "GRP-01");
    expect(grp01.status, "grp-01-must-not-start-green").not.toBe("GREEN");
    expect(grp01.reason).toMatch(/stale/i);
    expect(grp01.reason).toMatch(/kernel/i);
    expect(status.gates.map((gate: { id: string }) => gate.id)).toEqual(GATE_IDS);

    // biome-ignore format: the missing-evaluator marker stays on one line
    expect(exists(EVALUATOR), `runtime-pilot-promotion-evaluator-missing:${EVALUATOR}`).toBe(true);
    const { evaluateRuntimePilotPromotion, freezeDigest } = await load(EVALUATOR);
    // biome-ignore lint/suspicious/noExplicitAny: each mutation edits one field of an untyped submission.
    const evaluate = (mutate: (candidate: any) => void) => {
      const candidate = submission(contract.gateSetSha256);
      mutate(candidate);
      return evaluateRuntimePilotPromotion({ contract, submission: candidate });
    };
    // The positive control: without it every rejection below could be a validator that rejects
    // everything, which proves nothing.
    const clean = evaluate(() => {});
    expect(clean.errors, "clean-submission-rejected").toEqual([]);
    expect([clean.promotionAllowed, clean.verdict]).toEqual([true, PROMOTION_VERDICT]);

    // Fail-closed negatives against a valid contract. Each names the one thing it broke.
    // biome-ignore format: the single-field fail-closed matrix stays compact for the shard budget
    // biome-ignore lint/suspicious/noExplicitAny: each mutation edits one field of an untyped submission.
    const NEGATIVES: Array<[string, string, (candidate: any) => void]> = [
      ["unknown gate", "unknown-gate:GRP-11", (c) => { c.gates.push({ id: "GRP-11", status: "GREEN", evidenceRefs: [] }); }],
      ["missing gate", "missing-gate:GRP-05", (c) => { c.gates = c.gates.filter((gate: { id: string }) => gate.id !== "GRP-05"); }],
      ["duplicate gate", "duplicate-gate:GRP-03", (c) => { c.gates.push({ ...c.gates[2] }); }],
      ["gate not green", "gate-not-green:GRP-01", (c) => { c.gates[0].status = "RED"; }],
      ["freeze hash drift", "gate-set-hash-drift", (c) => { c.gateSetSha256 = "0".repeat(64); }],
      ["authority mismatch", "authority-head-mismatch", (c) => { c.chainHeadEntrySha256 = "1".repeat(64); }],
      ["actionplan pin drift", "actionplan-commit-mismatch", (c) => { c.actionplanCommit = "2".repeat(40); }],
      ["kernel pin drift", "kernel-commit-mismatch", (c) => { c.kernelCommit = "3".repeat(40); }],
      ["self verification", "self-verification", (c) => { c.independentVerifier = { id: c.writer.id, independentOfWriter: false }; }],
      ["missing countersign", "countersign-missing", (c) => { c.humanCountersign = { signed: false }; }],
      ["production overreach", "production-promotion-claimed", (c) => { c.targetVerdict = FORBIDDEN_VERDICT; }],
    ];
    for (const [label, reason, mutate] of NEGATIVES) {
      const result = evaluate(mutate);
      expect(result.errors, `fail-closed-reason-missing:${label}`).toContain(reason);
      expect(result.promotionAllowed, `promoted-despite:${label}`).toBe(false);
    }
    // An omitted countersign defaults to unsigned rather than to signed.
    // biome-ignore format: the absent-countersign default stays compact for the shard budget
    expect(evaluate((c) => { c.humanCountersign = undefined; }).errors).toContain("countersign-missing");

    // Contract-level forgery: the CONTRACT and the submission are mutated TOGETHER, so
    // submission-vs-contract equality still holds and only the evaluator's own pins can catch it.
    // biome-ignore lint/suspicious/noExplicitAny: the forgery edits untyped contract and submission JSON.
    const forge = (mutate: (forged: any, candidate: any) => void) => {
      const forged = JSON.parse(JSON.stringify(contract));
      const candidate = submission(forged.gateSetSha256);
      mutate(forged, candidate);
      candidate.gateSetSha256 = forged.gateSetSha256;
      return evaluateRuntimePilotPromotion({ contract: forged, submission: candidate });
    };
    // Each forgery rehashes or restates whatever the contract would use to vouch for itself, so a
    // self-referential evaluator would promote every one of them.
    // biome-ignore format: the contract-forgery matrix stays compact for the shard budget
    // biome-ignore lint/suspicious/noExplicitAny: the forgery edits untyped contract and submission JSON.
    const FORGERIES: Array<[string, string, (forged: any, candidate: any) => void]> = [
      ["actionplan pin forged", "contract-authority-mismatch:actionplanCommit", (f, c) => { f.authorityBinding.actionplanCommit = "9".repeat(40); c.actionplanCommit = f.authorityBinding.actionplanCommit; }],
      ["authority head forged", "contract-authority-mismatch:chainHeadEntrySha256", (f, c) => { f.authorityBinding.chainHeadEntrySha256 = "9".repeat(64); c.chainHeadEntrySha256 = f.authorityBinding.chainHeadEntrySha256; }],
      ["chain digest forged", "contract-authority-mismatch:chainSha256", (f) => { f.authorityBinding.chainSha256 = "9".repeat(64); }],
      ["chain head seq forged", "contract-authority-mismatch:chainHeadSeq", (f) => { f.authorityBinding.chainHeadSeq = 5; }],
      ["kernel pin forged", "contract-authority-mismatch:kernelCommit", (f, c) => { f.authorityBinding.kernelCommit = "9".repeat(40); c.kernelCommit = f.authorityBinding.kernelCommit; }],
      ["current verdict forged", "contract-authority-mismatch:currentVerdict", (f) => { f.authorityBinding.currentVerdict = FORBIDDEN_VERDICT; }],
      ["gate redefined and rehashed", "contract-gate-set-drift", (f) => { f.gates[0].definition = "whatever the writer prefers"; f.gateSetSha256 = freezeDigest(f.gates); }],
      ["gate set reordered and rehashed", "contract-gate-set-drift", (f) => { const [a, b] = [f.gates[0], f.gates[1]]; f.gates[0] = { ...b, order: 1 }; f.gates[1] = { ...a, order: 2 }; f.gateSetSha256 = freezeDigest(f.gates); }],
      ["eleventh gate appended and rehashed", "contract-gate-set-drift", (f) => { f.gates.push({ order: 11, id: "GRP-11", definition: "late addition" }); f.gateSetSha256 = freezeDigest(f.gates); }],
      ["gate dropped and rehashed", "contract-gate-set-drift", (f) => { f.gates = f.gates.slice(0, 9); f.gateSetSha256 = freezeDigest(f.gates); }],
      ["self-closure permitted by contract", "self-closure-permitted", (f) => { f.promotionRule.writerMaySelfClose = true; }],
    ];
    for (const [label, reason, mutate] of FORGERIES) {
      const result = forge(mutate);
      expect(result.errors, `contract-forgery-accepted:${label}`).toContain(reason);
      expect(result.promotionAllowed, `promoted-despite:${label}`).toBe(false);
    }
    // The rehashed gate forgeries are INTERNALLY CONSISTENT: their digest really is the digest of
    // their own gate list. Proving the self-consistency check stays silent shows the semantic pin,
    // not that check, is what refused them.
    // biome-ignore format: internal consistency survives; semantic drift does not
    const rehashed = forge((f) => { f.gates[0].definition = "whatever the writer prefers"; f.gateSetSha256 = freezeDigest(f.gates); });
    expect(rehashed.errors, "caught-by-self-consistency").not.toContain("contract-freeze-drift");
    expect(rehashed.errors).toContain("contract-gate-set-hash-drift");
    // The forgery harness is not rejecting everything on its own: an unmutated forge promotes.
    expect(forge(() => {}).errors, "forge-harness-rejects-clean-contract").toEqual([]);
    // Finally, the live contract evaluated against its own current status does not promote today.
    // biome-ignore format: today's evaluation is refused on the stale Kernel consumer
    const today = evaluateRuntimePilotPromotion({ contract, submission: { ...submission(contract.gateSetSha256), gates: status.gates, humanCountersign: { signed: false } } });
    expect(today.promotionAllowed, "promoted-with-stale-kernel-consumer").toBe(false);
    expect(today.verdict).toBeNull();
  });

  it("classifies later topics into three buckets and names the next change package", async () => {
    // biome-ignore format: the missing-contract marker stays on one line
    expect(exists(CONTRACT), `runtime-pilot-promotion-contract-missing:${CONTRACT}`).toBe(true);
    const contract = readJson(CONTRACT);
    // A later topic is evidence for an existing gate, post-pilot backlog, or an explicit production
    // blocker. It is never a new promotion gate.
    // biome-ignore format: the closed later-topic policy stays compact for the shard budget
    expect(contract.laterTopicPolicy).toEqual({ classifications: CLASSIFICATIONS, newGateAllowed: false, gateSetClosedAt: 10 });
    // biome-ignore format: the missing-evaluator marker stays on one line
    expect(exists(EVALUATOR), `runtime-pilot-promotion-evaluator-missing:${EVALUATOR}`).toBe(true);
    const { classifyLaterTopic } = await load(EVALUATOR);
    // Each allowed classification is accepted and resolves to no new gate.
    // biome-ignore format: the accepted classification sweep stays compact for the shard budget
    for (const classification of CLASSIFICATIONS) expect(classifyLaterTopic({ topic: "late finding", classification }), `classification-rejected:${classification}`).toEqual({ errors: [], classification, createsGate: false });
    // A fourth classification, and an explicit attempt to mint a gate, are both refused.
    // biome-ignore format: a gate-minting request is named rather than silently folded into a bucket
    expect(classifyLaterTopic({ topic: "late finding", classification: "new-promotion-gate" }).errors).toContain("new-promotion-gate-forbidden");
    // biome-ignore format: an unrecognised bucket fails closed instead of defaulting to backlog
    expect(classifyLaterTopic({ topic: "late finding", classification: "nice-to-have" }).errors).toContain("unknown-classification:nice-to-have");

    // The contract hands off rather than absorbing: Kernel consumer sync is the next package, kept
    // separate, and it is what GRP-01 currently waits on.
    // biome-ignore format: the closed next-package handoff stays compact for the shard budget
    expect(contract.nextChangePackage).toMatchObject({ subject: "kernel-consumer-sync", separatePackage: true, blocksGate: "GRP-01", includedInThisPackage: false });
    expect(contract.nextChangePackage.reason).toMatch(/stale/i);
    // Non-goals are explicit: this contract promotes nothing and opens no production path.
    // biome-ignore format: the promotion and production non-goals stay compact for the shard budget
    expect(contract.nonGoals.some((line: string) => /promot/i.test(line))).toBe(true);
    // biome-ignore format: no production opening is claimed anywhere in the non-goals
    expect(contract.nonGoals.some((line: string) => new RegExp(FORBIDDEN_VERDICT, "i").test(line) || /production/i.test(line))).toBe(true);
    expect(contract.rollback.runtimeDataImpact).toBe("none");
  });
});
