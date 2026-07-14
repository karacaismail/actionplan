import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { nodeSemanticFindings } from "../tools/lib/dimension-semantics.mjs";

const NODE_DIR = path.join(process.cwd(), "src/data/generated/nodes");
const nodes = fs
  .readdirSync(NODE_DIR)
  .filter((file) => file.endsWith(".json"))
  .map((file) => JSON.parse(fs.readFileSync(path.join(NODE_DIR, file), "utf8")));
const byId = new Map(nodes.map((node) => [node.id, node]));
const apps = nodes.filter((node) => node.artifactKind === "sellable-app");
const APP_IDENTITY_BASELINE_DATE = "2026-07-14";

const META_CONTENT =
  /\[(?:APP-CONTRACT|DOC-APPLY|DELIVERY-CONTEXT):|testler \+ dokümantasyon|sdk-generated zorunlu app-core|yedi waterfall fazı/i;

describe("enterprise app semantic definition quality", () => {
  it("keeps business outcomes and journeys domain-specific instead of recycling handoff metadata", () => {
    expect(apps).toHaveLength(121);
    const distinctOutcomeSets = new Set<string>();

    for (const app of apps) {
      const definition = app.appDefinition;
      expect(definition, `${app.id}: appDefinition`).toBeDefined();
      expect(
        definition.businessOutcomes.length,
        `${app.id}: businessOutcomes`,
      ).toBeGreaterThanOrEqual(3);
      expect(definition.coreJourneys.length, `${app.id}: coreJourneys`).toBeGreaterThanOrEqual(3);
      expect(
        [...definition.businessOutcomes, ...definition.coreJourneys].filter((item: string) =>
          META_CONTENT.test(item),
        ),
        `${app.id}: handoff metadata is not a product outcome/journey`,
      ).toEqual([]);
      expect(
        definition.valueProposition,
        `${app.id}: source summary remains product context`,
      ).toContain(app.summary.trim());
      distinctOutcomeSets.add(JSON.stringify(definition.businessOutcomes));
    }

    expect(distinctOutcomeSets.size).toBe(apps.length);
  });

  it("defines a multi-capability app boundary and keeps its app-core capability subset exact", () => {
    for (const app of apps) {
      const definition = app.appDefinition;
      expect(definition.capabilityIds.length, `${app.id}: capabilityIds`).toBeGreaterThanOrEqual(3);
      expect(new Set(definition.capabilityIds).size, `${app.id}: duplicate capabilities`).toBe(
        definition.capabilityIds.length,
      );
      expect(definition.commercialModel.entitlementIds, `${app.id}: entitlements`).toEqual(
        definition.capabilityIds,
      );

      const core = byId.get(definition.appCoreModuleId);
      expect(core?.artifactKind, `${app.id}: app-core`).toBe("app-core-module");
      for (const capabilityId of core.moduleDefinition.capabilityIds) {
        expect(definition.capabilityIds, `${app.id}: core capability ${capabilityId}`).toContain(
          capabilityId,
        );
      }
    }
  });

  it("uses source-backed product categories and planned implementation test contracts", () => {
    for (const app of apps) {
      const definition = app.appDefinition;
      if (definition.classification.primaryCategory === "sector-app") {
        expect(
          app.source?.cluster === "vertical" || app.tags?.includes("vertical"),
          `${app.id}: sector-app requires explicit vertical evidence`,
        ).toBe(true);
      }
      for (const ref of [
        ...definition.sdkDelivery.compatibilityTestRefs,
        ...definition.sdkDelivery.negativeTestRefs,
      ]) {
        expect(ref, `${app.id}: product test is planned, not falsely claimed as executed`).toMatch(
          new RegExp(`^planned-test:${app.id}:`),
        );
      }

      const typedNodes = [byId.get(definition.appCoreModuleId)];
      for (const moduleId of [...definition.requiredModuleIds, ...definition.optionalModuleIds]) {
        const module = byId.get(moduleId);
        if (module && !typedNodes.includes(module)) typedNodes.push(module);
      }
      for (const module of typedNodes) {
        for (const ref of [
          ...module.moduleDefinition.sdkDelivery.compatibilityTestRefs,
          ...module.moduleDefinition.sdkDelivery.negativeTestRefs,
        ]) {
          expect(ref, `${module.id}: planned module contract`).toMatch(
            new RegExp(`^planned-test:${module.id}:`),
          );
        }
      }
    }
  });

  it("resolves every planned enterprise evidence item to a phase criterion in its own JSON", () => {
    const definitions = nodes.filter((node) => node.appDefinition || node.moduleDefinition);
    expect(definitions).toHaveLength(249);

    for (const node of definitions) {
      const definition = node.appDefinition ?? node.moduleDefinition;
      for (const expected of definition.enterpriseDelivery.evidence.expected) {
        const phaseCriteria = node.phases?.[expected.phase]?.criteria ?? [];
        expect(
          phaseCriteria.some((criterion: string) =>
            criterion.includes(`[CRITERION:${expected.criterionId}]`),
          ),
          `${node.id}: unresolved evidence criterion ${expected.criterionId}`,
        ).toBe(true);
      }
    }
  });

  it("preserves expired zero-progress plans as history instead of active or actual schedules", () => {
    const typedNodes = nodes.filter((node) => node.appDefinition || node.moduleDefinition);
    const migrated = typedNodes.filter(
      (node) =>
        node.status === "backlog" &&
        node.progress === 0 &&
        node.schedule?.baselineEnd < APP_IDENTITY_BASELINE_DATE,
    );

    expect(migrated).toHaveLength(22);
    for (const node of migrated) {
      expect(node.schedule.start, `${node.id}: no stale current start`).toBeNull();
      expect(node.schedule.end, `${node.id}: no stale current end`).toBeNull();
      expect(node.schedule.baselineStart, `${node.id}: historical start preserved`).toBe(
        "2026-07-01",
      );
      expect(node.schedule.baselineEnd, `${node.id}: historical end preserved`).toBe("2026-07-13");
      expect(node.schedule.actualStart, `${node.id}: no fabricated actual start`).toBeNull();
      expect(node.schedule.actualEnd, `${node.id}: no fabricated actual end`).toBeNull();
    }

    expect(
      typedNodes.filter(
        (node) =>
          node.status === "backlog" &&
          node.progress === 0 &&
          node.schedule?.end &&
          node.schedule.end < APP_IDENTITY_BASELINE_DATE,
      ),
      "typed zero-progress backlog must not advertise an expired active schedule",
    ).toEqual([]);
  });

  it("keeps app-core assembly content complete without copying app-owned domain cards", () => {
    for (const app of apps) {
      const core = byId.get(app.appDefinition.appCoreModuleId);
      expect(core.uiArtifactRole, `${core.id}: assembly is not a UI implementation artifact`).toBe(
        "no-ui",
      );
      expect(core.uiDelivery, `${core.id}: no fabricated Storybook evidence plan`).toBeUndefined();
      for (const [key, dimension] of Object.entries(core.dimensions) as Array<
        [string, { items: string[]; prompt: string }]
      >) {
        const coreItems = dimension.items.filter((item) => !item.startsWith("[DOC-APPLY:"));
        const appItems = (app.dimensions[key]?.items ?? []).filter(
          (item: string) => !item.startsWith("[DOC-APPLY:"),
        );
        expect(
          coreItems.length,
          `${core.id}.${key}: app-core contract completeness`,
        ).toBeGreaterThanOrEqual(3);
        expect(
          coreItems.filter((item) => appItems.includes(item)),
          `${core.id}.${key}: domain item copied from app`,
        ).toEqual([]);
        expect(dimension.prompt, `${core.id}.${key}: app-core prompt`).toContain(
          "[APP-CORE-CONTRACT]",
        );
      }
    }
  });

  it("keeps every app-core dimension semantically complete without ratchet warnings", () => {
    const cores = nodes.filter((node) => node.artifactKind === "app-core-module");
    expect(cores).toHaveLength(121);

    for (const core of cores) {
      expect(nodeSemanticFindings(core), `${core.id}: dimension semantics`).toEqual({
        violations: [],
        warnings: [],
      });
    }
  });

  it("keeps app-core dimension clauses domain-scoped instead of repeating one shared template", () => {
    const occurrences = new Map<string, string[]>();
    for (const core of nodes.filter((node) => node.artifactKind === "app-core-module")) {
      for (const [key, dimension] of Object.entries(core.dimensions) as Array<
        [string, { items: string[] }]
      >) {
        for (const item of dimension.items.filter((value) => !value.startsWith("[DOC-APPLY:"))) {
          occurrences.set(item, [...(occurrences.get(item) ?? []), `${core.id}.${key}`]);
        }
      }
    }

    expect(
      [...occurrences.entries()].filter(([, locations]) => locations.length >= 5),
      "app-core base clauses must carry app/module domain context",
    ).toEqual([]);
  });

  it("models every app-to-app dependency as a versioned public contract", () => {
    const appIds = new Set(apps.map((app) => app.id));
    for (const app of apps) {
      const dependencies = (app.dependsOn ?? []).filter((id: string) => appIds.has(id)).sort();
      const contracts = [...(app.appDefinition.externalAppContracts ?? [])].sort((a, b) =>
        a.providerAppId.localeCompare(b.providerAppId),
      );
      expect(
        contracts.map((contract) => contract.providerAppId),
        `${app.id}: bare app dependency`,
      ).toEqual(dependencies);
      for (const contract of contracts) {
        expect(contract.contractRef, `${app.id}->${contract.providerAppId}`).toMatch(
          new RegExp(`^app-contract:${contract.providerAppId}:public-api:v1$`),
        );
        expect(contract.versionRange).toBe(">=1.0.0 <2.0.0");
        expect(contract.transport).toBe("event-and-api");
        expect(contract.consumedCapabilityIds).toContain(`${contract.providerAppId}.operate`);
        expect(contract.subscribedEventTypes).toContain(
          `${contract.providerAppId}.lifecycle.changed.v1`,
        );
        expect(app.appDefinition.manifest.subscribedEventTypes).toContain(
          `${contract.providerAppId}.lifecycle.changed.v1`,
        );
      }
    }
  });

  it("removes package/MVP product framing while preserving explicit enterprise prohibitions", () => {
    const prohibitedProductFraming =
      /paketlenmesi|paketlenmesi|dikey paket|tek paket|\bpaketi\b|ArcheType'ı/i;
    const positiveMvpFraming = /MVP kapsamı|MVP kanıtı|Faz[^.\n]*MVP|MVP paritesi/i;

    for (const app of apps) {
      expect(app.summary, `${app.id}: app summary, not package/archetype`).not.toMatch(
        prohibitedProductFraming,
      );
      expect(
        app.appDefinition.valueProposition,
        `${app.id}: independent app value proposition`,
      ).not.toMatch(prohibitedProductFraming);
      expect(JSON.stringify(app), `${app.id}: no positive MVP delivery lane`).not.toMatch(
        positiveMvpFraming,
      );
    }
  });

  it("uses domain personas and risk-sensitive enterprise controls instead of one shared template", () => {
    const buyerSets = new Set<string>();
    const userSets = new Set<string>();
    const nfrSets = new Set<string>();
    const riskTiers = new Set<string>();

    for (const app of apps) {
      expect(app.appDefinition.buyerRoles.join(" ")).not.toMatch(/Executive Sponsor|Process Owner/);
      expect(app.appDefinition.userRoles.join(" ")).not.toContain("operasyon kullanıcısı");
      buyerSets.add(JSON.stringify(app.appDefinition.buyerRoles));
      userSets.add(JSON.stringify(app.appDefinition.userRoles));
      nfrSets.add(JSON.stringify(app.appDefinition.enterpriseDelivery.nfrBudgets));
      riskTiers.add(app.appDefinition.enterpriseDelivery.riskTier);
      expect(app.appDefinition.enterpriseDelivery.controlRefs).toEqual(
        expect.arrayContaining(["tenant-isolation", "authorization-pdp", "audit-evidence"]),
      );
    }

    expect(buyerSets.size).toBeGreaterThanOrEqual(8);
    expect(userSets.size).toBeGreaterThanOrEqual(8);
    expect(nfrSets.size).toBeGreaterThanOrEqual(4);
    expect([...riskTiers].sort()).toEqual(["critical", "high", "medium"]);
  });

  it("gives every owned module a domain contract and resolves CRM/kernel ownership explicitly", () => {
    const ownedModules = nodes.filter((node) => node.artifactKind === "app-module");
    expect(ownedModules).toHaveLength(7);
    for (const module of ownedModules) {
      const definition = module.moduleDefinition;
      expect(definition.ownedData.length, `${module.id}: ownedData`).toBeGreaterThanOrEqual(4);
      expect(
        definition.lifecycleAuthority.length,
        `${module.id}: lifecycle`,
      ).toBeGreaterThanOrEqual(4);
      expect(definition.capabilityIds.length, `${module.id}: capabilities`).toBeGreaterThanOrEqual(
        3,
      );
      expect(JSON.stringify(definition), `${module.id}: no id-derived placeholder`).not.toContain(
        `${module.id}.domain-state`,
      );
    }

    expect(byId.get("m-crm-sales")).toMatchObject({
      parentId: "s-crm-core",
      moduleDefinition: { appId: "s-crm", boundedContext: "crm.sales-pipeline" },
    });
    expect(byId.get("landx-l0")).toMatchObject({
      title: "LandX L0 — App-owned Plugin Runtime Core",
      moduleDefinition: {
        appId: "app-landx",
        boundedContext: "landx.plugin-runtime",
        kernelInternalsAllowed: false,
      },
    });
    expect(byId.get("landx-l0").summary).toContain("shared kernel değildir");
  });
});
