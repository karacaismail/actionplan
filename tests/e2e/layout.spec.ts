import { expect, test } from "@playwright/test";

/**
 * KALICI YERLEŞİM KİLİDİ (gerçek piksel): boyut kartları geniş ekranda 2-sütun grid içinde
 * YAN YANA durmalı. CSS masonry (columns) tek-sütuna düşürüyordu; bu test ilk iki kartın
 * AYNI satırda (üst Y yakın) ve yan yana (ikincisi sağda) olduğunu boundingBox ile doğrular.
 */
test("boyut kartları geniş ekranda yan yana (2 sütun grid)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto("/task/golden-slice-ref", { waitUntil: "networkidle" });

  const grid = page.getByTestId("dimensions-grid");
  await expect(grid).toBeVisible();

  const cards = grid.locator("> *");
  expect(await cards.count()).toBeGreaterThanOrEqual(14);

  const b0 = await cards.nth(0).boundingBox();
  const b1 = await cards.nth(1).boundingBox();
  if (!b0 || !b1) throw new Error("kart sınır kutusu (boundingBox) alınamadı");

  // Aynı satır: ilk iki kartın üst Y koordinatları birbirine yakın.
  expect(Math.abs(b0.y - b1.y)).toBeLessThan(24);
  // Yan yana: ikinci kart birincinin sağında (sol kenarı, birincinin ortasından sağda).
  expect(b1.x).toBeGreaterThan(b0.x + b0.width / 2);
});
