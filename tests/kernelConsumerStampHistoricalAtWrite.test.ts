import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

// Scope, stated exactly. A consumer provenance stamp is historical-at-write: it names the sealed
// entry that governed when the record was authored, never "whatever currently heads the chain".
// This gate proves three things and no more:
//   1. no consumer test asserts its stamp against the live head (decoupling),
//   2. every recorded stamp still RESOLVES to the same sealed entry when a seq-4 entry is appended,
//   3. and that resolving is NOT governing, shown explicitly rather than left as a caveat.
// Whether a resolved stamp is still IN FORCE is the separate stampGoverns question in
// tools/lib/kernel-effective-authority-chain.mjs: the boundary derived at the stamped entry must
// equal the boundary in force now. The third test mirrors that predicate and proves both outcomes —
// every stamp governs under the live chain, and none governs under the synthetic seq-4 chain, which
// is precisely the recorded consumer re-stamp prerequisite. This file changes no library, appends no
// entry and never claims a superseded stamp still governs or that EPOCH-04 is in force.
const ROOT = process.cwd();
const CHAIN = "reports/kernel-effective-authority-chain-2026-07-31.json";
const CHAIN_LIB = "tools/lib/kernel-effective-authority-chain.mjs";
const ACTIVATION = "reports/kernel-epoch-04-activation-2026-08-02.json";
// biome-ignore format: the closed consumer test-to-report registry stays compact for the shard budget
const CONSUMERS: Array<[string, string]> = [
  ["tests/kernelAdrIdentityQuarantine.test.ts", "reports/kernel-adr-identity-quarantine-2026-08-02.json"],
  ["tests/kernelEarlyMinimalDbSubstrate.test.ts", "reports/kernel-early-minimal-db-substrate-2026-08-02.json"],
  ["tests/kernelGhostWbsIdentityRejection.test.ts", "reports/kernel-ghost-wbs-identity-rejection-2026-08-02.json"],
  ["tests/kernelModuleRegistryOwnershipSplitHandoff.test.ts", "reports/kernel-module-registry-ownership-split-handoff-2026-08-01.json"],
  ["tests/kernelRelationDirectionConflictDisposition.test.ts", "reports/kernel-relation-direction-conflict-disposition-2026-08-02.json"],
  ["tests/kernelScaffoldWalkingSkeletonExitSemantics.test.ts", "reports/kernel-scaffold-walking-skeleton-exit-semantics-2026-08-01.json"],
  ["tests/kernelTenancyPhysicalStrategyDisposition.test.ts", "reports/kernel-tenancy-physical-strategy-selection-2026-08-02.json"],
  ["tests/kernelUnownedDirectiveOwnershipDisposition.test.ts", "reports/kernel-unowned-directive-ownership-disposition-2026-08-01.json"],
];
// Already historical-at-write at seq 2, kept so the resolver is proven against non-head stamps too.
// biome-ignore format: the seq-2 consumer reports stay compact for the shard budget
const SEQ2_CONSUMERS = ["reports/kernel-surface-dependency-order-handoff-2026-08-01.json", "reports/kernel-code-bearing-descendant-handoff-2026-07-15.json"];
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const readJson = (relative: string) => JSON.parse(read(relative));
// biome-ignore lint/suspicious/noExplicitAny: the shipped pure JavaScript validator has no declaration file.
const load = async (relative: string): Promise<any> =>
  import(pathToFileURL(path.join(ROOT, relative)).href);
type Entry = {
  seq: number;
  entrySha256: string;
  normalizedTextSha256?: string;
  normalizedTextRef?: { sha256: string };
};
type Stamp = { ref: string; seq: number; chainHeadSha256: string; normalizedTextSha256: string };
const resolve = (entries: Entry[], stamp: Stamp) =>
  entries.find((entry) => entry.entrySha256 === stamp.chainHeadSha256);
const sealedText = (entry: Entry | undefined) =>
  entry?.normalizedTextSha256 ?? entry?.normalizedTextRef?.sha256;

