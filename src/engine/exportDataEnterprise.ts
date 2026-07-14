import type { TaskNode } from "@/schemas";
import { traceability } from "./exportDataShared";

function typedDefinitionRequirement(node: TaskNode): {
  field: "appDefinition" | "moduleDefinition";
  present: boolean;
} | null {
  if (node.artifactKind === "sellable-app") {
    return { field: "appDefinition", present: Boolean(node.appDefinition) };
  }
  if (node.artifactKind === "app-core-module" || node.artifactKind === "app-module") {
    return { field: "moduleDefinition", present: Boolean(node.moduleDefinition) };
  }
  return null;
}

function enterpriseDeliveryFor(node: TaskNode) {
  return node.appDefinition?.enterpriseDelivery ?? node.moduleDefinition?.enterpriseDelivery;
}

function appDefinitionFor(node: TaskNode, index?: Map<string, TaskNode>) {
  if (node.appDefinition) return node.appDefinition;
  const appId = node.moduleDefinition?.appId;
  return appId ? index?.get(appId)?.appDefinition : undefined;
}

export interface EnterpriseEvidenceReadiness {
  enterpriseContractRequired: boolean;
  enterpriseContractPresent: boolean;
  canProposeVerifiedDone: boolean;
  missingRequiredEvidenceExpectationIds: string[];
}

export function enterpriseEvidenceReadiness(node: TaskNode): EnterpriseEvidenceReadiness {
  const requirement = typedDefinitionRequirement(node);
  if (!requirement) {
    return {
      enterpriseContractRequired: false,
      enterpriseContractPresent: false,
      canProposeVerifiedDone: true,
      missingRequiredEvidenceExpectationIds: [],
    };
  }

  const delivery = enterpriseDeliveryFor(node);
  if (!requirement.present || !delivery) {
    return {
      enterpriseContractRequired: true,
      enterpriseContractPresent: false,
      canProposeVerifiedDone: false,
      missingRequiredEvidenceExpectationIds: [`typed-${requirement.field}-contract-missing`],
    };
  }

  const actualExpectationIds = new Set(
    delivery.evidence.actual.map((artifact) => artifact.expectationId),
  );
  const missingRequiredEvidenceExpectationIds = delivery.evidence.expected
    .filter((expectation) => expectation.required && !actualExpectationIds.has(expectation.id))
    .map((expectation) => expectation.id);
  return {
    enterpriseContractRequired: true,
    enterpriseContractPresent: true,
    canProposeVerifiedDone: missingRequiredEvidenceExpectationIds.length === 0,
    missingRequiredEvidenceExpectationIds,
  };
}

export function codeStartVerdict(node: TaskNode): string {
  const typedRequirement = typedDefinitionRequirement(node);
  if (typedRequirement && !typedRequirement.present) {
    return `NO-GO for code-start: typed \`${typedRequirement.field}\` is missing for \`${node.artifactKind}\`.`;
  }
  const tr = traceability(node);
  if (node.phase !== "development") {
    return `NO-GO for code-start: phase is \`${node.phase}\`. Run the waterfall phase work first.`;
  }
  if (!tr.repoPath.length || !tr.testCommand.length || tr.implementationStatus === "not-started") {
    return "NO-GO for code-start: fill `traceability.repoPath`, `traceability.testCommand`, and set `implementationStatus` before coding.";
  }
  return "GO for code-start: repoPath, testCommand, and implementationStatus are present.";
}

function inlineCodeList(items: string[], empty = "_Yok._"): string {
  return items.length ? items.map((item) => `\`${item}\``).join(", ") : empty;
}

function keyValuePairs(values: object): string {
  return Object.entries(values)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(" · ");
}

function deliveryContextMarkdown(node: TaskNode): string {
  if (!node.deliveryContext) return "- Delivery context: _Eksik._";
  if (node.deliveryContext.applicability === "not-applicable") {
    return `- Delivery context: \`not-applicable\` — ${node.deliveryContext.reason}`;
  }
  return `- Delivery context: appRef=\`${node.deliveryContext.appRef}\` · moduleRef=\`${node.deliveryContext.moduleRef}\` · sdkRequired=\`${node.deliveryContext.sdkRequired}\` · sdkContractRef=\`${node.deliveryContext.sdkContractRef}\`
- Delivery contract refs: ${inlineCodeList(node.deliveryContext.contractRefs)}`;
}

