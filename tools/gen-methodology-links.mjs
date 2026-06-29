#!/usr/bin/env node
/**
 * gen-methodology-links — metodoloji nodlarını YENİ kanonik runbook dokümanlarına bağlar (DX).
 *
 * Boşluk: build ve edu nodları "NASIL"ı isimlendiriyordu ama içeriğe (gerçek adım/komut/prompt)
 * işaret etmiyordu. Artık o içerik docs/ altında gerçek dokümanlar olarak var. Bu script, ilgili
 * nodların refs'ine kanonik doküman bağını ekler ve OrderOps↔CRM "ilk dilim" çelişkisini çözer.
 * Yalnız refs alanını günceller (append + dedup).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NODES = path.join(ROOT, "src", "data", "generated", "nodes");

const LINKS = {
  "edu-baslangic-rotasi": ["rehber: docs/developer-guide.md (Gün-1 + yürütme döngüsü)"],
  "edu-prompt-kutuphanesi": ["prompt sözleşmesi: docs/task-export-contract.md (3 export modu)"],
  "build-iterasyon-ritueli": ["döngü: docs/developer-guide.md (Üret-Eleştir-İşlet adımları)"],
  "build-sequence": [
    "çekirdek sözleşme: docs/core-contract-pack.md",
    "task↔kod semantiği: docs/task-to-code-contract.md",
  ],
  "build-referans-uygulama": [
    "NOT: kanonik canlı ilk dikey dilim Customer'dır (platform-customer-*); OrderOps öğretici referans örnektir — bkz docs/developer-workflow-gap-analysis.md",
  ],
  "build-app-katalogu": ["fabrika dalga planı: docs/developer-workflow-gap-analysis.md (Wave 0-4)"],
};

let count = 0;
for (const [id, refs] of Object.entries(LINKS)) {
  const p = path.join(NODES, `${id}.json`);
  if (!fs.existsSync(p)) {
    console.warn(`[gen-methodology-links] node yok: ${id}`);
    continue;
  }
  const n = JSON.parse(fs.readFileSync(p, "utf8"));
  const cur = Array.isArray(n.refs) ? n.refs : [];
  n.refs = [...new Set([...cur, ...refs])];
  fs.writeFileSync(p, `${JSON.stringify(n, null, 2)}\n`);
  count++;
}
console.log(
  `[gen-methodology-links] ${count} metodoloji nodu kanonik dokümanlara bağlandı (refs).`,
);
