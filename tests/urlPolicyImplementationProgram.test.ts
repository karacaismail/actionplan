import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TaskNodeSchema, UrlPolicyImplementationProgramSchema } from "@/schemas";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROGRAM_PATH = path.join(ROOT, "src/data/url-policy/implementation-program.json");
const ids = Array.from({ length: 17 }, (_, index) => `URLP-${String(index).padStart(2, "0")}`);
const EXPORT_DATA_DIR = path.join(ROOT, "src/engine");
const EXPORT_DATA_SOURCE_FILES = [
  "exportData.ts",
  ...fs
    .readdirSync(EXPORT_DATA_DIR)
    .filter((file) => /^exportData.+\.ts$/.test(file))
    .sort((left, right) => left.localeCompare(right)),
];

const readExportDataSourceFamily = () =>
  EXPORT_DATA_SOURCE_FILES.map((file) =>
    fs.readFileSync(path.join(EXPORT_DATA_DIR, file), "utf8"),
  ).join("\n");

const phase = (index: number) => ({
  phaseId: ids[index],
  order: index,
  title: `Faz ${index}`,
  status: "planned",
  owner: "platform-url-policy-owner",
  targetRepo: "platform",
  branch: `task/${ids[index]}-fixture`,
  dependsOn: index === 0 ? [] : [ids[index - 1]],
  allowedFiles: [`packages/url-policy/phase-${index}/**`],
  nonGoals: ["Actionplan reposunda runtime kodu yazmak"],
  requiredRegistryRefs: ["src/data/url-policy/registry.json#defaults"],
  acceptanceCriteria: [
    { id: `URLP-${index}-AC-01`, statement: "Sözleşme doğrulanır", evidence: "test" },
  ],
  redTests: [
    { id: `URLP-${index}-RED-01`, file: "tests/url-policy.test.ts", assertion: "Önce kırmızı" },
  ],
  testCommands: ["pnpm test -- url-policy"],
  evidenceRequirements: ["Kırmızı ve yeşil test çıktıları"],
  rollback: {
    trigger: "Kabul kriteri ihlali",
    procedure: "Önceki kanonik sürüme dön",
    verification: "Eski sözleşme testleri yeşil",
  },
  securityNegativeTests: ["Tenant uyuşmazlığı fail-closed"],
  outputArtifacts: ["URL policy implementation evidence"],
  wbsRefs: [`urlp-${String(index).padStart(2, "0")}`],
  agentPrompt: {
    objective: `URLP-${String(index).padStart(2, "0")} fazını uygula`,
    instructions: ["Testi önce kırmızı çalıştır", "Yalnız allowedFiles içinde yaz"],
    stopConditions: ["Bağımlılık tamamlanmadı", "Kapsam dışı dosya gerekiyor"],
  },
});

const fixture = () => ({
  schemaVersion: "1.0.0",
  id: "url-policy-implementation-program",
  version: "1.0.0",
  status: "active",
  canonicalPolicyRef: "docs/url-policy.md",
  targetRepo: "platform",
  phases: ids.map((_, index) => phase(index)),
});

describe("URLP-IMPLEMENTATION-1 program şeması", () => {
  it("tam URLP-00..URLP-16 zincirini kabul eder", () => {
    const result = UrlPolicyImplementationProgramSchema.parse(fixture());
    expect(result.phases.map((item) => item.phaseId)).toEqual(ids);
    expect(result.phases[0].dependsOn).toEqual([]);
    expect(result.phases[16].dependsOn).toEqual(["URLP-15"]);
  });

  it.each([
    ["eksik faz", (data: ReturnType<typeof fixture>) => data.phases.pop()],
    [
      "sıra boşluğu",
      (data: ReturnType<typeof fixture>) => {
        data.phases[8].phaseId = "URLP-09";
      },
    ],
    [
      "kopuk bağımlılık",
      (data: ReturnType<typeof fixture>) => {
        data.phases[9].dependsOn = ["URLP-03"];
      },
    ],
    [
      "fazla eşleşmeyen branch",
      (data: ReturnType<typeof fixture>) => {
        data.phases[4].branch = "task/URLP-03-wrong";
      },
    ],
    [
      "fazla eşleşmeyen WBS ref",
      (data: ReturnType<typeof fixture>) => {
        data.phases[4].wbsRefs = ["urlp-03"];
      },
    ],
    [
      "sınırsız allowedFiles wildcard",
      (data: ReturnType<typeof fixture>) => {
        data.phases[4].allowedFiles = ["**"];
      },
    ],
    [
      "yinelenen allowedFiles",
      (data: ReturnType<typeof fixture>) => {
        data.phases[4].allowedFiles.push(data.phases[4].allowedFiles[0]);
      },
    ],
    [
      "repo dışına çıkan allowedFiles",
      (data: ReturnType<typeof fixture>) => {
        data.phases[4].allowedFiles = ["../platform-secret/**"];
      },
    ],
    [
      "hata yutan test komutu",
      (data: ReturnType<typeof fixture>) => {
        data.phases[4].testCommands = ["pnpm test || true"];
      },
    ],
    [
      "bloke predecessor üstünde verified ardıl",
      (data: ReturnType<typeof fixture>) => {
        data.phases[4].status = "verified";
      },
    ],
  ])("%s durumunu reddeder", (_, mutate) => {
    const data = fixture();
    mutate(data);
    expect(UrlPolicyImplementationProgramSchema.safeParse(data).success).toBe(false);
  });

  it("faz başına execution-ready alanları zorunlu tutar", () => {
    const data = fixture() as Record<string, unknown> & { phases: Record<string, unknown>[] };
    data.phases[4].rollback = undefined;
    expect(UrlPolicyImplementationProgramSchema.safeParse(data).success).toBe(false);
  });
});

