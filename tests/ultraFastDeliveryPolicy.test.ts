import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { StandardContractSchema } from "@/schemas";
import { describe, expect, it } from "vitest";

/**
 * RED-establishing suite for the Actionplan ULTRA_FAST_ACTIONPLAN_V1.1 transition.
 * `short-code.json#changePackageBudget.ultraFastV1` is the sole canonical owner and
 * pointer of the ultra-fast delivery policy; there is no separate ultra-fast-v1.json
 * file. None of this exists yet.
 */
type Dict = Record<string, unknown>;

const ROOT = process.cwd();
const SHORT_CODE_PATH = "src/data/standards/short-code.json";
const EVIDENCE_HASHES = [
  "dc9ec29684b493f19646451db72f2ea1263a4d2f06c7b4a0d94e8e21f0d9cbc5",
  "f7ee1d903c3febaf70935866663be28bb0078b67b0b30da56fc9242c49840be5",
];
const POINTER_PROJECTION_FILES = [
  "AGENTS.md",
  "CLAUDE.md",
  "RULES.md",
  "docs/roadmap-pm-paritesi.md",
  ".claude/skills/ultra-fast-development/SKILL.md",
];
const AGENT_PROFILE_DIR = ".claude/agents";

const readJson = (relPath: string): Dict => {
  const abs = path.join(ROOT, relPath);
  if (!fs.existsSync(abs)) throw new Error(`missing: ${relPath}`);
  return JSON.parse(fs.readFileSync(abs, "utf8")) as Dict;
};

const shortCode = (): Dict => readJson(SHORT_CODE_PATH);
const ultraFastPolicy = (): Dict => {
  const budget = shortCode().changePackageBudget as Dict | undefined;
  return budget?.ultraFastV1 as Dict;
};

describe("ultra-fast-v1 delivery policy — pointer, contract and terminal outcomes", () => {
  it("resolves the sole canonical owner and pointer at short-code#changePackageBudget.ultraFastV1, validates the short-code ROOT document as a StandardContract, and carries the nested policy object", () => {
    const standardDoc = shortCode();
    const parsed = StandardContractSchema.safeParse(standardDoc);
    expect(parsed.success).toBe(true);

    const budget = standardDoc.changePackageBudget as Dict | undefined;
    expect(budget && "ultraFastV1" in budget).toBe(true);
    expect(typeof budget?.ultraFastV1).toBe("object");
  });

  it("declares behavioral-test scoping bands: active-default 3..8 scenarios/2 files, non-behavioral 0..2/N-A, named-risk exceptions require named risk + bounded ceiling + independent review", () => {
    const policy = ultraFastPolicy();
    const scoping = policy?.testScoping as Dict;

    const activeDefault = scoping?.activeDefault as Dict;
    expect(activeDefault?.minScenarios).toBe(3);
    expect(activeDefault?.maxScenarios).toBe(8);
    expect(activeDefault?.maxTestFiles).toBe(2);

    const nonBehavioral = scoping?.nonBehavioral as Dict;
    expect(nonBehavioral?.minScenarios).toBe(0);
    expect(nonBehavioral?.maxScenarios).toBe(2);
    expect(nonBehavioral?.explicitRedAllowed).toBe("N/A");

    const namedRisk = scoping?.namedRiskException as Dict;
    expect(namedRisk?.requiresNamedRisk).toBe(true);
    expect(namedRisk?.requiresBoundedLocalCeiling).toBe(true);
    expect(namedRisk?.requiresIndependentReview).toBe(true);
  });

  it("fixes checkpoint cadence to 20 minutes, max 1 correction wave, and exactly the three terminal outcomes", () => {
    const policy = ultraFastPolicy();
    const cadence = policy?.checkpointCadence as Dict;

    expect(cadence?.checkpointMinutes).toBe(20);
    expect(cadence?.maxCorrectionWaves).toBe(1);
    expect(cadence?.terminalOutcomes).toEqual([
      "READY_FOR_CI",
      "CLEAN_SPLIT_OR_ROLLBACK",
      "BLOCKED_WITH_ONE_EVIDENCE",
    ]);
  });

  it("binds QA budget to writer-local-then-CI only, forbids unchanged-snapshot rerun, restricts browser verification to visible UI journey change, and keeps test/implementation/reviewer roles separate", () => {
    const policy = ultraFastPolicy();
    const qa = policy?.qaDiscipline as Dict;

    expect(qa?.fullQaSequence).toEqual(["writer-local", "ci"]);
    expect(qa?.unchangedSnapshotRerunAllowed).toBe(false);
    expect(qa?.browserVerificationScope).toBe("visible-ui-journey-change-only");

    const roles = qa?.separateRoles as string[] | undefined;
    expect(roles).toEqual(expect.arrayContaining(["test", "implementation", "read-only-reviewer"]));
    expect(new Set(roles)).toEqual(new Set(["test", "implementation", "read-only-reviewer"]));
  });

  it("scopes Pane admission to JIT exact-worktree with no speculative creation, concurrency = min(guardian, dag-ready, shared-lock, static 3), and event-driven GC", () => {
    const policy = ultraFastPolicy();
    const pane = policy?.paneAdmission as Dict;

    expect(pane?.admissionMode).toBe("jit-exact-worktree");
    expect(pane?.speculativeCreationAllowed).toBe(false);
    expect(pane?.concurrencyFormula).toBe(
      "min(guardianRecommended, dagReadyCount, sharedLockCapacity, 3)",
    );
    expect(pane?.staticConcurrencyCeiling).toBe(3);
    expect(pane?.gcTrigger).toBe("event-driven");
  });

  it("reserves reversible decisions to MASTER, restricts owner questions to the named categories, requires pointer projections in every listed file plus agent profiles, and requires the deterministic validator to be GREEN — recording both evidence hashes without copying report prose", () => {
    const policy = ultraFastPolicy();
    const authority = policy?.decisionAuthority as Dict;

    expect(authority?.masterDecidesWithoutAsking).toEqual(
      expect.arrayContaining([
        "reversible-technical",
        "worktree",
        "test-framework",
        "git",
        "pr",
        "ci",
      ]),
    );
    expect(authority?.ownerQuestionCategories).toEqual(
      expect.arrayContaining([
        "product-brand-scope",
        "irreversible-impact",
        "external-cost",
        "security-risk-appetite",
        "credentials",
        "genuinely-required-external-authority",
      ]),
    );

    const projections = authority?.pointerProjectionFiles as string[] | undefined;
    for (const expected of POINTER_PROJECTION_FILES) {
      expect(projections).toContain(expected);
    }
    expect(projections?.some((p) => p.startsWith(AGENT_PROFILE_DIR))).toBe(true);

    const validatorScript = "tools/agents/check-ultra-fast-delivery.mjs";
    let exitStatus = -1;
    try {
      execFileSync(process.execPath, [path.join(ROOT, validatorScript)], { cwd: ROOT });
      exitStatus = 0;
    } catch (err) {
      const status = (err as { status?: number | null }).status;
      exitStatus = typeof status === "number" ? status : -1;
    }
    expect(exitStatus).toBe(0);

    const evidence = policy?.evidenceHashes as string[] | undefined;
    for (const hash of EVIDENCE_HASHES) {
      expect(evidence).toContain(hash);
    }
    expect(JSON.stringify(policy)).not.toMatch(/CLEAN_SPLIT_OR_ROLLBACK terminal outcome report/i);
  });
});
