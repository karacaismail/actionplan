import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

// M6 Constitutional Freeze: a reference-only record pinning P01 and PKG11/12/13 governance status
// plus canonical pointers (Actionplan/Kernel base pins, authority live seq4 + projected seq5,
// ASGI owner). It never restates the ASGI/authority values themselves — only exact ref/hash/pointer
// strings — so ownership stays with reports/kernel-asgi-core-profile-decision-2026-08-11.json and
// reports/kernel-effective-authority-chain-*.json.
const ROOT = process.cwd();
const RECORD = "reports/kernel-constitutional-freeze-2026-08-21.json";
const VALIDATOR = "tools/lib/kernel-constitutional-freeze.mjs";
const APPLICABILITY = "actionplan-kernel-governance-constitutional-freeze";
// biome-ignore format: the closed record root key set, sorted; a quietly added or dropped root is a diff
const ROOT_KEYS = ["applicability", "canonicalRefs", "generatedAt", "id", "nonGoals", "p01Decision", "pkg11_12_13Decision", "prohibitions", "schemaVersion", "status", "supersessions"];
const PKG_IDS = ["PKG11", "PKG12", "PKG13"];
// biome-ignore format: every prohibition gate this record must keep closed
const PROHIBITION_KEYS = ["bulkMergeAllowed", "bulkDeleteAllowed", "sdkGateOpen", "appGateOpen", "moduleGateOpen", "releaseGateOpen", "deployGateOpen", "productionGateOpen", "asgiAuthorityValueCopyAllowed", "gitCommitPushByThisRecord"];
// biome-ignore format: the pointer files this record points at without ever copying their values
const REF_FILES = [
  "reports/kernel-effective-authority-chain-2026-07-31.json",
  "reports/kernel-effective-authority-chain-2026-08-21.json",
  "reports/kernel-asgi-core-profile-decision-2026-08-11.json",
  "tools/lib/kernel-asgi-core-profile.mjs",
  "tests/kernelAsgiCoreProfileDecision.test.ts",
];

const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const readJson = (relative: string) => JSON.parse(read(relative));
const exists = (relative: string) => fs.existsSync(path.join(ROOT, relative));
// biome-ignore lint/suspicious/noExplicitAny: the shipped pure JavaScript validator has no declaration file.
const load = async (relative: string): Promise<any> =>
  import(pathToFileURL(path.join(ROOT, relative)).href);
// biome-ignore lint/suspicious/noExplicitAny: the validator consumes untyped JSON documents.
const clone = (value: any): any => JSON.parse(JSON.stringify(value));

describe("M6 constitutional freeze reference-only record", () => {
  it("exists, is closed, and points at the canonical ASGI and authority owners without copying them", () => {
    expect(exists(RECORD), `constitutional-freeze-record-missing:${RECORD}`).toBe(true);
    const record = readJson(RECORD);
    expect(Object.keys(record).sort(), "record-root-key-drift").toEqual(ROOT_KEYS);
    for (const file of REF_FILES) expect(exists(file), `canonical-ref-missing:${file}`).toBe(true);
    // No ASGI/authority owned values (support matrix, servers, chain entries) are restated here.
    // biome-ignore format: the forbidden owned-value keys stay one array
    for (const forbidden of ["supportMatrix", "servers", "entries", "coreProfile", "fastapi"])
      expect(JSON.stringify(record), `owned-value-copied:${forbidden}`).not.toContain(`"${forbidden}"`);
  });

  it("carries P01 as PARTIAL_ADDITIVE with RCPT-01 not received, and PKG11/12/13 as no-current-effect", () => {
    const record = readJson(RECORD);
    expect(record.p01Decision).toEqual({
      status: "PARTIAL_ADDITIVE",
      requiredReceiptId: "RCPT-01",
      receiptPresent: false,
      completionClaimAllowed: false,
    });
    expect(Object.keys(record.pkg11_12_13Decision).sort(), "pkg-set-drift").toEqual(PKG_IDS);
    for (const id of PKG_IDS) {
      expect(record.pkg11_12_13Decision[id], `pkg-decision-drift:${id}`).toEqual({
        sourcePresent: false,
        evidencePresent: false,
        currentEffect: "none",
        disposition: "invalid-or-superseded",
      });
    }
    expect(record.prohibitions, "prohibitions-not-closed").toEqual(
      Object.fromEntries(PROHIBITION_KEYS.map((k) => [k, false])),
    );
  });

  it("fails closed on P01, PKG, prohibition, ref-pointer and non-goal drift", async () => {
    expect(exists(VALIDATOR), `constitutional-freeze-validator-missing:${VALIDATOR}`).toBe(true);
    const record = readJson(RECORD);
    const {
      evaluateConstitutionalFreeze,
      NON_GOALS,
      RECORD_ROOT_KEYS,
      PROHIBITION_KEYS: VPK,
      SUPERSESSION_PINS,
    } = await load(VALIDATOR);
    const clean = evaluateConstitutionalFreeze({ record });
    expect(clean.errors, "clean-record-rejected").toEqual([]);
    expect(clean.accepted).toBe(true);
    expect(RECORD_ROOT_KEYS).toEqual(ROOT_KEYS);
    expect(VPK).toEqual(PROHIBITION_KEYS);
    expect(NON_GOALS.length, "non-goals-empty").toBeGreaterThan(0);
    expect(record.nonGoals).toEqual(NON_GOALS);
    expect(record.supersessions, "supersession-pin-drift").toEqual(SUPERSESSION_PINS);

    const drift = (mutate: (r: unknown) => void) => {
      const r = clone(record);
      mutate(r);
      return evaluateConstitutionalFreeze({ record: r });
    };
    expect(
      drift((r: any) => {
        r.p01Decision.completionClaimAllowed = true;
      }).accepted,
      "p01-completion-claim-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.p01Decision.receiptPresent = true;
      }).accepted,
      "p01-receipt-claim-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.pkg11_12_13Decision.PKG11.disposition = "valid";
      }).accepted,
      "pkg11-disposition-drift-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.prohibitions.gitCommitPushByThisRecord = true;
      }).accepted,
      "git-mutation-claim-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.canonicalRefs.asgiOwner.decision = "reports/other-decision.json";
      }).accepted,
      "asgi-owner-ref-drift-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.nonGoals = r.nonGoals.slice(1);
      }).accepted,
      "non-goal-drop-not-refused",
    ).toBe(false);
    expect(
      drift((r: any) => {
        r.extraRoot = "x";
      }).accepted,
      "unknown-root-not-refused",
    ).toBe(false);
    // M5 un-supersede: reversing an already-superseded ASGI-absent finding to active must be refused.
    expect(
      drift((r: any) => {
        r.supersessions.m5AsgiAbsentA01_04.status = "active";
      }).accepted,
      "m5-un-supersede-not-refused",
    ).toBe(false);
    // Dirty-root false supersession: dirty-root warnings stay still-valid, never superseded.
    expect(
      drift((r: any) => {
        r.supersessions.dirtyRootA01_01.status = "superseded";
      }).accepted,
      "dirty-root-false-supersession-not-refused",
    ).toBe(false);
    expect(drift(() => {}).accepted, "harness-rejects-clean").toBe(true);
    expect(record.applicability).toBe(APPLICABILITY);
  });
});
