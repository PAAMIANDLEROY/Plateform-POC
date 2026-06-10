"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { Badge } from "@/components/ui/Badge";

interface GitHubMeta {
  stars: number;
  language: string | null;
  updatedAt: string;
}

function parseGitHubRepo(url: string): string | null {
  const match = url.match(/github\.com\/([^/]+\/[^/?#]+)/);
  return match ? match[1] : null;
}

function useGitHubMeta(githubRepo?: string | null): GitHubMeta | null {
  const [meta, setMeta] = useState<GitHubMeta | null>(null);

  useEffect(() => {
    if (!githubRepo) return;
    let cancelled = false;
    fetch(`https://api.github.com/repos/${githubRepo}`, {
      headers: { Accept: "application/vnd.github+json" },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          setMeta({
            stars: data.stargazers_count,
            language: data.language,
            updatedAt: new Date(data.updated_at).toLocaleDateString("fr-FR", {
              month: "short",
              year: "numeric",
            }),
          });
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [githubRepo]);

  return meta;
}

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
  const resolvedRepo = githubRepo ?? (url ? parseGitHubRepo(url) : null);
  const ghMeta       = useGitHubMeta(resolvedRepo);
  const isGitHub     = !!resolvedRepo;
  const isExternal   = url && !url.startsWith("/");

  return (
    <div className={clsx(
      "group bg-white border border-primary/15 rounded-2xl overflow-hidden flex flex-col",
      "hover:border-primary/40 hover:shadow-card-hover transition-all shadow-card",
      className
    )}>
      {/* Image / placeholder */}
      {thumbnail_url ? (
        <div className="h-36 overflow-hidden">
          <img src={thumbnail_url} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      ) : (
        <div className="h-36 bg-gradient-to-br from-primary/10 via-primary/6 to-primary/3 flex items-center justify-center">
          <span className="text-4xl">{isGitHub ? "🐙" : "⚡"}</span>
        </div>
      )}

      {/* Corps */}
      <div className="p-4 flex flex-col flex-1">
        {school && (
          <span className="text-xs font-bold uppercase tracking-wider text-primary/70 mb-1.5">
            {school}
          </span>
        )}
        <h3 className="font-bold text-gray-900 text-sm leading-snug group-hover:text-primary transition-colors mb-1.5 line-clamp-1">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">{description}</p>
        )}

        <div className="mt-auto">
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {tags.slice(0, 3).map((t) => (
                <Badge key={t} variant="ghost">{t}</Badge>
              ))}
            </div>
          )}

          {/* Métadonnées GitHub */}
          {ghMeta && (
            <div className="flex items-center gap-3 text-xs text-gray-400 mb-3 pb-3 border-b border-gray-100">
              <span className="flex items-center gap-1">
                <span>⭐</span>
                <span>{ghMeta.stars.toLocaleString("fr-FR")}</span>
              </span>
              {ghMeta.language && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  <span>{ghMeta.language}</span>
                </span>
              )}
              <span className="ml-auto">{ghMeta.updatedAt}</span>
            </div>
          )}

          {/* Boutons */}
          <div className="flex items-center justify-end gap-2">
            {url && isExternal && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
              >
                Ouvrir ↗
              </a>
            )}
            <Link href={`/apps/${id}`} className="text-xs text-gray-400 hover:text-gray-900 transition-colors">
              Détails
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
