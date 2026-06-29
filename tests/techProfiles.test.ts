import manifest from "@/data/tech-profiles.json";
import { TechProfilesManifestSchema } from "@/schemas";
import { describe, expect, it } from "vitest";

/**
 * Tech-profile manifesti (ADR-0026) kapısı: tek doğruluk kaynağı şemaya uyar,
 * headless KİLİT zorlanır, stillenmiş kitler global yasaklı.
 */
describe("tech-profiles manifesti", () => {
  const parsed = TechProfilesManifestSchema.parse(manifest);

  it("manifest şemaya uyar + profil id'leri benzersiz", () => {
    const ids = parsed.profiles.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(parsed.profiles.length).toBeGreaterThanOrEqual(3);
  });

  it("KİLİT: tüm profiller headless", () => {
    expect(parsed.profiles.every((p) => p.headless === true)).toBe(true);
  });

  it("stillenmiş kitler + yasak framework'ler global yasakta", () => {
    for (const pkg of ["antd", "@mui/material", "@chakra-ui/react", "flowbite", "next", "redux"]) {
      expect(parsed.bannedGlobal).toContain(pkg);
    }
  });

  it("ürün (saas-app) headless Radix + SCSS token; Tailwind ürün CSS'i değil", () => {
    const app = parsed.profiles.find((p) => p.id === "saas-app");
    expect(app?.primitive).toBe("radix");
    expect(app?.css).toBe("scss-tokens");
    expect(app?.router).toBe("tanstack-router");
  });

  it("statik frontpage React'sız (alpine) ayrı yüzey", () => {
    const fp = parsed.profiles.find((p) => p.id === "static-frontpage");
    expect(fp?.runtime).toContain("alpine");
    expect(fp?.runtime).not.toContain("react19");
  });

  it("araç (tooling) ürün değil → Tailwind serbest ama yine headless", () => {
    const tool = parsed.profiles.find((p) => p.id === "tooling");
    expect(tool?.css).toBe("tailwind");
    expect(tool?.headless).toBe(true);
  });
});
