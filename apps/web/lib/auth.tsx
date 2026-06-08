/**
 * @file auth.tsx
 * @description Contexte React d'authentification pour Hi! Platform.
 *
 * Expose via `AuthProvider` un contexte global contenant l'utilisateur connecté,
 * l'état de chargement, la fonction de déconnexion et le setter direct.
 *
 * Flux d'initialisation :
 *   1. Au montage de `AuthProvider`, appel de `authApi.refresh()` pour tenter de
 *      restaurer la session depuis le cookie httpOnly de refresh token.
 *   2. Si succès → `user` est hydraté avec les données renvoyées par le backend.
 *   3. Si échec (token absent ou expiré) → `user` reste `null`, l'utilisateur est
 *      considéré comme non connecté.
 *   4. Dans tous les cas, `loading` passe à `false` à la fin du refresh.
 *
 * Usage :
 *   ```tsx
 *   const { user, loading, logout } = useAuth();
 *   ```
 */

"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi, UserResponse } from "./api";

/**
 * Structure du contexte d'authentification accessible via `useAuth()`.
 *
 * @property user    - Utilisateur connecté, ou `null` si pas de session active.
 * @property loading - `true` pendant la tentative de refresh au montage.
 *                     Les pages doivent afficher un spinner tant que `loading === true`
 *                     pour éviter un flash de contenu non-authentifié.
 * @property logout  - Invalide la session côté serveur et remet `user` à `null`.
 * @property setUser - Met à jour manuellement l'utilisateur dans le contexte
 *                     (utilisé après `updateProfile` pour refléter les changements sans refresh).
 */
interface AuthState {
  user: UserResponse | null;
  loading: boolean;
  logout: () => Promise<void>;
  setUser: (u: UserResponse | null) => void;
}

/** Contexte React — initialisé à `null`, la valeur réelle est fournie par `AuthProvider`. */
const AuthContext = createContext<AuthState | null>(null);

/**
 * Provider d'authentification à placer au plus haut de l'arbre de composants.
 * Doit englober toutes les pages qui nécessitent un accès à `useAuth()`.
 *
 * Place dans le layout racine (`app/layout.tsx`) :
 * ```tsx
 * <LanguageProvider>
 *   <AuthProvider>
 *     {children}
 *     <CookieBanner />
 *   </AuthProvider>
 * </LanguageProvider>
 * ```
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  /** Utilisateur actuellement connecté ; `null` si pas de session. */
  const [user, setUser] = useState<UserResponse | null>(null);

  /**
   * `true` pendant le refresh initial au montage.
   * Les pages protégées doivent attendre que `loading` soit `false`
   * avant de décider de rediriger vers /login.
   */
  const [loading, setLoading] = useState(true);

  /**
   * Tente de restaurer la session via le refresh token (cookie httpOnly).
   * Wrappé dans `useCallback` pour stabiliser la référence et éviter des
   * re-renders inutiles dans le `useEffect` qui l'appelle.
   */
  const refresh = useCallback(async () => {
    try {
      const data = await authApi.refresh();
      // Refresh réussi : on hydrate l'utilisateur avec les données fraîches
      setUser(data.user);
    } catch {
      // Refresh échoué (token absent/expiré) : pas de session active
      setUser(null);
    }
  }, []);

  /**
   * Au montage : tente de restaurer la session.
   * `loading` passe à `false` dans `finally` même en cas d'erreur,
   * pour éviter un spinner infini si le backend est inaccessible.
   */
  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  /**
   * Déconnecte l'utilisateur :
   * 1. Appelle l'API pour invalider la session côté serveur (supprime le cookie refresh).
   * 2. Remet `user` à `null` dans le contexte React.
   * Le `try/catch` vide garantit que la déconnexion côté client se produit même si
   * l'API est inaccessible (ex. perte réseau).
   */
  const logout = async () => {
    try { await authApi.logout(); } catch {}
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook pour accéder au contexte d'authentification depuis n'importe quel composant client.
 *
 * @returns Contexte d'auth avec `user`, `loading`, `logout` et `setUser`.
 * @throws {Error} Si appelé en dehors d'un `AuthProvider`.
 *
 * @example
 * ```tsx
 * const { user, loading } = useAuth();
 * if (loading) return <Spinner />;
 * if (!user) return redirect('/login');
 * ```
 */
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  // Détection de l'utilisation hors provider — erreur explicite pour faciliter le débogage
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
