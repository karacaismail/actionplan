import { expect, test } from "@playwright/test";

// Duman testleri — temel rotaların açıldığını ve gezinmenin çalıştığını doğrular.
// baseURL playwright.config.ts içinde tanımlı; goto çağrıları göreli yol kullanır.

test.describe("Duman testleri", () => {
  test("Gösterge Paneli açılır ve uygulama başlığı görünür", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Üst bardaki uygulama başlığı "Eylem Planı" görünür olmalı.
    await expect(page.getByText("Eylem Planı", { exact: false }).first()).toBeVisible();

    // Gösterge Paneli başlığı (h1) görünür olmalı.
    await expect(page.getByRole("heading", { name: "Gösterge Paneli", level: 1 })).toBeVisible();
  });

  test("WBS ağacı: görev linkine tıklayınca detay sayfası açılır", async ({ page }) => {
    await page.goto("/wbs", { waitUntil: "networkidle" });

    // Arama input'u var olmalı (header global + WBS yerel arama olabilir → ilki yeterli).
    await expect(page.getByRole("searchbox").first()).toBeVisible();

    // En az bir WBS görev linki ("/task/<id>") bulunmalı.
    const taskLinks = page.locator('a[href*="/task/"]');
    await expect(taskLinks.first()).toBeVisible();
    expect(await taskLinks.count()).toBeGreaterThan(0);

    // İlk göreve tıkla → URL "/task/" içermeli.
    await taskLinks.first().click();
    await page.waitForURL(/\/task\//);
    expect(page.url()).toContain("/task/");

    // Detay sayfasında başlık (h1) görünür olmalı.
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("Pano & Tablo konsol hatası olmadan açılır", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/board", { waitUntil: "networkidle" });

    // Temel görünürlük: ana içerik bölgesi render olmalı.
    await expect(page.locator("main#main")).toBeVisible();
    expect(errors, `Konsol hataları: ${errors.join(" | ")}`).toHaveLength(0);
  });

  test("Bağımlılık Grafiği konsol hatası olmadan açılır", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/graph", { waitUntil: "networkidle" });

    // Temel görünürlük: ana içerik bölgesi render olmalı.
    await expect(page.locator("main#main")).toBeVisible();
    expect(errors, `Konsol hataları: ${errors.join(" | ")}`).toHaveLength(0);
  });
});
