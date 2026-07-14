import { Badge, Card, Icon } from "@/components/ui/primitives";
import { t } from "@/lib/strings";
import type {
  AppDefinition,
  AppSdkDelivery,
  EnterpriseDelivery,
  EvidenceArtifact,
  EvidenceExpectation,
  ModuleDefinition,
  ModuleSdkDelivery,
  TaskNode,
} from "@/schemas";
import type { ReactNode } from "react";

const labels = t.enterpriseDefinition;

function taskHref(id: string): string {
  const configured = import.meta.env.BASE_URL || "/";
  const base = configured.endsWith("/") ? configured : `${configured}/`;
  return `${base}task/${id}/`;
}

type FieldValue = string | boolean | { taskId: string };
type Field = [string, FieldValue];
type ListGroup = [string, string[]];

function Section({
  children,
  fields = [],
  icon,
  lists = [],
  title,
}: {
  children?: ReactNode;
  fields?: Field[];
  icon: string;
  lists?: ListGroup[];
  title: string;
}) {
  return (
    <section className="rounded-md border border-border p-3">
      <h3 className="mb-3 flex items-center gap-2 font-medium">
        <Icon name={icon} className="text-primary" /> {title}
      </h3>
      {fields.length > 0 && <Fields items={fields} />}
      {lists.length > 0 && <Lists items={lists} />}
      {children}
    </section>
  );
}

