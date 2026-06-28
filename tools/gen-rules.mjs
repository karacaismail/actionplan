#!/usr/bin/env node
/**
 * gen-rules — her düğüme YAPISAL (motorun çalıştırabildiği) ECA kuralları + agentPolicy yazar.
 * Düz metin değil: evaluateEca(rule, event, ctx) bunları gerçekten değerlendirir (bkz. src/engine/eca.ts).
 * Kurallar düğümün başlığını/seviyesini gömer → bağlama özgü. Yalnız ecaRules/agentPolicy alanını yazar.
 * Güvenlik sınırı: AI app/module üretemez/güncelleyemez; yalnız ArcheType taslağı/önerisi üretebilir.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const NODES = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "data",
  "generated",
  "nodes",
);

const AUTONOMY = {
  app: "none",
  module: "none",
  archetype: "draft",
  stone: "suggest",
  molecule: "suggest",
  element: "suggest",
  atom: "suggest",
};

const FORBIDDEN_TARGETS = ["app", "module"];
const PROD_MIGRATIONS = ["append-only", "expand-contract"];

function rulesFor(n) {
  const t = n.title;
  const rules = [
    {
      id: `eca-${n.id}-done`,
      event: "task.status.changed",
      when: [{ field: "status", op: "eq", value: "done" }],
      then: { type: "notify", params: { target: "owner", message: `${t} tamamlandı` } },
      maxChainDepth: 6,
      requiresApproval: false,
    },
    {
      id: `eca-${n.id}-blocked`,
      event: "task.status.changed",
      when: [{ field: "status", op: "eq", value: "blocked" }],
      then: { type: "create-task", params: { title: `${t} blokajını çöz`, priority: "high" } },
      maxChainDepth: 6,
      requiresApproval: false,
    },
    {
      id: `eca-${n.id}-complete`,
      event: "task.progress.changed",
      when: [{ field: "progress", op: "gte", value: 100 }],
      then: { type: "set-field", params: { field: "status", value: "done" } },
      maxChainDepth: 6,
      requiresApproval: false,
    },
  ];
  rules.push(
    {
      id: `eca-${n.id}-ai-app-module-deny`,
      event: "ai.generation.requested",
      when: [
        { field: "actor", op: "eq", value: "ai" },
        { field: "targetLevel", op: "in", value: FORBIDDEN_TARGETS },
      ],
      then: { type: "deny", params: { reason: "ai-cannot-generate-app-or-module", node: n.id } },
      maxChainDepth: 6,
      requiresApproval: false,
    },
    {
      id: `eca-${n.id}-ai-app-module-update-deny`,
      event: "ai.update.requested",
      when: [
        { field: "actor", op: "eq", value: "ai" },
        { field: "targetLevel", op: "in", value: FORBIDDEN_TARGETS },
      ],
      then: { type: "deny", params: { reason: "ai-cannot-update-app-or-module", node: n.id } },
      maxChainDepth: 6,
      requiresApproval: false,
    },
    {
      id: `eca-${n.id}-ruleset-override-deny`,
      event: "ai.ruleset.override.requested",
      when: [{ field: "actor", op: "eq", value: "ai" }],
      then: { type: "deny", params: { reason: "ai-cannot-override-rulesets", node: n.id } },
      maxChainDepth: 6,
      requiresApproval: false,
    },
    {
      id: `eca-${n.id}-risk-quarantine`,
      event: "ai.risk.scored",
      when: [
        { field: "actor", op: "eq", value: "ai" },
        { field: "riskScore", op: "gte", value: 80 },
      ],
      then: {
        type: "create-task",
        params: { title: `${t} AI risk incelemesi`, priority: "critical" },
      },
      maxChainDepth: 6,
      requiresApproval: true,
    },
  );

  if (n.level === "archetype") {
    rules.push({
      id: `eca-${n.id}-archetype-draft-allow`,
      event: "ai.archetype.generate.requested",
      when: [
        { field: "actor", op: "eq", value: "ai" },
        { field: "targetLevel", op: "eq", value: "archetype" },
        { field: "environment", op: "in", value: ["draft", "staging"] },
      ],
      then: { type: "create-archetype-draft", params: { node: n.id, level: n.level } },
      maxChainDepth: 6,
      requiresApproval: true,
    });
    rules.push({
      id: `eca-${n.id}-archetype-prod-history-deny`,
      event: "ai.archetype.update.requested",
      when: [
        { field: "actor", op: "eq", value: "ai" },
        { field: "targetLevel", op: "eq", value: "archetype" },
        { field: "environment", op: "eq", value: "production" },
        { field: "historyPreserved", op: "neq", value: true },
      ],
      then: {
        type: "deny",
        params: { reason: "prod-archetype-update-must-preserve-history", node: n.id },
      },
      maxChainDepth: 6,
      requiresApproval: false,
    });
    rules.push({
      id: `eca-${n.id}-archetype-prod-update-gated`,
      event: "ai.archetype.update.requested",
      when: [
        { field: "actor", op: "eq", value: "ai" },
        { field: "targetLevel", op: "eq", value: "archetype" },
        { field: "environment", op: "eq", value: "production" },
        { field: "historyPreserved", op: "eq", value: true },
        { field: "snapshotCreated", op: "eq", value: true },
        { field: "rollbackReady", op: "eq", value: true },
        { field: "compatibilityChecked", op: "eq", value: true },
        { field: "migrationMode", op: "in", value: PROD_MIGRATIONS },
      ],
      then: { type: "propose-archetype-prod-update", params: { node: n.id, history: "preserved" } },
      maxChainDepth: 6,
      requiresApproval: true,
    });
  }
  return rules;
}

function policyFor(n) {
  const caps = ["read", "suggest-changeset"];
  if (n.source?.cluster === "data-intelligence") caps.push("rag-query", "text-to-sql");
  if (n.level === "archetype") caps.push("archetype-draft", "archetype-prod-update-proposal");
  return {
    autonomy: AUTONOMY[n.level] || "suggest",
    capabilities: caps,
    allowedTargets: n.level === "archetype" ? ["archetype"] : [],
    forbiddenTargets: FORBIDDEN_TARGETS,
    allowedActions:
      n.level === "archetype"
        ? [
            "read",
            "suggest-changeset",
            "generate-archetype-draft",
            "update-archetype-draft",
            "propose-archetype-prod-update",
          ]
        : ["read", "suggest-changeset"],
    forbiddenActions: [
      "generate-app",
      "generate-module",
      "update-app",
      "update-module",
      "publish-public",
      "disable-ruleset",
      "override-ruleset",
      "rewrite-history",
      "direct-prod-write",
    ],
    stepUp: [
      "propose-archetype-prod-update",
      "delete-field",
      "change-permission",
      "disable-protection",
      "migrate-data",
    ],
    rulesetBoundary: {
      enforced: true,
      canOverride: false,
      backendOnly: true,
      version: "ai-archetype-eca-v1",
    },
    prodDataPolicy: {
      preserveHistory: true,
      migrationModes: PROD_MIGRATIONS,
      requireSnapshot: true,
      requireRollback: true,
      requireCompatibilityCheck: true,
    },
    subPromptUntrusted: true,
    killSwitch: true,
  };
}

const files = fs.readdirSync(NODES).filter((f) => f.endsWith(".json"));
let count = 0;
for (const f of files) {
  const p = path.join(NODES, f);
  const n = JSON.parse(fs.readFileSync(p, "utf8"));
  // Bespoke (domain) ECA kuralları korunur; standart governance seti yenilenir/eklenir.
  const generated = rulesFor(n);
  const genIds = new Set(generated.map((r) => r.id));
  const bespoke = (n.ecaRules || []).filter((r) => !genIds.has(r.id));
  n.ecaRules = [...bespoke, ...generated];
  n.agentPolicy = policyFor(n);
  fs.writeFileSync(p, `${JSON.stringify(n, null, 2)}\n`);
  count++;
}
console.log(
  `[gen-rules] ${count} düğüme yapısal ECA kuralı + agentPolicy yazıldı (motor çalıştırabilir).`,
);
