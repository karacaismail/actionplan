import { expect, test } from "@playwright/test";

test.describe("Kernel WBS görev entegrasyonu", () => {
  test("consumer app ve app-core aynı manifest roll-up'ını public SDK sınırında gösterir", async ({
    page,
  }) => {
    for (const taskId of ["s-clinic", "s-clinic-core"]) {
      await page.goto(`/task/${taskId}/`, { waitUntil: "networkidle" });

      const panel = page.getByTestId("kernel-integration-panel");
      await expect(panel).toBeVisible();
      await expect(panel).toContainText("consumer");
      await expect(panel).toContainText("sdk-public-contract");
      await expect(panel).toContainText("k-jurisdiction");
      await expect(panel).toContainText("k-surface-consumer");
      await expect(panel).toContainText("k-calendar-capacity");
      await expect(panel).toContainText("Sahiplik sınırı");
      await expect(panel).toContainText("Planlanan test referansı gerçek runtime kanıt değildir.");
    }
  });

  test("kanonik provider ile ArcheType specification contributor ayrımını gösterir", async ({
    page,
  }) => {
    await page.goto("/task/k-mode/", { waitUntil: "networkidle" });
    const provider = page.getByTestId("kernel-integration-panel");
    await expect(provider).toContainText("provider");
    await expect(provider).toContainText("k-mode");
    await expect(provider).toContainText("k-archetype-mode-profile");

    await page.goto("/task/k-archetype-mode-profile/", { waitUntil: "networkidle" });
    const contributor = page.getByTestId("kernel-integration-panel");
    await expect(contributor).toContainText("contributor");
    await expect(contributor).toContainText("specification");
    await expect(contributor).toContainText("Runtime provider claim allowed");
    await expect(contributor).toContainText("false");
  });

  test("N/A görev de gerekçeli ve görünür Kernel kararı taşır", async ({ page }) => {
    await page.goto("/task/adr-0001/", { waitUntil: "networkidle" });

    const panel = page.getByTestId("kernel-integration-panel");
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("not-applicable");
    await expect(panel).toContainText("mevcut WBS sahipliğinde kalır");
  });
});