function Fields({ items }: { items: Field[] }) {
  return (
    <dl className="grid grid-cols-1 gap-2 text-base md:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0 rounded-md bg-secondary p-2">
          <dt className="font-medium text-muted-foreground">{label}</dt>
          <dd className="mt-1 break-words">
            {typeof value === "boolean" ? (
              <Flag value={value} />
            ) : typeof value === "string" ? (
              value
            ) : (
              <TaskLink id={value.taskId} />
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function TextList({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-base text-muted-foreground">{labels.none}</p>;
  return (
    <ul className="list-disc space-y-1 break-words pl-5 text-base">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function Lists({ items }: { items: ListGroup[] }) {
  return (
    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
      {items.map(([label, values]) => (
        <div key={label} className="min-w-0">
          <h4 className="mb-1 font-medium text-muted-foreground">{label}</h4>
          <TextList items={values} />
        </div>
      ))}
    </div>
  );
}

function TaskLink({ id }: { id: string }) {
  return (
    <a className="break-all text-primary underline" href={taskHref(id)}>
      {id}
    </a>
  );
}

function AppDetails({ definition }: { definition: AppDefinition }) {
  const manifest = definition.manifest;
  return (
    <>
      <Section
        icon="ph-storefront"
        title={labels.productIdentity}
        fields={[
          [labels.canonicalName, definition.canonicalName],
          [labels.productSlug, definition.productSlug],
          [labels.commercialUnit, definition.commercialUnit],
          [labels.valueProposition, definition.valueProposition],
        ]}
        lists={[
          [labels.targetOrganizations, definition.targetOrganizations],
          [labels.buyerRoles, definition.buyerRoles],
          [labels.userRoles, definition.userRoles],
          [labels.businessOutcomes, definition.businessOutcomes],
          [labels.coreJourneys, definition.coreJourneys],
          [labels.nonGoals, definition.nonGoals],
        ]}
      />
      <Section
        icon="ph-tag"
        title={labels.classification}
        fields={[[labels.primaryCategory, definition.classification.primaryCategory]]}
        lists={[
          [labels.portfolioRefs, definition.classification.portfolioRefs],
          [labels.sectorProfiles, definition.classification.sectorProfiles],
          [labels.distributionProfiles, definition.classification.distributionProfiles],
          [labels.stackProfiles, definition.classification.stackProfiles],
          [labels.editionProfiles, definition.classification.editionProfiles],
        ]}
      />
      <Section
        icon="ph-handshake"
        title={labels.commercialModel}
        fields={[
          [labels.licensingModel, definition.commercialModel.licensingModel],
          [labels.entitlementModel, definition.commercialModel.entitlementModel],
          [labels.packagingModel, definition.commercialModel.packagingModel],
          [labels.salesMotion, definition.commercialModel.salesMotion],
          [labels.supportModel, definition.commercialModel.supportModel],
        ]}
        lists={[[labels.entitlementIds, definition.commercialModel.entitlementIds]]}
      />
      <Section
        icon="ph-circles-three-plus"
        title={labels.composition}
        fields={[[labels.appCore, { taskId: definition.appCoreModuleId }]]}
        lists={[
          [labels.requiredModules, definition.requiredModuleIds],
          [labels.optionalModules, definition.optionalModuleIds],
          [labels.capabilityIds, definition.capabilityIds],
          [labels.jurisdictions, definition.jurisdictions],
          [labels.dataClasses, definition.dataClasses],
        ]}
      />
      <Section
        icon="ph-file-code"
        title={labels.manifest}
        fields={[
          [labels.appVersion, manifest.appVersion],
          [labels.kernelRange, manifest.kernelRange],
          [labels.sdkRange, manifest.sdkRange],
          [labels.residency, manifest.residencyClass],
        ]}
        lists={[
          [labels.kernelPrimitives, manifest.kernelPrimitiveIds],
          [labels.requiredCapabilities, manifest.requiredCapabilityIds],
          [labels.optionalCapabilities, manifest.optionalCapabilityIds],
          [labels.publishedEvents, manifest.publishedEventTypes],
          [labels.subscribedEvents, manifest.subscribedEventTypes],
          [labels.locales, manifest.locales],
          [labels.deploymentProfiles, manifest.deploymentProfiles],
        ]}
      />
      <Section
        icon="ph-plugs-connected"
        title={labels.externalAppContracts}
        lists={[
          [
            labels.versionedPublicContracts,
            definition.externalAppContracts.map(
              (contract) =>
                `${contract.providerAppId} · ${contract.contractRef} · ${contract.versionRange} · ${contract.transport} · ${contract.consumedCapabilityIds.join(", ")} · ${contract.subscribedEventTypes.join(", ")}`,
            ),
          ],
        ]}
      />
    </>
  );
}

function Flag({ value }: { value: boolean }) {
  return <Badge className="text-muted-foreground">{value ? labels.yes : labels.no}</Badge>;
}

function ModuleDetails({ definition }: { definition: ModuleDefinition }) {
  return (
    <>
      <Section
        icon="ph-bounding-box"
        title={labels.moduleBoundary}
        fields={[
          [labels.appId, { taskId: definition.appId }],
          [labels.appCore, { taskId: definition.appCoreModuleId }],
          [labels.moduleId, definition.moduleId],
          [labels.boundedContext, definition.boundedContext],
        ]}
        lists={[
          [labels.ownedData, definition.ownedData],
          [labels.lifecycleAuthority, definition.lifecycleAuthority],
          [labels.providedPorts, definition.providedPorts],
          [labels.consumedPorts, definition.consumedPorts],
          [labels.publishedEvents, definition.publishedEvents],
          [labels.subscribedEvents, definition.subscribedEvents],
          [labels.capabilityIds, definition.capabilityIds],
          [labels.permissionIds, definition.permissionIds],
          [labels.routeContributions, definition.routeContributions],
        ]}
      />
      <Section
        icon="ph-shield-warning"
        title={labels.boundaryRules}
        fields={[
          [labels.directAppImports, definition.directAppImportsAllowed],
          [labels.directModuleImports, definition.directModuleImportsAllowed],
          [labels.kernelInternals, definition.kernelInternalsAllowed],
          [labels.crossContextWrites, definition.crossContextWritesAllowed],
        ]}
      />
      <Section
        icon="ph-heartbeat"
        title={labels.healthVersionMigration}
        fields={[
          [labels.healthPath, definition.healthContract.healthPath],
          [labels.readinessPath, definition.healthContract.readinessPath],
          [labels.tenantDataExposure, definition.healthContract.exposesTenantOrDomainData],
          [labels.moduleVersion, definition.versioning.moduleVersion],
          [labels.contractVersion, definition.versioning.contractVersion],
          [labels.compatibilityPolicy, definition.versioning.compatibilityPolicy],
          [labels.migrationAuthority, definition.migration.authority],
          [labels.migrationMode, definition.migration.mode],
          [labels.downgradeRequired, definition.migration.downgradeRequired],
        ]}
      />
    </>
  );
}

function SdkDetails({ delivery }: { delivery: AppSdkDelivery | ModuleSdkDelivery }) {
  return (
    <Section
      icon="ph-code-block"
      title={labels.sdkContract}
      fields={[
        [labels.sdkContractRef, delivery.sdkContractRef],
        [labels.sdkRange, delivery.sdkRange],
        [labels.template, delivery.templateRef],
        [labels.templateKind, delivery.templateKind],
        [labels.generator, delivery.generatorContractRef],
        [labels.deterministic, delivery.deterministic],
        [labels.generatedHeader, delivery.generatedHeaderRequired],
        [labels.manualEdit, delivery.manualEditAllowed],
        [labels.publicPorts, delivery.publicPortsOnly],
        [labels.kernelInternals, delivery.kernelInternalsAllowed],
        [labels.directAppImports, delivery.directAppImportsAllowed],
      ]}
      lists={[
        [labels.compatibilityTests, delivery.compatibilityTestRefs],
        [labels.negativeTests, delivery.negativeTestRefs],
      ]}
    />
  );
}

function EnterpriseDetails({ delivery }: { delivery: EnterpriseDelivery }) {
  const ownerLabels = labels.ownerLabels as Record<string, string>;
  const nfrLabels = labels.nfrLabels as Record<string, string>;
  return (
    <>
      <Section
        icon="ph-buildings"
        title={labels.enterpriseBaseline}
        fields={[
          [labels.targetGrade, delivery.targetGrade],
          [labels.deliveryPolicy, delivery.deliveryPolicy],
          [labels.baselineVersion, delivery.baselineVersion],
          [labels.baselineStatus, delivery.baselineStatus],
          [labels.approvalRef, delivery.approvalRef],
          [labels.riskTier, delivery.riskTier],
        ]}
        lists={[[labels.controlRefs, delivery.controlRefs]]}
      >
        <div className="mt-3">
          <h4 className="mb-2 font-medium text-muted-foreground">{labels.owners}</h4>
          <Fields
            items={Object.entries(delivery.owners).map(([key, value]) => [
              ownerLabels[key] ?? key,
              value,
            ])}
          />
        </div>
        <div className="mt-3">
          <h4 className="mb-2 font-medium text-muted-foreground">{labels.nfrBudgets}</h4>
          <Fields
            items={Object.entries(delivery.nfrBudgets).map(([key, value]) => [
              nfrLabels[key] ?? key,
              value,
            ])}
          />
        </div>
      </Section>
      <EvidenceDetails delivery={delivery} />
    </>
  );
}

function expectedFields(item: EvidenceExpectation): Field[] {
  return [
    [labels.evidenceId, item.id],
    [labels.criterion, item.criterionId],
    [labels.phase, item.phase],
    [labels.kind, item.kind],
    [labels.owner, item.owner],
    [labels.locator, item.locatorPattern],
    [labels.required, item.required],
  ];
}

function actualFields(item: EvidenceArtifact): Field[] {
  return [
    [labels.evidenceId, item.id],
    [labels.expectation, item.expectationId],
    [labels.kind, item.kind],
    [labels.locator, item.uri],
    [labels.producedAt, item.producedAt],
    [labels.verifiedBy, item.verifiedBy],
    [labels.verifiedAt, item.verifiedAt],
    [labels.commitSha, item.commitSha ?? labels.none],
  ];
}

function EvidenceDetails({ delivery }: { delivery: EnterpriseDelivery }) {
  const { expected, actual } = delivery.evidence;
  return (
    <Section icon="ph-seal-check" title={labels.evidenceContract}>
      <div className="mb-3 flex flex-wrap gap-2">
        <Badge>
          {expected.length} {labels.plannedEvidence}
        </Badge>
        <Badge>
          {actual.length} {labels.verifiedEvidence}
        </Badge>
      </div>
      <h4 className="mb-2 font-medium text-muted-foreground">{labels.expected}</h4>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {expected.map((item) => (
          <Fields key={item.id} items={expectedFields(item)} />
        ))}
      </div>
      <h4 className="mb-2 mt-4 font-medium text-muted-foreground">{labels.actual}</h4>
      {actual.length === 0 ? (
        <p className="text-base text-muted-foreground">{labels.noVerifiedEvidence}</p>
      ) : (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {actual.map((item) => (
            <Fields key={item.id} items={actualFields(item)} />
          ))}
        </div>
      )}
    </Section>
  );
}

export function EnterpriseDeliveryPanel({ node }: { node: TaskNode }) {
  if (node.artifactKind === "legacy-alias" && node.canonicalId) {
    return (
      <Card data-testid="enterprise-delivery-panel" className="flex flex-col gap-2 p-4">
        <h2 className="flex items-center gap-2 font-medium">
          <Icon name="ph-signpost" className="text-primary" /> {labels.aliasTitle}
        </h2>
        <p className="text-base text-muted-foreground">{labels.aliasDescription}</p>
        <p className="text-base">
          <span className="font-medium text-muted-foreground">{labels.canonicalTask}: </span>
          <TaskLink id={node.canonicalId} />
        </p>
      </Card>
    );
  }

  const definition = node.appDefinition ?? node.moduleDefinition;
  if (!definition) return null;
  return (
    <Card data-testid="enterprise-delivery-panel" className="flex flex-col gap-3 p-4">
      <div>
        <h2 className="flex items-center gap-2 font-medium">
          <Icon name="ph-app-window" className="text-primary" /> {labels.title}
        </h2>
        <p className="mt-1 text-base text-muted-foreground">
          {node.appDefinition ? labels.appContract : labels.moduleContract}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge>{labels.enterpriseOnly}</Badge>
          <Badge>{labels.mvpForbidden}</Badge>
          <Badge>{labels.sdkRequired}</Badge>
        </div>
      </div>
      {node.appDefinition ? (
        <AppDetails definition={node.appDefinition} />
      ) : node.moduleDefinition ? (
        <ModuleDetails definition={node.moduleDefinition} />
      ) : null}
      <SdkDetails delivery={definition.sdkDelivery} />
      <EnterpriseDetails delivery={definition.enterpriseDelivery} />
    </Card>
  );
}
