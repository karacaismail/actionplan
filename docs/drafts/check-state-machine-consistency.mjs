#!/usr/bin/env node
/**
 * check-state-machine-consistency — SEMANTİK KAYMA KAPISI (TASLAK — CI'a bağlı DEĞİL).
 *
 * Bu nedir? Bir düğümün üç durum alanı birbiriyle çelişmemelidir:
 *   - status (backlog/todo/in-progress/blocked/review/done)
 *   - phase (requirements/test-plan/db-schema/development/test-qa/verification/release-maintenance)
 *   - traceability.implementationStatus (not-started/scaffolded/in-progress/implemented/verified)
 * Ne DOĞRULAR (ihlalde exit 1):
 *   1. traceability.implementationStatus ∈ {scaffolded,in-progress,implemented,verified} iken
 *      status=backlog VEYA phase=requirements ise → "kayma" (kod ilerledi denmiş ama görev geride).
 *   2. status=done iken implementationStatus ∈ {not-started,scaffolded} ise → tersi kayma.
 * Ne YAPMAZ? Kanıtın (evidence) doğruluğunu değerlendirmez (o check-execution-readiness işi);
 *   gerçek platform kodunu doğrulamaz (o repo ayrı). Yalnız üç beyan alanı arasındaki tutarlılığı sınar.
 *
 * Aktör akışı: bu kapı YEŞİL/KIRMIZI raporlar; kodu değiştirmez, PR açmaz. İnsan çelişkiyi çözer.
 * Doğrulandı 2026-07-02: bugün 7 düğüm bu kuralı ihlal ediyor (tek CRM pilot zinciri).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const NODES = path.join(ROOT, "src", "data", "generated", "nodes");

const IMPL_PROGRESSED = new Set(["scaffolded", "in-progress", "implemented", "verified"]);
const IMPL_NOTYET = new Set(["not-started", "scaffolded"]);

if (!fs.existsSync(NODES)) {
  console.error(`[state-machine] düğüm klasörü yok: ${NODES}`);
  process.exit(2);
}

const nodes = fs
  .readdirSync(NODES)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(fs.readFileSync(path.join(NODES, f), "utf8")));

const fails = [];
for (const n of nodes) {
  const impl = n.traceability?.implementationStatus;
  if (!impl) continue;
  // Kural 1: kod ilerledi denmiş ama görev hâlâ backlog/requirements.
  if (IMPL_PROGRESSED.has(impl) && (n.status === "backlog" || n.phase === "requirements")) {
    fails.push(
      `kayma-ileri: ${n.id} — implementationStatus=${impl} ama status=${n.status}/phase=${n.phase}`,
    );
  }
  // Kural 2: görev done ama kod başlamamış.
  if (n.status === "done" && IMPL_NOTYET.has(impl)) {
    fails.push(`kayma-geri: ${n.id} — status=done ama implementationStatus=${impl}`);
  }
}

console.log(`[state-machine] traceability taşıyan düğüm denetlendi · ihlal: ${fails.length}`);
if (fails.length) {
  console.error(`\nSONUÇ: KIRMIZI ✗ — ${fails.length} semantik kayma:`);
  for (const f of fails.slice(0, 50)) console.error(`  - ${f}`);
  process.exit(1);
}
console.log("SONUÇ: YEŞİL ✓ — status/phase/implementationStatus tutarlı.");
