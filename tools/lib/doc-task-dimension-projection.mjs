const DIMENSION_KEYS = [
  "featureDefs",
  "security",
  "codeOptimization",
  "securityOptimization",
  "performance",
  "mobileApps",
  "wcag",
  "deployment",
  "eca",
  "aiAgents",
  "testing",
  "owasp",
  "integration",
  "moduleUsage",
  "dataLifecycle",
  "observability",
  "reliability",
];
const DAY2_DIMENSION_KEYS = new Set(["dataLifecycle", "observability", "reliability"]);

const ITEM_MARKER = /^\[DOC-APPLY:[^\]]+\]/;
const PROMPT_BLOCK = /\n?\[DOC-APPLY:([^\]]+)\][\s\S]*?\[\/DOC-APPLY:\1\]\n?/g;

function semanticClauses(rule, node, render) {
  const content = rule.content ?? {};
  return [
    ...(content.deliverables ?? []),
    ...(content.acceptanceCriteria ?? []),
    ...Object.values(content.phaseCriteria ?? {}).flat(),
    ...(content.risks ?? []).flatMap((risk) => [risk.desc ?? "", risk.mitigation ?? ""]),
  ]
    .map((clause) => render(clause, node).trim())
    .filter((clause, index, all) => clause.length >= 20 && all.indexOf(clause) === index);
}

function inferredDimension(rule) {
  if (DIMENSION_KEYS.includes(rule.content?.dimensionKey)) return rule.content.dimensionKey;
  const corpus = `${rule.id} ${(rule.sources ?? []).join(" ")}`.toLowerCase();
  if (/privacy|security|auth|pdp|tenant|permission|owasp/.test(corpus)) return "security";
  if (/storage|migration|schema|retention|data-lifecycle/.test(corpus)) return "dataLifecycle";
  if (/observ/.test(corpus)) return "observability";
  if (/performance/.test(corpus)) return "performance";
  if (/reliab|rollback|release/.test(corpus)) return "reliability";
  if (/storybook|surface|\bui\b|wcag|accessib/.test(corpus)) return "wcag";
  if (/\beca\b/.test(corpus)) return "eca";
  if (/\bai\b|agent/.test(corpus)) return "aiAgents";
  if (/test|evidence|\bci\b|ready|dod|verification/.test(corpus)) return "testing";
  if (/sdk|api|contract|integration|capability|module/.test(corpus)) return "integration";
  return "featureDefs";
}

function managedItem(dimension) {
  return (dimension.items ?? []).find((item) => ITEM_MARKER.test(String(item)));
}

function dimensionCandidates(node, preferred) {
  // A rule may fall back to a legacy dimension when its preferred card is full, but it must
  // never make an unrelated day-2 card look semantically complete. Day-2 cards are fail-closed
  // (retention/PII, SLO/metrics, failure-mode/idempotency); only a rule inferred for that exact
  // card may create or extend it.
  const ordered = [
    preferred,
    ...DIMENSION_KEYS.filter((key) => key !== preferred && !DAY2_DIMENSION_KEYS.has(key)),
  ];
  return ordered.map((key) => [key, node.dimensions?.[key]]).filter(([, dimension]) => dimension);
}

function appendPrompt(dimension, rule, node, clauses) {
  const sourceLines = (rule.sources ?? []).map((source) => `Kaynak: ${source}`).join("\n");
  const block = [
    `[DOC-APPLY:${rule.id}]`,
    sourceLines,
    `Görev bağlamı: ${node.id} — ${node.title}`,
    "Bu kaynak yönergesini aşağıdaki ölçülebilir task sözleşmesiyle uygula:",
    ...clauses.slice(0, 3).map((clause) => `- ${clause}`),
    "Gerçek PR, test veya çalışma çıktısı yoksa evidence üretme ve sonucu geçmiş gibi gösterme.",
    `[/DOC-APPLY:${rule.id}]`,
  ].join("\n");
  dimension.prompt = [String(dimension.prompt ?? "").trim(), block].filter(Boolean).join("\n\n");
}

export function cleanManagedDimensionProjection(node) {
  for (const dimension of Object.values(node.dimensions ?? {})) {
    const before = dimension.items ?? [];
    const remaining = before.filter((item) => !ITEM_MARKER.test(String(item)));
    const removed = remaining.length !== before.length;
    dimension.items = remaining;
    dimension.prompt = String(dimension.prompt ?? "")
      .replace(PROMPT_BLOCK, "\n")
      .trim();
    if (removed && remaining.length === 0) {
      dimension.status = "skeleton";
      dimension.provenance = "template";
      dimension.promptVersion = undefined;
    }
  }
}

export function projectRuleIntoDimension(rule, node, render) {
  const clauses = semanticClauses(rule, node, render);
  if (clauses.length === 0) throw new Error(`${rule.id}: dimension projection semantic clause yok`);
  const preferred = inferredDimension(rule);
  const candidates = dimensionCandidates(node, preferred);
  const target = candidates.find(([, dimension]) => {
    if (managedItem(dimension)) return true;
    const count = dimension.items?.length ?? 0;
    const needed = count === 0 ? 2 : 1;
    return count + needed <= 5;
  });
  if (!target) throw new Error(`${node.id}/${rule.id}: dimension projection kapasitesi yok`);

  const [, dimension] = target;
  const existingManaged = managedItem(dimension);
  const first = `[DOC-APPLY:${rule.id}] ${node.id}: ${clauses[0]}`;
  if (existingManaged) {
    const index = dimension.items.indexOf(existingManaged);
    dimension.items[index] = `${existingManaged}\n${first}`;
  } else {
    const itemCount = dimension.items?.length ?? 0;
    dimension.items = [...(dimension.items ?? []), first];
    if (itemCount === 0) {
      const second =
        clauses[1] ??
        `{{id}} için ${rule.id} kaynak yükümlülüğünü test ve doğrulama kapısına bağla.`;
      dimension.items.push(`[DOC-APPLY:${rule.id}] ${node.id}: ${render(second, node)}`);
    }
  }
  dimension.status = "filled";
  if (dimension.provenance === "template") dimension.provenance = "swarm";
  dimension.promptVersion = "doc-task-content-v2";
  appendPrompt(dimension, rule, node, clauses);
}

export function isManagedDimensionItem(value) {
  return ITEM_MARKER.test(String(value));
}
