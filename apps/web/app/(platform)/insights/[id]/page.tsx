/**
 * @file (platform)/insights/[id]/page.tsx
 * @description Page détail d'un article Hi! Insights "/insights/[id]".
 *
 * Thème sombre (bg-black/gray-950) — cohérent avec les articles académiques sur fond noir.
 *
 * Layout 2 colonnes sur grand écran :
 *   - Colonne principale (lg:col-span-2) : article complet.
 *   - Sidebar (lg:col-span-1) : sticky — 2 articles "À lire aussi" + CTA "Publier".
 *
 * Génération statique (SSG) :
 *   `generateStaticParams()` pré-génère les routes pour tous les articles connus.
 *   Compatible avec `output: "export"` (GitHub Pages).
 *   Fallback : si l'ID n'existe pas, affiche le premier article (`MOCK_INSIGHTS[0]`).
 *
 * Rendu des blocs de contenu :
 *   Le composant `Block` est un switch sur `InsightBlock.type`.
 *   Chaque type a son propre rendu visuel (voir JSDoc de `Block`).
 *
 * Articles liés :
 *   `related` = tous les articles sauf l'article courant, limité à 2.
 */

import Link from "next/link";
import { MOCK_INSIGHTS, InsightBlock } from "@/lib/mock";

/**
 * Génère les paramètres statiques pour toutes les routes `/insights/[id]`.
 * Requis pour `output: "export"` — Next.js a besoin de connaître toutes les routes à l'avance.
 *
 * @returns Tableau de `{ id }` pour chaque article dans `MOCK_INSIGHTS`.
 */
export function generateStaticParams() {
  return MOCK_INSIGHTS.map((a) => ({ id: a.id }));
}

/**
 * Rendu d'un bloc de contenu selon son type.
 * Correspond à l'union discriminée `InsightBlock` définie dans `mock.ts`.
 *
 * Types pris en charge :
 *   - `"heading"`     : h2 (texte blanc) ou h3 (texte gris clair) selon `level`.
 *   - `"text"`        : paragraphe en gris 300.
 *   - `"code"`        : bloc de code avec en-tête montrant le langage, fond `gray-950`, texte vert.
 *   - `"quote"`       : blockquote avec bordure danger rouge, citation en italique + auteur.
 *   - `"key-insight"` : encart bleu avec icône 💡, texte `primary-light` en gras.
 *   - `"figure"`      : image avec légende centrée.
 *   - `"divider"`     : `<hr>` blanc/10 avec marges.
 *   - default         : `null` — type non reconnu (sécurité forward-compatibility).
 */
