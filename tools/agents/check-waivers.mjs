#!/usr/bin/env node
/**
 * check-waivers (ADR-0027 — BLOKLAYICI). Standarttan bilinçli sapma = gerekçeli + onaylı + süreli.
 * Her waiver: id/scope/reason dolu (şema), approvedBy + date dolu; expires varsa geçerli tarih ve
 * GEÇMİŞTE değil (süresi dolmuş waiver = ihlal). Süresiz/gerekçesiz bypass engellenir.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const v = [];
const fail = (m) => v.push(m);
const today = new Date().toISOString().slice(0, 10);

const nodesDir = path.join(ROOT, "src", "data", "generated", "nodes");
const files = fs.readdirSync(nodesDir).filter((f) => f.endsWith(".json"));
let count = 0;
for (const f of files) {
  const n = JSON.parse(fs.readFileSync(path.join(nodesDir, f), "utf8"));
  for (const w of n.waivers || []) {
    count++;
    const tag = `${n.id}/${w.id || "(id-yok)"}`;
    if (!w.id || !w.scope || !w.reason) fail(`${tag}: id/scope/reason zorunlu`);
    if (!w.approvedBy || !String(w.approvedBy).trim())
      fail(`${tag}: approvedBy (onaylayan) zorunlu`);
    if (!w.date || !String(w.date).trim()) fail(`${tag}: date (tarih) zorunlu`);
    if (w.expires) {
      if (!/^\d{4}-\d{2}-\d{2}/.test(w.expires))
        fail(`${tag}: expires geçerli tarih (YYYY-MM-DD) değil`);
      else if (w.expires < today) fail(`${tag}: waiver süresi dolmuş (expires ${w.expires})`);
    }
  }
}

console.log(`Waiver yaşam döngüsü — ${files.length} düğüm; ${count} waiver denetlendi.`);
if (v.length === 0) {
  console.log("\nSONUÇ: YEŞİL ✓");
  process.exit(0);
}
console.log(`\nSONUÇ: KIRMIZI — ${v.length} ihlal`);
for (const m of v.slice(0, 40)) console.log(`  - ${m}`);
process.exit(1);
