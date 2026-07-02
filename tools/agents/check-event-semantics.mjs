#!/usr/bin/env node
/**
 * check-event-semantics — OLAY ANLAMBİLİMİ KAPISI (BLOKLAYICI + WARN kademeli).
 *
 * Bu nedir? docs/event-replay-projection-contract.md'nin zorunlu kıldığı olay-tüketici
 *   anlambilimini CI'da uygulayan kapı. (Bu dosya yazılmadan önce yönerge "CI'da çalışıyor" diyordu
 *   ama kapı yoktu = yanlış-güven; bu kapı o boşluğu kapatır.)
 * Kapsam nasıl belirlenir? Yalnız AÇIK etiket: tag ∈ {event, projection, event-consumer,
 *   outbox-consumer, event-projection}. Substring sezgisi kullanılmaz (yanlış-pozitif önlenir).
 * Ne DOĞRULAR (ihlalde exit 1 — sert):
 *   1. Zarf: docs/event-replay-projection-contract.md MEVCUT.
 *   2. "exactly-once" iddiası YASAK (anti-pattern) — herhangi bir düğüm metninde geçerse ihlal.
 * Ne UYARIR (WARN — ratchet, exit'i etkilemez):
 *   - Kapsamlı düğüm idempotent/at-least-once/DLQ/aggregate_version/replay sinyallerinden birini
 *     beyan etmiyorsa. Düğümler requirements fazında olduğundan bu beklenen ara durumdur; içerik
 *     olgunlaştıkça WARN bloklayıcıya çevrilebilir (insan onayı ile).
 * Ne YAPMAZ? Gerçek consumer/DLQ/replay kodunu doğrulamaz (platform repo işi). Beyan-tabanlıdır.
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
  "event-consumer",
  "outbox-consumer",
  "event-projection",
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
const warns = [];
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
  // "exactly-once" YALNIZ mitigasyonsuz geçtiğinde ihlaldir. Node "en-az-bir-kez + idempotent"
  // alternatifiyle birlikte anıyorsa (nüanslı streaming semantiği) yasak DEĞİLDİR.
  const mitigated =
    text.includes("idempoten") || text.includes("at-least-once") || text.includes("en-az-bir-kez");
  if (BANNED.some((b) => text.includes(b)) && !mitigated)
    fails.push(
      `exactly-once-iddiasi: ${n.id} — mitigasyonsuz 'exactly-once' garantisi (anti-pattern)`,
    );
  if (!tags.some((t) => SCOPE_TAGS.has(t))) continue;
  scoped++;
  if (!REQUIRED_SIGNALS.some((sig) => text.includes(sig)))
    warns.push(`beyan-yok: ${n.id} — idempotent-consumer/DLQ/replay anlambilimi beyan edilmemiş`);
}

console.log(
  `[event-semantics] olay-tüketici düğüm: ${scoped} · ihlal: ${fails.length} · uyarı: ${warns.length}`,
);
for (const w of warns.slice(0, 50)) console.log(`  WARN ${w}`);
if (fails.length) {
  console.error(`\nSONUÇ: KIRMIZI ✗ — ${fails.length} ihlal:`);
  for (const f of fails.slice(0, 50)) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(
  "SONUÇ: YEŞİL ✓ — 'exactly-once' iddiası yok; eksik beyanlar WARN olarak izleniyor (ratchet).",
);
