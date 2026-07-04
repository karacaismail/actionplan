#!/usr/bin/env node
/**
 * normalize-patterns — rewrite-katmanı kalıp normalizasyonu (W4).
 *
 * Kapsam: W2/W3 rewrite ekleri (mapping'te kayıtlı, eski-base korunur) VE
 * enrich/append şablon-maddeleri (base'siz; bilinen havuz imzalı). Miras
 * generator şablonları, day-2 backfill temel katmanı ve bilinçli-üniform
 * güvenlik-sınır satırları KAPSAM DIŞIDIR (ayrı sınıflar; W5+ kararı).
 *
 * Ne yapar? Maskeli-imza grubu LIMIT'i (9) aşan maddelerin fazlasını
 * pattern-pools'tan EN AZ kullanılmış varyantla değiştirir:
 *  - base'li madde: orijinal kısa base AYNEN korunur, yalnız ek değişir
 *  - base'siz (enrich) madde: tam madde aynı boyutun farklı varyantıyla değişir
 * Yazım öncesi: yasak-ifade, FORBIDDEN imza, kart-içi tekrar, semantik gerileme.
 *
 * Kullanım: --dry-run | --apply  [--limit 9]
 */
import fs from "node:fs";
import path from "node:path";
import { evaluateDimensionSemantics } from "../lib/dimension-semantics.mjs";
import { loadRewriteLayer, maskItem as mask } from "../lib/pattern-layer.mjs";
import { poolsFor } from "../lib/pattern-pools.mjs";

const APPLY = process.argv.includes("--apply");
const li = process.argv.indexOf("--limit");
const LIMIT = li > -1 ? Number(process.argv[li + 1]) : 9;

const BANNED =
  /uygun şekilde|gerekli önlemler|performans iyileştirilir|erişilebilirlik sağlanır|güvenlik uygulanır|standartlara uyum|best practice|\btodo\b|tanımlanacak|doldurulacak/i;

// Gruplama TEK KAYNAKTAN (pattern-layer): kapı ile araç aynı envanteri görür.
const { nodeCache, mapRecs, groups, NODES, MAP_PATH } = loadRewriteLayer();

const use = new Map(); // varyant-imza kullanım sayacı (mevcut dağılım yüklenir)
for (const [sig, arr] of groups) use.set(sig, arr.length);

const stats = { changed: 0, baseKept: 0, fullSwap: 0, touched: new Set(), skipped: 0, why: {} };
const skip = (r) => {
  stats.skipped++;
  stats.why[r] = (stats.why[r] ?? 0) + 1;
};
const over = [...groups.entries()]
  .filter(([, a]) => a.length > LIMIT)
  .sort((a, b) => b[1].length - a[1].length);
for (const [sig, arr] of over) {
  const extras = arr.sort((a, b) => a.id.localeCompare(b.id)).slice(LIMIT);
  for (const e of extras) {
    const nc = nodeCache[e.id];
    const card = nc.n.dimensions[e.dim];
    if (card.items[e.idx] !== e.item) {
      skip("item-kaydi");
      continue;
    }
    const pool = poolsFor(nc.n)[e.dim];
    if (!pool) {
      skip("pool-yok");
      continue;
    }
    // Adayları kullanım-artan sırada dene; SEMANTİK-GEÇEN ilk adayı seç
    // (bazı varyantlar must-kelime taşımaz; tek-şablonlu kartta gerileme
    // üretir — o aday atlanır, kavram-taşıyan sıradaki denenir).
    const before = evaluateDimensionSemantics(e.dim, card).ok;
    const ranked = pool
      .map((cand) => ({ cand, u: use.get(`${e.dim}|${mask(cand, nc.n.title)}`) ?? 0 }))
      .filter((x) => x.u < LIMIT)
      .sort((a, b) => a.u - b.u);
    if (!ranked.length) {
      skip("kapasite");
      continue;
    }
    let best = null;
    let candidate = null;
    let newItems = null;
    for (const { cand } of ranked) {
      const c = e.base ? `${e.base} — ${cand}` : cand;
      if (BANNED.test(c) || c.length < 40) continue;
      const ni = card.items.map((x, i) => (i === e.idx ? c : x));
      if (new Set(ni.map((x) => x.trim().toLowerCase())).size !== ni.length) continue;
      const after = evaluateDimensionSemantics(e.dim, { ...card, items: ni }).ok;
      if (before && !after) continue;
      best = cand;
      candidate = c;
      newItems = ni;
      break;
    }
    if (!best) {
      skip("uygun-varyant-yok");
      continue;
    }
    card.items[e.idx] = candidate;
    use.set(sig, use.get(sig) - 1);
    const ns = `${e.dim}|${mask(best, nc.n.title)}`;
    use.set(ns, (use.get(ns) ?? 0) + 1);
    if (e.base) {
      stats.baseKept++;
      // mapping kaydını güncelle
      const rec = mapRecs.find(
        (r) => r.node === e.id && r.dimension === e.dim && r.yeni === e.item,
      );
      if (rec) {
        rec.yeni = candidate;
        rec.eklenen = best.slice(0, 100);
        rec.neden += " (W4 normalizasyon)";
      }
    } else stats.fullSwap++;
    stats.changed++;
    stats.touched.add(e.id);
  }
}

if (APPLY) {
  for (const id of stats.touched) {
    const nc = nodeCache[id];
    fs.writeFileSync(path.join(NODES, nc.f), `${JSON.stringify(nc.n, null, 2)}\n`);
  }
  if (mapRecs.length)
    fs.writeFileSync(
      MAP_PATH,
      `${JSON.stringify({ mode: "apply (W2+W3+W4 birleşik)", toplam: mapRecs.length, mapping: mapRecs }, null, 2)}\n`,
    );
}
console.log(
  `normalize-patterns — mod: ${APPLY ? "APPLY" : "DRY-RUN"} | limit: ${LIMIT} | ${LIMIT}+ grup: ${over.length}`,
);
if (!APPLY && over.length) {
  const byDim = {};
  for (const [sig, arr] of over) {
    const d = sig.split("|")[0];
    byDim[d] = (byDim[d] ?? 0) + arr.length - LIMIT;
  }
  console.log("  kalan fazla-madde (boyut bazında):", JSON.stringify(byDim));
  console.log(
    "  en büyük 5 grup:",
    over
      .slice(0, 5)
      .map(([s, a]) => `${a.length}× ${s.slice(0, 60)}`)
      .join(" | "),
  );
}
console.log(
  `  değişen madde: ${stats.changed} (base-korumalı: ${stats.baseKept}, tam-değişim/enrich: ${stats.fullSwap}) | node: ${stats.touched.size} | atlanan: ${stats.skipped} ${JSON.stringify(stats.why)}`,
);
console.log("SONUÇ: YEŞİL ✓");
