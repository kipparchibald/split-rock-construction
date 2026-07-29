import { test, expect } from "@playwright/test";
import { gotoApp } from "./helpers";

test.describe("portal and field", () => {
  test("owner portal shows progress and decisions", async ({ page }) => {
    await gotoApp(page, "/app/portal", /owner portal/i);
    await expect(page.getByText(/needs your decision|welcome/i).first()).toBeVisible();
    await expect(page.getByText(/progress|contract|paid to date/i).first()).toBeVisible();
  });

  test("daily logs show site photos and post form", async ({ page }) => {
    await gotoApp(page, "/app/daily-logs", /daily logs/i);
    await expect(page.locator('img[alt="Site photo"]').first()).toBeVisible();
    await expect(page.locator("#work-done")).toBeVisible();
    await expect(page.getByRole("button", { name: /post log/i })).toBeVisible();

    // Interactive post — use sequential typing so React state tracks
    const note = `QA log ${Date.now()}`;
    await page.locator("#work-done").click();
    await page.locator("#work-done").fill("");
    await page.keyboard.type(note, { delay: 5 });
    await page.getByRole("button", { name: /post log/i }).click();
    await expect(page.getByText(note).first()).toBeVisible({ timeout: 15_000 });
  });
});