// A falsifiable predicate, so every negative below is a real rejection rather than a comparison that
// could never have been true. It answers only: does this stamp resolve to a sealed entry at or below
// the live head, and does it mirror that entry exactly? It does NOT answer whether it still governs.
const stampErrors = (entries: Entry[], stamp: Stamp, headSeq: number): string[] => {
  const errors: string[] = [];
  if (stamp.ref !== CHAIN) errors.push("stamp-ref-drift");
  const entry = resolve(entries, stamp);
  if (!entry) return [...errors, "stamp-unresolvable"];
  if (entry.seq > headSeq) errors.push("stamp-above-live-head");
  if (stamp.seq !== entry.seq) errors.push("stamp-seq-mismatch");
  if (stamp.normalizedTextSha256 !== sealedText(entry)) errors.push("stamp-text-digest-mismatch");
  return errors;
};

// The head-reading forms the chain document exposes. Reading any of these to BUILD a stamp couples
// the consumer to the head. Bounding a resolved stamp at or below the head is a different thing and
// is explicitly whitelisted below, because it constrains the stamp instead of copying the head.
// biome-ignore format: the closed head-coupling token set stays compact for the shard budget
const COUPLED = ["chainHeadSeq", "chainHeadEntrySha256", "entries.at(-1)", "entries[chain.entries.length - 1]"];
// biome-ignore format: full-line comments are dropped so commented-out code is never flagged
const stripComments = (source: string) => source.split("\n").filter((line) => !line.trim().startsWith("//")).join("\n");
// biome-ignore format: the balanced-paren reader stays compact for the shard budget
const balanced = (text: string, open: number) => { let depth = 0; for (let i = open; i < text.length; i += 1) { if (text[i] === "(") depth += 1; else if (text[i] === ")") { depth -= 1; if (depth === 0) return { body: text.slice(open + 1, i), end: i }; } } return { body: "", end: text.length }; };
// EVERY equality assertion made on provenance.effectiveAuthority — the object or one of its fields —
// not just the first mention of that path. Anchoring on the first mention let a resolver line shadow
// a later re-coupled assertion, so each expect() call site is read independently and its matcher body
// collected, multiline included.
// The whitelist is the matcher set, stated once: only these four EQUALITY matchers are collected.
// `toBeLessThanOrEqual(chain.chainHeadSeq)` — the legitimate "at or below the live head" bound — is
// not one of them and is therefore never flagged. `toBe(` cannot match `toBeLessThanOrEqual(` or
// `toBeDefined(` because the open paren must follow immediately. Whitelisting the bound does not
// weaken the future-head prohibition: that prohibition is enforced by the bound itself and, at
// runtime, by the stamp-above-live-head rejection in stampErrors.
// Dot access and bracket access are the same read written two ways, so both forms of the one-level
// field step are matched; otherwise `effectiveAuthority["seq"]` would slip past a dot-only pattern.
const STAMP_PATH =
  /\.provenance\.effectiveAuthority(\.[A-Za-z0-9_]+|\[\s*["'][A-Za-z0-9_]+["']\s*\])?\s*$/;
const EQUALITY = /^\s*\.(toBe|toEqual|toMatchObject|toStrictEqual)\(/;
const stampAssertions = (source: string): string[] => {
  const text = stripComments(source).replace(/\s+/g, " ");
  const bodies: string[] = [];
  for (let i = text.indexOf("expect("); i !== -1; i = text.indexOf("expect(", i + 1)) {
    const arg = balanced(text, i + 6);
    if (!STAMP_PATH.test(arg.body)) continue;
    const tail = text.slice(arg.end + 1, arg.end + 1400);
    if (!EQUALITY.test(tail)) continue;
    bodies.push(balanced(tail, tail.indexOf("(")).body);
  }
  return bodies;
};
const coupledIn = (source: string) =>
  stampAssertions(source).some((body) => COUPLED.some((token) => body.includes(token)));

describe("consumer provenance stamps are historical-at-write", () => {
  it("never couples a consumer stamp assertion to the live chain head", () => {
    expect(CONSUMERS).toHaveLength(8);
    for (const [test, report] of CONSUMERS) {
      expect(fs.existsSync(path.join(ROOT, test)), `consumer-test-missing:${test}`).toBe(true);
      expect(fs.existsSync(path.join(ROOT, report)), `consumer-report-missing:${report}`).toBe(
        true,
      );
    }
    // The detector is proven on realistic sources first: resolver line present, assertion later, and
    // the legitimate `stamp.seq <= chain.chainHeadSeq` bound present in the clean forms.
    // biome-ignore format: the realistic coupling-detector matrix stays compact for the shard budget
    const RESOLVER = 'const stamp = chain.entries.find((entry: { entrySha256: string }) => entry.entrySha256 === report.provenance.effectiveAuthority.chainHeadSha256);\n    expect(stamp, "consumer-stamp-unresolvable").toBeDefined();\n    expect(stamp.seq).toBeLessThanOrEqual(chain.chainHeadSeq);\n    ';
    // biome-ignore format: the adversarial and clean realistic forms stay compact
    const PROBE: Array<[string, boolean]> = [
      // Resolver first, then a RE-COUPLED assertion: the exact bypass the first detector missed.
      [`${RESOLVER}expect(report.provenance.effectiveAuthority).toMatchObject({ ref: CHAIN, seq: chain.chainHeadSeq, chainHeadSha256: chain.chainHeadEntrySha256 });`, true],
      // Resolver first, then a re-coupled assertion split across lines.
      [`${RESOLVER}expect(report.provenance.effectiveAuthority).toMatchObject({\n      ref: CHAIN,\n      normalizedTextSha256: chain.entries.at(-1).normalizedTextSha256,\n    });`, true],
      // The clean realistic form this PR introduces: resolver, legal head bound, entry-mirroring assertion.
      [`${RESOLVER}expect(report.provenance.effectiveAuthority).toMatchObject({ ref: CHAIN, seq: stamp.seq, chainHeadSha256: stamp.entrySha256, normalizedTextSha256: stamp.normalizedTextSha256 });`, false],
      // Clean, multiline, with the legal bound still present: must not be flagged.
      [`${RESOLVER}expect(report.provenance.effectiveAuthority).toMatchObject({\n      ref: CHAIN,\n      seq: stamp.seq,\n      chainHeadSha256: stamp.entrySha256,\n    });`, false],
      // A commented-out coupled assertion is dead code, not a violation.
      [`${RESOLVER}// expect(report.provenance.effectiveAuthority).toMatchObject({ seq: chain.chainHeadSeq });`, false],
      // Coupling with no resolver at all is still coupling.
      ["expect(report.provenance.effectiveAuthority).toMatchObject({ seq: chain.chainHeadSeq });", true],
      // Field-level coupling: asserting the stamped seq EQUALS the head is the same violation
      // written one property deeper, and must not escape by dodging the object matcher.
      [`${RESOLVER}expect(report.provenance.effectiveAuthority.seq).toBe(chain.chainHeadSeq);`, true],
      // The same field-level coupling written with bracket access, which a dot-only path would miss.
      [`${RESOLVER}expect(report.provenance.effectiveAuthority["seq"]).toBe(chain.chainHeadSeq);`, true],
      // And a field-level equality against the head digest, to prove the whole token set is covered.
      [`${RESOLVER}expect(report.provenance.effectiveAuthority.chainHeadSha256).toEqual(chain.chainHeadEntrySha256);`, true],
      // The one whitelisted head read: BOUNDING the stamped seq at or below the head. A bound is not
      // an equality coupling, and it is what keeps a future-head stamp rejected, so it stays legal.
      ["expect(report.provenance.effectiveAuthority.seq).toBeLessThanOrEqual(chain.chainHeadSeq);", false],
    ];
    // biome-ignore format: the detector driver stays compact for the shard budget
    for (const [snippet, flagged] of PROBE) expect(coupledIn(snippet), snippet.slice(-90)).toBe(flagged);
    // The detector must actually see an assertion in every real consumer, or it is vacuous.
    // biome-ignore format: every consumer must expose at least one collected stamp assertion
    for (const [test] of CONSUMERS) expect(stampAssertions(read(test)).length, `stamp-assertion-undetected:${test}`).toBeGreaterThan(0);

    // biome-ignore format: every coupled consumer is reported by exact path for a one-look diagnosis
    const coupled = CONSUMERS.filter(([test]) => coupledIn(read(test))).map(([test]) => `consumer-stamp-live-head-coupled:${test}`);
    expect(coupled).toEqual([]);
    // biome-ignore format: and each consumer must resolve by digest rather than merely avoid the tokens
    for (const [test] of CONSUMERS) expect(read(test), `consumer-stamp-resolver-missing:${test}`).toContain("entrySha256 === ");
  });

  it("keeps every stamp resolvable to its own sealed entry under a synthetic seq-4 successor", async () => {
    const chain = readJson(CHAIN);
    const { entryDigest } = await load(CHAIN_LIB);
    const live: Entry[] = chain.entries;
    const headSeq: number = chain.chainHeadSeq;
    // The successor is assembled in memory only; the chain file on disk is never touched, the entry
    // is never appended, and no claim is made that it is in force.
    const successor = readJson(ACTIVATION).successorEntry;
    expect(successor.entrySha256).toBe(entryDigest(successor));
    const seq4: Entry[] = [...live, successor];
    expect([live.length, seq4.length, headSeq]).toEqual([3, 4, 3]);

    const reports = [...CONSUMERS.map(([, report]) => report), ...SEQ2_CONSUMERS];
    for (const report of reports) {
      const stamp: Stamp = readJson(report).provenance.effectiveAuthority;
      // Resolves cleanly today, and resolves to the identical sealed entry once seq 4 exists.
      expect(stampErrors(live, stamp, headSeq), `stamp-invalid-under-live-head:${report}`).toEqual(
        [],
      );
      expect(stampErrors(seq4, stamp, headSeq), `unresolvable-under-seq4:${report}`).toEqual([]);
      expect(resolve(seq4, stamp), `stamp-moved-under-seq4:${report}`).toEqual(
        resolve(live, stamp),
      );
      // The stamp names a predecessor, never the appended successor: it did not follow the head.
      expect(resolve(seq4, stamp)?.seq, `stamp-followed-head-under-seq4:${report}`).toBeLessThan(4);
    }
    // Non-vacuity: two consumers are sealed at seq 2, so the resolver is genuinely digest-driven
    // rather than accidentally agreeing with whatever currently heads the chain.
    expect(
      [...new Set(reports.map((r) => readJson(r).provenance.effectiveAuthority.seq))].sort(),
    ).toEqual([2, 3]);

    // Falsifiable rejections. Each mutation is applied to a real stamp and must produce its exact
    // error, so none of these can pass for a reason unrelated to what it claims to test.
    const base: Stamp = readJson(CONSUMERS[0][1]).provenance.effectiveAuthority;
    const entry = resolve(live, base) as Entry;
    // biome-ignore format: the falsifiable stamp-rejection matrix stays compact for the shard budget
    const REJECT: Array<[string, Stamp, Entry[], string[]]> = [
      ["forged digest", { ...base, chainHeadSha256: "0".repeat(64) }, seq4, ["stamp-unresolvable"]],
      ["blank digest", { ...base, chainHeadSha256: "" }, seq4, ["stamp-unresolvable"]],
      ["wrong seq", { ...base, seq: entry.seq + 1 }, seq4, ["stamp-seq-mismatch"]],
      ["wrong normalized text", { ...base, normalizedTextSha256: "0".repeat(64) }, seq4, ["stamp-text-digest-mismatch"]],
      ["wrong ref", { ...base, ref: ACTIVATION }, seq4, ["stamp-ref-drift"]],
      // A stamp naming the not-yet-appended successor is unresolvable against the live chain...
      ["successor under live head", { ...base, chainHeadSha256: successor.entrySha256 }, live, ["stamp-unresolvable"]],
      // ...and against a seq-4 chain it resolves but sits above the live head, so it still rejects.
      ["future head above live head", { ...base, seq: 4, normalizedTextSha256: successor.normalizedTextSha256, chainHeadSha256: successor.entrySha256 }, seq4, ["stamp-above-live-head"]],
    ];
    // biome-ignore format: the rejection driver asserts the exact error set, not merely truthiness
    for (const [name, stamp, entries, expected] of REJECT) expect(stampErrors(entries, stamp, headSeq), name).toEqual(expected);
    // And the unmutated stamp still passes, so the matrix above is measuring the mutation.
    expect(stampErrors(seq4, base, headSeq)).toEqual([]);

    // The live chain is unchanged by this probe: still seq 3, still NO-GO, still unappended.
    // biome-ignore format: the unappended live head stays exactly where this gate found it
    expect([readJson(CHAIN).chainHeadSeq, readJson(CHAIN).effectiveAuthorityBoundary.verdict, readJson(ACTIVATION).chainBinding.appendExecutedHere]).toEqual([3, "NO-GO", false]);
  });

  it("proves stampGoverns is decided separately from resolution under the seq-4 successor", async () => {
    const chain = readJson(CHAIN);
    const { deriveAuthorityBoundary } = await load(CHAIN_LIB);
    const live: Entry[] = chain.entries;
    const seq4: Entry[] = [...live, readJson(ACTIVATION).successorEntry];
    // stampGoverns, mirrored from tools/lib/kernel-effective-authority-chain.mjs: the boundary
    // derived from the chain prefix ending at the stamped entry must derive cleanly AND equal the
    // boundary in force now. An unresolvable stamp or an erroring derivation is a rejection.
    const governs = (entries: Entry[], stamp: Stamp) => {
      const index = entries.indexOf(resolve(entries, stamp) as Entry);
      if (index < 0) return false;
      const at = deriveAuthorityBoundary({ entries: entries.slice(0, index + 1) });
      const force = deriveAuthorityBoundary({ entries });
      return !at.errors.length && JSON.stringify(at.boundary) === JSON.stringify(force.boundary);
    };
    const reports = [...CONSUMERS.map(([, report]) => report), ...SEQ2_CONSUMERS];
    for (const report of reports) {
      const stamp: Stamp = readJson(report).provenance.effectiveAuthority;
      // Today every stamp both resolves and governs — the seq-2 ones included, which is why the
      // EPOCH-03 append did not invalidate them: it left the derived boundary byte-identical.
      expect(governs(live, stamp), `stamp-not-in-force-today:${report}`).toBe(true);
      // Under the synthetic seq-4 chain the identical sealed entry still resolves...
      // biome-ignore format: resolution is unchanged by the append, which is the historical-at-write claim
      expect(resolve(seq4, stamp), `stamp-resolution-changed-under-seq4:${report}`).toEqual(resolve(live, stamp));
      // ...but it stops governing: EPOCH-04 supersedes codeStart, runtimeCode and verdict, so the
      // boundary in force moves and every earlier stamp must be re-stamped. Resolution is not
      // governance, and this gate never claims a superseded stamp is still in force.
      expect(governs(seq4, stamp), `stamp-still-governing-under-seq4:${report}`).toBe(false);
    }
    // The recorded append prerequisite this behavior implements, bound so the two cannot drift.
    // biome-ignore format: the consumer re-stamp prerequisite stays compact for the shard budget
    expect(readJson(ACTIVATION).chainBinding.appendPrerequisites.consumerRestamp).toContain("stampGoverns");
    // Non-vacuity, both rejection arms and the exact cause of the seq-4 rejection.
    const base: Stamp = readJson(reports[0]).provenance.effectiveAuthority;
    // Arm 1, unresolvable: a forged digest names no sealed entry, so nothing can govern.
    expect(governs(live, { ...base, chainHeadSha256: "0".repeat(64) })).toBe(false);
    // Arm 1 again, erroring derivation: the genesis prefix does not derive a complete boundary.
    expect(governs(live, { ...base, chainHeadSha256: live[0].entrySha256 })).toBe(false);
    // Arm 2, boundary move: for the seq-3 stamps above, the prefix DOES derive cleanly, so it is the
    // comparison against the boundary in force that rejects them — not a derivation failure.
    expect(deriveAuthorityBoundary({ entries: live }).errors).toEqual([]);
    // And the seq-4 boundary in force is not merely different, it is not yet derivable: the three
    // superseded dimensions are unmapped, exactly as the recorded boundaryMapExtension prerequisite
    // states. That is why this gate proves the append is blocked, never that EPOCH-04 is in force.
    // biome-ignore format: the exact unmapped successor dimensions stay compact for the shard budget
    expect(deriveAuthorityBoundary({ entries: seq4 }).errors).toEqual(["derived-boundary-unmapped:codeStart:YES", "derived-boundary-unmapped:runtimeCode:YES", "derived-boundary-unmapped:verdict:GO-KERNEL-DEVELOPMENT-ONLY"]);
    // biome-ignore format: the recorded boundary-map prerequisite stays compact for the shard budget
    expect(readJson(ACTIVATION).chainBinding.appendPrerequisites.boundaryMapExtension).toContain("derived-boundary-unmapped");
    // The live chain is untouched by this probe: still seq 3, still unappended.
    // biome-ignore format: the unappended live head stays exactly where this gate found it
    expect([readJson(CHAIN).chainHeadSeq, readJson(ACTIVATION).chainBinding.appendExecutedHere]).toEqual([3, false]);
  });
});
