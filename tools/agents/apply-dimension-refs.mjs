#!/usr/bin/env node
/**
 * apply-dimension-refs (dimension-contract-17.md FAZ 6) — dolu boyut kartını
 * tek-kaynak standardına bağlar (ref boş kanca kalmasın).
 *
 * Ne yapar? observability kartı DOLU + observabilityRef BOŞ → "observability";
 *           testing kartı DOLU + testingStandardRef BOŞ → "testing-strategy".
 * Ne yapmaz? DOLU ref'i EZMEZ (insan seçimi korunur); kart içeriğine dokunmaz;
 *           reliability için ref YAZMAZ (rollback/runbook kanıtı içeriktir —
 *           coverage kapısı WARN ile raporlar).
 *
 * Kullanım: --dry-run (varsayılan) | --apply    Sonrasında: npm run gen:reindex
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const NODES = path.join(ROOT, "src", "data", "generated", "nodes");
const APPLY = process.argv.includes("--apply");

const RULES = [
  { dim: "observability", refKey: "observabilityRef", refId: "observability" },
  { dim: "testing", refKey: "testingStandardRef", refId: "testing-strategy" },
];

const filled = (n, k) => {
  const d = n.dimensions?.[k];
  return d && d.status !== "skeleton" && (d.items ?? []).length > 0;
};

const files = fs.readdirSync(NODES).filter((f) => f.endsWith(".json"));
const set = {};
let kept = 0;
for (const f of files) {
  const p = path.join(NODES, f);
  const n = JSON.parse(fs.readFileSync(p, "utf8"));
  let changed = false;
  for (const r of RULES) {
    if (!filled(n, r.dim)) continue;
    n.standardRefs = n.standardRefs ?? {};
    if (n.standardRefs[r.refKey]) {
      kept++;
      continue;
    }
    n.standardRefs[r.refKey] = r.refId;
    set[r.refKey] = (set[r.refKey] ?? 0) + 1;
    changed = true;
  }
  if (changed && APPLY) fs.writeFileSync(p, `${JSON.stringify(n, null, 2)}\n`);
}
console.log(`dimension-refs — mod: ${APPLY ? "APPLY" : "DRY-RUN"}`);
for (const [k, c] of Object.entries(set)) console.log(`  ${k} set: ${c}`);
console.log(`  zaten dolu (korundu): ${kept}`);
if (APPLY) console.log("Şimdi çalıştır: npm run gen:reindex");
console.log("SONUÇ: YEŞİL ✓");