export function enterpriseDefinitionMarkdown(
  node: TaskNode,
  index?: Map<string, TaskNode>,
): string {
  const app = appDefinitionFor(node, index);
  const module = node.moduleDefinition;
  const directApp = node.appDefinition;
  const sdk = directApp?.sdkDelivery ?? module?.sdkDelivery;
  const enterprise = enterpriseDeliveryFor(node);
  const readiness = enterpriseEvidenceReadiness(node);
  const requirement = typedDefinitionRequirement(node);

  if (!requirement) {
    return `${deliveryContextMarkdown(node)}

_Bu düğüm sellable-app veya app module olarak sınıflandırılmadığı için typed enterprise tanımı uygulanmaz._`;
  }

  if (!requirement.present || !sdk || !enterprise) {
    return `- Contract status: **NO-GO — typed \`${requirement.field}\` eksik.**
- Artifact kind: \`${node.artifactKind}\`
${deliveryContextMarkdown(node)}`;
  }

  const canonicalAppId = directApp ? node.id : (module?.appId ?? "unresolved");
  const appCoreModuleId = directApp?.appCoreModuleId ?? module?.appCoreModuleId ?? "unresolved";
  const canonicalModules = directApp?.requiredModuleIds ?? (module ? [module.moduleId] : []);
  const identityLines = [
    `- Artifact kind: \`${node.artifactKind}\``,
    `- Canonical app: \`${canonicalAppId}\``,
    `- App core module: \`${appCoreModuleId}\``,
    `- Canonical module set: ${inlineCodeList(canonicalModules)}`,
  ];
  if (module) {
    identityLines.push(
      `- Canonical module: \`${module.moduleId}\``,
      `- Module classification: \`${module.artifactKind}\``,
      `- Bounded context: \`${module.boundedContext}\``,
    );
  }

  const classification = app
    ? `- Primary classification: \`${app.classification.primaryCategory}\`
- Portfolio refs: ${inlineCodeList(app.classification.portfolioRefs)}
- Sector profiles: ${inlineCodeList(app.classification.sectorProfiles)}
- Distribution profiles: ${inlineCodeList(app.classification.distributionProfiles)}
- Stack profiles: ${inlineCodeList(app.classification.stackProfiles)}
- Edition profiles: ${inlineCodeList(app.classification.editionProfiles)}`
    : "- Primary classification: _Canonical app definition index üzerinden çözülemedi._";
  const commercial = app
    ? `- Licensing model: ${app.commercialModel.licensingModel}
- Entitlement model: ${app.commercialModel.entitlementModel}
- Packaging model: ${app.commercialModel.packagingModel}
- Sales motion: ${app.commercialModel.salesMotion}
- Support model: ${app.commercialModel.supportModel}
- Entitlements: ${inlineCodeList(app.commercialModel.entitlementIds)}`
    : "- Commercial model: _Canonical app definition index üzerinden çözülemedi._";
  const externalContracts = app
    ? app.externalAppContracts.length > 0
      ? app.externalAppContracts
          .map(
            (contract) =>
              `- \`${contract.providerAppId}\` via \`${contract.contractRef}\` (${contract.versionRange}, ${contract.transport}); capabilities=${inlineCodeList(contract.consumedCapabilityIds)}; events=${inlineCodeList(contract.subscribedEventTypes)}`,
          )
          .join("\n")
      : "- _External app dependency yok._"
    : "- _Canonical app definition index üzerinden çözülemedi._";

  const expectedEvidence = enterprise.evidence.expected;
  const actualEvidence = enterprise.evidence.actual;
  return `### Canonical Identity

${identityLines.join("\n")}

### Classification and Commercial Model

${classification}
${commercial}

### Versioned External App Contracts

${externalContracts}

### SDK-only Delivery Contract

- SDK contract: \`${sdk.sdkContractRef}\`
- SDK range: \`${sdk.sdkRange}\`
- Template: \`${sdk.templateRef}\` · Generator contract: \`${sdk.generatorContractRef}\`
- Invariants: deterministic=${sdk.deterministic} · generatedHeaderRequired=${sdk.generatedHeaderRequired} · manualEditAllowed=${sdk.manualEditAllowed} · publicPortsOnly=${sdk.publicPortsOnly} · kernelInternalsAllowed=${sdk.kernelInternalsAllowed} · directAppImportsAllowed=${sdk.directAppImportsAllowed}
- Compatibility tests: ${inlineCodeList(sdk.compatibilityTestRefs)}
- Negative tests: ${inlineCodeList(sdk.negativeTestRefs)}

### Enterprise Waterfall Contract

- Target grade: \`${enterprise.targetGrade}\`
- Delivery policy: \`${enterprise.deliveryPolicy}\`
- MVP allowed: \`${enterprise.mvpAllowed}\`
- Baseline: \`${enterprise.baselineVersion}\` / \`${enterprise.baselineStatus}\` · Risk: \`${enterprise.riskTier}\`
- Owners: ${keyValuePairs(enterprise.owners)}
- NFR budgets: ${keyValuePairs(enterprise.nfrBudgets)}
- Control refs: ${inlineCodeList(enterprise.controlRefs)}
- Expected evidence: ${expectedEvidence.length} (${inlineCodeList(expectedEvidence.map((item) => item.id))})
- Actual evidence: ${actualEvidence.length} (${inlineCodeList(actualEvidence.map((item) => item.id))})
- Missing required evidence: ${inlineCodeList(readiness.missingRequiredEvidenceExpectationIds)}
- Verified/done proposal allowed: \`${readiness.canProposeVerifiedDone}\`

### Delivery Context

${deliveryContextMarkdown(node)}`;
}
