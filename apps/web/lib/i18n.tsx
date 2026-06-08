/**
 * @file i18n.tsx
 * @description Système d'internationalisation (i18n) pour Hi! Platform.
 *
 * Supporte deux locales : `"fr"` (défaut) et `"en"`.
 * La locale choisie est :
 *   - Persistée dans `localStorage` (clé `"hi_locale"`) pour survivre aux rechargements.
 *   - Appliquée à l'attribut `lang` de `<html>` pour l'accessibilité et le SEO.
 *   - Accessible dans tout composant client via le hook `useLanguage()`.
 *
 * Compatibilité export statique (GitHub Pages) :
 *   Ce système utilise le contexte React + localStorage plutôt que des routes `[locale]/`
 *   pour rester compatible avec `output: "export"` de Next.js sans restructurer les URLs.
 *
 * Prévention de l'hydration mismatch :
 *   Le layout racine utilise `suppressHydrationWarning` sur `<html>` car l'attribut `lang`
 *   peut différer entre le rendu serveur (`"fr"`) et le client (locale lue depuis localStorage).
 */

"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { fr, type Translations } from "./translations/fr";
import { en } from "./translations/en";

/** Les deux locales supportées par la plateforme. */
export type Locale = "fr" | "en";

/** Clé de stockage dans `localStorage`. Versionnable si le format de la valeur change. */
const STORAGE_KEY = "hi_locale";

/**
 * Structure du contexte i18n exposé par `LanguageProvider`.
 *
 * @property locale    - Locale active (`"fr"` ou `"en"`).
 * @property setLocale - Fonction pour changer la locale (met à jour le state et `localStorage`).
 * @property t         - Objet de traductions typé selon la structure de `fr.ts`.
 */
interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Translations;
}

/**
 * Valeur par défaut du contexte (utilisée si un composant accède au contexte avant le Provider).
 * Le défaut est `"fr"` et les traductions françaises pour éviter tout rendu vide.
 */
const I18nContext = createContext<I18nContextType>({
  locale: "fr",
  setLocale: () => {},
  t: fr,
});

/**
 * Provider i18n à placer au-dessus de `AuthProvider` dans l'arbre de composants.
 * Gère la locale active et met à disposition les traductions via le contexte React.
 *
 * @param children - Arbre de composants enfants.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  /**
   * Locale active. Initialisée à `"fr"` (défaut) pour le rendu serveur/statique.
   * La locale stockée en localStorage est lue côté client dans un `useEffect`.
   */
  const [locale, setLocaleState] = useState<Locale>("fr");

  /**
   * Lecture de la locale depuis localStorage au montage (côté client uniquement).
   * - Le `try/catch` gère les cas où localStorage est bloqué (mode privé strict).
   * - Validation explicite `=== "en" || === "fr"` pour ignorer les valeurs corrompues.
   */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (stored === "en" || stored === "fr") {
        setLocaleState(stored);
      }
    } catch {}
  }, []);

  /**
   * Synchronisation de l'attribut `lang` de `<html>` à chaque changement de locale.
   * Nécessaire pour l'accessibilité (lecteurs d'écran) et les moteurs de recherche.
   */
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  /**
   * Change la locale active et la persiste dans localStorage.
   * Le `try/catch` rend l'opération non-bloquante si localStorage est inaccessible.
   *
   * @param l - Nouvelle locale à appliquer.
   */
  function setLocale(l: Locale) {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {}
  }

  /**
   * Sélection de l'objet de traductions selon la locale active.
   * - `"en"` → objet `en` (même structure que `fr`, type `Translations`)
   * - Toute autre valeur (y.c. `"fr"`) → objet `fr` par défaut
   */
  const t = locale === "en" ? en : fr;

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * Hook pour accéder aux traductions et à la locale active depuis n'importe quel composant client.
 *
 * @returns Objet `{ locale, setLocale, t }` du contexte i18n.
 *
 * @example
 * ```tsx
 * const { t, locale, setLocale } = useLanguage();
 * return <h1>{t.nav.insights}</h1>;
 * ```
 */
export function useLanguage() {
  return useContext(I18nContext);
}
