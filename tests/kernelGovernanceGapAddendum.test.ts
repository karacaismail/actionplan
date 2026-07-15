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
  it("binds NO-GO to live graph, readiness, queue, ADR and ghost-WBS blockers", async () => {
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
    expect(report.structuralFindings.relationDirectionConflicts).toMatchObject({
      affectedNodeCount: 35,
      edgeCount: 46,
      kernelNodeCount: 5,
      kernelEdgeCount: 8,
    });
    expect(
      report.decisions.every((decision: { status: string }) => decision.status === "pending"),
    ).toBe(true);

    const falseGo = clone(report);
    falseGo.finalDecision.codeStartAllowed = true;
    expect(validateKernelGovernance({ nodes, queue, report: falseGo })).toContain(
      "unresolved blockers cannot allow code start",
    );
    const vacuousPass = clone(report);
    vacuousPass.structuralFindings.readinessCandidates.result = "PASS";
    expect(validateKernelGovernance({ nodes, queue, report: vacuousPass })).toContain(
      "zero candidates must remain NO_CANDIDATES",
    );
    const graphDrift = clone(report);
    graphDrift.structuralFindings.relationDirectionConflicts.edgeCount -= 1;
    expect(validateKernelGovernance({ nodes, queue, report: graphDrift })).toContain(
      "relation conflict count drift",
    );

    const scripts = readJson("package.json").scripts;
    expect(scripts["qa:kernel-governance"]).toBe("node tools/agents/check-kernel-governance.mjs");
    expect(scripts["qa:ci"]).toContain("npm run qa:kernel-governance");
    expect(read(".github/workflows/deploy.yml")).toContain("run: npm run qa:kernel-governance");
  });
});
