import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Test-first provenance: report absence was the RED gate after source probes passed.

const ROOT = process.cwd();
const REPORT = "reports/kernel-crosscut-handoff-2026-07-15.json";
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const exists = (relative: string) => fs.existsSync(path.join(ROOT, relative));
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const PENDING_AXES = [
  "graphql-contract-source",
  "control-plane-taxonomy",
  "accessibility-applicability",
  "performance-budget",
  "deployment-profile",
  "i18n-fallback",
  "dependency-direction",
] as const;

type Axis = {
  id: (typeof PENDING_AXES)[number];
  requiredEvidenceTypes: string[];
  sourceEvidence: { path: string; lineContains: string }[];
};

// Observation-only: never choose a source, plane, level, SLO, topology, locale or implementation.
// biome-ignore format: audited source snapshot stays compact for the shard budget
const AXES: Axis[] = [
  {
    id: "graphql-contract-source",
      requiredEvidenceTypes: ["node-contract", "readiness-gap"],
      sourceEvidence: [
      { path: "src/data/generated/nodes/platform-graphql-api.json", lineContains: "Sözleşme şema-ilk (schema-first) tutulur" },
      {
        path: "docs/be-sdk-readiness-gap-2026-07-09.md",
        lineContains: "Public contract kaynağı net değildir",
      },
    ],
  },
  {
    id: "control-plane-taxonomy",
      requiredEvidenceTypes: ["node-contract", "panel-contract"],
      sourceEvidence: [
      { path: "src/data/generated/nodes/k-control-planes.json", lineContains: "Public/Frontpages (Boyut 4)" },
      { path: "src/data/generated/nodes/k-control-planes.json", lineContains: "Tenant-admin, Agent" },
      { path: "docs/panel-tier-contract.md", lineContains: "Üç Panel Katmanı + Counterparty Sınıfı" },
    ],
  },
  {
    id: "accessibility-applicability",
    requiredEvidenceTypes: ["standard-narrative", "node-contract"],
      sourceEvidence: [
      { path: "docs/standards/02-a11y-accessibility-standard.md", lineContains: "WCAG 2.2 AA'yı taban kabul eder" },
      { path: "src/data/generated/nodes/k-control-planes.json", lineContains: "WCAG 2.2 AAA" },
    ],
  },
  {
    id: "performance-budget",
      requiredEvidenceTypes: ["node-contract", "enterprise-contract"],
      sourceEvidence: [
      { path: "src/data/generated/nodes/platform-graphql-api.json", lineContains: "\"target\": \"≤ 100ms\"" },
      { path: "src/data/generated/nodes/platform-graphql-api.json", lineContains: "SLO: p95 200ms" },
      { path: "docs/app-enterprise-definition-contract.md", lineContains: "p95 <= 400 ms" },
    ],
  },
  {
    id: "deployment-profile",
      requiredEvidenceTypes: ["runbook", "node-contract"],
      sourceEvidence: [
      { path: "docs/deploy-separation-runbooks.md", lineContains: "Tek gerçek production hedefi budur" },
      { path: "src/data/generated/nodes/be-deploy-profilleri.json", lineContains: "Docker Swarm, Kubernetes (tam), shared hosting (degrade)" },
    ],
  },
  {
    id: "i18n-fallback",
      requiredEvidenceTypes: ["ci-gate", "standard-narrative"],
      sourceEvidence: [
      { path: "tools/agents/check-i18n.mjs", lineContains: "surface i18n alanı henüz zorunlu-şema DEĞİL" },
      { path: "docs/i18n-standard.md", lineContains: "etkin locale = kullanıcı-tercihi" },
    ],
  },
  {
    id: "dependency-direction",
      requiredEvidenceTypes: ["dimension-contract", "node-contract"],
      sourceEvidence: [
      { path: "docs/dimension-contract-17.md", lineContains: "bağımlılık yönü: yalnız aşağı" },
      { path: "src/data/generated/nodes/be-sdk.json", lineContains: "MIT/API-boundary rolü" },
    ],
  },
];
describe("kernel crosscut handoff — test-first RED", () => {
  it("cited source evidence exists before the report is required", () => {
    expect(AXES.map((axis) => axis.id)).toEqual([...PENDING_AXES]);
    for (const axis of AXES) {
      expect(axis.requiredEvidenceTypes.length).toBeGreaterThan(0);
      expect(axis.sourceEvidence.length).toBeGreaterThan(0);
      for (const evidence of axis.sourceEvidence) {
        expect(exists(evidence.path)).toBe(true);
        expect(read(evidence.path)).toContain(evidence.lineContains);
      }
    }

    const enforce = (report: {
      authority: Record<string, string>;
      axisDefaults: Record<string, unknown>;
      axes: Array<Record<string, unknown>>;
      readiness: Record<string, unknown>;
      mutationBoundary: Record<string, unknown>;
      rollback: Record<string, unknown>;
    }) => {
      expect(report.authority).toMatchObject({
        finalAuthority: "codex",
        successorCoordinator: "project-manager",
        specialistLayer: "specialist-agents",
        workerLayer: "claude-workers-slaves",
        runtimeExecutor: "human-developer-only",
      });
      const axes = report.axes.map((axis) => ({ ...report.axisDefaults, ...axis }));
      expect(axes.map((axis) => axis.id)).toEqual([...PENDING_AXES]);
      for (const axis of axes) {
        const src = AXES.find((known) => known.id === axis.id);
        expect(src).toBeDefined();
        expect(axis.decisionOwner).toBe("user-admin");
        expect(axis.coordinator).toBe("project-manager");
        expect(axis.status).toBe("pending");
        expect(axis.selectedOption).toBeNull();
        expect(axis.applicability).toBeNull();
        expect(axis.allowedApplicability).toEqual(["required", "not-applicable"]);
        expect(axis.rationaleRequired).toBe(true);
        expect(axis.rationale).toBeNull();
        expect(axis.decisionEvidence).toEqual([]);
        expect(axis.codeStartAllowed).toBe(false);
        expect(typeof axis.observation === "string" && axis.observation.length > 20).toBe(true);
        expect(axis.requiredEvidenceTypes).toEqual(src?.requiredEvidenceTypes);
        const evidence = axis.sourceEvidence as Array<{ path: string; lineContains: string }>;
        expect(evidence).toEqual(src?.sourceEvidence);
        for (const item of evidence) {
          expect(exists(item.path)).toBe(true);
          expect(read(item.path)).toContain(item.lineContains);
        }
      }
      // Reject negative clones: chosen option, non-null applicability, wrong authority, GO/ready.
      expect(axes.some((axis) => axis.selectedOption !== null)).toBe(false);
      expect(axes.some((axis) => axis.applicability !== null)).toBe(false);
      expect(report.authority.finalAuthority).not.toBe("project-manager");
      expect(report.authority.runtimeExecutor).not.toBe("ai");
      expect(report.readiness).toMatchObject({
        codeStartAllowed: false,
        kernelReady: false,
        sdkReady: false,
        appBuildable: false,
        verdict: "NO-GO",
      });
      expect(report.readiness.verdict).not.toBe("GO");
      expect(report.mutationBoundary).toEqual({
        generatedNodes: false,
        generators: false,
        runtime: false,
      });
      expect(report.rollback).toMatchObject({ runtimeDataImpact: "none" });
      expect(report.rollback.action).toContain("governance integration shard");
    };

    expect(exists(REPORT)).toBe(true);
    const report = JSON.parse(read(REPORT));
    enforce(report);

    // biome-ignore format: mutation matrix stays compact for the shard budget
    const negativeClones: Array<(candidate: typeof report) => void> = [
      (candidate) => { candidate.axes[0].selectedOption = "chosen"; },
      (candidate) => {
        candidate.axes[1].applicability = "required";
        candidate.axes[1].rationale = "";
        candidate.axes[1].decisionOwner = "";
        candidate.axes[1].decisionEvidence = [];
      },
      (candidate) => { candidate.authority.finalAuthority = "project-manager"; },
      (candidate) => { candidate.readiness.kernelReady = true; },
      (candidate) => { candidate.readiness.verdict = "GO"; },
      (candidate) => { candidate.mutationBoundary.generatedNodes = true; },
      (candidate) => { candidate.mutationBoundary.generators = true; },
      (candidate) => { candidate.mutationBoundary.runtime = true; },
      (candidate) => { candidate.rollback.runtimeDataImpact = "runtime"; },
    ];
    for (const mutate of negativeClones) {
      const candidate = clone(report);
      mutate(candidate);
      expect(() => enforce(candidate)).toThrow();
    }
  });
});
