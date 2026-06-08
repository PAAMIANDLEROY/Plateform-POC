/**
 * @file AppCard.tsx
 * @description Carte de présentation d'une application Hi! App.
 *
 * Affiche la miniature ou un placeholder, les tags, les métadonnées GitHub en temps réel
 * (étoiles, langage, date de mise à jour), et deux boutons d'action : "Ouvrir ↗" (lien externe)
 * et "Détails" (page interne `/apps/[id]`).
 *
 * Intégration GitHub API :
 *   Si `githubRepo` est fourni (ou si `url` contient un lien GitHub), le hook `useGitHubMeta`
 *   récupère en temps réel les métadonnées du repo depuis l'API GitHub publique.
 *   Les données sont affichées conditionnellement si la requête réussit.
 *
 * Contrairement aux autres cards (VideoCard, CourseCard, MOOCCard), AppCard n'est PAS
 * wrappé dans un `<Link>` global car elle a deux destinations différentes (externe + interne).
 *
 * Utilisé dans : `SectionCatalogue`, `apps/page.tsx`, `apps/[id]/page.tsx`.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { Badge } from "@/components/ui/Badge";

/**
 * Métadonnées GitHub d'un repository, récupérées via l'API publique.
 *
 * @property stars     - Nombre d'étoiles GitHub.
 * @property language  - Langage principal du repo (ex. "Python"), ou `null` si non détecté.
 * @property updatedAt - Date de dernière mise à jour formatée (ex. "juin 2026").
 */
interface GitHubMeta {
  stars: number;
  language: string | null;
  updatedAt: string;
}

/**
 * Extrait le chemin `owner/repo` depuis une URL GitHub.
 * Utilisé pour résoudre le repo depuis l'URL de l'app si `githubRepo` n'est pas fourni.
 *
 * @param url - URL complète (ex. `"https://github.com/langchain-ai/langchain"`).
 * @returns `"langchain-ai/langchain"` ou `null` si l'URL n'est pas une URL GitHub.
 */
