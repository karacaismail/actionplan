#!/usr/bin/env node
/**
 * check-delivery-sequence — kernel -> SDK -> app-core -> app-modules -> app handoff kapisi.
 *
 * Bu repo platform kodu uretmez; baska projenin waterfall tanimini ve gelistirici
 * handoff sozlesmesini tutar. Bu kapi, teknik teslim sirasinin dokumanlardan,
 * workspace manifestten, export prompttan ve CI zincirinden dusmesini engeller.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const failures = [];

function rel(...parts) {
  return path.join(ROOT, ...parts);
}

function read(file) {
  return fs.readFileSync(rel(file), "utf8");
}

function readJson(file) {
  return JSON.parse(read(file));
}

function fail(message) {
  failures.push(message);
}

function requireText(file, text, label = text) {
  const content = read(file);
  if (!content.includes(text)) fail(`${file}: eksik ${label}`);
}

function forbidPattern(file, pattern, label) {
  const content = read(file);
  if (pattern.test(content)) fail(`${file}: eski/celiskili ifade kaldi: ${label}`);
}

const directive = "docs/kernel-sdk-app-delivery-sequence.md";
const report = "docs/kernel-sdk-app-sequence-gap-report-2026-07-08.md";

for (const file of [directive, report]) {
  if (!fs.existsSync(rel(file))) fail(`${file}: yok`);
}

for (const text of [
  "Kernel gelistirilir.",
  "Kernelin public sozlesmelerinden SDK gelistirilir.",
  "SDK ile app'e ozgu core module gelistirilir.",
  "App-core sonrasinda app'in ihtiyac duydugu diger module'ler gelistirilir.",
  "App, module'lerin release train/kompozisyon etiketi olarak paketlenir.",
  "App-core generic kernel degildir.",
  "App assembly asamasinda yeni is mantigi yazilmaz.",
  "packages/sdk",
  "apps/api/platform_<app_slug>_core",
]) {
  requireText(directive, text);
}

for (const file of [
  "docs/task-to-code-contract.md",
  "docs/developer-guide.md",
  "docs/waterfall-developer-handoff.md",
  "docs/core-contract-pack.md",
  "docs/app-distribution-contract.md",
  "docs/implementation-workspace-manifest.md",
  "docs/README.md",
]) {
  requireText(file, "kernel-sdk-app-delivery-sequence.md", "delivery sequence referansi");
}

requireText(
  "docs/task-to-code-contract.md",
  "app-core module hazır olmadan app module development başlatılmaz",
  "task-to-code app-core gate",
);
requireText(
  "docs/developer-guide.md",
  "SDK ile app'e özgü core module geliştirilir",
  "developer guide sequence",
);
requireText(
  "docs/waterfall-developer-handoff.md",
  "App-core hazır değilse app'in diğer module'leri development'a alınmaz",
  "waterfall app-core gate",
);
requireText("docs/app-distribution-contract.md", "İlk kayıt app-core module olmalıdır");
requireText("docs/core-contract-pack.md", "packages/sdk/");
requireText("docs/implementation-workspace-manifest.md", "packages/sdk");

for (const file of ["docs/core-contract-pack.md", "docs/app-distribution-contract.md"]) {
  forbidPattern(file, /\bbackend\//, "backend/ eski kok yolu");
  forbidPattern(file, /\bfrontend\//, "frontend/ eski kok yolu");
  forbidPattern(file, /frontend\/apps\//, "frontend/apps eski kok yolu");
}

const manifest = readJson("src/data/workspace-manifest.json");
const primary = manifest.workspaces?.find(
  (workspace) => workspace.id === manifest.primaryWorkspaceId,
);
if (!primary) {
  fail("workspace-manifest: primary workspace yok");
} else if (primary.roots?.sdk !== "packages/sdk") {
  fail(`workspace-manifest: roots.sdk packages/sdk olmali, bulunan ${primary.roots?.sdk}`);
}

requireText("src/engine/exportData.ts", "- SDK root:", "agent prompt SDK root");
requireText("tools/agents/check-vibecoding-ready.mjs", '"sdk"', "vibecoding root sdk check");
requireText(
  "tools/agents/check-core-contract.mjs",
  "apps\\/api\\/platform_sdk",
  "core contract sdk path",
);
requireText("package.json", '"qa:delivery-sequence"', "package qa:delivery-sequence");
requireText("package.json", "npm run qa:delivery-sequence", "qa:ci delivery-sequence");
requireText(".github/workflows/deploy.yml", "Teslim sırası kapısı", "workflow delivery step");
requireText(
  "docs/ci-conformance-gates.md",
  "check-delivery-sequence",
  "ci katalog delivery kapisi",
);

console.log(
  `[delivery-sequence] dokuman=1 · workspace=${primary?.id ?? "yok"} · ihlal=${failures.length}`,
);

if (failures.length) {
  console.error("\nSONUC: KIRMIZI X — kernel/SDK/app-core/app-module sirasi eksik veya celiskili:");
  for (const failure of failures.slice(0, 60)) console.error(`  - ${failure}`);
  if (failures.length > 60) console.error(`  ... +${failures.length - 60}`);
  process.exit(1);
}

console.log("SONUC: YESIL OK — teslim sirasi kanonik ve bagli.");
