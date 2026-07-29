import { test, expect } from "@playwright/test";
import { gotoApp, selectTab } from "./helpers";

test.describe("commercial", () => {
  test("commercial module shows subs and pay apps", async ({ page }) => {
    await gotoApp(page, "/app/commercial", /commercial/i);
    await expect(page.getByText(/subcontract volume|subcontracts/i).first()).toBeVisible();
    await expect(page.getByText(/valley concrete|intermountain steel/i).first()).toBeVisible();

    await selectTab(page, /pay applications/i);
    await expect(page.getByText(/pay app #/i).first()).toBeVisible();
    await expect(page.getByText(/commerce park/i).first()).toBeVisible();
  });

  test("commercial job hub has delivery tabs", async ({ page }, testInfo) => {
    await gotoApp(page, "/app/projects/p5", /commerce park shell/i);
    if (testInfo.project.name.includes("mobile")) {
      await page.getByLabel(/job section/i).click();
      await page.getByRole("option", { name: /pay apps/i }).click();
    } else {
      await selectTab(page, /pay apps/i);
    }
    await expect(page.getByText(/pay app #/i).first()).toBeVisible();
  });
});
