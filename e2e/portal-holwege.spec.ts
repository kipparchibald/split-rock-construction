import { test, expect } from "@playwright/test";

test.describe("Holwege owner portal polish", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("login shows field note + Draw 1 Ready without ops language", async ({ page }) => {
    // Drop any leftover portal session from earlier E2E (otherwise login auto-redirects as c1).
    await page.goto("/portal/login", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      try {
        window.localStorage.removeItem("split-rock-portal-session-v1");
      } catch {
        /* ignore */
      }
    });
    await page.goto("/portal/login", { waitUntil: "networkidle" });

    await page.getByTestId("portal-login-email").fill("holwegefam@comcast.net");
    await page.getByTestId("portal-login-code").fill("HOLW2026");
    await page.getByTestId("portal-login-submit").click();

    await expect(page).toHaveURL(/\/app\/portal/);
    await expect(page.getByTestId("portal-root")).toHaveAttribute("data-client-id", "c-holwege");
    await expect(page.getByTestId("portal-root")).toHaveAttribute("data-isolated", "true");

    // Owner-safe field note (dl-holwege-1) — never raw client.notes
    await expect(page.getByTestId("portal-builder-notes")).toBeVisible();
    await expect(page.getByText(/Pre-construction/i).first()).toBeVisible();

    // Draw 1 Ready ~$65,933.01 (formatCurrency may round cents)
    const money = page.getByTestId("portal-money");
    await expect(money).toBeVisible();
    await expect(money.getByText(/Agreement \+ permit \+ mobilization/i).first()).toBeVisible();
    await expect(money.getByText(/\$65,933/).first()).toBeVisible();
    await expect(money.getByText(/ready/i).first()).toBeVisible();

    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/draw base/i);
    // Remaining $659,330 is legitimate unpaid schedule total — only ban draw-base wording
    expect(body).not.toMatch(/draw\s+base\s*\$?\s*659/i);
    expect(body).not.toMatch(/P\s*&\s*O|profit\s*&?\s*overhead/i);
    expect(body).not.toMatch(/contingency/i);
    expect(body).not.toMatch(/do not invent/i);
    expect(body).not.toMatch(/retainage/i);
    expect(body).not.toMatch(/reserve\)/i);
    // Ops-only client.notes land language must not surface
    expect(body).not.toMatch(/Alliance 1100920/i);
    expect(body).not.toMatch(/do not send credentials/i);

    // Operator job-hub deep links hidden for client session
    await expect(page.getByRole("link", { name: /full schedule/i })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /all logs/i })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /operator job hub/i })).toHaveCount(0);
  });
});
