/**
 * @file playwright.config.ts
 * @description Configuration Playwright pour les tests end-to-end de Hi! Platform (apps/web).
 *
 * ## Stratégie de test
 *
 * - **Répertoire** : `./tests/e2e` — tous les fichiers `*.spec.ts` sont détectés.
 * - **Parallélisme** : activé par défaut (`fullyParallel: true`) — chaque fichier de test
 *   tourne dans son propre worker.
 *
 * ## Comportements selon l'environnement
 *
 * | Option              | Local                  | CI (`process.env.CI` défini)     |
 * |---------------------|------------------------|----------------------------------|
 * | `forbidOnly`        | `false`                | `true` — bloque si `test.only`   |
 * | `retries`           | `0`                    | `2` — 2 tentatives avant échec   |
 * | `workers`           | `undefined` (max CPU)  | `1` — séquentiel pour stabilité  |
 *
 * ## Rapport
 *
 * Format `html` — génère un rapport visuel consultable dans un navigateur.
 * Commande : `npx playwright show-report`.
 *
 * ## Options globales (`use`)
 *
 * - `baseURL` : `http://localhost:3000` — base pour les `page.goto("/path")`.
 * - `trace: "on-first-retry"` : trace capturée uniquement sur la première relance.
 * - `screenshot: "only-on-failure"` : screenshot uniquement si le test échoue.
 *
 * ## Projets (navigateurs testés)
 *
 * | Nom            | Device                  | Note                        |
 * |----------------|-------------------------|-----------------------------|
 * | `chromium`     | Desktop Chrome          | Navigateur principal        |
 * | `Mobile Safari`| iPhone 13 (390×844)     | Test mobile responsive      |
 *
 * ## Serveur de test (`webServer`)
 *
 * Playwright démarre automatiquement `npm run dev` (Next.js sur le port 3000) avant les tests.
 * - `reuseExistingServer: !process.env.CI` : en local, réutilise le serveur déjà lancé
 *   (évite de relancer `next dev` si déjà actif).
 * - `timeout: 120_000` : attend jusqu'à 2 minutes le démarrage du serveur.
 */

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  /** Dossier contenant les fichiers de test e2e. */
  testDir: "./tests/e2e",

  /** Lance tous les tests en parallèle (workers différents). */
  fullyParallel: true,

  /**
   * Interdit les `test.only()` en CI pour éviter d'ignorer accidentellement des suites.
   * En local, `test.only()` est autorisé pour le développement itératif.
   */
  forbidOnly: !!process.env.CI,

  /**
   * Nombre de tentatives en cas d'échec.
   * - CI : 2 tentatives (stabilité des tests flaky).
   * - Local : 0 (rapide).
   */
  retries: process.env.CI ? 2 : 0,

  /**
   * Nombre de workers parallèles.
   * - CI : 1 (évite les conflits de port, mémoire limitée).
   * - Local : undefined = Playwright choisit selon les CPUs disponibles.
   */
  workers: process.env.CI ? 1 : undefined,

  /** Format de rapport de test — génère un rapport HTML interactif. */
  reporter: "html",

  use: {
    /** URL de base pour tous les `page.goto()` — correspond au port Next.js dev. */
    baseURL: "http://localhost:3000",
    /** Capture la trace d'exécution uniquement lors de la première relance d'un test. */
    trace: "on-first-retry",
    /** Capture un screenshot uniquement lorsqu'un test échoue. */
    screenshot: "only-on-failure",
  },

  /** Navigateurs et devices sur lesquels les tests sont exécutés. */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      // Test mobile : iPhone 13 (viewport 390×844, User-Agent Mobile Safari)
      name: "Mobile Safari",
      use: { ...devices["iPhone 13"] },
    },
  ],

  /** Serveur Next.js lancé automatiquement avant les tests. */
  webServer: {
    /** Commande de démarrage du frontend Next.js. */
    command: "npm run dev",
    /** URL attendue pour considérer le serveur comme prêt. */
    url: "http://localhost:3000",
    /**
     * En local : réutilise un serveur déjà en cours (évite un `next dev` redondant).
     * En CI : force le démarrage d'un nouveau serveur propre.
     */
    reuseExistingServer: !process.env.CI,
    /** Timeout de démarrage du serveur : 2 minutes. */
    timeout: 120_000,
  },
});