describe("URLP-IMPLEMENTATION-2 gerçek program", () => {
  it("makine-okunur implementation programını şemaya göre doğrular", () => {
    const raw = JSON.parse(fs.readFileSync(PROGRAM_PATH, "utf8"));
    const program = UrlPolicyImplementationProgramSchema.parse(raw);
    expect(program.phases).toHaveLength(17);
    for (const item of program.phases) {
      expect(item.allowedFiles.length).toBeGreaterThan(0);
      expect(item.nonGoals.length).toBeGreaterThan(0);
      expect(item.redTests.length).toBeGreaterThan(0);
      expect(item.testCommands.length).toBeGreaterThan(0);
      expect(item.evidenceRequirements.length).toBeGreaterThan(0);
      expect(item.securityNegativeTests.length).toBeGreaterThan(0);
      expect(item.outputArtifacts.length).toBeGreaterThan(0);
      expect(item.wbsRefs.length).toBeGreaterThan(0);
    }
  });

  it("requiredRegistryRefs kanonik URL registry veya standard içinde çözülür", () => {
    const program = UrlPolicyImplementationProgramSchema.parse(
      JSON.parse(fs.readFileSync(PROGRAM_PATH, "utf8")),
    );
    const registry = JSON.parse(
      fs.readFileSync(path.join(ROOT, "src/data/url-policy/registry.json"), "utf8"),
    );
    const standard = JSON.parse(
      fs.readFileSync(path.join(ROOT, "src/data/standards/url-policy.json"), "utf8"),
    );
    const registryIds = new Set([
      registry.id,
      ...registry.routeDefinitions.map((item: { routeId: string }) => item.routeId),
      ...registry.hostBindingProfiles.map((item: { id: string }) => item.id),
      ...registry.slugProfiles.map((item: { id: string }) => item.id),
    ]);
    const standardIds = new Set([
      standard.id,
      ...(standard.rules ?? []).map((item: { id: string }) => `${standard.id}#${item.id}`),
    ]);
    for (const phase of program.phases) {
      for (const ref of phase.requiredRegistryRefs) {
        if (ref.startsWith(`${registry.id}#`)) {
          expect(registry, `${phase.phaseId}: registry section yok (${ref})`).toHaveProperty(
            ref.slice(registry.id.length + 1),
          );
        } else {
          expect(
            registryIds.has(ref) || standardIds.has(ref),
            `${phase.phaseId}: requiredRegistryRef çözümlenemedi (${ref})`,
          ).toBe(true);
        }
      }
    }
  });

  it("implementation workspace URL çekirdeğini genel SDK'dan ayrı kök olarak tanımlar", () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(ROOT, "src/data/workspace-manifest.json"), "utf8"),
    );
    const platform = manifest.workspaces.find((item: { id: string }) => item.id === "platform");
    expect(platform?.roots?.urlPolicy).toBe("packages/url-policy");
    expect(platform?.roots?.sdk).toBe("packages/sdk");
    expect(platform?.roots?.urlPolicy).not.toBe(platform?.roots?.sdk);
    expect(EXPORT_DATA_SOURCE_FILES.length).toBeGreaterThan(1);
    const exportSourceFamily = readExportDataSourceFamily();
    expect(exportSourceFamily).toContain("- URL policy root:");
    expect(exportSourceFamily).toContain("PRIMARY_WORKSPACE.roots.urlPolicy");
  });

  it("fazlar geniş wildcard veya sahte evidence ile kapsamı gevşetmez", () => {
    const program = UrlPolicyImplementationProgramSchema.parse(
      JSON.parse(fs.readFileSync(PROGRAM_PATH, "utf8")),
    );
    for (const item of program.phases) {
      expect(item.allowedFiles).not.toContain("**");
      expect(item.evidenceRequirements.join(" ")).not.toMatch(/example\.com|fake|uydur/i);
      expect(item.status).not.toBe("verified");
      expect(item.agentPrompt.stopConditions.length).toBeGreaterThan(0);
    }
  });
});

