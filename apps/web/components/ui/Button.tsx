/**
 * @file Button.tsx
 * @description Composant bouton standardisé du design system Hi! Platform.
 *
 * Étend `ButtonHTMLAttributes<HTMLButtonElement>` pour accepter toutes les props HTML natives
 * (onClick, type, disabled...) en plus des props spécifiques.
 *
 * Variantes :
 *   - `primary`  : fond bleu primaire, texte blanc (action principale)
 *   - `outline`  : bordure bleue, texte bleu, fond transparent (action secondaire)
 *   - `danger`   : fond rouge, texte blanc (action destructrice)
 *
 * État de chargement (`loading`) :
 *   Remplace le texte du bouton par un spinner animé et désactive le bouton.
 *   Utilisé pendant les appels API (login, save profile, etc.).
 */

"use client";

import { clsx } from "clsx";
import { ButtonHTMLAttributes } from "react";

/**
 * Props du composant Button.
 * Étend les props HTML natives du bouton.
 *
 * @property variant  - Variante visuelle : `"primary"` (défaut), `"outline"`, `"danger"`.
 * @property loading  - Si `true`, affiche un spinner et désactive le bouton. Défaut : `false`.
 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "danger";
  loading?: boolean;
}

/**
 * Bouton pleine largeur avec gestion de l'état de chargement.
 *
 * @example
 * ```tsx
 * <Button onClick={handleSave} loading={saving}>Enregistrer</Button>
 * <Button variant="danger" onClick={handleDelete}>Supprimer</Button>
 * ```
 */
export function Button({
  variant = "primary",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      // Désactivé si `disabled` explicite OU si en cours de chargement
      disabled={disabled || loading}
      className={clsx(
        "w-full px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        {
          // Branche primary : fond bleu, survol bleu foncé, focus ring bleu
          "bg-primary text-white hover:bg-primary-dark focus:ring-primary":
            variant === "primary",
          // Branche outline : bordure bleue, fond transparent, survol fond bleu léger
          "border border-primary text-primary hover:bg-primary/5 focus:ring-primary":
            variant === "outline",
          // Branche danger : fond rouge, survol rouge foncé, focus ring rouge
          "bg-danger text-white hover:bg-danger-dark focus:ring-danger":
            variant === "danger",
        },
        className
      )}
      {...props}
    >
      {/* Branche loading : spinner animé à la place du texte */}
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  );
}
