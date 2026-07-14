import { expect, test } from "@playwright/test";

test.describe("Enterprise app sözleşmesi rotaları", () => {
  test("app sayfası sınıflandırma, ticari model ve SDK-only sözleşmesini gösterir", async ({
    page,
  }) => {
    await page.goto("/task/s-clinic/", { waitUntil: "networkidle" });

    const panel = page.getByTestId("enterprise-delivery-panel");
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("Bağımsız enterprise app sözleşmesi");
    await expect(panel).toContainText("App sınıflandırması");
    await expect(panel).toContainText("sector-app");
    await expect(panel).toContainText("Ticari model ve entitlement");
    await expect(panel).toContainText("enterprise-subscription");
    await expect(panel).toContainText("SDK zorunlu");
    await expect(panel).toContainText("MVP yasak");
  });

  test("app-core sayfası SDK tabanlı modül sözleşmesini gösterir", async ({ page }) => {
    await page.goto("/task/s-clinic-core/", { waitUntil: "networkidle" });

    const panel = page.getByTestId("enterprise-delivery-panel");
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("SDK tabanlı enterprise modül sözleşmesi");
    await expect(panel).toContainText("s-clinic");
    await expect(panel).toContainText("SDK zorunlu");
    await expect(panel).toContainText("MVP yasak");
  });

  test("eski distribution rotası kanonik app sözleşmesini çözer", async ({ page }) => {
    await page.goto("/task/dist-clinic/", { waitUntil: "networkidle" });

    const panel = page.getByTestId("enterprise-delivery-panel");
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("Bağımsız enterprise app sözleşmesi");
    await expect(panel).toContainText("Health / Clinic");
    await expect(panel.getByRole("link", { name: "s-clinic-core" }).first()).toHaveAttribute(
      "href",
      "/task/s-clinic-core/",
    );
  });
});