function Block({ block }: { block: InsightBlock }) {
  switch (block.type) {
    case "heading":
      // Branche h2 : titre de section principal — texte blanc et taille plus grande
      return block.level === 2
        ? <h2 className="text-2xl font-bold text-white mt-10 mb-4">{block.content}</h2>
        // Branche h3 : sous-section — texte gris clair et taille intermédiaire
        : <h3 className="text-lg font-bold text-gray-200 mt-8 mb-3">{block.content}</h3>;

    case "text":
      return <p className="text-gray-300 leading-relaxed text-base">{block.content}</p>;

    case "code":
      return (
        <div className="my-4">
          {/* En-tête du bloc de code : langage + label "code" */}
          <div className="flex items-center justify-between bg-gray-800 rounded-t-xl px-4 py-2 border border-white/10 border-b-0">
            <span className="text-xs text-gray-400 font-mono">{block.language}</span>
            <span className="text-xs text-gray-600">code</span>
          </div>
          {/* Corps du code : fond quasi-noir, texte vert style terminal */}
          <pre className="bg-gray-950 border border-white/10 rounded-b-xl p-5 overflow-x-auto text-sm font-mono text-green-400 leading-relaxed">
            {block.content}
          </pre>
        </div>
      );

    case "quote":
      return (
        <blockquote className="my-6 border-l-4 border-danger pl-6 py-2">
          <p className="text-gray-200 italic text-lg leading-relaxed">"{block.content}"</p>
          {/* Auteur — affiché uniquement si défini */}
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
      // Sécurité : type non reconnu (ajout futur dans l'union) → null silencieux
      return null;
  }
}

/**
 * Page détail d'un article Insights.
 *
 * @param params - Route params Next.js — `id` est l'identifiant de l'article.
 */
export default function InsightPage({ params }: { params: { id: string } }) {
  /**
   * Recherche l'article correspondant à l'ID.
   * Fallback sur le premier article si l'ID n'existe pas (ne devrait pas arriver
   * en production grâce à `generateStaticParams`, mais protège contre les URLs manuelles).
   */
  const article = MOCK_INSIGHTS.find((a) => a.id === params.id) ?? MOCK_INSIGHTS[0];

  /**
   * Articles liés pour la sidebar.
   * Exclut l'article courant et limite à 2 résultats.
   */
  const related = MOCK_INSIGHTS.filter((a) => a.id !== article.id).slice(0, 2);

  return (
    <div className="bg-navy min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

        {/* ── Article principal (2/3 de la largeur sur grand écran) ── */}
        <article className="lg:col-span-2">
          <Link href="/insights" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8">
            ← Retour aux Insights
          </Link>

          {/* Image de couverture avec badges overlay */}
          <div className="relative h-72 rounded-2xl overflow-hidden mb-8">
            <img src={article.cover} alt={article.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            {/* Badges catégorie + 2 premiers tags en overlay bas gauche */}
            <div className="absolute bottom-5 left-5 flex gap-2">
              <span className="text-xs font-medium bg-danger text-white px-3 py-1 rounded-full">{article.category}</span>
              {article.tags.slice(0, 2).map((t) => (
                <span key={t} className="text-xs bg-white/10 backdrop-blur border border-white/20 text-white px-2.5 py-1 rounded-full">{t}</span>
              ))}
            </div>
          </div>

          {/* Métadonnées : titre, résumé, auteurs, école, date, durée */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-white mb-4 leading-tight">{article.title}</h1>
            <p className="text-gray-400 text-lg leading-relaxed mb-5">{article.abstract}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 pb-6 border-b border-white/10">
              {/* Avatar initial de l'auteur principal */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                  {article.authors[0][0]}
                </div>
                <span>{article.authors.join(", ")}</span>
              </div>
              <span>·</span>
              <span>{article.school}</span>
              <span>·</span>
              {/* Date formatée en français */}
              <span>{new Date(article.published_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
              <span>·</span>
              <span>{article.read_time} min de lecture</span>
            </div>
          </div>

          {/* Blocs de contenu — séquence de composants Block */}
          <div className="flex flex-col gap-5">
            {article.blocks.map((block, i) => (
              <Block key={i} block={block} />
            ))}
          </div>

          {/* Tags en bas d'article */}
          <div className="flex flex-wrap gap-2 mt-10 pt-8 border-t border-white/10">
            {article.tags.map((t) => (
              <span key={t} className="text-xs bg-white/5 border border-white/10 text-gray-400 px-3 py-1.5 rounded-full">{t}</span>
            ))}
          </div>
        </article>

        {/* ── Sidebar sticky (1/3 de la largeur sur grand écran) ── */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">À lire aussi</h2>
            {/* 2 articles liés */}
            <div className="flex flex-col gap-4 mb-8">
              {related.map((a) => (
                <Link key={a.id} href={`/insights/${a.id}`}
                  className="group bg-gray-900 rounded-xl border border-white/10 overflow-hidden hover:border-white/30 transition-all">
                  <div className="h-28 overflow-hidden">
                    <img src={a.cover} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-4">
                    <span className="text-xs text-gray-500">{a.category}</span>
                    <p className="text-sm font-semibold text-white mt-1 leading-snug group-hover:text-gray-300 transition-colors line-clamp-2">
                      {a.title}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">{a.read_time} min · {a.authors[0]}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* CTA "Publier vos recherches" */}
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
