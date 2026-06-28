#!/usr/bin/env node
/**
 * check-ruleset — ECA Ruleset Paket Kataloğu (Küme C) doğrulayıcı (bağımlılıksız, CI-güvenli).
 * src/schemas/ruleset.ts kurallarının node karşılığı (vitest/rollup gerekmez).
 * Kullanım: node tools/agents/check-ruleset.mjs
 * Çıkış: 0 = yeşil, 1 = ihlal (deploy bloklayıcı CI adımı olarak kullanılır).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const CATALOG = path.join(ROOT, "src", "data", "eca", "ruleset-catalog.json");

const LAYERS = ["system", "platform", "tenant"];
const CATEGORIES = [
  "notification",
  "escalation",
  "approval",
  "audit",
  "lifecycle",
  "security-gate",
  "integration",
  "migration",
  "ai-boundary",
];
const PARAM_TYPES = ["number", "string", "boolean", "duration"];
const OPS = ["eq", "neq", "gt", "lt", "gte", "lte", "in", "contains"];

const v = [];
const fail = (m) => v.push(m);

let catalog;
try {
  catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
} catch (e) {
  console.error(`[check-ruleset] katalog okunamadı: ${e.message}`);
  process.exit(1);
}
if (!Array.isArray(catalog)) {
  console.error("[check-ruleset] katalog bir dizi olmalı");
  process.exit(1);
}

const ids = new Set();
const ruleIds = new Set();
for (const p of catalog) {
  const tag = p.id || "(id-yok)";
  if (!p.id) fail(`${tag}: id yok`);
  if (p.id && ids.has(p.id)) fail(`${tag}: tekrarlı paket id`);
  ids.add(p.id);
  if (!p.name) fail(`${tag}: name yok`);
  if (!p.description) fail(`${tag}: description yok`);
  if (!LAYERS.includes(p.layer)) fail(`${tag}: geçersiz layer "${p.layer}"`);
  if (!CATEGORIES.includes(p.category)) fail(`${tag}: geçersiz category "${p.category}"`);
  if (!Array.isArray(p.rules) || p.rules.length < 1) fail(`${tag}: en az 1 rule gerekli`);

  // params
  for (const pr of p.params || []) {
    if (!pr.key) fail(`${tag}: param key yok`);
    if (!PARAM_TYPES.includes(pr.type)) fail(`${tag}.${pr.key}: geçersiz param type "${pr.type}"`);
    // GÜVENLİK: system katmanı kilitli → tenant-düzenlenebilir param olamaz.
    if (p.layer === "system" && pr.tenantEditable === true)
      fail(`${tag}.${pr.key}: system paket tenant-editable param taşıyamaz`);
  }

  // safety
  const s = p.safety || {};
  if (typeof s.mutates !== "boolean") fail(`${tag}: safety.mutates boolean olmalı`);
  if (typeof s.requiresApproval !== "boolean")
    fail(`${tag}: safety.requiresApproval boolean olmalı`);
  if (typeof s.aiCanModify !== "boolean") fail(`${tag}: safety.aiCanModify boolean olmalı`);
  if (!Number.isInteger(s.maxChainDepth) || s.maxChainDepth < 1 || s.maxChainDepth > 6)
    fail(`${tag}: safety.maxChainDepth 1-6 olmalı`);
  // ENTERPRISE KURALI: system-katman paketleri AI tarafından DEĞİŞTİRİLEMEZ olmalı.
  if (p.layer === "system" && s.aiCanModify !== false)
    fail(`${tag}: system paket aiCanModify=false olmalı (AI kilitli katmanı değiştiremez)`);

  // rules
  for (const r of p.rules || []) {
    const rt = `${tag}.${r.id || "(rule-id-yok)"}`;
    if (!r.id) fail(`${rt}: rule id yok`);
    if (r.id && ruleIds.has(r.id)) fail(`${rt}: tekrarlı rule id`);
    ruleIds.add(r.id);
    if (!r.event) fail(`${rt}: event yok`);
    if (!Array.isArray(r.when)) fail(`${rt}: when bir dizi olmalı`);
    for (const c of r.when || []) {
      if (!c.field) fail(`${rt}: koşul field yok`);
      if (!OPS.includes(c.op)) fail(`${rt}: geçersiz koşul op "${c.op}"`);
    }
    if (!r.then || !r.then.type) fail(`${rt}: then.type yok`);
    if (!Number.isInteger(r.maxChainDepth) || r.maxChainDepth < 1 || r.maxChainDepth > 6)
      fail(`${rt}: maxChainDepth 1-6 olmalı (kullanıcı kuralı: maks 6)`);
    if (typeof r.requiresApproval !== "boolean") fail(`${rt}: requiresApproval boolean olmalı`);
  }
}

const byLayer = catalog.reduce((a, p) => {
  a[p.layer] = (a[p.layer] || 0) + 1;
  return a;
}, {});
console.log(
  `ECA ruleset kataloğu — ${catalog.length} paket (system:${byLayer.system || 0} platform:${byLayer.platform || 0} tenant:${byLayer.tenant || 0})`,
);
const ruleCount = catalog.reduce((a, p) => a + (p.rules?.length || 0), 0);
console.log(`  ${ruleCount} kural şablonu`);
if (v.length === 0) {
  console.log("\nSONUÇ: YEŞİL ✓");
  process.exit(0);
}
console.log(`\nSONUÇ: KIRMIZI — ${v.length} ihlal`);
for (const m of v.slice(0, 30)) console.log(`  - ${m}`);
process.exit(1);
