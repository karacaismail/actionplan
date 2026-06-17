#!/usr/bin/env node
/**
 * Reindex — generated/nodes/*.json dosyalarından index.json, navigation.json,
 * meta.json'u yeniden kurar ve wbsCode'ları yeniden hesaplar.
 * Ingest dışında düğüm eklendiğinde/düzenlendiğinde çalıştırılır (sözleşme korunur).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GEN = path.resolve(__dirname, "..", "src", "data", "generated");
const NODES = path.join(GEN, "nodes");
const SCHEMA_VERSION = "1.0.0";

const files = fs.readdirSync(NODES).filter((f) => f.endsWith(".json"));
const nodes = files.map((f) => JSON.parse(fs.readFileSync(path.join(NODES, f), "utf8")));
const byId = new Map(nodes.map((n) => [n.id, n]));

// ağaç
const childrenOf = new Map();
for (const n of nodes) {
  if (n.parentId && !byId.has(n.parentId)) n.parentId = null;
  if (n.parentId) (childrenOf.get(n.parentId) ?? childrenOf.set(n.parentId, []).get(n.parentId)).push(n);
}
const roots = nodes.filter((n) => !n.parentId);
const cmp = (a, b) =>
  (a.wbsCode || "").localeCompare(b.wbsCode || "", undefined, { numeric: true }) ||
  (a.order ?? 0) - (b.order ?? 0) ||
  a.title.localeCompare(b.title, "tr");

let appIdx = 0;
function assign(node, code) {
  node.wbsCode = code;
  const kids = (childrenOf.get(node.id) || []).sort(cmp);
  kids.forEach((k, i) => assign(k, `${code}.${i + 1}`));
}
roots.sort(cmp).forEach((r) => assign(r, String(++appIdx)));

// node dosyalarını (wbsCode değişmiş olabilir) geri yaz
for (const n of nodes) {
  fs.writeFileSync(path.join(NODES, `${n.id}.json`), `${JSON.stringify(n, null, 2)}\n`);
}

// navigation
function navOf(node) {
  const kids = (childrenOf.get(node.id) || []).sort((a, b) =>
    (a.wbsCode || "").localeCompare(b.wbsCode || "", undefined, { numeric: true }),
  );
  return {
    id: node.id,
    title: node.title,
    level: node.level,
    icon: node.icon || "ph-cube",
    wbsCode: node.wbsCode,
    children: kids.map(navOf),
  };
}
const navigation = roots
  .sort((a, b) => (a.wbsCode || "").localeCompare(b.wbsCode || "", undefined, { numeric: true }))
  .map(navOf);

// index
const index = nodes
  .map((n) => ({
    id: n.id,
    title: n.title,
    level: n.level,
    wbsCode: n.wbsCode,
    parentId: n.parentId,
    status: n.status,
    cluster: n.source?.cluster || "",
    icon: n.icon || "ph-cube",
  }))
  .sort((a, b) => (a.wbsCode || "").localeCompare(b.wbsCode || "", undefined, { numeric: true }));

// meta
const byLevel = {};
const byStatus = {};
const byCluster = {};
let filledExample = 0;
for (const n of nodes) {
  byLevel[n.level] = (byLevel[n.level] || 0) + 1;
  byStatus[n.status] = (byStatus[n.status] || 0) + 1;
  const c = n.source?.cluster || "meta";
  byCluster[c] = (byCluster[c] || 0) + 1;
  const dims = Object.values(n.dimensions || {});
  if (dims.some((d) => d.status && d.status !== "skeleton")) filledExample++;
}
const prevMeta = JSON.parse(fs.readFileSync(path.join(GEN, "meta.json"), "utf8"));
const meta = {
  schemaVersion: SCHEMA_VERSION,
  generatedAt: new Date().toISOString(),
  counts: { total: nodes.length, byLevel, byStatus, byCluster, filledExample },
  source: prevMeta.source ?? { contentSource: 0, oldatas: 0, deduped: nodes.length, synthesizedApps: 0 },
};

fs.writeFileSync(path.join(GEN, "navigation.json"), `${JSON.stringify(navigation, null, 2)}\n`);
fs.writeFileSync(path.join(GEN, "index.json"), `${JSON.stringify(index, null, 2)}\n`);
fs.writeFileSync(path.join(GEN, "meta.json"), `${JSON.stringify(meta, null, 2)}\n`);
console.log(`[reindex] ${nodes.length} düğüm, ${filledExample} dolu örnek. index/navigation/meta güncellendi.`);
