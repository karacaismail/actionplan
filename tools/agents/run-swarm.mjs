#!/usr/bin/env node
/**
 * run-swarm — per-cluster bespoke içerik üretimini YEREL Claude Code ile paralel çalıştırır.
 * Cowork alt-ajanları socket-drop ettiği için swarm BU script ile kendi makinende koşulur.
 *
 * Kullanım:
 *   node tools/agents/run-swarm.mjs                  # tüm cluster'lar, concurrency 4
 *   node tools/agents/run-swarm.mjs kernel scale     # sadece bu cluster'lar
 *   node tools/agents/run-swarm.mjs --priority=1      # öncelik 1 cluster'lar
 *   node tools/agents/run-swarm.mjs --concurrency=6
 *   node tools/agents/run-swarm.mjs --dry-run         # komutları yazdır, çalıştırma
 *   CLAUDE_BIN=claude node tools/agents/run-swarm.mjs --model=claude-sonnet-4-6
 *
 * Gerekler: yerelde `claude` (Claude Code) kurulu + giriş yapılmış. Repo klonlu.
 * Güvenli: her ajan yalnız KENDİ cluster'ının JSON'larını düzenler (izole). Sonunda reindex.
 * Doğrulama: bitince `npm run typecheck && npm test && npm run test:content && npm run build`.
 * Provenance: ajan ürettiği boyutlara `provenance:"swarm"` damgalar; `provenance:"human"` düğümlere dokunmaz.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..", "..");
const LOGS = path.join(__dirname, "logs");

const shards = JSON.parse(fs.readFileSync(path.join(__dirname, "shards.json"), "utf8")).clusters;
const template = fs.readFileSync(path.join(__dirname, "prompt-template.md"), "utf8");

const argv = process.argv.slice(2);
const flags = {};
const clustersArg = [];
for (const a of argv) {
  if (a.startsWith("--")) {
    const [k, v] = a.slice(2).split("=");
    flags[k] = v ?? true;
  } else clustersArg.push(a);
}
const CONCURRENCY = Number(flags.concurrency ?? 3);
const DRY = Boolean(flags["dry-run"]);
const MODEL = flags.model;
const CLAUDE = process.env.CLAUDE_BIN ?? "claude";

let selected = shards;
if (clustersArg.length) selected = shards.filter((s) => clustersArg.includes(s.cluster));
else if (flags.priority)
  selected = shards.filter((s) => String(s.oncelik) === String(flags.priority));

fs.mkdirSync(LOGS, { recursive: true });

const render = (cl) =>
  template.replaceAll("{{CLUSTER}}", cl.cluster).replaceAll("{{CLUSTER_TR}}", cl.tr);

function runOne(cl) {
  return new Promise((resolve) => {
    const prompt = render(cl);
    const promptFile = path.join(LOGS, `${cl.cluster}.prompt.md`);
    fs.writeFileSync(promptFile, prompt);
    const claudeArgs = [
      "-p",
      "--permission-mode",
      "acceptEdits",
      "--allowedTools",
      "Read",
      "Edit",
      "Write",
      "Bash",
    ];
    if (MODEL) claudeArgs.push("--model", String(MODEL));
    if (DRY) {
      console.log(
        `[dry-run] ${cl.cluster}: ${CLAUDE} ${claudeArgs.join(" ")}  (prompt: ${promptFile})`,
      );
      return resolve({ cluster: cl.cluster, code: 0, dry: true });
    }
    const log = fs.createWriteStream(path.join(LOGS, `${cl.cluster}.log`));
    console.log(`[başla] ${cl.cluster} (${cl.count} düğüm)`);
    const child = spawn(CLAUDE, claudeArgs, { cwd: REPO });
    child.stdout.pipe(log);
    child.stderr.pipe(log);
    child.stdin.write(prompt);
    child.stdin.end();
    child.on("close", (code) => {
      console.log(
        `[bitti] ${cl.cluster} (exit ${code}) → log: tools/agents/logs/${cl.cluster}.log`,
      );
      resolve({ cluster: cl.cluster, code });
    });
    child.on("error", (e) => {
      console.log(`[hata] ${cl.cluster}: ${e.message} (claude kurulu mu? CLAUDE_BIN?)`);
      resolve({ cluster: cl.cluster, code: 1 });
    });
  });
}

async function pool(items, n, fn) {
  const results = [];
  let i = 0;
  const worker = async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, worker));
  return results;
}

console.log(
  `Swarm: ${selected.length} cluster · concurrency ${CONCURRENCY}${DRY ? " · DRY-RUN" : ""}\n${selected.map((s) => `  - ${s.cluster} (${s.count})`).join("\n")}`,
);
const res = await pool(selected, CONCURRENCY, runOne);

if (!DRY) {
  console.log("\nReindex (index/navigation/meta + wbsCode)...");
  await new Promise((r) =>
    spawn("node", [path.join(REPO, "tools", "reindex.mjs")], { cwd: REPO, stdio: "inherit" }).on(
      "close",
      r,
    ),
  );
  const fail = res.filter((r) => r.code !== 0).map((r) => r.cluster);
  console.log(
    `\nTamam. Başarısız cluster: ${fail.length ? fail.join(", ") : "yok"}.\nDoğrula: npm run typecheck && npm test && npm run test:content && npm run build`,
  );
}
