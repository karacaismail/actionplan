import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exportAgentPrompt, exportVobecoderCard } from "@/engine/exportData";
import { PlatformWriteBoundarySchema, TaskNodeSchema } from "@/schemas";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const readJson = (relative: string) => JSON.parse(read(relative));

describe("PWB-1 makine-okunur platform yazma yasağı", () => {
  it("AI erişimini salt-okunur, ürün kodu yazımını yalnız insan olarak kilitler", () => {
    const policy = PlatformWriteBoundarySchema.parse(
      readJson("src/data/platform-product-code-write-policy.json"),
    );
    expect(policy.id).toBe("platform-product-code-write-prohibition");
    expect(policy.targetWorkspaceId).toBe("platform");
    expect(policy.aiAccess).toBe("read-only-audit");
    expect(policy.productCodeWriter).toBe("human-developer-only");
    expect(policy.aiActors).toEqual(expect.arrayContaining(["codex", "claude", "cursor"]));
    expect(policy.prohibitedActions).toEqual(
      expect.arrayContaining([
        "write-product-code",
        "write-tests",
        "create-migration",
        "create-branch",
        "create-commit",
        "open-pull-request",
      ]),
    );
    expect(policy.directiveWriteRoots).toEqual(["/Users/karaca/DEV/mimari/actionplan"]);
    expect(policy.humanInstallTargets).toEqual([
      {
        source: "docs/templates/platform-agent-boundary/AGENTS.md",
        target: "/Users/karaca/DEV/mimari/platform/AGENTS.md",
      },
      {
        source: "docs/templates/platform-agent-boundary/CLAUDE.md",
        target: "/Users/karaca/DEV/mimari/platform/CLAUDE.md",
      },
      {
        source: "docs/templates/platform-agent-boundary/platform-write-prohibition.mdc",
        target: "/Users/karaca/DEV/mimari/platform/.cursor/rules/platform-write-prohibition.mdc",
      },
    ]);
  });

  it("workspace manifest policy ref ve salt-okunur AI access taşır", () => {
    const manifest = readJson("src/data/workspace-manifest.json");
    const platform = manifest.workspaces.find((item: { id: string }) => item.id === "platform");
    expect(platform.agentAccess).toEqual({
      mode: "read-only-audit",
      productCodeWriter: "human-developer-only",
      policyRef: "src/data/platform-product-code-write-policy.json",
    });
  });

  it("URLP-00..16 promptlarının tamamı directive-only ve platform-write stop koşulludur", () => {
    const program = readJson("src/data/url-policy/implementation-program.json");
    expect(program.phases).toHaveLength(17);
    for (const phase of program.phases) {
      expect(phase.agentPrompt.objective).toMatch(/^DIRECTIVE-ONLY:/);
      expect(phase.agentPrompt.instructions).toContain(
        "Platform workspace'ini değiştirme; yalnız read-only-audit yap.",
      );
      expect(phase.agentPrompt.stopConditions).toContain("Herhangi bir platform yazımı gerekiyor.");
    }
  });
});

describe("PWB-2 kanonik directive yayılımı", () => {
  it.each([
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
  ])("%s kanonik yasağa bağlanır", (file) => {
    const content = read(file);
    expect(content).toContain("platform-product-code-write-prohibition-directive.md");
    expect(content).toMatch(/human-developer-only|yalnız insan geliştirici/i);
  });

  it("directive aktör, yasak, izin, stop ve handoff sınırlarını eksiksiz tanımlar", () => {
    const directive = read("docs/platform-product-code-write-prohibition-directive.md");
    for (const token of [
      "Codex",
      "Claude",
      "Cursor",
      "read-only-audit",
      "human-developer-only",
      "create-branch",
      "create-commit",
      "open-pull-request",
      "create-migration",
      "stopConditions",
      "directiveWriteRoots",
      "Storybook",
    ]) {
      expect(directive).toContain(token);
    }
  });

  it.each([
    "docs/templates/platform-agent-boundary/AGENTS.md",
    "docs/templates/platform-agent-boundary/CLAUDE.md",
    "docs/templates/platform-agent-boundary/platform-write-prohibition.mdc",
  ])("%s insan-kurulum şablonu aynı salt-okunur hükmü taşır", (file) => {
    const content = read(file);
    expect(content).toContain("DIRECTIVE-ONLY");
    expect(content).toContain("read-only-audit");
    expect(content).toContain("human-developer-only");
    expect(content).toContain("Do not modify the platform workspace");
  });

  it("AI governance standardı yasağı normatif kural olarak taşır", () => {
    const standard = readJson("src/data/standards/ai-governance.json");
    expect(
      standard.rules.some((rule: { id: string }) => rule.id === "ai-platform-write-prohibited"),
    ).toBe(true);
    expect(standard.banned).toContain("ai-writes-platform-product-code");
    expect(standard.allowed).toContain("ai-produces-actionplan-directive");
  });
});

describe("PWB-3 exportlar coding prompt üretmez", () => {
  const node = TaskNodeSchema.parse({
    id: "pwb-fixture",
    level: "micro_step",
    title: "Platform write boundary fixture",
    slug: "pwb-fixture",
    acceptanceCriteria: ["İnsan geliştirici directive'i uygular"],
    traceability: {
      repoPath: ["apps/api/src/meta_api/example.py"],
      testCommand: ["cd apps/api && uv run pytest tests/example"],
    },
  });

  it("Agent Prompt yalnız directive ve insan handoff'u ister", () => {
    const prompt = exportAgentPrompt(node);
    expect(prompt).toContain("DIRECTIVE-ONLY");
    expect(prompt).toContain("Do not modify the platform workspace");
    expect(prompt).toContain("human developer");
    expect(prompt).not.toContain("You are a coding agent");
    expect(prompt).not.toContain("Implement the smallest code change");
    expect(prompt).not.toContain("Create branch");
  });

  it("Vobecoder Card kod üretmek yerine uygulanabilir yönerge ister", () => {
    const card = exportVobecoderCard(node);
    expect(card).toContain("DIRECTIVE-ONLY");
    expect(card).toContain("Platform dosyalarına yazma");
    expect(card).toContain("İnsan geliştirici");
    expect(card).not.toContain("en küçük kod değişikliği");
  });
});

describe("PWB-4 bloklayıcı CI kapısı", () => {
  it("paket scripti ve qa:ci platform yazma kapısını zorunlu çalıştırır", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts["qa:platform-write-boundary"]).toContain(
      "check-platform-write-boundary.mjs",
    );
    expect(pkg.scripts["qa:ci"]).toContain("qa:platform-write-boundary");
  });

  it("kapı makine policy, directive, export ve ajan giriş dosyalarını tarar", () => {
    const gate = read("tools/agents/check-platform-write-boundary.mjs");
    for (const token of [
      "platform-product-code-write-policy.json",
      "platform-product-code-write-prohibition-directive.md",
      "AGENTS.md",
      "CLAUDE.md",
      "CURSOR-RULES.md",
      "exportData.ts",
      "human-developer-only",
      "read-only-audit",
    ]) {
      expect(gate).toContain(token);
    }
  });
});
