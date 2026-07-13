#!/usr/bin/env node
/**
 * check-event-semantics — OLAY ANLAMBİLİMİ KAPISI (TASLAK — CI'a bağlı DEĞİL).
 *
 * Bu nedir? docs/event-replay-projection-contract.md §16'nın "CI'da çalışıyor" diye tanımladığı
 *   ama HENÜZ YAZILMAMIŞ kapının iskeleti. (event-replay-projection-contract.md şu an bu kapıyı
 *   şimdiki zamanla var gibi anlatıyor; bu bir yanlış-güven kaynağıdır — bkz. gap-2026-07-02-00-index §6.)
 * Ne DOĞRULAR (hedef; ihlalde exit 1):
 *   1. Zarf: event-semantics sözleşme referenti (yönerge dosyası) MEVCUT olmalı.
 *   2. Olay-tüketici düğümü (tag: event|projection|consumer|outbox-consumer) şu beyanları taşımalı:
 *      at-least-once teslimat + idempotent consumer + aggregate_version guard + DLQ (dead-letter).
 *   3. "exactly-once" iddiası YASAK (anti-pattern) — metinde geçerse ihlal.
 * Ne YAPMAZ? Gerçek consumer kodunu, gerçek DLQ kuyruğunu, gerçek replay'i doğrulamaz — o platform
 *   repo'sunun işi. Bu kapı plan/sözleşme katmanında BEYAN-tabanlıdır.
 *
 * Aktör akışı: rapor üretir; kod değiştirmez, PR açmaz. İnsan onayıyla tools/agents/'a taşınıp
 *   deploy.yml'e bağlanır (bkz. drafts/README.md).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const NODES = path.join(ROOT, "src", "data", "generated", "nodes");
const DIRECTIVE = path.join(ROOT, "docs", "event-replay-projection-contract.md");

const SCOPE_TAGS = new Set([
  "event",
  "projection",
  "consumer",
  "outbox-consumer",
  "event-consumer",
]);
const REQUIRED_SIGNALS = [
  "idempoten",
  "at-least-once",
  "dead-letter",
  "dlq",
  "aggregate_version",
  "replay",
];
const BANNED = ["exactly-once", "exactly once"];

const fails = [];
if (!fs.existsSync(DIRECTIVE))
  fails.push("zarf-yok: docs/event-replay-projection-contract.md bulunamadı");

const nodes = fs.existsSync(NODES)
  ? fs
      .readdirSync(NODES)
      .filter((f) => f.endsWith(".json"))
      .map((f) => JSON.parse(fs.readFileSync(path.join(NODES, f), "utf8")))
  : [];

let scoped = 0;
for (const n of nodes) {
  const tags = (n.tags ?? []).map((t) => String(t).toLowerCase());
  const text = JSON.stringify({
    s: n.summary,
    r: n.refs,
    d: n.dimensions,
    del: n.deliverables,
    ac: n.acceptanceCriteria,
  }).toLowerCase();
  // Yasak dil her düğümde denetlenir.
  if (BANNED.some((b) => text.includes(b)))
    fails.push(`exactly-once-iddiasi: ${n.id} — 'exactly-once' anti-pattern`);
  const isScoped =
    tags.some((t) => SCOPE_TAGS.has(t)) || text.includes("projection") || text.includes("outbox");
  if (!isScoped) continue;
  scoped++;
  const hasSignal = REQUIRED_SIGNALS.some((sig) => text.includes(sig));
  if (!hasSignal)
    fails.push(`beyan-yok: ${n.id} — idempotent-consumer/DLQ/replay anlambilimi beyan edilmemiş`);
}

console.log(`[event-semantics] (TASLAK) kapsamlı düğüm: ${scoped} · ihlal: ${fails.length}`);
if (fails.length) {
  console.error(`\nSONUÇ: KIRMIZI ✗ — ${fails.length} ihlal:`);
  for (const f of fails.slice(0, 50)) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(
  "SONUÇ: YEŞİL ✓ — olay-tüketici düğümleri idempotent/DLQ/replay beyanı taşıyor; exactly-once iddiası yok.",
);
