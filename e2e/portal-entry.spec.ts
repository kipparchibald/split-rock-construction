import { test, expect } from "@playwright/test";

test.describe("client portal entry", () => {
  test("/portal redirects to client sign-in", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));

    await page.goto("/portal", { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/portal\/login\/?$/, { timeout: 10_000 });
    await expect(page.getByRole("heading", { name: /sign in to your build/i })).toBeVisible();
    expect(errors, errors.join("\n")).toEqual([]);
  });

  test("/portal/login loads client sign-in form", async ({ page }) => {
    await page.goto("/portal/login", { waitUntil: "networkidle" });
    await expect(page.getByTestId("portal-login-email")).toBeVisible();
    await expect(page.getByTestId("portal-login-code")).toBeVisible();
    await expect(page.getByTestId("portal-login-submit")).toBeVisible();
  });
});
