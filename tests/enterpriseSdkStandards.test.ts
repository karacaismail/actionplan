import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { StandardContractSchema, StandardRefsSchema } from "@/schemas";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readStandard(id: string) {
  const file = path.join(ROOT, "src", "data", "standards", `${id}.json`);
  return StandardContractSchema.parse(JSON.parse(fs.readFileSync(file, "utf8")));
}

describe("enterprise app ve SDK geliştirme standartları", () => {
  it("enterprise-delivery standardı MVP'yi yasaklar ve yedi waterfall fazını zorlar", () => {
    const standard = readStandard("enterprise-delivery");
    const rules = standard.rules.map((rule) => `${rule.id} ${rule.rule}`).join("\n");

    expect(standard.appliesTo).toEqual(expect.arrayContaining(["app", "module"]));
    expect(rules).toContain("enterprise");
    expect(rules).toContain("mvpAllowed=false");
    for (const phase of [
      "requirements",
      "test-plan",
      "db-schema",
      "development",
      "test-qa",
      "verification",
      "release-maintenance",
    ]) {
      expect(rules).toContain(phase);
    }
  });

  it("sdk-development standardı app ve module için SDK-only lineage zorlar", () => {
    const standard = readStandard("sdk-development");
    const rules = standard.rules.map((rule) => `${rule.id} ${rule.rule}`).join("\n");

    expect(standard.appliesTo).toEqual(expect.arrayContaining(["app", "module"]));
    expect(rules).toContain("sdk-only");
    expect(rules).toContain("app-core");
    expect(rules).toContain("deterministic");
    expect(rules).toContain("manualEditAllowed=false");
    expect(rules).toContain("publicPortsOnly=true");
  });

  it("TaskNode standardRefs ve applicability matrisi iki yeni standardı raw JSON'a bağlar", () => {
    const refs = StandardRefsSchema.parse({
      enterpriseDeliveryRef: "enterprise-delivery",
      sdkDevelopmentRef: "sdk-development",
    }) as Record<string, unknown>;
    const applicability = JSON.parse(
      fs.readFileSync(path.join(ROOT, "src", "data", "standards-applicability.json"), "utf8"),
    );

    expect(refs.enterpriseDeliveryRef).toBe("enterprise-delivery");
    expect(refs.sdkDevelopmentRef).toBe("sdk-development");
    expect(applicability.requiredByLevel.app).toEqual(
      expect.arrayContaining(["enterpriseDeliveryRef", "sdkDevelopmentRef"]),
    );
    expect(applicability.requiredByLevel.module).toEqual(
      expect.arrayContaining(["enterpriseDeliveryRef", "sdkDevelopmentRef"]),
    );
  });
});
