import type { TaskNode } from "@/schemas";
import { type NodeIndex, getDescendants } from "./resolve";

const EXECUTABLE_LEVELS = new Set(["archetype", "feature", "component", "work_unit", "micro_step"]);
const TYPED_DIRECT_KINDS = new Set(["sellable-app", "app-core-module", "app-module"]);
const ROLLUP_KINDS = new Set([
  "legacy-alias",
  "portfolio-facet",
  "governance",
  "platform-foundation",
]);
const MANAGED_REF = /^doc-apply:([^:]+): (docs\/.+\.md)$/;
const NEXT_ITEM_MARKER = /\n?\[DOC-APPLY:[^\]]+\]/;

type Rule = {
  id: string;
  sources: string[];
  selector?: {
    all?: boolean;
    nodeIds?: string[];
    levels?: string[];
    anyTerms?: string[];
    hasUiDelivery?: boolean;
    uiArtifactRoles?: string[];
    riskSeverities?: string[];
    anyOf?: Rule["selector"][];
  };
  content?: {
    deliverables?: string[];
    acceptanceCriteria?: string[];
    phaseCriteria?: Record<string, string[]>;
    humanDecisionBlocker?: boolean;
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
const RULES_BY_ID = new Map(ALL_RULES.map((rule) => [rule.id, rule]));
const RULES_BY_SOURCE = new Map<string, Rule[]>();
for (const rule of ALL_RULES) {
  for (const source of rule.sources) {
    const owners = RULES_BY_SOURCE.get(source) ?? [];
    owners.push(rule);
    RULES_BY_SOURCE.set(source, owners);
  }
}
const HUMAN_DECISION_RULES_BY_OWNER = new Map<string, Rule[]>();
function explicitSelectorOwners(selector: Rule["selector"]): string[] {
  if (!selector) return [];
  return [...(selector.nodeIds ?? []), ...(selector.anyOf ?? []).flatMap(explicitSelectorOwners)];
}
for (const rule of ALL_RULES.filter((candidate) => candidate.content?.humanDecisionBlocker)) {
  for (const ownerNodeId of new Set(explicitSelectorOwners(rule.selector))) {
    const ownerRules = HUMAN_DECISION_RULES_BY_OWNER.get(ownerNodeId) ?? [];
    ownerRules.push(rule);
    HUMAN_DECISION_RULES_BY_OWNER.set(ownerNodeId, ownerRules);
  }
}
const HUMAN_DECISION_DIRECT_OWNER_IDS = new Set(HUMAN_DECISION_RULES_BY_OWNER.keys());

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

function isExecutableDirectiveOwner(node: TaskNode): boolean {
  return EXECUTABLE_LEVELS.has(node.level) && node.source?.cluster === "platform-directive-owner";
}

function isDirectMaterializationTarget(node: TaskNode): boolean {
  return (
    isExecutableDirectiveOwner(node) ||
    HUMAN_DECISION_DIRECT_OWNER_IDS.has(node.id) ||
    (!ROLLUP_KINDS.has(node.artifactKind ?? "") &&
      (TYPED_DIRECT_KINDS.has(node.artifactKind ?? "") || EXECUTABLE_LEVELS.has(node.level)))
  );
}

const normalizeSearch = (value: string) =>
  value
    .normalize("NFKC")
    .toLocaleLowerCase("tr")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

function matchesSelector(selector: Rule["selector"], node: TaskNode): boolean {
  if (!selector) return false;
  if (selector.levels && !selector.levels.includes(node.level)) return false;
  if (selector.nodeIds && !selector.nodeIds.includes(node.id)) return false;
  if (selector.anyOf && !selector.anyOf.some((branch) => matchesSelector(branch, node)))
    return false;
  if (selector.anyTerms) {
    const corpus = normalizeSearch(
      [node.id, node.title, node.summary, ...(node.tags ?? [])].join(" "),
    );
    const matchesTerm = selector.anyTerms.some((term) => {
      const normalizedTerm = normalizeSearch(term);
      return normalizedTerm.length > 0 && ` ${corpus} `.includes(` ${normalizedTerm} `);
    });
    if (!matchesTerm) return false;
  }
  if (
    selector.hasUiDelivery !== undefined &&
    (node.uiDelivery?.applies === true) !== selector.hasUiDelivery
  )
    return false;
  if (
    selector.uiArtifactRoles &&
    (!node.uiArtifactRole || !selector.uiArtifactRoles.includes(node.uiArtifactRole))
  )
    return false;
  if (
    selector.riskSeverities &&
    !(node.risks ?? []).some((risk) => selector.riskSeverities?.includes(risk.severity))
  )
    return false;
  return true;
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
  if (!isDirectMaterializationTarget(node)) return [];
  const applications: EffectiveDirectiveApplication[] = [];
  for (const ref of node.refs ?? []) {
    const match = ref.match(MANAGED_REF);
    if (!match) continue;
    const [, ruleId, source] = match;
    const rule = RULES_BY_ID.get(ruleId);
    if (!rule || !rule.sources.includes(source) || !matchesSelector(rule.selector, node)) continue;
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

function humanDecisionVirtualApplications(node: TaskNode): EffectiveDirectiveApplication[] {
  const rules = (HUMAN_DECISION_RULES_BY_OWNER.get(node.id) ?? []).filter((rule) =>
    matchesSelector(rule.selector, node),
  );
  return virtualApplications(node, rules);
}

function withoutRepresentedApplications(
  applications: EffectiveDirectiveApplication[],
  represented: EffectiveDirectiveApplication[],
): EffectiveDirectiveApplication[] {
  const representedPairs = new Set(
    represented.map((application) => `${application.ruleId}\u0000${application.source}`),
  );
  return applications.filter(
    (application) => !representedPairs.has(`${application.ruleId}\u0000${application.source}`),
  );
}

function dedupeApplications(
  applications: EffectiveDirectiveApplication[],
): EffectiveDirectiveApplication[] {
  return [
    ...new Map(
      applications.map((application) => [
        `${application.ruleId}\u0000${application.source}\u0000${application.ownerNodeId}`,
        application,
      ]),
    ).values(),
  ];
}

export function effectiveDirectiveApplications(
  node: TaskNode,
  index: NodeIndex,
): EffectiveDirectiveApplication[] {
  const ownDirect = directApplications(node);
  const inherited =
    TYPED_DIRECT_KINDS.has(node.artifactKind ?? "") || !isDirectMaterializationTarget(node)
      ? getDescendants(uniqueNodes(index), node.id)
          .filter(isDirectMaterializationTarget)
          .flatMap(directApplications)
          .map((application) => ({ ...application, mode: "inherited" as const }))
      : [];
  const ownSourceVirtual = withoutRepresentedApplications(
    sourceOwnedVirtualApplications(node),
    ownDirect,
  );
  const ownHumanDecisionVirtual = withoutRepresentedApplications(
    humanDecisionVirtualApplications(node),
    [...ownDirect, ...ownSourceVirtual],
  );
  const fallback =
    inherited.length === 0 &&
    ownDirect.length === 0 &&
    ownSourceVirtual.length === 0 &&
    ownHumanDecisionVirtual.length === 0
      ? virtualApplications(node, GLOBAL_RULES)
      : [];
  return dedupeApplications([
    ...ownDirect,
    ...inherited,
    ...ownSourceVirtual,
    ...ownHumanDecisionVirtual,
    ...fallback,
  ]);
}
