// The M6 constitutional freeze decision validator. Pure: takes the record as a value, reads no
// file, and returns every named reason it fails rather than only the first. It pins P01's
// PARTIAL_ADDITIVE/RCPT-01/no-receipt/no-completion status, PKG11/12/13's invalid-or-superseded
// no-current-effect status, every prohibition gate closed, the closed root key set, the ordered
// non-goal list and the exact canonical ref pointers (Actionplan base, Kernel base, authority live
// seq4 + projected seq5-not-live, ASGI owner). It never restates the ASGI or authority chain's own
// values — only their file paths and status labels as pointers — so ownership stays with
// reports/kernel-asgi-core-profile-decision-2026-08-11.json and
// reports/kernel-effective-authority-chain-*.json.
export const RECORD_REF = "reports/kernel-constitutional-freeze-2026-08-21.json";
export const APPLICABILITY = "actionplan-kernel-governance-constitutional-freeze";
// biome-ignore format: the closed record root key set, sorted; a quietly added or dropped root is a diff
export const RECORD_ROOT_KEYS = ["applicability", "canonicalRefs", "generatedAt", "id", "nonGoals", "p01Decision", "pkg11_12_13Decision", "prohibitions", "schemaVersion", "status", "supersessions"];
export const PKG_IDS = ["PKG11", "PKG12", "PKG13"];
// biome-ignore format: every prohibition gate this record must keep closed
export const PROHIBITION_KEYS = ["bulkMergeAllowed", "bulkDeleteAllowed", "sdkGateOpen", "appGateOpen", "moduleGateOpen", "releaseGateOpen", "deployGateOpen", "productionGateOpen", "asgiAuthorityValueCopyAllowed", "gitCommitPushByThisRecord"];
export const NON_GOALS = [
  "no runtime/feature/SDK/PWA/release/deploy",
  "no branch merge/delete, no dirty-root mutation",
  "no ASGI/authority/gate value duplication — yalnız ref/hash/pointer",
  "no PKG11-13 tamamlanma iddiası — yalnız no-current-effect kaydı",
  "no P01 completion claim without RCPT-01",
  "no Kernel repo write (read-only)",
];
export const P01_PINS = {
  status: "PARTIAL_ADDITIVE",
  requiredReceiptId: "RCPT-01",
  receiptPresent: false,
  completionClaimAllowed: false,
};
export const PKG_PINS = {
  sourcePresent: false,
  evidencePresent: false,
  currentEffect: "none",
  disposition: "invalid-or-superseded",
};
// biome-ignore format: exact pointer strings only — no ASGI/authority owned value is pinned here
export const REF_PINS = [
  ["canonicalRefs.actionplanBase.sha", "86169cd2a4136e453e1470f26d9c2aeac9bae738"],
  ["canonicalRefs.kernelBase.sha", "8c2e5f0acf52338d2617547fad6585dd459b75f4"],
  ["canonicalRefs.authority.liveSeq4.path", "reports/kernel-effective-authority-chain-2026-07-31.json"],
  ["canonicalRefs.authority.liveSeq4.status", "sealed-live"],
  ["canonicalRefs.authority.projectedSeq5NotLive.path", "reports/kernel-effective-authority-chain-2026-08-21.json"],
  ["canonicalRefs.authority.projectedSeq5NotLive.status", "projected-not-live"],
  ["canonicalRefs.asgiOwner.decision", "reports/kernel-asgi-core-profile-decision-2026-08-11.json"],
  ["canonicalRefs.asgiOwner.validator", "tools/lib/kernel-asgi-core-profile.mjs"],
  ["canonicalRefs.asgiOwner.test", "tests/kernelAsgiCoreProfileDecision.test.ts"],
];
// biome-ignore format: keys that must never appear anywhere — the values they'd carry are owned elsewhere
export const FORBIDDEN_OWNED_VALUE_KEYS = ["supportMatrix", "servers", "entries", "coreProfile", "fastapi"];
// biome-ignore format: the four M5-supersession entries, pinned whole so no field can drift alone
export const SUPERSESSION_PINS = {
  m5AsgiAbsentA01_04: { status: "superseded", reason: "ASGI owner already canonical in pinned Actionplan base", supersededBy: "canonicalRefs.asgiOwner" },
  m5GuiAsgiAbsent: { status: "superseded", reason: "ASGI owner already canonical in pinned Actionplan base", supersededBy: "canonicalRefs.asgiOwner" },
  dirtyRootA01_01: { status: "still-valid", scope: "dirty-root-warning" },
  dirtyRootA01_02: { status: "still-valid", scope: "dirty-root-warning" },
};
export const SUPERSESSION_IDS = Object.keys(SUPERSESSION_PINS);

const at = (root, path) => path.split(".").reduce((value, key) => value?.[key], root);

export function evaluateConstitutionalFreeze({ record } = {}) {
  const errors = [];
  const doc = record ?? {};
  const add = (error) => {
    if (!errors.includes(error)) errors.push(error);
  };
  const closed = (got, pinned, tag) => {
    for (const item of pinned) if (!got.includes(item)) add(`missing-${tag}:${item}`);
    for (const item of got) if (!pinned.includes(item)) add(`unknown-${tag}:${item}`);
    if (got.length !== pinned.length) add(`${tag}-count-drift`);
  };
  closed(Object.keys(doc).sort(), RECORD_ROOT_KEYS, "record-root");
  if (doc.applicability !== APPLICABILITY) add("applicability-drift");

  for (const [key, value] of Object.entries(P01_PINS))
    if (doc.p01Decision?.[key] !== value) add(`p01-drift:${key}`);

  const pkgs = doc.pkg11_12_13Decision ?? {};
  closed(Object.keys(pkgs).sort(), PKG_IDS, "pkg-set");
  for (const id of PKG_IDS) {
    for (const [key, value] of Object.entries(PKG_PINS))
      if (pkgs[id]?.[key] !== value) add(`pkg-drift:${id}:${key}`);
  }

  const prohibitions = doc.prohibitions ?? {};
  closed(Object.keys(prohibitions).sort(), [...PROHIBITION_KEYS].sort(), "prohibition");
  for (const key of PROHIBITION_KEYS)
    if (prohibitions[key] !== false) add(`prohibition-not-closed:${key}`);

  for (const [path, value] of REF_PINS) if (at(doc, path) !== value) add(`ref-drift:${path}`);

  const supersessions = doc.supersessions ?? {};
  closed(Object.keys(supersessions).sort(), [...SUPERSESSION_IDS].sort(), "supersession-set");
  for (const id of SUPERSESSION_IDS) {
    const pinned = SUPERSESSION_PINS[id];
    const got = supersessions[id] ?? {};
    closed(Object.keys(got).sort(), Object.keys(pinned).sort(), `supersession-fields:${id}`);
    for (const [key, value] of Object.entries(pinned))
      if (got[key] !== value) add(`supersession-drift:${id}:${key}`);
  }

  const nonGoals = doc.nonGoals ?? [];
  for (const [i, line] of NON_GOALS.entries()) if (nonGoals[i] !== line) add(`non-goal-drift:${i}`);
  if (nonGoals.length !== NON_GOALS.length) add("non-goal-count-drift");

  const asJson = JSON.stringify(doc);
  for (const forbidden of FORBIDDEN_OWNED_VALUE_KEYS)
    if (asJson.includes(`"${forbidden}"`)) add(`owned-value-copied:${forbidden}`);

  return { errors, accepted: errors.length === 0 };
}
