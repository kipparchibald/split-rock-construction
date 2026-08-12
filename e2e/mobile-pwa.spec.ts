import { test, expect } from "@playwright/test";

test.describe("mobile shell + PWA", () => {
  test("key routes have no horizontal overflow at phone width", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chrome", "Mobile only");
    const routes = [
      "/",
      "/portal/login",
      "/app",
      "/app/field",
      "/app/portal",
      "/app/draws",
      "/app/daily-logs",
      "/app/bids",
      "/app/permits",
    ];
    for (const path of routes) {
      await page.goto(path, { waitUntil: "networkidle" });
      await page.waitForTimeout(400);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      );
      expect(overflow, `overflow on ${path}`).toBe(false);
    }
  });

  test("service worker file is served", async ({ request }) => {
    const res = await request.get("/sw.js");
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toMatch(/split-rock-shell/);
  });
});
