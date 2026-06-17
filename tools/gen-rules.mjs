#!/usr/bin/env node
/**
 * gen-rules — her düğüme YAPISAL (motorun çalıştırabildiği) ECA kuralları + agentPolicy yazar.
 * Düz metin değil: evaluateEca(rule, event, ctx) bunları gerçekten değerlendirir (bkz. src/engine/eca.ts).
 * Kurallar düğümün başlığını/seviyesini gömер → bağlama özgü. Yalnız ecaRules/agentPolicy alanını yazar.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const NODES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "data", "generated", "nodes");

const AUTONOMY = { app: "apply-gated", module: "apply-gated", archetype: "draft", stone: "draft", molecule: "suggest", element: "suggest", atom: "suggest" };

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
  // app/module: dış etkili yayın → step-up (insan onayı)
  if (n.level === "app" || n.level === "module") {
    rules.push({
      id: `eca-${n.id}-publish`,
      event: "task.publish.requested",
      when: [{ field: "phase", op: "eq", value: "release-maintenance" }],
      then: { type: "publish", params: { scope: "public", module: n.id } },
      maxChainDepth: 6,
      requiresApproval: true,
    });
  }
  return rules;
}

function policyFor(n) {
  const caps = ["read", "suggest-changeset"];
  if (n.source?.cluster === "data-intelligence") caps.push("rag-query", "text-to-sql");
  if (n.source?.cluster === "platform-horizontal") caps.push("workflow-author");
  return {
    autonomy: AUTONOMY[n.level] || "suggest",
    capabilities: caps,
    stepUp: ["publish-public", "delete-field", "change-permission", "disable-protection", "migrate-data"],
    subPromptUntrusted: true,
    killSwitch: true,
  };
}

const files = fs.readdirSync(NODES).filter((f) => f.endsWith(".json"));
let count = 0;
for (const f of files) {
  const p = path.join(NODES, f);
  const n = JSON.parse(fs.readFileSync(p, "utf8"));
  n.ecaRules = rulesFor(n);
  n.agentPolicy = policyFor(n);
  fs.writeFileSync(p, `${JSON.stringify(n, null, 2)}\n`);
  count++;
}
console.log(`[gen-rules] ${count} düğüme yapısal ECA kuralı + agentPolicy yazıldı (motor çalıştırabilir).`);
