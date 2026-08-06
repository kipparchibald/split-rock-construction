import { test, expect } from "@playwright/test";
import { gotoApp, selectTab } from "./helpers";

test.describe("money flows", () => {
  test("pricing calculator shows contract price and draw schedule", async ({ page }) => {
    await gotoApp(page, "/app/pricing", /bid & price/i);
    await expect(page.getByText(/contract price/i).first()).toBeVisible();
    await expect(page.getByText("Safe floor", { exact: true })).toBeVisible();

    await selectTab(page, /progress draws/i);
    await expect(page.getByText(/standard draw schedule|draw schedule/i).first()).toBeVisible();
    await expect(page.getByText(/retainage/i).first()).toBeVisible();
  });

  test("draws queue lists action items and can advance", async ({ page }) => {
    await gotoApp(page, "/app/draws", /progress draws/i);
    await expect(page.getByRole("tab", { name: /needs action/i })).toBeVisible();

    const submit = page.getByRole("button", { name: /submit to owner/i }).first();
    const ready = page.getByRole("button", { name: /mark ready/i }).first();
    if (await submit.isVisible().catch(() => false)) {
      await submit.click();
      await expect(page.getByText(/submitted|mark paid|draw submitted/i).first()).toBeVisible();
    } else if (await ready.isVisible().catch(() => false)) {
      await ready.click();
      await expect(page.getByText(/ready|submit/i).first()).toBeVisible();
    } else {
      await page.getByRole("tab", { name: /^all/i }).click();
      await expect(
        page.getByText(/hart|willow|crestview|residence|home/i).first(),
      ).toBeVisible();
    }
  });

  test("bid board loads list or board with actions", async ({ page }) => {
    await gotoApp(page, "/app/bids", /bid board/i);
    await expect(page.getByText(/open pipeline|win rate/i).first()).toBeVisible();
    const cards = page.getByTestId("bid-card");
    await expect(cards.first()).toBeVisible();
  });
});
