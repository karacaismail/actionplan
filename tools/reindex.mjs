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

const files = fs
  .readdirSync(NODES)
  .filter((f) => f.endsWith(".json"))
  .sort();
const nodes = files.map((f) => JSON.parse(fs.readFileSync(path.join(NODES, f), "utf8")));
const byId = new Map(nodes.map((n) => [n.id, n]));
const differs = (file, bytes) => !fs.existsSync(file) || fs.readFileSync(file, "utf8") !== bytes;
const writeIfChanged = (file, bytes) => {
  if (differs(file, bytes)) fs.writeFileSync(file, bytes);
};
let semanticChanged = false;

// ağaç
const childrenOf = new Map();
for (const n of nodes) {
  if (n.parentId && !byId.has(n.parentId)) n.parentId = null;
  if (n.parentId)
    (childrenOf.get(n.parentId) ?? childrenOf.set(n.parentId, []).get(n.parentId)).push(n);
}
const roots = nodes.filter((n) => !n.parentId);
// Sıralama: ÖNCE manuel `order` (öncelik), sonra başlık. (Eski hâli stale wbsCode'u birincil
// anahtar yapıyordu → öncelik 'order' yok sayılıyor, sıralama kilitleniyordu. ADR: order-öncelikli.)
const cmp = (a, b) => (a.order ?? 0) - (b.order ?? 0) || a.title.localeCompare(b.title, "tr");

let appIdx = 0;
function assign(node, code) {
  node.wbsCode = code;
  const kids = (childrenOf.get(node.id) || []).sort(cmp);
  for (const [i, k] of kids.entries()) assign(k, `${code}.${i + 1}`);
}
for (const r of roots.sort(cmp)) assign(r, String(++appIdx));

// node dosyalarını (wbsCode değişmiş olabilir) geri yaz
for (const n of nodes) {
  const file = path.join(NODES, `${n.id}.json`);
  const bytes = `${JSON.stringify(n, null, 2)}\n`;
  semanticChanged ||= differs(file, bytes);
  writeIfChanged(file, bytes);
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
const metaCore = {
  schemaVersion: SCHEMA_VERSION,
  counts: { total: nodes.length, byLevel, byStatus, byCluster, filledExample },
  source: prevMeta.source ?? {
    contentSource: 0,
    oldatas: 0,
    deduped: nodes.length,
    synthesizedApps: 0,
  },
};

// Lazy veri: ağır tüm-düğüm aggregate'i statik asset olarak (public/data) yaz.
// Runtime'da fetch ile çekilir → başlangıç JS paketine girmez.
const PUB = path.resolve(__dirname, "..", "public", "data");
fs.mkdirSync(PUB, { recursive: true });
const ordered = [...nodes].sort((a, b) =>
  (a.wbsCode || "").localeCompare(b.wbsCode || "", undefined, { numeric: true }),
);
const navigationFile = path.join(GEN, "navigation.json");
const indexFile = path.join(GEN, "index.json");
const publicFile = path.join(PUB, "nodes.json");
const navigationBytes = `${JSON.stringify(navigation, null, 2)}\n`;
const indexBytes = `${JSON.stringify(index, null, 2)}\n`;
const publicBytes = JSON.stringify(ordered);
semanticChanged ||= differs(navigationFile, navigationBytes);
semanticChanged ||= differs(indexFile, indexBytes);
semanticChanged ||= differs(publicFile, publicBytes);
const previousCore = {
  schemaVersion: prevMeta.schemaVersion,
  counts: prevMeta.counts,
  source: prevMeta.source,
};
semanticChanged ||= JSON.stringify(previousCore) !== JSON.stringify(metaCore);

const epoch = process.env.SOURCE_DATE_EPOCH;
const nextGeneratedAt = epoch
  ? new Date(Number(epoch) * 1000).toISOString()
  : new Date().toISOString();
const meta = {
  schemaVersion: metaCore.schemaVersion,
  generatedAt: semanticChanged ? nextGeneratedAt : prevMeta.generatedAt,
  counts: metaCore.counts,
  source: metaCore.source,
};

writeIfChanged(navigationFile, navigationBytes);
writeIfChanged(indexFile, indexBytes);
writeIfChanged(path.join(GEN, "meta.json"), `${JSON.stringify(meta, null, 2)}\n`);
writeIfChanged(publicFile, publicBytes);
console.log(
  `[reindex] ${nodes.length} düğüm, ${filledExample} dolu örnek. index/navigation/meta + public/data/nodes.json güncellendi.`,
);
