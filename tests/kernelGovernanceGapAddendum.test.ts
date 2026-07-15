import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const REPORT = "reports/kernel-governance-gap-addendum-2026-07-15.json";
const LIB = "tools/lib/kernel-governance-audit.mjs";
const CHECKER = "tools/agents/check-kernel-governance.mjs";
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const readJson = (relative: string) => JSON.parse(read(relative));
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

describe("kernel governance gap addendum", () => {
  it("binds NO-GO to live graph/readiness/queue and audited ADR/WBS snapshot", async () => {
    for (const file of [REPORT, LIB, CHECKER])
      expect(fs.existsSync(path.join(ROOT, file))).toBe(true);
    const { validateKernelGovernance } = await import(pathToFileURL(path.join(ROOT, LIB)).href);
    const nodes = fs
      .readdirSync(path.join(ROOT, "src/data/generated/nodes"))
      .filter((file) => file.endsWith(".json"))
      .map((file) => readJson(`src/data/generated/nodes/${file}`));
    const queue = readJson("reports/platform-implementation-execution-queue-2026-07-09.json");
    const report = readJson(REPORT);
    const artifactRefs = {
      adrCollisionSourceBindings: "reports/kernel-adr-collision-source-bindings-2026-07-15.json",
      ghostWbsDirectiveBindings: "reports/kernel-ghost-wbs-directive-bindings-2026-07-15.json",
      tenancyAuthorityInventory: "reports/kernel-tenancy-authority-inventory-2026-07-15.json",
    };
    const artifacts = {
      adrCollisions: readJson(artifactRefs.adrCollisionSourceBindings),
      ghostBindings: readJson(artifactRefs.ghostWbsDirectiveBindings),
      tenancyAuthority: readJson(artifactRefs.tenancyAuthorityInventory),
    };

    expect(validateKernelGovernance({ nodes, queue, report, artifacts })).toEqual([]);
    expect(report.governanceArtifacts).toEqual(artifactRefs);
    expect(report.finalDecision).toMatchObject({
      verdict: "NO-GO",
      codeStartAllowed: false,
      kernelReady: false,
      sdkReady: false,
      appBuildable: false,
    });
    const invalid = (field: string, value: unknown, error: string) => {
      const candidate = clone(report);
      const path = field.replace(/^\$/, "structuralFindings.").split(".");
      const leaf = path.pop() as string;
      let target = candidate;
      for (const key of path) target = target[key];
      target[leaf] = value;
      expect(validateKernelGovernance({ nodes, queue, report: candidate })).toContain(error);
    };
    invalid("finalDecision.codeStartAllowed", true, "unresolved blockers cannot allow code start");
    invalid(
      "structuralFindings.readinessCandidates.result",
      "PASS",
      "zero candidates must remain NO_CANDIDATES",
    );
    invalid(
      "structuralFindings.relationDirectionConflicts.edgeCount",
      45,
      "relation conflict count drift",
    );
    invalid("decisions", [], "decision inventory drift");
    invalid("sourceSnapshot.kernelSp", 0, "kernel snapshot drift");
    invalid(
      "structuralFindings.readinessCandidates.doneNodes",
      1,
      "readiness candidate count drift",
    );
    invalid("structuralFindings.adrCollisions.0.id", "ADR-Z", "ADR collision snapshot drift");
    const joinedGhosts = clone(report.structuralFindings.ghostWbsClaims.missingNodeIds);
    joinedGhosts.splice(0, 2, joinedGhosts.slice(0, 2).join("|"));
    invalid("$ghostWbsClaims.missingNodeIds", joinedGhosts, "ghost WBS snapshot drift");
    invalid("$relationDirectionConflicts.kernelNodeIds.0", "x", "relation conflict count drift");
    invalid("authority.finalAuthority", "pm", "authority chain drift");
    invalid("decisions.0.decisionOwner", "codex", "decision authority drift");
    invalid("finalDecision.verdict", "GO", "runtime verdict must remain NO-GO");

    const rejectsArtifact = (mutate: (a: typeof artifacts) => void, error: string) => {
      const candidate = clone(artifacts);
      mutate(candidate);
      expect(validateKernelGovernance({ nodes, queue, report, artifacts: candidate })).toContain(
        error,
      );
    };
    rejectsArtifact((a) => {
      a.adrCollisions.approvalRefAllowed = true;
    }, "ADR approval ref requires human decision");
    rejectsArtifact((a) => {
      a.adrCollisions.collisions[0].canonicalTopic = "evidence-seal";
    }, "ADR canonical topic requires human decision");
    rejectsArtifact((a) => {
      a.ghostBindings.bindings[0].selected = true;
    }, "ghost binding cannot select a canonical node");
    rejectsArtifact((a) => {
      a.ghostBindings.nodeCreationAllowed = true;
    }, "ghost binding ledger cannot create WBS nodes");
    rejectsArtifact((a) => {
      a.tenancyAuthority.tenancy.physicalStrategy = "schema-per-tenant";
    }, "tenancy inventory cannot select a topology");
    rejectsArtifact((a) => {
      a.tenancyAuthority.tenancy.mandatoryRls = false;
    }, "tenancy inventory cannot weaken mandatory RLS");
    for (const key of ["adrCollisions", "ghostBindings", "tenancyAuthority"] as const)
      rejectsArtifact((a) => {
        a[key].authorityBoundary.codeStartAllowed = true;
      }, "governance artifact cannot allow code start");
    rejectsArtifact((a) => {
      a.adrCollisions.decision.finalAuthority = "pm";
    }, "governance artifact authority drift");
    rejectsArtifact((a) => {
      a.tenancyAuthority.authorityBoundary.kernelReady = true;
    }, "governance artifact cannot claim readiness");
    const wrongRef = clone(report);
    wrongRef.governanceArtifacts.adrCollisionSourceBindings = "reports/wrong.json";
    expect(validateKernelGovernance({ nodes, queue, report: wrongRef, artifacts })).toContain(
      "governance artifact ref drift",
    );

    const scripts = readJson("package.json").scripts;
    const governanceGate = scripts["qa:kernel-governance"] as string;
    expect(governanceGate).toContain("node tools/agents/check-kernel-governance.mjs");
    for (const exactTest of [
      "kernelGapInventory.test.ts",
      "kernelGovernanceGapAddendum.test.ts",
      "kernelGovernanceDecisionRegistry.test.ts",
      "kernelGovernanceDecisionPack.test.ts",
      "kernelAdrCollisionSourceBindings.test.ts",
      "kernelGhostWbsDirectiveBindings.test.ts",
      "kernelTenancyAuthorityInventory.test.ts",
      "kernelCrosscutHandoff.test.ts",
      "kernelMissingDocRefPlacement.test.ts",
    ])
      expect(governanceGate).toContain(exactTest);
    expect(scripts["qa:ci"]).toContain("npm run qa:kernel-governance");
    expect(read(".github/workflows/deploy.yml")).toContain("run: npm run qa:kernel-governance");
  });
});
