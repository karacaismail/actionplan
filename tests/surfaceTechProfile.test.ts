import catalog from "@/data/surface/surface-catalog.json";
import manifest from "@/data/tech-profiles.json";
import { SurfaceContractSchema } from "@/schemas";
import { describe, expect, it } from "vitest";

/**
 * Faz 2 — Surface ↔ tech-profile bağı (ADR-0026).
 * Teknoloji Surface seviyesinde bağlanır; her surface bir techProfileRef taşır ve
 * bu referans tech-profiles.json manifestindeki bir profile çözülmelidir (referans bütünlüğü).
 * ArcheType teknolojiyi linkedSurfaces üzerinden DEVRALIR; archetype kendisi tech seçmez.
 */
describe("surface ↔ tech-profile bağı", () => {
  const profileIds = new Set(manifest.profiles.map((p) => p.id));

  it("her surface sözleşmesi şemaya uyar (techProfileRef alanı dahil)", () => {
    for (const s of catalog) {
      const parsed = SurfaceContractSchema.parse(s);
      expect(typeof parsed.techProfileRef).toBe("string");
    }
  });

  it("her techProfileRef manifestte bir profile çözülür (referans bütünlüğü)", () => {
    for (const s of catalog) {
      expect(s.techProfileRef.length).toBeGreaterThan(0);
      expect(profileIds.has(s.techProfileRef)).toBe(true);
    }
  });

  it("dashboard yüzeyi data-viz, etkileşim yüzeyleri saas-app profiline bağlanır", () => {
    const byId = Object.fromEntries(catalog.map((s) => [s.id, s.techProfileRef]));
    expect(byId["sf-dashboard"]).toBe("data-viz");
    expect(byId["sf-generic-form"]).toBe("saas-app");
    expect(byId["sf-kanban-board"]).toBe("saas-app");
  });
});
