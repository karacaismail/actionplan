#!/usr/bin/env node
// Test döngüsü çalıştırıcısı — sıfır bağımlılık, ESM.
// Kullanım: node tools/test-loop.mjs "npm test"
// Verilen komutu en fazla 6 kez dener; ilk başarıda exit 0,
// 6 denemede de başarısızsa son çıktıyı özetleyip exit 1 döner.

import { spawn } from "node:child_process";

const MAKS_DENEME = 6;

// argv[2..] tek bir komut dizgesi olarak alınır (tırnak içinde gelebilir).
const komut = process.argv.slice(2).join(" ").trim();

if (!komut) {
  console.error('Kullanım: node tools/test-loop.mjs "<komut>"');
  console.error('Örnek:    node tools/test-loop.mjs "npm test"');
  process.exit(2);
}

// Komutu kabuk üzerinden çalıştırır; çıktıyı hem aktarır hem de yakalar.
function calistir(deneme) {
  return new Promise((resolve) => {
    console.log(`\n=== Deneme ${deneme}/${MAKS_DENEME}: ${komut} ===`);

    const cocuk = spawn(komut, {
      shell: true,
      stdio: ["inherit", "pipe", "pipe"],
    });

    let ciktiArabellegi = "";

    cocuk.stdout.on("data", (parca) => {
      const metin = parca.toString();
      ciktiArabellegi += metin;
      process.stdout.write(metin);
    });

    cocuk.stderr.on("data", (parca) => {
      const metin = parca.toString();
      ciktiArabellegi += metin;
      process.stderr.write(metin);
    });

    cocuk.on("error", (err) => {
      const metin = `Komut başlatılamadı: ${err.message}\n`;
      ciktiArabellegi += metin;
      process.stderr.write(metin);
      resolve({ kod: 1, cikti: ciktiArabellegi });
    });

    cocuk.on("close", (kod) => {
      resolve({ kod: kod ?? 1, cikti: ciktiArabellegi });
    });
  });
}

// Çıktının son satırlarını özetler (gürültüyü azaltmak için).
function sonSatirlar(metin, adet = 30) {
  const satirlar = metin.split(/\r?\n/);
  return satirlar.slice(-adet).join("\n");
}

async function main() {
  let sonCikti = "";

  for (let deneme = 1; deneme <= MAKS_DENEME; deneme++) {
    const { kod, cikti } = await calistir(deneme);
    sonCikti = cikti;

    if (kod === 0) {
      console.log(`\n✓ Deneme ${deneme}/${MAKS_DENEME} başarılı. (çıkış 0)`);
      process.exit(0);
    }

    console.log(`\n✗ Deneme ${deneme}/${MAKS_DENEME} başarısız (çıkış ${kod}).`);
  }

  console.log("\n--- Son denemenin çıktı özeti ---");
  console.log(sonSatirlar(sonCikti));
  console.log("\n6 denemede düzelmedi, raporlanıyor");
  process.exit(1);
}

main();
