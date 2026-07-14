#!/usr/bin/env node
/**
 * check-legacy-seed-quarantine — Q1 fail-closed karantina kapısı (STATİK).
 *
 * Paylaşılan legacy seed mutator ailesini (seed-docs-lib helper + 8 tüketici + agents:seed
 * public rotası) fail-closed olarak DOĞRULAR. Kapı hiçbir seed'i çalıştırmaz/import etmez —
 * yalnız kaynak okur. Repo-geneli seed korpusu keşfedilir (tools/agents/seed-*.mjs +
 * tools/seed-*.mjs); beklenen 29 = 8 shared-mutator tüketici + 20 pending doğrudan yazıcı +
 * 1 helper. Kalan 20 doğrudan yazıcı Q2/Q3 için EXACT pending allowlist olarak kilitlidir:
 * yeni/keşfedilmemiş bir seed ya da değişen pending set kapıyı kırar.
 *
 * Kırılma nedenleri (invariant): yeni seed dosyası, helper writer reintroduction,
 * güvensiz agents:seed rotası, eksik guarded path, blanket bypass token.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const exists = (rel) => fs.existsSync(path.join(root, rel));
const errors = [];

// --- Beklenen korpus (explicit invariant) ---------------------------------------------
const GUARD = "tools/agents/legacy-seed-quarantine.mjs";
const HELPER = "tools/agents/seed-docs-lib.mjs";
const SHARED_MUTATOR_CONSUMERS = [
  "tools/agents/seed-build.mjs",
  "tools/agents/seed-edu.mjs",
  "tools/agents/seed-egitim.mjs",
  "tools/agents/seed-genel.mjs",
  "tools/agents/seed-kararlar.mjs",
  "tools/agents/seed-landx.mjs",
  "tools/agents/seed-meta.mjs",
  "tools/agents/seed-sus.mjs",
];
// Q2/Q3 için EXACT pending allowlist (henüz doğrudan yazabilen entrypoint'ler). ASLA spawn edilmez.
const PENDING_DIRECT_WRITERS = [
  "tools/agents/seed-aday.mjs",
  "tools/agents/seed-backend.mjs",
  "tools/agents/seed-content-collaboration.mjs",
  "tools/agents/seed-core-operations.mjs",
  "tools/agents/seed-crosscut.mjs",
  "tools/agents/seed-customer-revenue.mjs",
  "tools/agents/seed-data-intelligence.mjs",
  "tools/agents/seed-dx-atomic.mjs",
  "tools/agents/seed-finance.mjs",
  "tools/agents/seed-frontend.mjs",
  "tools/agents/seed-hr.mjs",
  "tools/agents/seed-kernel.mjs",
  "tools/agents/seed-kernel-deep.mjs",
  "tools/agents/seed-layer0.mjs",
  "tools/agents/seed-layer1.mjs",
  "tools/agents/seed-platform-horizontal.mjs",
  "tools/agents/seed-scale.mjs",
  "tools/agents/seed-supply-chain.mjs",
  "tools/agents/seed-vertical.mjs",
  "tools/seed-pilot-traceability.mjs",
];
const EXPECTED_CORPUS = [HELPER, ...SHARED_MUTATOR_CONSUMERS, ...PENDING_DIRECT_WRITERS].sort();

// Guard/helper içinde bulunması yasak blanket bypass token'ları (env/argv override yok).
const BYPASS_TOKENS = ["ALLOW_LEGACY_SEED", "SEED_APPLY", "process.env", "process.argv", "--force"];
// Helper'da geri gelmesi yasak canonical writer izleri.
const HELPER_WRITER_TOKENS = [
  "writeFileSync",
  "NODES_DIR",
  "node:fs",
  "readFileSync",
  "featureDefs",
];

// --- 1) Repo-geneli seed korpusunu keşfet ---------------------------------------------
const discovered = [];
for (const file of fs.readdirSync(path.join(root, "tools", "agents")))
  if (/^seed-.*\.mjs$/.test(file)) discovered.push(`tools/agents/${file}`);
for (const file of fs.readdirSync(path.join(root, "tools")))
  if (/^seed-.*\.mjs$/.test(file)) discovered.push(`tools/${file}`);
discovered.sort();

if (discovered.length !== 29)
  errors.push(`seed korpusu 29 değil (28 entrypoint + helper): ${discovered.length}`);
if (SHARED_MUTATOR_CONSUMERS.length !== 8) errors.push("shared-mutator tüketici sayısı 8 değil");
if (PENDING_DIRECT_WRITERS.length !== 20) errors.push("pending doğrudan yazıcı sayısı 20 değil");

const expectedSet = new Set(EXPECTED_CORPUS);
const discoveredSet = new Set(discovered);
for (const file of discovered)
  if (!expectedSet.has(file))
    errors.push(`keşfedilen yeni/bilinmeyen seed pending allowlist dışı: ${file}`);
for (const file of EXPECTED_CORPUS)
  if (!discoveredSet.has(file)) errors.push(`beklenen seed korpustan kayıp: ${file}`);

// --- 2) Tek koşulsuz guard --------------------------------------------------------------
if (!exists(GUARD)) errors.push(`guard yok: ${GUARD}`);
else {
  const guard = read(GUARD);
  for (const token of ["ARCHIVED-LEGACY-MUTATOR", "FAIL-CLOSED", "process.exit(2)"])
    if (!guard.includes(token)) errors.push(`guard tokenı eksik (${token})`);
  for (const bypass of BYPASS_TOKENS)
    if (guard.includes(bypass)) errors.push(`guard blanket bypass tokenı taşıyor (${bypass})`);
}

// --- 3) Helper fail-closed + writer reintroduction kilidi ------------------------------
const helper = read(HELPER);
for (const token of ["ARCHIVED-LEGACY-MUTATOR", "FAIL-CLOSED"])
  if (!helper.includes(token)) errors.push(`helper guard tokenı eksik (${token})`);
if (!helper.includes('import "./legacy-seed-quarantine.mjs"'))
  errors.push("helper tek koşulsuz guard import'unu içermiyor");
for (const forbidden of HELPER_WRITER_TOKENS)
  if (helper.includes(forbidden)) errors.push(`helper writer reintroduction izi (${forbidden})`);
for (const bypass of BYPASS_TOKENS)
  if (helper.includes(bypass)) errors.push(`helper blanket bypass tokenı taşıyor (${bypass})`);

// --- 4) 8 shared-mutator tüketici fail-closed ------------------------------------------
// Q0 stub = inline ARCHIVED-LEGACY-MUTATOR; aktif tüketici = fail-closed helper'ı import eder.
for (const file of SHARED_MUTATOR_CONSUMERS) {
  const source = read(file);
  const inlineStub =
    source.includes("ARCHIVED-LEGACY-MUTATOR") && source.includes("process.exit(2)");
  const viaHelper = source.includes('from "./seed-docs-lib.mjs"');
  if (!inlineStub && !viaHelper)
    errors.push(`${file}: fail-closed değil (ne inline stub ne fail-closed helper importu)`);
  if (inlineStub)
    for (const forbidden of ["writeFileSync", "const CONTENT", "apply("])
      if (source.includes(forbidden))
        errors.push(`${file}: inline stub içinde canonical mutator izi (${forbidden})`);
}

// --- 5) Public agents:seed rotası + qa scripti -----------------------------------------
const pkg = JSON.parse(read("package.json"));
const agentsSeed = pkg.scripts?.["agents:seed"] ?? "";
if (!agentsSeed.includes("legacy-seed-quarantine.mjs"))
  errors.push(`agents:seed guard rotasına bağlı değil: "${agentsSeed}"`);
if (/seed-kernel/.test(agentsSeed)) errors.push("agents:seed hâlâ seed-kernel'e gidiyor");
for (const file of [...SHARED_MUTATOR_CONSUMERS, ...PENDING_DIRECT_WRITERS]) {
  const base = file.split("/").pop();
  if (agentsSeed.includes(base))
    errors.push(`agents:seed doğrudan seed entrypoint'ine gidiyor: ${base}`);
}

const qaScript = pkg.scripts?.["qa:legacy-seed-quarantine"] ?? "";
if (!qaScript.includes("check-legacy-seed-quarantine.mjs"))
  errors.push("qa:legacy-seed-quarantine statik kapıyı çağırmıyor");
if (!qaScript.includes("legacySeedQuarantine.test"))
  errors.push("qa:legacy-seed-quarantine davranış testini çağırmıyor");
const gateIdx = qaScript.indexOf("check-legacy-seed-quarantine.mjs");
const behaviorIdx = qaScript.indexOf("legacySeedQuarantine.test");
if (gateIdx >= 0 && behaviorIdx >= 0 && gateIdx > behaviorIdx)
  errors.push("qa:legacy-seed-quarantine statik kapıyı davranış testinden önce çalıştırmıyor");

// --- Sonuç ------------------------------------------------------------------------------
console.log(
  `[legacy-seed-quarantine] korpus=${discovered.length} · shared=${SHARED_MUTATOR_CONSUMERS.length} · pending=${PENDING_DIRECT_WRITERS.length} · ihlal=${errors.length}`,
);
if (errors.length === 0) {
  console.log("SONUÇ: YEŞİL — paylaşılan legacy seed ailesi Q1 fail-closed (pending=20 Q2/Q3).");
  process.exit(0);
}
console.log("SONUÇ: KIRMIZI");
for (const error of errors) console.log(`  - ${error}`);
process.exit(1);
