import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import architectureJson from "@/data/standards/architecture.json";
import { STANDARDS, exportAgentPrompt, exportTask, nodeStandards } from "@/engine";
import { StandardContractSchema, TaskNodeSchema } from "@/schemas";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STANDARDS_DIR = path.join(ROOT, "src/data/standards");
const standardFiles = fs
  .readdirSync(STANDARDS_DIR)
  .filter((file) => file.endsWith(".json"))
  .sort();

const architecture = StandardContractSchema.parse(architectureJson);
const fixture = TaskNodeSchema.parse({
  id: "resolved-standard-fixture",
  level: "feature",
  title: "Resolved Standard Fixture",
  slug: "resolved-standard-fixture",
  standardRefs: { architectureRef: architecture.id },
});

interface ResolvedStandardShape {
  key: string;
  id: string;
  name: string;
  summary: string;
  source: string;
  references: string[];
  rules: Array<{
    id: string;
    rule: string;
    rationale: string;
    severity: "must" | "should" | "may";
    check: string;
  }>;
}

describe("canonical standard contract projection", () => {
  it("loads every one of the 36 canonical standard JSON contracts into STANDARDS", () => {
    const canonicalIds = standardFiles.map((file) => file.replace(/\.json$/, ""));

    expect(standardFiles).toHaveLength(38);
    expect(STANDARDS).toHaveLength(38);
    expect(STANDARDS.map((standard) => standard.id).sort()).toEqual(canonicalIds);
  });

  it("nodeStandards resolves summary, rules, checks, severity and references from canonical JSON", () => {
    const resolved = nodeStandards(fixture).find((standard) => standard.id === architecture.id) as
      | ResolvedStandardShape
      | undefined;

    expect(resolved).toMatchObject({
      key: "architectureRef",
      id: architecture.id,
      name: architecture.name,
      summary: architecture.summary,
      source: "src/data/standards/architecture.json",
      references: architecture.references,
    });
    expect(resolved?.rules).toEqual(architecture.rules);
    expect(resolved?.rules[0]).toMatchObject({
      id: "arch-layer-direction",
      severity: "must",
      check: "check-dependency-policy + biome import kuralı",
    });
  });

  it("exportTask includes the resolved canonical standard contracts beside the raw task", () => {
    const exported = JSON.parse(exportTask(fixture)) as {
      resolvedStandards?: ResolvedStandardShape[];
    };
    const resolved = exported.resolvedStandards?.find(
      (standard) => standard.id === architecture.id,
    );

    expect(exported.resolvedStandards).toBeDefined();
    expect(resolved).toMatchObject({
      key: "architectureRef",
      id: architecture.id,
      name: architecture.name,
      summary: architecture.summary,
      source: "src/data/standards/architecture.json",
      references: architecture.references,
    });
    expect(resolved?.rules).toEqual(architecture.rules);
  });

  it("exportAgentPrompt emits the resolved standard id, rule, check and canonical source", () => {
    const prompt = exportAgentPrompt(fixture);
    const firstRule = architecture.rules[0];

    expect(prompt).toContain(architecture.id);
    expect(prompt).toContain("src/data/standards/architecture.json");
    expect(prompt).toContain(firstRule.id);
    expect(prompt).toContain(firstRule.rule);
    expect(prompt).toContain(firstRule.severity);
    expect(prompt).toContain(firstRule.check);
  });

  it("resolves tech-profile details from the canonical JSON instead of a name-only id", () => {
    const techNode = TaskNodeSchema.parse({
      id: "tech-profile-fixture",
      level: "feature",
      title: "Tech Profile Fixture",
      slug: "tech-profile-fixture",
      standardRefs: { techProfileRef: "saas-app" },
    });
    const resolved = nodeStandards(techNode).find((standard) => standard.key === "techProfileRef");

    expect(resolved).toMatchObject({
      id: "saas-app",
      name: "SaaS Panel / App (ürün)",
      source: "src/data/tech-profiles.json",
    });
    expect(resolved?.summary).toContain("react19");
    expect(resolved?.references).toContain("docs/adr-0026-tech-profiles.md");
    expect(resolved?.rules.length).toBeGreaterThanOrEqual(3);
    expect(resolved?.rules[0].check).toContain("check-tech-profile");
  });
});
