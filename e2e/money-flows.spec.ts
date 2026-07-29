import { test, expect } from "@playwright/test";
import { gotoApp, selectTab } from "./helpers";

test.describe("money flows", () => {
  test("pricing calculator shows contract price and draw schedule", async ({ page }) => {
    await gotoApp(page, "/app/pricing", /bid & price/i);
    await expect(page.getByText(/contract price/i).first()).toBeVisible();
    await expect(page.getByText("Safe floor", { exact: true })).toBeVisible();

    await selectTab(page, /progress draws/i);
    await expect(page.getByText(/standard draw schedule/i).first()).toBeVisible();
    await expect(page.getByText(/retainage/i).first()).toBeVisible();
  });

  test("draws queue lists ready items and can submit", async ({ page }) => {
    await gotoApp(page, "/app/draws", /progress draws/i);
    await expect(page.getByRole("tab", { name: /needs action/i })).toBeVisible();

    const submit = page.getByRole("button", { name: /^submit$/i }).first();
    if (await submit.isVisible()) {
      await submit.click();
      await expect(page.getByText(/submitted/i).first()).toBeVisible();
    } else {
      await page.getByRole("tab", { name: /^all /i }).click();
      await expect(page.getByText(/hart residence|willow creek|crestview/i).first()).toBeVisible();
    }
  });
});
