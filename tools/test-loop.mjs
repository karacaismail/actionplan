#!/usr/bin/env node
// Test döngüsü çalıştırıcısı — sıfır bağımlılık, ESM.
// Kullanım: node tools/test-loop.mjs unit
// İzinli sabit görevi en fazla 6 kez dener; ilk başarıda exit 0,
// 6 denemede de başarısızsa son çıktıyı özetleyip exit 1 döner.

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MAKS_DENEME = 6;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TASK_ALLOWLIST = Object.freeze({
  typecheck: {
    executable: process.execPath,
    args: [path.join(ROOT, "node_modules", "typescript", "bin", "tsc"), "--noEmit"],
  },
  unit: {
    executable: process.execPath,
    args: [path.join(ROOT, "node_modules", "vitest", "vitest.mjs"), "run", "--run"],
  },
});
const MODEL_COMMAND_DENYLIST =
  /(^|[\s;&|()])(?:claude|codex|aider|anthropic|bedrock|vertex|foundry)(?=$|[\s;&|()=-])|ANTHROPIC_API_KEY|api\.anthropic\.com/i;
const taskKey = process.argv[2];
const task = TASK_ALLOWLIST[taskKey];

if (process.argv.length !== 3 || MODEL_COMMAND_DENYLIST.test(taskKey ?? "") || !task) {
  console.error(
    `[FAIL-CLOSED] Unknown QA task. Allowed tasks: ${Object.keys(TASK_ALLOWLIST).join(", ")}.`,
  );
  process.exit(2);
}

// Sabit executable + argv ile çalıştırır; kabuk, cwd ve ek argüman kullanıcıdan alınmaz.
function calistir(deneme) {
  return new Promise((resolve) => {
    console.log(`\n=== Deneme ${deneme}/${MAKS_DENEME}: ${taskKey} ===`);

    const cocuk = spawn(task.executable, task.args, {
      cwd: ROOT,
      shell: false,
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
