// pattern-layer — rewrite-katmanı grup envanteri (TEK KAYNAK, W4.1).
//
// Neden var? W4 denetiminde ölçüm-uygulama sapması bulundu: append dalgası
// normalize'dan SONRA koşunca rewrite-katmanı yeniden şişti ama rapor bayat
// ölçüme dayanıyordu. Bu modül gruplama mantığını tekilleştirir:
// normalize-patterns (yazıcı) ve check-weak-content (CI ratchet) AYNI
// fonksiyonu kullanır — kapıdaki sayı ile aracın gördüğü sayı ayrışamaz.
//
// Kapsam: W2-W4 rewrite ekleri (mapping'te base'i kayıtlı maddeler) +
// havuz/enrich imzalı şablon maddeleri. Miras generator şablonları, day-2
// backfill temel katmanı ve bilinçli-üniform sınır satırları KAPSAM DIŞI.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { poolsFor } from "./pattern-pools.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

// enrich-weak-nodes (v1) extras şablon imzaları — rewrite-katmanının parçasıdır.
export const ENRICH_TEMPLATES = [
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

export const maskItem = (text, title) =>
  text.split(title).join("T").replace(/\d+/g, "N").slice(0, 90);

export function loadRewriteLayer() {
  const NODES = path.join(ROOT, "src", "data", "generated", "nodes");
  const MAP_PATH = path.join(ROOT, "reports", "short-items-wave2-mapping.json");
  const nodeCache = {};
  for (const f of fs.readdirSync(NODES).filter((x) => x.endsWith(".json"))) {
    const n = JSON.parse(fs.readFileSync(path.join(NODES, f), "utf8"));
    nodeCache[n.id] = { f, n };
  }
  const mapRecs = fs.existsSync(MAP_PATH)
    ? JSON.parse(fs.readFileSync(MAP_PATH, "utf8")).mapping
    : [];
  const baseByItem = new Map(); // node|dim|tamMadde -> orijinal kısa base
  for (const r of mapRecs)
    baseByItem.set(`${r.node}|${r.dimension}|${r.yeni}`, r.eski.trim().replace(/[.;]\s*$/, ""));
  const knownSigs = new Set();
  for (const { n } of Object.values(nodeCache)) {
    const pools = poolsFor(n);
    for (const [dim, arr] of Object.entries(pools))
      for (const v of arr) knownSigs.add(`${dim}|${maskItem(v, n.title)}`);
  }
  for (const [dim, tpl] of ENRICH_TEMPLATES) knownSigs.add(`${dim}|${tpl.slice(0, 90)}`);
  const knownPrefixes = ENRICH_TEMPLATES.map(([dim, tpl]) => [dim, tpl.slice(0, 60)]);
  const groups = new Map(); // sig -> [{id, dim, idx, item, base?}]
  for (const { n } of Object.values(nodeCache)) {
    for (const [dim, card] of Object.entries(n.dimensions ?? {})) {
      (card?.items ?? []).forEach((item, idx) => {
        const base = baseByItem.get(`${n.id}|${dim}|${item}`);
        // base'li maddede imza EK kısmından üretilir; base'siz maddede tam maddeden.
        const sigText = base ? item.slice(base.length).replace(/^[\s—-]+/, "") : item;
        const masked = maskItem(sigText, n.title);
        const sig = `${dim}|${masked}`;
        const known =
          knownSigs.has(sig) || knownPrefixes.some(([d, p]) => d === dim && masked.startsWith(p));
        if (!base && !known) return; // rewrite-katmanı dışı — dokunma
        if (!groups.has(sig)) groups.set(sig, []);
        groups.get(sig).push({ id: n.id, dim, idx, item, base });
      });
    }
  }
  return { nodeCache, mapRecs, baseByItem, groups, NODES, MAP_PATH };
}

export function rewriteLayerStats(groups) {
  const counts = [...groups.values()].map((a) => a.length);
  return {
    distinct: groups.size,
    tenPlus: counts.filter((c) => c >= 10).length,
    maxGroup: counts.length ? Math.max(...counts) : 0,
  };
}
