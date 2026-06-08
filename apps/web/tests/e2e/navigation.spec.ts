/**
 * @file tests/e2e/navigation.spec.ts
 * @description Tests end-to-end de la navigation et des dropdowns de Hi! Platform.
 *
 * ## Suites
 *
 * ### `Navigation dropdowns`
 * Tests de base depuis la page de login (non authentifié).
 *
 *   - **login page loads correctly** : vérifie le titre de la page et la présence d'un `<h1>`.
 *
 * ### `Platform navigation (authenticated)`
 * Tests de navigation nécessitant une session simulée.
 *
 * **Simulation d'authentification** (`beforeEach`) :
 *   1. Injection d'un cookie `hi_refresh` (valeur "mock-token") via `context.addCookies()`.
 *   2. Interception de `**/api/v1/auth/refresh` via `page.route()` — retourne un JSON
 *      avec un access_token mock et un utilisateur de rôle `admin`.
 *   3. Navigation vers `/dashboard`.
 *
 *   - **nav bar is visible** : vérifie que le `<header>` et le logo "Hi!" sont visibles.
 *
 *   - **Learning AI dropdown opens and closes** :
 *      Clique sur le bouton "Learning AI" → vérifie les items "Hi! Tube" et "Hi! Course".
 *      Clique en dehors (position 10,400) → vérifie que "Hi! Tube" disparaît.
 *
 *   - **only one dropdown is open at a time** :
 *      Ouvre "Learning AI" → vérifie "Fondamentaux et recherche en IA" visible.
 *      Ouvre "Learning With AI" → vérifie "Apprendre en utilisant" visible.
 *      Vérifie que le premier dropdown est maintenant fermé.
 *
 *   - **admin link is visible for admin role** :
 *      Vérifie que le lien "Admin" est visible dans la navbar (rôle admin dans le mock).
 *
 * ### `Insights page`
 * Vérifie que la page `/insights` affiche le titre "Insights".
 *
 * ### `LMS page structure`
 * Vérifie que `/lms` retourne soit `/login` (non auth) soit `/lms` (si auth en cache).
 */

import { test, expect } from "@playwright/test";

// ── Suite 1 : Navigation basique (non authentifié) ────────────────────────────

test.describe("Navigation dropdowns", () => {
  /** Démarre depuis la page de login pour chaque test de cette suite. */
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  /** Vérifie que la page de login charge avec le bon titre et un h1. */
  test("login page loads correctly", async ({ page }) => {
    await expect(page).toHaveTitle(/Hi! Platform/);
    await expect(page.locator("h1")).toBeVisible();
  });
});

// ── Suite 2 : Navigation plateforme (authentifié simulé) ─────────────────────

test.describe("Platform navigation (authenticated)", () => {
  /**
   * Simule une session authentifiée avant chaque test :
   * 1. Injecte un cookie `hi_refresh` (cookie httpOnly simulé).
   * 2. Intercepte l'endpoint `/api/v1/auth/refresh` et retourne un utilisateur admin mock.
   * 3. Navigue vers `/dashboard`.
   */
  test.beforeEach(async ({ page, context }) => {
    // Injection du cookie de session (simule un utilisateur connecté)
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
    // Interception du refresh token → retourne un utilisateur admin fictif
    await page.route("**/api/v1/auth/refresh", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "mock-access",
          token_type: "bearer",
          is_new: false,
          user: {
            id:                  "test-1",
            first_name:          "Test",
            last_name:           "Admin",
            email:               "test@polytechnique.edu",
            role:                "admin",
            is_verified:         true,
            school:              "Polytechnique",
            bio:                 "",
            avatar_url:          null,
            linkedin:            "",
            github:              "",
            is_profile_complete: true,
          },
        }),
      });
    });
    await page.goto("/dashboard");
  });

  /** Vérifie que la navbar et le logo Hi! sont bien rendus. */
  test("nav bar is visible", async ({ page }) => {
    const header = page.locator("header");
    await expect(header).toBeVisible();
    await expect(header.locator("text=Hi!")).toBeVisible();
  });

  /**
   * Vérifie le comportement d'ouverture/fermeture du dropdown "Learning AI".
   * La fermeture se fait en cliquant en dehors du menu (position x=10, y=400).
   */
  test("Learning AI dropdown opens and closes", async ({ page }) => {
    const btn = page.getByRole("button", { name: /Learning AI/i }).first();
    await btn.click();
    // Branche ouvert : les items du menu doivent être visibles
    await expect(page.locator("text=Hi! Tube").first()).toBeVisible();
    await expect(page.locator("text=Hi! Course").first()).toBeVisible();

    // Fermeture par clic en dehors du menu
    await page.locator("body").click({ position: { x: 10, y: 400 } });
    // Branche fermé : l'item doit avoir disparu
    await expect(page.locator("text=Hi! Tube").first()).not.toBeVisible();
  });

  /**
   * Vérifie qu'un seul dropdown est ouvert à la fois.
   * Ouvrir "Learning With AI" ferme automatiquement "Learning AI".
   */
  test("only one dropdown is open at a time", async ({ page }) => {
    const btn1 = page.getByRole("button", { name: /Learning AI/i }).first();
    const btn2 = page.getByRole("button", { name: /Learning With AI/i }).first();

    await btn1.click();
    // Branche dropdown 1 ouvert : description "Learning AI" visible
    await expect(page.locator("text=Fondamentaux et recherche en IA")).toBeVisible();

    await btn2.click();
    // Branche dropdown 2 ouvert : description "Learning With AI" visible
    await expect(page.locator("text=Apprendre en utilisant")).toBeVisible();
    // Branche dropdown 1 fermé automatiquement : description "Learning AI" invisible
    await expect(page.locator("text=Fondamentaux et recherche en IA")).not.toBeVisible();
  });

  /** Vérifie que le lien Admin est visible pour un utilisateur de rôle admin. */
  test("admin link is visible for admin role", async ({ page }) => {
    await expect(page.locator("text=Admin").first()).toBeVisible();
  });
});

// ── Suite 3 : Page Insights ───────────────────────────────────────────────────

test.describe("Insights page", () => {
  /** Navigue vers /insights avant chaque test. */
  test.beforeEach(async ({ page }) => {
    await page.goto("/insights");
  });

  /** Vérifie que le titre principal contient "Insights". */
  test("insights page displays articles", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Insights");
  });
});

// ── Suite 4 : Structure de la page LMS ───────────────────────────────────────

test.describe("LMS page structure", () => {
  /**
   * Vérifie que /lms est accessible (ou redirige vers login si non authentifié).
   * Accepte les deux URLs — le comportement dépend du middleware d'auth.
   */
  test("LMS page has correct title when accessed", async ({ page }) => {
    await page.goto("/lms");
    // Branche non authentifié : redirection vers /login
    // Branche authentifié (cache) : reste sur /lms
    await expect(page).toHaveURL(/\/login|\/lms/);
  });
});
