import { test, expect } from "@playwright/test";
import { gotoApp } from "./helpers";

test.describe("AI estimator + site plan GIS", () => {
  test("operator can open AI estimator and generate a GIS draft", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));

    await gotoApp(page, "/app/estimator", /ai estimator/i);
    await expect(page.getByText(/offline draft engine/i).first()).toBeVisible();
    await page.getByTestId("ai-estimator-run").click();
    await expect(page.getByText(/draft contract/i).first()).toBeVisible();
    await expect(page.getByText(/plat \/ gis constraints/i).first()).toBeVisible();
    expect(errors, errors.join("\n")).toEqual([]);
  });

  test("site plan layout shows aerial overlay and county GIS badge", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));

    await gotoApp(page, "/app/site-plan?lot=7", /site plan layout/i);
    await expect(page.getByText(/county gis/i).first()).toBeVisible();
    await expect(page.getByTestId("site-plan-shell")).toBeVisible();
    await expect(page.getByRole("link", { name: /price this lot/i })).toBeVisible();
    expect(errors, errors.join("\n")).toEqual([]);
  });
});
