import { test, expect } from "@playwright/test";
import { gotoApp, selectTab } from "./helpers";

test.describe("job hub", () => {
  test("opens Hart Residence with sticky context and sections", async ({ page }, testInfo) => {
    await gotoApp(page, "/app/projects/p1", /hart residence/i);
    await expect(page.getByText(/river bend/i).first()).toBeVisible();
    // Sticky context bar
    await expect(page.getByText(/MEP Rough-In/i).first()).toBeVisible();

    if (testInfo.project.name.includes("mobile")) {
      await expect(page.getByLabel(/job section/i)).toBeVisible();
      await page.getByLabel(/job section/i).click();
      await page.getByRole("option", { name: /draws/i }).click();
      await expect(page.getByText(/contract deposit/i).first()).toBeVisible();
    } else {
      await selectTab(page, "Draws");
      await expect(page.getByText(/contract deposit/i).first()).toBeVisible({ timeout: 15_000 });
      await selectTab(page, "Change orders");
      await expect(page.getByText("CO-003").first()).toBeVisible({ timeout: 15_000 });
    }
  });

  test("jobs list filters work", async ({ page }) => {
    await gotoApp(page, "/app/projects", /^jobs$/i);
    await expect(page.getByRole("tab", { name: /active/i })).toBeVisible();
    await page.getByRole("tab", { name: /^all /i }).click();
    await expect(page.getByText(/hart residence/i)).toBeVisible();
  });
});
