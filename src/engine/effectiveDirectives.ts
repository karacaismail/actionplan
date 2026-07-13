import type { TaskNode } from "@/schemas";
import { type NodeIndex, getDescendants } from "./resolve";

const EXECUTABLE_LEVELS = new Set(["archetype", "feature", "component", "work_unit", "micro_step"]);
const MANAGED_REF = /^doc-apply:([^:]+): (docs\/.+\.md)$/;
const NEXT_ITEM_MARKER = /\n?\[DOC-APPLY:[^\]]+\]/;

type Rule = {
  id: string;
  sources: string[];
  selector?: { all?: boolean };
  content?: {
    deliverables?: string[];
    acceptanceCriteria?: string[];
    phaseCriteria?: Record<string, string[]>;
  };
};

type RuleModule = { rules?: Rule[] };

const RAW_RULE_MODULES = import.meta.glob("../data/doc-task-content-rules/*.json", {
  eager: true,
  import: "default",
}) as Record<string, RuleModule>;
const ALL_RULES = Object.entries(RAW_RULE_MODULES)
  .sort(([left], [right]) => left.localeCompare(right))
  .flatMap(([, module]) => module.rules ?? []);
const GLOBAL_RULES = ALL_RULES.filter((rule) => rule.selector?.all === true);
const RULES_BY_SOURCE = new Map<string, Rule[]>();
for (const rule of ALL_RULES) {
  for (const source of rule.sources) {
    const owners = RULES_BY_SOURCE.get(source) ?? [];
    owners.push(rule);
    RULES_BY_SOURCE.set(source, owners);
  }
}

export interface EffectiveDirectiveApplication {
  item: string;
  mode: "direct" | "inherited" | "virtual";
  ownerNodeId: string;
  prompt: string;
  ruleId: string;
  source: string;
}

const render = (value: string, node: TaskNode) =>
  value
    .replaceAll("{{title}}", node.title)
    .replaceAll("{{id}}", node.id)
    .replaceAll("{{level}}", node.level);

function uniqueNodes(index: NodeIndex): TaskNode[] {
  return [...new Map([...index.values()].map((node) => [node.id, node])).values()];
}

function exactItem(items: string[], ruleId: string): string | null {
  const marker = `[DOC-APPLY:${ruleId}]`;
  for (const item of items) {
    const start = item.indexOf(marker);
    if (start < 0) continue;
    const remainder = item.slice(start + marker.length);
    const next = remainder.search(NEXT_ITEM_MARKER);
    const end = next < 0 ? item.length : start + marker.length + next;
    return item.slice(start, end).trim();
  }
  return null;
}

function exactPrompt(prompt: string, ruleId: string): string | null {
  const open = `[DOC-APPLY:${ruleId}]`;
  const close = `[/DOC-APPLY:${ruleId}]`;
  const start = prompt.indexOf(open);
  if (start < 0) return null;
  const closeStart = prompt.indexOf(close, start + open.length);
  if (closeStart < 0) return null;
  return prompt.slice(start, closeStart + close.length).trim();
}

function directApplications(node: TaskNode): EffectiveDirectiveApplication[] {
  const applications: EffectiveDirectiveApplication[] = [];
  for (const ref of node.refs ?? []) {
    const match = ref.match(MANAGED_REF);
    if (!match) continue;
    const [, ruleId, source] = match;
    const exact = Object.values(node.dimensions ?? {})
      .map((dimension) => ({
        item: exactItem(dimension.items, ruleId),
        prompt: exactPrompt(dimension.prompt, ruleId),
      }))
      .find((application) => application.item && application.prompt);
    if (!exact?.item || !exact.prompt) continue;
    applications.push({
      item: exact.item,
      mode: "direct",
      ownerNodeId: node.id,
      prompt: exact.prompt,
      ruleId,
      source,
    });
  }
  return applications;
}

function virtualApplications(
  node: TaskNode,
  rules: Rule[],
  allowedSources?: Set<string>,
): EffectiveDirectiveApplication[] {
  return rules.flatMap((rule) => {
    const clause = [
      ...(rule.content?.deliverables ?? []),
      ...(rule.content?.acceptanceCriteria ?? []),
      ...Object.values(rule.content?.phaseCriteria ?? {}).flat(),
    ].find((candidate) => candidate.trim().length >= 20);
    if (!clause) return [];
    const visible = render(clause, node);
    return rule.sources
      .filter((source) => !allowedSources || allowedSources.has(source))
      .map((source) => ({
        item: `[DOC-APPLY:${rule.id}] ${visible}`,
        mode: "virtual" as const,
        ownerNodeId: node.id,
        prompt: [
          `[DOC-APPLY:${rule.id}]`,
          `Kaynak: ${source}`,
          `Korunan ${node.level} sayfasında bu yönerge görev kapsamına uygulanır:`,
          `- ${visible}`,
          `[/DOC-APPLY:${rule.id}]`,
        ].join("\n"),
        ruleId: rule.id,
        source,
      }));
  });
}

function sourceOwnedVirtualApplications(node: TaskNode): EffectiveDirectiveApplication[] {
  const sources = new Set(
    (node.refs ?? []).flatMap((ref) => String(ref).match(/\bdocs\/[^#\s]+\.md/g) ?? []),
  );
  const rules = [
    ...new Set([...sources].flatMap((source) => RULES_BY_SOURCE.get(source) ?? [])),
  ].sort((left, right) => left.id.localeCompare(right.id));
  return virtualApplications(node, rules, sources);
}

export function effectiveDirectiveApplications(
  node: TaskNode,
  index: NodeIndex,
): EffectiveDirectiveApplication[] {
  if (EXECUTABLE_LEVELS.has(node.level)) return directApplications(node);

  const inherited = getDescendants(uniqueNodes(index), node.id)
    .filter((descendant) => EXECUTABLE_LEVELS.has(descendant.level))
    .flatMap(directApplications)
    .map((application) => ({ ...application, mode: "inherited" as const }));
  const own = sourceOwnedVirtualApplications(node);
  const fallback = inherited.length === 0 ? virtualApplications(node, GLOBAL_RULES) : [];
  return [
    ...new Map(
      [...inherited, ...fallback, ...own].map((application) => [
        `${application.ruleId}\u0000${application.source}\u0000${application.ownerNodeId}`,
        application,
      ]),
    ).values(),
  ];
}
