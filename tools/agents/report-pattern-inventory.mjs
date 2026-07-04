#!/usr/bin/env node
/**
 * report-pattern-inventory — kalıp envanteri (W4, salt-okur; mapping'e DEĞİL
 * node'lara bakar: rewrite + thin + append/enrich maddelerinin TAMAMI dahil).
 *
 * Üç kategori ayrı sayılır:
 *  - exact: birebir metin tekrarı (cross-repeat kapısının konusu; hedef 0)
 *  - masked: title (birebir, tam-metin split) + sayı maskelendikten sonraki imza
 *    tekrarı (yarı-parametrik şablon; ratchet konusu)
 *  - kısa el-yazımı maddeler (<60, imzasız) kalıp sayılmaz (frekans doğal olarak 1'e düşer)
 *
 * Title-maskeleme kaçağı yok: node'un GERÇEK title'ı tam-metin olarak maskelenir
 * (regex tahmini değil). Kullanım: node tools/agents/report-pattern-inventory.mjs [--json]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const NODES = path.join(ROOT, "src", "data", "generated", "nodes");
const AS_JSON = process.argv.includes("--json");

export function computePatternStats() {
  const files = fs.readdirSync(NODES).filter((f) => f.endsWith(".json"));
  const exact = new Map();
  const masked = new Map();
  let totalItems = 0;
  for (const f of files) {
    const n = JSON.parse(fs.readFileSync(path.join(NODES, f), "utf8"));
    for (const [dk, dim] of Object.entries(n.dimensions ?? {})) {
      for (const it of dim?.items ?? []) {
        totalItems++;
        exact.set(it, (exact.get(it) ?? 0) + 1);
        const sig = `${dk}|${it.split(n.title).join("T").replace(/\d+/g, "N").slice(0, 90)}`;
        masked.set(sig, (masked.get(sig) ?? 0) + 1);
      }
    }
  }
  const exactOver = [...exact.entries()].filter(([, c]) => c >= 5).sort((a, b) => b[1] - a[1]);
  const maskedSorted = [...masked.entries()].sort((a, b) => b[1] - a[1]);
  const masked10 = maskedSorted.filter(([, c]) => c >= 10);
  return {
    totalItems,
    exactDistinct: exact.size,
    exactRepeated5: exactOver.length,
    maskedDistinct: masked.size,
    masked10plus: masked10.length,
    maxMaskedGroup: maskedSorted[0]?.[1] ?? 0,
    top20: maskedSorted.slice(0, 20).map(([k, c]) => ({ count: c, sig: k })),
    byDimNeed: (() => {
      // boyut başına şablon-yoğunluğu: ≥3 tekrarlı maskeli imzaların madde toplamı
      const need = {};
      for (const [k, c] of maskedSorted) {
        if (c < 3) continue;
        const dim = k.split("|")[0];
        need[dim] = (need[dim] ?? 0) + c;
      }
      return need;
    })(),
  };
}

// CLI
const isMain = process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]));
if (isMain) {
  const s = computePatternStats();
  if (AS_JSON) {
    console.log(JSON.stringify(s, null, 2));
  } else {
    console.log(
      `Kalıp envanteri — ${s.totalItems} madde | exact-tekrar(≥5): ${s.exactRepeated5} | masked-farklı: ${s.maskedDistinct} | masked 10+: ${s.masked10plus} | en büyük grup: ${s.maxMaskedGroup}`,
    );
    console.log("EN ÇOK TEKRAR EDEN 20 (masked):");
    for (const t of s.top20) console.log(`  ${String(t.count).padStart(3)}× ${t.sig.slice(0, 95)}`);
    console.log(
      "\nBoyut başına şablonlu-madde yoğunluğu (≥3 tekrar):",
      JSON.stringify(s.byDimNeed),
    );
  }
}
