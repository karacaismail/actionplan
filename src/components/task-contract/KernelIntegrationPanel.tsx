import { Badge, Card, Icon } from "@/components/ui/primitives";
import kernelCatalog from "@/data/kernel-integration-catalog.json";
import { t } from "@/lib/strings";
import type { KernelIntegration, KernelPublicBoundary, TaskNode } from "@/schemas";
import type { ReactNode } from "react";

const labels = t.kernelIntegration;
const areasById = new Map(kernelCatalog.areas.map((area) => [area.id, area]));
type CatalogArea = (typeof kernelCatalog.areas)[number];
const isCatalogArea = (area: CatalogArea | undefined): area is CatalogArea => Boolean(area);

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-md bg-secondary p-2">
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words">{value}</dd>
    </div>
  );
}

function Flag({ value }: { value: boolean }) {
  return <Badge className="font-mono text-muted-foreground">{String(value)}</Badge>;
}

function ValueList({ items }: { items: readonly string[] }) {
  if (items.length === 0) return <p className="text-base text-muted-foreground">{labels.none}</p>;
  return (
    <ul className="list-disc space-y-1 break-words pl-5 text-base">
      {items.map((item) => (
        <li key={item}>
          <code>{item}</code>
        </li>
      ))}
    </ul>
  );
}

function ListField({ items, label }: { items: readonly string[]; label: string }) {
  return (
    <div className="min-w-0">
      <h4 className="mb-1 font-medium text-muted-foreground">{label}</h4>
      <ValueList items={items} />
    </div>
  );
}

