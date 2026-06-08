/**
 * @file (platform)/insights/page.tsx
 * @description Page de liste des articles Hi! Insights "/insights".
 *
 * Structure :
 *   1. En-tête : titre "Inside & Insights" + bouton "Publier un article" → `/insights/new`.
 *   2. Filtres : champ de recherche + chips de catégories (générées dynamiquement).
 *   3. Article à la une : premier résultat filtré en grand format (h-80, full-width).
 *   4. Grille : articles restants en 1→2→3 colonnes.
 *
 * Filtrage (avec `useMemo`) :
 *   Critères combinés avec ET logique :
 *   - Catégorie : égalité stricte ou "Tous".
 *   - Recherche : cherche dans title, abstract, tags ET authors.
 *
 * Article à la une :
 *   - Si des filtres sont actifs : `featured` = premier résultat, badge "Premier résultat".
 *   - Si aucun filtre (liste complète) : `featured` = premier article, badge "À la une".
 *   - `gridArticles` = `filtered.slice(1)` (tous sauf le premier).
 *
 * Tags mis en valeur :
 *   Dans la grille, un tag correspondant au terme de recherche reçoit un fond bleu
 *   (`bg-primary/10`) pour indiquer visuellement la correspondance.
 *
 * Catégories :
 *   Calculées dynamiquement depuis `MOCK_INSIGHTS` via `Set` pour dédupliquer.
 *   "Tous" est ajouté en premier.
 */

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { MOCK_INSIGHTS } from "@/lib/mock";

/**
 * Catégories disponibles pour le filtre — dédupliquées depuis les données mock.
 * Calculé une seule fois au chargement du module (hors composant → stable).
 */
const ALL_CATEGORIES = [
  "Tous",
  ...Array.from(new Set(MOCK_INSIGHTS.map((i) => i.category))),
];

/**
 * Page de liste des articles Hi! Insights avec filtrage interactif.
 */
export default function InsightsPage() {
  /** Catégorie active pour le filtre — "Tous" par défaut. */
  const [activeCategory, setActiveCategory] = useState("Tous");

  /** Terme de recherche textuelle. */
  const [search, setSearch] = useState("");

  /**
   * Articles filtrés — recompilés uniquement si `activeCategory` ou `search` change.
   * Recherche dans : titre, résumé, tags et auteurs.
   */
  const filtered = useMemo(() => {
    return MOCK_INSIGHTS.filter((article) => {
      // Branche catégorie "Tous" : pas de filtre catégorie
      const matchCategory = activeCategory === "Tous" || article.category === activeCategory;
      const q = search.toLowerCase();
      // Branche recherche vide : accepte tous les articles
      const matchSearch =
        !q ||
        article.title.toLowerCase().includes(q) ||
        article.abstract.toLowerCase().includes(q) ||
        article.tags.some((t) => t.toLowerCase().includes(q)) ||
        article.authors.some((a) => a.toLowerCase().includes(q));
      return matchCategory && matchSearch;
    });
  }, [activeCategory, search]);

  /**
   * Article à la une (premier de la liste filtrée).
   * Si aucun résultat filtré, on ne devrait pas atteindre ce point (vérification avant).
   * `rest` = tous les articles sauf le premier (pour la grille).
   */
  const [featured, ...rest] = filtered.length > 0 ? filtered : MOCK_INSIGHTS;

  /**
   * Articles de la grille (tous sauf la une).
   * Si filtre actif avec un seul résultat → `filtered.slice(1)` = vide → pas de grille.
   * Si aucun filtre actif → `rest` = MOCK_INSIGHTS.slice(1).
   */
  const gridArticles = filtered.length > 1 ? filtered.slice(1) : rest;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">

      {/* En-tête */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inside &amp; Insights</h1>
          <p className="text-gray-500 mt-1">Articles de recherche interactifs — Hi! PARIS</p>
        </div>
        {/* Bouton publier — accessible à tous les utilisateurs (auth côté API) */}
        <Link href="/insights/new" className="bg-danger text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-danger-dark transition-colors shadow-lg shadow-danger/30">
          + Publier un article
        </Link>
      </div>

      {/* Barre de recherche + chips de catégories */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="text"
          placeholder="Rechercher un article, auteur, tag…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors sm:w-72 shadow-sm"
        />
        <div className="flex gap-2 flex-wrap">
          {ALL_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                // Branche catégorie active : fond bleu plein
                activeCategory === c
                  ? "bg-primary text-white shadow-sm"
                  // Branche catégorie inactive : fond blanc avec hover bleu
                  : "bg-white border border-gray-200 text-gray-600 hover:border-primary/40 hover:text-primary shadow-sm"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Branche aucun résultat */}
      {filtered.length === 0 ? (
        <div className="text-center py-24 text-gray-600">
          <p className="text-lg mb-2">Aucun article ne correspond à votre recherche.</p>
          <button
            onClick={() => { setSearch(""); setActiveCategory("Tous"); }}
            className="text-sm text-primary hover:text-primary-light"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <>
          {/* Article à la une — grand format pleine largeur */}
          <Link href={`/insights/${featured.id}`} className="group block mb-10">
            <div className="relative rounded-2xl overflow-hidden h-80">
              <img src={featured.cover} alt={featured.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              {/* Dégradé sombre pour lisibilité du texte superposé */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              <div className="absolute inset-0 p-8 flex flex-col justify-end">
                <div className="flex items-center gap-3 mb-3">
                  {/* Badge contextuel : "À la une" si liste complète, "Premier résultat" si filtrée */}
                  <span className="text-xs font-medium bg-danger text-white px-3 py-1 rounded-full">
                    {filtered.length === MOCK_INSIGHTS.length ? "À la une" : "Premier résultat"}
                  </span>
                  <span className="text-xs font-medium bg-white/10 text-white px-3 py-1 rounded-full border border-white/20">
                    {featured.category}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-gray-200 transition-colors max-w-2xl">
                  {featured.title}
                </h2>
                <p className="text-gray-300 text-sm max-w-xl line-clamp-2">{featured.abstract}</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                  <span>{featured.authors.join(", ")}</span>
                  <span>·</span>
                  <span>{featured.school}</span>
                  <span>·</span>
                  <span>{featured.read_time} min de lecture</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Grille des articles restants */}
          {gridArticles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gridArticles.map((article) => (
                <Link key={article.id} href={`/insights/${article.id}`}
                  className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-primary/30 hover:shadow-card-hover transition-all shadow-card">
                  <div className="relative h-44 overflow-hidden">
                    <img src={article.cover} alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <span className="absolute top-3 left-3 text-xs font-semibold bg-danger text-white px-2.5 py-0.5 rounded-full">
                      {article.category}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 text-sm leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-4">{article.abstract}</p>
                    {/* Tags — tous affichés, avec mise en valeur si correspondance recherche */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {article.tags.map((tag) => (
                        <span key={tag} className={`text-xs px-2 py-0.5 rounded-full border ${
                          // Branche tag correspondant au terme recherché : fond bleu
                          search && tag.toLowerCase().includes(search.toLowerCase())
                            ? "bg-primary/10 border-primary/30 text-primary"
                            // Branche tag normal : fond gris
                            : "bg-gray-50 border-gray-100 text-gray-500"
                        }`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-3">
                      <span>{article.authors[0]}</span>
                      <span>{article.read_time} min</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
