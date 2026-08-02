import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it, vi } from "vitest";

const ROOT = process.cwd();
const REPORT = "reports/kernel-governance-closure-authority-2026-07-31.json";
const REGISTRY = "reports/kernel-governance-decision-registry-2026-07-15.json";
const PACK = "docs/kernel-governance-decision-pack-2026-07-15.md";
const readJson = (relative: string) =>
  JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");

// biome-ignore format: exact application ledger stays compact for the shard budget
const APPLICATIONS = [{ id: "KGA-D01", disposition: "approved-descendant-ledger", moduleParents: 38, existingParents: 5, approvedPendingApplication: 33, applicationStatus: "pending", canonicalStatus: "pending" }, { id: "KGA-D02", disposition: "Edition/App->SDK->Kernel", applicationStatus: "pending", canonicalStatus: "pending" }, { id: "KGA-D03", disposition: "split-module-registry-and-capability", applicationStatus: "pending", canonicalStatus: "pending" }, { id: "KGA-D04", disposition: "reject-13-ghosts", ghostCount: 13, applicationStatus: "pending", canonicalStatus: "pending" }, { id: "KGA-D05", disposition: "scaffold-only-and-walking-skeleton-only", applicationStatus: "pending", canonicalStatus: "pending" }, { id: "KGA-D06", disposition: "early-minimal-db", applicationStatus: "pending", canonicalStatus: "pending" }, { id: "KGA-D07", disposition: "repair-8-kernel-move-38-non-kernel-to-separate-gap", repairKernelConflicts: 8, moveNonKernelConflicts: 38, totalConflicts: 46, applicationStatus: "pending", canonicalStatus: "pending" }, { id: "KGA-D08", disposition: "quarantine-ambiguous-adrs", applicationStatus: "pending", canonicalStatus: "pending" }, { id: "KGA-D09", disposition: "reject-13-ghosts", ghostCount: 13, applicationStatus: "pending", canonicalStatus: "pending" }, { id: "KGA-D10", disposition: "shared-schema", tenantKey: "tenant_id", rowLevelSecurity: "FORCE RLS", denyByDefault: true, thresholdDisposition: "not-applicable-fixed-topology", automaticPromotion: false, applicationStatus: "pending", canonicalStatus: "pending" }];
// biome-ignore format: exact upstream provenance stays compact for the shard budget
const PROVENANCE = { role: "prior-supporting-only", repository: "metaframer-net/metaframer-kernel", commit: "2abf6c910fd11d53c4f28e23d64f7c9c9abb446b", artifacts: { "planning/human-decision-request.json": "eaea6992d814e47456a1ae0107a1784a07f3fda9171a18087564f6bda75b7c50", "planning/governance-decisions.json": "5ce6f9234288e43b8d1518c834394150c75221f2b62922f9a657a6c9b7b27441" } };
// biome-ignore format: exact 691-byte selection stays compact for the shard budget
const NORMALIZED_SELECTION = "GATE-01 APPROVED; SCOPE=FULL_CANONICAL_KERNEL; D01=38_PARENTS_5_EXISTING_33_APPROVED_DESCENDANT_LEDGER; D02=EDITION_APP_TO_SDK_TO_KERNEL; D03=SPLIT_MODULE_REGISTRY_AND_CAPABILITY; D04_D09=REJECT_13_GHOSTS; D05=SCAFFOLD_AND_WALKING_SKELETON_ONLY; D06=EARLY_MINIMAL_DB; D07=FIX_KERNEL8_SPLIT_NONKERNEL38; D08=QUARANTINE_AMBIGUOUS_ADRS; D10=SHARED_SCHEMA_TENANT_ID_FORCE_RLS; CROSSCUT=RECOMMENDED; DOCREFS=14_BIND_2_CREATE_1_DEFER; TOPOLOGY=STANDALONE_CLEAN_START_NO_EXTRACTION; ACTIONPLAN_WRITER=CODEX_GOVERNANCE_ONLY; KERNEL_WRITER=CLAUDE_ONLY_FAIL_CLOSED; GIT_EXECUTOR=CODEX; COMMIT_PUSH_PR_MERGE=YES_NONFORCE_NO_TAGS_CI_GATED; TECHNICAL_DECISIONS=CODEX_EVIDENCE_BASED; RELEASE=NO; DEPLOY=NO";
const SELECTION_SHA256 = "da499d6d9393745424f745809c035b8ad208c8f5731a8865a76dd005a4f893d6";
// biome-ignore format: exact review contracts stay compact for the shard budget
const CROSSCUT = { selection: "all-7-recommended", count: 7, selectedContracts: [{ id: "graphql-contract-source", contract: "downstream-adapter-over-versioned-kernel-ports-schema-openapi" }, { id: "control-plane-taxonomy", adminTiers: 3, counterparty: true, agentPublicFourthAdminPlane: false }, { id: "accessibility-applicability", kernelCore: "not-applicable", downstreamBaseline: "WCAG-2.2-AA", surfaceTarget: "surface-specific-AAA" }, { id: "performance-budget", coreP95Ms: 100, adapterP95Ms: 200, appE2eP95Ms: 400 }, { id: "deployment-profile", reference: "OCI/Docker", downstream: ["K8s", "Swarm"] }, { id: "i18n-fallback", messageCodes: "stable", fallback: ["user", "tenant", "app", "en"] }, { id: "dependency-direction", contract: "Edition/App->SDK->Kernel" }], applicationStatus: "pending" };
// biome-ignore format: exact doc-ref disposition stays compact for the shard budget
const DOC_REFS = { selection: "14-bind-2-create-1-defer", bind: 14, create: 2, defer: 1, bindNodeIds: ["k-archetype-computation", "k-archetype-fieldtypes", "k-archetype-mode-profile", "k-calendar-capacity", "k-edge-gateway", "k-genealogy-graph", "k-granulerlik", "k-identity", "k-jurisdiction", "k-kpi-registry", "k-mod-l", "k-plugin", "k-sequence", "k-terminoloji"], createRefs: { "k-archetype-bayraklari": "docs/archetype-flags-behavior-contract.md", "k-sozlesme": "docs/kernel-schema-pinning-contract.md" }, deferNodeIds: ["k-tenancy-deep"], applicationStatus: "pending" };
// biome-ignore format: exact execution boundary stays compact for the shard budget
const BOUNDARY = { actionplanWriter: { principal: "codex", scope: "governance-only" }, kernelWriter: { principal: "claude-only", invocationAuthority: "codex", authGate: { requiredValues: { loggedIn: true, authMethod: "claude.ai", apiProvider: "firstParty", subscriptionType: "max" }, verification: "required-per-invocation", cachedEvidenceAccepted: false, failClosed: true } }, gitExecutor: "codex", gitAuthorization: { mode: "normal-non-force-only", commit: true, push: true, pullRequest: true, merge: true, force: false, tags: false, directDefaultBranchPush: false, ciRequired: true, reviewRequired: true }, workerGitMutationAllowed: false, release: false, deploy: false };
// biome-ignore format: exact final boundaries stay compact for the shard budget
const STANDALONE = { repository: "metaframer-net/metaframer-kernel", defaultBranch: "main", governanceOwner: "karacaismail/actionplan", historyStrategy: "CLEAN_START_WITH_PROVENANCE", extractionAllowed: false };
// biome-ignore format: exact runtime sequence stays compact for the shard budget
const CONDITIONAL = { approved: true, activatesOnlyAfter: "all-canonical-applications-and-checks-complete", requiredSequence: ["DB/RLS/transaction/outbox/audit", "kernel-primitives", "SDK", "walking-skeleton"], active: false };
// biome-ignore format: exact approval shard boundary stays compact for the shard budget
const CHANGE_BOUNDARY = { allowedFiles: ["reports/kernel-governance-closure-authority-2026-07-31.json", "tests/kernelGovernanceClosureAuthority.test.ts", "package.json", "tools/lib/kernel-governance-authorization-audit.mjs", "tools/agents/check-kernel-governance.mjs", "reports/kernel-governance-decision-registry-2026-07-15.json", "docs/kernel-governance-decision-pack-2026-07-15.md", "tests/kernelGovernanceDecisionRegistry.test.ts", "tests/kernelGovernanceDecisionPack.test.ts"], nonGoals: ["no canonical application, generated projection, runtime or platform mutation"] };

