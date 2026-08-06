import { test, expect } from "@playwright/test";
import { gotoApp } from "./helpers";

test.describe("portal and field", () => {
  test("owner portal shows progress and decisions", async ({ page }) => {
    await gotoApp(page, "/app/portal", /your home build|owner portal/i);
    await expect(
      page.getByText(/needs your decision|you're caught up|welcome/i).first(),
    ).toBeVisible();
    await expect(page.getByText(/progress|contract|paid to date/i).first()).toBeVisible();
  });

  test("daily logs show post form and can post", async ({ page }) => {
    await gotoApp(page, "/app/daily-logs", /daily logs/i);
    await expect(page.locator("#work-done")).toBeVisible();
    await expect(page.getByRole("button", { name: /post log/i })).toBeVisible();

    const note = `QA log ${Date.now()}`;
    await page.locator("#work-done").click();
    await page.locator("#work-done").fill(note);
    await page.getByRole("button", { name: /post log/i }).click();
    await expect(page.getByText(note).first()).toBeVisible({ timeout: 15_000 });
  });

  test("mobile bottom nav reaches field and portal", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chrome", "Mobile chrome only");
    await page.goto("/app", { waitUntil: "networkidle" });
    await expect(page.getByTestId("mobile-bottom-nav")).toBeVisible();
    await page.getByTestId("mobile-bottom-nav").getByRole("link", { name: "Field" }).click();
    await expect(page).toHaveURL(/\/app\/field/);
    await page.getByTestId("mobile-bottom-nav").getByRole("link", { name: "Portal" }).click();
    await expect(page).toHaveURL(/\/app\/portal/);
  });
});
