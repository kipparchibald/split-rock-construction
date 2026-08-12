import { test, expect } from "@playwright/test";

test.describe("operator demo sign-in", () => {
  test("one-click Kipp demo signs in and reaches command center", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));

    await page.goto("/login", { waitUntil: "networkidle" });
    await expect(page.getByTestId("operator-demo-section")).toBeVisible();
    await page.getByTestId("operator-demo-kipp").click();

    await expect(page).toHaveURL(/\/app/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /command center/i })).toBeVisible();
    await expect(page.getByTestId("operator-login-error")).toHaveCount(0);
    expect(errors, errors.join("\n")).toEqual([]);
  });

  test("portal demo client one-click reaches owner portal", async ({ page }) => {
    await page.goto("/portal/login", { waitUntil: "networkidle" });
    await expect(page.getByTestId("portal-demo-clients")).toBeVisible();
    await page.getByTestId("portal-demo-c1").click();
    await expect(page).toHaveURL(/\/app\/portal/, { timeout: 10_000 });
    await expect(page.getByTestId("portal-root")).toBeVisible();
  });
});