describe("kernel governance closure authority approval intake", () => {
  it("records GATE-01 approval while every canonical application stays fail-closed", () => {
    expect(fs.existsSync(path.join(ROOT, REPORT)), `${REPORT} is missing`).toBe(true);
    const report = readJson(REPORT);

    expect(report).toMatchObject({
      schemaVersion: "1.0.0",
      id: "kernel-governance-closure-authority-2026-07-31",
      status: "approved-application-pending",
      approval: {
        gateId: "GATE-01",
        authority: "user-admin",
        date: "2026-07-31",
        responseText: "onayladım",
        responseContext: "immediately-preceding-consolidated-GATE-01",
        scope: "FULL_CANONICAL_KERNEL",
        normalizedSelection: NORMALIZED_SELECTION,
        normalizedSelectionBytes: 691,
        normalizedSelectionSha256: SELECTION_SHA256,
      },
      priorSupportingProvenance: PROVENANCE,
      applications: APPLICATIONS,
      crosscut: CROSSCUT,
      docRefs: DOC_REFS,
      standalone: STANDALONE,
      authorityBoundary: BOUNDARY,
      changeBoundary: CHANGE_BOUNDARY,
      application: {
        status: "pending",
        canonicalApplicationsComplete: false,
        requiredChecksComplete: false,
        codeStartAllowed: false,
        runtimeCodeAllowed: false,
        readinessAllowed: false,
      },
      conditionalRuntimeAuthorization: CONDITIONAL,
    });

    expect(report.authorityProvenance).toBeUndefined();
    // biome-ignore format: exact closed root stays compact for the shard budget
    expect(Object.keys(report).sort()).toEqual(["application", "applications", "approval", "authorityBoundary", "changeBoundary", "conditionalRuntimeAuthorization", "crosscut", "docRefs", "id", "nonGoals", "priorSupportingProvenance", "rollback", "schemaVersion", "sourceRefs", "standalone", "status"]);
    expect(Buffer.byteLength(report.approval.normalizedSelection, "utf8")).toBe(691);
    expect(createHash("sha256").update(report.approval.normalizedSelection).digest("hex")).toBe(
      SELECTION_SHA256,
    );
    const applicationIds = report.applications.map((row: { id: string }) => row.id);
    expect(applicationIds).toEqual(
      Array.from({ length: 10 }, (_, index) => `KGA-D${String(index + 1).padStart(2, "0")}`),
    );
    expect(new Set(applicationIds).size).toBe(10);
    expect(
      report.applications.every(
        (row: { applicationStatus: string; canonicalStatus: string }) =>
          row.applicationStatus === "pending" && row.canonicalStatus === "pending",
      ),
    ).toBe(true);
    const registry = readJson(REGISTRY);
    expect(
      registry.decisions.every(
        (decision: { status: string; selectedOption: unknown; codeStartAllowed: boolean }) =>
          decision.status === "pending" &&
          decision.selectedOption === null &&
          decision.codeStartAllowed === false,
      ),
    ).toBe(true);
    const scripts = readJson("package.json").scripts;
    expect(scripts["qa:kernel-governance-authority"]).toContain(
      "tests/kernelGovernanceClosureAuthority.test.ts",
    );
    expect(scripts["qa:kernel-governance"]).toContain("qa:kernel-governance-authority");
  });

  it("fails closed when approval, authority, traceability or readiness drifts", async () => {
    const moduleUrl = pathToFileURL(
      path.join(ROOT, "tools/lib/kernel-governance-authorization-audit.mjs"),
    ).href;
    const { validateKernelGovernanceAuthorization } = await import(moduleUrl);
    const input = {
      authority: readJson(REPORT),
      registry: readJson(REGISTRY),
      pack: read("docs/kernel-governance-decision-pack-2026-07-15.md"),
      scripts: readJson("package.json").scripts,
    };
    expect(validateKernelGovernanceAuthorization(input)).toEqual([]);

    // biome-ignore format: negative contract matrix stays compact for the shard budget
    const mutations: Array<(candidate: typeof input) => void> = [
      (candidate) => { candidate.authority.approval.responseText = "implicit"; },
      (candidate) => { candidate.authority.authorityBoundary.kernelWriter.authGate.requiredValues.apiProvider = "fallback"; },
      (candidate) => { candidate.authority.authorityBoundary.gitAuthorization.force = true; },
      (candidate) => { candidate.authority.authorityBoundary.release = true; },
      (candidate) => { candidate.authority.application.codeStartAllowed = true; },
      (candidate) => { candidate.authority.priorSupportingProvenance.artifacts["planning/human-decision-request.json"] = "drift"; },
      (candidate) => { candidate.authority.applications[8].id = "KGA-D04"; },
      (candidate) => { candidate.authority.conditionalRuntimeAuthorization.active = true; },
      (candidate) => { candidate.authority.authorityBoundary.workerGitMutationAllowed = true; },
      (candidate) => { candidate.authority.applications[9].denyByDefault = false; },
      (candidate) => { candidate.authority.crosscut.selectedContracts[0].contract = "schema-first"; },
      (candidate) => { candidate.authority.docRefs.bindNodeIds.pop(); },
      (candidate) => { candidate.authority.standalone.defaultBranch = "develop"; },
      (candidate) => { candidate.authority.conditionalRuntimeAuthorization.requiredSequence.reverse(); },
      (candidate) => { candidate.authority.nonGoals[2] = "forbid all Git forever"; },
      (candidate) => { candidate.authority.approval.normalizedSelection += "."; },
      (candidate) => { candidate.authority.approval.normalizedSelectionSha256 = "stale"; },
      (candidate) => { candidate.authority.authorityBoundary.kernelWriter.authGate.verification = "cached"; },
      (candidate) => { candidate.authority.authorityBoundary.kernelWriter.authGate.cachedEvidenceAccepted = true; },
      (candidate) => { candidate.authority.runtimeReady = true; },
      (candidate) => { candidate.authority.codeStartAllowed = true; },
      (candidate) => { candidate.authority.changeBoundary.allowedFiles.pop(); },
      (candidate) => { candidate.registry.finalDecision.kernelReady = true; },
      (candidate) => { candidate.registry.runtimeReady = true; },
      (candidate) => { candidate.registry.decisions[0].runtimeReady = true; },
      (candidate) => { candidate.pack = candidate.pack.replace("`runtimeCodeAllowed=false` kalır.", "`runtimeCodeAllowed=false` kalır.\ncodeStartAllowed=true"); },
      (candidate) => { candidate.pack = candidate.pack.replace("`runtimeCodeAllowed=false` kalır.", "`runtimeCodeAllowed=false` kalır.\nruntimeCodeAllowed=true"); },
      (candidate) => { candidate.pack = candidate.pack.replace("`runtimeCodeAllowed=false` kalır.", "`runtimeCodeAllowed=false` kalır.\nrelease=true"); },
      (candidate) => { candidate.pack = candidate.pack.replace("`runtimeCodeAllowed=false` kalır.", "`runtimeCodeAllowed=false` kalır.\ndeploy=true"); },
      (candidate) => { candidate.scripts["qa:kernel-governance-authority"] = "echo vitest run tests/kernelGovernanceClosureAuthority.test.ts"; },
      (candidate) => { candidate.scripts["qa:kernel-governance"] = "echo npm run qa:kernel-governance-authority"; },
      (candidate) => { candidate.scripts["qa:kernel-governance"] = "node tools/agents/check-kernel-governance.mjs # && npm run qa:kernel-governance-authority"; },
      (candidate) => { candidate.scripts["qa:kernel-governance"] = "node tools/agents/check-kernel-governance.mjs '&& npm run qa:kernel-governance-authority"; },
      (candidate) => { candidate.registry.decisions[0].selectedOption = "applied"; },
      (candidate) => { candidate.registry.authorizationRef = "wrong"; },
      (candidate) => { candidate.authority.sourceRefs.pop(); },
      (candidate) => { candidate.authority.rollback.runtimeDataImpact = "runtime"; },
      (candidate) => { candidate.pack = candidate.pack.replace(REPORT, "missing-report.json"); },
    ];
    for (const mutate of mutations) {
      const candidate = structuredClone(input);
      mutate(candidate);
      expect(validateKernelGovernanceAuthorization(candidate).length).toBeGreaterThan(0);
    }
  });

  // The matrix above proves "some error"; these two branches decide what the pack may SAY about live
  // authority, so each one is proven by its own named error rather than by an aggregate count. The
  // rule tables are imported from the validator, so this suite cannot drift from the gate it asserts.
  it("rejects each reinstated live-authority claim and each removed time-scope clause by name", async () => {
    const moduleUrl = pathToFileURL(
      path.join(ROOT, "tools/lib/kernel-governance-authorization-audit.mjs"),
    ).href;
    // biome-ignore format: the shared rule tables and the gate arrive from one module
    const { validateKernelGovernanceAuthorization, UNQUALIFIED_LIVE_CLAIMS, TIME_SCOPE_CLAUSES } = await import(moduleUrl);
    const input = {
      authority: readJson(REPORT),
      registry: readJson(REGISTRY),
      pack: read(PACK),
      scripts: readJson("package.json").scripts,
    };
    expect(validateKernelGovernanceAuthorization(input)).toEqual([]);

    // Ids are the error vocabulary. A duplicate or empty id would collapse two branches into one
    // reported failure, and an empty table would make every loop below vacuously green.
    const ids = [...UNQUALIFIED_LIVE_CLAIMS, ...TIME_SCOPE_CLAUSES].map(
      (rule: { id: string }) => rule.id,
    );
    expect(ids.filter((id) => id.length > 0)).toEqual(ids);
    expect(new Set(ids).size).toBe(ids.length);
    expect(UNQUALIFIED_LIVE_CLAIMS.length).toBeGreaterThan(0);
    expect(TIME_SCOPE_CLAUSES.length).toBeGreaterThan(0);

    for (const rule of UNQUALIFIED_LIVE_CLAIMS as Array<{
      id: string;
      pattern: RegExp;
      sample: string;
    }>) {
      // Non-vacuity: the banned sentence must really be an instance of the rule that bans it, so a
      // pattern cannot be weakened into one that matches nothing and still report green.
      expect(rule.pattern.test(rule.sample), `dead-rule:${rule.id}`).toBe(true);
      // And it must be genuinely absent from the shipped pack, or the clean run above proves nothing.
      expect(input.pack, `claim-already-present:${rule.id}`).not.toMatch(rule.pattern);
      // Direct negative arm: reinstate the real prohibited sentence, not a synthetic stand-in.
      const candidate = { ...input, pack: `${input.pack}\n\n${rule.sample}\n` };
      expect(validateKernelGovernanceAuthorization(candidate)).toContain(
        `pack unqualified live authority claim: ${rule.id}`,
      );
    }

    for (const rule of TIME_SCOPE_CLAUSES as Array<{ id: string; clause: string }>) {
      expect(input.pack, `clause-missing:${rule.id}`).toContain(rule.clause);
      // Direct negative arm: strip every occurrence of that one required semantic and demand its
      // own error. Removing one clause must not be coverable by the three that remain.
      const candidate = { ...input, pack: input.pack.replaceAll(rule.clause, "") };
      expect(validateKernelGovernanceAuthorization(candidate)).toContain(
        `pack time-scope clause missing: ${rule.id}`,
      );
    }
  });
});

