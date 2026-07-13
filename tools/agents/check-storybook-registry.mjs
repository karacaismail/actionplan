#!/usr/bin/env node
/**
 * check-storybook-registry (BLOKLAYICI — Storybook kök-entegrasyon registry'leri).
 * src/data/storybook/ altındaki 16 kanonik registry dosyasını hafif JS doğrulamasıyla denetler.
 * Şema kaynağı src/schemas/storybook-registry.ts'tir (zod); bu .mjs kapısı TS import edemez,
 * bu yüzden kural aynası buradadır — fark bulunursa şema kazanır, bu ayna düzeltilir
 * (dimension-semantics "birebir ayna" deseni). BOŞ records GEÇERLİDİR: kayıtlar migration
 * dalgalarıyla dolar, uydurma kayıt girilmez (gap-report §5).
 * Denetimler: {note, records[]} sarmalayıcı; master-components mc.* id + duplicate reddi;
 * story-catalog.componentRef ve deprecation-migrations old/new refs → master id FK;
 * ui-artifact-roles rol/FK/karar-provenance bütünlüğü. Kaynak:
 * docs/storybook-root-integration-gap-report.md §5.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateUiArtifactRoleRecords } from "../lib/storybook-registry-validation.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const DIR = path.join(ROOT, "src", "data", "storybook");
const NODE_DIR = path.join(ROOT, "src", "data", "generated", "nodes");

/** 16 kanonik registry (gap-report §5); eksik dosya da fazladan dosya da ihlaldir. */
const KANONIK = [
  "addon-allowlist.json",
  "component-consumers.json",
  "deprecation-migrations.json",
  "evidence-manifest.json",
  "field-widget-map.json",
  "fixture-contracts.json",
  "legacy-ratchet.json",
  "master-components.json",
  "ownership.json",
  "publish-security-policy.json",
  "story-catalog.json",
  "story-coverage-policy.json",
  "surface-component-map.json",
  "ui-artifact-roles.json",
  "version-compatibility.json",
  "visual-baseline-governance.json",
];

const MASTER_ID = /^mc\.[a-z0-9-]+$/;

const v = [];
const dosyalar = {};

// ── Sarmalayıcı denetimi: her dosya { note: string, records: [] } yapısında olmalı.
for (const ad of KANONIK) {
  const p = path.join(DIR, ad);
  if (!fs.existsSync(p)) {
    v.push(`${ad}: kanonik registry dosyası yok`);
    continue;
  }
  let icerik;
  try {
    icerik = JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    v.push(`${ad}: JSON parse hatası — ${e.message}`);
    continue;
  }
  if (icerik === null || typeof icerik !== "object" || Array.isArray(icerik)) {
    v.push(`${ad}: kök değer {note, records[]} nesnesi olmalı`);
    continue;
  }
  if (typeof icerik.note !== "string" || icerik.note.trim() === "")
    v.push(`${ad}: note alanı (insan-okur, boş olmayan string) zorunlu`);
  if (!Array.isArray(icerik.records)) {
    v.push(`${ad}: records dizisi zorunlu (boş dizi geçerlidir)`);
    continue;
  }
  dosyalar[ad] = icerik;
}

// Kanonik liste dışına registry sızması (17. dosya) bilinçli karar ister → ihlal.
const mevcutlar = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => f.endsWith(".json")) : [];
for (const f of mevcutlar) {
  if (!KANONIK.includes(f)) v.push(`${f}: kanonik 16 registry listesinde yok (gap-report §5)`);
}

const kayitlar = (ad) => dosyalar[ad]?.records ?? [];

// ── master-components: mc.* id biçimi + duplicate reddi (U5/U20).
const masterIdler = new Set();
for (const [i, r] of kayitlar("master-components.json").entries()) {
  const id = r?.id;
  if (typeof id !== "string" || !MASTER_ID.test(id)) {
    v.push(
      `master-components.json[${i}]: id 'mc.[a-z0-9-]+' biçiminde olmalı: ${JSON.stringify(id)}`,
    );
    continue;
  }
  if (masterIdler.has(id)) v.push(`master-components.json[${i}]: duplicate master id: ${id}`);
  masterIdler.add(id);
}

// ── story-catalog: componentRef → master-components FK (U15; kayıt varsa denetlenir).
for (const [i, r] of kayitlar("story-catalog.json").entries()) {
  const ref = r?.componentRef;
  if (typeof ref !== "string" || ref.trim() === "")
    v.push(`story-catalog.json[${i}]: componentRef zorunlu`);
  else if (!masterIdler.has(ref))
    v.push(`story-catalog.json[${i}]: componentRef FK kırık — master-components'te yok: ${ref}`);
}

// ── deprecation-migrations: old/new component refs → master-components FK (gap §5).
for (const [i, r] of kayitlar("deprecation-migrations.json").entries()) {
  for (const alan of ["oldComponentRef", "newComponentRef"]) {
    const ref = r?.[alan];
    if (typeof ref !== "string" || ref.trim() === "")
      v.push(`deprecation-migrations.json[${i}]: ${alan} zorunlu`);
    else if (!masterIdler.has(ref))
      v.push(
        `deprecation-migrations.json[${i}]: ${alan} FK kırık — master-components'te yok: ${ref}`,
      );
  }
}

// ── ui-artifact-roles: node FK + duplicate + rol + karar provenance (U16; gap §3).
const nodeIdler = new Set();
if (!fs.existsSync(NODE_DIR)) {
  v.push("ui-artifact-roles.json: generated WBS node dizini yok");
} else {
  for (const file of fs
    .readdirSync(NODE_DIR)
    .filter((name) => name.endsWith(".json"))
    .sort()) {
    try {
      const node = JSON.parse(fs.readFileSync(path.join(NODE_DIR, file), "utf8"));
      if (typeof node?.id !== "string" || node.id.trim() === "") {
        v.push(`src/data/generated/nodes/${file}: id zorunlu`);
      } else if (nodeIdler.has(node.id)) {
        v.push(`src/data/generated/nodes/${file}: duplicate WBS node id: ${node.id}`);
      } else {
        nodeIdler.add(node.id);
      }
    } catch (error) {
      v.push(`src/data/generated/nodes/${file}: JSON parse hatası — ${error.message}`);
    }
  }
}
v.push(...validateUiArtifactRoleRecords(kayitlar("ui-artifact-roles.json"), nodeIdler));

const toplamKayit = Object.values(dosyalar).reduce((acc, d) => acc + d.records.length, 0);
console.log(
  `Storybook registry kapısı — ${KANONIK.length} kanonik dosya, ${Object.keys(dosyalar).length} okundu; ${toplamKayit} kayıt (boş = iskelet fazı, geçerli); ${masterIdler.size} master id.`,
);

if (v.length === 0) {
  console.log("\nSONUÇ: YEŞİL ✓");
  process.exit(0);
}
console.log(`\nSONUÇ: KIRMIZI — ${v.length} ihlal`);
for (const m of v.slice(0, 40)) console.log(`  - ${m}`);
process.exit(1);
