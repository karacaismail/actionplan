import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AppDefinitionSchema } from "@/schemas/app-definition";
import { ModuleDefinitionSchema } from "@/schemas/module-definition";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const EXPECTED_REFS: Record<string, string[]> = {
  "s-ai-governance": [
    "docs/enterprise-saas-phase-5h-ai-data-science-candidates.md",
    "docs/enterprise-saas-phase-9-adversarial-review.md",
    "docs/enterprise-saas-waterfall-claude-multi-agent-directive.md",
    "docs/implementation-prompt-boundary-gap-report-2026-07-08.md",
    "docs/templates/platform-agent-boundary/AGENTS.md",
    "docs/templates/platform-agent-boundary/CLAUDE.md",
  ],
  "cc-security": [
    "docs/enterprise-saas-phase-5d-security-privacy-compliance-candidates.md",
    "docs/standards/03-authn-authz-iam-standard.md",
    "docs/standards/04-rbac-abac-permission-standard.md",
    "docs/standards/12-devops-infrastructure-standard.md",
  ],
  "k-sso": [
    "docs/enterprise-saas-phase-5b-identity-tenant-org-candidates.md",
    "docs/standards/03-authn-authz-iam-standard.md",
  ],
  "s-data-catalog": ["docs/enterprise-saas-source-normalization-matrix.md"],
};

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
    expect(["archetype", "feature"], `${nodeId}: executable hedef seviyesi`).toContain(node.level);
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

describe("AI ve security dokümanları semantic WBS refs entegrasyonu", () => {
  for (const [nodeId, expectedRefs] of Object.entries(EXPECTED_REFS)) {
    it(`${nodeId} doğru task/app hedefte exact ve tekil ref verir`, () => {
      const node = readNode(nodeId);
      expectSemanticTargetContract(nodeId, node);

      for (const ref of expectedRefs) {
        expect(fs.existsSync(path.join(ROOT, ref)), `doküman yok: ${ref}`).toBe(true);
        expect(
          node.refs?.filter((candidate) => candidate === ref),
          `${nodeId}: exact/tekil ref bekleniyor ${ref}`,
        ).toHaveLength(1);
      }
    });
  }
});
