#!/usr/bin/env node
/**
 * check-i18n (ADR-0027 / 15. mühendislik standardı — BLOKLAYICI). i18n-standard kurallarını
 * MAKİNE-DOĞRULAR: (1) i18n-standards.json sözleşme kaynağı var + iyi-biçimli (yedi must kuralı,
 * banned/allowed listeleri, ICU/CLDR/i18n-text/fallback anahtarları); (2) `standardRefs.i18nRef`
 * set eden HER düğüm gerçek i18n standardına ("i18n-standards") çözülmeli (dangling ref yok);
 * (3) çevrilebilir metin alanları (i18n-text) locale-beyanlıdır — çeviri anahtarı formatı
 * (nokta-ayrık namespace, ham metin değil) doğrulanır. İhlalde exit 1.
 *
 * False-positive'den kaçınma: surface i18n alanı henüz zorunlu-şema DEĞİL; surface'lar yalnızca
 * UYARI olarak raporlanır (ratchet hedefi), fail üretmez. i18nRef boş (lazy) serbesttir. Kaynak
 * uyumlu/boşsa exit 0.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const v = [];
const fail = (m) => v.push(m);
const warns = [];
const rj = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

// --- 1: sözleşme kaynağı (i18n-standards.json) var + iyi-biçimli ---
const stdPath = path.join(ROOT, "src", "data", "standards", "i18n-standards.json");
let std = null;
if (!fs.existsSync(stdPath)) {
  fail("i18n-standards.json standardı yok (sözleşme kaynağı eksik)");
} else {
  std = rj(stdPath);
  if (std.id !== "i18n-standards")
    fail(`i18n-standards.json: id "i18n-standards" olmalı (bulundu "${std.id}")`);
  const rules = Array.isArray(std.rules) ? std.rules : [];
  // i18n'in yedi kritik ekseni: tam metin standart dokümanında; JSON en az bu kadar must taşımalı.
  if (rules.length < 7)
    fail(`i18n-standards.json: yedi i18n ekseni beklenir, ${rules.length} kural var`);
  for (const r of rules) {
    if (!r.id) fail("i18n-standards.json: kural id'siz");
    if (r.severity !== "must")
      fail(`i18n-standards.json: kural "${r.id}" severity=must olmalı (bulundu "${r.severity}")`);
    if (!r.rule || r.rule.length < 20)
      fail(`i18n-standards.json: kural "${r.id}" rule metni eksik/kısa`);
  }
  // banned/allowed anahtar sözlüğü: standardın locale/çeviri primitifleri beyan edilmiş olmalı.
  const banned = new Set(std.banned || []);
  const allowed = new Set(std.allowed || []);
  for (const key of ["hardcoded-user-string", "naive-datetime", "single-language-content-column"]) {
    if (!banned.has(key)) fail(`i18n-standards.json: banned listesinde "${key}" beklenir`);
  }
  for (const key of [
    "icu-messageformat",
    "cldr-formatting",
    "i18n-text-field",
    "locale-fallback-chain",
  ]) {
    if (!allowed.has(key)) fail(`i18n-standards.json: allowed listesinde "${key}" beklenir`);
  }
}

// --- 2: i18nRef şema anahtarı gerçek + düğüm referans bütünlüğü ---
const schemaPath = path.join(ROOT, "src", "schemas", "task.ts");
if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, "utf8");
  if (!/i18nRef\s*:/.test(schema)) fail("task.ts: StandardRefs şemasında i18nRef anahtarı yok");
}

const nodesDir = path.join(ROOT, "src", "data", "generated", "nodes");
let refCount = 0;
if (fs.existsSync(nodesDir)) {
  const files = fs.readdirSync(nodesDir).filter((f) => f.endsWith(".json"));
  for (const f of files) {
    const n = rj(path.join(nodesDir, f));
    const ref = n.standardRefs?.i18nRef;
    if (!ref) continue; // boş = lazy, serbest
    refCount++;
    // i18nRef yalnızca kanonik i18n standardına çözülmeli (uydurma/yanlış ref bloklanır).
    if (ref !== "i18n-standards")
      fail(`${n.id}: standardRefs.i18nRef "${ref}" çözülemiyor (beklenen "i18n-standards")`);
  }
}

// --- 3: çeviri anahtarı formatı (i18n-text alanları locale-beyanlı, ham metin değil) ---
// i18n-text = { locale -> değer } sözlüğü. BCP47-benzeri locale anahtarı zorunlu; çeviri anahtarı
// nokta-ayrık namespace (ör. "surface.list.title") olmalı, ham cümle DEĞİL.
const LOCALE = /^[a-z]{2}(-[A-Z]{2})?$/; // tr, en, tr-TR, ar-SA ...
const KEY = /^[a-z][a-z0-9]*(\.[a-z0-9-]+)+$/; // en.az.iki.parça, nokta-ayrık
const walkJson = (dir, cb) => {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) walkJson(fp, cb);
    else if (e.name.endsWith(".json")) cb(fp);
  }
};
let i18nTextFields = 0;
const inspectI18nText = (obj, where) => {
  if (obj == null || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    for (const el of obj) inspectI18nText(el, where);
    return;
  }
  // Konvansiyon: bir alan { type: "i18n-text", key?, values?/value? } biçimindeyse doğrula.
  if (obj.type === "i18n-text") {
    i18nTextFields++;
    if (obj.key != null && !KEY.test(String(obj.key)))
      fail(
        `${where}: i18n-text çeviri anahtarı "${obj.key}" format-dışı (nokta-ayrık namespace bekleniyor, ham metin değil)`,
      );
    const vals = obj.values ?? obj.value;
    if (vals && typeof vals === "object" && !Array.isArray(vals)) {
      const locales = Object.keys(vals);
      if (locales.length === 0)
        fail(`${where}: i18n-text alanı locale beyanı taşımıyor (boş values)`);
      for (const loc of locales)
        if (!LOCALE.test(loc))
          fail(`${where}: i18n-text locale anahtarı "${loc}" BCP47-benzeri değil`);
    } else if (obj.key == null) {
      fail(`${where}: i18n-text alanı ne locale-değer sözlüğü ne çeviri anahtarı taşıyor`);
    }
  }
  for (const val of Object.values(obj)) inspectI18nText(val, where);
};
walkJson(path.join(ROOT, "src", "data", "generated", "nodes"), (fp) =>
  inspectI18nText(rj(fp), path.relative(ROOT, fp)),
);

// --- 4 (advisory): surface i18n alanı — henüz zorunlu şema değil, yalnız uyarı ---
const surfCatalog = path.join(ROOT, "src", "data", "surface", "surface-catalog.json");
if (fs.existsSync(surfCatalog)) {
  const cat = rj(surfCatalog);
  const surfaces = Array.isArray(cat) ? cat : [];
  for (const sf of surfaces) {
    if (sf && sf.i18n === undefined)
      warns.push(`${sf.id ?? "?"}: surface i18n alanı yok (locale/RTL beyanı — ratchet hedefi)`);
  }
}

console.log(
  `i18n — sözleşme: ${std ? "var" : "YOK"}; kural: ${std?.rules?.length ?? 0}; i18nRef bağı: ${refCount} düğüm; i18n-text alanı: ${i18nTextFields}; ${warns.length} uyarı.`,
);
for (const w of warns.slice(0, 8)) console.log(`  ~ uyarı: ${w}`);
if (v.length === 0) {
  console.log("\nSONUÇ: YEŞİL ✓ (i18n standardı makine-doğrulandı)");
  process.exit(0);
}
console.log(`\nSONUÇ: KIRMIZI — ${v.length} ihlal`);
for (const m of v.slice(0, 40)) console.log(`  - ${m}`);
process.exit(1);
