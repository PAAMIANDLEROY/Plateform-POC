/**
 * @file VideoCard.tsx
 * @description Carte de présentation d'une vidéo Hi! Tube.
 *
 * Affiche la miniature, la catégorie, le titre, les tags, le nombre de vues
 * et la durée formatée. Cliquable vers la page détail `/tube/[id]`.
 *
 * Miniature :
 *   - Si `thumbnail_url` est fourni → utilisé directement.
 *   - Sinon si `youtube_id` est fourni → miniature générée via l'API YouTube
 *     (`img.youtube.com/vi/[id]/mqdefault.jpg`).
 *   - Sinon → placeholder avec l'icône ▶ sur fond gris.
 *
 * Utilisé dans : `SectionCatalogue`, `dashboard/page.tsx`.
 */

import Link from "next/link";
import { clsx } from "clsx";
import { Badge } from "@/components/ui/Badge";

/**
 * Props du composant VideoCard.
 *
 * @property id               - UUID de la vidéo — utilisé pour construire le lien `/tube/[id]`.
 * @property title            - Titre de la vidéo.
 * @property thumbnail_url    - URL directe de la miniature (OVH Storage).
 * @property youtube_id       - Identifiant YouTube pour générer la miniature automatiquement.
 * @property category         - Catégorie thématique (ex. "IA & Data") — badge en haut à gauche.
 * @property school           - École productrice — affiché en bas à gauche.
 * @property tags             - Liste de tags — les 2 premiers sont affichés comme badges `ghost`.
 * @property duration_seconds - Durée en secondes — formattée et affichée en bas à droite de la miniature.
 * @property view_count       - Nombre de vues — formatté en notation française.
 * @property className        - Classes Tailwind supplémentaires.
 */
interface VideoCardProps {
  id: string;
  title: string;
  thumbnail_url?: string | null;
  youtube_id?: string | null;
  category?: string | null;
  school?: string | null;
  tags?: string[];
  duration_seconds?: number;
  view_count?: number;
  className?: string;
}

/**
 * Formate une durée en secondes au format `mm:ss` ou `h:mm:ss`.
 *
 * @param seconds - Durée totale en secondes.
 * @returns Chaîne formatée (ex. `"42:18"`, `"1:12:05"`).
 */
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  // Branche > 1h : affichage h:mm:ss
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  // Branche < 1h : affichage mm:ss
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Carte vidéo cliquable vers la page détail.
 * Effet de zoom sur la miniature au survol (`group-hover:scale-105`).
 */
export function VideoCard({
  id,
  title,
  thumbnail_url,
  youtube_id,
  category,
  school,
  tags = [],
  duration_seconds = 0,
  view_count = 0,
  className,
}: VideoCardProps) {
  /**
   * Résolution de la miniature dans l'ordre de priorité :
   * 1. thumbnail_url fourni explicitement
   * 2. Miniature YouTube générée depuis youtube_id
   * 3. null → placeholder affiché dans le JSX
   */
  const thumb =
    thumbnail_url ??
    (youtube_id ? `https://img.youtube.com/vi/${youtube_id}/mqdefault.jpg` : null);

  return (
    <Link
      href={`/tube/${id}`}
      className={clsx(
        "group bg-white border border-gray-200 rounded-xl overflow-hidden",
        "hover:border-primary/30 hover:shadow-card-hover transition-all block shadow-card",
        className
      )}
    >
      {/* Zone miniature — ratio 16:9 via aspectRatio inline */}
      <div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
        {thumb ? (
          <img
            src={thumb}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          // Placeholder si aucune miniature disponible
          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-4xl text-gray-300">▶</div>
        )}
        {/* Dégradé sombre en bas pour lisibilité des overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {/* Durée — affichée uniquement si > 0 secondes */}
        {duration_seconds > 0 && (
          <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded font-mono">
            {formatDuration(duration_seconds)}
          </span>
        )}
        {/* Badge catégorie — affiché uniquement si défini */}
        {category && (
          <span className="absolute top-2 left-2 text-xs font-semibold bg-primary text-white px-2.5 py-0.5 rounded-full shadow-sm">
            {category}
          </span>
        )}
      </div>

      {/* Corps de la carte */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug group-hover:text-primary transition-colors mb-2 line-clamp-2">
          {title}
        </h3>
        {/* Tags — 2 premiers uniquement pour ne pas surcharger la carte */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.slice(0, 2).map((t) => (
              <Badge key={t} variant="ghost">{t}</Badge>
            ))}
          </div>
        )}
        {/* Pied de carte : école à gauche, vues à droite */}
        <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-2.5">
          <span>{school ?? ""}</span>
          <span>{view_count.toLocaleString("fr-FR")} vues</span>
        </div>
      </div>
    </Link>
  );
}
