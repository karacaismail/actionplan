#!/usr/bin/env node
/**
 * check-legacy-seed-quarantine — Q3 tam fail-closed karantina kapısı (STATİK).
 *
 * TÜM legacy seed mutator ailesini (seed-docs-lib helper + 8 shared tüketici + 11 Q2 wholesale
 * arşiv stub + 9 Q3 doğrudan yazıcı arşiv stub + agents:seed public rotası) fail-closed olarak
 * DOĞRULAR. Kapı hiçbir seed'i çalıştırmaz/import etmez — yalnız kaynak okur. Repo-geneli seed
 * korpusu keşfedilir (tools/agents/seed-*.mjs + tools/seed-*.mjs); beklenen 29 dosya keşfedilir =
 * 8 shared-mutator tüketici + 11 Q2 arşiv stub + 9 Q3 arşiv stub + 1 helper (28 entrypoint +
 * helper). Q3 ile pending=0: geriye bekleyen doğrudan yazıcı KALMAZ; yeni/keşfedilmemiş bir seed
 * ya da değişen set kapıyı kırar.
 *
 * Kırılma nedenleri (invariant): yeni seed dosyası, helper writer reintroduction,
 * güvensiz agents:seed rotası, eksik guarded path, blanket bypass token, Q3 arşiv stub'ında
 * geri gelen writer/data/fs izi, docs/next-30-days-plan.md'de dönen stale "pending doğrudan
 * yazıcı" iddiası veya eksik final markör (29 dosya · 28 entrypoint + 1 helper · fail-closed ·
 * pending=0).
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
// Q2 wholesale arşive alınan doğrudan yazıcılar (11) — her biri TEK koşulsuz guard'ı import eden
// minimal fail-closed stub; writer logic/data/fs izi taşımaz. Import/doğrudan koşum exit 2 verir.
const GUARDED_Q2 = [
  "tools/agents/seed-aday.mjs",
  "tools/agents/seed-core-operations.mjs",
  "tools/agents/seed-crosscut.mjs",
  "tools/agents/seed-frontend.mjs",
  "tools/agents/seed-kernel.mjs",
  "tools/agents/seed-kernel-deep.mjs",
  "tools/agents/seed-layer0.mjs",
  "tools/agents/seed-layer1.mjs",
  "tools/agents/seed-platform-horizontal.mjs",
  "tools/agents/seed-scale.mjs",
  "tools/seed-pilot-traceability.mjs",
];
// Q3 wholesale arşive alınan son doğrudan yazıcılar (9) — her biri TEK koşulsuz guard'ı import eden
// minimal fail-closed stub; writer logic/data/fs izi taşımaz. Import/doğrudan koşum exit 2 verir.
const GUARDED_Q3 = [
  "tools/agents/seed-backend.mjs",
  "tools/agents/seed-content-collaboration.mjs",
  "tools/agents/seed-customer-revenue.mjs",
  "tools/agents/seed-data-intelligence.mjs",
  "tools/agents/seed-dx-atomic.mjs",
  "tools/agents/seed-finance.mjs",
  "tools/agents/seed-hr.mjs",
  "tools/agents/seed-supply-chain.mjs",
  "tools/agents/seed-vertical.mjs",
];
// Q3 sonrası pending set BOŞ: bekleyen doğrudan yazıcı kalmaz (pending=0). Yeni seed kapıyı kırar.
const PENDING_DIRECT_WRITERS = [];
const EXPECTED_CORPUS = [HELPER, ...SHARED_MUTATOR_CONSUMERS, ...GUARDED_Q2, ...GUARDED_Q3].sort();

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
// Q2/Q3 arşiv stub'larında geri gelmesi yasak canonical writer/data/fs izleri.
const ARCHIVE_STUB_WRITER_TOKENS = [
  "writeFileSync",
  "readFileSync",
  "node:fs",
  "NODES",
  "const CONTENT",
  "apply(",
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
if (GUARDED_Q2.length !== 11) errors.push("Q2 guarded arşiv stub sayısı 11 değil");
if (GUARDED_Q3.length !== 9) errors.push("Q3 guarded arşiv stub sayısı 9 değil");
if (PENDING_DIRECT_WRITERS.length !== 0)
  errors.push(
    `pending doğrudan yazıcı seti boş değil (pending=0 olmalı): ${PENDING_DIRECT_WRITERS.length}`,
  );

const expectedSet = new Set(EXPECTED_CORPUS);
const discoveredSet = new Set(discovered);
for (const file of discovered)
  if (!expectedSet.has(file))
    errors.push(`keşfedilen yeni/bilinmeyen seed beklenen korpus dışı: ${file}`);
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

// --- 4b) 11 Q2 wholesale arşiv stub fail-closed ----------------------------------------
// Her Q2 entrypoint TEK koşulsuz guard'ı import eder (agent → ./legacy-seed-quarantine.mjs;
// tools/ → ./agents/legacy-seed-quarantine.mjs) ve hiçbir writer/data/fs izi taşımaz.
for (const file of GUARDED_Q2) {
  const source = read(file);
  const specifier = file.startsWith("tools/agents/")
    ? "./legacy-seed-quarantine.mjs"
    : "./agents/legacy-seed-quarantine.mjs";
  if (!source.includes(`import "${specifier}"`))
    errors.push(`${file}: Q2 arşiv stub tek koşulsuz guard import'unu içermiyor (${specifier})`);
  if (!source.includes("ARCHIVED-LEGACY-MUTATOR"))
    errors.push(`${file}: Q2 arşiv stub markörü eksik (ARCHIVED-LEGACY-MUTATOR)`);
  if (!source.includes("FAIL-CLOSED"))
    errors.push(`${file}: Q2 arşiv stub markörü eksik (FAIL-CLOSED)`);
  for (const forbidden of ARCHIVE_STUB_WRITER_TOKENS)
    if (source.includes(forbidden))
      errors.push(`${file}: Q2 arşiv stub içinde canonical writer izi (${forbidden})`);
  for (const bypass of BYPASS_TOKENS)
    if (source.includes(bypass))
      errors.push(`${file}: Q2 arşiv stub blanket bypass tokenı taşıyor (${bypass})`);
}

// --- 4c) 9 Q3 wholesale arşiv stub fail-closed (Q3 tam quarantine) ---------------------
// Her Q3 entrypoint (hepsi tools/agents/ altında) TEK koşulsuz guard'ı import eder
// (./legacy-seed-quarantine.mjs), ARCHIVED-LEGACY-MUTATOR + FAIL-CLOSED taşır ve hiçbir
// writer/data/fs/bypass izi taşımaz. Bu kapı YEŞİL olana kadar davranış probu çalışmaz.
for (const file of GUARDED_Q3) {
  const source = read(file);
  if (!source.includes('import "./legacy-seed-quarantine.mjs"'))
    errors.push(`${file}: Q3 arşiv stub tek koşulsuz guard import'unu içermiyor`);
  if (!source.includes("ARCHIVED-LEGACY-MUTATOR"))
    errors.push(`${file}: Q3 arşiv stub markörü eksik (ARCHIVED-LEGACY-MUTATOR)`);
  if (!source.includes("FAIL-CLOSED"))
    errors.push(`${file}: Q3 arşiv stub markörü eksik (FAIL-CLOSED)`);
  for (const forbidden of ARCHIVE_STUB_WRITER_TOKENS)
    if (source.includes(forbidden))
      errors.push(`${file}: Q3 arşiv stub içinde canonical writer izi (${forbidden})`);
  for (const bypass of BYPASS_TOKENS)
    if (source.includes(bypass))
      errors.push(`${file}: Q3 arşiv stub blanket bypass tokenı taşıyor (${bypass})`);
}

// --- 4d) Q4 final-state doküman invariantı (docs/next-30-days-plan.md) ------------------
// Q2 ile seed-platform-horizontal arşiv stub'a alındı, Q3 ile pending=0 oldu. Plan artık onu
// "pending doğrudan yazıcı" olarak tanımlayan STALE iddiayı taşıyamaz; kararlı bir final markör
// ile 29 dosya · 28 entrypoint + 1 helper · fail-closed · pending=0 son durumunu bildirmelidir.
// Stale ifade geri gelirse VEYA herhangi bir final markör eksikse kapı fail-closed kırılır.
const PLAN = "docs/next-30-days-plan.md";
const PLAN_STALE_PHRASES = ["pending doğrudan yazıcıdır"];
const PLAN_FINAL_MARKERS = [
  "LEGACY-SEED-QUARANTINE-FINAL",
  "29 dosya",
  "28 entrypoint + 1 helper",
  "fail-closed",
  "pending=0",
];
if (!exists(PLAN)) errors.push(`final plan dokümanı yok: ${PLAN}`);
else {
  const plan = read(PLAN);
  for (const stale of PLAN_STALE_PHRASES)
    if (plan.includes(stale))
      errors.push(`plan stale seed karantina iddiası taşıyor (fail-closed): "${stale}"`);
  for (const marker of PLAN_FINAL_MARKERS)
    if (!plan.includes(marker))
      errors.push(`plan final karantina markörü eksik (fail-closed): "${marker}"`);
}

// --- 5) Public agents:seed rotası + qa scripti -----------------------------------------
const pkg = JSON.parse(read("package.json"));
const agentsSeed = pkg.scripts?.["agents:seed"] ?? "";
if (!agentsSeed.includes("legacy-seed-quarantine.mjs"))
  errors.push(`agents:seed guard rotasına bağlı değil: "${agentsSeed}"`);
if (/seed-kernel/.test(agentsSeed)) errors.push("agents:seed hâlâ seed-kernel'e gidiyor");
for (const file of [...SHARED_MUTATOR_CONSUMERS, ...GUARDED_Q2, ...GUARDED_Q3]) {
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
  `[legacy-seed-quarantine] korpus=${discovered.length} · shared=${SHARED_MUTATOR_CONSUMERS.length} · q2=${GUARDED_Q2.length} · q3=${GUARDED_Q3.length} · pending=${PENDING_DIRECT_WRITERS.length} · ihlal=${errors.length}`,
);
if (errors.length === 0) {
  console.log(
    "SONUÇ: YEŞİL — shared (8) + Q2 (11) + Q3 (9) legacy seed tam fail-closed; 29 dosya keşfedildi; pending=0.",
  );
  process.exit(0);
}
console.log("SONUÇ: KIRMIZI");
for (const error of errors) console.log(`  - ${error}`);
process.exit(1);
