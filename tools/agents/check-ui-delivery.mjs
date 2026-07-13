#!/usr/bin/env node
/**
 * check-ui-delivery (BLOKLAYICI — Storybook + Master Component entegrasyonu, gate v3).
 * UI etkisi içerik sinyallerinden makinece sınıflandırılır (tools/lib/ui-impact.mjs);
 * adaylık uiArtifactRole üzerinden daraltılır (SB-ROOT-3): yalnız produces-ui /
 * changes-ui-contract düğümleri uiDelivery sözleşmesine zorlanır. Kararsız corpus ve
 * legacy warning'li baseline PASS'e aklanamaz — MIGRATION_INCOMPLETE raporlanır (exit 0).
 * Ratchet (R1 + SB-ROOT-4): baseline'daki legacy ihlaller warning kalır; baseline dışı
 * ihlal kapıyı kırar; origin kilidi (originChecksum) baseline'a sonradan id eklemeyi kırar.
 * Kaynak: docs/storybook-master-component-integration-directive.md §12/§13 +
 * docs/storybook-root-integration-gap-report.md §8/§9.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateUiDeliveryGate, verifyBaselineIntegrity } from "../lib/ui-impact.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const nodesDir = path.join(ROOT, "src", "data", "generated", "nodes");
const baselinePath = path.join(ROOT, "tools", "agents", "ui-delivery-baseline.json");
const storybookDir = path.join(ROOT, "src", "data", "storybook");

const files = fs.readdirSync(nodesDir).filter((f) => f.endsWith(".json"));
const nodes = files.map((f) => JSON.parse(fs.readFileSync(path.join(nodesDir, f), "utf8")));
const baseline = fs.existsSync(baselinePath)
  ? JSON.parse(fs.readFileSync(baselinePath, "utf8"))
  : { allowedWarnings: [] };

// ── Ratchet bütünlük kilidi (SB-ROOT-4): origin dışına genişletilmiş baseline kapıyı kırar.
const kilit = verifyBaselineIntegrity(baseline);
if (!kilit.ok) {
  if (!Object.hasOwn(baseline, "originChecksum")) {
    // Geçiş dönemi: eski biçim baseline'da origin kilidi bekleniyor — ana oturum kilidi basacak.
    console.log(
      "UYARI: origin kilidi bekleniyor — baseline eski biçimde (originChecksum alanı yok); bütünlük denetimi geçiş döneminde bloklamaz.",
    );
  } else {
    console.log("SONUÇ: KIRMIZI — ratchet bütünlük kilidi ihlali:");
    for (const p of kilit.problems) console.log(`  - ${p}`);
    process.exit(1);
  }
}

// ── Registry yükleme (SB-ROOT-5): rol kararları + master component kimlik seti.
function registryRecords(name) {
  const p = path.join(storybookDir, name);
  if (!fs.existsSync(p)) return [];
  const parsed = JSON.parse(fs.readFileSync(p, "utf8"));
  return Array.isArray(parsed?.records) ? parsed.records : [];
}
const masterComponents = new Set(
  registryRecords("master-components.json")
    .map((r) => r?.id)
    .filter((id) => typeof id === "string" && id !== ""),
);
const roleRegistry = {};
for (const r of registryRecords("ui-artifact-roles.json")) {
  if (typeof r?.nodeId === "string" && typeof r?.role === "string") roleRegistry[r.nodeId] = r.role;
}

const r = evaluateUiDeliveryGate(nodes, baseline, { roleRegistry, masterComponents });

console.log(
  `UI delivery kapısı — ${files.length} düğüm; ${r.candidates} UI-üretim adayı; baseline: ${
    (baseline.allowedWarnings ?? []).length
  } legacy kaydı; rol registry: ${Object.keys(roleRegistry).length} kayıt; master registry: ${
    masterComponents.size
  } kayıt.`,
);

if (r.warnings.length > 0) {
  console.log(`\nLegacy warning (${r.warnings.length}) — ratchet R4'te sıfırlanacak:`);
  for (const w of r.warnings.slice(0, 20)) console.log(`  ~ ${w}`);
}

// Governance sinyalleri (SB-GOV §11): violation/warning mesajlarından türetilen makine-okunur özet.
if (r.signals.length > 0) console.log(`\nSinyaller: ${r.signals.join(", ")}`);

if (r.result === "NO_CANDIDATES") {
  console.log("\nSONUÇ: NO_CANDIDATES — UI/Master Component kapsamına giren düğüm yok.");
  process.exit(0);
}
if (r.result === "MIGRATION_INCOMPLETE") {
  // Bilinçli olarak yeşil İLAN EDİLMEZ: kararsız corpus / legacy warning migration borcudur.
  console.log(
    `\nSONUÇ: MIGRATION_INCOMPLETE — karar: ${r.migration.decided}/${files.length}, legacy warning: ${r.warnings.length}`,
  );
  process.exit(0);
}
if (r.result === "PASS") {
  console.log("\nSONUÇ: YEŞİL ✓ (PASS)");
  process.exit(0);
}
if (r.result === "REVIEW_REQUIRED") {
  console.log(
    `\nSONUÇ: REVIEW_REQUIRED — insan kabulü bekleyen düğümler: ${r.reviewPending.join(", ")}`,
  );
  // İnsan onayı bekleyen iş merge'i bloklar; onay sonrası reviewStatus=approved ile yeşile döner.
  process.exit(1);
}

console.log(`\nSONUÇ: KIRMIZI (FAIL) — ${r.violations.length} ihlal`);
for (const m of r.violations.slice(0, 40)) console.log(`  - ${m}`);
process.exit(1);
