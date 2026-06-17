import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Erişilebilirlik testleri — axe-core ile WCAG 2.0/2.1/2.2 A & AA taraması.
// Yalnızca "serious" ve "critical" etkili ihlaller bloklayıcıdır.

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
const BLOKLAYICI_ETKILER = ["serious", "critical"];

// Tarama sonucundaki bloklayıcı ihlalleri okunabilir biçime çevirir.
function bloklayiciIhlaller(
  violations: Array<{ id: string; impact?: string | null; help: string; nodes: unknown[] }>,
) {
  return violations
    .filter((v) => BLOKLAYICI_ETKILER.includes(v.impact ?? ""))
    .map((v) => `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} öğe)`);
}

test.describe("Erişilebilirlik (axe-core)", () => {
  test("Gösterge Paneli (/) WCAG A/AA ihlali içermez", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const sonuc = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    const ihlaller = bloklayiciIhlaller(sonuc.violations);

    expect(
      ihlaller,
      `"/" sayfasında bloklayıcı erişilebilirlik ihlalleri:\n${ihlaller.join("\n")}`,
    ).toHaveLength(0);
  });

  test("WBS Ağacı (/wbs) WCAG A/AA ihlali içermez", async ({ page }) => {
    await page.goto("/wbs", { waitUntil: "networkidle" });

    const sonuc = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    const ihlaller = bloklayiciIhlaller(sonuc.violations);

    expect(
      ihlaller,
      `"/wbs" sayfasında bloklayıcı erişilebilirlik ihlalleri:\n${ihlaller.join("\n")}`,
    ).toHaveLength(0);
  });

  test("Gösterge Paneli 320px dar ekranda WCAG A/AA ihlali içermez", async ({ page }) => {
    // En dar mobil viewport — yansıma (reflow) ve dokunma hedefi ihlallerini yakalar.
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/", { waitUntil: "networkidle" });

    const sonuc = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    const ihlaller = bloklayiciIhlaller(sonuc.violations);

    expect(
      ihlaller,
      `320px ekranda bloklayıcı erişilebilirlik ihlalleri:\n${ihlaller.join("\n")}`,
    ).toHaveLength(0);
  });
});
