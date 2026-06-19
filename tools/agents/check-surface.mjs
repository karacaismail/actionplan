#!/usr/bin/env node
/**
 * check-surface — Surface/Workflow Sözleşme Kataloğu (Küme D) doğrulayıcı (bağımlılıksız, CI-güvenli).
 * src/schemas/surface.ts kurallarının node karşılığı + Workflow→ECA paketi (Küme C) çapraz-referans bütünlüğü.
 * Kullanım: node tools/agents/check-surface.mjs   (çıkış 0=yeşil, 1=ihlal)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SURFACES = path.join(ROOT, "src", "data", "surface", "surface-catalog.json");
const WORKFLOWS = path.join(ROOT, "src", "data", "surface", "workflow-catalog.json");
const RULESETS = path.join(ROOT, "src", "data", "eca", "ruleset-catalog.json");

const SURFACE_TYPES = ["list", "detail", "form", "board", "dashboard", "wizard", "report", "timeline"];
const LAYOUTS = ["table", "cards", "split", "grid", "stepper", "chart"];
const MOBILE = ["stack", "scroll", "hidden"];

const v = [];
const fail = (m) => v.push(m);
const read = (p, label) => {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); }
  catch (e) { console.error(`[check-surface] ${label} okunamadı: ${e.message}`); process.exit(1); }
};

const surfaces = read(SURFACES, "surface-catalog");
const workflows = read(WORKFLOWS, "workflow-catalog");
const rulesets = read(RULESETS, "ruleset-catalog");
const rulesetIds = new Set(rulesets.map((r) => r.id));

// --- Surfaces ---
const sIds = new Set();
for (const s of surfaces) {
  const tag = s.id || "(id-yok)";
  if (!s.id) fail(`surface ${tag}: id yok`);
  if (s.id && sIds.has(s.id)) fail(`surface ${tag}: tekrarlı id`);
  sIds.add(s.id);
  if (!s.name) fail(`surface ${tag}: name yok`);
  if (!s.description) fail(`surface ${tag}: description yok`);
  if (!SURFACE_TYPES.includes(s.type)) fail(`surface ${tag}: geçersiz type "${s.type}"`);
  if (!LAYOUTS.includes(s.layout)) fail(`surface ${tag}: geçersiz layout "${s.layout}"`);
  if (s.responsive && !MOBILE.includes(s.responsive.mobile)) fail(`surface ${tag}: geçersiz responsive.mobile "${s.responsive.mobile}"`);
  if (!s.a11y || !s.a11y.wcag) fail(`surface ${tag}: a11y.wcag yok`);
}

// --- Workflows ---
const wIds = new Set();
for (const w of workflows) {
  const tag = w.id || "(id-yok)";
  if (!w.id) fail(`workflow ${tag}: id yok`);
  if (w.id && wIds.has(w.id)) fail(`workflow ${tag}: tekrarlı id`);
  wIds.add(w.id);
  if (!w.name) fail(`workflow ${tag}: name yok`);
  if (!Array.isArray(w.states) || w.states.length < 2) fail(`workflow ${tag}: en az 2 state gerekli`);
  const states = new Set(w.states || []);
  if (!states.has(w.initial)) fail(`workflow ${tag}: initial "${w.initial}" states içinde değil`);
  for (const t of w.terminalStates || []) if (!states.has(t)) fail(`workflow ${tag}: terminal "${t}" states içinde değil`);
  if (!Array.isArray(w.transitions) || w.transitions.length < 1) fail(`workflow ${tag}: en az 1 transition gerekli`);
  for (const tr of w.transitions || []) {
    if (!states.has(tr.from)) fail(`workflow ${tag}: transition.from "${tr.from}" states içinde değil`);
    if (!states.has(tr.to)) fail(`workflow ${tag}: transition.to "${tr.to}" states içinde değil`);
    if (!tr.on) fail(`workflow ${tag}: transition.on (olay) yok (${tr.from}→${tr.to})`);
  }
  for (const a of w.approvals || []) if (!states.has(a.state)) fail(`workflow ${tag}: approval.state "${a.state}" states içinde değil`);
  // ÇAPRAZ-REFERANS: rulesetRefs gerçek ECA paketlerini (Küme C) işaret etmeli.
  for (const ref of w.rulesetRefs || []) if (!rulesetIds.has(ref)) fail(`workflow ${tag}: rulesetRef "${ref}" ruleset-catalog'da yok`);
}

console.log(`Surface/Workflow kataloğu — ${surfaces.length} surface, ${workflows.length} workflow (ECA paket referansı: ${rulesetIds.size} paket)`);
if (v.length === 0) {
  console.log("\nSONUÇ: YEŞİL ✓");
  process.exit(0);
}
console.log(`\nSONUÇ: KIRMIZI — ${v.length} ihlal`);
for (const m of v.slice(0, 30)) console.log(`  - ${m}`);
process.exit(1);
