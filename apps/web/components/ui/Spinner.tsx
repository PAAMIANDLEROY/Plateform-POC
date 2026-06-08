/**
 * @file Spinner.tsx
 * @description Composants indicateurs de chargement du design system Hi! Platform.
 *
 * Deux exports :
 *   - `Spinner`     : spinner inline configurable (taille, couleur via className).
 *   - `PageSpinner` : spinner centré sur toute la hauteur visible, pour les états
 *                     de chargement de page entière.
 *
 * Mécanisme visuel :
 *   Cercle (`border-radius: 100%`) avec une bordure partiellement transparente.
 *   Le quart supérieur (`border-t-primary`) est coloré en bleu, le reste transparent.
 *   L'animation `animate-spin` fait tourner le cercle en continu.
 */

import { clsx } from "clsx";

/**
 * Props du composant Spinner.
 *
 * @property size      - Taille du spinner : `"sm"` (16px), `"md"` (28px, défaut), `"lg"` (40px).
 * @property className - Classes Tailwind supplémentaires pour surcharger couleur ou position.
 */
interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Mapping taille → classes Tailwind (dimensions + épaisseur de bordure).
 * La bordure est plus épaisse (`border-[3px]`) pour le grand format afin de rester visible.
 */
const sizes = {
  sm: "w-4 h-4 border-2",
  md: "w-7 h-7 border-2",
  lg: "w-10 h-10 border-[3px]",
};

/**
 * Spinner animé inline.
 *
 * @example
 * ```tsx
 * {loading && <Spinner size="sm" className="ml-2" />}
 * ```
 */
export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <div
      className={clsx(
        "rounded-full border-white/20 border-t-primary animate-spin",
        sizes[size],
        className
      )}
    />
  );
}

/**
 * Spinner pleine page — centré verticalement sur au moins 40vh.
 * Utilisé comme écran de chargement pendant les requêtes d'initialisation de page
 * (ex. : `if (loading) return <PageSpinner />;`).
 *
 * @example
 * ```tsx
 * if (loading) return <PageSpinner />;
 * ```
 */
export function PageSpinner() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
