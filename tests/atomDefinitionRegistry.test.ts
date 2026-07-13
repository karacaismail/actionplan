import registryJson from "@/data/atom-definition-registry.json";
import { AtomDefinitionRegistrySchema } from "@/schemas";
import { describe, expect, it } from "vitest";

describe("micro-step atom definition registry", () => {
  const registry = AtomDefinitionRegistrySchema.parse(registryJson);

  it("19 mevcut micro_step düğümünün tamamını tanımlar", () => {
    expect(Object.keys(registry.definitions)).toHaveLength(19);
  });

  it("16 demonstrasyon ve 3 yürütülebilir atomu açıkça ayırır", () => {
    const definitions = Object.values(registry.definitions);
    expect(definitions.filter((item) => item.kind === "task-demonstration")).toHaveLength(16);
    expect(definitions.filter((item) => item.kind === "task-micro-step")).toHaveLength(3);
  });

  it("her yürütülebilir atom pozitif, negatif ve edge test taşır", () => {
    for (const definition of Object.values(registry.definitions)) {
      if (definition.kind !== "task-micro-step") continue;
      expect(new Set(definition.testVectors.map((vector) => vector.kind))).toEqual(
        new Set(["positive", "negative", "edge"]),
      );
    }
  });
});
