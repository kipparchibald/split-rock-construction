import { test, expect } from "@playwright/test";
import { gotoApp } from "./helpers";

test.describe("smoke", () => {
  test("marketing site loads with brand and CTA", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));

    await gotoApp(page, "/", /lots to build on|built well|homes built to suit/i);
    await expect(page.getByText(/split rock/i).first()).toBeVisible();
    await expect(page.getByText(/Idaho Contractor Registration 6481622/i).first()).toBeVisible();
    await expect(
      page.getByRole("link", { name: /browse teton|talk build|operator sign/i }).first(),
    ).toBeVisible();
    expect(errors, errors.join("\n")).toEqual([]);
  });

  test("command center shows needs attention and jobs", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));

    await gotoApp(page, "/app", /command center/i);
    await expect(page.getByText(/needs attention|owner decisions|money in flight/i).first()).toBeVisible();
    await expect(page.getByText(/active jobs/i).first()).toBeVisible();
    expect(errors, errors.join("\n")).toEqual([]);
  });

  test("PWA manifest is linked and valid", async ({ page, request }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const href = await page.locator('link[rel="manifest"]').getAttribute("href");
    expect(href).toBeTruthy();
    const res = await request.get(href!);
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.name).toMatch(/split rock/i);
    expect(json.start_url).toBeTruthy();
    expect(json.display).toBe("standalone");
  });
});
