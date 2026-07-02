#!/usr/bin/env node
/**
 * check-archetype-relation — İLİŞKİ TÜRÜ KAPISI (TASLAK — CI'a bağlı DEĞİL).
 *
 * Bu nedir? docs/archetype-tree-relation-directive.md'nin "zorunludur" dediği ama HENÜZ YAZILMAMIŞ
 *   kapının iskeleti. (Yönerge bu kapıyı var gibi anlatıyor — yanlış-güven kaynağı; bkz.
 *   gap-2026-07-02-00-index §6.)
 * Ne DOĞRULAR (hedef; ihlalde exit 1):
 *   1. Zarf: archetype-tree-relation-directive.md MEVCUT.
 *   2. Her ArcheType fixture'ında relation.kind ∈ {relation, tree, dag, graph, temporal} (geçerli tür).
 *   3. tree/dag türlerinde döngü-tespiti (cycle detection) beyanı; temporal'da effectivity penceresi beyanı.
 *   4. Sarkan hedef yok: relation.target var olan bir ArcheType id'sine çözülmeli.
 * Ne YAPMAZ? Gerçek ltree/nested-set sorgu performansını, gerçek subtree p95 bütçesini ölçmez —
 *   o platform repo'sunun işi. Plan/sözleşme katmanında yapısal beyanı doğrular.
 *
 * NOT: Bugün src/data/archetypes/ yalnız 2 fixture içerir (product, customer) ve customer 'order'
 *   ArcheType'ına sarkan bir relation.target taşır — bu kapı aktive edilince o sarkma yakalanır.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const ARCH = path.join(ROOT, "src", "data", "archetypes");
const DIRECTIVE = path.join(ROOT, "docs", "archetype-tree-relation-directive.md");

const VALID_KINDS = new Set(["relation", "tree", "dag", "graph", "temporal"]);
const fails = [];

if (!fs.existsSync(DIRECTIVE))
  fails.push("zarf-yok: docs/archetype-tree-relation-directive.md bulunamadı");
if (!fs.existsSync(ARCH)) {
  console.error(`[archetype-relation] (TASLAK) archetype klasörü yok: ${ARCH}`);
  process.exit(2);
}

const files = fs.readdirSync(ARCH).filter((f) => f.endsWith(".json"));
const archs = files.map((f) => JSON.parse(fs.readFileSync(path.join(ARCH, f), "utf8")));
const ids = new Set(archs.map((a) => a.id ?? a.slug ?? a.name));

let relCount = 0;
for (const a of archs) {
  for (const rel of a.relations ?? []) {
    relCount++;
    const kind = rel.kind ?? "relation";
    if (!VALID_KINDS.has(kind))
      fails.push(`gecersiz-tur: ${a.id}.${rel.name ?? rel.target} kind=${kind}`);
    if ((kind === "tree" || kind === "dag") && !JSON.stringify(rel).toLowerCase().includes("cycle"))
      fails.push(
        `dongu-beyani-yok: ${a.id}.${rel.name ?? rel.target} (${kind}) cycle-detection beyanı yok`,
      );
    if (rel.target && !ids.has(rel.target))
      fails.push(`sarkan-hedef: ${a.id} → '${rel.target}' tanımsız ArcheType`);
  }
}

console.log(
  `[archetype-relation] (TASLAK) fixture: ${archs.length} · ilişki: ${relCount} · ihlal: ${fails.length}`,
);
if (fails.length) {
  console.error(`\nSONUÇ: KIRMIZI ✗ — ${fails.length} ihlal:`);
  for (const f of fails.slice(0, 50)) console.error(`  - ${f}`);
  process.exit(1);
}
console.log("SONUÇ: YEŞİL ✓ — ilişki türleri geçerli, sarkan hedef yok.");
