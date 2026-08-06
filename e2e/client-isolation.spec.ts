import { test, expect } from "@playwright/test";

test.describe("client portal isolation", () => {
  test("Hart cannot see Bennett job names", async ({ page }) => {
    await page.goto("/portal/login", { waitUntil: "networkidle" });
    await page.getByTestId("portal-demo-c1").click();
    await expect(page).toHaveURL(/\/app\/portal/);
    await expect(page.getByTestId("portal-root")).toHaveAttribute("data-client-id", "c1");
    await expect(page.getByTestId("portal-root")).toHaveAttribute("data-isolated", "true");
    await expect(page.getByTestId("portal-isolation-note")).toBeVisible();

    const body = await page.locator("body").innerText();
    expect(body).toMatch(/Hart/i);
    // Bennett / Willow should not appear in Hart's scoped portal
    expect(body).not.toMatch(/Willow Creek/i);
    expect(body).not.toMatch(/Bennett/i);

    // Deep-link attack: foreign project id stripped
    await page.goto("/app/portal?project=p3", { waitUntil: "networkidle" });
    // Session lost on full reload? portal session is localStorage — should survive
    await page.waitForTimeout(500);
    // If session survived
    const isolated = page.getByTestId("portal-root");
    if (await isolated.isVisible().catch(() => false)) {
      const text = await page.locator("body").innerText();
      expect(text).not.toMatch(/Willow Creek/i);
      await expect(page.getByTestId("portal-root")).toHaveAttribute("data-client-id", "c1");
    }
  });

  test("client session cannot open operator command center", async ({ page }) => {
    await page.goto("/portal/login", { waitUntil: "networkidle" });
    await page.getByTestId("portal-demo-c3").click();
    await expect(page).toHaveURL(/\/app\/portal/);
    await page.goto("/app", { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    // Redirected back to portal
    await expect(page).toHaveURL(/\/app\/portal/);
    await expect(page.getByTestId("client-shell")).toBeVisible();
    await expect(page.getByTestId("portal-root")).toBeVisible();
  });

  test("wrong access code is rejected", async ({ page }) => {
    await page.goto("/portal/login", { waitUntil: "networkidle" });
    await page.getByTestId("portal-login-email").fill("elena.hart@email.com");
    await page.getByTestId("portal-login-code").fill("WRONGCOD");
    await page.getByTestId("portal-login-submit").click();
    await expect(page.getByTestId("portal-login-error")).toBeVisible();
    await expect(page).toHaveURL(/\/portal\/login/);
  });
});
