import fs from "node:fs";
import path from "node:path";
import { effectiveDirectiveApplications } from "@/engine/effectiveDirectives";
import { indexById } from "@/engine/resolve";
import type { TaskNode } from "@/schemas";
import { describe, expect, it } from "vitest";

const NODE_DIR = path.join(process.cwd(), "src/data/generated/nodes");
const nodes = fs
  .readdirSync(NODE_DIR)
  .filter((file) => file.endsWith(".json"))
  .map((file) => JSON.parse(fs.readFileSync(path.join(NODE_DIR, file), "utf8")) as TaskNode);
const index = indexById(nodes);
const EXECUTABLE = new Set(["archetype", "feature", "component", "work_unit", "micro_step"]);
const ROOT = process.cwd();

type MatrixRow = {
  docPath: string;
  decision: string;
  targetNodeIds: Set<string>;
  ruleIds: Set<string>;
};

const openingRuleIds = (value: string) =>
  [...value.matchAll(/(?<!\/)\[DOC-APPLY:([^\]]+)\]/g)].map((match) => match[1]);

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
  it("gives all 496 routes direct or inherited source-owned content and prompts", () => {
    expect(nodes).toHaveLength(496);
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

  it("uses direct JSON projections on leaves and read-only roll-up on protected app/module nodes", () => {
    for (const node of nodes) {
      const applications = effectiveDirectiveApplications(node, index);
      if (EXECUTABLE.has(node.level)) {
        expect(
          applications.every((application) => application.mode === "direct"),
          node.id,
        ).toBe(true);
        expect(
          applications.every((application) => application.ownerNodeId === node.id),
          node.id,
        ).toBe(true);
      } else {
        expect(
          applications.every((application) => application.mode !== "direct"),
          `${node.id}: protected page must not mutate its canonical JSON`,
        ).toBe(true);
        expect(JSON.stringify(node).includes("[DOC-APPLY:"), node.id).toBe(false);
      }
    }
  });

  it("resolves every classification/matrix materialization without refs collision loss", () => {
    const classifications = JSON.parse(
      fs.readFileSync(path.join(ROOT, "src/data/doc-task-content-classification.json"), "utf8"),
    ) as Array<{ docPath: string; decision: string }>;
    const classificationByDoc = new Map(
      classifications.map((entry) => [entry.docPath, entry.decision]),
    );
    const matrix = readMatrix();
    const expectedPairs: string[] = [];
    const unregisteredPairs: string[] = [];

    for (const node of nodes.filter((candidate) => EXECUTABLE.has(candidate.level))) {
      const expectedRuleIds = [
        ...new Set(openingRuleIds(JSON.stringify(node.dimensions ?? {}))),
      ].sort();
      for (const ruleId of expectedRuleIds) {
        const pair = `${node.id}/${ruleId}`;
        expectedPairs.push(pair);
        const registered = matrix.some(
          (row) =>
            ["task-materialize", "human-decision"].includes(row.decision) &&
            classificationByDoc.get(row.docPath) === row.decision &&
            row.targetNodeIds.has(node.id) &&
            row.ruleIds.has(ruleId),
        );
        if (!registered) unregisteredPairs.push(pair);
      }
    }

    const actualPairs = nodes
      .filter((node) => EXECUTABLE.has(node.level))
      .flatMap((node) =>
        effectiveDirectiveApplications(node, index).map(
          (application) => `${node.id}/${application.ruleId}`,
        ),
      )
      .sort();
    const managedRefPairs = nodes
      .filter((node) => EXECUTABLE.has(node.level))
      .flatMap((node) =>
        (node.refs ?? []).flatMap((ref) => {
          const match = ref.match(/^doc-apply:([^:]+): docs\/.+\.md$/);
          return match ? [`${node.id}/${match[1]}`] : [];
        }),
      )
      .sort();
    expectedPairs.sort();
    const actualPairSet = new Set(actualPairs);
    const refsCollisionLoss = expectedPairs.filter((pair) => !actualPairSet.has(pair));

    expect(unregisteredPairs, unregisteredPairs.slice(0, 30).join("\n")).toEqual([]);
    expect(expectedPairs).toHaveLength(2426);
    expect(
      {
        actual: actualPairs.length,
        expected: expectedPairs.length,
        refsCollisionLoss: refsCollisionLoss.length,
        sample: refsCollisionLoss.slice(0, 30),
      },
      refsCollisionLoss.slice(0, 30).join("\n"),
    ).toEqual({ actual: 2426, expected: 2426, refsCollisionLoss: 0, sample: [] });
    expect(managedRefPairs).toHaveLength(2426);
    expect(managedRefPairs).toEqual(expectedPairs);
    expect(actualPairs).toEqual(expectedPairs);
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
    ).toEqual({
      protectedPages: 206,
      pagesWithMaterializedRawSources: 76,
      materializedRawSourceCount: 327,
      missingSourceCount: 0,
      sample: [],
    });
  });
});
