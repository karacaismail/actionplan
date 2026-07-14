import fs from "node:fs";
import path from "node:path";
import { AppDefinitionSchema } from "@/schemas/app-definition";
import { ModuleDefinitionSchema } from "@/schemas/module-definition";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const NODE_DIR = path.join(ROOT, "src/data/generated/nodes");
const RULE_DIR = path.join(ROOT, "src/data/doc-task-content-rules");
const DIRECTLY_EXECUTABLE = new Set([
  "archetype",
  "feature",
  "component",
  "work_unit",
  "micro_step",
]);
const EXPECTED = new Map([
  ["docs/app-distribution-contract.md", ["deploy-yap"]],
  ["docs/archetype-venture-core-directive.md", ["s-pmo"]],
  ["docs/k-evidence-seal-directive.md", ["l1-audit", "s-clm"]],
  ["docs/k-kms-directive.md", ["cc-security", "s-iam"]],
  ["docs/k-legal-hold-retention-directive.md", ["cc-privacy", "s-clm"]],
  ["docs/k-migration-bridge-directive.md", ["archetype-storage-contract", "l1-import"]],
  ["docs/k-obligation-commitment-directive.md", ["s-bpm", "s-clm"]],
  ["docs/k-provider-adapter-directive.md", ["dx-api-gateway", "s-payment-methods"]],
  ["docs/k-signature-trust-directive.md", ["s-clm"]],
  ["docs/reference/Arsam-Girisim-Yonetim-Gereksinim-Analizi.md", ["s-pmo"]],
] as const);

const classifications = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src/data/doc-task-content-classification.json"), "utf8"),
) as Array<{ decision: string; docPath: string }>;
const rules = fs
  .readdirSync(RULE_DIR)
  .filter((file) => file.endsWith(".json"))
  .flatMap((file) => JSON.parse(fs.readFileSync(path.join(RULE_DIR, file), "utf8")).rules ?? []);

type DecisionTarget = {
  id: string;
  level: string;
  artifactKind?: string;
  appDefinition?: unknown;
  moduleDefinition?: unknown;
  parentId?: string | null;
  refs?: string[];
  dimensions?: unknown;
  evidence?: unknown[];
  standardRefs?: Record<string, string>;
};

const readNode = (nodeId: string) =>
  JSON.parse(fs.readFileSync(path.join(NODE_DIR, `${nodeId}.json`), "utf8")) as DecisionTarget;

function expectDecisionOwnerContract(nodeId: string, node: DecisionTarget) {
  if (DIRECTLY_EXECUTABLE.has(node.level)) return undefined;

  expect(node.level, `${nodeId}: decision owner level`).toBe("app");
  expect(node.artifactKind, `${nodeId}: promoted decision owner`).toBe("sellable-app");
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
    evidence: { actual: [] },
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
  return app;
}

describe("human decisions remain blocked but visible inside task JSON", () => {
  it("projects all ten decision documents to executable or typed app owners without deciding them", () => {
    expect(classifications.filter((entry) => entry.decision === "human-decision")).toHaveLength(10);

    for (const [docPath, expectedTargets] of EXPECTED) {
      const classification = classifications.find((entry) => entry.docPath === docPath);
      expect(classification?.decision, docPath).toBe("human-decision");
      const owners = rules.filter((rule) => (rule.sources ?? []).includes(docPath));
      expect(owners.length, `${docPath}: decision-blocker rule`).toBeGreaterThan(0);
      expect(
        owners.every((rule) => rule.content?.humanDecisionBlocker === true),
        `${docPath}: cannot imply approval`,
      ).toBe(true);

      const selected = new Set(owners.flatMap((rule) => rule.selector?.nodeIds ?? []));
      expect([...selected].sort(), `${docPath}: explicit direct owners`).toEqual(
        [...expectedTargets].sort(),
      );
      for (const nodeId of expectedTargets)
        expect(selected.has(nodeId), `${docPath}: ${nodeId}`).toBe(true);
      for (const nodeId of selected) {
        const node = readNode(nodeId);
        expectDecisionOwnerContract(nodeId, node);
        expect(
          (node.refs ?? []).some((ref: string) => ref.includes(docPath)),
          `${nodeId}: decision source ref`,
        ).toBe(true);
        expect(
          JSON.stringify(node.dimensions).includes(docPath),
          `${nodeId}: prompt projection`,
        ).toBe(true);
        expect(node.evidence, `${nodeId}: decision doc is not evidence`).toEqual([]);
      }
    }
  });
});
