#!/usr/bin/env node
/**
 * dedupe-generic — erken seed'lerden kalan, kümeler-arası ≥5× tekrar eden P-öneksiz kısa
 * teknik ifadeleri doğal eşanlamlı varyantlara round-robin dağıtır (her varyant <5× kalır).
 * contentQuality kapısının çapraz-tekrar (≥5×) kuralı için toptan (422) düğümde gereklidir.
 * Idempotent: orijinal ifade artık diskte kalmaz; tekrar koşumda eşleşme bulamaz → no-op.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const NODES = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "src",
  "data",
  "generated",
  "nodes",
);

// orijinal → varyantlar (hiçbiri orijinale eşit değil; round-robin ile dağıtılır)
const MAP = {
  "Offline doğrulanabilir": [
    "Çevrimdışı doğrulanabilir",
    "İnternetsiz doğrulanabilir",
    "Bağlantısız doğrulanabilir",
  ],
  "Okuyucuya anlamlı": [
    "Ekran okuyucuya anlamlı",
    "Okuyucu için anlamlı",
    "Yardımcı teknolojiye anlamlı",
  ],
  "Her profilde aynı doğrulama": [
    "Tüm profillerde tutarlı doğrulama",
    "Profilden bağımsız aynı doğrulama",
    "Her ortamda aynı doğrulama kuralı",
  ],
  "Tembel başlatma": ["Gerektiğinde başlatma", "İlk kullanımda başlatma", "Erteli (lazy) başlatma"],
  "Hata detayı yapılandırılmış": [
    "Yapılandırılmış hata detayı",
    "Hata ayrıntısı yapılandırılmış biçimde",
    "Hata bilgisi yapılandırılmış olarak tutulur",
  ],
};

const counters = Object.fromEntries(Object.keys(MAP).map((k) => [k, 0]));
const files = fs.readdirSync(NODES).filter((f) => f.endsWith(".json"));
let changed = 0;
let repl = 0;

for (const f of files) {
  const fp = path.join(NODES, f);
  const n = JSON.parse(fs.readFileSync(fp, "utf8"));
  let touched = false;
  for (const dim of Object.values(n.dimensions || {})) {
    if (!dim || !Array.isArray(dim.items)) continue;
    dim.items = dim.items.map((it) => {
      if (Object.prototype.hasOwnProperty.call(MAP, it)) {
        const variants = MAP[it];
        const v = variants[counters[it] % variants.length];
        counters[it]++;
        touched = true;
        repl++;
        return v;
      }
      return it;
    });
  }
  if (touched) {
    fs.writeFileSync(fp, `${JSON.stringify(n, null, 2)}\n`);
    changed++;
  }
}
console.log(`[dedupe-generic] ${repl} ifade ${changed} düğümde varyanta dağıtıldı.`);
for (const [k, c] of Object.entries(counters))
  if (c) console.log(`  "${k}": ${c} occurrence dağıtıldı`);
