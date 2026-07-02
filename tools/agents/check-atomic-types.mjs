#!/usr/bin/env node
/**
 * check-atomic-types — atomik tip katmanı yapı bütünlüğü kapısı.
 * FieldTypeSchema'nın Katman A/B/C atomlarını taşıdığını, yönerge dokümanlarının
 * mevcut olduğunu ve atomic-types düğümünün yönergeye referans verdiğini doğrular.
 * Kaynak: docs/atomic-types-directive.md, docs/atomik-netlestirme-2026-07-01.md.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const fail = [];

const required = [
  "money",
  "measure",
  "percentage",
  "i18n-text",
  "duration",
  "term",
  "recurrence",
  "range",
  "uuid",
  "timestamptz",
  "decimal",
  "party-ref",
  "asset-ref",
  "clause-ref",
  "external-id",
  "signature-field",
  "fragment",
];
const schema = fs.readFileSync(path.join(ROOT, "src/schemas/archetype.ts"), "utf8");
for (const t of required) {
  if (!schema.includes(`"${t}"`)) fail.push(`FieldTypeSchema eksik atom: ${t}`);
}

const docs = [
  "docs/atomic-types-directive.md",
  "docs/fragments-directive.md",
  "docs/atomik-netlestirme-2026-07-01.md",
  "docs/atomik-tip-katalogu-tam-2026-07-01.md",
];
for (const d of docs) {
  if (!fs.existsSync(path.join(ROOT, d))) fail.push(`Yonerge eksik: ${d}`);
}

const nodePath = path.join(ROOT, "src/data/generated/nodes/atomic-types.json");
if (fs.existsSync(nodePath)) {
  const node = JSON.parse(fs.readFileSync(nodePath, "utf8"));
  const refs = (node.refs || []).join(" ");
  if (!refs.includes("atomic-types-directive"))
    fail.push("atomic-types dugumu yonergeye referans vermiyor (refs)");
} else {
  fail.push("atomic-types dugumu yok");
}

console.log(
  `check-atomic-types — ${required.length} zorunlu atom + ${docs.length} yonerge + dugum referansi`,
);
if (fail.length) {
  console.log(`SONUC: KIRMIZI — ${fail.length} ihlal\n  ${fail.join("\n  ")}`);
  process.exit(1);
}
console.log("SONUÇ: YEŞİL ✓ (atomik tip katmani yapi butunlugu tam)");
process.exit(0);
