import { createHash } from "node:crypto";

const AUTHORITY = "reports/kernel-governance-closure-authority-2026-07-31.json";
const APPLICATION_STATE = "reports/kernel-governance-application-state-2026-08-01.json";
const same = (actual, expected) => JSON.stringify(actual) === JSON.stringify(expected);
// biome-ignore format: exact 691-byte selection stays compact for the shard budget
const NORMALIZED_SELECTION = "GATE-01 APPROVED; SCOPE=FULL_CANONICAL_KERNEL; D01=38_PARENTS_5_EXISTING_33_APPROVED_DESCENDANT_LEDGER; D02=EDITION_APP_TO_SDK_TO_KERNEL; D03=SPLIT_MODULE_REGISTRY_AND_CAPABILITY; D04_D09=REJECT_13_GHOSTS; D05=SCAFFOLD_AND_WALKING_SKELETON_ONLY; D06=EARLY_MINIMAL_DB; D07=FIX_KERNEL8_SPLIT_NONKERNEL38; D08=QUARANTINE_AMBIGUOUS_ADRS; D10=SHARED_SCHEMA_TENANT_ID_FORCE_RLS; CROSSCUT=RECOMMENDED; DOCREFS=14_BIND_2_CREATE_1_DEFER; TOPOLOGY=STANDALONE_CLEAN_START_NO_EXTRACTION; ACTIONPLAN_WRITER=CODEX_GOVERNANCE_ONLY; KERNEL_WRITER=CLAUDE_ONLY_FAIL_CLOSED; GIT_EXECUTOR=CODEX; COMMIT_PUSH_PR_MERGE=YES_NONFORCE_NO_TAGS_CI_GATED; TECHNICAL_DECISIONS=CODEX_EVIDENCE_BASED; RELEASE=NO; DEPLOY=NO";
const SELECTION_SHA256 = "da499d6d9393745424f745809c035b8ad208c8f5731a8865a76dd005a4f893d6";
const DECISIONS_SHA256 = "6a465a24f09c40092e2d6445993d1eee2f64ef0e46c33b647f21d4af0c505574";
// biome-ignore format: exact closed authority root stays compact for the shard budget
const AUTHORITY_KEYS = ["application", "applications", "approval", "authorityBoundary", "changeBoundary", "conditionalRuntimeAuthorization", "crosscut", "docRefs", "id", "nonGoals", "priorSupportingProvenance", "rollback", "schemaVersion", "sourceRefs", "standalone", "status"];
// biome-ignore format: exact approval shard boundary stays compact for the shard budget
const CHANGE_BOUNDARY = { allowedFiles: ["reports/kernel-governance-closure-authority-2026-07-31.json", "tests/kernelGovernanceClosureAuthority.test.ts", "package.json", "tools/lib/kernel-governance-authorization-audit.mjs", "tools/agents/check-kernel-governance.mjs", "reports/kernel-governance-decision-registry-2026-07-15.json", "docs/kernel-governance-decision-pack-2026-07-15.md", "tests/kernelGovernanceDecisionRegistry.test.ts", "tests/kernelGovernanceDecisionPack.test.ts"], nonGoals: ["no canonical application, generated projection, runtime or platform mutation"] };
// biome-ignore format: exact approval contract stays compact for the shard budget
const APPROVAL = { gateId: "GATE-01", authority: "user-admin", date: "2026-07-31", responseText: "onayladım", responseContext: "immediately-preceding-consolidated-GATE-01", scope: "FULL_CANONICAL_KERNEL", normalizedSelection: NORMALIZED_SELECTION, normalizedSelectionBytes: 691, normalizedSelectionSha256: SELECTION_SHA256 };
// biome-ignore format: exact application ledger stays compact for the shard budget
const APPLICATIONS = [{ id: "KGA-D01", disposition: "approved-descendant-ledger", moduleParents: 38, existingParents: 5, approvedPendingApplication: 33, applicationStatus: "pending", canonicalStatus: "pending" }, { id: "KGA-D02", disposition: "Edition/App->SDK->Kernel", applicationStatus: "pending", canonicalStatus: "pending" }, { id: "KGA-D03", disposition: "split-module-registry-and-capability", applicationStatus: "pending", canonicalStatus: "pending" }, { id: "KGA-D04", disposition: "reject-13-ghosts", ghostCount: 13, applicationStatus: "pending", canonicalStatus: "pending" }, { id: "KGA-D05", disposition: "scaffold-only-and-walking-skeleton-only", applicationStatus: "pending", canonicalStatus: "pending" }, { id: "KGA-D06", disposition: "early-minimal-db", applicationStatus: "pending", canonicalStatus: "pending" }, { id: "KGA-D07", disposition: "repair-8-kernel-move-38-non-kernel-to-separate-gap", repairKernelConflicts: 8, moveNonKernelConflicts: 38, totalConflicts: 46, applicationStatus: "pending", canonicalStatus: "pending" }, { id: "KGA-D08", disposition: "quarantine-ambiguous-adrs", applicationStatus: "pending", canonicalStatus: "pending" }, { id: "KGA-D09", disposition: "reject-13-ghosts", ghostCount: 13, applicationStatus: "pending", canonicalStatus: "pending" }, { id: "KGA-D10", disposition: "shared-schema", tenantKey: "tenant_id", rowLevelSecurity: "FORCE RLS", denyByDefault: true, thresholdDisposition: "not-applicable-fixed-topology", automaticPromotion: false, applicationStatus: "pending", canonicalStatus: "pending" }];
// biome-ignore format: exact upstream provenance stays compact for the shard budget
const PROVENANCE = { role: "prior-supporting-only", repository: "metaframer-net/metaframer-kernel", commit: "2abf6c910fd11d53c4f28e23d64f7c9c9abb446b", artifacts: { "planning/human-decision-request.json": "eaea6992d814e47456a1ae0107a1784a07f3fda9171a18087564f6bda75b7c50", "planning/governance-decisions.json": "5ce6f9234288e43b8d1518c834394150c75221f2b62922f9a657a6c9b7b27441" } };
// biome-ignore format: exact authority boundary stays compact for the shard budget
const BOUNDARY = { actionplanWriter: { principal: "codex", scope: "governance-only" }, kernelWriter: { principal: "claude-only", invocationAuthority: "codex", authGate: { requiredValues: { loggedIn: true, authMethod: "claude.ai", apiProvider: "firstParty", subscriptionType: "max" }, verification: "required-per-invocation", cachedEvidenceAccepted: false, failClosed: true } }, gitExecutor: "codex", gitAuthorization: { mode: "normal-non-force-only", commit: true, push: true, pullRequest: true, merge: true, force: false, tags: false, directDefaultBranchPush: false, ciRequired: true, reviewRequired: true }, workerGitMutationAllowed: false, release: false, deploy: false };
// biome-ignore format: exact crosscut selection stays compact for the shard budget
const CROSSCUT = { selection: "all-7-recommended", count: 7, selectedContracts: [{ id: "graphql-contract-source", contract: "downstream-adapter-over-versioned-kernel-ports-schema-openapi" }, { id: "control-plane-taxonomy", adminTiers: 3, counterparty: true, agentPublicFourthAdminPlane: false }, { id: "accessibility-applicability", kernelCore: "not-applicable", downstreamBaseline: "WCAG-2.2-AA", surfaceTarget: "surface-specific-AAA" }, { id: "performance-budget", coreP95Ms: 100, adapterP95Ms: 200, appE2eP95Ms: 400 }, { id: "deployment-profile", reference: "OCI/Docker", downstream: ["K8s", "Swarm"] }, { id: "i18n-fallback", messageCodes: "stable", fallback: ["user", "tenant", "app", "en"] }, { id: "dependency-direction", contract: "Edition/App->SDK->Kernel" }], applicationStatus: "pending" };
// biome-ignore format: exact doc-ref disposition stays compact for the shard budget
const DOC_REFS = { selection: "14-bind-2-create-1-defer", bind: 14, create: 2, defer: 1, bindNodeIds: ["k-archetype-computation", "k-archetype-fieldtypes", "k-archetype-mode-profile", "k-calendar-capacity", "k-edge-gateway", "k-genealogy-graph", "k-granulerlik", "k-identity", "k-jurisdiction", "k-kpi-registry", "k-mod-l", "k-plugin", "k-sequence", "k-terminoloji"], createRefs: { "k-archetype-bayraklari": "docs/archetype-flags-behavior-contract.md", "k-sozlesme": "docs/kernel-schema-pinning-contract.md" }, deferNodeIds: ["k-tenancy-deep"], applicationStatus: "pending" };
// biome-ignore format: exact traceability list stays compact for the shard budget
const SOURCE_REFS = ["reports/kernel-governance-decision-registry-2026-07-15.json", "docs/kernel-governance-decision-pack-2026-07-15.md", "reports/kernel-code-bearing-descendant-handoff-2026-07-15.json", "reports/kernel-db-substrate-queue-handoff-2026-07-15.json", "reports/kernel-adr-collision-source-bindings-2026-07-15.json", "reports/kernel-ghost-wbs-directive-bindings-2026-07-15.json", "reports/kernel-tenancy-authority-inventory-2026-07-15.json", "reports/kernel-crosscut-handoff-2026-07-15.json", "reports/kernel-missing-doc-ref-placement-2026-07-15.json"];
// biome-ignore format: exact non-goals stay compact for the shard budget
const NON_GOALS = ["do not mutate canonical decisions, handoffs, nodes, queues, edges, ADRs or generated projections", "do not write runtime or platform code", "bounded governance writer and Claude worker perform no Git mutations; Codex may execute approved normal non-force commit, push, PR and CI-gated merge after independent review"];
// biome-ignore format: exact rollback stays compact for the shard budget
const ROLLBACK = { trigger: "approval evidence, selected disposition, authority boundary or fail-closed application state drifts", action: "revert this approval-intake artifact, its traceability refs, validator, tests and package gate as one shard", runtimeDataImpact: "none" };
const PACK_HEADING = "## GATE-01 Approval Intake — Application Pending";
const PACK_SECTION = `${PACK_HEADING}\n\nUser/Admin GATE-01 onayı \`reports/kernel-governance-closure-authority-2026-07-31.json\`\nile approved-application-pending olarak kaydedildi. Bu ref kanonik uygulama veya karar\nkapanışı değildir: registry pending/unselected, \`codeStartAllowed=false\` ve\n\`runtimeCodeAllowed=false\` kalır.`;
// biome-ignore format: exact registry root and parent gate stay compact for the shard budget
const REGISTRY_ROOT = { schemaVersion: "1.0.0", id: "kernel-governance-decision-registry-2026-07-15", generatedAt: "2026-07-15", status: "pending-human-decisions-no-go", authority: { finalAuthority: "codex", successorCoordinator: "project_manager", specialists: "bounded-audit-and-handoff-only", claude: "worker-slave-codex-invocation-only", runtimeExecutor: "human-developer-only" }, sourceReports: ["reports/kernel-gap-inventory-2026-07-14.json", "reports/kernel-governance-gap-addendum-2026-07-15.json"], invariants: ["KGA-D01 through KGA-D10 are globally unique and ordered.", "This registry discovers decisions; it does not select or close them.", "No pending decision permits code start or runtime readiness claims."], rollback: { trigger: "source decisions drift, duplicate IDs appear, or the registry implies a selected option", action: "revert the registry, decision-pack additions, gate wiring and their tests as one shard", runtimeDataImpact: "none" }, finalDecision: { verdict: "NO-GO", kernelReady: false, sdkReady: false, appBuildable: false, codeStartAllowed: false, nextActionable: "PR-01" } };
// biome-ignore format: exact package command stays compact for the shard budget
const PARENT_GATE = "node tools/agents/check-kernel-governance.mjs && vitest run tests/kernelGapInventory.test.ts tests/kernelCodeBearingDescendantHandoff.test.ts tests/kernelDbSubstrateQueueHandoff.test.ts tests/kernelGovernanceGapAddendum.test.ts tests/kernelGovernanceDecisionRegistry.test.ts tests/kernelGovernanceDecisionPack.test.ts tests/kernelAdrCollisionSourceBindings.test.ts tests/kernelGhostWbsDirectiveBindings.test.ts tests/kernelTenancyAuthorityInventory.test.ts tests/kernelCrosscutHandoff.test.ts tests/kernelMissingDocRefPlacement.test.ts tests/kernelSurfaceDependencyOrderHandoff.test.ts tests/kernelRuntimeSuccessorPolicy.test.ts tests/kernelGovernanceApplicationState.test.ts tests/kernelModuleRegistryOwnershipSplitHandoff.test.ts tests/kernelUnownedDirectiveOwnershipDisposition.test.ts tests/kernelScaffoldWalkingSkeletonExitSemantics.test.ts tests/kernelAdrIdentityQuarantine.test.ts tests/kernelGhostWbsIdentityRejection.test.ts && npm run qa:kernel-governance-authority";

