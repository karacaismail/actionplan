#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const readJson = (relative) => JSON.parse(read(relative));
const errors = [];
const policy = readJson("src/data/platform-product-code-write-policy.json");
const manifest = readJson("src/data/workspace-manifest.json");
const urlProgram = readJson("src/data/url-policy/implementation-program.json");

const requiredFiles = [
  "AGENTS.md",
  "CLAUDE.md",
  "CURSOR-RULES.md",
  "README.md",
  "docs/doc-maintainer-operating-boundary.md",
  "docs/developer-guide.md",
  "docs/task-export-contract.md",
  "docs/implementation-workspace-manifest.md",
  "docs/task-to-code-contract.md",
  "docs/ready-for-dev-gate.md",
  "docs/url-policy.md",
  "docs/url-policy-implementation-directive.md",
  "docs/prompt-template-library.md",
  "docs/storybook-implementation.md",
  "docs/storybook-master-component-integration-directive.md",
];
const directiveName = "platform-product-code-write-prohibition-directive.md";
const directive = read(`docs/${directiveName}`);

if (policy.id !== "platform-product-code-write-prohibition") errors.push("policy id geçersiz");
if (policy.aiAccess !== "read-only-audit") errors.push("AI erişimi read-only-audit olmalı");
if (policy.productCodeWriter !== "human-developer-only")
  errors.push("ürün kodu yazarı human-developer-only olmalı");
for (const actor of ["codex", "claude", "cursor"])
  if (!policy.aiActors?.includes(actor)) errors.push(`AI actor eksik: ${actor}`);
for (const action of [
  "write-product-code",
  "write-tests",
  "create-migration",
  "create-branch",
  "create-commit",
  "open-pull-request",
])
  if (!policy.prohibitedActions?.includes(action)) errors.push(`zorunlu yasak eksik: ${action}`);
for (const installation of policy.humanInstallTargets ?? []) {
  if (!fs.existsSync(path.join(root, installation.source)))
    errors.push(`insan-kurulum şablonu yok: ${installation.source}`);
  else {
    const template = read(installation.source);
    for (const token of [
      "DIRECTIVE-ONLY",
      "read-only-audit",
      "human-developer-only",
      "Do not modify the platform workspace",
    ])
      if (!template.includes(token))
        errors.push(`${installation.source}: zorunlu hüküm eksik (${token})`);
  }
}

const platform = manifest.workspaces?.find((item) => item.id === "platform");
if (platform?.agentAccess?.mode !== "read-only-audit")
  errors.push("workspace agentAccess.mode geçersiz");
if (platform?.agentAccess?.productCodeWriter !== "human-developer-only")
  errors.push("workspace productCodeWriter geçersiz");
for (const phase of urlProgram.phases ?? []) {
  if (!phase.agentPrompt?.objective?.startsWith("DIRECTIVE-ONLY:"))
    errors.push(`${phase.phaseId}: agentPrompt directive-only değil`);
  if (
    !phase.agentPrompt?.instructions?.includes(
      "Platform workspace'ini değiştirme; yalnız read-only-audit yap.",
    )
  )
    errors.push(`${phase.phaseId}: read-only instruction eksik`);
  if (!phase.agentPrompt?.stopConditions?.includes("Herhangi bir platform yazımı gerekiyor."))
    errors.push(`${phase.phaseId}: platform-write stop condition eksik`);
}

for (const file of requiredFiles) {
  const content = read(file);
  if (!content.includes(directiveName)) errors.push(`${file}: kanonik directive ref yok`);
  if (!/human-developer-only|yalnız insan geliştirici/i.test(content))
    errors.push(`${file}: human-developer-only hükmü yok`);
}

for (const token of [
  "Codex",
  "Claude",
  "Cursor",
  "read-only-audit",
  "human-developer-only",
  "stopConditions",
  "directiveWriteRoots",
  "Storybook",
])
  if (!directive.includes(token)) errors.push(`directive token eksik: ${token}`);

const exportSource = read("src/engine/exportData.ts");
for (const token of [
  "DIRECTIVE-ONLY",
  "Do not modify the platform workspace",
  "human developer",
  "Platform dosyalarına yazma",
])
  if (!exportSource.includes(token)) errors.push(`exportData zorunlu hüküm eksik: ${token}`);
for (const forbidden of [
  /You are a coding agent/,
  /Implement the smallest code change/,
  /Create branch `/,
  /en küçük kod değişikliğiyle testi yeşile çevir/,
])
  if (forbidden.test(exportSource)) errors.push(`exportData coding yetkisi içeriyor: ${forbidden}`);

const activeText = [
  "AGENTS.md",
  "CLAUDE.md",
  "CURSOR-RULES.md",
  "docs/doc-maintainer-operating-boundary.md",
  "docs/developer-guide.md",
  "docs/task-export-contract.md",
  "docs/url-policy.md",
  "docs/url-policy-implementation-directive.md",
  "docs/prompt-template-library.md",
  "docs/storybook-implementation.md",
  "docs/storybook-master-component-integration-directive.md",
]
  .map((file) => read(file))
  .join("\n");
for (const forbidden of [
  /AI ajanı kodu üretir/i,
  /AI ajanı[^.\n]{0,80}PR açar/i,
  /implementation ajan operatörü[^.\n]{0,100}(uygular|kullanır)/i,
  /coding ajanı[^.\n]{0,100}(uygular|yazar|üretir)/i,
])
  if (forbidden.test(activeText)) errors.push(`aktif belgede AI coding çelişkisi: ${forbidden}`);

console.log(
  `[platform-write-boundary] actor=${policy.aiActors?.length ?? 0} · yasak=${policy.prohibitedActions?.length ?? 0} · giriş=${requiredFiles.length} · ihlal=${errors.length}`,
);
if (errors.length === 0) {
  console.log("SONUÇ: YEŞİL — AI platform read-only; ürün kodu human-developer-only.");
  process.exit(0);
}
console.log("SONUÇ: KIRMIZI");
for (const error of errors) console.log(`  - ${error}`);
process.exit(1);
