import fs from "node:fs";
import path from "node:path";
import { exportAgentPrompt, exportDeveloperBrief, exportVobecoderCard } from "@/engine/exportData";
import { type TaskNode, TaskNodeSchema } from "@/schemas";
import { describe, expect, it } from "vitest";

type KernelExportModule = {
  kernelIntegrationMarkdown?: (node: TaskNode, index?: Map<string, TaskNode>) => string;
};

const helperModules = import.meta.glob("../src/engine/exportDataKernel.ts", {
  eager: true,
}) as Record<string, KernelExportModule>;
const kernelIntegrationMarkdown = Object.values(helperModules)[0]?.kernelIntegrationMarkdown;

const fixturePath = path.resolve(import.meta.dirname, "../src/data/generated/nodes/s-clinic.json");
const baseNode = TaskNodeSchema.parse(JSON.parse(fs.readFileSync(fixturePath, "utf8")));
const node = Object.assign(structuredClone(baseNode), {
  kernelIntegration: {
    role: "consumer",
    kernelRef: "app-kernel",
    areaIds: ["k-sozlesme", "k-surface"],
    bindingSource: "app-manifest",
    accessPath: "public-sdk-only",
    sdkContractRef: "sdk-public-contract",
    requiredPrimitiveIds: ["k-tenancy", "k-authz", "k-capability", "k-bus", "k-policy-pdp"],
    contractRefs: ["docs/adr-K1-kernel-kimlik.md", "docs/kernel-sdk-app-delivery-sequence.md"],
    publicBoundary: {
      directKernelInternalsAllowed: false,
      directKernelDatabaseAccessAllowed: false,
      crossContextWritesAllowed: false,
    },
    plannedTestRefs: ["planned-test:s-clinic:kernel-public-boundary"],
  },
}) as TaskNode;
const index = new Map([[node.id, node]]);

const EXPECTED_EXPORT_FRAGMENTS = [
  "Kernel Integration Contract",
  "Role: `consumer`",
  "Kernel root: `app-kernel`",
  "SDK contract: `sdk-public-contract`",
  "Required primitives:",
  "Applied Kernel WBS Instructions",
  "Pin, projection ve contract semantics Kernel'dedir",
  "`k-tenancy`",
  "directKernelInternalsAllowed=false",
  "directKernelDatabaseAccessAllowed=false",
  "crossContextWritesAllowed=false",
  "planned-test:s-clinic:kernel-public-boundary",
  "Planned test references are not verified runtime evidence.",
];

describe("kernel integration export projection", () => {
  it("provides a dedicated kernelIntegrationMarkdown helper", () => {
    expect(
      kernelIntegrationMarkdown,
      "src/engine/exportDataKernel.ts kernelIntegrationMarkdown export'u eksik",
    ).toBeTypeOf("function");
    if (!kernelIntegrationMarkdown) return;

    const output = kernelIntegrationMarkdown(node, index);
    for (const fragment of EXPECTED_EXPORT_FRAGMENTS) expect(output).toContain(fragment);
  });

  it("projects the kernel contract into developer brief, agent prompt, and Vobecoder card", () => {
    const outputs = [
      exportDeveloperBrief(node, index),
      exportAgentPrompt(node, index),
      exportVobecoderCard(node, index),
    ];

    for (const output of outputs) {
      for (const fragment of EXPECTED_EXPORT_FRAGMENTS) expect(output).toContain(fragment);
      expect(output).not.toContain("Runtime kernel implementation verified");
    }
  });
});