// biome-ignore format: fail-closed contract stays compact for the shard budget
export function validateKernelGovernanceAuthorization({ authority = {}, registry = {}, pack = "", scripts = {} } = {}) {
  const errors = [];
  const exact = (actual, expected, label) => {
    if (!same(actual, expected)) errors.push(`${label} drift`);
  };
  exact([authority.schemaVersion, authority.id, authority.status], ["1.0.0", "kernel-governance-closure-authority-2026-07-31", "approved-application-pending"], "identity");
  exact(Object.keys(authority).sort(), AUTHORITY_KEYS, "authority root keys");
  exact(authority.changeBoundary, CHANGE_BOUNDARY, "change boundary");
  exact(authority.approval, APPROVAL, "approval");
  const selection = authority.approval?.normalizedSelection ?? "";
  if (Buffer.byteLength(selection, "utf8") !== 691 || createHash("sha256").update(selection).digest("hex") !== SELECTION_SHA256) errors.push("normalized selection digest drift");
  exact(authority.priorSupportingProvenance, PROVENANCE, "prior supporting provenance");
  if (authority.authorityProvenance !== undefined) errors.push("prior provenance mislabeled as authority");
  exact(authority.applications, APPLICATIONS, "applications");
  exact(authority.crosscut, CROSSCUT, "crosscut");
  exact(authority.docRefs, DOC_REFS, "doc refs");
  exact(authority.standalone, { repository: "metaframer-net/metaframer-kernel", defaultBranch: "main", governanceOwner: "karacaismail/actionplan", historyStrategy: "CLEAN_START_WITH_PROVENANCE", extractionAllowed: false }, "standalone");
  exact(authority.authorityBoundary, BOUNDARY, "authority boundary");
  exact(authority.application, { status: "pending", canonicalApplicationsComplete: false, requiredChecksComplete: false, codeStartAllowed: false, runtimeCodeAllowed: false, readinessAllowed: false, unlockCondition: "all-canonical-applications-and-checks-complete" }, "application");
  exact(authority.conditionalRuntimeAuthorization, { approved: true, activatesOnlyAfter: "all-canonical-applications-and-checks-complete", requiredSequence: ["DB/RLS/transaction/outbox/audit", "kernel-primitives", "SDK", "walking-skeleton"], active: false }, "conditional runtime authorization");
  exact(authority.sourceRefs, SOURCE_REFS, "source refs");
  exact(authority.nonGoals, NON_GOALS, "non-goals");
  exact(authority.rollback, ROLLBACK, "rollback");
  if (registry.authorizationRef !== AUTHORITY || registry.closureStateRef !== `${AUTHORITY}#application`) errors.push("registry authorization refs drift");
  if (registry.applicationStateRef !== APPLICATION_STATE) errors.push("registry application state ref drift");
  const registryRoot = Object.fromEntries(Object.entries(registry).filter(([key]) => !["applicationStateRef", "authorizationRef", "closureStateRef", "decisions"].includes(key)));
  exact(registryRoot, REGISTRY_ROOT, "registry root contract");
  const decisions = Array.isArray(registry.decisions) ? registry.decisions : [];
  if (createHash("sha256").update(JSON.stringify(decisions)).digest("hex") !== DECISIONS_SHA256) errors.push("registry decisions digest drift");
  if (decisions.length !== 10 || decisions.some((item) => item.status !== "pending" || item.selectedOption !== null || item.codeStartAllowed !== false)) errors.push("registry decision closure drift");
  const packTail = pack.slice(pack.indexOf(PACK_HEADING));
  const nextHeading = packTail.indexOf("\n## ", 1);
  const packSection = (nextHeading < 0 ? packTail : packTail.slice(0, nextHeading)).replaceAll("\r\n", "\n").trim();
  if (pack.split(PACK_HEADING).length !== 2 || packSection !== PACK_SECTION) errors.push("pack GATE-01 section drift");
  if (scripts["qa:kernel-governance-authority"] !== "vitest run tests/kernelGovernanceClosureAuthority.test.ts" || scripts["qa:kernel-governance"] !== PARENT_GATE) errors.push("named gate drift");
  return errors;
}
