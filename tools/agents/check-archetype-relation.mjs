#!/usr/bin/env node
/**
 * check-archetype-relation — İLİŞKİ TÜRÜ KAPISI (BLOKLAYICI).
 *
 * Bu nedir? docs/archetype-tree-relation-directive.md'nin zorunlu kıldığı ilişki-türü denetimini
 *   CI'da uygulayan kapı. (Bu dosya yazılmadan önce yönerge "zorunludur" diyordu ama kapı yoktu =
 *   yanlış-güven; bu kapı o boşluğu kapatır.)
 * Ne DOĞRULAR (ihlalde exit 1):
 *   1. Zarf: docs/archetype-tree-relation-directive.md MEVCUT olmalı.
 *   2. Her ArcheType fixture'ında relation.kind GEÇERLİ olmalı. Geçerli küme = RelationSchema
 *      kardinaliteleri (one-to-one/one-to-many/many-to-one/many-to-many) + tree-relation uzantısı
 *      (tree/dag/graph/temporal). Geçersiz kind = ihlal.
 *   3. tree/dag türünde döngü-tespiti (cycle) beyanı zorunlu; yoksa ihlal.
 * Ne UYARIR (WARN — exit'i etkilemez): relation.target var olan bir fixture'a çözülmüyorsa
 *   (dangling). Fixture kataloğu bilinçli olarak eksiktir (şu an product/customer/order); hedef
 *   archetype henüz yazılmamış olabilir. Katalog dolduğunda bu WARN bloklayıcıya çevrilebilir (ratchet).
 * Ne YAPMAZ? Gerçek ltree/nested-set sorgu performansını ölçmez (platform repo işi).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const ARCH = path.join(ROOT, "src", "data", "archetypes");
const DIRECTIVE = path.join(ROOT, "docs", "archetype-tree-relation-directive.md");

const VALID_KINDS = new Set([
  "one-to-one",
  "one-to-many",
  "many-to-one",
  "many-to-many",
  "tree",
  "dag",
  "graph",
  "temporal",
]);

const fails = [];
const warns = [];

if (!fs.existsSync(DIRECTIVE))
  fails.push("zarf-yok: docs/archetype-tree-relation-directive.md bulunamadı");
if (!fs.existsSync(ARCH)) {
  console.error(`[archetype-relation] archetype klasörü yok: ${ARCH}`);
  process.exit(2);
}

const files = fs.readdirSync(ARCH).filter((f) => f.endsWith(".json"));
const archs = files.map((f) => ({
  id: f.replace(/\.json$/, ""),
  data: JSON.parse(fs.readFileSync(path.join(ARCH, f), "utf8")),
}));
const ids = new Set(archs.map((a) => a.id));

let relCount = 0;
for (const { id, data } of archs) {
  for (const rel of data.relations ?? []) {
    relCount++;
    const kind = rel.kind ?? "many-to-one";
    if (!VALID_KINDS.has(kind))
      fails.push(`gecersiz-tur: ${id}.${rel.name ?? rel.target} kind=${kind}`);
    if ((kind === "tree" || kind === "dag") && !JSON.stringify(rel).toLowerCase().includes("cycle"))
      fails.push(`dongu-beyani-yok: ${id}.${rel.name ?? rel.target} (${kind}) cycle-detection yok`);
    if (rel.target && !ids.has(rel.target))
      warns.push(`sarkan-hedef: ${id} → '${rel.target}' (henüz fixture yok)`);
  }
}

console.log(
  `[archetype-relation] fixture: ${archs.length} · ilişki: ${relCount} · ihlal: ${fails.length} · uyarı: ${warns.length}`,
);
for (const w of warns.slice(0, 50)) console.log(`  WARN ${w}`);
if (fails.length) {
  console.error(`\nSONUÇ: KIRMIZI ✗ — ${fails.length} ihlal:`);
  for (const f of fails.slice(0, 50)) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(
  "SONUÇ: YEŞİL ✓ — ilişki türleri geçerli (sarkan hedefler WARN, ratchet için izlenir).",
);
