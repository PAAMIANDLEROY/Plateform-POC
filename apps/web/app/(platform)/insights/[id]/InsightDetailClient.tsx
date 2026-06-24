"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { insightsApi, InsightResponse } from "@/lib/api";

/** Union des blocs de contenu d'un article (rendu par <Block>). */
type InsightBlock =
  | { type: "text"; content: string }
  | { type: "heading"; content: string; level: 2 | 3 }
  | { type: "code"; content: string; language: string }
  | { type: "quote"; content: string; author?: string }
  | { type: "key-insight"; content: string }
  | { type: "figure"; url: string; caption: string }
  | { type: "divider" };

/** Rendu d'un bloc de contenu selon son type (thème sombre). */
function Block({ block }: { block: InsightBlock }) {
  switch (block.type) {
    case "heading":
      return block.level === 2
        ? <h2 className="text-2xl font-bold text-white mt-10 mb-4">{block.content}</h2>
        : <h3 className="text-lg font-bold text-gray-200 mt-8 mb-3">{block.content}</h3>;

    case "text":
      return <p className="text-gray-300 leading-relaxed text-base">{block.content}</p>;

    case "code":
      return (
        <div className="my-4">
          <div className="flex items-center justify-between bg-gray-800 rounded-t-xl px-4 py-2 border border-white/10 border-b-0">
            <span className="text-xs text-gray-400 font-mono">{block.language}</span>
            <span className="text-xs text-gray-600">code</span>
          </div>
          <pre className="bg-gray-950 border border-white/10 rounded-b-xl p-5 overflow-x-auto text-sm font-mono text-green-400 leading-relaxed">
            {block.content}
          </pre>
        </div>
      );

    case "quote":
      return (
        <blockquote className="my-6 border-l-4 border-danger pl-6 py-2">
          <p className="text-gray-200 italic text-lg leading-relaxed">&quot;{block.content}&quot;</p>
          {block.author && (
            <cite className="text-sm text-gray-500 not-italic mt-2 block">— {block.author}</cite>
          )}
        </blockquote>
      );

    case "key-insight":
      return (
        <div className="my-6 bg-primary/10 border border-primary/30 rounded-xl p-5 flex gap-4">
          <span className="text-2xl shrink-0">💡</span>
          <p className="text-primary-light font-semibold leading-relaxed">{block.content}</p>
        </div>
      );

    case "figure":
      return (
        <figure className="my-6">
          <img src={block.url} alt={block.caption} className="w-full rounded-xl border border-white/10 object-cover max-h-80" />
          <figcaption className="text-center text-xs text-gray-500 mt-2">{block.caption}</figcaption>
        </figure>
      );

    case "divider":
      return <hr className="border-white/10 my-8" />;

    default:
      return null;
  }
}

/**
 * Page détail d'un article Insights — charge l'article (et 2 articles liés)
 * depuis l'API par son id.
 */
export function InsightDetailClient({ id }: { id: string }) {
  const [article, setArticle] = useState<InsightResponse | null>(null);
  const [related, setRelated] = useState<InsightResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    insightsApi.get(id)
      .then(setArticle)
      .catch((e) => {
        if (e?.status === 404) setNotFound(true);
        else console.error(e);
      })
      .finally(() => setLoading(false));
    // Articles liés (best-effort) : on ignore l'échec.
    insightsApi.list()
      .then((list) => setRelated(list.filter((a) => a.id !== id).slice(0, 2)))
      .catch(() => {});
  }, [id]);

  if (loading) return (
    <div className="bg-navy min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-16 text-center text-gray-400">Chargement…</div>
    </div>
  );

  if (notFound || !article) return (
    <div className="bg-navy min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-16 text-center">
        <p className="text-gray-400 mb-4">Article introuvable.</p>
        <Link href="/insights" className="text-primary text-sm">← Retour aux Insights</Link>
      </div>
    </div>
  );

  return (
    <div className="bg-navy min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* ── Article principal ── */}
          <article className="lg:col-span-2">
            <Link href="/insights" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8">
              ← Retour aux Insights
            </Link>

            <div className="relative h-72 rounded-2xl overflow-hidden mb-8">
              <img src={article.cover ?? ""} alt={article.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-5 left-5 flex gap-2">
                {article.category && (
                  <span className="text-xs font-medium bg-danger text-white px-3 py-1 rounded-full">{article.category}</span>
                )}
                {article.tags.slice(0, 2).map((t) => (
                  <span key={t} className="text-xs bg-white/10 backdrop-blur border border-white/20 text-white px-2.5 py-1 rounded-full">{t}</span>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <h1 className="text-3xl font-extrabold text-white mb-4 leading-tight">{article.title}</h1>
              {article.abstract && <p className="text-gray-400 text-lg leading-relaxed mb-5">{article.abstract}</p>}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 pb-6 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                    {article.authors[0]?.[0] ?? "?"}
                  </div>
                  <span>{article.authors.join(", ")}</span>
                </div>
                {article.school && (<><span>·</span><span>{article.school}</span></>)}
                {article.published_at && (
                  <>
                    <span>·</span>
                    <span>{new Date(article.published_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
                  </>
                )}
                <span>·</span>
                <span>{article.read_time} min de lecture</span>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              {article.blocks.map((block, i) => (
                <Block key={i} block={block as unknown as InsightBlock} />
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mt-10 pt-8 border-t border-white/10">
              {article.tags.map((t) => (
                <span key={t} className="text-xs bg-white/5 border border-white/10 text-gray-400 px-3 py-1.5 rounded-full">{t}</span>
              ))}
            </div>
          </article>

          {/* ── Sidebar ── */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">À lire aussi</h2>
              <div className="flex flex-col gap-4 mb-8">
                {related.map((a) => (
                  <Link key={a.id} href={`/insights/${a.id}`}
                    className="group bg-gray-900 rounded-xl border border-white/10 overflow-hidden hover:border-white/30 transition-all">
                    <div className="h-28 overflow-hidden">
                      <img src={a.cover ?? ""} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-4">
                      <span className="text-xs text-gray-500">{a.category}</span>
                      <p className="text-sm font-semibold text-white mt-1 leading-snug group-hover:text-gray-300 transition-colors line-clamp-2">
                        {a.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">{a.read_time} min · {a.authors[0] ?? ""}</p>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="bg-gray-900 border border-white/10 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-1">Publier vos recherches</h3>
                <p className="text-xs text-gray-500 mb-4">Partagez vos travaux avec la communauté Hi! PARIS.</p>
                <Link href="/insights/new"
                  className="block text-center text-sm font-semibold text-white bg-danger hover:bg-danger-dark transition-colors px-4 py-2.5 rounded-lg">
                  Créer un article
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
