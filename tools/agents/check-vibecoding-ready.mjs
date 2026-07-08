#!/usr/bin/env node
/**
 * check-vibecoding-ready - actionplan'in vibecoding/vobecoding handoff yuzeyini denetler.
 *
 * Bu kapı uygulama kodu yazmaz. Plan reposundaki export + workspace + dokuman
 * sozlesmesinin, bir kod ajanına verilecek kadar tutarlı kalmasını zorlar.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const rel = (...parts) => path.join(ROOT, ...parts);
const read = (...parts) => fs.readFileSync(rel(...parts), "utf8");
const readJson = (...parts) => JSON.parse(read(...parts));

const failures = [];
const requireText = (file, text, label = text) => {
  const content = read(file);
  if (!content.includes(text)) failures.push(`${file}: eksik ${label}`);
};
const forbidText = (file, text, label = text) => {
  const content = read(file);
  if (content.includes(text)) failures.push(`${file}: eski/yanlis ifade kaldi: ${label}`);
};

const manifest = readJson("src", "data", "workspace-manifest.json");
const primary = manifest.workspaces?.find((w) => w.id === manifest.primaryWorkspaceId);

if (manifest.schemaVersion !== "1.0.0")
  failures.push("workspace-manifest: schemaVersion 1.0.0 olmali");
if (!primary) failures.push("workspace-manifest: primary workspace bulunamadi");

if (primary) {
  if (primary.role !== "primary-implementation-repo") {
    failures.push("workspace-manifest: primary role primary-implementation-repo olmali");
  }
  if (!path.isAbsolute(primary.localPath)) {
    failures.push("workspace-manifest: localPath mutlak yol olmali");
  }
  if (!primary.branchPattern?.includes("<task-id>") || !primary.branchPattern?.includes("<slug>")) {
    failures.push("workspace-manifest: branchPattern task id ve slug placeholder tasimali");
  }
  for (const key of ["backend", "frontend", "sharedUi", "infra"]) {
    if (!primary.roots?.[key]) failures.push(`workspace-manifest: roots.${key} eksik`);
  }
  for (const stack of ["Next.js", "Supabase", "Prisma", "Redux", "Flowbite"]) {
    if (!primary.stack?.forbidden?.includes(stack)) {
      failures.push(`workspace-manifest: yasak stack eksik: ${stack}`);
    }
  }
  for (const bucket of ["setup", "defaultVerification"]) {
    if (!Array.isArray(primary.commands?.[bucket]) || primary.commands[bucket].length === 0) {
      failures.push(`workspace-manifest: commands.${bucket} bos olamaz`);
    }
  }
  for (const evidence of ["pull-request-url", "ci-run-url", "test-log", "manual-check-note"]) {
    if (!primary.evidence?.requiredForDone?.includes(evidence)) {
      failures.push(`workspace-manifest: evidence eksik: ${evidence}`);
    }
  }
}

for (const symbol of [
  "exportDeveloperBrief",
  "exportAgentPrompt",
  "exportEvidencePatch",
  "exportVobecoderCard",
  "exportTaskArtifact",
]) {
  requireText("src/engine/exportData.ts", `export function ${symbol}`, symbol);
  requireText("src/engine/index.ts", symbol, `engine index ${symbol}`);
}
requireText("src/engine/exportData.ts", "NO-GO for code-start", "code-start NO-GO");
requireText("src/engine/exportData.ts", "Do not use forbidden stack", "forbidden stack prompt");

for (const mode of [
  "developer-brief",
  "agent-prompt",
  "vobecoder-card",
  "evidence-patch",
  "raw-json",
]) {
  requireText("src/views/TaskDetailView.tsx", `"${mode}"`, `task detail mode ${mode}`);
}
requireText("src/views/TaskDetailView.tsx", "exportTaskArtifact", "TaskDetail exportTaskArtifact");

for (const key of [
  "exportDeveloperBrief",
  "exportAgentPrompt",
  "exportEvidencePatch",
  "exportVobecoderCard",
]) {
  requireText("src/data/strings.json", `"${key}"`, `strings.${key}`);
}

requireText("docs/task-export-contract.md", "Vobecoder Card", "Vobecoder Card sozlesmesi");
requireText("docs/task-export-contract.md", "app | ada", "doga metaforu seviye tablosu");
forbidText(
  "docs/task-export-contract.md",
  "export seçeneği eklenmesi ayrı bir iş olarak planlanmalıdır",
  "planlanmamis UI export ifadesi",
);
requireText(
  "docs/developer-guide.md",
  "implementation-workspace-manifest.md",
  "developer guide workspace manifest referansi",
);
requireText(
  "docs/README.md",
  "implementation-workspace-manifest.md",
  "docs index workspace manifest referansi",
);

console.log(
  `[vibecoding-ready] workspace=${primary?.id ?? "yok"} · export modes=5 · ihlal=${failures.length}`,
);

if (failures.length) {
  console.error("\nSONUÇ: KIRMIZI - vibecoding/vobecoding handoff sozlesmesi eksik:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("SONUÇ: YEŞİL - export + workspace + dokuman handoff sozlesmesi tutarli.");
