#!/usr/bin/env node
/**
 * fix-dep-cycles — dependsOn grafiğindeki DÖNGÜLERİ deterministik olarak kırar (Faz P3).
 *
 * Bu nedir? dependsOn bir DAG (yönlü çevrimsiz graf) olmalıdır; A→B ve B→A gibi döngüler
 *   "sıralanamaz bağımlılık" demektir ve geçersizdir. Bu döngüler eski bir derive-deps
 *   çalışmasında simetrik "related/sibling" ilişkilerinin yanlışlıkla çift-yönlü dependsOn'a
 *   dönüşmesinden kaynaklanır.
 * Ne yapar? Tek bir DFS ile back-edge'leri (geri kenar) bulur ve dependsOn'dan çıkarır;
 *   bilgi kaybı olmasın diye çıkarılan kenarı `related`'a taşır (ilişki korunur, döngü kalkar).
 *   DFS, hiyerarşi sırasıyla (app→atom) yürür; böylece "alt-seviye → üst-seviye" ters kenarları
 *   tercihen kaldırılır (üst-seviyenin alt-seviyeye bağımlılığı doğru yön olarak KALIR).
 * Ne yapmaz? deliverable/faz/owner gibi alanlara dokunmaz; yalnız dependsOn/related yazar.
 *   Deterministiktir (sıralı gezinme) — her çalıştırmada aynı sonucu verir.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NODES = path.join(ROOT, "src", "data", "generated", "nodes");

const LEVEL_RANK = { app: 0, module: 1, archetype: 2, stone: 3, molecule: 4, element: 5, atom: 6 };

const files = fs.readdirSync(NODES).filter((f) => f.endsWith(".json"));
const byId = new Map();
const fileOf = new Map();
for (const f of files) {
  const n = JSON.parse(fs.readFileSync(path.join(NODES, f), "utf8"));
  byId.set(n.id, n);
  fileOf.set(n.id, f);
}

// DFS gezinme sırası: önce üst-seviye (app), sonra id (kararlı/deterministik).
const order = [...byId.values()].sort(
  (a, b) =>
    (LEVEL_RANK[a.level] ?? 9) - (LEVEL_RANK[b.level] ?? 9) || a.id.localeCompare(b.id, "en"),
);

const color = new Map(); // 0 beyaz, 1 gri, 2 siyah
const backEdges = []; // [from, to]
function dfs(id, stack) {
  color.set(id, 1);
  stack.push(id);
  const deps = [...(byId.get(id)?.dependsOn ?? [])].sort((a, b) => a.localeCompare(b, "en"));
  for (const dep of deps) {
    if (!byId.has(dep)) continue;
    const c = color.get(dep) ?? 0;
    if (c === 1)
      backEdges.push([id, dep]); // geri kenar = döngü
    else if (c === 0) dfs(dep, stack);
  }
  stack.pop();
  color.set(id, 2);
}
for (const n of order) if ((color.get(n.id) ?? 0) === 0) dfs(n.id, []);

// Back-edge'leri dependsOn'dan çıkar, related'a taşı (dedup).
const changed = new Set();
for (const [from, to] of backEdges) {
  const n = byId.get(from);
  if (!n) continue;
  const before = n.dependsOn.length;
  n.dependsOn = n.dependsOn.filter((x) => x !== to);
  if (n.dependsOn.length !== before) {
    n.related = [...new Set([...(n.related ?? []), to])].filter((x) => x !== from);
    changed.add(from);
  }
}

for (const id of changed) {
  fs.writeFileSync(path.join(NODES, fileOf.get(id)), `${JSON.stringify(byId.get(id), null, 2)}\n`);
}
console.log(
  `[fix-dep-cycles] back-edge: ${backEdges.length} · değişen düğüm: ${changed.size} · çıkarılan dependsOn related'a taşındı (DAG sağlandı).`,
);
