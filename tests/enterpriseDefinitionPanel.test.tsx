import { EnterpriseDeliveryPanel } from "@/components/task-contract/EnterpriseDeliveryPanel";
import aliasFixture from "@/data/generated/nodes/dist-membership.json";
import moduleFixture from "@/data/generated/nodes/edition-salescrm-core.json";
import appFixture from "@/data/generated/nodes/edition-salescrm.json";
import { TaskNodeSchema } from "@/schemas";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

const appNode = TaskNodeSchema.parse({
  ...appFixture,
  appDefinition: {
    ...appFixture.appDefinition,
    enterpriseDelivery: {
      ...appFixture.appDefinition.enterpriseDelivery,
      evidence: {
        ...appFixture.appDefinition.enterpriseDelivery.evidence,
        actual: [
          {
            id: "edition-salescrm-requirements-verified",
            expectationId: "edition-salescrm-requirements-evidence",
            kind: "approval",
            uri: "evidence://edition-salescrm/requirements/approval.json",
            producedAt: "2026-07-14T09:00:00+03:00",
            verifiedBy: "Independent Verifier",
            verifiedAt: "2026-07-14T10:00:00+03:00",
            commitSha: "abcdef1",
          },
        ],
      },
    },
  },
});
const moduleNode = TaskNodeSchema.parse(moduleFixture);
const aliasNode = TaskNodeSchema.parse(aliasFixture);

describe("EnterpriseDeliveryPanel", () => {
  it("renders the complete app product, composition, SDK and enterprise contract", () => {
    render(<EnterpriseDeliveryPanel node={appNode} />);

    const panel = screen.getByTestId("enterprise-delivery-panel");
    const definition = appNode.appDefinition!;
    for (const text of [
      definition.canonicalName,
      definition.classification.primaryCategory,
      definition.classification.portfolioRefs[0],
      definition.classification.editionProfiles[0],
      definition.commercialModel.licensingModel,
      definition.commercialModel.entitlementModel,
      definition.commercialModel.packagingModel,
      definition.commercialModel.salesMotion,
      definition.commercialModel.supportModel,
      definition.commercialModel.entitlementIds[0],
      definition.buyerRoles[0],
      definition.userRoles[0],
      definition.appCoreModuleId,
      definition.manifest.publishedEventTypes[0],
      definition.sdkDelivery.sdkContractRef,
      definition.enterpriseDelivery.owners.architecture,
      definition.enterpriseDelivery.nfrBudgets.rto,
      "evidence://edition-salescrm/requirements/approval.json",
      "Independent Verifier",
    ]) {
      expect(within(panel).getAllByText(text).length).toBeGreaterThan(0);
    }
    expect(panel).toHaveTextContent(
      "Marketing+CRM Stack'in pipeline-odaklı dar bağımsız app olarak ürünleştirilmesi",
    );
    expect(panel).toHaveTextContent("App sınıflandırması");
    expect(panel).toHaveTextContent("Ticari model ve entitlement");
    expect(panel).toHaveTextContent("Sürümlü public API/event sözleşmeleri");
    expect(panel).toHaveTextContent(definition.externalAppContracts[0].contractRef);
    expect(panel).toHaveTextContent(definition.externalAppContracts[0].subscribedEventTypes[0]);
    expect(panel).toHaveTextContent("7 planlanan kanıt");
    expect(panel).toHaveTextContent("1 doğrulanmış kanıt");
  });

  it("renders the module boundary, health, version, migration, SDK and evidence contract", () => {
    render(<EnterpriseDeliveryPanel node={moduleNode} />);

    const panel = screen.getByTestId("enterprise-delivery-panel");
    const definition = moduleNode.moduleDefinition!;
    for (const text of [
      definition.appId,
      definition.boundedContext,
      definition.ownedData[0],
      definition.providedPorts[0],
      definition.subscribedEvents[0],
      definition.healthContract.healthPath,
      definition.versioning.compatibilityPolicy,
      definition.migration.authority,
      definition.sdkDelivery.templateRef,
    ]) {
      expect(within(panel).getAllByText(text).length).toBeGreaterThan(0);
    }
    expect(panel).toHaveTextContent("Doğrudan app importu");
    expect(panel).toHaveTextContent("7 planlanan kanıt");
    expect(panel).toHaveTextContent("Henüz doğrulanmış kanıt yok");
  });

  it("keeps a legacy alias page visibly linked to its canonical task", () => {
    render(<EnterpriseDeliveryPanel node={aliasNode} />);

    const link = screen.getByRole("link", { name: "s-membership" });
    expect(screen.getByTestId("enterprise-delivery-panel")).toHaveTextContent(
      "Eski kimlik yönlendirmesi",
    );
    expect(link).toHaveAttribute("href", "/task/s-membership/");
  });
});
