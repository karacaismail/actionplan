import kernelCatalog from "@/data/kernel-integration-catalog.json";
import type { TaskNode } from "@/schemas";

type KernelIntegrationExport = {
  role: string;
  reason?: string;
  kernelRef?: string;
  areaId?: string;
  areaIds?: string[];
  contractRefs?: string[];
  plannedTestRefs?: string[];
  publicBoundary?: {
    directKernelInternalsAllowed: boolean;
    directKernelDatabaseAccessAllowed: boolean;
    crossContextWritesAllowed: boolean;
  };
  providerClass?: string;
  scope?: string;
  providedPrimitiveIds?: string[];
  publicContractRefs?: string[];
  sdkContractRef?: string;
  sourceProviderIds?: string[];
  deterministic?: boolean;
  generatedOutputManualEditAllowed?: boolean;
  bindingSource?: string;
  accessPath?: string;
  requiredPrimitiveIds?: string[];
  contributionKind?: string;
  targetProviderIds?: string[];
  runtimeProviderClaimAllowed?: boolean;
};

type KernelAwareNode = TaskNode & { kernelIntegration?: KernelIntegrationExport };
const areasById = new Map(kernelCatalog.areas.map((area) => [area.id, area]));
type CatalogArea = (typeof kernelCatalog.areas)[number];
const isCatalogArea = (area: CatalogArea | undefined): area is CatalogArea => Boolean(area);

function inlineList(items: string[] | undefined): string {
  return items?.length ? items.map((item) => `\`${item}\``).join(", ") : "_None_";
}

function bulletList(items: string[] | undefined): string {
  return items?.length ? items.map((item) => `- \`${item}\``).join("\n") : "- _None_";
}

function roleDetails(integration: KernelIntegrationExport): string {
  switch (integration.role) {
    case "root":
      return `- Kernel WBS areas: ${inlineList(integration.areaIds)}`;
    case "provider":
      return `- Kernel WBS area: \`${integration.areaId ?? "-"}\`
- Provider class: \`${integration.providerClass ?? "-"}\`
- Provider scope: \`${integration.scope ?? "-"}\`
- Provided primitives:
${bulletList(integration.providedPrimitiveIds)}
- Public contracts: ${inlineList(integration.publicContractRefs)}`;
    case "sdk-bridge":
      return `- Kernel WBS area: \`${integration.areaId ?? "-"}\`
- SDK contract: \`${integration.sdkContractRef ?? "-"}\`
- Source providers: ${inlineList(integration.sourceProviderIds)}
- deterministic=${String(integration.deterministic)}
- generatedOutputManualEditAllowed=${String(integration.generatedOutputManualEditAllowed)}`;
    case "consumer":
      return `- Kernel WBS areas: ${inlineList(integration.areaIds)}
- Binding source: \`${integration.bindingSource ?? "-"}\`
- Access path: \`${integration.accessPath ?? "-"}\`
- SDK contract: \`${integration.sdkContractRef ?? "-"}\`
- Required primitives:
${bulletList(integration.requiredPrimitiveIds)}`;
    case "contributor":
      return `- Kernel WBS area: \`${integration.areaId ?? "-"}\`
- Contribution kind: \`${integration.contributionKind ?? "-"}\`
- Target providers: ${inlineList(integration.targetProviderIds)}
- runtimeProviderClaimAllowed=${String(integration.runtimeProviderClaimAllowed)}`;
    case "not-applicable":
      return `- Reason: ${integration.reason ?? "Kernel integration is not applicable."}`;
    default:
      return "- Unsupported role: fail closed.";
  }
}

function areaInstructions(integration: KernelIntegrationExport): string {
  const areaIds =
    integration.role === "root" || integration.role === "consumer"
      ? (integration.areaIds ?? [])
      : integration.areaId
        ? [integration.areaId]
        : [];
  const areas = areaIds.map((areaId) => areasById.get(areaId)).filter(isCatalogArea);
  if (areas.length === 0) return "";
  return `### Applied Kernel WBS Instructions

${areas
  .map(
    (area) => `- \`${area.id}\` — ${area.wbs} ${area.title}: ${area.ownership}
  - Non-goals: ${area.nonGoals.join("; ")}`,
  )
  .join("\n")}`;
}

export function kernelIntegrationMarkdown(node: TaskNode, _index?: Map<string, TaskNode>): string {
  const integration = (node as KernelAwareNode).kernelIntegration;
  if (!integration) {
    return `## Kernel Integration Contract

- Role: \`unclassified\`
- Contract status: missing; fail closed.

No runtime implementation or verification is claimed.`;
  }

  const boundary = integration.publicBoundary
    ? `### Public Boundary

- directKernelInternalsAllowed=${String(integration.publicBoundary.directKernelInternalsAllowed)}
- directKernelDatabaseAccessAllowed=${String(
        integration.publicBoundary.directKernelDatabaseAccessAllowed,
      )}
- crossContextWritesAllowed=${String(integration.publicBoundary.crossContextWritesAllowed)}`
    : "";
  const contracts = integration.contractRefs?.length
    ? `### Canonical Contract References

${bulletList(integration.contractRefs)}`
    : "";
  const plannedTests = integration.plannedTestRefs?.length
    ? `### Planned Test Expectations

${bulletList(integration.plannedTestRefs)}

Planned test references are not verified runtime evidence.`
    : "Planned test references are not verified runtime evidence.";

  return `## Kernel Integration Contract

- Role: \`${integration.role}\`
${integration.kernelRef ? `- Kernel root: \`${integration.kernelRef}\`` : ""}
${roleDetails(integration)}

${areaInstructions(integration)}

${boundary}

${contracts}

${plannedTests}

This projection is a planning contract. It does not claim runtime implementation or verification.`;
}
