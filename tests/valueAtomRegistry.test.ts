import { REQUIRED_VALUE_ATOM_IDS, VALUE_ATOM_DEFINITIONS } from "@/data/value-atom-registry";
import { ValueAtomDefinitionSchema } from "@/schemas";
import { describe, expect, it } from "vitest";

const REQUIRED = [
  "money",
  "measure",
  "percentage",
  "i18n-text",
  "duration",
  "term",
  "recurrence",
  "range",
  "uuid",
  "timestamptz",
  "decimal",
  "party-ref",
  "asset-ref",
  "clause-ref",
  "external-id",
  "signature-field",
  "fragment",
  "local-date",
  "local-time",
  "zoned-datetime",
  "business-day",
] as const;

describe("atomik değer tipi registry", () => {
  it("zorunlu 21 atomun tamamını tekil tanımlar", () => {
    expect(new Set(REQUIRED_VALUE_ATOM_IDS)).toEqual(new Set(REQUIRED));
  });

  it("her atom tam sözleşme ve 13 boyutla parse olur", () => {
    for (const definition of Object.values(VALUE_ATOM_DEFINITIONS)) {
      const parsed = ValueAtomDefinitionSchema.parse(definition);
      expect(Object.keys(parsed.dimensions)).toHaveLength(13);
      expect(parsed.runtime.contractFingerprint).toMatch(/^sha256:/);
      expect(parsed.testVectors.some((vector) => vector.kind === "negative")).toBe(true);
    }
  });

  it("registry bağımlı atomlar sürüm ve effective date taşır", () => {
    for (const id of [
      "money",
      "measure",
      "i18n-text",
      "duration",
      "term",
      "recurrence",
      "timestamptz",
    ] as const) {
      expect(VALUE_ATOM_DEFINITIONS[id].registryRefs.length).toBeGreaterThan(0);
      expect(VALUE_ATOM_DEFINITIONS[id].registryRefs[0]?.version).toBeTruthy();
      expect(VALUE_ATOM_DEFINITIONS[id].registryRefs[0]?.effectiveFrom).toBe("2026-01-01");
    }
  });

  it("backend ve frontend adapterları ortak fingerprint taşır", () => {
    for (const definition of Object.values(VALUE_ATOM_DEFINITIONS)) {
      expect(definition.runtime.backendAdapter).toBeTruthy();
      expect(definition.runtime.frontendAdapter).toBeTruthy();
      expect(definition.runtime.contractFingerprint).toBeTruthy();
    }
  });
});
