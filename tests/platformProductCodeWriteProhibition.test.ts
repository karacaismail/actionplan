import { spawnSync } from "node:child_process";
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

describe("PWB-5 kalıcı ajan yetkisi ve Claude fail-closed kapısı", () => {
  it("eski swarm runner doğrudan Claude veya alt-ajan çalıştıramaz", () => {
    const relative = "tools/agents/run-swarm.mjs";
    const runner = read(relative);
    expect(runner).toContain("DIRECT_EXECUTION_DISABLED");
    for (const forbidden of [
      "node:child_process",
      "spawn(",
      "acceptEdits",
      "dangerously-skip-permissions",
      "CLAUDE_BIN",
    ]) {
      expect(runner).not.toContain(forbidden);
    }
    for (const required of [
      "FAIL-CLOSED",
      "Codex",
      "claude_review",
      "claude_implement",
      "claude.ai",
      "firstParty",
      "max",
    ]) {
      expect(runner).toContain(required);
    }

    const dry = spawnSync(process.execPath, [path.join(ROOT, relative), "--dry-run", "kernel"], {
      cwd: ROOT,
      encoding: "utf8",
    });
    expect(dry.status).toBe(0);
    expect(dry.stdout).toContain("handoff preview");
    expect(dry.stdout).not.toContain("claude -p");

    const blocked = spawnSync(process.execPath, [path.join(ROOT, relative), "kernel"], {
      cwd: ROOT,
      encoding: "utf8",
    });
    expect(blocked.status).toBe(2);
    expect(blocked.stderr).toContain("FAIL-CLOSED");
  });

  it("aktif authority belgeleri Codex-PM-specialist-Claude sırasını korur", () => {
    const agents = read("AGENTS.md");
    const claude = read("CLAUDE.md");
    const governance = read("docs/ai-governance-master.md");
    const historical = read("docs/enterprise-saas-waterfall-claude-multi-agent-directive.md");
    for (const token of [
      "Codex → PM → uzman ajanlar → Claude workers/slaves",
      "Codex = MASTER",
      "PM = Codex sonrasındaki ardıl koordinasyon yetkilisi",
      "Claude = worker/slave",
    ]) {
      expect(`${agents}\n${claude}\n${governance}`).toContain(token);
    }
    for (const token of ["claude.ai", "firstParty", "max", "fail-closed", "alt görev devredemez"])
      expect(claude).toContain(token);
    expect(historical).toContain("SUPERSEDED-AUTHORITY");
    expect(historical).toContain("Claude alt-ajan veya Task/sub-agent başlatamaz");
    const template = read("tools/agents/prompt-template.md");
    expect(template).toContain("ARCHIVED-HANDOFF");
    expect(template).toContain("READ-ONLY");
    expect(template).not.toContain("GÖREVİN bunu");
    const roadmap = read("docs/roadmap-pm-paritesi.md");
    expect(roadmap).toContain("Codex → PM → uzman ajanlar → Claude workers/slaves");
    expect(roadmap).not.toContain("claude -p");
    for (const file of ["docs/developer-guide.md", "docs/task-export-contract.md"])
      expect(read(file)).toContain("Codex → PM → uzman ajanlar → Claude workers/slaves");
    expect(read("docs/developer-guide.md")).not.toMatch(/claude\s+"/i);
    for (const file of [
      "docs/vibecoding-prompt-playbook.md",
      "plan-01-vibecoding-eylem-faz-faz-2026-07-01.md",
      "plan-04-paralel-ajan-orkestrasyon-2026-07-01.md",
    ])
      expect(read(file)).toContain("ARCHIVED-HUMAN-HANDOFF");
    expect(read("tools/agents/README.md")).not.toContain("--dangerously-skip-permissions");
    expect(read("tools/agents/check-platform-write-boundary.mjs")).toContain("run-swarm.mjs");
  });
});

describe("PWB-6 tarihsel yürütme ve dolaylı model komutu karantinası", () => {
  it("tarihsel planlar yalnız insan geliştirici arşivi olarak kalır", () => {
    for (const file of [
      "plan-01-vibecoding-eylem-faz-faz-2026-07-01.md",
      "plan-04-paralel-ajan-orkestrasyon-2026-07-01.md",
      "docs/vibecoding-prompt-playbook.md",
    ]) {
      const content = read(file);
      expect(content).toContain("ARCHIVED-HUMAN-HANDOFF");
      expect(content).toContain("human-developer-only");
      expect(content).toContain("Codex → PM → uzman ajanlar → Claude workers/slaves");
      for (const forbidden of [
        /Claude Code'a verilebilir/i,
        /Claude\/Cursor'a yapıştır/i,
        /ajan PR açar/i,
        /ajan[^.\n]{0,80}git worktree/i,
        /OpenClaw[^.\n]{0,100}ajan[^.\n]{0,100}tetikler/i,
      ])
        expect(content).not.toMatch(forbidden);
    }
    expect(read("docs/README.md")).toContain("arşivlenmiş human-developer handoff");
  });

  it.each(["tools/test-loop.mjs", "tools/qa-agent.mjs"])(
    "%s yalnız sabit QA görevlerini çalıştırır",
    (file) => {
      const source = read(file);
      for (const token of ["TASK_ALLOWLIST", "MODEL_COMMAND_DENYLIST", "FAIL-CLOSED"])
        expect(source).toContain(token);
      for (const forbidden of ["shell: true", "execSync(cmd)", 'process.argv.slice(2).join(" ")'])
        expect(source).not.toContain(forbidden);

      for (const payload of [
        'TOOL=printf; "$TOOL" bypass',
        "bash -lc 'printf bypass'",
        'node -e "process.exit(0)"',
        "npm --version",
        "git --version",
        "gh --version",
        "git -C ../platform status --short",
        "claude -p audit",
      ]) {
        const blocked = spawnSync(process.execPath, [path.join(ROOT, file), payload], {
          cwd: ROOT,
          encoding: "utf8",
        });
        expect(blocked.status, `${file} accepted ${payload}`).toBe(2);
        expect(blocked.stderr).toContain("FAIL-CLOSED");
        expect(`${blocked.stdout}\n${blocked.stderr}`).not.toContain("bypass\n");
      }

      const allowed = spawnSync(process.execPath, [path.join(ROOT, file), "typecheck"], {
        cwd: ROOT,
        encoding: "utf8",
        timeout: 30_000,
      });
      expect(allowed.status).toBe(0);
    },
    60_000,
  );

  it("swarm önizlemesi boş veya bilinmeyen shard'ı başarı saymaz", () => {
    const runner = path.join(ROOT, "tools/agents/run-swarm.mjs");
    for (const args of [
      ["--dry-run", "unknown-shard"],
      ["--dry-run", "--priority=999"],
    ]) {
      const result = spawnSync(process.execPath, [runner, ...args], {
        cwd: ROOT,
        encoding: "utf8",
      });
      expect(result.status).toBe(2);
      expect(result.stderr).toContain("FAIL-CLOSED");
    }
  });

  it("kanonik değişiklik istisnasını yalnız açık kullanıcı yetkili Codex'e verir", () => {
    for (const file of ["AGENTS.md", "docs/ai-governance-master.md"]) {
      const content = read(file);
      expect(content).toContain("Açık Kullanıcı/Admin yetkisi");
      expect(content).toContain("yalnız Codex");
      expect(content).toContain("PM, uzman ve Claude");
    }
    const governance = read("docs/ai-governance-master.md");
    expect(governance).not.toContain("plan-04-paralel-ajan-orkestrasyon-2026-07-01.md` §1");
  });

  it("CI kapısı 38 tarih-bağımsız platform handoff paketini ve iki sabit QA runner'ını tarar", () => {
    const gate = read("tools/agents/check-platform-write-boundary.mjs");
    for (const token of [
      "platform-.*-agent-pack-\\d{4}-\\d{2}-\\d{2}",
      "AUTHORITY-LOCK",
      "Human Developer Execution Packet",
      "tools/test-loop.mjs",
      "tools/qa-agent.mjs",
      "MODEL_COMMAND_DENYLIST",
      "TASK_ALLOWLIST",
      "shell: false",
    ])
      expect(gate).toContain(token);
  });
});

describe("PWB-7 aktif platform handoff yetkisi", () => {
  const activeHandoffDocs = [
    "docs/meta-framework-implementation-development-plan.md",
    "docs/kernel-sdk-app-delivery-sequence.md",
    "docs/deploy-separation-runbooks.md",
    "docs/platform-implementation-execution-queue-2026-07-09.md",
    "docs/platform-kdp01-archetype-storage-agent-pack-2026-07-14.md",
    "docs/platform-initial-11-pr-execution-handoff-2026-07-09.md",
    "docs/platform-customer-pr-execution-handoff-2026-07-09.md",
    "docs/platform-wave2-repeatability-pr-handoff-2026-07-09.md",
    "docs/platform-wave3-enterprise-pr-handoff-2026-07-09.md",
    "docs/platform-wave4-portfolio-pr-handoff-2026-07-09.md",
    "docs/platform-pr01-implementation-dispatch-2026-07-09.md",
  ];

  it.each(activeHandoffDocs)("%s açık ve fail-closed authority lock taşır", (file) => {
    const content = read(file);
    for (const token of [
      "AUTHORITY-LOCK",
      "Codex → PM → uzman ajanlar → Claude workers/slaves",
      "human-developer-only",
      "read-only-audit",
    ])
      expect(content).toContain(token);
  });

  it.each([
    "reports/platform-implementation-execution-queue-2026-07-09.json",
    "reports/kernel-data-plane-readiness-queue-2026-07-14.json",
  ])("%s yürütme yetkisini makine-okunur kilitler", (file) => {
    const queue = readJson(file);
    expect(queue.authority).toEqual({
      chain: [
        "codex-master",
        "pm-successor-coordinator",
        "specialist-agents",
        "claude-workers-slaves",
      ],
      finalAuthority: "codex",
      coordinationAuthority: "pm",
      aiAccess: "read-only-audit",
      executor: "human-developer-only",
      claudeInvocation: "codex-only-bounded-firstParty-max-fail-closed",
    });
  });

  it("aktif handoff belgeleri modele platform PR veya kod yazarlığı vermez", () => {
    const content = activeHandoffDocs.map((file) => read(file)).join("\n");
    for (const forbidden of [
      /Implementation coding agent/i,
      /Kod ajani veya vibecoder/i,
      /implementation operatör(?:ü|üne)?/i,
      /AI ajan[^.\n]{0,100}(?:PR açar|PR açabilir|hazırlık PR)/i,
      /Geliştirici\s*\/\s*AI ajan/i,
    ])
      expect(content).not.toMatch(forbidden);
  });

  it("CI kapısı tarih bağımsız platform agent pack keşfi ve aktif handoff taraması yapar", () => {
    const gate = read("tools/agents/check-platform-write-boundary.mjs");
    expect(gate).toContain("\\d{4}-\\d{2}-\\d{2}");
    expect(gate).toContain("activeHandoffDocs");
    expect(gate).toContain("activeQueuePaths");
  });
});

describe("PWB-8 kalan tarihsel plan yürütme yolları", () => {
  const remainingArchivedPlans = [
    "plan-00-kontrol-sentez-2026-07-01.md",
    "plan-02-numeronym-standart-prompt-paketi-2026-07-01.md",
    "plan-03-yeni-yonergeler-2026-07-01.md",
    "plan-05-durum-raporu-ve-sirada-ne-var-2026-07-01.md",
  ];

  it.each(remainingArchivedPlans)("%s yalnız insan geliştirici arşividir", (file) => {
    const content = read(file);
    for (const token of [
      "ARCHIVED-HUMAN-HANDOFF",
      "Codex → PM → uzman ajanlar → Claude workers/slaves",
      "read-only-audit",
      "human-developer-only",
    ])
      expect(content).toContain(token);
  });

  it("arşiv planları çalıştırılabilir model veya swarm görevi taşımaz", () => {
    const content = remainingArchivedPlans.map((file) => read(file)).join("\n");
    for (const forbidden of [
      /READY FOR VIBECODER/i,
      /run-swarm\.mjs\s*\+\s*Claude Code/i,
      /Sırayla verin/i,
      /ROL:[^\n]*ajan/i,
      /ajan[^.\n]{0,100}(?:kod yazar|kod üretir|PR açar|platform[^.\n]{0,30}yazar)/i,
      /kopyala-yapıştır (?:bir )?prompt zinciri/i,
    ])
      expect(content).not.toMatch(forbidden);
  });

  it("CI kapısı kalan dört planı gövde düzeyinde tarar", () => {
    const gate = read("tools/agents/check-platform-write-boundary.mjs");
    expect(gate).toContain("remainingArchivedPlans");
    for (const file of remainingArchivedPlans) expect(gate).toContain(file);
  });
});

describe("PWB-9 Commerce OS insan geliştirici handoff'u", () => {
  const commerceHandoffDocs = [
    "docs/commerce-os-test-first-parallel-handoff.md",
    "docs/commerce-os-vibecoder-task-packets.md",
    "docs/commerce-os-vibecoder-readiness-oracles.md",
    "docs/README.md",
  ];

  it.each(commerceHandoffDocs)("%s Commerce authority lock taşır", (file) => {
    const content = read(file);
    for (const token of [
      "AUTHORITY-LOCK",
      "Codex → PM → uzman ajanlar → Claude workers/slaves",
      "read-only-audit",
      "human-developer-only",
    ])
      expect(content).toContain(token);
  });

  it("Commerce handoff kaynakları modele implementation yetkisi vermez", () => {
    const content = commerceHandoffDocs.map((file) => read(file)).join("\n");
    for (const forbidden of [
      /READY FOR VIBECODER/i,
      /implementation agent\s*\/\s*vibecoder[^.\n]*(?:writes|implements|creates)/i,
      /(?:the\s+)?vibecoder[^.\n]{0,100}(?:writes|commits|pushes|merges|scaffolds|implements)/i,
      /vibecoder görevi[^.\n]{0,80}kod üret/i,
    ])
      expect(content).not.toMatch(forbidden);
  });

  it("Commerce sınıflandırması executor'ı insan geliştiriciye kilitler", () => {
    const classification = readJson("src/data/doc-task-content-classification.json");
    for (const docPath of commerceHandoffDocs.slice(0, 3)) {
      const entry = classification.find((item: { docPath: string }) => item.docPath === docPath);
      expect(entry?.rationale).toContain("human-developer-only");
      expect(entry?.rationale).toContain("read-only-audit");
    }
  });

  it("CI kapısı Commerce kaynaklarını ve classification kaydını tarar", () => {
    const gate = read("tools/agents/check-platform-write-boundary.mjs");
    expect(gate).toContain("commerceHandoffDocs");
    expect(gate).toContain("doc-task-content-classification.json");
  });
});
