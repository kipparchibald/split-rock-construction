import { test, expect } from "@playwright/test";
import { gotoApp } from "./helpers";

test.describe("clients CRM", () => {
  test("create client in demo mode", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));

    await gotoApp(page, "/app/clients", /clients/i);
    await page.getByRole("button", { name: /add client/i }).click();
    await page.getByTestId("client-name").fill("E2E Test Client");
    await page.getByTestId("client-email").fill("e2e-client@splitrock.test");
    await page.getByLabel("Phone").fill("(208) 555-0199");
    await page.getByTestId("client-save").click();

    await expect(page.getByText("E2E Test Client")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("e2e-client@splitrock.test")).toBeVisible();
    expect(errors, errors.join("\n")).toEqual([]);
  });
});
