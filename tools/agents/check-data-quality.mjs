#!/usr/bin/env node
/**
 * check-data-quality — VERİ KALİTE KAPISI (Faz P3 — BLOKLAYICI).
 *
 * Bu nedir? Üretilmiş düğüm veri setinin "yürütülebilir-plan" invariantlarını zorlayan kapı.
 * Ne yapar? Şu kuralları DOĞRULAR ve ihlalde exit 1 verir (CI deploy'u durur):
 *   1. owner: HER düğümde dolu olmalı (sorumluluk boşluğu olamaz).
 *   2. owner geçerli bir ekip (people.json) olmalı.
 *   3. Referans bütünlüğü: dependsOn / blocks / related içindeki HER id gerçek bir düğüm olmalı (dangling yok).
 *   4. parentId null ya da gerçek bir düğüm olmalı.
 *   5. dependsOn grafiğinde DÖNGÜ olmamalı (DAG).
 * Ne yapmaz? İçeriğin "kalitesini" (jenerik mi) yargılamaz — onu içerik kapısı yapar. Burada
 *   yalnızca yapısal/ilişkisel bütünlük ve sahiplik zorlanır. refs zorunlu-dolu DEĞİLDİR
 *   (sentezlenmiş düğümlerin gerçek kaynağı olmayabilir; uydurma ref istenmez).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const NODES = path.join(ROOT, "src", "data", "generated", "nodes");

const validTeams = new Set(
  JSON.parse(fs.readFileSync(path.join(ROOT, "src", "data", "people.json"), "utf8")).map(
    (p) => p.id,
  ),
);

const nodes = fs
  .readdirSync(NODES)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(fs.readFileSync(path.join(NODES, f), "utf8")));

const ids = new Set(nodes.map((n) => n.id));
const fails = [];

// 1+2: owner dolu + geçerli ekip
for (const n of nodes) {
  if (!n.owner) fails.push(`owner-bos: ${n.id}`);
  else if (!validTeams.has(n.owner)) fails.push(`owner-gecersiz: ${n.id} -> "${n.owner}"`);
}

// 3: referans bütünlüğü (dependsOn/blocks/related)
for (const n of nodes) {
  for (const field of ["dependsOn", "blocks", "related"]) {
    for (const ref of n[field] ?? []) {
      if (!ids.has(ref)) fails.push(`dangling-${field}: ${n.id} -> ${ref}`);
    }
  }
  // 4: parentId
  if (n.parentId != null && !ids.has(n.parentId))
    fails.push(`dangling-parentId: ${n.id} -> ${n.parentId}`);
}

// 5: dependsOn döngü tespiti (DFS, renk işaretleme)
const byId = new Map(nodes.map((n) => [n.id, n]));
const color = new Map(); // 0=beyaz 1=gri 2=siyah
const cyclePath = [];
function dfs(id, stack) {
  color.set(id, 1);
  stack.push(id);
  for (const dep of byId.get(id)?.dependsOn ?? []) {
    if (!byId.has(dep)) continue;
    const c = color.get(dep) ?? 0;
    if (c === 1) {
      cyclePath.push([...stack.slice(stack.indexOf(dep)), dep].join(" -> "));
      return true;
    }
    if (c === 0 && dfs(dep, stack)) return true;
  }
  stack.pop();
  color.set(id, 2);
  return false;
}
for (const n of nodes) {
  if ((color.get(n.id) ?? 0) === 0 && dfs(n.id, [])) break;
}
for (const cp of cyclePath) fails.push(`dongu: ${cp}`);

// Rapor
const ownerCount = nodes.filter((n) => n.owner).length;
console.log(
  `[data-quality] düğüm: ${nodes.length} · owner dolu: ${ownerCount}/${nodes.length} · geçerli ekip: ${validTeams.size}`,
);
if (fails.length) {
  console.error(`\nSONUÇ: KIRMIZI ✗ — ${fails.length} ihlal:`);
  for (const f of fails.slice(0, 50)) console.error(`  - ${f}`);
  if (fails.length > 50) console.error(`  ... +${fails.length - 50} daha`);
  process.exit(1);
}
console.log("SONUÇ: YEŞİL ✓ — owner %100, referans bütünlüğü tam, döngü yok.");
