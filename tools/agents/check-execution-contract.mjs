#!/usr/bin/env node
/**
 * check-execution-contract — execution-contract katmani yapi butunlugu kapisi.
 * P0 elestiri yanitindaki 7 yonergenin mevcut oldugunu ve storage-canonical
 * hukmunun ADR-A5 ile kilitli oldugunu dogrular.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const fail = [];

const docs = [
  "docs/kernel-execution-contract-matrix.md",
  "docs/execution-context-envelope-directive.md",
  "docs/archetype-storage-canonical-directive.md",
  "docs/event-replay-projection-contract.md",
  "docs/privacy-retention-decision-matrix.md",
  "docs/dod-evidence-schema-directive.md",
  "docs/deploy-separation-runbooks.md",
];
for (const d of docs) {
  if (!fs.existsSync(path.join(ROOT, d))) fail.push(`Yonerge eksik: ${d}`);
}

const storage = path.join(ROOT, "docs/archetype-storage-canonical-directive.md");
if (fs.existsSync(storage)) {
  const text = fs.readFileSync(storage, "utf8");
  if (!text.includes("ADR-A5"))
    fail.push("archetype-storage-canonical ADR-A5 kilidi isaretli degil");
}

console.log(`check-execution-contract — ${docs.length} yonerge + ADR-A5 storage kilidi`);
if (fail.length) {
  console.log(`SONUC: KIRMIZI — ${fail.length} ihlal\n  ${fail.join("\n  ")}`);
  process.exit(1);
}
console.log("SONUÇ: YEŞİL ✓ (execution-contract katmani eksiksiz)");
process.exit(0);
