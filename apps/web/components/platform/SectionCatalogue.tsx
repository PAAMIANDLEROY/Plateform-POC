"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { VideoCard } from "./VideoCard";
import { CourseCard } from "./CourseCard";
import { MOOCCard } from "./MOOCCard";
import { AppCard } from "./AppCard";
import { MOCK_VIDEOS, MOCK_COURSES, MOCK_MOOCS, MOCK_APPS } from "@/lib/mock";

interface SectionCatalogueProps {
  section: {
    label: string;
    slug: string;
    description: string;
    color: string;
  };
  activeModule: "tube" | "courses" | "moocs" | "apps";
}

const tabs = [
  { key: "tube",    icon: "▶",  label: "Hi! Tube"   },
  { key: "courses", icon: "📖", label: "Hi! Course" },
  { key: "moocs",   icon: "🎓", label: "Hi! MOOC"   },
  { key: "apps",    icon: "⚡", label: "Hi! App"    },
] as const;

const LEVELS = ["Débutant", "Intermédiaire", "Avancé"];
const CATEGORIES_VIDEO = ["Tous", "IA & Data", "Mathématiques", "Finance", "Programmation"];
const CATEGORIES_COURSE = ["Tous", "IA & Data", "Programmation", "Statistiques", "DevOps", "Société & Éthique", "Mathématiques"];

export function SectionCatalogue({ section, activeModule }: SectionCatalogueProps) {
  const base = `/${section.slug}`;
  const [search, setSearch]     = useState("");
  const [level, setLevel]       = useState("Tous");
  const [category, setCategory] = useState("Tous");

  function handleModuleChange() {
    setSearch("");
    setLevel("Tous");
    setCategory("Tous");
  }

  const filteredVideos = useMemo(() =>
    MOCK_VIDEOS.filter((v) => {
      const q = search.toLowerCase();
      const matchSearch   = !q || v.title.toLowerCase().includes(q) || v.tags.some((t) => t.toLowerCase().includes(q));
      const matchCategory = category === "Tous" || v.category === category;
      return matchSearch && matchCategory;
    }),
  [search, category]);

  const filteredCourses = useMemo(() =>
    MOCK_COURSES.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch   = !q || c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
      const matchLevel    = level === "Tous" || c.level === level;
      const matchCategory = category === "Tous" || c.category === category;
      return matchSearch && matchLevel && matchCategory;
    }),
  [search, level, category]);

  const filteredMoocs = useMemo(() =>
    MOCK_MOOCS.filter((m) => {
      const q = search.toLowerCase();
      return !q || m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q);
    }),
  [search]);

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

  const showCategories  = activeModule === "tube" || activeModule === "courses";
  const showLevels      = activeModule === "courses";
  const categoryOptions = activeModule === "tube" ? CATEGORIES_VIDEO : CATEGORIES_COURSE;

  const searchPlaceholder =
    activeModule === "tube"    ? "Rechercher une vidéo…"
    : activeModule === "courses" ? "Rechercher un cours…"
    : activeModule === "moocs"   ? "Rechercher un MOOC…"
    : "Rechercher une application…";

  const resultCount =
    activeModule === "tube"    ? filteredVideos.length
    : activeModule === "courses" ? filteredCourses.length
    : activeModule === "moocs"   ? filteredMoocs.length
    : filteredApps.length;

  return (
    <div>
      {/* ── Hero banner ── */}
      <div className="bg-primary/[0.04] border-b border-primary/10 py-10 px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-1">{section.label}</h1>
          <p className="text-center text-sm text-gray-500 mb-6">{section.description}</p>

          {/* Barre de recherche — pill centré */}
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/40 pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-10 py-3.5 rounded-full border border-primary/25 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors text-sm leading-none"
                aria-label="Effacer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Chips catégorie + niveau */}
          {(showCategories || showLevels) && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {showCategories && categoryOptions.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={clsx(
                    "px-4 py-1.5 rounded-full text-sm font-medium border transition-all",
                    category === c
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-white text-gray-600 border-gray-300 hover:border-primary/50 hover:text-primary"
                  )}
                >
                  {c}
                </button>
              ))}
              {showLevels && LEVELS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(level === l ? "Tous" : l)}
                  className={clsx(
                    "px-4 py-1.5 rounded-full text-xs font-semibold border transition-all",
                    level === l
                      ? "bg-primary/10 text-primary border-primary/40"
                      : "bg-white text-gray-500 border-gray-200 hover:border-primary/30 hover:text-primary"
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Content area ── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Onglets modules — pills */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={`${base}/${tab.key}`}
              onClick={handleModuleChange}
              className={clsx(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all",
                activeModule === tab.key
                  ? "bg-primary text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-primary/40 hover:text-primary"
              )}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </Link>
          ))}
          <span className="ml-auto text-sm text-gray-400 tabular-nums">
            {resultCount} résultat{resultCount !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Grille Tube */}
        {activeModule === "tube" && (
          filteredVideos.length === 0
            ? <EmptyState query={search} />
            : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

        {/* Grille Courses */}
        {activeModule === "courses" && (
          filteredCourses.length === 0
            ? <EmptyState query={search} />
            : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((c) => (
                  <CourseCard
                    key={c.id}
                    id={c.id}
                    title={c.title}
                    description={c.description}
                    category={c.category}
                    level={c.level === "Débutant" ? "beginner" : c.level === "Avancé" ? "advanced" : "intermediate"}
                    school={c.school}
                    estimated_duration_minutes={c.duration}
                    status={c.status}
                  />
                ))}
              </div>
        )}

        {/* Grille MOOCs */}
        {activeModule === "moocs" && (
          filteredMoocs.length === 0
            ? <EmptyState query={search} />
            : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

        {/* Grille Apps */}
        {activeModule === "apps" && (
          filteredApps.length === 0
            ? <EmptyState query={search} />
            : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="text-center py-20 text-gray-500">
      <p className="text-base mb-1">Aucun résultat{query ? ` pour « ${query} »` : ""}.</p>
      <p className="text-sm">Essayez un autre terme ou modifiez les filtres.</p>
    </div>
  );
}
