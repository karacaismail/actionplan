#!/usr/bin/env node
/**
 * check-weak-content — içerik kalitesi RATCHET kapısı (W1 dalgası).
 *
 * Ne yapar? report-weak-content'in çekirdek analizini koşar ve baseline'a
 * (tools/agents/weak-content-baseline.json) karşı şunları ZORLAR:
 *   - empty-but-not-na ARTAMAZ
 *   - generic ARTAMAZ
 *   - short-items toplamı ARTAMAZ
 *   - measured-short ARTAMAZ
 *   - top-40 zayıf node ortalama skoru DÜŞEMEZ
 * Semantik FAIL/WARN-ratchet ayrı kapıdadır (check-dimension-semantics).
 * Ne yapmaz? İçerik yazmaz; azalmayı engellemez (azalma `--write-baseline` ile kilitlenir).
 * CI: deploy.yml'de bloklayıcı adım; konsol özeti rapor yerine geçer.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadRewriteLayer, rewriteLayerStats } from "../lib/pattern-layer.mjs";
import { computeWeakStats } from "./report-weak-content.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const BASELINE = path.join(ROOT, "tools", "agents", "weak-content-baseline.json");
const WRITE = process.argv.includes("--write-baseline");

const s = computeWeakStats();

// Kalıp-ratchet metrikleri (W4.1): rewrite-KATMANI (madde-bazlı, append/enrich
// dahil) TEK KAYNAKTAN ölçülür — normalize-patterns aracıyla aynı gruplama.
// 10+ grup sayısı ve en büyük grup ARTAMAZ.
const layer = rewriteLayerStats(loadRewriteLayer().groups);
const pat = { patterns10plus: layer.tenPlus, maxPatternGroup: layer.maxGroup };

const current = {
  emptyButNotNa: s.totals.emptyButNotNa,
  generic: s.totals.generic,
  shortItems: s.totals.shortItems,
  measuredShort: s.totals.measuredShort,
  top40AvgScore: s.top40AvgScore,
  patterns10plus: pat.patterns10plus,
  maxPatternGroup: pat.maxPatternGroup,
};
console.log(
  `Weak-content kapısı — ${s.nodeCount} node: empty-but-not-na=${current.emptyButNotNa}, generic=${current.generic}, short-items=${current.shortItems}, measured-short=${current.measuredShort}, top40Avg=${current.top40AvgScore}, kalıp10+=${current.patterns10plus}, maxKalıp=${current.maxPatternGroup}`,
);

if (WRITE) {
  // Borç geçmişi korunur: önceki taban history'e itilir (denetim izi).
  let history = [];
  if (fs.existsSync(BASELINE)) {
    const prev = JSON.parse(fs.readFileSync(BASELINE, "utf8"));
    history = prev.history ?? [];
    const prevSnap = {
      emptyButNotNa: prev.emptyButNotNa,
      generic: prev.generic,
      shortItems: prev.shortItems,
      measuredShort: prev.measuredShort ?? 0,
      top40AvgScore: prev.top40AvgScore,
      patterns10plus: prev.patterns10plus,
      maxPatternGroup: prev.maxPatternGroup,
    };
    if (JSON.stringify(prevSnap) !== JSON.stringify(current))
      history.push({ date: new Date().toISOString().slice(0, 10), ...prevSnap });
  }
  fs.writeFileSync(
    BASELINE,
    `${JSON.stringify({ _aciklama: "Weak-content ratchet baseline'ı — kötüleşme kapıyı kırar; iyileşme --write-baseline ile bilinçli kilitlenir. history: önceki tabanlar (denetim izi).", ...current, history }, null, 2)}\n`,
  );
  console.log(`Baseline yazıldı → ${path.relative(ROOT, BASELINE)}`);
}

const errors = [];
if (!fs.existsSync(BASELINE)) {
  errors.push("weak-content-baseline.json YOK — `--write-baseline` ile oluşturup commit'le");
} else {
  const b = JSON.parse(fs.readFileSync(BASELINE, "utf8"));
  if (current.emptyButNotNa > b.emptyButNotNa)
    errors.push(`empty-but-not-na arttı: ${b.emptyButNotNa} → ${current.emptyButNotNa}`);
  if (current.generic > b.generic) errors.push(`generic arttı: ${b.generic} → ${current.generic}`);
  if (current.shortItems > b.shortItems)
    errors.push(`short-items arttı: ${b.shortItems} → ${current.shortItems}`);
  if (current.measuredShort > (b.measuredShort ?? 0))
    errors.push(`measured-short arttı: ${b.measuredShort ?? 0} → ${current.measuredShort}`);
  if (current.top40AvgScore < b.top40AvgScore)
    errors.push(`top-40 ortalama düştü: ${b.top40AvgScore} → ${current.top40AvgScore}`);
  if (b.patterns10plus !== undefined && current.patterns10plus > b.patterns10plus)
    errors.push(`10+ kalıp sayısı arttı: ${b.patterns10plus} → ${current.patterns10plus}`);
  if (b.maxPatternGroup !== undefined && current.maxPatternGroup > b.maxPatternGroup)
    errors.push(`en büyük kalıp grubu arttı: ${b.maxPatternGroup} → ${current.maxPatternGroup}`);
  const improved =
    current.emptyButNotNa < b.emptyButNotNa ||
    current.generic < b.generic ||
    current.shortItems < b.shortItems ||
    current.measuredShort < (b.measuredShort ?? 0) ||
    current.top40AvgScore > b.top40AvgScore;
  if (!errors.length && improved)
    console.log(
      "Ratchet: metrikler iyileşti — `--write-baseline` ile yeni tabanı kilitleyebilirsin.",
    );
}

if (errors.length === 0) {
  console.log("\nSONUÇ: YEŞİL ✓");
  process.exit(0);
}
console.log(`\nSONUÇ: KIRMIZI — ${errors.length} ratchet ihlali`);
for (const e of errors) console.log(`  - ${e}`);
process.exit(1);
