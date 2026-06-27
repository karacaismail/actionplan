#!/usr/bin/env node
/**
 * Ingest — eski korpusları (oldatas + projector/content-source) parse edip
 * iskelet TaskNode JSON veri seti üretir (JSON-as-DB).
 *
 * - Zero-dep (saf node). Yerelde çalışır, çıktısı repoya commit edilir.
 * - Kaynak korpus bulunmazsa (örn. CI) no-op: mevcut generated korunur.
 * - Sabitler src/schemas/task.ts ile eşlenir; şema testi sapmayı yakalar.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const CORPUS_ROOT = process.env.CORPUS_ROOT
  ? path.resolve(process.env.CORPUS_ROOT)
  : path.resolve(REPO_ROOT, "..");

const SOURCES = [
  { corpus: "content-source", dir: path.join(CORPUS_ROOT, "projector", "content-source") },
  { corpus: "oldatas", dir: path.join(CORPUS_ROOT, "oldatas") },
];
const OUT_DIR = path.join(REPO_ROOT, "src", "data", "generated");
const NODES_DIR = path.join(OUT_DIR, "nodes");

const SCHEMA_VERSION = "1.0.0";

// --- Sabitler (src/schemas/task.ts ile eşlenir) ---
const DIMENSION_META = {
  featureDefs: "Özellik Tanımları",
  security: "Güvenlik Önlemleri",
  codeOptimization: "Kod Optimizasyonu",
  securityOptimization: "Güvenlik Optimizasyonu",
  performance: "Performans Optimizasyonu",
  mobileApps: "Mobil Uygulama Uyumu",
  wcag: "WCAG 2.2 AAA",
  deployment: "Dağıtım (Swarm/K8s/Shared)",
  eca: "ECA Kuralları",
  aiAgents: "AI Ajan Davranışı",
  testing: "Testler & QA",
  owasp: "OWASP & Standartlar",
  integration: "Kernel/Core Entegrasyonu",
  moduleUsage: "Modül Kullanımı",
};
const WATERFALL_PHASES = [
  "requirements",
  "test-plan",
  "db-schema",
  "development",
  "test-qa",
  "verification",
  "release-maintenance",
];
const GRANULARITY_TO_LEVEL = {
  dag: "app",
  dağ: "app",
  kaya: "module",
  "buyuk-tas": "archetype",
  "büyük-taş": "archetype",
  "orta-tas": "stone",
  "orta-taş": "stone",
  "kucuk-tas": "molecule",
  "küçük-taş": "molecule",
  toz: "element",
  "toz-tanesi": "element",
  atom: "atom",
};
const CLUSTER_TITLE = {
  "core-operations": "Çekirdek Operasyon",
  finance: "Finans & Muhasebe",
  "supply-chain": "Tedarik Zinciri & Lojistik",
  hr: "İnsan Kaynakları",
  "customer-revenue": "Müşteri & Gelir",
  "content-collaboration": "İçerik & İşbirliği",
  "data-intelligence": "Veri & Zeka (AI-first)",
  "platform-horizontal": "Platform & Yatay",
  vertical: "Dikey / Sektörel",
  dikey: "Dikey / Sektörel",
  kernel: "Kernel",
  scale: "Scale Primitifleri",
  layer0: "Layer 0 — Atomik Tipler",
  layer1: "Layer 1 — In-tree Modüller",
  crosscut: "Cross-cutting",
  cc: "Cross-cutting",
  sus: "Platform Yetenekleri",
  build: "Build & Dağıtım",
  frontend: "Frontend",
  fe: "Frontend",
  backend: "Backend",
  edu: "Eğitim",
  kararlar: "Kararlar (ADR)",
  aday: "Aday Sayfalar",
  meta: "Meta & Genel Bakış",
  stack: "Stack",
  edition: "Sürümler (Edition)",
  dist: "Dağıtım Kanalları",
  dx: "Geliştirici Deneyimi",
  file: "Dosya & Layout",
  l1: "Layer 1",
  s: "Stack Ürünleri",
};
const CLUSTER_ICON = {
  finance: "ph-coins",
  hr: "ph-users-three",
  "core-operations": "ph-storefront",
  "supply-chain": "ph-truck",
  "customer-revenue": "ph-chart-line-up",
  "content-collaboration": "ph-files",
  "data-intelligence": "ph-brain",
  "platform-horizontal": "ph-squares-four",
  kernel: "ph-cpu",
  scale: "ph-arrows-out",
  edu: "ph-graduation-cap",
  kararlar: "ph-gavel",
};

function kebab(s) {
  return (
    String(s)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "dugum"
  );
}

function titleCase(s) {
  return String(s)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function skeletonDimensions() {
  const out = {};
  for (const [key, tr] of Object.entries(DIMENSION_META)) {
    out[key] = { key, title: tr, status: "skeleton", items: [], notes: "" };
  }
  return out;
}
function skeletonPhases() {
  const out = {};
  for (const p of WATERFALL_PHASES) {
    out[p] = { status: "pending", criteria: [], passed: false, notes: "" };
  }
  return out;
}

function readCorpus(dir, corpus) {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  const rows = [];
  for (const f of files) {
    // ARCHITECTURE manifestleri vb. sayfa değil → atla
    if (/^ARCHITECTURE/i.test(f)) continue;
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
      if (!raw.id && !raw.title) continue;
      rows.push({ corpus, file: f, raw });
    } catch {
      /* bozuk json atla */
    }
  }
  return rows;
}

