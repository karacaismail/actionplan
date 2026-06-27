#!/usr/bin/env node
/**
 * qa-agent (3a, self-healing QA — güvenli mod) — bir komutu maks 6 kez çalıştırır;
 * her başarısızlıkta çıktıyı OKUR, hataları SINIFLANDIRIR (tsc / vitest / axe) ve
 * düzeltme ÖNERİSİ üretir. Otonom kod düzeltme YOK (3b ayrı/riskli). Düzelmezse raporlar.
 *
 * Kullanım: node tools/qa-agent.mjs "npm run typecheck && npm test"
 */
import { execSync } from "node:child_process";

const MAX = 6;
const cmd = process.argv.slice(2).join(" ") || "npm run typecheck && npm test";

function run() {
  try {
    execSync(cmd, { stdio: "pipe", encoding: "utf8" });
    return { ok: true, out: "" };
  } catch (e) {
    return { ok: false, out: `${e.stdout ?? ""}\n${e.stderr ?? ""}` };
  }
}

function suggestTs(code) {
  return (
    {
      6133: "Kullanılmayan import/değişkeni kaldır",
      2322: "Tip uyuşmazlığı: tipi/şemayı hizala ya da uygun cast uygula",
      2769: "Overload eşleşmiyor: imza/argümanları düzelt (ör. vite≠vitest config ayrımı)",
      2578: "Gereksiz @ts-expect-error direktifini kaldır",
      2307: "Modül bulunamadı: import yolunu/paketi düzelt",
    }[code] ?? "İlgili tipi/şemayı düzelt"
  );
}

function classify(out) {
  const issues = [];
  for (const m of out.matchAll(/error TS(\d+): ([^\n]+)/g))
    issues.push({ kind: "typecheck", code: `TS${m[1]}`, msg: m[2].trim(), fix: suggestTs(m[1]) });
  for (const m of out.matchAll(/(?:✗|×|FAIL)\s+([^\n›]+)/g))
    issues.push({
      kind: "test",
      code: "FAIL",
      msg: m[1].trim(),
      fix: "İlgili testi/birimi incele; beklenen↔gerçek farkını gider",
    });
  for (const m of out.matchAll(/\[serious\]\s+([a-z-]+):/g))
    issues.push({
      kind: "axe",
      code: m[1],
      fix: `Erişilebilirlik '${m[1]}' ihlalini gider (ARIA adı / kontrast / klavye)`,
    });
  return issues;
}

let attempt = 0;
let last = [];
while (attempt < MAX) {
  attempt++;
  const r = run();
  if (r.ok) {
    console.log(`[qa] ${attempt}. denemede GEÇTİ.`);
    process.exit(0);
  }
  last = classify(r.out);
  console.log(`[qa] ${attempt}/${MAX} BAŞARISIZ — ${last.length} sorun sınıflandırıldı.`);
}

console.log(`\n[qa] ${MAX} denemede düzelmedi — TANI RAPORU:`);
const seen = new Set();
for (const i of last) {
  const k = `${i.code}|${i.msg}`;
  if (seen.has(k)) continue;
  seen.add(k);
  console.log(`  [${i.kind}/${i.code}] ${i.msg ?? ""}\n     → öneri: ${i.fix}`);
}
if (last.length === 0) console.log("  (yapısal hata yakalanamadı — ham çıktıyı incele)");
console.log(
  "\nNot: otonom kod düzeltme KAPALI (3a güvenli mod). Önerileri uygula, tekrar çalıştır.",
);
process.exit(1);
