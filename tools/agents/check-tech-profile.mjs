#!/usr/bin/env node
/**
 * check-tech-profile — Frontend tech-profile manifesti (ADR-0026) zorlayıcı (bağımlılıksız, CI-güvenli).
 *
 * Ne doğrular?
 *   1) Manifest iç tutarlılık: her profil headless===true (KİLİT); bannedGlobal zorunlu stillenmiş
 *      kitleri + framework'leri içerir (antd/MUI/Chakra/Mantine/Flowbite/Next/Redux).
 *   2) ÇAPRAZ-REPO bağımlılık: bu repo + (varsa) ../projector ../platform package.json'larında
 *      yasak paket bulunmamalı. (CI'da sibling yoktur → yalnız bu repo; yerelde tam çapraz tarama.)
 *   3) Kaynak (yalnız bu repo): src altındaki .ts/.tsx dosyalarında yasak import + dangerouslySetInnerHTML yok.
 *   4) surface-catalog techProfileRef bütünlüğü: her referans manifest profiline çözülür.
 *
 * Kullanım: node tools/agents/check-tech-profile.mjs   (çıkış 0=yeşil, 1=ihlal)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const v = [];
const fail = (m) => v.push(m);
const readJson = (p, label) => {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    console.error(`[check-tech-profile] ${label} okunamadı: ${e.message}`);
    process.exit(1);
  }
};

const manifest = readJson(path.join(ROOT, "src", "data", "tech-profiles.json"), "tech-profiles");

// --- 1) Manifest iç tutarlılık + headless KİLİT ---
const REQUIRED_BANNED = [
  "next",
  "redux",
  "@reduxjs/toolkit",
  "flowbite",
  "antd",
  "@ant-design/pro-components",
  "@mui/material",
  "@chakra-ui/react",
  "@mantine/core",
];
const bannedGlobal = new Set(manifest.bannedGlobal || []);
for (const b of REQUIRED_BANNED)
  if (!bannedGlobal.has(b)) fail(`manifest bannedGlobal eksik: "${b}"`);
if (!Array.isArray(manifest.profiles) || manifest.profiles.length < 3)
  fail("manifest: en az 3 profil gerekli");
for (const p of manifest.profiles || []) {
  const tag = p.id || "(id-yok)";
  if (p.headless !== true) fail(`profil ${tag}: headless KİLİT ihlali (headless !== true)`);
  if (!p.id || !p.surface || !p.primitive) fail(`profil ${tag}: zorunlu alan eksik`);
}
const profileIds = new Set((manifest.profiles || []).map((p) => p.id));

// yasak eşleştirici: paket adı tam ya da alt-yol (scope/...) eşleşir.
const banList = [...bannedGlobal];
const isBanned = (spec) => banList.some((b) => spec === b || spec.startsWith(`${b}/`));

// --- 2) package.json bağımlılık taraması (bu repo + siblingler) ---
const scanDeps = (repoRoot, label) => {
  const pkgPath = path.join(repoRoot, "package.json");
  if (!fs.existsSync(pkgPath)) return false;
  const pkg = readJson(pkgPath, `${label} package.json`);
  const all = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  for (const dep of Object.keys(all))
    if (isBanned(dep)) fail(`${label}: yasak bağımlılık "${dep}" (package.json)`);
  return true;
};
scanDeps(ROOT, "actionplan");
const siblingsRoot = path.resolve(ROOT, "..");
let crossScanned = 0;
for (const sib of ["projector", "platform"]) {
  if (scanDeps(path.join(siblingsRoot, sib), sib)) crossScanned++;
}

// --- 3) kaynak import + dangerouslySetInnerHTML taraması (yalnız bu repo) ---
const tsFiles = [];
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const fp = path.join(d, e.name);
    if (e.isDirectory()) {
      if (e.name === "data" || e.name === "node_modules") continue;
      walk(fp);
    } else if (/\.(ts|tsx)$/.test(e.name)) tsFiles.push(fp);
  }
};
walk(path.join(ROOT, "src"));
const importRe = /\bfrom\s+["']([^"']+)["']/g;
const dangerRe = /dangerouslySetInnerHTML\s*[=:]/;
for (const fp of tsFiles) {
  const code = fs.readFileSync(fp, "utf8");
  for (const m of code.matchAll(importRe))
    if (isBanned(m[1])) fail(`actionplan: yasak import "${m[1]}" (${path.relative(ROOT, fp)})`);
  if (dangerRe.test(code))
    fail(`actionplan: dangerouslySetInnerHTML yasak (${path.relative(ROOT, fp)})`);
}

// --- 4) surface techProfileRef bütünlüğü ---
const catPath = path.join(ROOT, "src", "data", "surface", "surface-catalog.json");
if (fs.existsSync(catPath)) {
  for (const s of readJson(catPath, "surface-catalog"))
    if (s.techProfileRef && !profileIds.has(s.techProfileRef))
      fail(`surface ${s.id}: techProfileRef "${s.techProfileRef}" manifestte yok`);
}

console.log(
  `Tech-profile kapısı — ${manifest.profiles.length} profil (headless KİLİT), ${bannedGlobal.size} global yasak, ${tsFiles.length} kaynak dosya tarandı; çapraz-repo sibling: ${crossScanned}`,
);
if (v.length === 0) {
  console.log("\nSONUÇ: YEŞİL ✓");
  process.exit(0);
}
console.log(`\nSONUÇ: KIRMIZI — ${v.length} ihlal`);
for (const m of v.slice(0, 40)) console.log(`  - ${m}`);
process.exit(1);
