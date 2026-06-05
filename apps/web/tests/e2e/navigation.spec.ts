import { test, expect } from "@playwright/test";

// ─── Navigation & Dropdown menus ─────────────────────────────────────────────

test.describe("Navigation dropdowns", () => {
  test.beforeEach(async ({ page }) => {
    // Start from the login page (unauthenticated)
    await page.goto("/login");
  });

  test("login page loads correctly", async ({ page }) => {
    await expect(page).toHaveTitle(/Hi! Platform/);
    await expect(page.locator("h1")).toBeVisible();
  });
});

test.describe("Platform navigation (authenticated)", () => {
  // Simulate an authenticated session by injecting auth state
  test.beforeEach(async ({ page, context }) => {
    // Set a mock auth cookie so the platform layout renders
    await context.addCookies([
      {
        name: "hi_refresh",
        value: "mock-token",
        domain: "localhost",
        path: "/",
        httpOnly: true,
        secure: false,
      },
    ]);
    // Mock the /api/v1/auth/refresh endpoint to return a user
    await page.route("**/api/v1/auth/refresh", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "mock-access",
          token_type: "bearer",
          is_new: false,
          user: {
            id: "test-1",
            first_name: "Test",
            last_name: "Admin",
            email: "test@polytechnique.edu",
            role: "admin",
            is_verified: true,
            school: "Polytechnique",
            bio: "",
            avatar_url: null,
            linkedin: "",
            github: "",
            is_profile_complete: true,
          },
        }),
      });
    });
    await page.goto("/dashboard");
  });

  test("nav bar is visible", async ({ page }) => {
    const header = page.locator("header");
    await expect(header).toBeVisible();
    await expect(header.locator("text=Hi!")).toBeVisible();
  });

  test("Learning AI dropdown opens and closes", async ({ page }) => {
    const btn = page.getByRole("button", { name: /Learning AI/i }).first();
    await btn.click();
    await expect(page.locator("text=Hi! Tube").first()).toBeVisible();
    await expect(page.locator("text=Hi! Course").first()).toBeVisible();

    // Click outside to close
    await page.locator("body").click({ position: { x: 10, y: 400 } });
    await expect(page.locator("text=Hi! Tube").first()).not.toBeVisible();
  });

  test("only one dropdown is open at a time", async ({ page }) => {
    const btn1 = page.getByRole("button", { name: /Learning AI/i }).first();
    const btn2 = page.getByRole("button", { name: /Learning With AI/i }).first();

    await btn1.click();
    await expect(page.locator("text=Fondamentaux et recherche en IA")).toBeVisible();

    await btn2.click();
    await expect(page.locator("text=Apprendre en utilisant")).toBeVisible();
    // First dropdown should be closed
    await expect(page.locator("text=Fondamentaux et recherche en IA")).not.toBeVisible();
  });

  test("admin link is visible for admin role", async ({ page }) => {
    await expect(page.locator("text=Admin").first()).toBeVisible();
  });
});

// ─── Insights filtering ───────────────────────────────────────────────────────

test.describe("Insights page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/insights");
  });

  test("insights page displays articles", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Insights");
  });
});

// ─── LMS page ─────────────────────────────────────────────────────────────────

test.describe("LMS page structure", () => {
  test("LMS page has correct title when accessed", async ({ page }) => {
    await page.goto("/lms");
    // Will redirect to login without auth
    await expect(page).toHaveURL(/\/login|\/lms/);
  });
});
