#!/usr/bin/env node
/**
 * enrich-tags — her düğümün `tags` alanını KENDİ içeriğindeki (boyut maddeleri) tekrar eden
 * domain kelimeleriyle zenginleştirir.
 *
 * NEDEN: Denetim (audit) somutluk ekseni, bir maddeyi "düğüme-özel" saymak için maddenin
 * düğümün token'larını (id+başlık+özet+etiket kelimeleri) içermesini ister. Birçok düğümün
 * etiketi çok dar (örn. app-hr: [hr,app,küme]); oysa maddeler gerçekten domain-spesifik
 * ("bordro", "çeviri", "yerel"). Token sözlüğü dar olduğu için bu maddeler "vague" (-0.5)
 * cezası alıyordu. Bu kelimeleri etikete eklemek GERÇEK metadata düzeltmesidir
 * (etiketler düğümün sözcük dağarcığını yansıtmalı + arama/filtreyi güçlendirir) — ölçüt oyunu değil.
 *
 * KAYNAK: başlık + özet + moduleUsage HARİÇ tüm boyut maddeleri (moduleUsage üretici-boilerplate
 * kelimeleri taşıdığı için hariç). Türkçe İ/I küçültmesi düzeltilir ("İnsan"→"insan").
 * ≥2 kez geçen, ≥4 harfli, stopword olmayan, etiket olmayan ilk 8 kelime eklenir. Yalnız `tags` yazılır.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const NODES = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "data",
  "generated",
  "nodes",
);

// Türkçe bağlaç/edat/yardımcı fiil + çok-genel sözcükler (etiket olarak ayırt edici sinyal taşımaz).
const STOP = new Set([
  "için",
  "veya",
  "ile",
  "olan",
  "gibi",
  "daha",
  "çok",
  "bir",
  "şu",
  "ama",
  "hem",
  "de",
  "da",
  "mi",
  "her",
  "göre",
  "kadar",
  "sonra",
  "önce",
  "arası",
  "yani",
  "hangi",
  "nasıl",
  "neden",
  "yalnız",
  "sadece",
  "tüm",
  "kendi",
  "değil",
  "olarak",
  "üzerinden",
  "üzerinde",
  "içinde",
  "arasında",
  "ise",
  "ayrıca",
  "ancak",
  "fakat",
  "yapılır",
  "edilir",
  "olur",
  "gösterilir",
  "sağlar",
  "sunar",
  "tüketir",
  "çağırır",
  "içerir",
  "destekler",
  "edilen",
  "yapılan",
  "tarafından",
  "yoluyla",
  "bunu",
  "onun",
  "ilgili",
  "gerekli",
  "uygun",
  "mevcut",
  "eder",
  "doğru",
  "yanlış",
  "aynı",
  "farklı",
  "büyük",
  "küçük",
  "yeni",
  "eski",
  "ortak",
  "temel",
  "ayrı",
  "göre",
  "veri",
  "verisi",
  "bilgi",
  "sistem",
  "modül",
  "modülü",
  "küme",
  "görev",
  "düğüm",
  "sayfa",
  "seviye",
  "birim",
  "kullanıcı",
  "erişim",
  "işlem",
  "durum",
  "değer",
  "alan",
  "yüzey",
  "sözleşme",
  "kapsam",
  "içerik",
  "özellik",
]);

// Türkçe-doğru küçültme: İ→i, I→ı (JS toLowerCase aksi halde "İnsan"→"i̇nsan" artefaktı üretir).
const norm = (s) => s.replace(/İ/g, "i").replace(/I/g, "ı").toLowerCase();

function words(s) {
  return norm(s || "")
    .split(/[^a-zçğıöşü0-9]+/i)
    .filter((w) => w.length >= 4 && !STOP.has(w) && !/^\d+$/.test(w));
}

const files = fs.readdirSync(NODES).filter((f) => f.endsWith(".json"));
let changed = 0;
let totalAdded = 0;
for (const f of files) {
  const p = path.join(NODES, f);
  const n = JSON.parse(fs.readFileSync(p, "utf8"));
  const existing = new Set((n.tags || []).map((x) => norm(x)));
  const freq = new Map();
  const bump = (text) => {
    for (const w of words(text)) freq.set(w, (freq.get(w) ?? 0) + 1);
  };
  bump(n.title);
  bump(n.summary);
  for (const key of Object.keys(n.dimensions || {})) {
    if (key === "moduleUsage") continue; // üretici-boilerplate hariç
    for (const it of n.dimensions[key].items || []) bump(it);
  }
  const candidates = [...freq.entries()]
    .filter(([w, c]) => c >= 2 && !existing.has(w))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "tr"))
    .slice(0, 8)
    .map(([w]) => w);
  if (candidates.length === 0) continue;
  n.tags = [...(n.tags || []), ...candidates];
  fs.writeFileSync(p, `${JSON.stringify(n, null, 2)}\n`);
  changed++;
  totalAdded += candidates.length;
}
console.log(
  `[enrich-tags] ${changed} düğüme etiket eklendi · toplam +${totalAdded} (ort ${(totalAdded / Math.max(changed, 1)).toFixed(1)}/düğüm).`,
);
