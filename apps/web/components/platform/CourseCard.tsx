/**
 * @file CourseCard.tsx
 * @description Carte de présentation d'un cours Hi! Course.
 *
 * Affiche la couverture ou un placeholder gradient, les badges (catégorie, niveau, statut),
 * le titre, la description, les tags et les métadonnées (école, durée).
 * Cliquable vers la page détail `/courses/[id]`.
 *
 * Niveau → couleur de badge :
 *   - `beginner`     → `success` (vert)
 *   - `intermediate` → `warning` (orange)
 *   - `advanced`     → `danger`  (rouge)
 *
 * Statut draft :
 *   Un badge "Brouillon" orange est affiché si `status === "draft"`.
 *   Les cours publiés n'affichent pas de badge de statut.
 *
 * Utilisé dans : `SectionCatalogue`, `dashboard/page.tsx`, `moocs/[id]`.
 */

import Link from "next/link";
import { clsx } from "clsx";
import { Badge } from "@/components/ui/Badge";

/**
 * Props du composant CourseCard.
 *
 * @property id                           - UUID du cours — pour construire le lien `/courses/[id]`.
 * @property title                        - Titre du cours.
 * @property description                  - Description courte (tronquée à 2 lignes).
 * @property cover_url                    - URL de l'image de couverture. Si absent, affiche un placeholder gradient.
 * @property category                     - Catégorie — badge `primary` bleu.
 * @property level                        - Niveau : `"beginner"`, `"intermediate"`, `"advanced"`.
 * @property school                       - École propriétaire.
 * @property estimated_duration_minutes   - Durée estimée en minutes (formatée en "2h30min").
 * @property status                       - `"published"` ou `"draft"`. Un badge "Brouillon" est affiché si draft.
 * @property tags                         - Tags — 2 premiers affichés.
 * @property className                    - Classes Tailwind supplémentaires.
 */
interface CourseCardProps {
  id: string;
  title: string;
  description?: string | null;
  cover_url?: string | null;
  category?: string | null;
  level?: string;
  school?: string | null;
  estimated_duration_minutes?: number;
  status?: string;
  tags?: string[];
  className?: string;
}

/**
 * Mapping niveau (clé interne anglaise) → variante de badge.
 * La couleur renforce la sémantique du niveau de difficulté.
 */
const levelVariant: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  beginner:     "success",
  intermediate: "warning",
  advanced:     "danger",
};

/**
 * Mapping niveau (clé interne anglaise) → label français affiché.
 */
const levelLabel: Record<string, string> = {
  beginner:     "Débutant",
  intermediate: "Intermédiaire",
  advanced:     "Avancé",
};

/**
 * Formate une durée en minutes au format lisible.
 *
 * @param minutes - Durée totale en minutes.
 * @returns `"45 min"`, `"2h"` ou `"2h30min"`.
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  // Branche durée exacte : pas de minutes résiduelles
  return m > 0 ? `${h}h${m}min` : `${h}h`;
}

/**
 * Carte cours cliquable vers la page détail.
 */
export function CourseCard({
  id,
  title,
  description,
  cover_url,
  category,
  level = "beginner",
  school,
  estimated_duration_minutes = 0,
  status,
  tags = [],
  className,
}: CourseCardProps) {
  return (
    <Link
      href={`/courses/${id}`}
      className={clsx(
        "group bg-white border border-gray-200 rounded-xl overflow-hidden",
        "hover:border-primary/30 hover:shadow-card-hover transition-all block shadow-card",
        className
      )}
    >
      {/* En-tête de carte : image de couverture ou placeholder gradient */}
      {cover_url ? (
        // Branche couverture : image avec zoom au survol
        <div className="h-36 overflow-hidden">
          <img
            src={cover_url}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        // Branche placeholder : gradient bleu primaire avec emoji 📖
        <div className="h-24 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
          <span className="text-4xl">📖</span>
        </div>
      )}

      {/* Corps de la carte */}
      <div className="p-5">
        {/* Badges : catégorie + niveau + statut draft */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {category && <Badge variant="primary">{category}</Badge>}
          {/* Fallback "neutral" si le niveau n'est pas dans le mapping */}
          <Badge variant={levelVariant[level] ?? "neutral"}>
            {levelLabel[level] ?? level}
          </Badge>
          {/* Badge brouillon — affiché uniquement si status === "draft" */}
          {status === "draft" && <Badge variant="warning">Brouillon</Badge>}
        </div>

        <h3 className="font-semibold text-gray-900 text-sm leading-snug group-hover:text-primary transition-colors mb-1.5 line-clamp-2">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-4">{description}</p>
        )}
        {/* Tags — 2 premiers uniquement */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.slice(0, 2).map((t) => (
              <Badge key={t} variant="ghost">{t}</Badge>
            ))}
          </div>
        )}
        {/* Pied de carte : école et durée séparées par un point médian */}
        <div className="flex items-center gap-2 text-xs text-gray-400 border-t border-gray-100 pt-3">
          {school && <span>{school}</span>}
          {/* Séparateur affiché uniquement si les deux informations sont présentes */}
          {school && estimated_duration_minutes > 0 && <span>·</span>}
          {estimated_duration_minutes > 0 && <span>{formatDuration(estimated_duration_minutes)}</span>}
        </div>
      </div>
    </Link>
  );
}
