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

    expect(validateKernelGovernance({ nodes, queue, report })).toEqual([]);
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

    const scripts = readJson("package.json").scripts;
    expect(scripts["qa:kernel-governance"]).toBe("node tools/agents/check-kernel-governance.mjs");
    expect(scripts["qa:ci"]).toContain("npm run qa:kernel-governance");
    expect(read(".github/workflows/deploy.yml")).toContain("run: npm run qa:kernel-governance");
  });
});
