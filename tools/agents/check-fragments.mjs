#!/usr/bin/env node
/**
 * check-fragments — Fragment (mini-archetype) kademesi yapi butunlugu kapisi.
 * FragmentSchema'nin canonical/storage/crossFieldRules zenginlestirmesini ve
 * yonergenin mevcut oldugunu dogrular. Kaynak: docs/fragments-directive.md.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const fail = [];

const schema = fs.readFileSync(path.join(ROOT, "src/schemas/archetype.ts"), "utf8");
for (const f of ["canonical", "storage", "crossFieldRules"]) {
  if (!schema.includes(f)) fail.push(`FragmentSchema eksik alan: ${f}`);
}

if (!fs.existsSync(path.join(ROOT, "docs/fragments-directive.md")))
  fail.push("Yonerge eksik: docs/fragments-directive.md");

console.log(
  "check-fragments — FragmentSchema alanlari (canonical/storage/crossFieldRules) + yonerge",
);
if (fail.length) {
  console.log(`SONUC: KIRMIZI — ${fail.length} ihlal\n  ${fail.join("\n  ")}`);
  process.exit(1);
}
console.log("SONUÇ: YEŞİL ✓ (Fragment kademesi tanimli)");
process.exit(0);
