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
import { fileURLToPath } from "node:url";
import { evaluateDimensionSemantics } from "../lib/dimension-semantics.mjs";
import { poolsFor } from "../lib/pattern-pools.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const NODES = path.join(ROOT, "src", "data", "generated", "nodes");
const MAP_PATH = path.join(ROOT, "reports", "short-items-wave2-mapping.json");
const APPLY = process.argv.includes("--apply");
const li = process.argv.indexOf("--limit");
const LIMIT = li > -1 ? Number(process.argv[li + 1]) : 9;

const BANNED =
  /uygun şekilde|gerekli önlemler|performans iyileştirilir|erişilebilirlik sağlanır|güvenlik uygulanır|standartlara uyum|best practice|\btodo\b|tanımlanacak|doldurulacak/i;

const mask = (text, title) => text.split(title).join("T").replace(/\d+/g, "N").slice(0, 90);

// 1) Node cache + mapping (base kaynağı)
const nodeCache = {};
for (const f of fs.readdirSync(NODES).filter((f) => f.endsWith(".json"))) {
  const n = JSON.parse(fs.readFileSync(path.join(NODES, f), "utf8"));
  nodeCache[n.id] = { f, n };
}
const mapRecs = fs.existsSync(MAP_PATH)
  ? JSON.parse(fs.readFileSync(MAP_PATH, "utf8")).mapping
  : [];
const baseByItem = new Map(); // node|dim|tamMadde -> orijinal kısa base
for (const r of mapRecs)
  baseByItem.set(`${r.node}|${r.dimension}|${r.yeni}`, r.eski.trim().replace(/[.;]\s*$/, ""));

// 2) Rewrite-katmanı envanteri: base'li maddeler + bilinen-havuz-imzalı base'siz maddeler
const knownSigs = new Set();
for (const { n } of Object.values(nodeCache)) {
  const pools = poolsFor(n);
  for (const [dim, arr] of Object.entries(pools))
    for (const v of arr) knownSigs.add(`${dim}|${mask(v, n.title)}`);
}
// enrich-weak-nodes (v1) extras şablon imzaları — bunlar da rewrite-katmanıdır.
const ENRICH_TEMPLATES = [
  ["performance", "T kritik ucu için pN Nms eşiği; darboğaz adayı"],
  [
    "performance",
    "T yük regresyon testi CI'da eşik korumalı; keyset sayfalama + seçici indeks planı",
  ],
  ["featureDefs", "T işlev sınırı: girdi/çıktı beyanı + durum akışı; hata yolu ayrı senaryo"],
  ["featureDefs", "T non-goal beyanı: komşu modül sorumluluğuna taşan davranış kapsam dışıdır"],
  ["codeOptimization", "T engine/görünüm ayrımıyla modüler; fonksiyon karmaşıklık tavanı N, lint"],
  ["codeOptimization", "T ölü kod elemesi refactor bütçesinde; tip güvenliği strict modda"],
  ["securityOptimization", "T sırları N günde rotasyon; rate-limit N istek/dk; en az ayrıcalık"],
  ["securityOptimization", "T bağımlılıkları pinli + SBOM üretimi CI'da; imzasız yapıt reddedilir"],
  ["mobileApps", "T yüzeyi responsive PWA; dokunma alanı Npx üstü tutulur, offline taslak"],
  ["mobileApps", "T cihaz matrisi: iOS/Android WebView + Chrome extension köprüsü; izin istemleri"],
  ["wcag", "T ekran yolunda klavye gezinme sırası ve görünür odak tanımlı; kontrast N:N"],
  ["wcag", "T için axe AAA taraması N ihlal kanıtıyla CI'da; ARIA etiketleri alan bazında"],
  [
    "deployment",
    "T çalışma hedefi Docker Swarm/KNs; env-config ayrımı + healthcheck probe tanımlı",
  ],
  ["deployment", "T rollback: önceki imaj etiketi ile N dk içinde geri dönüş"],
  [
    "integration",
    "T, kernel sözleşmesiyle tipli arayüz üzerinden konuşur; bağımlılık yönü yalnız aşağı",
  ],
  [
    "integration",
    "T olay yayını veriyolu üzerinden; sözleşme kırılırsa contract testi kırmızı yakar",
  ],
  [
    "testing",
    "T: unit + contract + negatif senaryo (yetkisiz erişim N kayıt) ayrımı; golden fixture",
  ],
  ["testing", "T e2e yolculuğu Playwright'ta; kırmızı→yeşil kanıtı PR'a bağlanır"],
  ["owasp", "T yüzeyinde AN erişim + AN injection karşı kontrolleri; girdi doğrulama zod"],
  ["owasp", "T negatif güvenlik testi kanıtı: yetki aşımı denemesi denetim izine düşer"],
  ["security", "T erişimi tenant-scoped + deny-by-default; değişmez audit izi zorunlu"],
  ["security", "T PII alanları maskeli; en az ayrıcalık rol matrisi tanımlı"],
];
for (const [dim, tpl] of ENRICH_TEMPLATES) knownSigs.add(`${dim}|${tpl.slice(0, 90)}`);
// enrich imzaları prefix-eşleşmeli de tanınsın:
const knownPrefixes = ENRICH_TEMPLATES.map(([dim, tpl]) => [dim, tpl.slice(0, 60)]);

const groups = new Map(); // sig -> [{id, dim, idx, item, base?}]
for (const { n } of Object.values(nodeCache)) {
  for (const [dim, card] of Object.entries(n.dimensions ?? {})) {
    (card?.items ?? []).forEach((item, idx) => {
      const base = baseByItem.get(`${n.id}|${dim}|${item}`);
      // base'li maddede imza EK kısmından üretilir (grup, eklenen kalıbı temsil eder);
      // base'siz maddede tam maddeden.
      const sigText = base ? item.slice(base.length).replace(/^[\s—-]+/, "") : item;
      const masked = mask(sigText, n.title);
      const sig = `${dim}|${masked}`;
      const known =
        knownSigs.has(sig) || knownPrefixes.some(([d, p]) => d === dim && masked.startsWith(p));
      if (!base && !known) return; // rewrite-katmanı dışı (miras/elyazımı/backfill) — dokunma
      if (!groups.has(sig)) groups.set(sig, []);
      groups.get(sig).push({ id: n.id, dim, idx, item, base });
    });
  }
}

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
