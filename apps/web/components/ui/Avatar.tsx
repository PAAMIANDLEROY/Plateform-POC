/**
 * @file Avatar.tsx
 * @description Composant d'avatar utilisateur du design system Hi! Platform.
 *
 * Affiche soit une photo de profil (balise `<img>`) soit un avatar généré automatiquement
 * à partir des initiales du nom, sur fond bleu primaire.
 *
 * Utilisé dans : `Nav` (menu utilisateur), `profile/page.tsx`, `lms/CohortDetail.tsx`.
 */

import { clsx } from "clsx";

/**
 * Props du composant Avatar.
 *
 * @property name      - Nom complet de l'utilisateur — utilisé pour calculer les initiales
 *                       et comme texte alternatif de l'image.
 * @property src       - URL de la photo de profil. Si `null` ou `undefined`, les initiales sont affichées.
 * @property size      - Taille de l'avatar : `"sm"` (28px), `"md"` (36px, défaut), `"lg"` (48px).
 * @property className - Classes Tailwind supplémentaires pour override ou extension.
 */
interface AvatarProps {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Mapping taille → classes Tailwind (largeur, hauteur, taille de texte).
 * Définies statiquement pour garantir la présence dans le bundle Tailwind JIT.
 */
const sizes = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-12 h-12 text-base",
};

/**
 * Calcule les initiales à partir d'un nom complet.
 * Prend les premières lettres des deux premiers mots et les met en majuscules.
 *
 * @param name - Nom complet (ex. "Marie Curie" → "MC", "Alice" → "A").
 * @returns Initiales en majuscules (1 ou 2 caractères).
 */
function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Avatar utilisateur circulaire.
 *
 * Branche `src` fourni : affiche l'image avec `object-cover` pour remplir le cercle sans déformation.
 * Branche `src` absent  : affiche les initiales sur fond `bg-primary` (#1A3A8F).
 *
 * @param props - Voir `AvatarProps`.
 */
export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  return (
    <div className={clsx(
      "rounded-full flex items-center justify-center shrink-0 overflow-hidden font-semibold",
      sizes[size],
      className
    )}>
      {src ? (
        // Photo de profil : couvre le cercle sans déformation
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        // Fallback initiales : fond primaire, texte blanc
        <div className="w-full h-full bg-primary flex items-center justify-center text-white">
          {initials(name)}
        </div>
      )}
    </div>
  );
}
