import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  exportAgentPrompt,
  exportDeveloperBrief,
  exportEvidencePatch,
  exportTask,
  exportVobecoderCard,
} from "@/engine/exportData";
import { type TaskNode, TaskNodeSchema } from "@/schemas";
import { describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const generatedNodesDir = path.resolve(__dirname, "../src/data/generated/nodes");

function loadEnterpriseFixtures(): {
  app: TaskNode;
  module: TaskNode;
  index: Map<string, TaskNode>;
} {
  const nodes = fs
    .readdirSync(generatedNodesDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) =>
      TaskNodeSchema.parse(JSON.parse(fs.readFileSync(path.join(generatedNodesDir, file), "utf8"))),
    );
  const app = nodes.find((node) => (node.appDefinition?.externalAppContracts.length ?? 0) > 0);
  if (!app?.appDefinition) throw new Error("enterprise app fixture bulunamadı");
  const module = nodes.find(
    (node) =>
      node.moduleDefinition?.appId === app.id &&
      node.moduleDefinition.moduleId === app.appDefinition?.appCoreModuleId,
  );
  if (!module?.moduleDefinition) throw new Error("enterprise app-core fixture bulunamadı");
  return { app, module, index: new Map(nodes.map((node) => [node.id, node])) };
}

function withReadyTraceability(node: TaskNode): TaskNode {
  return TaskNodeSchema.parse({
    ...structuredClone(node),
    phase: "development",
    traceability: {
      repoPath: ["apps/example"],
      testCommand: ["pnpm test"],
      deployTarget: "staging",
      implementationStatus: "implemented",
    },
  });
}

