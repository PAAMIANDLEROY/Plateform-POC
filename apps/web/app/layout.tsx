/**
 * @file app/layout.tsx
 * @description Layout racine Next.js 14 — s'applique à toutes les routes de l'application.
 *
 * Responsabilités :
 *   - Définit les métadonnées HTML globales (titre, description).
 *   - Injecte les providers globaux dans l'ordre correct :
 *       `LanguageProvider` (i18n) → `AuthProvider` (session) → `CookieBanner` (RGPD)
 *   - Applique `suppressHydrationWarning` sur `<html>` pour éviter les warnings d'hydration
 *     liés à l'attribut `lang` qui change côté client après lecture du localStorage.
 *
 * Ordre des providers :
 *   `LanguageProvider` doit être EXTÉRIEUR à `AuthProvider` car `CookieBanner` (rendu
 *   à l'intérieur d'`AuthProvider`) utilise `useLanguage()`.
 *
 * Note export statique :
 *   Ce fichier est un Server Component — il ne contient pas de `"use client"`.
 *   Les providers internes ont leur propre directive `"use client"`.
 */

import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { LanguageProvider } from "@/lib/i18n";
import { CookieBanner } from "@/components/platform/CookieBanner";

/**
 * Métadonnées HTML globales injectées dans `<head>`.
 * Peuvent être surchargées par les métadonnées de chaque page via `generateMetadata`.
 */
export const metadata: Metadata = {
  title: "Hi! Platform",
  description: "Plateforme pédagogique mutualisée Hi! PARIS",
};

/**
 * Layout racine — wrapping global de toute l'application.
 *
 * Arbre des providers :
 * ```
 * LanguageProvider       ← gère la locale FR/EN (localStorage)
 *   AuthProvider         ← gère la session JWT (refresh token cookie)
 *     {children}         ← pages de l'application
 *     CookieBanner       ← bannière RGPD, positionnée fixed en bas de l'écran
 * ```
 *
 * @param children - Pages et layouts enfants rendus par Next.js App Router.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning : l'attribut lang est mis à jour côté client par LanguageProvider
    // ce qui provoque une différence entre le rendu serveur (lang="fr") et client (locale lue en localStorage).
    // suppressHydrationWarning désactive l'avertissement React sur cet attribut spécifiquement.
    <html lang="fr" suppressHydrationWarning>
      <body>
        <LanguageProvider>
          <AuthProvider>
            {children}
            {/* CookieBanner est rendu ici pour être présent sur toutes les pages,
                position fixed en bas — il gère lui-même son affichage conditionnel
                selon le consentement déjà stocké en cookie. */}
            <CookieBanner />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
