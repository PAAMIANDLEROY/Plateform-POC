/**
 * @file Card.tsx
 * @description Composant carte générique du design system Hi! Platform.
 *
 * Conteneur à fond sombre (`bg-gray-900`) avec bordure subtile, adapté aux
 * zones qui nécessitent un regroupement visuel de contenu.
 *
 * Note : Ce composant utilise un thème sombre hérité d'une version antérieure
 * de la plateforme. La plupart des nouvelles pages utilisent directement des
 * classes Tailwind `bg-white border border-gray-200` pour le thème clair.
 *
 * Variantes de padding :
 *   - `"none"` : aucun padding (pour les cards avec image pleine largeur)
 *   - `"sm"`   : `p-4` (compact)
 *   - `"md"`   : `p-5` (standard, défaut)
 *   - `"lg"`   : `p-6` (espacé)
 */

import { clsx } from "clsx";

/**
 * Props du composant Card.
 *
 * @property children  - Contenu de la carte.
 * @property className - Classes Tailwind supplémentaires.
 * @property hover     - Si `true`, ajoute un effet de survol (bordure plus claire, fond légèrement éclairci).
 * @property padding   - Taille du padding intérieur. Défaut : `"md"`.
 */
interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

/** Mapping padding → classes Tailwind. */
const paddings = {
  none: "",
  sm:   "p-4",
  md:   "p-5",
  lg:   "p-6",
};

/**
 * Carte à fond sombre avec bordure subtile.
 *
 * @example
 * ```tsx
 * <Card hover padding="lg">
 *   <p>Contenu de la carte</p>
 * </Card>
 * ```
 */
export function Card({ children, className, hover = false, padding = "md" }: CardProps) {
  return (
    <div
      className={clsx(
        "bg-gray-900 border border-white/10 rounded-xl",
        // Branche hover : bordure et fond légèrement plus visibles au survol
        hover && "hover:border-white/20 hover:bg-gray-800 transition-all",
        paddings[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
