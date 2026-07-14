import { type TaskNode, TaskNodeSchema } from "@/schemas";
import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it } from "vitest";

const panelModules = import.meta.glob(
  "../src/components/task-contract/KernelIntegrationPanel.tsx",
  { eager: true },
) as Record<string, { KernelIntegrationPanel?: ComponentType<{ node: TaskNode }> }>;
const KernelIntegrationPanel = Object.values(panelModules)[0]?.KernelIntegrationPanel;

const publicBoundary = {
  directKernelInternalsAllowed: false,
  directKernelDatabaseAccessAllowed: false,
  crossContextWritesAllowed: false,
};
const common = {
  kernelRef: "app-kernel",
  contractRefs: ["docs/kernel-sdk-app-delivery-sequence.md"],
  publicBoundary,
  plannedTestRefs: ["planned-test:s-clinic:kernel-public-boundary"],
};

const roleFixtures: Record<string, Record<string, unknown>> = {
  root: {
    role: "root",
    ...common,
    areaIds: [
      "k-agent-runtime",
      "k-archetype-bayraklari",
      "k-control-planes",
      "k-granulerlik",
      "k-sozlesme",
      "k-surface",
      "k-terminoloji",
      "k-archetype-mode-profile",
      "k-archetype-computation",
      "k-archetype-fieldtypes",
      "k-surface-consumer",
      "k-edge-gateway",
      "k-kpi-registry",
      "k-calendar-capacity",
    ],
  },
  provider: {
    role: "provider",
    ...common,
    areaId: "k-archetype-mode-profile",
    providerClass: "primitive",
    scope: "optional",
    providedPrimitiveIds: ["k-mode"],
    publicContractRefs: ["kernel.mode-profile.v1"],
  },
  "sdk-bridge": {
    role: "sdk-bridge",
    ...common,
    areaId: "k-sozlesme",
    sdkContractRef: "sdk-public-contract",
    sourceProviderIds: ["k-tenancy"],
    deterministic: true,
    generatedOutputManualEditAllowed: false,
  },
  consumer: {
    role: "consumer",
    ...common,
    areaIds: ["k-sozlesme"],
    bindingSource: "app-manifest",
    accessPath: "public-sdk-only",
    sdkContractRef: "sdk-public-contract",
    requiredPrimitiveIds: ["k-tenancy", "k-authz", "k-capability", "k-bus", "k-policy-pdp"],
  },
  contributor: {
    role: "contributor",
    ...common,
    areaId: "k-archetype-mode-profile",
    contributionKind: "specification",
    targetProviderIds: ["k-mode"],
    runtimeProviderClaimAllowed: false,
  },
  "not-applicable": {
    role: "not-applicable",
    reason: "Governance-only task; kernel runtime ilişkisi uygulanmaz.",
  },
};

function nodeWith(role: string): TaskNode {
  const node = TaskNodeSchema.parse({
    id: `kernel-panel-${role}`,
    level: "feature",
    title: `Kernel Panel ${role}`,
    slug: `kernel-panel-${role}`,
  });
  return Object.assign(node, { kernelIntegration: roleFixtures[role] }) as TaskNode;
}

function requirePanel(): ComponentType<{ node: TaskNode }> {
  expect(
    KernelIntegrationPanel,
    "src/components/task-contract/KernelIntegrationPanel.tsx ve named export eksik",
  ).toBeDefined();
  return KernelIntegrationPanel as ComponentType<{ node: TaskNode }>;
}

describe("KernelIntegrationPanel", () => {
  it.each(Object.keys(roleFixtures))("renders an explicit panel for the %s role", (role) => {
    const Panel = requirePanel();
    render(<Panel node={nodeWith(role)} />);

    const panel = screen.getByTestId("kernel-integration-panel");
    expect(panel).toBeVisible();
    expect(panel).toHaveTextContent(role);
  });

  it("shows public-boundary denials on a consumer task", () => {
    const Panel = requirePanel();
    render(<Panel node={nodeWith("consumer")} />);

    const panel = screen.getByTestId("kernel-integration-panel");
    expect(panel).toHaveTextContent("sdk-public-contract");
    expect(panel).toHaveTextContent("k-tenancy");
    expect(panel).toHaveTextContent(/kernel internal/i);
    expect(panel).toHaveTextContent(/kernel database/i);
    expect(panel).toHaveTextContent(/cross-context/i);
    expect(panel).toHaveTextContent(/false/i);
    expect(panel).toHaveTextContent("Uygulanan Kernel alan yönergeleri");
    expect(panel).toHaveTextContent("Sahiplik sınırı");
    expect(panel).toHaveTextContent(/Pin, projection ve contract semantics Kernel'dedir/i);
  });

  it("labels planned tests as expectations instead of verified runtime evidence", () => {
    const Panel = requirePanel();
    render(<Panel node={nodeWith("consumer")} />);

    const panel = screen.getByTestId("kernel-integration-panel");
    expect(panel).toHaveTextContent("planned-test:s-clinic:kernel-public-boundary");
    expect(panel).toHaveTextContent(/planlanan test.*gerçek.*kanıt değildir/i);
    expect(panel).not.toHaveTextContent(/1 doğrulanmış kanıt/i);
    expect(panel).not.toHaveTextContent(/runtime implemented/i);
  });
});
