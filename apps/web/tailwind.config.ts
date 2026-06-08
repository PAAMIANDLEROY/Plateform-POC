/**
 * @file tailwind.config.ts
 * @description Configuration Tailwind CSS pour Hi! Platform (apps/web).
 *
 * ## Tokens de design (design system Hi! PARIS)
 *
 * ### Couleurs
 *
 * | Token         | Valeur     | Usage                                         |
 * |---------------|------------|-----------------------------------------------|
 * | `primary`     | `#1A3A8F`  | Bleu Hi! PARIS — CTA, liens, barres actives   |
 * | `primary-dark`| `#142D70`  | Hover/focus des éléments primaires            |
 * | `primary-light`| `#2347B0` | Liens texte secondaires                       |
 * | `danger`      | `#D72638`  | Alertes, badges erreur, boutons destructifs   |
 * | `danger-dark` | `#B5202F`  | Hover des éléments danger                     |
 * | `surface`     | `#F4F6FA`  | Fond gris clair des cartes                    |
 * | `text-muted`  | `#4A4A6A`  | Texte secondaire (gris violet)                |
 * | `navy`        | `#0B1D3A`  | Fond sombre (sidebar, overlay)                |
 * | `navy-dark`   | `#060F1E`  | Fond très sombre                              |
 *
 * ### Typographie
 *
 * Police principale : **DM Sans** (Google Fonts), avec fallback `system-ui` et `sans-serif`.
 * Le nom de la police doit correspondre exactement à l'import dans `layout.tsx`.
 *
 * ### Ombres personnalisées
 *
 * | Token         | Usage                          |
 * |---------------|--------------------------------|
 * | `card`        | Carte au repos (légère)        |
 * | `card-hover`  | Carte survolée (plus prononcée)|
 *
 * ## Contenu scanné (JIT)
 *
 * Tailwind JIT scanne uniquement les fichiers `.ts` et `.tsx` dans :
 *   - `./app/**`        : pages et layouts Next.js App Router.
 *   - `./components/**` : composants réutilisables.
 *
 * ⚠️ Les classes construites dynamiquement (ex : `"bg-" + color`) ne seront PAS incluses
 * dans le bundle — toujours utiliser des chaînes complètes et statiques.
 */

import type { Config } from "tailwindcss";

const config: Config = {
  // Fichiers scannés pour la purge JIT — ne scanner que app/ et components/
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Couleur primaire Hi! PARIS (bleu) ──
        primary: {
          DEFAULT: "#1A3A8F", // Bleu principal
          dark:    "#142D70", // Hover / état actif
          light:   "#2347B0", // Liens texte
        },
        // ── Couleur danger / alerte (rouge) ──
        danger: {
          DEFAULT: "#D72638", // Rouge principal
          dark:    "#B5202F", // Hover danger
        },
        // ── Couleurs neutres ──
        surface:     "#F4F6FA", // Fond gris clair des surfaces
        "text-muted": "#4A4A6A", // Texte secondaire gris-violet
        // ── Fond sombre pour les pages/sections dark ──
        navy: {
          DEFAULT: "#0B1D3A", // Fond sidebar / header dark
          dark:    "#060F1E", // Fond très sombre (overlay)
        },
      },
      fontFamily: {
        // Police principale de la plateforme — importée via Google Fonts dans layout.tsx
        sans: ["DM Sans", "system-ui", "sans-serif"],
      },
      boxShadow: {
        // Ombre légère pour les cartes au repos
        card:       "0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.07)",
        // Ombre plus prononcée au survol
        "card-hover": "0 4px 16px 0 rgba(0,0,0,0.10), 0 2px 6px -2px rgba(0,0,0,0.08)",
      },
    },
  },
  // Aucun plugin Tailwind additionnel dans le MVP
  plugins: [],
};

export default config;