describe("URLP-IMPLEMENTATION-3 directive ve WBS hizalaması", () => {
  it("execution directive 17 fazın tamamını ve zorunlu çalışma alanlarını içerir", () => {
    const directive = fs.readFileSync(
      path.join(ROOT, "docs/url-policy-implementation-directive.md"),
      "utf8",
    );
    for (const id of ids) expect(directive).toContain(id);
    for (const token of [
      "allowedFiles",
      "nonGoals",
      "redTests",
      "securityNegativeTests",
      "evidenceRequirements",
      "rollback",
      "stopConditions",
    ])
      expect(directive).toContain(token);
  });

  it("directive her fazın makine programındaki allowedFiles ve test komutlarını aynen taşır", () => {
    const directive = fs.readFileSync(
      path.join(ROOT, "docs/url-policy-implementation-directive.md"),
      "utf8",
    );
    const program = UrlPolicyImplementationProgramSchema.parse(
      JSON.parse(fs.readFileSync(PROGRAM_PATH, "utf8")),
    );
    for (const item of program.phases) {
      const heading = new RegExp(`^## \\d+\\. ${item.phaseId}\\b`, "m");
      const match = heading.exec(directive);
      expect(match, `${item.phaseId}: directive heading yok`).not.toBeNull();
      const sectionStart = match?.index ?? 0;
      const sectionEnd = directive.indexOf("\n---", sectionStart);
      const section = directive.slice(sectionStart, sectionEnd < 0 ? undefined : sectionEnd);
      for (const file of item.allowedFiles) {
        expect(section, `${item.phaseId}: allowedFiles eksik: ${file}`).toContain(file);
      }
      for (const command of item.testCommands) {
        expect(section, `${item.phaseId}: testCommands eksik: ${command}`).toContain(command);
      }
    }
    expect(directive).not.toMatch(/packages\/sdk|@platform\/sdk|@metaframer\/url-policy/);
  });

  it("17 WBS atomu şemaya uyar, programa referans verir ve bağımlılık zincirini korur", () => {
    const program = UrlPolicyImplementationProgramSchema.parse(
      JSON.parse(fs.readFileSync(PROGRAM_PATH, "utf8")),
    );
    for (const item of program.phases) {
      const nodeId = item.wbsRefs[0];
      const nodePath = path.join(ROOT, `src/data/generated/nodes/${nodeId}.json`);
      expect(fs.existsSync(nodePath), `${item.phaseId}: WBS node yok`).toBe(true);
      const node = TaskNodeSchema.parse(JSON.parse(fs.readFileSync(nodePath, "utf8")));
      expect(node.level).toBe("micro_step");
      expect(
        node.refs.some((ref) => ref.startsWith("src/data/url-policy/implementation-program.json")),
      ).toBe(true);
      expect(
        node.refs.some((ref) => ref.startsWith("docs/url-policy-implementation-directive.md")),
      ).toBe(true);
      expect(node.standardRefs.urlPolicyRef).toBe("url-policy");
      expect(node.atomDefinition?.kind).toBe("task-micro-step");
      if (node.atomDefinition?.kind !== "task-micro-step") {
        throw new Error(`${item.phaseId}: atomDefinition task-micro-step değil`);
      }
      expect(node.atomDefinition.allowedFiles, `${item.phaseId}: atom allowedFiles drift`).toEqual(
        item.allowedFiles,
      );
      expect(node.atomDefinition.nonGoals, `${item.phaseId}: atom nonGoals drift`).toEqual(
        item.nonGoals,
      );
      expect(node.traceability?.repoPath, `${item.phaseId}: traceability repoPath drift`).toEqual(
        item.allowedFiles,
      );
      expect(
        node.traceability?.testCommand,
        `${item.phaseId}: traceability testCommand drift`,
      ).toEqual(item.testCommands);
      for (const vector of node.atomDefinition.testVectors) {
        expect(
          item.testCommands,
          `${item.phaseId}: atom testVector program dışı komut kullanıyor`,
        ).toContain(vector.testRef);
      }
      expect(node.dependsOn).toEqual(
        item.order === 0 ? [] : [program.phases[item.order - 1].wbsRefs[0]],
      );
      const ecaEvents = new Set(node.ecaRules.map((rule) => rule.event));
      for (const event of [
        "ai.generation.requested",
        "ai.update.requested",
        "ai.ruleset.override.requested",
      ]) {
        expect(
          ecaEvents.has(event),
          `${item.phaseId}: backend AI deny event eksik (${event})`,
        ).toBe(true);
      }
      if (["planned", "blocked"].includes(item.status)) {
        expect(node.evidence).toEqual([]);
        expect(node.status).not.toBe("done");
        expect(node.traceability?.implementationStatus).toBe("not-started");
      } else {
        expect(node.evidence.length, `${item.phaseId}: ilerleme evidence ister`).toBeGreaterThan(0);
      }
      if (["verified", "completed"].includes(item.status)) {
        expect(node.status).toBe("done");
        expect(node.traceability?.implementationStatus).toBe("verified");
      }
    }
  });
});
