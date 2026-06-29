#!/usr/bin/env node
/**
 * check-dependency-policy (ADR-0027 / dependency-policy standardı — BLOKLAYICI). Tedarik zinciri:
 * bu repo + (varsa) ../projector ../platform package.json'larında YASAK npm paketi bulunmamalı.
 * dependency-policy standardı mevcut olmalı. (Lisans/SBOM derin kontrolü standartta tanımlı,
 * araç entegrasyonu ayrı; bu kapı paket-allowlist çekirdeğini zorlar.)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const v = [];
const fail = (m) => v.push(m);

const BANNED = [
  "next",
  "redux",
  "@reduxjs/toolkit",
  "flowbite",
  "antd",
  "@ant-design/pro-components",
  "@mui/material",
  "@chakra-ui/react",
  "@mantine/core",
  "react-markdown",
  "markdown-it",
  "supabase",
  "@supabase/supabase-js",
];
const isBanned = (dep) => BANNED.some((b) => dep === b || dep.startsWith(`${b}/`));

if (!fs.existsSync(path.join(ROOT, "src", "data", "standards", "dependency-policy.json")))
  fail("dependency-policy.json standardı yok (sözleşme kaynağı eksik)");

const scan = (repoRoot, label) => {
  const pkgPath = path.join(repoRoot, "package.json");
  if (!fs.existsSync(pkgPath)) return false;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const all = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  for (const dep of Object.keys(all))
    if (isBanned(dep)) fail(`${label}: yasak bağımlılık "${dep}"`);
  // file:/git: pinned-olmayan kritik bağımlılık işareti
  for (const [dep, ver] of Object.entries(all))
    if (typeof ver === "string" && /^(file:|git[:+]|http)/.test(ver))
      fail(`${label}: güvensiz sürüm kaynağı "${dep}": "${ver}"`);
  return true;
};
scan(ROOT, "actionplan");
const sib = path.resolve(ROOT, "..");
let cross = 0;
for (const s of ["projector", "platform"]) if (scan(path.join(sib, s), s)) cross++;

console.log(`Bağımlılık politikası — ${BANNED.length} yasak paket; çapraz-repo sibling: ${cross}.`);
if (v.length === 0) {
  console.log("\nSONUÇ: YEŞİL ✓");
  process.exit(0);
}
console.log(`\nSONUÇ: KIRMIZI — ${v.length} ihlal`);
for (const m of v.slice(0, 40)) console.log(`  - ${m}`);
process.exit(1);
