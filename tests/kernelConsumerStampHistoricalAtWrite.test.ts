import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

// A consumer provenance stamp is historical-at-write: it names the sealed entry that governed when
// the record was authored, never whatever heads the chain now. Every tests/*.test.ts mentioning
// effectiveAuthority is discovered and must fall in exactly one tier, so the registry is closed:
// Tier1 CONSUMERS resolve a stamp by sealed digest (resolver and assertion checks apply); PINNED pin
// a sealed epoch by token; HEAD_TRACKING is root-level state bound to the head with no stamp at all.
// Tier1 and PINNED may not couple to the head; only Tier1 must resolve. Proven here: (1) no Tier1 or
// PINNED test asserts against the head, (2) every stamp still RESOLVES to its sealed entry under an
// appended seq-4, (3) resolving is NOT governing — that is stampGoverns in
// tools/lib/kernel-effective-authority-chain.mjs, mirrored by the third test. No library is changed
// and no entry is appended.
const ROOT = process.cwd();
const CHAIN = "reports/kernel-effective-authority-chain-2026-07-31.json";
const CHAIN_LIB = "tools/lib/kernel-effective-authority-chain.mjs";
const ACTIVATION = "reports/kernel-epoch-04-activation-2026-08-02.json";
const SELF = "tests/kernelConsumerStampHistoricalAtWrite.test.ts";
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
// Tier 2, PINNED: these read effectiveAuthority but pin a sealed epoch by an explicit token rather
// than resolving a stamp, so resolver and assertion checks do not apply. They still may not couple
// to the live head, and each must keep its exact pin.
// biome-ignore format: the closed pinned-epoch registry stays compact for the shard budget
const PINNED: Array<[string, string]> = [
  ["tests/kernelCodeBearingDescendantHandoff.test.ts", "entry.seq === 2"],
  ["tests/kernelEffectiveAuthorityChain.test.ts", "EPOCH02_ENTRY_SHA256"],
  ["tests/kernelRuntimeSuccessorPolicy.test.ts", "EPOCH02_ENTRY_SHA256"],
  ['tests/kernelSurfaceDependencyOrderHandoff.test.ts', 'epochId === "AUTHORITY-SUPERSESSION-02"'],
];
// Tier 3, HEAD_TRACKING: the application-state ledger is root-level state deliberately bound to the
// head. It carries no provenance stamp at all — asserted below, not assumed — so it is correctly
// outside the rule rather than an unexplained exemption.
const HEAD_TRACKING = ["tests/kernelGovernanceApplicationState.test.ts"];
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
// could never have been true. It answers only whether the stamp resolves to a sealed entry at or
// below the head and mirrors it exactly; it does NOT answer whether it still governs.
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

