#!/usr/bin/env node
/**
 * check-market-readiness (BLOKLAYICI — global-market-readiness sözleşme kapısı, v1).
 * md→JSON entegrasyonu (JSON-STD J2): docs/global-market-readiness-directive.md anlatısının
 * makine kontratı src/data/standards/global-market-readiness.json'dur. Kapı dört katman denetler:
 * (a) sözleşme dosyası mevcut + geçerli JSON; (b) id/family doğru, altı zorunlu kural id'si
 * (launch-gate-14, ip-geolocation, kill-switch, payment-matrix, support-language, moderation)
 * mevcut ve her kuralda rule/rationale dolu; (c) indeks kayıtları — engineering-standards-index
 * ve standards/00-standards-index id'yi, standards-applicability-matrix marketReadinessRef
 * anahtarını içerir; (d) anlatı çapası — yönerge "global-market-readiness.json" metnini taşır.
 * v1 varlık+bütünlük denetimidir; pazar-başına evidence doğrulaması (14 soru cevabı, kill-switch
 * tatbikatı, ödeme matrisi kanıtı) veri doldukça dişlenir (bkz. docs/ci-conformance-gates.md).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const ID = "global-market-readiness";
const AILE = "governance";
const REF_ANAHTARI = "marketReadinessRef";
const SOZLESME_YOLU = `src/data/standards/${ID}.json`;
const ZORUNLU_KURALLAR = [
  "gmr-launch-gate-14",
  "gmr-ip-geolocation-not-identity",
  "gmr-market-kill-switch",
  "gmr-payment-market-matrix",
  "gmr-support-language-commitment",
  "gmr-moderation-per-locale",
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
    dosya: "docs/global-market-readiness-directive.md",
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
    `Market-readiness kapısı — ${SOZLESME_YOLU} geçerli: ${kurallar.length} kural (${ZORUNLU_KURALLAR.length} zorunlu id tam), ${METIN_PROBLARI.length} indeks/çapa probe'u bulundu. SONUÇ: YEŞİL ✓`,
  );
  process.exit(0);
}
console.log(`Market-readiness kapısı — SONUÇ: KIRMIZI — ${hatalar.length} ihlal`);
for (const hata of hatalar) console.log(`  - ${hata}`);
process.exit(1);
