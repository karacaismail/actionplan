import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const NODE_DIR = path.join(ROOT, "src/data/generated/nodes");
const RULE_DIR = path.join(ROOT, "src/data/doc-task-content-rules");
const STANDARD_DIR = path.join(ROOT, "src/data/standards");
const EXECUTABLE_LEVELS = new Set(["archetype", "feature", "component", "work_unit", "micro_step"]);
const MANAGED_MARKER = /\[DOC-APPLY:[^\]]+\]/;
const MANAGED_REF = /^doc-apply:([^:]+): (docs\/.+\.md)$/;

type Dimension = { items?: string[]; prompt?: string };
type Node = {
  id: string;
  level: string;
  title: string;
  refs?: string[];
  evidence?: string[];
  dimensions?: Record<string, Dimension>;
};
type Rule = {
  id: string;
  sources: string[];
  content?: {
    deliverables?: string[];
    acceptanceCriteria?: string[];
    phaseCriteria?: Record<string, string[]>;
    risks?: Array<{ desc?: string; mitigation?: string }>;
  };
};
type Classification = {
  docPath: string;
  documentClass: string;
  decision: "task-materialize" | "reference-only" | "human-decision";
};

const readJson = <T>(file: string): T => JSON.parse(fs.readFileSync(file, "utf8")) as T;
const nodes = fs
  .readdirSync(NODE_DIR)
  .filter((file) => file.endsWith(".json"))
  .sort()
  .map((file) => readJson<Node>(path.join(NODE_DIR, file)));
const rules = fs
  .readdirSync(RULE_DIR)
  .filter((file) => file.endsWith(".json"))
  .sort()
  .flatMap((file) => readJson<{ rules?: Rule[] }>(path.join(RULE_DIR, file)).rules ?? []);
const classifications = readJson<Classification[]>(
  path.join(ROOT, "src/data/doc-task-content-classification.json"),
);
const ruleById = new Map(rules.map((rule) => [rule.id, rule]));

const render = (text: string, node: Node) =>
  text
    .replaceAll("{{title}}", node.title)
    .replaceAll("{{id}}", node.id)
    .replaceAll("{{level}}", node.level);

function semanticClauses(rule: Rule, node: Node): string[] {
  const content = rule.content ?? {};
  return [
    ...(content.deliverables ?? []),
    ...(content.acceptanceCriteria ?? []),
    ...Object.values(content.phaseCriteria ?? {}).flat(),
    ...(content.risks ?? []).flatMap((risk) => [risk.desc ?? "", risk.mitigation ?? ""]),
  ]
    .map((clause) => render(clause, node).trim())
    .filter((clause) => clause.length >= 20);
}

function managedApplications(node: Node) {
  return (node.refs ?? []).flatMap((ref) => {
    const match = ref.match(MANAGED_REF);
    return match ? [{ ref, ruleId: match[1], source: match[2] }] : [];
  });
}

function hasDeterministicMapping(text: string, ruleId: string, source: string): boolean {
  return text.includes(`[DOC-APPLY:${ruleId}]`) || text.includes(source);
}

function normalize(value: string): string {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim();
}

function collectStandardRuleProse(value: unknown, out: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) collectStandardRuleProse(item, out);
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (key === "rule" && typeof item === "string" && normalize(item).length >= 120)
        out.push(normalize(item));
      else collectStandardRuleProse(item, out);
    }
  }
  return out;
}

describe("document directives are projected into JSON task dimensions and prompts", () => {
  it("gives every executable JSON task at least one valid, source-owned doc application", () => {
    const failures: string[] = [];
    const executableNodes = nodes.filter((node) => EXECUTABLE_LEVELS.has(node.level));

    for (const node of executableNodes) {
      const applications = managedApplications(node);
      if (applications.length === 0) failures.push(`${node.id}: doc application missing`);
      for (const application of applications) {
        const rule = ruleById.get(application.ruleId);
        if (!rule) failures.push(`${node.id}: unknown rule ${application.ruleId}`);
        else if (!rule.sources.includes(application.source))
          failures.push(`${node.id}: ${application.ruleId} does not own ${application.source}`);
      }
    }

    expect(
      failures.length,
      `${failures.length} invalid/uncovered executable task(s):\n${failures.slice(0, 30).join("\n")}`,
    ).toBe(0);
  });

  it("puts every applied rule's substantive directive into an existing dimension item and its prompt", () => {
    const failures: string[] = [];

    for (const node of nodes.filter((candidate) => EXECUTABLE_LEVELS.has(candidate.level))) {
      for (const application of managedApplications(node)) {
        const rule = ruleById.get(application.ruleId);
        if (!rule) continue;
        const clauses = semanticClauses(rule, node);
        if (clauses.length === 0) {
          failures.push(`${node.id}/${rule.id}: semantic rule clause missing`);
          continue;
        }

        const projected = Object.entries(node.dimensions ?? {}).some(([, dimension]) => {
          const matchingItems = (dimension.items ?? []).filter((item) =>
            hasDeterministicMapping(item, rule.id, application.source),
          );
          const prompt = dimension.prompt ?? "";
          return (
            matchingItems.some((item) => clauses.some((clause) => item.includes(clause))) &&
            hasDeterministicMapping(prompt, rule.id, application.source) &&
            clauses.some((clause) => prompt.includes(clause))
          );
        });

        if (!projected)
          failures.push(`${node.id}/${rule.id}: dimension item + prompt projection missing`);
      }
    }

    expect(
      failures.length,
      `${failures.length} doc application(s) are still refs/criteria-only instead of JSON dimension+prompt content:\n${failures
        .slice(0, 30)
        .join("\n")}`,
    ).toBe(0);
  });

  it("keeps actual evidence and protected app/module JSON free of managed directive projection", () => {
    for (const node of nodes) {
      expect(
        (node.evidence ?? []).some(
          (entry) => MANAGED_MARKER.test(entry) || MANAGED_REF.test(entry),
        ),
        `${node.id}: actual evidence cannot be synthesized from a directive`,
      ).toBe(false);

      if (node.level === "app" || node.level === "module") {
        const serialized = JSON.stringify(node);
        expect(managedApplications(node), `${node.id}: protected level`).toEqual([]);
        expect(serialized.includes("[DOC-APPLY:"), `${node.id}: protected level`).toBe(false);
      }
    }
  });

  it("keeps reference-only engineering standards as refs and does not copy standard rule prose", () => {
    const referenceOnlyStandards = classifications
      .filter(
        (entry) =>
          entry.documentClass === "engineering-standard" && entry.decision === "reference-only",
      )
      .map((entry) => entry.docPath);
    const appliedSources = new Set(
      nodes.flatMap((node) => managedApplications(node).map((app) => app.source)),
    );

    for (const source of referenceOnlyStandards)
      expect(
        appliedSources.has(source),
        `${source}: standard prose must remain reference-only`,
      ).toBe(false);

    const standardRuleProse = fs
      .readdirSync(STANDARD_DIR)
      .filter((file) => file.endsWith(".json"))
      .flatMap((file) =>
        collectStandardRuleProse(readJson<unknown>(path.join(STANDARD_DIR, file))),
      );
    const dimensionCorpus = normalize(
      nodes
        .flatMap((node) =>
          Object.values(node.dimensions ?? {}).flatMap((dimension) => [
            ...(dimension.items ?? []),
            dimension.prompt ?? "",
          ]),
        )
        .join("\n"),
    );
    const copied = standardRuleProse.filter((rule) => dimensionCorpus.includes(rule));

    expect(copied, "standard contract prose was copied into task JSON").toEqual([]);
  });
});