function AreaInstructions({ areaIds }: { areaIds: readonly string[] }) {
  const areas = areaIds.map((areaId) => areasById.get(areaId)).filter(isCatalogArea);
  if (areas.length === 0) return null;
  return (
    <section className="rounded-md border border-border p-3">
      <h3 className="mb-2 font-medium">{labels.areaInstructions}</h3>
      <div className="flex flex-col gap-3">
        {areas.map((area) => (
          <article key={area.id} className="rounded-md bg-secondary p-3">
            <h4 className="font-medium">
              <code>{area.id}</code> · {area.wbs} {area.title}
            </h4>
            <p className="mt-1 text-base">
              <span className="font-medium text-muted-foreground">{labels.ownership}: </span>
              {area.ownership}
            </p>
            <div className="mt-2">
              <ListField label={labels.nonGoals} items={area.nonGoals} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function areaIdsFor(integration: KernelIntegration): readonly string[] {
  if (integration.role === "root" || integration.role === "consumer") return integration.areaIds;
  if (integration.role === "not-applicable") return [];
  return [integration.areaId];
}

function RoleDetails({ integration }: { integration: KernelIntegration }) {
  switch (integration.role) {
    case "root":
      return <ListField label={labels.areas} items={integration.areaIds} />;
    case "provider":
      return (
        <>
          <dl className="grid grid-cols-1 gap-2 text-base md:grid-cols-3">
            <Field label={labels.area} value={<code>{integration.areaId}</code>} />
            <Field label={labels.providerClass} value={integration.providerClass} />
            <Field label={labels.scope} value={integration.scope} />
          </dl>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <ListField label={labels.providedPrimitives} items={integration.providedPrimitiveIds} />
            <ListField label={labels.publicContracts} items={integration.publicContractRefs} />
          </div>
        </>
      );
    case "sdk-bridge":
      return (
        <>
          <dl className="grid grid-cols-1 gap-2 text-base md:grid-cols-2">
            <Field label={labels.area} value={<code>{integration.areaId}</code>} />
            <Field label={labels.sdkContract} value={<code>{integration.sdkContractRef}</code>} />
            <Field
              label={labels.deterministic}
              value={<Flag value={integration.deterministic} />}
            />
            <Field
              label={labels.manualEdit}
              value={<Flag value={integration.generatedOutputManualEditAllowed} />}
            />
          </dl>
          <ListField label={labels.sourceProviders} items={integration.sourceProviderIds} />
        </>
      );
    case "consumer":
      return (
        <>
          <dl className="grid grid-cols-1 gap-2 text-base md:grid-cols-3">
            <Field label={labels.bindingSource} value={integration.bindingSource} />
            <Field label={labels.accessPath} value={integration.accessPath} />
            <Field label={labels.sdkContract} value={<code>{integration.sdkContractRef}</code>} />
          </dl>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <ListField label={labels.areas} items={integration.areaIds} />
            <ListField label={labels.requiredPrimitives} items={integration.requiredPrimitiveIds} />
          </div>
        </>
      );
    case "contributor":
      return (
        <>
          <dl className="grid grid-cols-1 gap-2 text-base md:grid-cols-3">
            <Field label={labels.area} value={<code>{integration.areaId}</code>} />
            <Field label={labels.contributionKind} value={integration.contributionKind} />
            <Field
              label={labels.runtimeProviderClaim}
              value={<Flag value={integration.runtimeProviderClaimAllowed} />}
            />
          </dl>
          <ListField label={labels.targetProviders} items={integration.targetProviderIds} />
        </>
      );
    case "not-applicable":
      return (
        <p className="rounded-md bg-secondary p-3 text-base text-muted-foreground">
          {integration.reason}
        </p>
      );
  }
}

function PublicBoundaryDetails({ boundary }: { boundary: KernelPublicBoundary }) {
  return (
    <section className="rounded-md border border-border p-3">
      <h3 className="mb-2 font-medium">{labels.publicBoundary}</h3>
      <dl className="grid grid-cols-1 gap-2 text-base md:grid-cols-3">
        <Field
          label={labels.kernelInternal}
          value={<Flag value={boundary.directKernelInternalsAllowed} />}
        />
        <Field
          label={labels.kernelDatabase}
          value={<Flag value={boundary.directKernelDatabaseAccessAllowed} />}
        />
        <Field
          label={labels.crossContext}
          value={<Flag value={boundary.crossContextWritesAllowed} />}
        />
      </dl>
    </section>
  );
}

export function KernelIntegrationPanel({ node }: { node: TaskNode }) {
  const integration = node.kernelIntegration;

  return (
    <Card data-testid="kernel-integration-panel" className="flex flex-col gap-3 p-4">
      <div>
        <h2 className="flex items-center gap-2 font-medium">
          <Icon name="ph-circles-three-plus" className="text-primary" /> {labels.title}
        </h2>
        <p className="mt-1 text-base text-muted-foreground">{labels.subtitle}</p>
      </div>

      {integration ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="font-mono text-primary">{integration.role}</Badge>
            {"kernelRef" in integration ? <code>{integration.kernelRef}</code> : null}
          </div>
          <RoleDetails integration={integration} />
          <AreaInstructions areaIds={areaIdsFor(integration)} />
          {"publicBoundary" in integration ? (
            <PublicBoundaryDetails boundary={integration.publicBoundary} />
          ) : null}
          {"contractRefs" in integration && integration.contractRefs.length ? (
            <ListField label={labels.contractRefs} items={integration.contractRefs} />
          ) : null}
          {"plannedTestRefs" in integration && integration.plannedTestRefs.length ? (
            <section className="rounded-md border border-border p-3">
              <h3 className="mb-1 font-medium">{labels.plannedTests}</h3>
              <ValueList items={integration.plannedTestRefs} />
              <p className="mt-2 text-base text-muted-foreground">{labels.plannedNotEvidence}</p>
            </section>
          ) : null}
        </>
      ) : (
        <div className="rounded-md border border-destructive/50 p-3">
          <Badge className="font-mono text-destructive">{labels.unclassified}</Badge>
          <p className="mt-2 text-base text-muted-foreground">{labels.missingDecision}</p>
        </div>
      )}
    </Card>
  );
}
