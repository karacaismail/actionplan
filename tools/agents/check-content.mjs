#!/usr/bin/env node
/**
 * check-content — tests/content/contentQuality.test.ts'in node karşılığı (vitest gerektirmez).
 * Sandbox'ta rollup/vitest koşmadığı için kapıyı bununla doğrularız; mantık testle aynı tutulur.
 * Kullanım: node tools/agents/check-content.mjs [cluster]   (cluster verilmezse hepsi)
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
const onlyCluster = process.argv[2];

const FORBIDDEN_MARKERS = [
  "net işlevsel sınır",
  "yaşam döngüsü + durum makinesi",
  "Girdi/çıktı sözleşmesi ve hata yolları",
  "ölü kod elemesi + kod bölme",
  "Döngüsel karmaşıklık eşiği + lint kapısı",
  "secret rotasyonu + en az ayrıcalık",
  "bileşik indeks + imleç sayfalama",
  "N+1 önleme + önbellek",
  "p95 gecikme hedefi ve ölçüm",
  "dokunma hedefi ≥44px",
  "label↔input + ARIA hata mesajı",
  "klavye gezinme + kontrast ≥7:1",
  "Görünür odak sırası + ekran okuyucu denetimi",
  "Docker Swarm + sağlık kontrolü",
  "HPA + liveness/readiness probe",
  "AI-destekli senaryo + testing-loop",
  "autonomous QA + golden fixture",
  "Güvenlik olay loglaması + denetim izi",
];
const ALLOWED_BOUNDARY = [
  "AI app/module",
  "ruleset override",
  "sub_prompt güvenilmez",
  "ArcheType taslağı",
  "Test döngüsü:",
];
const isAllowed = (s) => ALLOWED_BOUNDARY.some((b) => s.includes(b));

const DIMENSION_KEYS = [
  "featureDefs",
  "security",
  "codeOptimization",
  "securityOptimization",
  "performance",
  "mobileApps",
  "wcag",
  "deployment",
  "eca",
  "aiAgents",
  "testing",
  "owasp",
  "integration",
  "moduleUsage",
];

function terms(n) {
  return Array.from(
    new Set(
      `${n.title} ${(n.tags || []).join(" ")}`
        .toLowerCase()
        .split(/[^a-zçğıöşü0-9]+/i)
        .filter((w) => w.length >= 3),
    ),
  );
}

let nodes = fs
  .readdirSync(NODES)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(fs.readFileSync(path.join(NODES, f), "utf8")));
if (onlyCluster) nodes = nodes.filter((n) => n.source?.cluster === onlyCluster);

const filled = (n) =>
  DIMENSION_KEYS.map((k) => [k, n.dimensions?.[k]]).filter(
    ([, d]) => d && d.status !== "skeleton" && d.items.length > 0,
  );

const v = { marker: [], specific: [], format: [], repeat: [], dims: [] };
const counts = new Map();

for (const n of nodes) {
  if (Object.keys(n.dimensions || {}).length !== 14)
    v.dims.push(`${n.id}: ${Object.keys(n.dimensions || {}).length} boyut`);
  for (const [key, dim] of filled(n)) {
    // Biçim: 2-5 madde (altın düğümler 2 maddeyle de kaliteli); moduleUsage min 1 (yaprak/app düğümlerde meşru).
    const len = dim.items.length;
    const minLen = key === "moduleUsage" ? 1 : 2;
    if (len < minLen || len > 5) v.format.push(`${n.id}.${key}: ${len}`);
    // Sınır-dışı içerik: dolu boyutta yalnız zorunlu güvenlik-sınır satırı olamaz; en az 1 sayfaya-özel madde olmalı.
    let hasSubstantive = false;
    for (const item of dim.items) {
      if (isAllowed(item)) continue;
      counts.set(item, (counts.get(item) ?? 0) + 1);
      const hit = FORBIDDEN_MARKERS.find((m) => item.includes(m));
      if (hit) v.marker.push(`${n.id}.${key}: "${hit}"`);
      hasSubstantive = true;
    }
    if (!hasSubstantive) v.specific.push(`${n.id}.${key}`);
  }
}
for (const [item, c] of counts) if (c >= 5) v.repeat.push(`${c}× "${item.slice(0, 50)}"`);

const total =
  v.marker.length + v.specific.length + v.format.length + v.repeat.length + v.dims.length;
const scope = onlyCluster ? `cluster=${onlyCluster}` : "tüm düğümler";
console.log(`contentQuality kapısı (${scope}) — ${nodes.length} düğüm`);
for (const [k, label] of [
  ["marker", "yasak şablon imzası"],
  ["specific", "sınır-dışı içerik"],
  ["format", "2-5 madde biçimi"],
  ["repeat", "çapraz tekrar (≥5×)"],
  ["dims", "14 boyut"],
]) {
  const list = v[k];
  console.log(
    `  ${list.length === 0 ? "OK  " : "FAIL"} ${label}: ${list.length} ihlal${list.length ? `  →  ${list.slice(0, 8).join(" | ")}${list.length > 8 ? " ..." : ""}` : ""}`,
  );
}
console.log(total === 0 ? "\nSONUÇ: YEŞİL ✓" : `\nSONUÇ: KIRMIZI — toplam ${total} ihlal`);
process.exit(total === 0 ? 0 : 1);
