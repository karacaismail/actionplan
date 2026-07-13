#!/usr/bin/env node
/**
 * check-finance-model (BLOKLAYICI — finance-money-model sözleşme kapısı, v1).
 * md→JSON entegrasyonu (JSON-STD J2): docs/financial-state-model-contract.md anlatısının
 * makine kontratı src/data/standards/finance-money-model.json'dur. Kapı dört katman denetler:
 * (a) sözleşme dosyası mevcut + geçerli JSON; (b) id/family doğru, altı zorunlu kural id'si
 * (decimal+ISO 4217, iki-ondalık varsayımı yasağı, üç para-birimi ayrımı, kur tarihi beyanı,
 * yuvarlama politikası, altı finansal durum) mevcut ve her kuralda rule/rationale dolu;
 * (c) indeks kayıtları — engineering-standards-index ve standards/00-standards-index id'yi,
 * standards-applicability-matrix financeModelRef anahtarını içerir; (d) anlatı çapası —
 * contract "finance-money-model.json" metnini taşır. v1 varlık+bütünlük denetimidir; para
 * alanı taraması (float/iki-ondalık deseni, kod+ölçek beyanı) veri doldukça dişlenir
 * (bkz. docs/ci-conformance-gates.md).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const ID = "finance-money-model";
const AILE = "data";
const REF_ANAHTARI = "financeModelRef";
const SOZLESME_YOLU = `src/data/standards/${ID}.json`;
const ZORUNLU_KURALLAR = [
  "fin-money-decimal-iso4217",
  "fin-no-two-decimal-assumption",
  "fin-three-currency-separation",
  "fin-fx-date-declaration",
  "fin-rounding-policy",
  "fin-financial-state-six",
];
const METIN_PROBLARI = [
  { dosya: "docs/engineering-standards-index.md", beklenen: ID, etiket: "indeks kaydı" },
  { dosya: "docs/standards/00-standards-index.md", beklenen: ID, etiket: "indeks kaydı" },
  {
    dosya: "docs/standards-applicability-matrix.md",
    beklenen: REF_ANAHTARI,
    etiket: "matris ref anahtarı",
  },
  {
    dosya: "docs/financial-state-model-contract.md",
    beklenen: `${ID}.json`,
    etiket: "anlatı çapası",
  },
];

const hatalar = [];

let sozlesme = null;
const tamYol = path.join(ROOT, SOZLESME_YOLU);
if (!fs.existsSync(tamYol)) {
  hatalar.push(`sözleşme dosyası yok: ${SOZLESME_YOLU}`);
} else {
  try {
    sozlesme = JSON.parse(fs.readFileSync(tamYol, "utf8"));
  } catch (hata) {
    hatalar.push(`sözleşme JSON olarak parse edilemiyor: ${SOZLESME_YOLU} — ${hata.message}`);
  }
}

const kurallar = Array.isArray(sozlesme?.rules) ? sozlesme.rules : null;
if (sozlesme) {
  if (sozlesme.id !== ID) hatalar.push(`id yanlış: "${sozlesme.id}" (beklenen "${ID}")`);
  if (sozlesme.family !== AILE)
    hatalar.push(`family yanlış: "${sozlesme.family}" (beklenen "${AILE}")`);
  if (!kurallar) hatalar.push("rules alanı yok veya dizi değil");
}
if (kurallar) {
  const mevcutIdler = new Set(kurallar.map((kural) => kural?.id));
  for (const kuralId of ZORUNLU_KURALLAR)
    if (!mevcutIdler.has(kuralId)) hatalar.push(`zorunlu kural eksik: ${kuralId}`);
  for (const kural of kurallar) {
    const kuralAdi = kural?.id || "(id'siz kural)";
    if (typeof kural?.rule !== "string" || kural.rule.trim() === "")
      hatalar.push(`${kuralAdi}: rule metni boş`);
    if (typeof kural?.rationale !== "string" || kural.rationale.trim() === "")
      hatalar.push(`${kuralAdi}: rationale boş`);
  }
}

for (const { dosya, beklenen, etiket } of METIN_PROBLARI) {
  const dosyaYolu = path.join(ROOT, dosya);
  if (!fs.existsSync(dosyaYolu)) {
    hatalar.push(`${etiket} dosyası yok: ${dosya}`);
    continue;
  }
  if (!fs.readFileSync(dosyaYolu, "utf8").includes(beklenen))
    hatalar.push(`${dosya}: ${etiket} eksik — "${beklenen}" bulunamadı`);
}

if (hatalar.length === 0) {
  console.log(
    `Finans para-modeli kapısı — ${SOZLESME_YOLU} geçerli: ${kurallar.length} kural (${ZORUNLU_KURALLAR.length} zorunlu id tam), ${METIN_PROBLARI.length} indeks/çapa probe'u bulundu. SONUÇ: YEŞİL ✓`,
  );
  process.exit(0);
}
console.log(`Finans para-modeli kapısı — SONUÇ: KIRMIZI — ${hatalar.length} ihlal`);
for (const hata of hatalar) console.log(`  - ${hata}`);
process.exit(1);
