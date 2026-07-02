#!/usr/bin/env node
/**
 * check-secrets — SIR SIZINTISI KAPISI (BLOKLAYICI).
 *
 * Bu nedir? Repoya gömülmüş gerçek sırları (API anahtarı, PAT, özel anahtar) yakalayan kapı.
 *   dependency-policy.json + iac.json "gitleaks" mekanizmasına dayanıyordu ama böyle bir kapı YOKTU
 *   (repo kendi checklist'inde P0 olarak kabul ediyor). Bu kapı o boşluğu kapatır (hafif, bağımsız).
 * Ne DOĞRULAR (ihlalde exit 1): metin dosyalarında gerçek-sır DESENİ. Placeholder/örnek değerler
 *   (ör. "ghp_…" ellipsis) eşleşmez çünkü desenler gerçek uzunluk/biçim ister.
 * Ne YAPMAZ? git geçmişini taramaz (o gerçek gitleaks işi); entropiye bakmaz. Desen-tabanlıdır.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "coverage",
  "playwright-report",
  "test-results",
]);
const SKIP_REL = ["src/data/generated", "public/data"]; // üretilmiş büyük veri
const TEXT_EXT = new Set([".md", ".mjs", ".js", ".ts", ".tsx", ".json", ".yml", ".yaml", ".env"]);

const PATTERNS = [
  { name: "github-pat-classic", re: /ghp_[A-Za-z0-9]{36}/ },
  { name: "github-pat-fine", re: /github_pat_[A-Za-z0-9_]{60,}/ },
  { name: "aws-access-key", re: /AKIA[0-9A-Z]{16}/ },
  { name: "slack-token", re: /xox[baprs]-[A-Za-z0-9-]{10,}/ },
  { name: "private-key", re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/ },
  {
    name: "generic-secret-assign",
    re: /(?:api[_-]?key|secret|password|passwd)["']?\s*[:=]\s*["'][A-Za-z0-9/+_-]{24,}["']/i,
  },
];

const fails = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    const rel = path.relative(ROOT, abs);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      if (SKIP_REL.some((s) => rel === s || rel.startsWith(`${s}/`))) continue;
      walk(abs);
    } else {
      if (!TEXT_EXT.has(path.extname(entry.name))) continue;
      let text;
      try {
        text = fs.readFileSync(abs, "utf8");
      } catch {
        continue;
      }
      for (const p of PATTERNS) {
        const m = text.match(p.re);
        if (m) fails.push(`${rel}: ${p.name} (${m[0].slice(0, 12)}…)`);
      }
    }
  }
}
walk(ROOT);

console.log(`[secrets] tarama tamam · ihlal: ${fails.length}`);
if (fails.length) {
  console.error(`\nSONUÇ: KIRMIZI ✗ — ${fails.length} olası sır:`);
  for (const f of fails.slice(0, 50)) console.error(`  - ${f}`);
  process.exit(1);
}
console.log("SONUÇ: YEŞİL ✓ — gerçek-sır deseni bulunamadı.");
