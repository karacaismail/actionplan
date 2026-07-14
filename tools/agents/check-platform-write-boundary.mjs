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

// Export implementation is deliberately split to keep the public facade below the
// short-code ceiling. Enforce the policy across the complete exportData module family,
// not only the facade file.
const exportFiles = [
  "src/engine/exportData.ts",
  ...fs
    .readdirSync(path.join(root, "src", "engine"))
    .filter((file) => /^exportData.+\.ts$/.test(file))
    .sort()
    .map((file) => path.join("src", "engine", file)),
];
const exportSource = exportFiles.map((file) => read(file)).join("\n");
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
  /claude\s+"/i,
])
  if (forbidden.test(activeText)) errors.push(`aktif belgede AI coding çelişkisi: ${forbidden}`);

const swarmRunnerPath = "tools/agents/run-swarm.mjs";
const swarmRunner = read(swarmRunnerPath);
for (const token of [
  "DIRECT_EXECUTION_DISABLED",
  "FAIL-CLOSED",
  "Codex",
  "claude_review",
  "claude_implement",
  "claude.ai",
  "firstParty",
  "max",
])
  if (!swarmRunner.includes(token))
    errors.push(`${swarmRunnerPath}: fail-closed token eksik (${token})`);
for (const forbidden of ["node:child_process", "spawn(", "acceptEdits", "CLAUDE_BIN"])
  if (swarmRunner.includes(forbidden))
    errors.push(`${swarmRunnerPath}: doğrudan worker çalıştırma izi (${forbidden})`);

const swarmTemplatePath = "tools/agents/prompt-template.md";
const swarmTemplate = read(swarmTemplatePath);
for (const token of ["ARCHIVED-HANDOFF", "READ-ONLY", "Codex", "PM", "fail-closed"])
  if (!swarmTemplate.includes(token))
    errors.push(`${swarmTemplatePath}: arşiv yetki tokenı eksik (${token})`);
for (const forbidden of ["GÖREVİN bunu", "node JSON dosyalarını düzenle", "Her writer ayrı"])
  if (swarmTemplate.includes(forbidden))
    errors.push(`${swarmTemplatePath}: yürütülebilir eski worker talimatı (${forbidden})`);

const workerEntryText = [
  "tools/agents/README.md",
  "docs/roadmap-pm-paritesi.md",
  "docs/enterprise-saas-waterfall-claude-multi-agent-directive.md",
]
  .map((file) => read(file))
  .join("\n");
for (const forbidden of [/claude\s+-p/i, /Task\/sub-agent mekanizmasını kullanabilir/i])
  if (forbidden.test(workerEntryText))
    errors.push(`aktif worker girişinde doğrudan Claude yolu: ${forbidden}`);

const archivedPlans = [
  "plan-01-vibecoding-eylem-faz-faz-2026-07-01.md",
  "plan-04-paralel-ajan-orkestrasyon-2026-07-01.md",
  "docs/vibecoding-prompt-playbook.md",
];
for (const file of archivedPlans) {
  const content = read(file);
  for (const token of [
    "ARCHIVED-HUMAN-HANDOFF",
    "Codex → PM → uzman ajanlar → Claude workers/slaves",
    "human-developer-only",
  ])
    if (!content.includes(token)) errors.push(`${file}: arşiv yetki tokenı eksik (${token})`);
  for (const forbidden of [
    /Claude Code'a verilebilir/i,
    /Claude\/Cursor'a yapıştır/i,
    /ajan PR açar/i,
    /ajan[^.\n]{0,80}git worktree/i,
    /OpenClaw[^.\n]{0,100}ajan[^.\n]{0,100}tetikler/i,
  ])
    if (forbidden.test(content))
      errors.push(`${file}: yürütülebilir tarihsel talimat ${forbidden}`);
}

const modelRunnerPaths = ["tools/test-loop.mjs", "tools/qa-agent.mjs"];
for (const file of modelRunnerPaths) {
  const content = read(file);
  for (const token of ["TASK_ALLOWLIST", "MODEL_COMMAND_DENYLIST", "FAIL-CLOSED", "shell: false"])
    if (!content.includes(token)) errors.push(`${file}: sabit QA görev kilidi eksik (${token})`);
  for (const forbidden of ["shell: true", "execSync(cmd)", 'process.argv.slice(2).join(" ")'])
    if (content.includes(forbidden))
      errors.push(`${file}: serbest shell yürütme izi (${forbidden})`);
}

const packPattern = /^platform-.*-agent-pack-2026-07-09\.md$/;
const packFiles = fs.readdirSync(path.join(root, "docs")).filter((file) => packPattern.test(file));
if (packFiles.length !== 37)
  errors.push(`platform handoff pack sayısı 37 değil: ${packFiles.length}`);
for (const file of packFiles) {
  const relative = `docs/${file}`;
  const content = read(relative);
  for (const token of [
    "AUTHORITY-LOCK",
    "Codex → PM → uzman ajanlar → Claude workers/slaves",
    "human-developer-only",
    "read-only-audit",
    "Human Developer Execution Packet",
  ])
    if (!content.includes(token)) errors.push(`${relative}: handoff yetki tokenı eksik (${token})`);
  for (const forbidden of [
    /Claude Code\/Cursor\/Aider/i,
    /kod ajanına/i,
    /^## Agent Prompt$/m,
    /^Durum: docs-only implementation agent pack$/m,
  ])
    if (forbidden.test(content)) errors.push(`${relative}: doğrudan model handoff'u ${forbidden}`);
}

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
