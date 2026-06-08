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

const LEVELS = ["Tous", "Débutant", "Intermédiaire", "Avancé"];
const CATEGORIES_VIDEO = ["Tous", "IA & Data", "Mathématiques", "Finance", "Programmation"];
const CATEGORIES_COURSE = ["Tous", "IA & Data", "Programmation", "Statistiques", "DevOps", "Société & Éthique", "Mathématiques"];

export function SectionCatalogue({ section, activeModule }: SectionCatalogueProps) {
  const base = `/${section.slug}`;
  const [search, setSearch]   = useState("");
  const [level, setLevel]     = useState("Tous");
  const [category, setCategory] = useState("Tous");

  // Reset filters when switching module
  function handleModuleChange() {
    setSearch("");
    setLevel("Tous");
    setCategory("Tous");
  }

  const filteredVideos = useMemo(() =>
    MOCK_VIDEOS.filter((v) => {
      const q = search.toLowerCase();
      const matchSearch = !q || v.title.toLowerCase().includes(q) || v.tags.some((t) => t.toLowerCase().includes(q));
      const matchCategory = category === "Tous" || v.category === category;
      return matchSearch && matchCategory;
    }),
  [search, category]);

  const filteredCourses = useMemo(() =>
    MOCK_COURSES.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch = !q || c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
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

  const showLevels      = activeModule === "courses";
  const showCategories  = activeModule === "tube" || activeModule === "courses";
  const categoryOptions = activeModule === "tube" ? CATEGORIES_VIDEO : CATEGORIES_COURSE;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Section header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-1">{section.label}</h1>
        <p className="text-gray-500">{section.description}</p>
      </div>

      {/* Module tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-gray-200 pb-0">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={`${base}/${tab.key}`}
            onClick={handleModuleChange}
            className={clsx(
              "flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-all -mb-px",
              activeModule === tab.key
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
            )}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <input
          type="text"
          placeholder={`Rechercher dans ${activeModule === "tube" ? "les vidéos" : activeModule === "courses" ? "les cours" : activeModule === "moocs" ? "les MOOCs" : "les apps"}…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors w-64 shadow-sm"
        />

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

        {showLevels && (
          <div className="flex gap-1.5">
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  level === l
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-primary/40 hover:text-primary shadow-sm"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        )}

        {(search || level !== "Tous" || category !== "Tous") && (
          <button
            onClick={() => { setSearch(""); setLevel("Tous"); setCategory("Tous"); }}
            className="text-xs text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-all bg-white shadow-sm"
          >
            ✕ Réinitialiser
          </button>
        )}
      </div>

      {/* Content */}
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
                  level={c.level === "Débutant" ? "beginner" : c.level === "Avancé" ? "advanced" : "intermediate"}
                  school={c.school}
                  estimated_duration_minutes={c.duration}
                  status={c.status}
                />
              ))}
            </div>
      )}

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

function EmptyState({ query }: { query: string }) {
  return (
    <div className="text-center py-20 text-gray-600">
      <p className="text-base mb-1">Aucun résultat{query ? ` pour « ${query} »` : ""}.</p>
      <p className="text-sm">Essayez un autre terme ou réinitialisez les filtres.</p>
    </div>
  );
}
