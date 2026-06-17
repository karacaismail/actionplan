#!/usr/bin/env node
/**
 * expand-depth — her ÜRÜN/SİSTEM app'inin altında 7. seviyeye (atom) inen bir örnek
 * kırılım zinciri sentezler (eleştiri #3: derinlik sadece CRM'deydi).
 * Mevcut en derin düğümün altına eksik seviyeleri ekler. Doc/meta kümeleri hariç (ADR atoma inmez).
 * Yeni düğümler tam şema-uyumlu iskelettir; sonra fill-dimensions+gen-prompts+gen-rules+reindex işler.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const NODES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "data", "generated", "nodes");
const LEVELS = ["app", "module", "archetype", "stone", "molecule", "element", "atom"];
const LEVEL_TR = { module: "Modül", archetype: "ArcheType", stone: "Taş", molecule: "Molekül", element: "Element", atom: "Atom" };
// 7-seviye kırılımın anlamlı olduğu ürün/sistem kümeleri (doc/meta hariç)
const EXPAND = new Set([
  "core-operations", "finance", "supply-chain", "hr", "customer-revenue", "content-collaboration",
  "data-intelligence", "platform-horizontal", "vertical", "kernel", "scale", "layer1",
  "frontend", "backend", "build", "sus", "crosscut",
]);
const DIMS = ["featureDefs","security","codeOptimization","securityOptimization","performance","mobileApps","wcag","deployment","eca","aiAgents","testing","owasp","integration","moduleUsage"];
const PHASES = ["requirements","test-plan","db-schema","development","test-qa","verification","release-maintenance"];
const skelDims = () => Object.fromEntries(DIMS.map((k) => [k, { key: k, title: k, status: "skeleton", items: [], notes: "", prompt: "" }]));
const skelPhases = () => Object.fromEntries(PHASES.map((p) => [p, { status: "pending", criteria: [], passed: false, notes: "" }]));

const files = fs.readdirSync(NODES).filter((f) => f.endsWith(".json"));
const nodes = files.map((f) => JSON.parse(fs.readFileSync(path.join(NODES, f), "utf8")));
const byId = new Map(nodes.map((n) => [n.id, n]));
const childrenOf = new Map();
for (const n of nodes) if (n.parentId) (childrenOf.get(n.parentId) ?? childrenOf.set(n.parentId, []).get(n.parentId)).push(n);

function deepestUnder(appId) {
  let best = byId.get(appId);
  const stack = [...(childrenOf.get(appId) ?? [])];
  while (stack.length) {
    const n = stack.pop();
    if (LEVELS.indexOf(n.level) > LEVELS.indexOf(best.level)) best = n;
    stack.push(...(childrenOf.get(n.id) ?? []));
  }
  return best;
}

const apps = nodes.filter((n) => n.level === "app" && EXPAND.has(n.source?.cluster));
let created = 0;
for (const app of apps) {
  let parent = deepestUnder(app.id);
  let li = LEVELS.indexOf(parent.level);
  if (li >= 6) continue; // zaten atom var
  for (li += 1; li <= 6; li++) {
    const level = LEVELS[li];
    const id = `${app.id}-x-${level}`;
    if (byId.has(id)) {
      parent = byId.get(id);
      continue;
    }
    const node = {
      schemaVersion: "1.0.0",
      id,
      wbsCode: "",
      level,
      title: `${LEVEL_TR[level]} — ${app.title} örnek kırılımı`,
      slug: id,
      summary: `${app.title} için 7-seviye WBS kırılımının ${LEVEL_TR[level]} seviyesi (örnek dal).`,
      parentId: parent.id,
      order: 99,
      icon: "ph-cube",
      tags: [app.source?.cluster, "ornek", "7-seviye", level].filter(Boolean),
      dependsOn: [], blocks: [], related: [], refs: [], criticalPath: false,
      status: "backlog", priority: "medium", owner: null,
      effort: { estimate: Math.max(1, 6 - li), unit: "sp", spent: 0 },
      progress: 0, phase: "requirements", phases: skelPhases(),
      deliverables: [], acceptanceCriteria: [], risks: [], metrics: [], ecaRules: [],
      dimensions: skelDims(),
      source: { corpus: "synthetic", originalId: "", granularity: "", cluster: app.source?.cluster || "" },
      state: "taslak", lastUpdated: "",
    };
    fs.writeFileSync(path.join(NODES, `${id}.json`), `${JSON.stringify(node, null, 2)}\n`);
    byId.set(id, node);
    parent = node;
    created++;
  }
}
console.log(`[expand-depth] ${apps.length} app işlendi, ${created} yeni düğüm (molecule/element/atom) eklendi.`);
