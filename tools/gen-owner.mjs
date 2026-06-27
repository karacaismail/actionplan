#!/usr/bin/env node
/**
 * gen-owner — sahiplik (owner) + köken-referansı (refs) DETERMİNİSTİK tohumlama (Faz P3).
 *
 * Bu nedir? Boş `owner` ve boş `refs` alanlarını, GERÇEK alan-sahipliği ve GERÇEK köken
 *   bilgisinden türeterek doldurur. Uydurma/jenerik içerik ÜRETMEZ.
 * Ne yapar?
 *   - owner boşsa: düğümün `source.cluster` değerini bir EKİBE (people.json) eşler. Her küme
 *     bir alandan sorumlu ekibe aittir; bu, "kim sorumlu" sorusunu kapatır (alan-bazlı sahiplik).
 *   - refs boşsa VE `source.originalId` varsa: refs = ["kaynak-korpus: <originalId>"] — yani
 *     düğümün hangi korpus öğesinden geldiğini (köken/provenance) kaydeder. GERÇEK izlenebilirlik.
 * Ne yapmaz?
 *   - Zaten dolu owner/refs alanlarına DOKUNMAZ (insan-küratör değeri korunur).
 *   - `source.originalId` olmayan (sentezlenmiş) düğümlere refs UYDURMAZ — boş kalır (dürüstlük).
 *   - Faz/boyut/PM içeriğini değiştirmez. Geriye uyumlu; yalnız owner + refs yazar.
 *
 * Sıra (npm script): gen:owner → gen:assignees → gen:deps → gen:reindex
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NODES = path.join(ROOT, "src", "data", "generated", "nodes");

/** Geçerli ekip kimlikleri — people.json ile SENKRON olmalı (gate doğrular). */
const VALID_TEAMS = new Set(
  JSON.parse(fs.readFileSync(path.join(ROOT, "src", "data", "people.json"), "utf8")).map(
    (p) => p.id,
  ),
);

/**
 * Küme → sorumlu ekip eşlemesi (alan-bazlı sahiplik).
 * Her küme tek bir ekibe atanır; ekip o alanın enterprise sahibidir.
 */
const CLUSTER_TEAM = {
  // Çekirdek / platform / altyapı / mimari-governance → Platform Ekibi
  kernel: "platform-ekibi",
  layer0: "platform-ekibi",
  layer1: "platform-ekibi",
  atomic: "platform-ekibi",
  crosscut: "platform-ekibi",
  cc: "platform-ekibi",
  scale: "platform-ekibi",
  "platform-horizontal": "platform-ekibi",
  backend: "platform-ekibi",
  frontend: "platform-ekibi",
  fe: "platform-ekibi",
  build: "platform-ekibi",
  dx: "platform-ekibi",
  sus: "platform-ekibi",
  meta: "platform-ekibi",
  genel: "platform-ekibi",
  kararlar: "platform-ekibi",
  // Satış / müşteri / operasyon çekirdeği → CRM Ekibi
  crm: "crm-ekibi",
  "customer-revenue": "crm-ekibi",
  "core-operations": "crm-ekibi",
  // Ürün / katalog / sürüm / dağıtım / dikey / aday → Katalog Ekibi
  edition: "katalog-ekibi",
  dist: "katalog-ekibi",
  vertical: "katalog-ekibi",
  aday: "katalog-ekibi",
  landx: "katalog-ekibi",
  // Veri & Zekâ
  "data-intelligence": "veri-ekibi",
  // İK
  hr: "ik-ekibi",
  // Finans
  finance: "finans-ekibi",
  // Tedarik
  "supply-chain": "tedarik-ekibi",
  // İçerik & eğitim
  "content-collaboration": "icerik-ekibi",
  edu: "icerik-ekibi",
  egitim: "icerik-ekibi",
};
const FALLBACK_TEAM = "platform-ekibi";

const files = fs.readdirSync(NODES).filter((f) => f.endsWith(".json"));
let ownerFilled = 0;
let refsFilled = 0;
const unknownClusters = new Set();

for (const f of files) {
  const p = path.join(NODES, f);
  const n = JSON.parse(fs.readFileSync(p, "utf8"));
  let changed = false;

  // owner boşsa VEYA geçerli bir ekip değilse (veri hatası): küme→ekip ile düzelt.
  if (!n.owner || !VALID_TEAMS.has(n.owner)) {
    const cluster = n.source?.cluster ?? "";
    const team = CLUSTER_TEAM[cluster];
    if (!team && cluster) unknownClusters.add(cluster);
    n.owner = team ?? FALLBACK_TEAM;
    ownerFilled++;
    changed = true;
  }

  if ((!Array.isArray(n.refs) || n.refs.length === 0) && n.source?.originalId) {
    n.refs = [`kaynak-korpus: ${n.source.originalId}`];
    refsFilled++;
    changed = true;
  }

  if (changed) fs.writeFileSync(p, `${JSON.stringify(n, null, 2)}\n`);
}

if (unknownClusters.size)
  console.warn(`[gen-owner] UYARI: eşlenmemiş küme(ler): ${[...unknownClusters].join(", ")}`);
console.log(
  `[gen-owner] owner tohumlanan: ${ownerFilled} · refs (köken) tohumlanan: ${refsFilled} · ` +
    `geçerli ekip sayısı: ${VALID_TEAMS.size}`,
);