// Head reads the chain document exposes, plus equivalent index forms. Reading any of these to BUILD
// a stamp couples to the head; BOUNDING a resolved stamp at or below it stays legal.
// biome-ignore format: the closed head-coupling token set stays compact for the shard budget
const COUPLED = ["chainHeadSeq", "chainHeadEntrySha256", "entries.at(-1)", "entries[chain.entries.length - 1]", "entries[chain.chainHeadSeq - 1]", "entries.slice(-1)", "entries.findLast("];
// Comment handling, stated exactly and now true: one pass removes block and line comments in code,
// while `//` inside a quoted string or template literal is preserved, so a URL in an assertion is
// never mistaken for a comment. Escapes are honoured in code and strings, which also stops a regex
// literal such as `\//` opening a phantom comment. A trailing `// ...` is therefore truly removed.
// biome-ignore format: the comment stripper state machine stays compact for the shard budget
const stripComments = (source: string): string => {
  let out = ""; let mode = "code";
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i]; const next = source[i + 1] ?? "";
    if (mode === "line") { if (ch === "\n") { mode = "code"; out += ch; } continue; }
    if (mode === "block") { if (ch === "\n") out += ch; else if (ch === "*" && next === "/") { mode = "code"; i += 1; } continue; }
    if (mode !== "code") { out += ch; if (ch === "\\") { out += next; i += 1; } else if (ch === mode) mode = "code"; continue; }
    if (ch === "\\") { out += ch + next; i += 1; continue; }
    if (ch === "/" && next === "/") { mode = "line"; continue; }
    if (ch === "/" && next === "*") { mode = "block"; continue; }
    if (ch === "'" || ch === '"' || ch === "`") mode = ch;
    out += ch;
  }
  return out;
};
// Optional chaining and non-null assertions are the same read written differently, so they are
// normalised away before the path is matched rather than being three separate patterns.
const normalise = (text: string) => text.replace(/\?\./g, ".").replace(/!/g, "");
// biome-ignore format: the balanced-paren reader stays compact for the shard budget
const balanced = (text: string, open: number) => { let depth = 0; for (let i = open; i < text.length; i += 1) { if (text[i] === "(") depth += 1; else if (text[i] === ")") { depth -= 1; if (depth === 0) return { body: text.slice(open + 1, i), end: i }; } } return { body: "", end: text.length }; };
// expect(value, "message") must be judged on `value`: only the first top-level argument is the
// subject, so a message argument can never push the path off the end of the anchored pattern.
// biome-ignore format: the first-argument splitter stays compact for the shard budget
const firstArg = (body: string) => { let depth = 0; for (let i = 0; i < body.length; i += 1) { const ch = body[i]; if ("([{".includes(ch)) depth += 1; else if (")]}".includes(ch)) depth -= 1; else if (ch === "," && depth === 0) return body.slice(0, i); } return body; };
// A head read stored in a local and used later is the same coupling one step removed, so simple
// head-derived aliases are collected and treated as head tokens for that source.
// biome-ignore format: the head-alias collector stays compact for the shard budget
const aliases = (text: string) => [...text.matchAll(/\b(?:const|let|var)\s+([A-Za-z0-9_]+)\s*=\s*([^;]+);/g)].filter((match) => COUPLED.some((token) => match[2].includes(token))).map((match) => match[1]);
// `(?:^|\.)` rather than a bare `\.`: a destructured `provenance.effectiveAuthority` is the same read
// and must be detected, while `myprovenance.effectiveAuthority` and `state.effectiveAuthority` are not.
// biome-ignore format: the stamp path pattern stays compact for the shard budget
const STAMP_PATH = /(?:^|\.)provenance\.effectiveAuthority(\.[A-Za-z0-9_]+|\[\s*["'][A-Za-z0-9_]+["']\s*\])?\s*$/;
// Matchers that PIN the stamp to a value. Equality pins directly; a lower bound pins from below,
// because `toBeGreaterThanOrEqual(head)` alongside the legal `toBeLessThanOrEqual(head)` forces
// seq === head, which is the coupling written as two inequalities. `toBeLessThanOrEqual` alone
// stays legal: it bounds the stamp without fixing it to the head. Matcher-side modifiers such as
// `.not` and `.resolves` are deliberately out of scope; nothing here depends on them.
// biome-ignore format: the closed pinning-matcher set stays compact for the shard budget
const PINNING = /^\s*\.(toBe|toEqual|toMatchObject|toStrictEqual|toBeGreaterThanOrEqual|toBeGreaterThan)\(/;
// The Vitest receiver, matched as a token rather than the literal text "expect(": `expect.soft(` and
// `expect (` are the same call, while `myexpect(` is a different function and must not be scanned.
const RECEIVER = /\bexpect(?:\.soft)?\s*\(/g;
// EVERY pinning assertion on provenance.effectiveAuthority — the object or one field — not just the
// first mention. The matcher is read from the character after the call closes, uncapped, so a long
// body cannot fail open.
const stampAssertions = (source: string): string[] => {
  const text = normalise(stripComments(source)).replace(/\s+/g, " ");
  const bodies: string[] = [];
  RECEIVER.lastIndex = 0;
  for (let hit = RECEIVER.exec(text); hit !== null; hit = RECEIVER.exec(text)) {
    const arg = balanced(text, hit.index + hit[0].length - 1);
    if (!STAMP_PATH.test(firstArg(arg.body))) continue;
    const tail = text.slice(arg.end + 1);
    const matcher = PINNING.exec(tail);
    if (!matcher) continue;
    bodies.push(balanced(tail, matcher[0].length - 1).body);
  }
  return bodies;
};
const coupledIn = (source: string) => {
  const tokens = [...COUPLED, ...aliases(normalise(stripComments(source)))];
  return stampAssertions(source).some((body) => tokens.some((token) => body.includes(token)));
};

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
      // F3: a lower bound against the head pins the stamp from below. Combined with the legal upper
      // bound it forces seq === head, so both greater-than forms are coupling.
      ["expect(report.provenance.effectiveAuthority.seq).toBeGreaterThanOrEqual(chain.chainHeadSeq);", true],
      ["expect(report.provenance.effectiveAuthority.seq).toBeGreaterThan(chain.chainHeadSeq);", true],
      // F4: the receiver is matched as a token, so these are the same call and are scanned...
      [`${RESOLVER}expect.soft(report.provenance.effectiveAuthority).toMatchObject({ seq: chain.chainHeadSeq });`, true],
      [`${RESOLVER}expect (report.provenance.effectiveAuthority).toMatchObject({ seq: chain.chainHeadSeq });`, true],
      // ...while a different function that merely ends in "expect" is not scanned at all.
      ["myexpect(report.provenance.effectiveAuthority).toMatchObject({ seq: chain.chainHeadSeq });", false],
      // Destructuring the report does not change the read, so coupling through it is still caught.
      [`${RESOLVER}expect(provenance.effectiveAuthority).toMatchObject({ seq: chain.chainHeadSeq });`, true],
      // ...and the clean destructured form stays legal.
      [`${RESOLVER}expect(provenance.effectiveAuthority).toMatchObject({ seq: stamp.seq });`, false],
      // Lookalike paths are a different object and must never be flagged.
      ["expect(myprovenance.effectiveAuthority).toMatchObject({ seq: chain.chainHeadSeq });", false],
      ["expect(state.effectiveAuthority).toMatchObject({ seq: chain.chainHeadSeq });", false],
      // The two-argument form: a message argument must not push the path off the anchor.
      [`${RESOLVER}expect(report.provenance.effectiveAuthority, "stamp").toMatchObject({ seq: chain.chainHeadSeq });`, true],
      // Optional chaining and a trailing non-null assertion are the same read, normalised away.
      [`${RESOLVER}expect(report.provenance?.effectiveAuthority).toMatchObject({ seq: chain.chainHeadSeq });`, true],
      [`${RESOLVER}expect(report.provenance.effectiveAuthority!).toMatchObject({ seq: chain.chainHeadSeq });`, true],
      [`${RESOLVER}expect(report.provenance.effectiveAuthority?.seq).toBe(chain.chainHeadSeq);`, true],
      // A matcher body longer than any fixed scan window must not truncate and fail open: the old
      // 1400-character cap made balanced() return an empty body, so the coupling inside went unseen.
      [`${RESOLVER}expect(report.provenance.effectiveAuthority).toMatchObject({ note: "${"x".repeat(1500)}", seq: chain.chainHeadSeq });`, true],
      // Equivalent index forms of the same head read.
      [`${RESOLVER}expect(report.provenance.effectiveAuthority).toMatchObject({ normalizedTextSha256: chain.entries[chain.entries.length - 1].normalizedTextSha256 });`, true],
      [`${RESOLVER}expect(report.provenance.effectiveAuthority).toMatchObject({ seq: chain.entries.slice(-1)[0].seq });`, true],
      // A head read stored in a local first is the same coupling one step removed.
      [`const head = chain.chainHeadSeq;\n    ${RESOLVER}expect(report.provenance.effectiveAuthority).toMatchObject({ seq: head });`, true],
      // RED: dead code after a TRAILING // is still dead code and must not be flagged.
      [`${RESOLVER}expect(stamp.seq).toBe(2); // expect(report.provenance.effectiveAuthority).toMatchObject({ seq: chain.chainHeadSeq });`, false],
      // RED: but a // inside a string literal is not a comment, so the real coupling after it stands.
      [`${RESOLVER}expect(report.sourceRef).toBe("https://kernel.invalid/a"); expect(report.provenance.effectiveAuthority).toMatchObject({ seq: chain.chainHeadSeq });`, true],
      // A trailing // comment is a comment too: the assertion after it is real, the one inside is not.
      [`${RESOLVER}expect(stamp.seq).toBe(2); // expect(report.provenance.effectiveAuthority).toMatchObject({ seq: chain.chainHeadSeq });`, false],
      // But `//` inside a quoted string is not a comment, so the real assertion still counts.
      [`${RESOLVER}expect(report.provenance.effectiveAuthority).toMatchObject({ source: "https://kernel.test/a", seq: chain.chainHeadSeq });`, true],
      // A block-commented coupled assertion is dead code, matching the stripper's stated claim.
      [`${RESOLVER}/* expect(report.provenance.effectiveAuthority).toMatchObject({ seq: chain.chainHeadSeq }); */`, false],
      // A local that is NOT head-derived must not be mistaken for an alias.
      [`const wanted = stamp.seq;\n    ${RESOLVER}expect(report.provenance.effectiveAuthority).toMatchObject({ seq: wanted });`, false],
    ];
    // biome-ignore format: the detector driver stays compact for the shard budget
    expect(PROBE.filter(([snippet, flagged]) => coupledIn(snippet) !== flagged).map(([snippet]) => snippet.slice(-90))).toEqual([]);
    // A coupling sweep proves nothing where the detector sees no assertion, so the exact set of
    // readers it does see is asserted; the fixture builder pins a stamp rather than asserting one.
    // biome-ignore format: the registered readers the coupling sweep applies to stay compact
    const READERS = [...CONSUMERS.map(([t]) => t), ...PINNED.map(([t]) => t)];
    // biome-ignore format: the fixture builder is the only registered reader with no stamp assertion
    expect(READERS.filter((t) => stampAssertions(read(t)).length > 0).sort(), "stamp-assertion-undetected").toEqual(READERS.filter((t) => t !== "tests/kernelCodeBearingDescendantHandoff.test.ts").sort());

    // biome-ignore format: every coupled consumer is reported by exact path for a one-look diagnosis
    const coupled = CONSUMERS.filter(([test]) => coupledIn(read(test))).map(([test]) => `consumer-stamp-live-head-coupled:${test}`);
    expect(coupled).toEqual([]);
    // Discovery, not a hand-written list: any tests/*.test.ts mentioning effectiveAuthority is in
    // scope, so a reader cannot hide behind a different variable name. Comments are stripped and the
    // oracle excluded; the discovered set must close exactly over the three tiers.
    const MENTIONS = /(^|[^A-Za-z0-9_])effectiveAuthority([^A-Za-z0-9_]|$)/;
    // biome-ignore format: the dynamic three-tier discovery sweep stays compact for the shard budget
    const discovered = fs.readdirSync(path.join(ROOT, "tests")).filter((file) => file.endsWith(".test.ts")).map((file) => `tests/${file}`).filter((file) => file !== SELF && MENTIONS.test(stripComments(read(file)))).sort();
    expect(discovered.length, "consumer-discovery-count-drift").toBe(13);
    // biome-ignore format: the registry must close exactly over the three tiers
    expect(discovered, "consumer-registry-out-of-sync").toEqual([...CONSUMERS.map(([test]) => test), ...PINNED.map(([test]) => test), ...HEAD_TRACKING].sort());
    // Neither a stamped consumer nor a pinned reader may couple to the live head.
    // biome-ignore format: the coupling sweep spans both stamped and pinned readers
    for (const test of [...CONSUMERS.map(([t]) => t), ...PINNED.map(([t]) => t)]) expect(coupledIn(read(test)), `consumer-stamp-live-head-coupled:${test}`).toBe(false);
    // Each pinned reader keeps its exact sealed-epoch token.
    // biome-ignore format: the pinned-token proof names the exact missing pin
    for (const [test, token] of PINNED) expect(read(test), `pinned-epoch-token-missing:${test}:${token}`).toContain(token);
    // The head-tracking ledger genuinely carries no provenance stamp, so it is out of scope by fact.
    // biome-ignore format: the head-tracking exemption is proven, not assumed
    for (const test of HEAD_TRACKING) expect(read(test).includes("provenance.effectiveAuthority"), `head-tracking-carries-stamp:${test}`).toBe(false);
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
    // stampGoverns, mirrored from tools/lib/kernel-effective-authority-chain.mjs: the boundary derived
    // from the prefix ending at the stamped entry must derive cleanly AND equal the boundary in force.
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
      // boundary moves and every earlier stamp must be re-stamped. Resolution is not governance.
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
    // The seq-4 boundary is not merely different, it is not yet derivable: the three superseded
    // dimensions are unmapped, exactly as the recorded boundaryMapExtension prerequisite states.
    // biome-ignore format: the exact unmapped successor dimensions stay compact for the shard budget
    expect(deriveAuthorityBoundary({ entries: seq4 }).errors).toEqual(["derived-boundary-unmapped:codeStart:YES", "derived-boundary-unmapped:runtimeCode:YES", "derived-boundary-unmapped:verdict:GO-KERNEL-DEVELOPMENT-ONLY"]);
    // biome-ignore format: the recorded boundary-map prerequisite stays compact for the shard budget
    expect(readJson(ACTIVATION).chainBinding.appendPrerequisites.boundaryMapExtension).toContain("derived-boundary-unmapped");
    // The live chain is untouched by this probe: still seq 3, still unappended.
    // biome-ignore format: the unappended live head stays exactly where this gate found it
    expect([readJson(CHAIN).chainHeadSeq, readJson(ACTIVATION).chainBinding.appendExecutedHere]).toEqual([3, false]);
  });
});
