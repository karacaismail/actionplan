#!/usr/bin/env node
/**
 * apply-tenancy-privacy-refs (gap-2026-07-02-06 tur 3) — riskli düğümlere
 * standardRefs.tenancyRef / privacyRef set eder (boş kanca bırakma).
 *
 * Ne yapar? Kernel/platform + tenant/auth/identity izli düğümlere tenancyRef="tenancy";
 * PII/KVKK/customer/hr/finance izli düğümlere privacyRef="privacy" yazar.
 * Ne yapmaz? DOLU ref'i EZMEZ (insan seçimi korunur); başka alana dokunmaz.
 * Risk desenleri check-standards-coverage'daki WARN denetimiyle AYNI tutulmalıdır.
 *
 * Kullanım: --dry-run (varsayılan) | --apply
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const NODES = path.join(ROOT, "src", "data", "generated", "nodes");
const APPLY = process.argv.includes("--apply");

// Aynı desenler check-standards-coverage.mjs WARN bölümünde — değişiklik iki yerde yapılmalı.
export const TENANCY_RISK =
  /tenant|tenancy|multi.?tenant|\brls\b|izolasyon|\biam\b|\bsso\b|\boidc\b|\bmfa\b|authz|auth\b|identity|kimlik|yetki/i;
export const PRIVACY_RISK =
  /kvkk|gdpr|\bpii\b|kişisel veri|privacy|consent|rıza|dsar|müşteri|customer|payroll|bordro|\bhr\b|personel|üye|party|contact|iletişim/i;
const TENANCY_CLUSTERS = new Set(["kernel", "platform-horizontal"]);
const PRIVACY_CLUSTERS = new Set(["customer-revenue", "hr", "finance"]);

const hay = (n) => [n.id, n.title, n.summary ?? "", ...(n.tags ?? [])].join(" ");

const files = fs.readdirSync(NODES).filter((f) => f.endsWith(".json"));
let tenancySet = 0;
let privacySet = 0;
let kept = 0;
const sample = { tenancy: [], privacy: [] };
for (const f of files) {
  const p = path.join(NODES, f);
  const n = JSON.parse(fs.readFileSync(p, "utf8"));
  const text = hay(n);
  const cluster = n.source?.cluster ?? "";
  const needsTenancy = TENANCY_CLUSTERS.has(cluster) || TENANCY_RISK.test(text);
  const needsPrivacy = PRIVACY_CLUSTERS.has(cluster) || PRIVACY_RISK.test(text);
  if (!needsTenancy && !needsPrivacy) continue;
  n.standardRefs = n.standardRefs ?? {};
  let changed = false;
  if (needsTenancy && !n.standardRefs.tenancyRef) {
    n.standardRefs.tenancyRef = "tenancy";
    tenancySet++;
    if (sample.tenancy.length < 8) sample.tenancy.push(n.id);
    changed = true;
  }
  if (needsPrivacy && !n.standardRefs.privacyRef) {
    n.standardRefs.privacyRef = "privacy";
    privacySet++;
    if (sample.privacy.length < 8) sample.privacy.push(n.id);
    changed = true;
  }
  if (!changed) {
    kept++;
    continue;
  }
  if (APPLY) fs.writeFileSync(p, `${JSON.stringify(n, null, 2)}\n`);
}

console.log(`tenancy/privacy ref — mod: ${APPLY ? "APPLY" : "DRY-RUN"}`);
console.log(`  tenancyRef set: ${tenancySet}  → örnek: ${sample.tenancy.join(", ")}`);
console.log(`  privacyRef set: ${privacySet}  → örnek: ${sample.privacy.join(", ")}`);
console.log(`  zaten dolu (korundu): ${kept}`);
if (APPLY) console.log("Şimdi çalıştır: npm run gen:reindex");
console.log("SONUÇ: YEŞİL ✓");
