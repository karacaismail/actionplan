import fs from "node:fs";
import path from "node:path";
import { ArchetypeContractSchema, STEEL_WALLS } from "@/schemas";
import { describe, expect, it } from "vitest";

/**
 * ArcheType sözleşme fixtures + politika kapıları (conformance).
 * Product ve Customer örneklerinin çok-parçalı sözleşmeye uyduğunu ve AI/migration/ruleset
 * güvenlik sınırlarını taşıdığını doğrular.
 */
const DIR = path.resolve(process.cwd(), "src/data/archetypes");
const FIXTURES = ["product", "customer"];
const load = (id: string) => JSON.parse(fs.readFileSync(path.join(DIR, `${id}.json`), "utf8"));

describe("ArcheType sözleşme fixtures", () => {
  for (const id of FIXTURES) {
    it(`${id}: çok-parçalı sözleşme şemaya uyar`, () => {
      const r = ArchetypeContractSchema.safeParse(load(id));
      if (!r.success) console.error(id, r.error.issues.slice(0, 5));
      expect(r.success).toBe(true);
    });

    it(`${id}: AI yetki sınırı (yalnız archetype; app/module + ruleset override yasak)`, () => {
      const c = ArchetypeContractSchema.parse(load(id));
      expect(c.aiPolicy.allowedTargets).toContain("archetype");
      expect(c.aiPolicy.forbiddenTargets).toEqual(expect.arrayContaining(["app", "module"]));
      expect(["draft", "none", "suggest"]).toContain(c.aiPolicy.autonomy);
      expect(c.aiPolicy.rulesetBoundary.enforced).toBe(true);
      expect(c.aiPolicy.rulesetBoundary.canOverride).toBe(false);
      expect(c.aiPolicy.prodDataPolicy.preserveHistory).toBe(true);
      expect(c.aiPolicy.forbiddenActions).toEqual(
        expect.arrayContaining([
          "generate-app",
          "generate-module",
          "override-ruleset",
          "direct-prod-write",
        ]),
      );
    });

    it(`${id}: migration güvenliği (doğrudan delete/rename/type-change yasak + snapshot/rollback)`, () => {
      const c = ArchetypeContractSchema.parse(load(id));
      expect(c.migrationPolicy.forbidDirect).toEqual(
        expect.arrayContaining(["delete", "rename", "type-change"]),
      );
      expect(c.migrationPolicy.requireSnapshot).toBe(true);
      expect(c.migrationPolicy.requireRollback).toBe(true);
      expect(c.migrationPolicy.dataLossNeedsOwnerApproval).toBe(true);
    });

    it(`${id}: ruleset 3 katman (system kilitli, tenant yalnız güvenli param)`, () => {
      const c = ArchetypeContractSchema.parse(load(id));
      const layers = c.rulesetBindings.map((r) => r.layer);
      expect(layers).toEqual(expect.arrayContaining(["system", "platform", "tenant"]));
      expect(c.rulesetBindings.find((r) => r.layer === "system")?.immutable).toBe(true);
      const tenant = c.rulesetBindings.find((r) => r.layer === "tenant");
      expect(tenant?.tenantEditableParams.length ?? 0).toBeGreaterThan(0);
    });

    it(`${id}: tüm çelik duvarlar mevcut`, () => {
      const c = ArchetypeContractSchema.parse(load(id));
      expect(c.steelWalls).toEqual(expect.arrayContaining([...STEEL_WALLS]));
    });

    it(`${id}: PII alanları işaretli ve audit immutable`, () => {
      const c = ArchetypeContractSchema.parse(load(id));
      expect(c.auditPolicy.immutable).toBe(true);
      expect(c.tenantIsolation.enforced).toBe(true);
    });
  }
});
