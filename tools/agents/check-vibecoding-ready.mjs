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
const requireContent = (scope, content, text, label = text) => {
  if (!content.includes(text)) failures.push(`${scope}: eksik ${label}`);
};
const forbidText = (file, text, label = text) => {
  const content = read(file);
  if (content.includes(text)) failures.push(`${file}: eski/yanlis ifade kaldi: ${label}`);
};
const forbidContent = (file, content, text, label = text) => {
  if (content.includes(text)) failures.push(`${file}: eski/yanlis ifade kaldi: ${label}`);
};
const forbidPatternInLines = (file, content, pattern, label) => {
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    pattern.lastIndex = 0;
    if (pattern.test(lines[i])) {
      failures.push(`${file}:${i + 1}: eski/yanlis ifade kaldi: ${label}`);
    }
  }
};
const listMarkdownFiles = (dir) => {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...listMarkdownFiles(fullPath));
    else if (entry.isFile() && entry.name.endsWith(".md")) files.push(fullPath);
  }
  return files;
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
  for (const key of ["backend", "frontend", "sdk", "urlPolicy", "sharedUi", "infra"]) {
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

const exportDataSource = fs
  .readdirSync(rel("src", "engine"))
  .filter((file) => /^exportData.*\.ts$/.test(file))
  .sort()
  .map((file) => read("src", "engine", file))
  .join("\n");
for (const symbol of [
  "exportDeveloperBrief",
  "exportAgentPrompt",
  "exportEvidencePatch",
  "exportVobecoderCard",
  "exportTaskArtifact",
]) {
  requireContent(
    "src/engine/exportData*.ts",
    exportDataSource,
    `export function ${symbol}`,
    symbol,
  );
  requireText("src/engine/index.ts", symbol, `engine index ${symbol}`);
}
requireContent(
  "src/engine/exportData*.ts",
  exportDataSource,
  "NO-GO for code-start",
  "code-start NO-GO",
);
requireContent(
  "src/engine/exportData*.ts",
  exportDataSource,
  "Do not use forbidden stack",
  "forbidden stack prompt",
);

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
requireText("package.json", '"qa:content"', "qa:content script");
requireText("package.json", '"qa:dimensions"', "qa:dimensions script");
requireText("package.json", '"qa:flow"', "qa:flow script");
requireText("package.json", '"qa:ci"', "qa:ci script");

const activeCurrentFiles = [
  "README.md",
  "AGENTS.md",
  "docs/engineering-standards-index.md",
  "docs/standards-applicability-matrix.md",
  "docs/icerik-kalite-sozlesmesi.md",
  "docs/audit-report.md",
  "docs/golden-node-examples.md",
  "docs/prompt-template-library.md",
  "docs/roadmap-pm-paritesi.md",
  "docs/governance-plan.md",
  "tools/agents/prompt-template.md",
  "tools/agents/README.md",
];
for (const file of activeCurrentFiles) {
  const content = read(file);
  for (const stale of ["14 boyut", "422 görev", "445 düğüm", "363 görev"]) {
    forbidContent(file, content, stale, stale);
  }
  for (const stale of ["PostgreSQL/Prisma", "Prisma + PostgreSQL", "erişim katmanı (Prisma)"]) {
    forbidContent(file, content, stale, stale);
  }
}

const publishedDocsStalePatterns = [
  { pattern: /14\s+(?:üretim\s+)?boyut[\w\u00c0-\u017f]*/gi, label: "14 boyut" },
  { pattern: /14['’]?l[ıiüu]/gi, label: "14'lu boyut/export dili" },
  { pattern: /14\s*[→-]\s*17/g, label: "14 -> 17 gecis dili" },
  {
    pattern: /422\s+(?:JSON\s+)?(?:düğüm|dugum|görev|gorev|node)/gi,
    label: "422 node/gorev",
  },
  { pattern: /424\s+(?:düğüm|dugum|node)/gi, label: "424 node" },
  {
    pattern: /407\s+(?:düğüm|dugum|görev|gorev|sayfa|şablon|template)/gi,
    label: "407 node/sablon",
  },
  { pattern: /31\s+(?:düğüm|dugum).*?14/gi, label: "31 eski boyutlu dugum" },
  {
    pattern:
      /PostgreSQL\/Prisma|PostgreSQL \+ Prisma|Prisma \+ PostgreSQL|erişim katmanı \(Prisma\)/gi,
    label: "Prisma stack drift",
  },
];

for (const absFile of listMarkdownFiles(rel("docs"))) {
  const file = path.relative(ROOT, absFile);
  const content = read(file);
  for (const { pattern, label } of publishedDocsStalePatterns) {
    forbidPatternInLines(file, content, pattern, label);
  }
}

const generatedNodesDir = rel("src", "data", "generated", "nodes");
for (const fileName of fs.readdirSync(generatedNodesDir).filter((f) => f.endsWith(".json"))) {
  const file = path.join("src", "data", "generated", "nodes", fileName);
  const content = read(file);
  for (const stale of [
    "14 boyut",
    "PostgreSQL/Prisma",
    "PostgreSQL + Prisma",
    "erişim katmanı (Prisma)",
  ]) {
    forbidContent(file, content, stale, stale);
  }
}

for (const file of [
  "tools/agents/seed-layer0.mjs",
  "tools/agents/seed-frontend.mjs",
  "tools/gen-platform-content.mjs",
]) {
  const content = read(file);
  for (const stale of ["PostgreSQL/Prisma", "PostgreSQL + Prisma", "erişim katmanı (Prisma)"]) {
    forbidContent(file, content, stale, stale);
  }
}

console.log(
  `[vibecoding-ready] workspace=${primary?.id ?? "yok"} · export modes=5 · ihlal=${failures.length}`,
);

if (failures.length) {
  console.error("\nSONUÇ: KIRMIZI - vibecoding/vobecoding handoff sozlesmesi eksik:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("SONUÇ: YEŞİL - export + workspace + dokuman handoff sozlesmesi tutarli.");
