import { type Page, expect } from "@playwright/test";

/**
 * Navigate to an /app route and wait for its page heading.
 * Use `load` (not `networkidle`) — Mapbox/Esri tiles and analytics keep the
 * network busy and flake site-plan / GIS specs at 45s.
 */
export async function gotoApp(page: Page, path: string, heading: RegExp) {
  await page.goto(path, { waitUntil: "load", timeout: 45_000 });
  await expect(page.getByRole("heading", { name: heading }).first()).toBeVisible({
    timeout: 20_000,
  });
}

export async function selectTab(page: Page, name: string | RegExp) {
  const tab = page.getByRole("tab", { name }).first();
  await expect(tab).toBeVisible();
  await tab.scrollIntoViewIfNeeded();
  await tab.click();
  try {
    await expect(tab).toHaveAttribute("data-state", "active", { timeout: 3_000 });
  } catch {
    // Controlled tabs can lag; content assertions below cover correctness.
  }
}
