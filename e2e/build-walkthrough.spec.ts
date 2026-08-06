/**
 * Dual-persona build walkthrough:
 * - GC (operator): field, permits, COs, draws, bids
 * - Customer: portal decisions, money, field updates
 * - Same-context handoff: GC sends CO → owner approves (must stay in SPA so Zustand keeps state)
 * - Parallel browser contexts: desktop GC + phone customer UX
 */
import { test, expect, type Page } from "@playwright/test";

async function noPageErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  return {
    assertClean: () => expect(errors, errors.join("\n")).toEqual([]),
  };
}

async function openJobTab(page: Page, tab: RegExp | string) {
  const label = typeof tab === "string" ? tab : undefined;
  // Desktop tabs
  const roleTab = page.getByRole("tab", { name: tab }).first();
  if (await roleTab.isVisible().catch(() => false)) {
    await roleTab.click();
    return;
  }
  // Mobile: section select
  const trigger = page.getByLabel(/job section/i);
  await expect(trigger).toBeVisible({ timeout: 10_000 });
  await trigger.click();
  const opt =
    label != null
      ? page.getByRole("option", { name: new RegExp(label, "i") })
      : page.getByRole("option", { name: tab });
  await opt.first().click();
  await page.waitForTimeout(200);
}

async function asGcWalkthrough(page: Page) {
  const guard = await noPageErrors(page);

  await page.goto("/app", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: /command center/i })).toBeVisible();

  await page.goto("/app/projects/p1", { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await openJobTab(page, /change/i);

  await page.getByRole("button", { name: /add change order/i }).click();
  const coTitle = `Walkthrough upgrade ${Date.now().toString().slice(-4)}`;
  await page.locator("#co-title").fill(coTitle);
  await page.locator("#co-amount").fill("4200");
  await page.locator("#co-days").fill("2");
  await page.locator("#co-desc").fill("GC walkthrough — upgrade exterior package.");
  await page.getByRole("button", { name: /save & send to owner/i }).click();
  await expect(page.getByText(/change order sent/i)).toBeVisible({ timeout: 10_000 });

  // Stay in SPA: open portal via in-app link so store keeps the new CO
  await page.getByRole("link", { name: /open owner portal/i }).click();
  await expect(page.getByRole("heading", { name: /your home build/i })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText(coTitle).first()).toBeVisible({ timeout: 10_000 });

  // Back to operator surfaces via full load OK for independent pages
  await page.goto("/app/permits?project=p1", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: /permits/i })).toBeVisible();
  const gis = page.getByRole("button", { name: /open site plan gis/i }).first();
  if (await gis.isVisible().catch(() => false)) {
    await gis.click();
    await expect(page.getByTestId("site-plan-aerial")).toBeVisible({ timeout: 15_000 });
  }

  await page.goto("/app/field", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: /field board/i })).toBeVisible();
  const work = page.locator("textarea").first();
  if (await work.isVisible().catch(() => false)) {
    await work.fill("GC walkthrough — sheathing complete, windows staged.");
    await page.getByRole("button", { name: /post update|post log/i }).first().click();
    await page.waitForTimeout(400);
  }

  await page.goto("/app/draws", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: /progress draws/i })).toBeVisible();
  const submit = page.getByRole("button", { name: /submit to owner/i }).first();
  if (await submit.isVisible().catch(() => false)) {
    await submit.click();
  } else {
    const ready = page.getByRole("button", { name: /mark ready/i }).first();
    if (await ready.isVisible().catch(() => false)) await ready.click();
  }

  await page.goto("/app/bids", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: /bid board/i })).toBeVisible();
  await expect(page.getByTestId("bid-card").first()).toBeVisible();

  await page.goto("/app/daily-logs", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: /daily logs/i })).toBeVisible();

  guard.assertClean();
  return { coTitle };
}