describe("enterprise app/module export projection", () => {
  const { app, module, index } = loadEnterpriseFixtures();

  it("developer brief, agent prompt ve Vobecoder kartı app sözleşmesinin karar alanlarını taşır", () => {
    if (!app.appDefinition) throw new Error("appDefinition bekleniyor");
    const definition = app.appDefinition;
    const outputs = [
      exportDeveloperBrief(app, index),
      exportAgentPrompt(app, index),
      exportVobecoderCard(app, index),
    ];

    for (const output of outputs) {
      expect(output).toContain("Enterprise App / Module Definition");
      expect(output).toContain(`Canonical app: \`${app.id}\``);
      expect(output).toContain(`App core module: \`${definition.appCoreModuleId}\``);
      expect(output).toContain(
        `Primary classification: \`${definition.classification.primaryCategory}\``,
      );
      expect(output).toContain(`Licensing model: ${definition.commercialModel.licensingModel}`);
      expect(output).toContain("Versioned External App Contracts");
      expect(output).toContain(definition.externalAppContracts[0].contractRef);
      expect(output).toContain(definition.externalAppContracts[0].subscribedEventTypes[0]);
      expect(output).toContain(`SDK contract: \`${definition.sdkDelivery.sdkContractRef}\``);
      expect(output).toContain(`SDK range: \`${definition.sdkDelivery.sdkRange}\``);
      expect(output).toContain("deterministic=true");
      expect(output).toContain("manualEditAllowed=false");
      expect(output).toContain("publicPortsOnly=true");
      expect(output).toContain("kernelInternalsAllowed=false");
      expect(output).toContain("directAppImportsAllowed=false");
      expect(output).toContain("Target grade: `enterprise`");
      expect(output).toContain("Delivery policy: `enterprise-only`");
      expect(output).toContain("MVP allowed: `false`");
      expect(output).toContain(`product=${definition.enterpriseDelivery.owners.product}`);
      expect(output).toContain(
        `availability=${definition.enterpriseDelivery.nfrBudgets.availability}`,
      );
      expect(output).toContain(
        `Expected evidence: ${definition.enterpriseDelivery.evidence.expected.length}`,
      );
      expect(output).toContain("Actual evidence: 0");
      expect(output).toContain(
        `appRef=\`${app.deliveryContext?.applicability === "runtime" ? app.deliveryContext.appRef : ""}\``,
      );
      expect(output).toContain(
        `moduleRef=\`${app.deliveryContext?.applicability === "runtime" ? app.deliveryContext.moduleRef : ""}\``,
      );
    }
  });

  it("module exportu canonical app/core/module zinciriyle app classification ve commercial modelini çözer", () => {
    if (!module.moduleDefinition || !app.appDefinition)
      throw new Error("app/module definition bekleniyor");
    const outputs = [
      exportDeveloperBrief(module, index),
      exportAgentPrompt(module, index),
      exportVobecoderCard(module, index),
    ];

    for (const output of outputs) {
      expect(output).toContain(`Canonical app: \`${module.moduleDefinition.appId}\``);
      expect(output).toContain(`App core module: \`${module.moduleDefinition.appCoreModuleId}\``);
      expect(output).toContain(`Canonical module: \`${module.moduleDefinition.moduleId}\``);
      expect(output).toContain(
        `Module classification: \`${module.moduleDefinition.artifactKind}\``,
      );
      expect(output).toContain(
        `Primary classification: \`${app.appDefinition.classification.primaryCategory}\``,
      );
      expect(output).toContain(
        `Licensing model: ${app.appDefinition.commercialModel.licensingModel}`,
      );
      expect(output).toContain(
        `SDK contract: \`${module.moduleDefinition.sdkDelivery.sdkContractRef}\``,
      );
      expect(output).toContain("Expected evidence:");
      expect(output).toContain("Actual evidence: 0");
    }
  });

  it("typed app/module sözleşmesi eksikken code-start fail-closed NO-GO döner", () => {
    const missingAppDefinition = withReadyTraceability(
      TaskNodeSchema.parse({ ...structuredClone(app), appDefinition: undefined }),
    );
    const missingModuleDefinition = withReadyTraceability(
      TaskNodeSchema.parse({ ...structuredClone(module), moduleDefinition: undefined }),
    );

    expect(exportDeveloperBrief(missingAppDefinition)).toContain(
      "NO-GO for code-start: typed `appDefinition` is missing",
    );
    expect(exportAgentPrompt(missingModuleDefinition)).toContain(
      "NO-GO for code-start: typed `moduleDefinition` is missing",
    );
  });

  it("required actual evidence tamamlanmadan evidence patch verified veya done önermez", () => {
    if (!app.appDefinition) throw new Error("appDefinition bekleniyor");
    const out = JSON.parse(exportEvidencePatch(app));

    expect(out.readiness.canProposeVerifiedDone).toBe(false);
    expect(out.readiness.missingRequiredEvidenceExpectationIds).toEqual(
      app.appDefinition.enterpriseDelivery.evidence.expected.map((item) => item.id),
    );
    expect(out.patch).not.toContainEqual(
      expect.objectContaining({ path: "/traceability/implementationStatus", value: "verified" }),
    );
    expect(out.patch).not.toContainEqual(
      expect.objectContaining({ path: "/status", value: "done" }),
    );
  });

  it("tüm required actual evidence doğrulanınca evidence patch mevcut verified/done akışını korur", () => {
    if (!app.appDefinition) throw new Error("appDefinition bekleniyor");
    const complete = structuredClone(app);
    if (!complete.appDefinition) throw new Error("appDefinition clone bekleniyor");
    complete.appDefinition.enterpriseDelivery.evidence.actual =
      complete.appDefinition.enterpriseDelivery.evidence.expected.map((item, index) => ({
        id: `${item.id}-actual`,
        expectationId: item.id,
        kind: item.kind,
        uri: `https://evidence.example/${index}`,
        producedAt: "2026-07-14T10:00:00.000Z",
        verifiedBy: "independent-verifier",
        verifiedAt: "2026-07-14T11:00:00.000Z",
        commitSha: "abcdef1",
      }));
    const out = JSON.parse(exportEvidencePatch(TaskNodeSchema.parse(complete)));

    expect(out.readiness.canProposeVerifiedDone).toBe(true);
    expect(out.readiness.missingRequiredEvidenceExpectationIds).toEqual([]);
    expect(out.patch).toContainEqual(
      expect.objectContaining({ path: "/traceability/implementationStatus", value: "verified" }),
    );
    expect(out.patch).toContainEqual(expect.objectContaining({ path: "/status", value: "done" }));
  });

  it("raw task export typed sözleşmeyi değiştirmeden taşır", () => {
    const out = JSON.parse(exportTask(app, index));
    expect(out.task.appDefinition).toEqual(app.appDefinition);
    expect(out.task.deliveryContext).toEqual(app.deliveryContext);
  });
});
