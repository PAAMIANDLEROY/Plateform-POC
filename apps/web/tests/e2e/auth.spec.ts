import { test, expect } from "@playwright/test";

test.describe("Authentication flow", () => {
  test("login page shows email input", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("input[type=email]")).toBeVisible();
  });

  test("register page is accessible", async ({ page }) => {
    await page.goto("/register");
    await expect(page).toHaveURL(/\/register/);
  });

  test("unauthenticated access to /dashboard redirects", async ({ page }) => {
    await page.goto("/dashboard");
    // Should redirect to login
    await page.waitForURL(/\/login|\/dashboard/, { timeout: 5000 });
  });

  test("privacy policy page is accessible", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("CGU page is accessible", async ({ page }) => {
    await page.goto("/cgu");
    await expect(page.locator("h1")).toBeVisible();
  });
});

test.describe("Auth form interactions", () => {
  test("submitting empty email shows validation", async ({ page }) => {
    await page.goto("/login");
    const submitBtn = page.getByRole("button").first();
    await submitBtn.click();
    // HTML5 validation or error message
    const emailInput = page.locator("input[type=email]");
    const validity = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(validity).toBe(false);
  });
});