async function asCustomerWalkthrough(page: Page) {
  const guard = await noPageErrors(page);

  await page.goto("/app/portal?project=p1", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: /your home build|owner portal/i })).toBeVisible();
  await expect(page.getByText(/decisions|progress|paid to date|contract/i).first()).toBeVisible();

  const approve = page.getByTestId("portal-approve-co").first();
  if (await approve.isVisible().catch(() => false)) {
    await approve.click();
    await expect(page.getByTestId("portal-last-action")).toBeVisible({ timeout: 10_000 });
  }

  await expect(page.getByText(/draw schedule|paid to date|contract/i).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: /latest from the field/i }).or(page.getByText(/latest from the field/i))).toBeVisible();
  await expect(page.getByText(/200-0605|splitrockconst/i).first()).toBeVisible();

  guard.assertClean();
}

test.describe("dual persona build walkthrough", () => {
  test("GC operator path — full ops surfaces", async ({ page }) => {
    await asGcWalkthrough(page);
  });

  test("Customer portal path — decisions and money", async ({ page }) => {
    await asCustomerWalkthrough(page);
  });

  test("same-context handoff: GC sends CO → owner approves", async ({ page }) => {
    await page.goto("/app/projects/p1", { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    await openJobTab(page, /change/i);
    await page.getByRole("button", { name: /add change order/i }).click();

    const coTitle = `Handoff CO ${Date.now().toString().slice(-5)}`;
    await page.locator("#co-title").fill(coTitle);
    await page.locator("#co-amount").fill("3500");
    await page.locator("#co-days").fill("1");
    await page.locator("#co-desc").fill("Owner-facing handoff test.");
    await page.getByRole("button", { name: /save & send to owner/i }).click();
    await expect(page.getByText(/change order sent/i)).toBeVisible({ timeout: 10_000 });

    // SPA link — do not full-reload
    await page.getByRole("link", { name: /open owner portal/i }).click();
    await expect(page.getByRole("heading", { name: /your home build/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(coTitle).first()).toBeVisible({ timeout: 10_000 });
    await page.getByTestId("portal-approve-co").first().click();
    await expect(page.getByTestId("portal-last-action")).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("dual browser contexts (GC + Customer)", () => {
  test("parallel personas load optimized surfaces", async ({ browser }) => {
    const gc = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const customer = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const gcPage = await gc.newPage();
    const custPage = await customer.newPage();

    await Promise.all([
      gcPage.goto("http://127.0.0.1:8080/app", { waitUntil: "networkidle" }),
      custPage.goto("http://127.0.0.1:8080/app/portal?project=p1", { waitUntil: "networkidle" }),
    ]);

    await expect(gcPage.getByRole("heading", { name: /command center/i })).toBeVisible();
    await expect(custPage.getByRole("heading", { name: /your home build/i })).toBeVisible();

    // Bottom nav is in DOM but hidden on desktop (lg:hidden)
    await expect(gcPage.getByTestId("mobile-bottom-nav")).toBeHidden();
    await expect(custPage.getByTestId("mobile-bottom-nav")).toBeVisible();

    await gcPage.goto("http://127.0.0.1:8080/app/draws", { waitUntil: "networkidle" });
    await expect(gcPage.getByRole("heading", { name: /progress draws/i })).toBeVisible();
    await expect(gcPage.getByTestId("draw-list")).toBeVisible();

    await expect(custPage.getByText(/paid to date|contract/i).first()).toBeVisible();
    const overflow = await custPage.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
    );
    expect(overflow).toBe(false);

    // GC desktop tools
    await gcPage.goto("http://127.0.0.1:8080/app/permits?project=p1", { waitUntil: "networkidle" });
    await expect(gcPage.getByRole("heading", { name: /permits/i })).toBeVisible();

    // Customer phone: bottom nav portal already active
    await custPage.getByTestId("mobile-bottom-nav").getByRole("link", { name: "Field" }).click();
    await expect(custPage).toHaveURL(/\/app\/field/);

    await gc.close();
    await customer.close();
  });
});
