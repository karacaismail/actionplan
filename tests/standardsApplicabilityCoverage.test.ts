import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import techProfilesJson from "@/data/tech-profiles.json";
import * as Engine from "@/engine";
import { type StandardRefs, TaskNodeSchema, type WbsLevel } from "@/schemas";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MATRIX_PATH = path.join(ROOT, "src/data/standards-applicability.json");
const NODES_DIR = path.join(ROOT, "src/data/generated/nodes");

const EXPECTED_LEVEL_REFS = {
  app: ["architectureRef", "releasePolicyRef", "aiGovernanceRef", "i18nRef"],
  module: [
    "architectureRef",
    "qualityGateRef",
    "dataApiContractRef",
    "observabilityRef",
    "testingStandardRef",
    "releasePolicyRef",
    "aiGovernanceRef",
    "i18nRef",
  ],
  archetype: [
    "architectureRef",
    "codingStandardRef",
    "shortCodeRef",
    "qualityGateRef",
    "dataApiContractRef",
    "observabilityRef",
    "testingStandardRef",
    "releasePolicyRef",
    "aiGovernanceRef",
    "i18nRef",
  ],
  feature: [
    "codingStandardRef",
    "shortCodeRef",
    "qualityGateRef",
    "dataApiContractRef",
    "testingStandardRef",
  ],
  component: ["codingStandardRef", "shortCodeRef", "testingStandardRef"],
  work_unit: ["codingStandardRef", "shortCodeRef", "testingStandardRef"],
  micro_step: [],
} satisfies Record<WbsLevel, string[]>;

const EXPECTED_UI_OVERLAY = {
  uiArtifactRoles: ["produces-ui", "changes-ui-contract"],
  requiredRefs: [
    "techProfileRef",
    "designSystemRef",
    "uiComponentRef",
    "uxStandardRef",
    "stateContractRef",
    "i18nRef",
  ],
};

const CANONICAL_REF_VALUES: Record<string, string> = {
  architectureRef: "architecture",
  codingStandardRef: "coding-standards",
  shortCodeRef: "short-code",
  qualityGateRef: "quality-gates",
  designSystemRef: "design-system",
  uiComponentRef: "ui-components",
  uxStandardRef: "ux-interaction",
  dataApiContractRef: "data-api-contract",
  stateContractRef: "state-management",
  testingStandardRef: "testing-strategy",
  observabilityRef: "observability",
  releasePolicyRef: "release-versioning",
  aiGovernanceRef: "ai-governance",
  i18nRef: "i18n-standards",
};

interface StandardsApplicabilityMatrix {
  schemaVersion: string;
  requiredByLevel: Record<WbsLevel, string[]>;
  surfaceOverlays: {
    frontendUi: {
      uiArtifactRoles: string[];
      requiredRefs: string[];
    };
  };
}

interface RawTaskNode {
  id: string;
  level: WbsLevel;
  uiArtifactRole?: string;
  standardRefs?: Record<string, string | undefined>;
}

function readMatrix(): StandardsApplicabilityMatrix | undefined {
  if (!fs.existsSync(MATRIX_PATH)) return undefined;
  return JSON.parse(fs.readFileSync(MATRIX_PATH, "utf8")) as StandardsApplicabilityMatrix;
}

function readRawNodes(): RawTaskNode[] {
  return fs
    .readdirSync(NODES_DIR)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => JSON.parse(fs.readFileSync(path.join(NODES_DIR, file), "utf8")) as RawTaskNode);
}

function profileIds(): Set<string> {
  const raw = techProfilesJson as unknown as {
    profiles: Array<{ id: string }>;
  };
  return new Set(raw.profiles.map((profile) => profile.id));
}

function expectedValue(key: string, actual: string | undefined): string | undefined {
  if (key === "techProfileRef") return actual && profileIds().has(actual) ? actual : undefined;
  return actual === CANONICAL_REF_VALUES[key] ? actual : undefined;
}

