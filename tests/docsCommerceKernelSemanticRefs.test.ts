import fs from "node:fs";
import path from "node:path";
import { AppDefinitionSchema } from "@/schemas/app-definition";
import { ModuleDefinitionSchema } from "@/schemas/module-definition";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(import.meta.dirname, "..");

const COMMERCE_CONTRACT_REFS = [
  "docs/commerce-os-bounded-context-map.md",
  "docs/commerce-os-capability-classification.md",
  "docs/commerce-os-contract-test-plan.md",
  "docs/commerce-os-data-migration-contract.md",
  "docs/commerce-os-product-scope.md",
  "docs/commerce-os-stack-app-composition.md",
];

const EXPECTED_REFS: Record<string, string[]> = {
  "golden-slice-ref": [
    "docs/archetype-eav-directive.md",
    "docs/archetype-tree-relation-directive.md",
    "docs/archetype-uretim-spec.md",
    "docs/atom-archetype-bagi-clm-ornegi-2026-07-01.md",
    "docs/atomik-primitif-katman-gap-2026-07-01.md",
    "docs/commerce-os-kernel-sdk-gap-directive.md",
    "docs/commerce-os-test-first-parallel-handoff.md",
    "docs/commerce-os-vibecoder-readiness-oracles.md",
    "docs/commerce-os-vibecoder-task-packets.md",
    "docs/enterprise-saas-product-family-composition.md",
  ],
  "k-wbs": [
    "docs/atom-micro-step-gap-unknown-unknowns-report-2026-07-12.md",
    "docs/gap-2026-07-02-01-kernel.md",
    "docs/kernel-numeronym-eslemesi.md",
    "docs/micro-step-atom-gap-claude-vibecoding-2026-07-02.md",
    "docs/work-unit-molecule-gap-claude-vibecoding-2026-07-02.md",
  ],
  "s-marketplace": ["docs/archetype-listing-directive.md"],
  "s-conversational": ["docs/archetype-messaging-thread-directive.md"],
  "s-dms": ["docs/media-file-manager-maturity-codex-directive-2026-07-13.md"],
  "s-sales": COMMERCE_CONTRACT_REFS,
  "s-inventory": COMMERCE_CONTRACT_REFS,
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

describe("commerce ve kernel semantic dokümanları WBS refs entegrasyonu", () => {
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