// The gate's banner is the only place that turns the chain head into a live-authority sentence, and
// it used to read its closed RUNTIME_IMPLEMENTATION_START vocabulary off a plain object. An inherited
// Object.prototype name in the head — RUNTIME_IMPLEMENTATION_START=toString — therefore resolved to a
// truthy function, escaped the fail-closed exit and printed native-code text as if the chain had
// sealed a runtime-start claim. These cases drive the real exported resolver the gate itself calls,
// so the closed vocabulary cannot regress behind a re-implementation.
describe("kernel governance gate live-authority banner vocabulary", () => {
  const GATE = "tools/agents/check-kernel-governance.mjs";
  const PROTOTYPE_TOKENS = [
    "toString",
    "constructor",
    "valueOf",
    "hasOwnProperty",
    "__proto__",
    "isPrototypeOf",
    "propertyIsEnumerable",
    "toLocaleString",
  ];
  // EPOCH-03 base head: NO-GO, runtime implementation not started. `extra` is the head's own token.
  // biome-ignore format: the synthetic EPOCH-03 chain builder stays compact for the shard budget
  const chainOf = (extra: string, verdict: unknown = "NO-GO") => ({ effectiveAuthorityBoundary: { verdict }, entries: [{ normalizedText: "AUTHORITY-SUPERSESSION-02 EFFECTIVE; VERDICT=NO-GO" }, { normalizedText: `AUTHORITY-SUPERSESSION-03 EFFECTIVE; SUPERSEDES=EPOCH-02; CODE_START=NO; RUNTIME_CODE=NO${extra}; RELEASE_ALLOWED=false; DEPLOY_ALLOWED=false; VERDICT=${String(verdict)}` }] });
  const tokenOf = (value: string) => `; RUNTIME_IMPLEMENTATION_START=${value}`;
  const importGate = async () => {
    const entry = process.argv[1];
    // Importing the gate must not execute it: the module runs only for its own entry point, so the
    // entry is pinned to this test file rather than left to whatever the runner happened to set.
    process.argv[1] = path.join(ROOT, "tests/kernelGovernanceClosureAuthority.test.ts");
    try {
      return await import(pathToFileURL(path.join(ROOT, GATE)).href);
    } finally {
      process.argv[1] = entry;
    }
  };

  it("fails closed on inherited prototype tokens and never prints a native-code claim", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { resolveLiveAuthorityBanner } = await importGate();
    // Importing the gate is not running the gate; a banner printed here would mean the opposite.
    expect(log).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    log.mockRestore();
    error.mockRestore();

    for (const token of PROTOTYPE_TOKENS) {
      // Non-vacuity: each token really is reachable through a plain object's prototype, so these
      // cases exercise the exact escape the Map lookup closes rather than arbitrary bad strings.
      const naive: Record<string, unknown> = {
        NO: "runtime implementation not started",
        YES: "runtime implementation started",
      };
      expect(naive[token], `not-a-prototype-token:${token}`).not.toBeUndefined();

      const result = resolveLiveAuthorityBanner(chainOf(tokenOf(token)));
      expect(result.ok, `prototype-token-accepted:${token}`).toBe(false);
      expect(result.line, `prototype-token-banner:${token}`).toBeUndefined();
      expect(result.error).toBe(
        `live-authority-unreportable:verdict=NO-GO:runtimeImplementationStart=${token}`,
      );
      // Whatever the resolver returns, no prototype value may ever surface in reported text.
      expect(JSON.stringify(result), `prototype-value-leaked:${token}`).not.toMatch(
        /native code|\[object Object\]|function |=> /,
      );
    }
  });

  it("keeps the intended EPOCH-03 behaviour for valid, absent and unknown head tokens", async () => {
    const { resolveLiveAuthorityBanner, RUNTIME_START_UNBOUND } = await importGate();
    const PASS =
      "[kernel-governance] PASS — planning integrity valid; live authority verdict NO-GO;";

    expect(resolveLiveAuthorityBanner(chainOf(tokenOf("NO")))).toEqual({
      ok: true,
      line: `${PASS} runtime implementation not started`,
    });
    expect(resolveLiveAuthorityBanner(chainOf(tokenOf("YES")))).toEqual({
      ok: true,
      line: `${PASS} runtime implementation started`,
    });
    // An absent token is reported as unbound, never as an invented runtime-start floor.
    expect(RUNTIME_START_UNBOUND).toBe("runtime implementation start unbound by chain");
    expect(resolveLiveAuthorityBanner(chainOf(""))).toEqual({
      ok: true,
      line: `${PASS} ${RUNTIME_START_UNBOUND}`,
    });

    // biome-ignore format: the fail-closed matrix stays compact for the shard budget
    const FAIL_CLOSED: Array<[string, unknown, string]> = [[tokenOf("MAYBE"), "NO-GO", "live-authority-unreportable:verdict=NO-GO:runtimeImplementationStart=MAYBE"], [tokenOf("no"), "NO-GO", "live-authority-unreportable:verdict=NO-GO:runtimeImplementationStart=no"], [tokenOf(""), "NO-GO", "live-authority-unreportable:verdict=NO-GO:runtimeImplementationStart="], [tokenOf("NO"), "GO", "live-authority-unreportable:verdict=GO:runtimeImplementationStart=NO"], [tokenOf("NO"), "toString", "live-authority-unreportable:verdict=toString:runtimeImplementationStart=NO"]];
    for (const [extra, verdict, expected] of FAIL_CLOSED) {
      const result = resolveLiveAuthorityBanner(chainOf(extra, verdict));
      expect(result, `expected-fail-closed:${expected}`).toEqual({ ok: false, error: expected });
    }
    // A head that seals a valid token while the boundary carries no verdict still fails closed.
    const { effectiveAuthorityBoundary: _dropped, ...noVerdict } = chainOf(tokenOf("NO"));
    expect(resolveLiveAuthorityBanner(noVerdict)).toEqual({
      ok: false,
      error: "live-authority-unreportable:verdict=missing:runtimeImplementationStart=NO",
    });
    // A missing or empty chain can never report authority either.
    for (const empty of [null, undefined, {}, { entries: [] }]) {
      expect(
        resolveLiveAuthorityBanner(empty).ok,
        `empty-chain-reported:${JSON.stringify(empty)}`,
      ).toBe(false);
    }
  });

  it("keeps the gate wired to that one resolver instead of an ad-hoc object lookup", () => {
    const gate = read(GATE);
    expect(gate).toContain("resolveLiveAuthorityBanner(chain)");
    // The plain-object lookup is the defect itself; a Set/Map read is the fail-closed form.
    expect(gate).not.toContain("RUNTIME_START[");
    expect(gate).toContain("RUNTIME_START = new Map(");
  });
});
