#!/usr/bin/env node
/**
 * gen-schedule — yürütme alanlarını backfill eder:
 *  - milestone: düğümün ait olduğu APP (dağ) başlığı = release train (yapısal, mock değil).
 *  - schedule: boş iskelet ({start,end,actualStart,actualEnd}=null) — tarihleri moderatör
 *    (scrum master) uygulamada girer ve browser-storage'a kaydeder. Golden düğümlere
 *    gösterim için örnek takvim tohumlanır.
 * Yalnız milestone/schedule alanlarını yazar; diğer içeriği korur.
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

const CLUSTER_TR = {
  kernel: "Kernel",
  scale: "Scale",
  layer1: "Layer 1",
  "core-operations": "Çekirdek Operasyon",
  finance: "Finans",
  "supply-chain": "Tedarik Zinciri",
  hr: "İK",
  "customer-revenue": "Müşteri & Gelir",
  "content-collaboration": "İçerik & İşbirliği",
  "data-intelligence": "Veri & Zekâ",
  vertical: "Dikey",
  "platform-horizontal": "Platform & Yatay",
  sus: "Platform Yetenekleri",
};

const GOLDEN_SCHEDULE = {
  product: { start: "2026-07-01", end: "2026-09-30" },
  customer: { start: "2026-06-15", end: "2026-08-31" },
  "s-crm": { start: "2026-05-01", end: "2026-10-31" },
};

const files = fs.readdirSync(NODES).filter((f) => f.endsWith(".json"));
const byId = new Map();
const objs = [];
for (const f of files) {
  const o = JSON.parse(fs.readFileSync(path.join(NODES, f), "utf8"));
  byId.set(o.id, o);
  objs.push([f, o]);
}

function appAncestor(n) {
  let cur = n;
  const guard = new Set();
  while (cur && !guard.has(cur.id)) {
    if (cur.level === "app") return cur;
    guard.add(cur.id);
    cur = cur.parentId ? byId.get(cur.parentId) : null;
  }
  return null;
}

let count = 0;
for (const [f, n] of objs) {
  let changed = false;
  if (n.milestone == null) {
    const app = appAncestor(n);
    const cl = n.source?.cluster ? CLUSTER_TR[n.source.cluster] || n.source.cluster : null;
    const ms = app ? app.title : cl ? `Küme: ${cl}` : null;
    if (ms) {
      n.milestone = ms;
      changed = true;
    }
  }
  if (!n.schedule) {
    n.schedule = { start: null, end: null, actualStart: null, actualEnd: null };
    changed = true;
  }
  if (GOLDEN_SCHEDULE[n.id]) {
    n.schedule.start = GOLDEN_SCHEDULE[n.id].start;
    n.schedule.end = GOLDEN_SCHEDULE[n.id].end;
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(path.join(NODES, f), `${JSON.stringify(n, null, 2)}\n`);
    count++;
  }
}
console.log(
  `[gen-schedule] ${count} düğüme milestone/schedule yazıldı (golden örnek takvim tohumlandı).`,
);
