/**
 * @file Badge.tsx
 * @description Composant badge/étiquette du design system Hi! Platform.
 *
 * Petit pill de couleur pour indiquer un statut, une catégorie, un niveau ou un rôle.
 * Utilisé dans : `CourseCard`, `VideoCard`, `MOOCCard`, `profile/page.tsx`, `Nav`.
 *
 * Variantes disponibles :
 *   - `primary`  : fond bleu clair / texte bleu (catégorie, module)
 *   - `danger`   : fond rouge clair / texte rouge (admin, erreur)
 *   - `success`  : fond vert clair / texte vert (niveau Débutant, cours complété)
 *   - `warning`  : fond orange clair / texte orange (niveau Intermédiaire, brouillon)
 *   - `neutral`  : fond gris / texte gris (rôle student, tag générique)
 *   - `ghost`    : fond gris très clair / texte gris clair (tag secondaire)
 */

import { clsx } from "clsx";

/** Variantes de couleur disponibles pour le badge. */
type BadgeVariant = "primary" | "danger" | "success" | "warning" | "neutral" | "ghost";

/** Tailles disponibles : `"sm"` (défaut) ou `"md"`. */
type BadgeSize = "sm" | "md";

/**
 * Props du composant Badge.
 *
 * @property children  - Contenu du badge (texte ou élément React).
 * @property variant   - Schéma de couleurs. Défaut : `"neutral"`.
 * @property size      - Taille du texte et du padding. Défaut : `"sm"`.
 * @property className - Classes Tailwind supplémentaires.
 */
interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

/**
 * Classes Tailwind pour chaque variante de couleur.
 * Toutes définies statiquement pour garantir la présence dans le bundle JIT.
 */
const variants: Record<BadgeVariant, string> = {
  primary: "bg-primary/10 text-primary border border-primary/20",
  danger:  "bg-danger/10 text-danger border border-danger/20",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border border-amber-200",
  neutral: "bg-gray-100 text-gray-600 border border-gray-200",
  ghost:   "bg-gray-50 text-gray-500 border border-gray-100",
};

/**
 * Classes Tailwind pour chaque taille.
 */
const sizes: Record<BadgeSize, string> = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-3 py-1",
};

/**
 * Badge pill inline.
 *
 * @example
 * ```tsx
 * <Badge variant="success">Débutant</Badge>
 * <Badge variant="danger" size="md">Admin</Badge>
 * ```
 */
export function Badge({ children, variant = "neutral", size = "sm", className }: BadgeProps) {
  return (
    <span className={clsx(
      "inline-flex items-center font-medium rounded-full",
      variants[variant],
      sizes[size],
      className
    )}>
      {children}
    </span>
  );
}
