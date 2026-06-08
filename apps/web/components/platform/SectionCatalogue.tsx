/**
 * @file SectionCatalogue.tsx
 * @description Catalogue de contenu multi-modules pour les sections thématiques
 * (ex. "Hi! IA", "Hi! Programmation", etc.).
 *
 * Ce composant est le plus complexe du projet : il gère simultanément :
 *   - 4 onglets de modules (Hi! Tube, Hi! Course, Hi! MOOC, Hi! App)
 *   - 3 filtres indépendants : recherche full-text, niveau, catégorie
 *   - Mémorisation des listes filtrées via `useMemo` (recalcul uniquement si les filtres changent)
 *   - Réinitialisation automatique des filtres au changement d'onglet
 *
 * Logique de filtrage par module :
 *   | Module  | Recherche       | Catégorie | Niveau |
 *   |---------|-----------------|-----------|--------|
 *   | tube    | title + tags    | ✓         | ✗      |
 *   | courses | title + desc    | ✓         | ✓      |
 *   | moocs   | title + desc    | ✗         | ✗      |
 *   | apps    | title + desc + tags | ✗     | ✗      |
 *
 * Filtres affichés conditionnellement :
 *   - `showLevels`     : uniquement pour `courses`
 *   - `showCategories` : pour `tube` et `courses`
 *
 * Grille adaptative :
 *   - tube / courses / moocs : 1 → 2 → 3 colonnes
 *   - apps : 1 → 2 → 4 colonnes (cartes plus petites)
 *
 * Utilisé dans : toutes les pages de section (`learning-ai`, `learning-with-ai`, etc.).
 */

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { VideoCard } from "./VideoCard";
import { CourseCard } from "./CourseCard";
import { MOOCCard } from "./MOOCCard";
import { AppCard } from "./AppCard";
import { MOCK_VIDEOS, MOCK_COURSES, MOCK_MOOCS, MOCK_APPS } from "@/lib/mock";

/**
 * Props du composant SectionCatalogue.
 *
 * @property section              - Métadonnées de la section thématique.
 * @property section.label        - Titre affiché en haut de la page (ex. "Apprendre l'IA").
 * @property section.slug         - Segment URL de la section (ex. `"learning-ai"`).
 * @property section.description  - Description courte affichée sous le titre.
 * @property section.color        - Couleur Tailwind pour l'accentuation (non utilisée actuellement, prévu V2).
 * @property activeModule         - Module actuellement actif : `"tube"`, `"courses"`, `"moocs"` ou `"apps"`.
 *                                  Déterminé par la page qui consomme ce composant.
 */
interface SectionCatalogueProps {
  section: {
    label: string;
    slug: string;
    description: string;
    color: string;
  };
  activeModule: "tube" | "courses" | "moocs" | "apps";
}

/**
 * Définition des onglets de module.
 * `as const` garantit que `key` est un type littéral (pas `string`) pour les comparaisons.
 */
const tabs = [
  { key: "tube",    icon: "▶",  label: "Hi! Tube"   },
  { key: "courses", icon: "📖", label: "Hi! Course" },
  { key: "moocs",   icon: "🎓", label: "Hi! MOOC"   },
  { key: "apps",    icon: "⚡", label: "Hi! App"    },
] as const;

/** Niveaux de difficulté pour le filtre rapide (chips). */
const LEVELS = ["Tous", "Débutant", "Intermédiaire", "Avancé"];

/** Catégories disponibles pour le filtre vidéo (moins granulaires que les cours). */
const CATEGORIES_VIDEO = ["Tous", "IA & Data", "Mathématiques", "Finance", "Programmation"];

/** Catégories disponibles pour le filtre cours (plus nombreuses et techniques). */
const CATEGORIES_COURSE = ["Tous", "IA & Data", "Programmation", "Statistiques", "DevOps", "Société & Éthique", "Mathématiques"];

/**
 * Catalogue multi-modules avec filtrage interactif.
 */
