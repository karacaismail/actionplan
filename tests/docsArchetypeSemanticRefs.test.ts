import fs from "node:fs";
import path from "node:path";
import { AppDefinitionSchema } from "@/schemas/app-definition";
import { ModuleDefinitionSchema } from "@/schemas/module-definition";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(import.meta.dirname, "..");

const EXPECTED_REFS: Record<string, string[]> = {
  "s-accounting": [
    "docs/financial-state-model-contract.md",
    "docs/archetype-ledger-directive.md",
    "docs/drafts/archetype-ledger-directive.md",
  ],
  "s-clm": [
    "docs/archetype-agreement-lifecycle-negotiation-directive.md",
    "docs/reference/Agreement-CLM-Gereksinim-Analizi.md",
  ],
  "s-pim": [
    "docs/archetype-taxonomy-directive.md",
    "docs/archetype-variant-attribute-family-directive.md",
  ],
  "s-data-catalog": [
    "docs/decision-grade-data-contract.md",
    "docs/enterprise-saas-phase-5c-data-metadata-candidates.md",
  ],
  "s-ipaas": ["docs/enterprise-saas-phase-5f-integration-extensibility-candidates.md"],
  "s-fpa": ["docs/archetype-budget-plan-directive.md"],
  "s-dms": ["docs/archetype-document-composition-directive.md"],
  "s-inventory": ["docs/archetype-inventory-stock-directive.md"],
  "s-sales": [
    "docs/archetype-order-line-item-directive.md",
    "docs/drafts/archetype-order-line-item-directive.md",
  ],
  "s-hrms": ["docs/archetype-org-employment-directive.md"],
};

const ALLOWED_LEVELS = new Set(["archetype", "feature"]);

type SemanticTarget = {
  level?: string;
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

function expectSemanticTargetContract(nodeId: string, node: SemanticTarget) {
  if (node.level !== "app") {
    expect(ALLOWED_LEVELS.has(node.level ?? ""), `${nodeId}: executable hedef seviyesi`).toBe(true);
    return;
  }

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

describe("archetype semantic dokümanları WBS refs entegrasyonu", () => {
  for (const [nodeId, expectedRefs] of Object.entries(EXPECTED_REFS)) {
    it(`${nodeId} doğru task/app sözleşmesiyle ilgili dokümanları exact ve tekil bağlar`, () => {
      const node = readNode(nodeId);
      expectSemanticTargetContract(nodeId, node);

      for (const ref of expectedRefs) {
        expect(fs.existsSync(path.join(ROOT, ref)), `doküman yok: ${ref}`).toBe(true);
        expect(
          (node.refs ?? []).filter((candidate) => candidate === ref),
          `${nodeId}: exact/tekil ref bekleniyor: ${ref}`,
        ).toHaveLength(1);
      }
    });
  }
});
