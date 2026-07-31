import fs from "node:fs";
import path from "node:path";
import { effectiveDirectiveApplications } from "@/engine/effectiveDirectives";
import { indexById } from "@/engine/resolve";
import type { TaskNode } from "@/schemas";
import { describe, expect, it } from "vitest";
import { readD01LiveUniverse } from "./helpers/d01LiveUniverse";

const live = readD01LiveUniverse();
const nodes = live.nodes as TaskNode[];
const index = indexById(nodes);
const EXECUTABLE = new Set(["archetype", "feature", "component", "work_unit", "micro_step"]);
const TYPED_RUNTIME_ARTIFACTS = new Set(["sellable-app", "app-core-module", "app-module"]);
const ROLLUP_ARTIFACTS = new Set([
  "legacy-alias",
  "portfolio-facet",
  "governance",
  "platform-foundation",
]);
const MANAGED_REF = /^doc-apply:([^:]+): (docs\/.+\.md)$/;
const ROOT = process.cwd();

type DirectiveRule = {
  id: string;
  sources: string[];
  selector?: { nodeIds?: string[] };
  content?: { humanDecisionBlocker?: boolean };
};

const directiveRules = fs
  .readdirSync(path.join(ROOT, "src/data/doc-task-content-rules"))
  .filter((file) => file.endsWith(".json"))
  .flatMap((file) => {
    const parsed = JSON.parse(
      fs.readFileSync(path.join(ROOT, "src/data/doc-task-content-rules", file), "utf8"),
    ) as { rules?: DirectiveRule[] };
    return parsed.rules ?? [];
  });
const humanDecisionRules = directiveRules.filter(
  (rule) => rule.content?.humanDecisionBlocker === true,
);
const humanDecisionOwnerIds = new Set(
  humanDecisionRules.flatMap((rule) => rule.selector?.nodeIds ?? []),
);

type MatrixRow = {
  docPath: string;
  decision: string;
  targetNodeIds: Set<string>;
  ruleIds: Set<string>;
};

const openingRuleIds = (value: string) =>
  [...value.matchAll(/(?<!\/)\[DOC-APPLY:([^\]]+)\]/g)].map((match) => match[1]);

const isDirectMaterializationTarget = (node: TaskNode) =>
  (EXECUTABLE.has(node.level) && node.source?.cluster === "platform-directive-owner") ||
  humanDecisionOwnerIds.has(node.id) ||
  (!ROLLUP_ARTIFACTS.has(node.artifactKind ?? "") &&
    (TYPED_RUNTIME_ARTIFACTS.has(node.artifactKind ?? "") || EXECUTABLE.has(node.level)));