function parseGitHubRepo(url: string): string | null {
  const match = url.match(/github\.com\/([^/]+\/[^/?#]+)/);
  return match ? match[1] : null;
}

/**
 * Hook de récupération des métadonnées GitHub d'un repository.
 * Effectue une requête vers l'API publique GitHub `/repos/{owner}/{repo}`.
 *
 * Gestion de la course condition :
 *   Le flag `cancelled` annule la mise à jour du state si le composant est démonté
 *   avant la fin de la requête (nettoyage dans la fonction de retour du useEffect).
 *
 * @param githubRepo - Identifiant `owner/repo` (ex. `"simonw/datasette"`).
 *                     Si absent ou `null`, le hook ne fait aucune requête et retourne `null`.
 * @returns Objet `GitHubMeta` si la requête réussit, `null` pendant le chargement ou en cas d'erreur.
 */
function useGitHubMeta(githubRepo?: string | null): GitHubMeta | null {
  const [meta, setMeta] = useState<GitHubMeta | null>(null);

  useEffect(() => {
    // Pas de repo → pas de requête
    if (!githubRepo) return;
    let cancelled = false;
    fetch(`https://api.github.com/repos/${githubRepo}`, {
      headers: { Accept: "application/vnd.github+json" },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        // Annulation si le composant a été démonté entre la requête et la réponse
        if (!cancelled && data) {
          setMeta({
            stars: data.stargazers_count,
            language: data.language,
            // Formatage de la date en notation courte française (ex. "juin 2026")
            updatedAt: new Date(data.updated_at).toLocaleDateString("fr-FR", {
              month: "short",
              year: "numeric",
            }),
          });
        }
      })
      .catch(() => {}); // Erreur silencieuse — les métadonnées GitHub sont optionnelles

    // Nettoyage : annule la mise à jour si le composant est démonté
    return () => { cancelled = true; };
  }, [githubRepo]);

  return meta;
}

/**
 * Props du composant AppCard.
 *
 * @property id            - UUID de l'app — pour le lien interne `/apps/[id]`.
 * @property title         - Nom de l'application.
 * @property description   - Description courte (tronquée à 2 lignes).
 * @property thumbnail_url - URL de la miniature. Si absent, placeholder gradient.
 * @property school        - École propriétaire.
 * @property tags          - Tags — les 3 premiers sont affichés.
 * @property url           - URL externe d'accès à l'application (lien "Ouvrir ↗").
 * @property githubRepo    - Identifiant `owner/repo` GitHub pour récupérer les métadonnées.
 *                           Si absent mais `url` contient un lien GitHub, il est extrait automatiquement.
 * @property className     - Classes Tailwind supplémentaires.
 */
interface AppCardProps {
  id: string;
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  school?: string | null;
  tags?: string[];
  url?: string | null;
  githubRepo?: string | null;
  className?: string;
}

/**
 * Carte application avec lien externe et intégration GitHub.
 */
export function AppCard({
  id,
  title,
  description,
  thumbnail_url,
  school,
  tags = [],
  url,
  githubRepo,
  className,
}: AppCardProps) {
  /**
   * Résolution du repo GitHub :
   * 1. `githubRepo` explicitement fourni → utilisé directement.
   * 2. Sinon → tentative d'extraction depuis `url`.
   * 3. Si aucun des deux → null, pas de requête GitHub.
   */
  const resolvedRepo = githubRepo ?? (url ? parseGitHubRepo(url) : null);

  /** Métadonnées GitHub récupérées en temps réel (null si non disponibles). */
  const ghMeta = useGitHubMeta(resolvedRepo);

  /** `true` si l'app est liée à un repository GitHub. */
  const isGitHub = !!resolvedRepo;

  /** `true` si l'URL est externe (commence par http/https, pas par "/"). */
  const isExternal = url && !url.startsWith("/");

  return (
    <div className={clsx(
      "group bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col",
      "hover:border-primary/30 hover:shadow-card-hover transition-all shadow-card",
      className
    )}>
      {/* En-tête : miniature ou placeholder */}
      {thumbnail_url ? (
        <div className="h-32 overflow-hidden">
          <img src={thumbnail_url} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      ) : (
        // Placeholder : icône GitHub 🐙 si lié à un repo, sinon ⚡
        <div className="h-28 bg-gradient-to-br from-primary/8 to-primary/3 flex items-center justify-center">
          <span className="text-4xl">{isGitHub ? "🐙" : "⚡"}</span>
        </div>
      )}

      {/* Corps de la carte — flex-1 pour que le pied de carte reste en bas */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug group-hover:text-primary transition-colors mb-1.5 line-clamp-1">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">{description}</p>
        )}
        {/* Tags — 3 premiers uniquement (plus permissif que les autres cards) */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.slice(0, 3).map((t) => (
              <Badge key={t} variant="ghost">{t}</Badge>
            ))}
          </div>
        )}

        {/* Zone basse : métadonnées GitHub + boutons d'action */}
        <div className="mt-auto">
          {/* Métadonnées GitHub — rendu conditionnel si la requête a réussi */}
          {ghMeta && (
            <div className="flex items-center gap-3 text-xs text-gray-400 mb-3 pb-3 border-b border-gray-100">
              {/* Étoiles */}
              <span className="flex items-center gap-1">
                <span>⭐</span>
                <span>{ghMeta.stars.toLocaleString("fr-FR")}</span>
              </span>
              {/* Langage — affiché uniquement si détecté */}
              {ghMeta.language && (
                <span className="flex items-center gap-1">
                  {/* Point coloré conventionnel GitHub pour le langage */}
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  <span>{ghMeta.language}</span>
                </span>
              )}
              {/* Date de mise à jour à droite */}
              <span className="ml-auto">{ghMeta.updatedAt}</span>
            </div>
          )}

          {/* Pied de carte : école + boutons */}
          <div className="flex items-center justify-between">
            {school && <span className="text-xs text-gray-400">{school}</span>}
            <div className="flex gap-2 ml-auto">
              {/* Bouton "Ouvrir" — affiché uniquement si l'URL est externe */}
              {url && isExternal && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  // stopPropagation évite que le clic sur "Ouvrir" ne propage un éventuel Link parent
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
                >
                  Ouvrir ↗
                </a>
              )}
              {/* Lien "Détails" — toujours affiché, vers la page interne */}
              <Link href={`/apps/${id}`} className="text-xs text-gray-400 hover:text-gray-900 transition-colors">
                Détails
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
