#!/usr/bin/env node
/**
 * gen-rollback — her düğüme seviyeye-uygun rollback (geri-alma) stratejisi yazar (waterfall tamlık).
 *
 * ChatGPT eksik-raporu: rollback yalnız 13 düğümde dolu. Enterprise/waterfall için her iş paketinin
 * geri-alma planı (ya da "neden gerekmez" notu) olmalı. Seviyeye göre dürüst metin üretir:
 *  - app/module: dağıtım-seviyesi geri alma (önceki imaj/sürüm + reversible migration/snapshot).
 *  - archetype: özellik bayrağı + son kararlı taslağa dönüş (üretim verisi append-only korunur).
 *  - stone/molecule/element/atom: bağımsız dağıtılmaz; ebeveyn rollback'ine tabidir ("gerekmez" gerekçesi).
 * Yalnız boş rollback'leri doldurur (elle yazılmışları korur).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NODES = path.join(ROOT, "src", "data", "generated", "nodes");

const BY_LEVEL = {
  app: "Sürüm geri alma: son sağlıklı imaja/tag'e dön ve Pages/servisi yeniden yayınla; veri için reversible migration veya snapshot geri yükleme uygulanır.",
  module:
    "Modülü özellik bayrağıyla devre dışı bırak ya da önceki sürüme revert et; şema değişikliği expand-contract ile geri-uyumlu, gerekirse downgrade migration çalıştırılır.",
  archetype:
    "Özellik bayrağını kapat ve son kararlı archetype taslağına dön; üretim verisi append-only korunduğu için kayıp olmaz.",
  stone:
    "Bağımsız dağıtılmayan alt birim; geri alma ebeveyn archetype/module rollback'ine tabidir (ayrı geri-alma gerekmez).",
  molecule:
    "Bağımsız dağıtılmayan alt birim; geri alma ebeveyn archetype/module rollback'ine tabidir (ayrı geri-alma gerekmez).",
  element:
    "Bağımsız dağıtılmayan alt birim; geri alma ebeveyn archetype/module rollback'ine tabidir (ayrı geri-alma gerekmez).",
  atom: "Bağımsız dağıtılmayan atomik birim; geri alma ebeveyn element/archetype rollback'ine tabidir (ayrı geri-alma gerekmez).",
};

const files = fs.readdirSync(NODES).filter((f) => f.endsWith(".json"));
let count = 0;
for (const f of files) {
  const p = path.join(NODES, f);
  const n = JSON.parse(fs.readFileSync(p, "utf8"));
  if (n.rollback) continue; // elle yazılmışı koru
  n.rollback = BY_LEVEL[n.level] ?? BY_LEVEL.stone;
  fs.writeFileSync(p, `${JSON.stringify(n, null, 2)}\n`);
  count++;
}
console.log(`[gen-rollback] ${count} düğüme seviyeye-uygun rollback yazıldı.`);
