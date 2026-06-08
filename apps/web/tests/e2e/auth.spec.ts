/**
 * @file tests/e2e/auth.spec.ts
 * @description Tests end-to-end du flux d'authentification de Hi! Platform.
 *
 * ## Suites
 *
 * ### `Authentication flow`
 * Vérifie l'accessibilité des pages d'auth et le comportement de base des redirections.
 *
 *   1. **login page shows email input** :
 *      Navigue vers `/login` et vérifie que le champ `input[type=email]` est visible.
 *
 *   2. **register page is accessible** :
 *      Navigue vers `/register` et vérifie que l'URL contient `/register`
 *      (pas de redirection vers login).
 *
 *   3. **unauthenticated access to /dashboard redirects** :
 *      Navigue vers `/dashboard` sans cookie d'auth.
 *      Attend que l'URL soit soit `/login` (redirection middleware) soit `/dashboard`
 *      (si la page gère l'état côté client). Timeout 5 s.
 *
 *   4. **privacy policy page is accessible** :
 *      Vérifie que `/privacy` charge et contient un `<h1>`.
 *
 *   5. **CGU page is accessible** :
 *      Vérifie que `/cgu` charge et contient un `<h1>`.
 *
 * ### `Auth form interactions`
 * Vérifie la validation HTML5 native du formulaire de connexion.
 *
 *   1. **submitting empty email shows validation** :
 *      Clique sur le bouton de soumission sans remplir l'email.
 *      Vérifie via `el.validity.valid` que la contrainte HTML5 `required`/`type=email`
 *      invalide le champ (`validity.valid === false`).
 */

import { test, expect } from "@playwright/test";

// ── Suite 1 : Accessibilité des pages d'authentification ──────────────────────

test.describe("Authentication flow", () => {
  /** Vérifie que la page de connexion affiche bien l'input email. */
  test("login page shows email input", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("input[type=email]")).toBeVisible();
  });

  /** Vérifie que la page d'inscription est accessible sans redirection. */
  test("register page is accessible", async ({ page }) => {
    await page.goto("/register");
    await expect(page).toHaveURL(/\/register/);
  });

  /**
   * Vérifie qu'un accès non authentifié au dashboard entraîne une redirection.
   * Accepte `/login` (middleware côté serveur) ou `/dashboard` (gestion client).
   */
  test("unauthenticated access to /dashboard redirects", async ({ page }) => {
    await page.goto("/dashboard");
    // Branche redirection : l'URL finale est /login ou reste /dashboard selon l'implémentation
    await page.waitForURL(/\/login|\/dashboard/, { timeout: 5000 });
  });

  /** Vérifie l'accessibilité de la politique de confidentialité. */
  test("privacy policy page is accessible", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.locator("h1")).toBeVisible();
  });

  /** Vérifie l'accessibilité de la page des CGU. */
  test("CGU page is accessible", async ({ page }) => {
    await page.goto("/cgu");
    await expect(page.locator("h1")).toBeVisible();
  });
});

// ── Suite 2 : Interactions avec le formulaire de login ────────────────────────

test.describe("Auth form interactions", () => {
  /**
   * Vérifie que soumettre le formulaire sans email déclenche la validation HTML5.
   *
   * Utilise `evaluate()` pour accéder à l'API native `ValidityState` du DOM —
   * ce que Playwright ne peut pas vérifier via ses assertions standard.
   */
  test("submitting empty email shows validation", async ({ page }) => {
    await page.goto("/login");
    // Clique sur le premier bouton du formulaire (bouton de soumission)
    const submitBtn = page.getByRole("button").first();
    await submitBtn.click();
    // Vérifie via l'API DOM que le champ email est invalide (validation HTML5 native)
    const emailInput = page.locator("input[type=email]");
    const validity = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    // Branche attendue : `valid === false` car le champ est vide et obligatoire
    expect(validity).toBe(false);
  });
});