export function SectionCatalogue({ section, activeModule }: SectionCatalogueProps) {
  /** URL de base de la section — préfixe pour les liens des onglets. */
  const base = `/${section.slug}`;

  /** Valeur du champ de recherche. Réinitialisée au changement d'onglet. */
  const [search, setSearch]   = useState("");

  /** Niveau sélectionné — applicable uniquement au module `courses`. */
  const [level, setLevel]     = useState("Tous");

  /** Catégorie sélectionnée — applicable aux modules `tube` et `courses`. */
  const [category, setCategory] = useState("Tous");

  /**
   * Réinitialise tous les filtres lors d'un changement d'onglet.
   * Appelé via `onClick` sur les liens d'onglets.
   */
  function handleModuleChange() {
    setSearch("");
    setLevel("Tous");
    setCategory("Tous");
  }

  /**
   * Liste des vidéos filtrées.
   * Critères : recherche (title + tags) ET catégorie.
   * Recalculé uniquement si `search` ou `category` change.
   */
  const filteredVideos = useMemo(() =>
    MOCK_VIDEOS.filter((v) => {
      const q = search.toLowerCase();
      // Branche recherche vide : accepte toutes les vidéos sans calcul inutile
      const matchSearch = !q || v.title.toLowerCase().includes(q) || v.tags.some((t) => t.toLowerCase().includes(q));
      // Branche "Tous" : pas de filtre catégorie
      const matchCategory = category === "Tous" || v.category === category;
      return matchSearch && matchCategory;
    }),
  [search, category]);

  /**
   * Liste des cours filtrés.
   * Critères : recherche (title + description) ET niveau ET catégorie.
   * Recalculé uniquement si l'un des 3 filtres change.
   */
  const filteredCourses = useMemo(() =>
    MOCK_COURSES.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch = !q || c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
      // Niveau "Tous" → pas de filtre ; sinon compare avec la valeur française de mock.ts
      const matchLevel    = level === "Tous" || c.level === level;
      const matchCategory = category === "Tous" || c.category === category;
      return matchSearch && matchLevel && matchCategory;
    }),
  [search, level, category]);

  /**
   * Liste des MOOCs filtrés.
   * Critère unique : recherche (title + description).
   * Pas de filtre niveau ni catégorie pour les MOOCs.
   */
  const filteredMoocs = useMemo(() =>
    MOCK_MOOCS.filter((m) => {
      const q = search.toLowerCase();
      return !q || m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q);
    }),
  [search]);

  /**
   * Liste des apps filtrées.
   * Critère : recherche (title + description + tags).
   * Pas de filtre niveau ni catégorie pour les apps.
   */
  const filteredApps = useMemo(() =>
    MOCK_APPS.filter((a) => {
      const q = search.toLowerCase();
      return (
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }),
  [search]);

  /**
   * Visibilité conditionnelle des filtres selon le module actif.
   * - showLevels      : boutons de niveau (Débutant / Intermédiaire / Avancé) → cours uniquement
   * - showCategories  : menu déroulant catégorie → vidéos et cours uniquement
   * - categoryOptions : liste d'options différente selon tube (CATEGORIES_VIDEO) ou courses (CATEGORIES_COURSE)
   */
  const showLevels      = activeModule === "courses";
  const showCategories  = activeModule === "tube" || activeModule === "courses";
  const categoryOptions = activeModule === "tube" ? CATEGORIES_VIDEO : CATEGORIES_COURSE;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* En-tête de section : titre et description */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-1">{section.label}</h1>
        <p className="text-gray-500">{section.description}</p>
      </div>

      {/* Onglets de navigation entre modules */}
      <div className="flex items-center gap-1 mb-6 border-b border-gray-200 pb-0">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={`${base}/${tab.key}`}
            onClick={handleModuleChange} {/* Réinitialise les filtres à chaque changement d'onglet */}
            className={clsx(
              "flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-all -mb-px",
              // Branche onglet actif : fond bleu léger + bordure bleue + texte bleu
              activeModule === tab.key
                ? "border-primary text-primary bg-primary/5"
                // Branche onglet inactif : fond transparent + bordure invisible + hover gris
                : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
            )}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Barre de filtres */}
      <div className="flex flex-wrap gap-3 mb-8">
        {/* Champ de recherche : placeholder adaptatif selon le module actif */}
        <input
          type="text"
          placeholder={`Rechercher dans ${
            activeModule === "tube" ? "les vidéos"
            : activeModule === "courses" ? "les cours"
            : activeModule === "moocs" ? "les MOOCs"
            : "les apps"
          }…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors w-64 shadow-sm"
        />

        {/* Filtre catégorie — affiché uniquement pour tube et courses */}
        {showCategories && (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors shadow-sm"
          >
            {categoryOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}

        {/* Chips de niveau — affichés uniquement pour courses */}
        {showLevels && (
          <div className="flex gap-1.5">
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  // Branche niveau sélectionné : fond bleu plein + texte blanc
                  level === l
                    ? "bg-primary text-white shadow-sm"
                    // Branche niveau non sélectionné : fond blanc + bordure grise + hover bleu
                    : "bg-white border border-gray-200 text-gray-600 hover:border-primary/40 hover:text-primary shadow-sm"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        )}

        {/* Bouton "Réinitialiser" — affiché uniquement si au moins un filtre est actif */}
        {(search || level !== "Tous" || category !== "Tous") && (
          <button
            onClick={() => { setSearch(""); setLevel("Tous"); setCategory("Tous"); }}
            className="text-xs text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-all bg-white shadow-sm"
          >
            ✕ Réinitialiser
          </button>
        )}
      </div>

      {/* Zone de contenu — rendu conditionnel par module actif */}

      {/* Branche tube : grille 1→2→3 colonnes */}
      {activeModule === "tube" && (
        filteredVideos.length === 0
          ? <EmptyState query={search} />
          : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredVideos.map((v) => (
                <VideoCard
                  key={v.id}
                  id={v.id}
                  title={v.title}
                  youtube_id={v.youtubeId}
                  thumbnail_url={v.thumbnail}
                  category={v.category}
                  school={v.school}
                  tags={v.tags}
                  view_count={v.views}
                />
              ))}
            </div>
      )}

      {/* Branche courses : conversion label FR → clé EN pour le composant CourseCard */}
      {activeModule === "courses" && (
        filteredCourses.length === 0
          ? <EmptyState query={search} />
          : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCourses.map((c) => (
                <CourseCard
                  key={c.id}
                  id={c.id}
                  title={c.title}
                  description={c.description}
                  category={c.category}
                  {/* Mapping label français (mock.ts) → clé interne (CourseCard) */}
                  level={c.level === "Débutant" ? "beginner" : c.level === "Avancé" ? "advanced" : "intermediate"}
                  school={c.school}
                  estimated_duration_minutes={c.duration}
                  status={c.status}
                />
              ))}
            </div>
      )}

      {/* Branche moocs : grille 1→2→3 colonnes */}
      {activeModule === "moocs" && (
        filteredMoocs.length === 0
          ? <EmptyState query={search} />
          : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMoocs.map((m) => (
                <MOOCCard
                  key={m.id}
                  id={m.id}
                  title={m.title}
                  description={m.description}
                  school={m.school}
                  enrolled_count={m.enrolled}
                  modules_count={m.courses}
                />
              ))}
            </div>
      )}

      {/* Branche apps : grille 1→2→4 colonnes (cartes plus petites) */}
      {activeModule === "apps" && (
        filteredApps.length === 0
          ? <EmptyState query={search} />
          : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {filteredApps.map((a) => (
                <AppCard
                  key={a.id}
                  id={a.id}
                  title={a.title}
                  description={a.description}
                  school={a.school}
                  tags={a.tags}
                  url={a.url}
                  githubRepo={a.githubRepo}
                />
              ))}
            </div>
      )}
    </div>
  );
}

/**
 * État vide affiché lorsqu'aucun résultat ne correspond aux filtres actifs.
 *
 * @property query - La recherche textuelle active, utilisée pour personnaliser le message.
 *                   Si vide, affiche un message générique.
 */
function EmptyState({ query }: { query: string }) {
  return (
    <div className="text-center py-20 text-gray-600">
      {/* Branche recherche active : inclut le terme dans le message */}
      <p className="text-base mb-1">Aucun résultat{query ? ` pour « ${query} »` : ""}.</p>
      <p className="text-sm">Essayez un autre terme ou réinitialisez les filtres.</p>
    </div>
  );
}
