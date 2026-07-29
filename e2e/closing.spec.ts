import { test, expect } from "@playwright/test";
import { gotoApp, selectTab } from "./helpers";

test.describe("closing dual-track", () => {
  test("closing module shows both lanes and policy", async ({ page }) => {
    await gotoApp(page, "/app/closing", /closing & dual-role/i);
    await expect(page.getByText(/construction closeout/i).first()).toBeVisible();
    await expect(page.getByText(/realty transaction/i).first()).toBeVisible();
    await expect(page.getByText(/crestview|hart residence|commerce park/i).first()).toBeVisible();
    await expect(page.getByText(/trust/i).first()).toBeVisible();

    await selectTab(page, /dual-role policy/i);
    await expect(page.getByText(/never substitute/i).first()).toBeVisible();
  });

  test("job hub closeout tab loads", async ({ page }, testInfo) => {
    await gotoApp(page, "/app/projects/p3", /crestview/i);
    if (testInfo.project.name.includes("mobile")) {
      await page.getByLabel(/job section/i).click();
      await page.getByRole("option", { name: /closeout/i }).click();
    } else {
      await selectTab(page, /closeout/i);
    }
    await expect(page.getByText(/substantial completion/i).first()).toBeVisible();
  });
});
