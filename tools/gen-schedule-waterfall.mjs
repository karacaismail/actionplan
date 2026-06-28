#!/usr/bin/env node
/**
 * gen-schedule-waterfall — tüm plana TÜRETİLMİŞ baseline takvim üretir (waterfall).
 *
 * Bu nedir? Her düğüm için start/end ve baselineStart/baselineEnd'i, bağımlılık DAG'ı (dependsOn) +
 *   efor (süre) üzerinden kritik-yol mantığıyla türetir. Yani "ne zaman" sorusu plan genelinde dolar.
 * Ne yapar? Topolojik sırada: bir düğüm, bağımlı olduğu düğümler bittikten sonra başlar (ES/EF).
 *   Ebeveyn düğümler (app/module...) çocuklarını kapsayacak şekilde yuvarlanır (Gantt tutarlılığı).
 * Ne yapmaz? actualStart/actualEnd'e dokunmaz (gerçekleşen veriyi insan girer). Zaten elle girilmiş
 *   start/end olan düğümleri KORUR (CRM/platform/golden anchor'ları) ve onları öncül-bitişi olarak kullanır.
 *   Süre uydurmaz; effort.estimate'i gün kabul eder (yoksa varsayılan 3 gün).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NODES = path.join(ROOT, "src", "data", "generated", "nodes");
const PROJECT_START = "2026-07-01";
const DAY = 86400000;
const iso = (d) => new Date(d).toISOString().slice(0, 10);
const addDays = (isoStr, n) => iso(new Date(isoStr).getTime() + n * DAY);
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

const files = fs.readdirSync(NODES).filter((f) => f.endsWith(".json"));
const nodes = files.map((f) => ({
  f,
  n: JSON.parse(fs.readFileSync(path.join(NODES, f), "utf8")),
}));
const byId = new Map(nodes.map(({ n }) => [n.id, n]));
const childrenOf = new Map();
for (const { n } of nodes) {
  if (n.parentId && byId.has(n.parentId))
    (childrenOf.get(n.parentId) ?? childrenOf.set(n.parentId, []).get(n.parentId)).push(n.id);
}

const durationOf = (n) => clamp(Math.round(n.effort?.estimate || 3), 1, 20);
const hasFixed = (n) => n.schedule?.start && n.schedule?.end;

// Topolojik sıra (dependsOn DAG; veri-kalite kapısı çevrimsizliği garanti eder).
const color = new Map();
const order = [];
const visit = (id) => {
  if (color.get(id)) return;
  color.set(id, 1);
  for (const dep of byId.get(id)?.dependsOn ?? []) if (byId.has(dep)) visit(dep);
  order.push(id);
};
for (const { n } of nodes) visit(n.id);

// ES/EF: düğüm, bağımlılarının bitişinden sonra başlar. Sabit tarihliler korunur.
const startOf = new Map();
const endOf = new Map();
for (const id of order) {
  const n = byId.get(id);
  if (hasFixed(n)) {
    startOf.set(id, n.schedule.start);
    endOf.set(id, n.schedule.end);
    continue;
  }
  let es = PROJECT_START;
  for (const dep of n.dependsOn ?? []) {
    const de = endOf.get(dep);
    if (de && new Date(de) >= new Date(es)) es = addDays(de, 1);
  }
  const ef = addDays(es, durationOf(n) - 1);
  startOf.set(id, es);
  endOf.set(id, ef);
}

// Ebeveyn yuvarlama (post-order): ebeveyn, alt ağacını kapsar. Sabit tarihliler yine korunur.
const rollupColor = new Map();
const rollup = (id) => {
  if (rollupColor.get(id)) return [startOf.get(id), endOf.get(id)];
  rollupColor.set(id, 1);
  const kids = childrenOf.get(id) ?? [];
  let s = startOf.get(id);
  let e = endOf.get(id);
  for (const k of kids) {
    const [ks, ke] = rollup(k);
    if (new Date(ks) < new Date(s)) s = ks;
    if (new Date(ke) > new Date(e)) e = ke;
  }
  const n = byId.get(id);
  if (!hasFixed(n)) {
    startOf.set(id, s);
    endOf.set(id, e);
  }
  return [startOf.get(id), endOf.get(id)];
};
for (const { n } of nodes) if (!n.parentId) rollup(n.id);

// Yaz (start/end + baseline; actual'lara dokunma).
let count = 0;
for (const { f, n } of nodes) {
  const s = startOf.get(n.id);
  const e = endOf.get(n.id);
  if (!s || !e) continue;
  n.schedule = {
    start: s,
    end: e,
    actualStart: n.schedule?.actualStart ?? null,
    actualEnd: n.schedule?.actualEnd ?? null,
    baselineStart: s,
    baselineEnd: e,
  };
  fs.writeFileSync(path.join(NODES, f), `${JSON.stringify(n, null, 2)}\n`);
  count++;
}
console.log(
  `[gen-schedule-waterfall] ${count} düğüme türetilmiş baseline takvim yazıldı (DAG+efor).`,
);
