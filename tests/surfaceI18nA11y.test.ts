import { SurfaceA11ySchema, SurfaceContractSchema } from "@/schemas";
import { describe, expect, it } from "vitest";

/**
 * Surface v2 — a11y varsayılanı + i18n beyanı (surface-v2-directive §8-9, SRF2-04/SRF2-05).
 * WCAG tabanı yasal + uygulanabilir seviyeye (`2.2-AA`) indirilir; AAA opsiyonel hedef değer
 * olarak geçerli kalır. i18n bloğu opsiyoneldir (geriye-uyumlu) ve parse edilebilir olmalıdır.
 */
describe("surface a11y varsayılanı + i18n beyanı", () => {
  it("a11y.wcag varsayılanı 2.2-AA'dır (AAA aşırı-iddiası kaldırıldı)", () => {
    const a11y = SurfaceA11ySchema.parse({});
    expect(a11y.wcag).toBe("2.2-AA");
  });

  it("a11y.wcag AAA opsiyonel değer olarak hâlâ kabul edilir", () => {
    const a11y = SurfaceA11ySchema.parse({ wcag: "2.2-AAA" });
    expect(a11y.wcag).toBe("2.2-AAA");
  });

  it("i18n alanı parse ediliyor (varsayılanlar dolduruluyor)", () => {
    const surface = SurfaceContractSchema.parse({
      id: "sf-i18n-demo",
      name: "i18n Demo",
      description: "i18n beyanı olan yüzey",
      type: "list",
      i18n: { locales: ["tr", "en"] },
    });
    expect(surface.i18n).toBeDefined();
    expect(surface.i18n?.locales).toEqual(["tr", "en"]);
    expect(surface.i18n?.defaultLocale).toBe("tr");
    expect(surface.i18n?.rtl).toBe(false);
    expect(surface.i18n?.messagesRef).toBe("");
  });

  it("i18n alanı opsiyoneldir — beyansız yüzey geriye-uyumlu parse olur", () => {
    const surface = SurfaceContractSchema.parse({
      id: "sf-no-i18n",
      name: "i18n'siz",
      description: "eski yüzey; i18n beyanı yok",
      type: "detail",
    });
    expect(surface.i18n).toBeUndefined();
  });
});
