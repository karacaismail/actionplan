#!/usr/bin/env node
/**
 * check-url-policy (BLOKLAYICI — kanonik URL sözleşmesi koruması, v2).
 * docs/url-policy.md tek kanonik otoritedir (reddiye hükmü: inline url-policy-exempt
 * marker'lı satır). Kapı iki yönlü kilitler:
 * 1) Yasak desen taraması: eski tilde grameri, eski route-identity adı, merkezi
 *    resource-identity tablosu önerisi ve node-id kanonik route önerisi docs katmanına
 *    geri sızamaz. url-policy.md ve node.md DAHİL her .md taranır; bütün-dosya muafiyeti
 *    yoktur. Muafiyet scope'ludur: inline-marker (yalnız marker'lı satır) veya section
 *    (yalnız bildirilen başlığın bölümü), her kayıtta reason zorunlu.
 * 2) Kanonik karar varlığı: zorunlu kararlar granular probe'larla doğrulanır (prefix
 *    ailesi üye-bazlı, bounded-context iki-parçalı, route-üçlüsü ayrı ayrı) ve
 *    url-policy.md'den silinemez/driftleyemez.
 * Kural aynası tools/lib/url-policy-rules.mjs'tedir; vitest eşleniği
 * tests/urlPolicyConsistency.test.ts aynı modülü koşar (ui-impact "tek kural kaynağı"
 * deseni; mutation testleri dahil). Yeni muafiyet bilinçli mimari karar ister.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  EXEMPTIONS,
  FORBIDDEN_PATTERNS,
  REQUIRED_DECISIONS,
  collectMarkdownFiles,
  scanDocsForViolations,
  scanSourceForViolations,
  verifyCanonicalDecisions,
} from "../lib/url-policy-rules.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const DOCS = path.join(ROOT, "docs");
const URL_POLICY = path.join(DOCS, "url-policy.md");
const SRC = path.join(ROOT, "src");

const tumDosyalar = collectMarkdownFiles(DOCS);
const ihlaller = scanDocsForViolations(DOCS);
const kaynakIhlalleri = scanSourceForViolations(SRC);
const kararlar = verifyCanonicalDecisions(URL_POLICY);

const inlineDosyaSayisi = new Set(
  EXEMPTIONS.filter((e) => e.scope.kind === "inline-marker").map((e) => e.file),
).size;
const bolumSayisi = EXEMPTIONS.filter((e) => e.scope.kind === "section").length;
const probeSayisi = REQUIRED_DECISIONS.reduce((toplam, karar) => toplam + karar.probes.length, 0);

console.log(
  `URL policy kapısı — ${tumDosyalar.length} .md + src JSON/TS/TSX tarandı; muafiyet scope'lu: inline-marker: ${inlineDosyaSayisi} dosya, section: ${bolumSayisi} başlık; ${FORBIDDEN_PATTERNS.length} yasak desen, ${REQUIRED_DECISIONS.length} zorunlu karar / ${probeSayisi} probe (${kararlar.missing.length} eksik).`,
);

const v = [];
for (const ihlal of ihlaller)
  v.push(`${ihlal.file}:${ihlal.line} [${ihlal.patternId}] ${ihlal.excerpt}`);
for (const ihlal of kaynakIhlalleri)
  v.push(`src/${ihlal.file}:${ihlal.line} [${ihlal.patternId}] ${ihlal.excerpt}`);
for (const eksik of kararlar.missing)
  v.push(`url-policy.md: zorunlu kanonik karar eksik — ${eksik}`);

if (v.length === 0 && kararlar.ok) {
  console.log("\nSONUÇ: YEŞİL ✓");
  process.exit(0);
}
console.log(`\nSONUÇ: KIRMIZI — ${v.length} ihlal`);
for (const m of v.slice(0, 40)) console.log(`  - ${m}`);
process.exit(1);
