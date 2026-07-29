import { test, expect } from "@playwright/test";
import { gotoApp } from "./helpers";

test.describe("smoke", () => {
  test("marketing site loads with brand and CTA", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));

    await gotoApp(page, "/", /built on solid ground/i);
    await expect(page.getByText(/split rock/i).first()).toBeVisible();
    await expect(
      page.getByRole("link", { name: /ops suite|open field suite|launch ops suite/i }).first(),
    ).toBeVisible();
    expect(errors, errors.join("\n")).toEqual([]);
  });

  test("command center shows needs attention and jobs", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));

    await gotoApp(page, "/app", /command center/i);
    await expect(page.getByText(/needs attention/i)).toBeVisible();
    await expect(page.getByText(/active jobs/i).first()).toBeVisible();
    expect(errors, errors.join("\n")).toEqual([]);
  });
});
