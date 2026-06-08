/**
 * @file Input.tsx
 * @description Composant champ de saisie du design system Hi! Platform.
 *
 * Wrapping d'un `<input>` HTML avec label associé et affichage d'erreur intégré.
 * Implémenté avec `forwardRef` pour permettre l'utilisation avec `react-hook-form`
 * ou tout autre système basé sur les refs.
 *
 * États visuels :
 *   - Normal   : bordure grise, fond blanc, survol gris plus foncé.
 *   - Focus    : bordure bleue primaire, ring de focus (accessibilité clavier).
 *   - Erreur   : bordure rouge danger, fond rouge très clair, message d'erreur affiché en dessous.
 *   - Disabled : géré par les attributs HTML natifs (hérité de `InputHTMLAttributes`).
 */

"use client";

import { clsx } from "clsx";
import { InputHTMLAttributes, forwardRef } from "react";

/**
 * Props du composant Input.
 * Étend toutes les props HTML natives de `<input>`.
 *
 * @property label - Label affiché au-dessus du champ. Également utilisé pour générer
 *                   l'`id` automatique si `id` n'est pas fourni.
 * @property error - Message d'erreur affiché en rouge sous le champ.
 *                   Si absent, aucun espace réservé n'est affiché.
 */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

/**
 * Champ de saisie avec label et gestion d'erreur.
 *
 * Génération automatique de l'`id` :
 *   Si `id` n'est pas fourni, il est généré depuis le `label` en minuscules avec
 *   les espaces remplacés par des tirets (ex. "Email institutionnel" → "email-institutionnel").
 *   Cela garantit l'association `<label for="...">` sans avoir à le gérer manuellement.
 *
 * @example
 * ```tsx
 * <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    // Génération de l'id depuis le label si non fourni explicitement
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1">
        {/* Label associé au champ via htmlFor → accessibilité et clic sur label focusse l'input */}
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            "w-full px-3 py-2.5 rounded-lg border text-sm transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
            // Branche erreur : bordure et fond rouge, remplace le style normal
            // Branche normal : bordure grise, fond blanc, survol gris plus soutenu
            error
              ? "border-danger bg-red-50"
              : "border-gray-300 bg-white hover:border-gray-400",
            className
          )}
          {...props}
        />
        {/* Message d'erreur : rendu uniquement si `error` est défini */}
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>
    );
  }
);

/** Nom affiché dans les DevTools React pour faciliter le débogage. */
Input.displayName = "Input";
