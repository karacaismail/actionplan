#!/usr/bin/env node
/**
 * check-scale-invariant — SCALE-INVARIANT KAPISI (ADR-K3 / SCV — BLOKLAYICI).
 *
 * Bu nedir? docs/scale-invariant-directive.md ana kuralını CI'da zorlayan kapı: para/sipariş/stok
 *   yazan bir mutasyon/akış sözleşmesi, transactional outbox + idempotency koruma zarfını
 *   BEYAN etmeden merge edilemez. Yönerge korumayı bir "bayrak" (opt-in) olmaktan çıkarır,
 *   var-oluş ön şartı (invariant) yapar; bu kapı o şartı makineye bağlar.
 * Kapsam nasıl belirlenir? Bir düğüm `financial|order|inventory` etiketini (tag token olarak)
 *   taşıyorsa "etiketli mutasyon sözleşmesi"dir ve yönerge onu bağlar (yönerge §2). Substring
 *   değil, tam tag token eşleşir ("order" TAG'i sayılır; "orderops" gibi kelime içi geçiş sayılmaz).
 * Ne DOĞRULAR (ihlalde exit 1):
 *   1. Zarf-referansı var: Zarf sözleşme düğümleri (scale-invariant + scale-outbox/idempotency/
 *      ratelimit) depoda MEVCUT olmalı — beyanın bir referenti olsun (dangling koruma yok).
 *   2. Etiketli her mutasyon SCALE-INVARIANT BEYANI taşır: en az bir tanınan sinyal —
 *      (a) zarfa/scale-* primitife dependsOn/related bağı, VEYA
 *      (b) `scale-invariant|outbox|idempotency` tag token'ı, VEYA
 *      (c) metinde (summary/refs/dimensions/deliverables/acceptanceCriteria) outbox|idempotency geçişi.
 *      Hiç sinyali olmayan etiketli düğüm = "sessiz para/sipariş/stok yazarı" → ihlal.
 * Ne YAPMAZ? Kod-seviyesi zorlamayı (scaled_write dekoratörü, hash-chain, gerçek outbox satırı)
 *   BURADA yapmaz — o platform repo'sunun işidir (yönerge §3/§9). Bu kapı plan/sözleşme katmanında
 *   yalnız BEYAN-tabanlı doğrular: etiketli düğüm koruma zarfını tanıyor mu. Etiketsiz iç akışı,
 *   salt-okuma yolunu bağlamaz (yönerge non-goals). Waiver mekanizması check-waivers'ta ele alınır.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const NODES = path.join(ROOT, "src", "data", "generated", "nodes");

// Kapsam etiketleri (yönerge §2 enum): tam tag token olarak aranır.
const SCOPE_LABELS = new Set(["financial", "order", "inventory"]);
// Koruma zarfı sözleşme düğümleri: beyanın referenti + scale-* bağı bunları hedefleyebilir.
const ENVELOPE_IDS = ["scale-invariant", "scale-outbox", "scale-idempotency", "scale-ratelimit"];
// Beyan sinyali sayılan tag token'ları.
const DECLARE_TAGS = new Set(["scale-invariant", "outbox", "idempotency"]);

const nodes = fs
  .readdirSync(NODES)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(fs.readFileSync(path.join(NODES, f), "utf8")));

const ids = new Set(nodes.map((n) => n.id));
const fails = [];

// 1: Zarf sözleşme düğümleri mevcut mu (beyanın referenti — dangling koruma olmasın).
for (const eid of ENVELOPE_IDS) {
  if (!ids.has(eid)) fails.push(`zarf-sozlesme-yok: ${eid}`);
}

// Bir düğüm scale-invariant BEYANI taşıyor mu? — üç sinyalden herhangi biri yeterli.
function hasDeclaration(n) {
  const tags = (n.tags ?? []).map((t) => String(t).toLowerCase());
  // (b) beyan tag token'ı
  if (tags.some((t) => DECLARE_TAGS.has(t))) return true;
  // (a) zarfa/scale-* primitife bağ (zarf her iki korumayı da garanti eder)
  const links = [...(n.dependsOn ?? []), ...(n.related ?? [])].map((r) => String(r));
  if (links.some((r) => ENVELOPE_IDS.includes(r) || r.startsWith("scale-"))) return true;
  // (c) metinde outbox|idempotency geçişi (yalnız beyan taşıyan alanlar taranır)
  const text = JSON.stringify({
    s: n.summary,
    r: n.refs,
    d: n.dimensions,
    del: n.deliverables,
    ac: n.acceptanceCriteria,
  }).toLowerCase();
  if (text.includes("outbox") || text.includes("idempoten")) return true;
  return false;
}

// 2: Etiketli her mutasyon beyan taşımalı.
let taggedN = 0;
for (const n of nodes) {
  const tags = (n.tags ?? []).map((t) => String(t).toLowerCase());
  const labels = tags.filter((t) => SCOPE_LABELS.has(t));
  if (labels.length === 0) continue; // etiketsiz → yönerge bağlamaz (non-goal)
  taggedN++;
  if (!hasDeclaration(n))
    fails.push(
      `beyan-yok: ${n.id} [${labels.join("|")}] — outbox+idempotency zarfı beyan edilmemiş`,
    );
}

// Rapor
console.log(
  `[scale-invariant] etiketli mutasyon: ${taggedN} · zarf sözleşmesi: ${ENVELOPE_IDS.length} · ihlal: ${fails.length}`,
);
if (fails.length) {
  console.error(`\nSONUÇ: KIRMIZI ✗ — ${fails.length} ihlal:`);
  for (const f of fails.slice(0, 50)) console.error(`  - ${f}`);
  if (fails.length > 50) console.error(`  ... +${fails.length - 50} daha`);
  process.exit(1);
}
console.log(
  "SONUÇ: YEŞİL ✓ — etiketli mutasyonların hepsi scale-invariant beyanı taşıyor, zarf sözleşmesi tam.",
);
