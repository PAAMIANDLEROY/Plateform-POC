"use client";

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

export function SectionCatalogue({ section, activeModule }: SectionCatalogueProps) {
  const base = `/${section.slug}`;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* En-tête section */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white mb-1">{section.label}</h1>
        <p className="text-gray-400">{section.description}</p>
      </div>

      {/* Onglets modules */}
      <div className="flex items-center gap-2 mb-8 border-b border-white/10 pb-0">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={`${base}/${tab.key}`}
            className={clsx(
              "flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-all -mb-px",
              activeModule === tab.key
                ? "border-primary text-white bg-primary/10"
                : "border-transparent text-gray-500 hover:text-gray-300 hover:border-white/20"
            )}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Contenu */}
      {activeModule === "tube" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MOCK_VIDEOS.map((v) => (
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MOCK_COURSES.map((c) => (
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MOCK_MOOCS.map((m) => (
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {MOCK_APPS.map((a) => (
            <AppCard
              key={a.id}
              id={a.id}
              title={a.title}
              description={a.description}
              school={a.school}
              tags={a.tags}
            />
          ))}
        </div>
      )}
    </div>
  );
}
