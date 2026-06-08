/**
 * @file MOOCCard.tsx
 * @description Carte de présentation d'un parcours Hi! MOOC.
 *
 * Affiche la couverture ou un placeholder gradient avec icône 🎓,
 * les badges (MOOC, Linéaire si applicable), le titre, la description et
 * les métadonnées (école, nombre d'inscrits, nombre de modules).
 * Cliquable vers la page détail `/moocs/[id]`.
 *
 * Utilisé dans : `SectionCatalogue`, `dashboard/page.tsx`.
 */

import Link from "next/link";
import { clsx } from "clsx";
import { Badge } from "@/components/ui/Badge";

/**
 * Props du composant MOOCCard.
 *
 * @property id             - UUID du MOOC — pour construire le lien `/moocs/[id]`.
 * @property title          - Titre du parcours.
 * @property description    - Description courte (tronquée à 2 lignes).
 * @property cover_url      - URL de l'image de couverture. Si absent, placeholder gradient.
 * @property school         - École propriétaire.
 * @property enrolled_count - Nombre d'apprenants inscrits au parcours.
 * @property modules_count  - Nombre de modules (cours) composant le MOOC.
 * @property is_linear      - Si `true`, les modules doivent être suivis dans l'ordre.
 *                            Affiche un badge "Linéaire" pour informer l'apprenant.
 * @property className      - Classes Tailwind supplémentaires.
 */
interface MOOCCardProps {
  id: string;
  title: string;
  description?: string | null;
  cover_url?: string | null;
  school?: string | null;
  enrolled_count?: number;
  modules_count?: number;
  is_linear?: boolean;
  className?: string;
}

/**
 * Carte MOOC cliquable vers la page détail.
 */
export function MOOCCard({
  id,
  title,
  description,
  cover_url,
  school,
  enrolled_count = 0,
  modules_count = 0,
  is_linear = true,
  className,
}: MOOCCardProps) {
  return (
    <Link
      href={`/moocs/${id}`}
      className={clsx(
        "group bg-white border border-gray-200 rounded-xl overflow-hidden",
        "hover:border-primary/30 hover:shadow-card-hover transition-all block shadow-card",
        className
      )}
    >
      {/* En-tête : image de couverture ou placeholder gradient */}
      {cover_url ? (
        // Branche couverture : image avec zoom au survol
        <div className="h-36 overflow-hidden">
          <img src={cover_url} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      ) : (
        // Branche placeholder : gradient bleu avec emoji 🎓
        <div className="h-28 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-5xl">🎓</div>
      )}

      {/* Corps de la carte */}
      <div className="p-5">
        {/* Badges : type MOOC toujours présent + Linéaire si applicable */}
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="primary">MOOC</Badge>
          {/* Badge Linéaire — affiché uniquement si is_linear === true */}
          {is_linear && <Badge variant="neutral">Linéaire</Badge>}
        </div>

        <h3 className="font-semibold text-gray-900 text-sm leading-snug group-hover:text-primary transition-colors mb-1.5 line-clamp-2">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-4">{description}</p>
        )}

        {/* Pied de carte : école à gauche, inscrits et modules à droite */}
        <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-3">
          <span>{school ?? ""}</span>
          <span>{enrolled_count.toLocaleString("fr-FR")} inscrits · {modules_count} modules</span>
        </div>
      </div>
    </Link>
  );
}
