#!/usr/bin/env node
/**
 * check-dimension-semantics (17-boyut sözleşmesi — dimension-contract-17.md).
 * Ne yapar? 17 boyutun DOLU kartlarını must+anyOf sözleşmesine karşı denetler.
 *   - FAIL kademesi (day-2: dataLifecycle/observability/reliability): ihlal = KIRMIZI.
 *   - WARN kademesi (miras 14): ihlal sayılır ve raporlanır, BLOKLAMAZ (ratchet).
 *     Gerekçe: mevcut zengin içerik domain diliyle yazılmış; FAIL'e çevirme kararı
 *     içerik-iyileştirme swarm turuyla birlikte insanındır.
 * Ne yapmaz? Boş/iskelet kartı zorlamaz (lazy migration).
 * Kural kaynağı TEK: tools/lib/dimension-semantics.mjs (vitest aynısını import eder).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SEMANTIC_KEYS,
  SEMANTIC_RULES,
  nodeSemanticFindings,
} from "../lib/dimension-semantics.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const nodesDir = path.join(ROOT, "src", "data", "generated", "nodes");
const files = fs.readdirSync(nodesDir).filter((f) => f.endsWith(".json"));

// WARN-ratchet baseline'ı: deterministik, review edilebilir JSON. Toplam VEYA herhangi
// bir boyutun WARN sayısı baseline'ı AŞARSA kapı KIRMIZI olur (artış yasak); azalma
// serbesttir ve `--write-baseline` ile bilinçli commit'lenerek kilitlenir.
const BASELINE_PATH = path.join(ROOT, "tools", "agents", "semantic-warn-baseline.json");
const WRITE_BASELINE = process.argv.includes("--write-baseline");

const violations = [];
const warnings = [];
const warnByKey = {};
let filledCount = 0;
for (const f of files) {
  const n = JSON.parse(fs.readFileSync(path.join(nodesDir, f), "utf8"));
  for (const key of SEMANTIC_KEYS) {
    const dim = n.dimensions?.[key];
    if (dim && dim.status !== "skeleton" && (dim.items ?? []).length > 0) filledCount++;
  }
  const r = nodeSemanticFindings(n);
  violations.push(...r.violations);
  for (const w of r.warnings) {
    warnings.push(w);
    const key = w.split(".")[1]?.split(":")[0] ?? "?";
    warnByKey[key] = (warnByKey[key] ?? 0) + 1;
  }
}

const failKeys = SEMANTIC_KEYS.filter((k) => SEMANTIC_RULES[k].enforce === "fail");
console.log(
  `Semantik boyut kapısı — ${files.length} düğüm; ${filledCount} dolu kart denetlendi (17 boyut).`,
);
console.log(`FAIL kademesi (${failKeys.join(", ")}): ${violations.length} ihlal.`);
const warnDist = warnings.length ? ` Boyut dağılımı: ${JSON.stringify(warnByKey)}` : "";
console.log(`WARN kademesi (miras 14 — ratchet): ${warnings.length} uyarı.${warnDist}`);

// ---- Ratchet denetimi ----
if (WRITE_BASELINE) {
  const sorted = Object.fromEntries(
    Object.entries(warnByKey).sort(([a], [b]) => a.localeCompare(b)),
  );
  // Borç geçmişi korunur: önceki taban history'e itilir (denetim izi — 3310 başlangıç borcu görünür kalır).
  let history = [];
  if (fs.existsSync(BASELINE_PATH)) {
    const prev = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));
    history = prev.history ?? [];
    if (prev.total !== warnings.length)
      history.push({ date: new Date().toISOString().slice(0, 10), total: prev.total });
  }
  fs.writeFileSync(
    BASELINE_PATH,
    `${JSON.stringify({ _aciklama: "WARN-ratchet baseline'ı — artış kapıyı kırar, azalma bu dosyanın bilinçli güncellenmesiyle kilitlenir (--write-baseline). history: önceki borç tabanları (denetim izi).", total: warnings.length, byKey: sorted, history }, null, 2)}\n`,
  );
  console.log(`Baseline yazıldı: total=${warnings.length} → ${path.relative(ROOT, BASELINE_PATH)}`);
}
const ratchetErrors = [];
if (!fs.existsSync(BASELINE_PATH)) {
  ratchetErrors.push(
    "semantic-warn-baseline.json YOK — `--write-baseline` ile oluşturup commit'le",
  );
} else {
  const base = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));
  if (warnings.length > base.total)
    ratchetErrors.push(`WARN toplamı arttı: ${base.total} → ${warnings.length} (ratchet ihlali)`);
  for (const [key, count] of Object.entries(warnByKey))
    if (count > (base.byKey[key] ?? 0))
      ratchetErrors.push(`WARN[${key}] arttı: ${base.byKey[key] ?? 0} → ${count} (ratchet ihlali)`);
  const improved =
    warnings.length < base.total ||
    Object.entries(base.byKey).some(([k, c]) => (warnByKey[k] ?? 0) < c);
  if (ratchetErrors.length === 0 && improved)
    console.log("Ratchet: WARN azaldı — istersen `--write-baseline` ile yeni tabanı kilitle.");
}

if (violations.length === 0 && ratchetErrors.length === 0) {
  console.log("\nSONUÇ: YEŞİL ✓");
  process.exit(0);
}
console.log(
  `\nSONUÇ: KIRMIZI — ${violations.length} ihlal + ${ratchetErrors.length} ratchet hatası`,
);
for (const m of [...violations, ...ratchetErrors].slice(0, 40)) console.log(`  - ${m}`);
process.exit(1);