function main() {
  const present = SOURCES.filter((s) => fs.existsSync(s.dir));
  if (present.length === 0) {
    console.log("[ingest] Kaynak korpus bulunamadı (CI?). Mevcut generated korunuyor.");
    return;
  }

  // 1) Oku — content-source önce (kanonik), oldatas sonra
  const all = [];
  for (const { corpus, dir } of SOURCES) all.push(...readCorpus(dir, corpus));
  const counts = { contentSource: 0, oldatas: 0 };
  for (const r of all) {
    if (r.corpus === "content-source") counts.contentSource++;
    else counts.oldatas++;
  }

  // 2) Dedupe by id — content-source kazanır
  const byId = new Map();
  for (const r of all) {
    const id = kebab(r.raw.id || r.file.replace(/\.json$/, ""));
    if (byId.has(id) && byId.get(id).corpus === "content-source") continue;
    byId.set(id, { ...r, id });
  }

  // 3) App kökleri (cluster bazlı) sentezle
  const clusters = new Set();
  for (const { raw } of byId.values()) clusters.add(raw.cluster || "meta");
  const appNodes = new Map();
  for (const c of clusters) {
    const id = kebab(`app-${c}`);
    appNodes.set(c, {
      schemaVersion: SCHEMA_VERSION,
      id,
      wbsCode: "",
      level: "app",
      title: CLUSTER_TITLE[c] || titleCase(c),
      slug: id,
      summary: `${CLUSTER_TITLE[c] || titleCase(c)} kümesinin geliştirme eylem planı.`,
      parentId: null,
      order: 0,
      icon: CLUSTER_ICON[c] || "ph-mountains",
      tags: [c, "app", "küme"],
      dependsOn: [],
      blocks: [],
      related: [],
      refs: [],
      criticalPath: false,
      status: "backlog",
      priority: "medium",
      owner: null,
      effort: { estimate: 0, unit: "sp", spent: 0 },
      progress: 0,
      phase: "requirements",
      phases: skeletonPhases(),
      deliverables: [],
      acceptanceCriteria: [],
      risks: [],
      rollback: null,
      evidence: [],
      metrics: [],
      dimensions: skeletonDimensions(),
      source: { corpus: "synthetic", originalId: "", granularity: "dag", cluster: c },
      state: "taslak",
      lastUpdated: "",
    });
  }

  // 4) Sayfa düğümlerini üret
  const pageNodes = [];
  for (const { raw, corpus, id } of byId.values()) {
    const cluster = raw.cluster || "meta";
    const gran = (raw.granularity || "").toLowerCase();
    const level = GRANULARITY_TO_LEVEL[gran] || "module";
    const parentField = raw.parent ? kebab(raw.parent) : null;
    // parent: açık parent alanı varsa onu, yoksa cluster app'i
    const parentId = parentField && byId.has(parentField) ? parentField : appNodes.get(cluster).id;
    const related = []
      .concat(Array.isArray(raw.related) ? raw.related : [])
      .concat(
        Array.isArray(raw.relations)
          ? raw.relations.map((r) => (typeof r === "string" ? r : r?.target))
          : [],
      )
      .filter(Boolean)
      .map(kebab);
    pageNodes.push({
      schemaVersion: SCHEMA_VERSION,
      id,
      wbsCode: "",
      level,
      title: raw.title || titleCase(id),
      slug: id,
      summary: raw.subtitle || raw.enrich?.info || "",
      parentId,
      order: typeof raw.order === "number" ? raw.order : 0,
      icon: raw.icon || "ph-cube",
      tags: Array.isArray(raw.tags) ? raw.tags.slice(0, 12) : [],
      dependsOn: [],
      blocks: [],
      related: Array.from(new Set(related)).slice(0, 20),
      refs: [],
      criticalPath: false,
      status: "backlog",
      priority: raw.badge === "critical" ? "high" : "medium",
      owner: null,
      effort: { estimate: 0, unit: "sp", spent: 0 },
      progress: 0,
      phase: "requirements",
      phases: skeletonPhases(),
      deliverables: [],
      acceptanceCriteria: [],
      risks: [],
      rollback: null,
      evidence: [],
      metrics: [],
      dimensions: skeletonDimensions(),
      source: { corpus, originalId: raw.id || "", granularity: gran, cluster },
      state: ["taslak", "aday", "incelemede", "dogrulanmis"].includes(raw.state)
        ? raw.state
        : raw.state === "ok"
          ? "dogrulanmis"
          : raw.state === "wip"
            ? "taslak"
            : "taslak",
      lastUpdated: "",
    });
  }

  // 5) Birleşik liste + ağaç + wbsCode
  const nodes = [...appNodes.values(), ...pageNodes];
  const byNodeId = new Map(nodes.map((n) => [n.id, n]));
  // ebeveyni kaybolan düğümleri en yakın app'e/relinkle
  for (const n of nodes) {
    if (n.parentId && !byNodeId.has(n.parentId)) {
      const c = n.source?.cluster || "meta";
      n.parentId = appNodes.get(c)?.id ?? null;
    }
  }
  const childrenOf = new Map();
  for (const n of nodes) {
    if (!n.parentId) continue;
    if (!childrenOf.has(n.parentId)) childrenOf.set(n.parentId, []);
    childrenOf.get(n.parentId).push(n);
  }
  const roots = nodes
    .filter((n) => !n.parentId)
    .sort((a, b) => a.title.localeCompare(b.title, "tr"));

  let appIdx = 0;
  function assign(node, code) {
    node.wbsCode = code;
    const kids = (childrenOf.get(node.id) || []).sort(
      (a, b) => a.order - b.order || a.title.localeCompare(b.title, "tr"),
    );
    for (const [i, k] of kids.entries()) assign(k, `${code}.${i + 1}`);
  }
  for (const r of roots) assign(r, String(++appIdx));

  // 6) Yaz
  fs.rmSync(NODES_DIR, { recursive: true, force: true });
  fs.mkdirSync(NODES_DIR, { recursive: true });
  for (const n of nodes) {
    fs.writeFileSync(path.join(NODES_DIR, `${n.id}.json`), `${JSON.stringify(n, null, 2)}\n`);
  }

  // 7) navigation.json (ağaç)
  function navOf(node) {
    const kids = (childrenOf.get(node.id) || []).sort((a, b) =>
      (a.wbsCode || "").localeCompare(b.wbsCode || "", undefined, { numeric: true }),
    );
    return {
      id: node.id,
      title: node.title,
      level: node.level,
      icon: node.icon,
      wbsCode: node.wbsCode,
      children: kids.map(navOf),
    };
  }
  const navigation = roots
    .sort((a, b) => (a.wbsCode || "").localeCompare(b.wbsCode || "", undefined, { numeric: true }))
    .map(navOf);

  // 8) index.json (özet)
  const index = nodes
    .map((n) => ({
      id: n.id,
      title: n.title,
      level: n.level,
      wbsCode: n.wbsCode,
      parentId: n.parentId,
      status: n.status,
      cluster: n.source?.cluster || "",
      icon: n.icon,
    }))
    .sort((a, b) => (a.wbsCode || "").localeCompare(b.wbsCode || "", undefined, { numeric: true }));

  // 9) meta.json
  const byLevel = {};
  const byStatus = {};
  const byCluster = {};
  for (const n of nodes) {
    byLevel[n.level] = (byLevel[n.level] || 0) + 1;
    byStatus[n.status] = (byStatus[n.status] || 0) + 1;
    const c = n.source?.cluster || "meta";
    byCluster[c] = (byCluster[c] || 0) + 1;
  }
  const meta = {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    counts: {
      total: nodes.length,
      byLevel,
      byStatus,
      byCluster,
      filledExample: 0,
    },
    source: {
      contentSource: counts.contentSource,
      oldatas: counts.oldatas,
      deduped: byId.size,
      synthesizedApps: appNodes.size,
    },
  };

  fs.writeFileSync(
    path.join(OUT_DIR, "navigation.json"),
    `${JSON.stringify(navigation, null, 2)}\n`,
  );
  fs.writeFileSync(path.join(OUT_DIR, "index.json"), `${JSON.stringify(index, null, 2)}\n`);
  fs.writeFileSync(path.join(OUT_DIR, "meta.json"), `${JSON.stringify(meta, null, 2)}\n`);

  console.log(
    `[ingest] ${nodes.length} düğüm yazıldı (app ${appNodes.size}, sayfa ${pageNodes.length}). ` +
      `Kaynak: content-source ${counts.contentSource}, oldatas ${counts.oldatas}, dedupe ${byId.size}.`,
  );
}

main();