describe("standards applicability — machine-readable level + surface contract", () => {
  it("materializes the canonical matrix as src/data/standards-applicability.json", () => {
    expect(fs.existsSync(MATRIX_PATH), `${MATRIX_PATH} bulunamadı`).toBe(true);

    const matrix = readMatrix();
    expect(matrix?.schemaVersion).toMatch(/^1\./);
    expect(matrix?.requiredByLevel).toEqual(EXPECTED_LEVEL_REFS);
    expect(matrix?.surfaceOverlays.frontendUi).toEqual(EXPECTED_UI_OVERLAY);
  });

  it("keeps techProfileRef surface-owned per ADR-0026, not level-defaulted", () => {
    const matrix = readMatrix();
    const byLevel = matrix?.requiredByLevel ?? EXPECTED_LEVEL_REFS;

    for (const [level, refs] of Object.entries(byLevel)) {
      expect(refs, `${level} techProfileRef'i kör level default'u yapmamalı`).not.toContain(
        "techProfileRef",
      );
    }
    expect(
      matrix?.surfaceOverlays.frontendUi.requiredRefs ?? EXPECTED_UI_OVERLAY.requiredRefs,
    ).toContain("techProfileRef");
  });

  it("writes every required level ref directly into executable task JSON", () => {
    const matrix = readMatrix();
    const requiredByLevel = matrix?.requiredByLevel ?? EXPECTED_LEVEL_REFS;
    const failures: string[] = [];

    for (const node of readRawNodes()) {
      // app/module kapsam düğümleri insan yetkisindedir; bu kapı onların raw JSON'unu mutate etmez.
      if (node.level === "app" || node.level === "module") continue;
      for (const key of requiredByLevel[node.level]) {
        const actual = node.standardRefs?.[key];
        if (!expectedValue(key, actual))
          failures.push(`${node.id}:${key}=${actual ?? "<missing>"}`);
      }
    }

    expect(
      failures.slice(0, 30),
      `${failures.length} eksik/yanlış level ref:\n${failures.slice(0, 30).join("\n")}`,
    ).toEqual([]);
  });

  it("writes frontend-ui overlay refs directly into UI-producing executable task JSON", () => {
    const matrix = readMatrix();
    const overlay = matrix?.surfaceOverlays.frontendUi ?? EXPECTED_UI_OVERLAY;
    const uiRoles = new Set(overlay.uiArtifactRoles);
    const failures: string[] = [];

    for (const node of readRawNodes()) {
      if (
        node.level === "app" ||
        node.level === "module" ||
        !uiRoles.has(node.uiArtifactRole ?? "")
      )
        continue;
      for (const key of overlay.requiredRefs) {
        const actual = node.standardRefs?.[key];
        if (!expectedValue(key, actual))
          failures.push(`${node.id}:${key}=${actual ?? "<missing>"}`);
      }
    }

    expect(
      failures.slice(0, 30),
      `${failures.length} eksik/yanlış frontend-ui ref:\n${failures.slice(0, 30).join("\n")}`,
    ).toEqual([]);
  });
});

describe("standards applicability — protected app/module runtime projection", () => {
  const protectedNodes = (["app", "module"] as const).map((level) =>
    TaskNodeSchema.parse({
      id: `protected-${level}-fixture`,
      level,
      title: `Protected ${level}`,
      slug: `protected-${level}-fixture`,
      standardRefs: {},
    }),
  );

  it("effectiveStandardRefs resolves required refs without assigning a blind tech profile", () => {
    const effectiveStandardRefs = (
      Engine as unknown as {
        effectiveStandardRefs?: (node: (typeof protectedNodes)[number]) => StandardRefs;
      }
    ).effectiveStandardRefs;

    expect(effectiveStandardRefs).toBeTypeOf("function");
    if (!effectiveStandardRefs) return;

    for (const node of protectedNodes) {
      const refs = effectiveStandardRefs(node);
      for (const key of EXPECTED_LEVEL_REFS[node.level]) {
        expect((refs as Record<string, string>)[key], `${node.level}:${key}`).toBe(
          CANONICAL_REF_VALUES[key],
        );
      }
      expect(refs.techProfileRef, `${node.level} surface kanıtı olmadan profil seçmemeli`).toBe("");
    }
  });

  it("nodeStandards exposes the effective protected-node contracts on task pages", () => {
    for (const node of protectedNodes) {
      const resolved = Engine.nodeStandards(node);
      for (const key of EXPECTED_LEVEL_REFS[node.level]) {
        expect(
          resolved.some(
            (standard) => standard.key === key && standard.id === CANONICAL_REF_VALUES[key],
          ),
          `${node.level}:${key} task sayfasında çözülmedi`,
        ).toBe(true);
      }
      expect(resolved.some((standard) => standard.key === "techProfileRef")).toBe(false);
    }
  });
});
