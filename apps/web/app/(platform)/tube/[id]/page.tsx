/**
 * @file (platform)/tube/[id]/page.tsx
 * @description Page de lecture d'une vidéo Hi! Tube "/tube/[id]".
 *
 * Composant serveur (SSG) :
 *   `generateStaticParams()` pré-génère les routes pour toutes les vidéos connues.
 *   Compatible avec `output: "export"` (GitHub Pages).
 *   Fallback : si l'ID n'existe pas, affiche la première vidéo (`MOCK_VIDEOS[0]`).
 *
 * Vidéos liées :
 *   `related` = vidéos de la même catégorie, excluant la vidéo courante, limitées à 4.
 *   La logique de filtrage par catégorie maximise la pertinence des suggestions.
 *
 * Délégation au composant client :
 *   `VideoPageClient` est séparé pour permettre le state interactif
 *   (commentaires, progression) sans bloquer le SSG.
 *
 * @param params - Route params Next.js — `id` est l'identifiant de la vidéo.
 */

import { MOCK_VIDEOS } from "@/lib/mock";
import { VideoPageClient } from "./VideoPageClient";

/**
 * Génère les paramètres statiques pour toutes les routes `/tube/[id]`.
 *
 * @returns Tableau de `{ id }` pour chaque vidéo dans `MOCK_VIDEOS`.
 */
export function generateStaticParams() {
  return MOCK_VIDEOS.map((v) => ({ id: v.id }));
}

/**
 * Page de lecture de vidéo.
 *
 * @param params - Contient `id` — identifiant de la vidéo dans `MOCK_VIDEOS`.
 */
export default function VideoPage({ params }: { params: { id: string } }) {
  /**
   * Recherche la vidéo par ID.
   * Fallback sur la première vidéo si l'ID n'est pas trouvé.
   */
  const video = MOCK_VIDEOS.find((v) => v.id === params.id) ?? MOCK_VIDEOS[0];

  /**
   * Vidéos de la même catégorie pour la sidebar de suggestions.
   * Exclut la vidéo courante + limite à 4 résultats.
   */
  const related = MOCK_VIDEOS.filter(
    (v) => v.id !== params.id && v.category === video.category
  ).slice(0, 4);

  return <VideoPageClient video={video} related={related} />;
}
