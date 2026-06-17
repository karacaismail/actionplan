#!/usr/bin/env node
/**
 * derive-deps — mevcut düğüm dosyalarına bağımlılık (dependsOn/blocks) + related türetir.
 * İKİ kaynak: (1) cluster-katman omurgası (kesin, 100% çözülür, kritik-yol verir),
 *            (2) eski korpus tipli relations (depends-on/uses→dependsOn, sibling→related; best-effort).
 * Yalnız dependsOn/blocks/related alanlarını yazar; boyut/faz/PM içeriği KORUNUR (ingest regen YOK).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");
const NODES = path.join(REPO, "src", "data", "generated", "nodes");
const CORPUS = path.resolve(REPO, "..", "projector", "content-source");

// Cluster mimari katman bağımlılığı (app-seviyesi omurga)
const CLUSTER_DEPS = {
  kernel: ["atomic", "layer0"],
  scale: ["kernel"],
  layer1: ["kernel", "scale"],
  crosscut: ["kernel"],
  cc: ["kernel"],
  backend: ["kernel"],
  frontend: ["layer1"],
  fe: ["layer1"],
  sus: ["kernel", "layer1"],
  build: ["backend", "frontend"],
  dx: ["build"],
  "platform-horizontal": ["layer1", "kernel"],
  "core-operations": ["kernel", "layer1"],
  finance: ["core-operations", "kernel"],
  "supply-chain": ["core-operations"],
  hr: ["kernel", "layer1"],
  "customer-revenue": ["core-operations"],
  "content-collaboration": ["layer1"],
  "data-intelligence": ["layer1", "kernel"],
  vertical: ["core-operations", "finance"],
  edition: ["core-operations"],
  dist: ["platform-horizontal"],
  landx: ["frontend"],
};

const kebab = (s) =>
  String(s).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const files = fs.readdirSync(NODES).filter((f) => f.endsWith(".json"));
const nodes = files.map((f) => ({ f, n: JSON.parse(fs.readFileSync(path.join(NODES, f), "utf8")) }));
const byId = new Map(nodes.map(({ n }) => [n.id, n]));

// çözümleme yardımcıları: target (eski id) -> üretilmiş node id
const origToId = new Map();
for (const { n } of nodes) {
  if (n.source?.originalId) origToId.set(kebab(n.source.originalId), n.id);
  origToId.set(n.id, n.id);
}
// kısa-ek eşleştirme (k-authz -> kernel-authz gibi): id sonu/aliası
function resolve(target) {
  const k = kebab(target);
  if (byId.has(k)) return k;
  if (origToId.has(k)) return origToId.get(k);
  // "k-authz" gibi: aynı son parça ile biten tek node varsa eşle
  const tail = k.replace(/^[a-z]+-/, "");
  const cands = nodes.filter(({ n }) => n.id === k || n.id.endsWith(`-${tail}`));
  return cands.length === 1 ? cands[0].n.id : null;
}

const appByCluster = new Map();
for (const { n } of nodes) if (n.level === "app") appByCluster.set(n.source?.cluster, n.id);

const deps = new Map(); // id -> Set(dependsOn)
const rel = new Map(); // id -> Set(related)
const add = (m, id, v) => (m.get(id) ?? m.set(id, new Set()).get(id)).add(v);

// (1) Omurga: app -> alt-katman app
let backbone = 0;
for (const { n } of nodes) {
  if (n.level !== "app") continue;
  const c = n.source?.cluster;
  for (const dc of CLUSTER_DEPS[c] ?? []) {
    const t = appByCluster.get(dc);
    if (t && t !== n.id) {
      add(deps, n.id, t);
      backbone++;
    }
  }
}

// (2) Tipli relations (eski korpus)
let typed = 0;
let resolved = 0;
let unresolved = 0;
if (fs.existsSync(CORPUS)) {
  for (const cf of fs.readdirSync(CORPUS).filter((x) => x.endsWith(".json"))) {
    let raw;
    try {
      raw = JSON.parse(fs.readFileSync(path.join(CORPUS, cf), "utf8"));
    } catch {
      continue;
    }
    const srcId = resolve(raw.id || cf.replace(/\.json$/, ""));
    if (!srcId || !Array.isArray(raw.relations)) continue;
    for (const r of raw.relations) {
      if (!r?.target) continue;
      typed++;
      const tid = resolve(r.target);
      if (!tid || tid === srcId) {
        unresolved++;
        continue;
      }
      resolved++;
      if (["depends-on", "uses", "requires", "extends"].includes(r.type)) add(deps, srcId, tid);
      else add(rel, srcId, tid); // sibling/related
    }
  }
}

// yaz (dependsOn/blocks/related; parent'ı dependsOn'dan çıkar, cap 8)
const blocks = new Map();
let touched = 0;
for (const { f, n } of nodes) {
  const d = [...(deps.get(n.id) ?? [])].filter((x) => x !== n.parentId && byId.has(x)).slice(0, 8);
  const r = [...new Set([...(n.related ?? []), ...(rel.get(n.id) ?? [])])]
    .filter((x) => byId.has(x) && x !== n.id)
    .slice(0, 12);
  n.dependsOn = d;
  n.related = r;
  for (const t of d) add(blocks, t, n.id);
  void f;
}
for (const { n } of nodes) n.blocks = [...(blocks.get(n.id) ?? [])].slice(0, 20);
for (const { f, n } of nodes) {
  fs.writeFileSync(path.join(NODES, f), `${JSON.stringify(n, null, 2)}\n`);
  if (n.dependsOn.length) touched++;
}

console.log(
  `[derive-deps] omurga edge ${backbone}; tipli relations: ${typed} (çözüldü ${resolved}, çözülemedi ${unresolved}). ` +
    `dependsOn dolu düğüm: ${touched}/${nodes.length}.`,
);
