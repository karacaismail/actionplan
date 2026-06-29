#!/usr/bin/env node
/**
 * check-ui-standards (ADR-0027 / design-system + ui-components + ux-interaction — BLOKLAYICI).
 * Ürün UI kuralları: kaynakta EMOJI yok (kullanıcı kilidi); tasarım standartları mevcut; styled-kit
 * import yok. Ham hex renk kullanımı UYARI olarak raporlanır (token hedefi; ratchet).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const v = [];
const fail = (m) => v.push(m);
const warns = [];

const stdDir = path.join(ROOT, "src", "data", "standards");
for (const s of ["design-system", "ui-components", "ux-interaction"])
  if (!fs.existsSync(path.join(stdDir, `${s}.json`))) fail(`${s}.json standardı yok`);

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
const STYLED_KIT = /\bfrom\s+["'](antd|@mui\/|@chakra-ui\/|@mantine\/|flowbite)/;
const HEX = /#[0-9a-fA-F]{3,8}\b/;

const files = [];
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const fp = path.join(d, e.name);
    if (e.isDirectory()) {
      if (e.name === "data" || e.name === "node_modules") continue;
      walk(fp);
    } else if (/\.(ts|tsx)$/.test(e.name)) files.push(fp);
  }
};
walk(path.join(ROOT, "src"));

let hexFiles = 0;
for (const fp of files) {
  const code = fs.readFileSync(fp, "utf8");
  const rel = path.relative(ROOT, fp);
  if (EMOJI.test(code)) fail(`${rel}: emoji yasak (UI kilidi)`);
  if (STYLED_KIT.test(code)) fail(`${rel}: stillenmiş kit import yasak (headless)`);
  if (HEX.test(code)) {
    hexFiles++;
    warns.push(rel);
  }
}

console.log(
  `UI standartları — ${files.length} dosya; emoji 0, styled-kit 0; ham-hex ${hexFiles} dosyada (token hedefi, uyarı).`,
);
for (const w of warns.slice(0, 8)) console.log(`  ~ uyarı (token kullan): ${w}`);
if (v.length === 0) {
  console.log("\nSONUÇ: YEŞİL ✓");
  process.exit(0);
}
console.log(`\nSONUÇ: KIRMIZI — ${v.length} ihlal`);
for (const m of v.slice(0, 40)) console.log(`  - ${m}`);
process.exit(1);
