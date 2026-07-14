import fs from "node:fs";
import path from "node:path";
import { AppDefinitionSchema } from "@/schemas/app-definition";
import { ModuleDefinitionSchema } from "@/schemas/module-definition";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(import.meta.dirname, "..");

const EXPECTED = {
  "s-bpm": {
    level: "app",
    refs: ["docs/drafts/workflow-directive.md"],
  },
  "std-contracts": {
    level: "feature",
    refs: [
      "docs/enterprise-saas-phase-5a-strategy-commercial-candidates.md",
      "docs/standards/10-business-model-switching-standard.md",
    ],
  },
  "std-ci-gates": {
    level: "feature",
    refs: [
      "docs/standards/14-enterprise-readiness-checklist.md",
      "docs/standards/enterprise-standards-audit-2026-07-01.md",
    ],
  },
} as const;

type SemanticTarget = {
  id: string;
  level: string;
  artifactKind?: string;
  appDefinition?: unknown;
  moduleDefinition?: unknown;
  parentId?: string | null;
  refs?: string[];
  standardRefs?: Record<string, string>;
};

const readNode = (nodeId: string) =>
  JSON.parse(
    fs.readFileSync(path.join(ROOT, "src/data/generated/nodes", `${nodeId}.json`), "utf8"),
  ) as SemanticTarget;

function expectAppContract(nodeId: string, node: SemanticTarget) {
  expect(node.artifactKind, `${nodeId}: promoted app identity`).toBe("sellable-app");
  expect(node.standardRefs, `${nodeId}: enterprise/SDK standards`).toMatchObject({
    enterpriseDeliveryRef: "enterprise-delivery",
    sdkDevelopmentRef: "sdk-development",
  });
  const app = AppDefinitionSchema.parse(node.appDefinition);
  expect(app.productSlug).toBe(nodeId);
  expect(app.enterpriseDelivery).toMatchObject({
    targetGrade: "enterprise",
    deliveryPolicy: "enterprise-only",
    mvpAllowed: false,
  });
  expect(app.sdkDelivery).toMatchObject({
    required: true,
    manualEditAllowed: false,
    publicPortsOnly: true,
    kernelInternalsAllowed: false,
  });

  const core = readNode(app.appCoreModuleId);
  expect(core, `${nodeId}: canonical app-core`).toMatchObject({
    level: "module",
    parentId: nodeId,
    artifactKind: "app-core-module",
    standardRefs: {
      enterpriseDeliveryRef: "enterprise-delivery",
      sdkDevelopmentRef: "sdk-development",
    },
  });
  expect(ModuleDefinitionSchema.parse(core.moduleDefinition)).toMatchObject({
    appId: nodeId,
    moduleId: app.appCoreModuleId,
    appCoreModuleId: app.appCoreModuleId,
    sdkDelivery: { required: true, manualEditAllowed: false },
    enterpriseDelivery: { targetGrade: "enterprise", mvpAllowed: false },
  });
}

describe("son program dokümanları semantik WBS refs entegrasyonu", () => {
  for (const [nodeId, expected] of Object.entries(EXPECTED)) {
    it(`${nodeId} doğru hedef sözleşmesinde exact ve tekil doküman ref'leri taşır`, () => {
      const node = readNode(nodeId);

      expect(node.id).toBe(nodeId);
      expect(node.level).toBe(expected.level);
      if (node.level === "app") expectAppContract(nodeId, node);
      expect(new Set(node.refs ?? []).size, `${nodeId}: refs[] içinde duplicate var`).toBe(
        (node.refs ?? []).length,
      );

      for (const docPath of expected.refs) {
        expect(fs.existsSync(path.join(ROOT, docPath)), `doküman yok: ${docPath}`).toBe(true);
        expect(
          (node.refs ?? []).filter((ref) => ref === docPath),
          `${nodeId}: exact ve tekil ref bekleniyor: ${docPath}`,
        ).toHaveLength(1);
      }
    });
  }
});