function parseCsv(value: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (quoted) {
      if (character === '"' && value[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (character !== "\r") field += character;
  }
  if (field.length > 0 || row.length > 0) rows.push([...row, field]);
  return rows;
}

function readMatrix(): MatrixRow[] {
  const [header, ...rows] = parseCsv(
    fs.readFileSync(path.join(ROOT, "reports/doc-task-content-matrix.csv"), "utf8"),
  );
  const column = new Map(header.map((name, index) => [name, index]));
  const cell = (row: string[], name: string) => row[column.get(name) ?? -1] ?? "";
  return rows.map((row) => ({
    docPath: cell(row, "doc_path"),
    decision: cell(row, "materialization_decision"),
    targetNodeIds: new Set(cell(row, "materialized_target_node_ids").split("|").filter(Boolean)),
    ruleIds: new Set(cell(row, "materialized_rule_ids").split("|").filter(Boolean)),
  }));
}

describe("effective directive content on every JSON-backed task page", () => {
  it("gives every current-live route direct or inherited source-owned content and prompts", () => {
    expect(nodes).toHaveLength(live.liveExpectedNodeCount);
    const failures: string[] = [];

    for (const node of nodes) {
      const applications = effectiveDirectiveApplications(node, index);
      if (applications.length === 0) failures.push(`${node.id}: effective content missing`);
      for (const application of applications) {
        if (!application.source.startsWith("docs/"))
          failures.push(`${node.id}/${application.ruleId}: source missing`);
        if (
          !application.item.includes(application.source) &&
          !application.item.includes("[DOC-APPLY:")
        )
          failures.push(`${node.id}/${application.ruleId}: item mapping missing`);
        if (
          !application.prompt.includes(application.source) &&
          !application.prompt.includes("[DOC-APPLY:")
        )
          failures.push(`${node.id}/${application.ruleId}: prompt mapping missing`);
      }
    }

    expect(failures, failures.slice(0, 40).join("\n")).toEqual([]);
  });

  it("keeps direct ownership fail-closed while typed pages inherit and protected roll-ups stay virtual", () => {
    for (const node of nodes) {
      const applications = effectiveDirectiveApplications(node, index);
      const direct = applications.filter((application) => application.mode === "direct");
      const inherited = applications.filter((application) => application.mode === "inherited");
      const virtual = applications.filter((application) => application.mode === "virtual");
      const managedRefs = (node.refs ?? []).filter((ref) => MANAGED_REF.test(ref));

      expect(direct, `${node.id}: direct mode yalnız gerçek owner üzerinde bulunabilir`).toSatisfy(
        (items: typeof direct) =>
          items.every(
            (application) =>
              isDirectMaterializationTarget(node) && application.ownerNodeId === node.id,
          ),
      );
      expect(virtual, `${node.id}: virtual mode sayfanın kendisine ait olmalı`).toSatisfy(
        (items: typeof virtual) =>
          items.every((application) => application.ownerNodeId === node.id),
      );
      expect(
        direct,
        `${node.id}: her managed ref tam bir direct source uygulamasıdır`,
      ).toHaveLength(isDirectMaterializationTarget(node) ? managedRefs.length : 0);

      if (node.artifactKind && TYPED_RUNTIME_ARTIFACTS.has(node.artifactKind)) {
        const allDescendantIds = new Set(
          applications
            .filter((application) => application.mode === "inherited")
            .map((application) => application.ownerNodeId),
        );
        expect(
          [...allDescendantIds].every((ownerId) => ownerId !== node.id),
          `${node.id}: inherited owner typed sayfanın kendisi olamaz`,
        ).toBe(true);

        const definition = node.appDefinition ?? node.moduleDefinition;
        expect(definition, `${node.id}: typed enterprise definition missing`).toBeDefined();
        expect(definition?.enterpriseDelivery.targetGrade, node.id).toBe("enterprise");
        expect(definition?.enterpriseDelivery.deliveryPolicy, node.id).toBe("enterprise-only");
        expect(definition?.enterpriseDelivery.mvpAllowed, node.id).toBe(false);
        expect(definition?.sdkDelivery.required, node.id).toBe(true);
        expect(definition?.sdkDelivery.manualEditAllowed, node.id).toBe(false);
        expect(node.deliveryContext?.applicability, node.id).toBe("runtime");
        if (node.deliveryContext?.applicability === "runtime") {
          expect(node.deliveryContext.sdkRequired, node.id).toBe(true);
        }

        const managedRuleIds = (node.refs ?? []).flatMap((ref) => {
          const match = ref.match(/^doc-apply:([^:]+): docs\/.+\.md$/);
          return match ? [match[1]] : [];
        });
        const materializedRuleIds = new Set(openingRuleIds(JSON.stringify(node.dimensions ?? {})));
        for (const ruleId of managedRuleIds) {
          expect(
            materializedRuleIds.has(ruleId),
            `${node.id}/${ruleId}: managed directive must remain visible in typed JSON dimensions`,
          ).toBe(true);
        }
      } else if (isDirectMaterializationTarget(node)) {
        expect(
          inherited,
          `${node.id}: normal direct owner descendant içeriğini sahiplenemez`,
        ).toEqual([]);
      } else {
        expect(direct, `${node.id}: protected page direct mode taşıyamaz`).toEqual([]);
        expect(JSON.stringify(node).includes("[DOC-APPLY:"), node.id).toBe(false);
        expect(managedRefs, `${node.id}: protected page raw managed ref taşıyamaz`).toEqual([]);
      }

      for (const application of inherited) {
        const owner = nodes.find((candidate) => candidate.id === application.ownerNodeId);
        expect(
          owner,
          `${node.id}/${application.ownerNodeId}: inherited owner bulunamadı`,
        ).toBeDefined();
        expect(
          owner ? isDirectMaterializationTarget(owner) : false,
          `${node.id}/${application.ownerNodeId}: inherited owner direct target olmalı`,
        ).toBe(true);
        expect(application.ownerNodeId, `${node.id}: inherited owner kendisi olamaz`).not.toBe(
          node.id,
        );
      }
    }
  });

  it("matches every raw direct source/rule/owner triple to a real matrix direct target", () => {
    const classifications = JSON.parse(
      fs.readFileSync(path.join(ROOT, "src/data/doc-task-content-classification.json"), "utf8"),
    ) as Array<{ docPath: string; decision: string }>;
    const classificationByDoc = new Map(
      classifications.map((entry) => [entry.docPath, entry.decision]),
    );
    const matrix = readMatrix();
    const matrixByDoc = new Map(matrix.map((row) => [row.docPath, row]));
    const expectedTriples: string[] = [];
    const ownershipFailures: string[] = [];

    for (const row of matrix) {
      for (const nodeId of row.targetNodeIds) {
        const node = nodes.find((candidate) => candidate.id === nodeId);
        if (!node || !isDirectMaterializationTarget(node)) {
          ownershipFailures.push(`${nodeId}: matrix target direct owner değil (${row.docPath})`);
          continue;
        }
        const hasRawPair = (node.refs ?? []).some((ref) => {
          const match = ref.match(MANAGED_REF);
          return match?.[2] === row.docPath && row.ruleIds.has(match[1]);
        });
        if (!hasRawPair) ownershipFailures.push(`${nodeId}: matrix raw pair yok (${row.docPath})`);
      }
    }

    for (const node of nodes) {
      for (const ref of node.refs ?? []) {
        const match = ref.match(MANAGED_REF);
        if (!match) continue;
        const [, ruleId, source] = match;
        const row = matrixByDoc.get(source);
        const registered =
          row &&
          ["task-materialize", "human-decision"].includes(row.decision) &&
          classificationByDoc.get(source) === row.decision &&
          row.targetNodeIds.has(node.id) &&
          row.ruleIds.has(ruleId);
        if (!isDirectMaterializationTarget(node))
          ownershipFailures.push(
            `${node.id}/${ruleId}/${source}: raw ref protected owner üzerinde`,
          );
        if (!registered)
          ownershipFailures.push(`${node.id}/${ruleId}/${source}: matrix direct kaydı yok`);
        expectedTriples.push(`${node.id}\u0000${ruleId}\u0000${source}`);
      }
    }

    const actualTriples = nodes
      .flatMap((node) =>
        effectiveDirectiveApplications(node, index)
          .filter((application) => application.mode === "direct")
          .map((application) => {
            if (application.ownerNodeId !== node.id || !isDirectMaterializationTarget(node))
              ownershipFailures.push(
                `${node.id}/${application.ruleId}/${application.source}: direct mode owner kaçışı`,
              );
            return `${application.ownerNodeId}\u0000${application.ruleId}\u0000${application.source}`;
          }),
      )
      .sort();
    expectedTriples.sort();

    expect(ownershipFailures, ownershipFailures.slice(0, 40).join("\n")).toEqual([]);
    expect(new Set(expectedTriples).size, "raw managed source triple duplicate olamaz").toBe(
      expectedTriples.length,
    );
    expect(new Set(actualTriples).size, "effective direct source triple duplicate olamaz").toBe(
      actualTriples.length,
    );
    expect(actualTriples).toEqual(expectedTriples);
    expect(actualTriples.length).toBeGreaterThan(
      nodes.filter(isDirectMaterializationTarget).length,
    );
  });

  it("surfaces every explicit human-decision selector owner as a direct application", () => {
    for (const rule of humanDecisionRules) {
      for (const ownerNodeId of rule.selector?.nodeIds ?? []) {
        const owner = nodes.find((node) => node.id === ownerNodeId);
        expect(owner, `${rule.id}: selector owner yok (${ownerNodeId})`).toBeDefined();
        if (!owner) continue;
        const expectedMode = isDirectMaterializationTarget(owner) ? "direct" : "virtual";
        const applications = effectiveDirectiveApplications(owner, index);
        for (const source of rule.sources) {
          expect(
            applications.some(
              (application) =>
                application.ruleId === rule.id &&
                application.source === source &&
                application.ownerNodeId === owner.id &&
                application.mode === expectedMode,
            ),
            `${owner.id}/${rule.id}/${source}: expected ${expectedMode}`,
          ).toBe(true);
        }
      }
    }
  });

  it("keeps task-materialized raw sources visible on every protected page", () => {
    const classifications = JSON.parse(
      fs.readFileSync(path.join(ROOT, "src/data/doc-task-content-classification.json"), "utf8"),
    ) as Array<{ docPath: string; decision: string }>;
    const materializedDocs = new Set(
      classifications
        .filter((entry) => ["task-materialize", "human-decision"].includes(entry.decision))
        .map((entry) => entry.docPath),
    );
    const missingSources: string[] = [];
    let protectedPages = 0;
    let pagesWithMaterializedRawSources = 0;
    let materializedRawSourceCount = 0;

    for (const node of nodes.filter((candidate) => !EXECUTABLE.has(candidate.level))) {
      const applications = effectiveDirectiveApplications(node, index);
      protectedPages += 1;
      const expectedSources = [
        ...new Set(
          (node.refs ?? [])
            .map((ref) => ref.match(/\bdocs\/[^#\s]+\.md/)?.[0])
            .filter((source): source is string => typeof source === "string")
            .filter((source) => materializedDocs.has(source)),
        ),
      ].sort();
      if (expectedSources.length === 0) continue;
      pagesWithMaterializedRawSources += 1;
      materializedRawSourceCount += expectedSources.length;
      const actualSources = new Set(applications.map((application) => application.source));
      for (const source of expectedSources) {
        if (!actualSources.has(source)) missingSources.push(`${node.id}: ${source}`);
      }
    }

    expect(
      {
        protectedPages,
        pagesWithMaterializedRawSources,
        materializedRawSourceCount,
        missingSourceCount: missingSources.length,
        sample: missingSources.slice(0, 30),
      },
      missingSources.slice(0, 30).join("\n"),
    ).toEqual(
      expect.objectContaining({
        protectedPages: nodes.filter((node) => !EXECUTABLE.has(node.level)).length,
        missingSourceCount: 0,
        sample: [],
      }),
    );
    expect(pagesWithMaterializedRawSources).toBeGreaterThan(0);
    expect(materializedRawSourceCount).toBeGreaterThanOrEqual(pagesWithMaterializedRawSources);
  });
});
