"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { CourseCard } from "@/components/platform/CourseCard";
import { moocsApi, coursesApi } from "@/lib/api";
import type { MOOCResponse, CourseResponse } from "@/lib/api";

export function MOOCPageClient({ id }: { id: string }) {
  const [mooc,     setMooc]     = useState<MOOCResponse | null>(null);
  const [courses,  setCourses]  = useState<Map<string, CourseResponse>>(new Map());
  const [loading,  setLoading]  = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [open,     setOpen]     = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    moocsApi.get(id)
      .then(async (m) => {
        setMooc(m);
        // Open first module by default
        if (m.modules.length > 0) setOpen(m.modules[0].id);

        // Collect all unique course IDs across modules
        const moduleData = m.modules as Array<{ id: string; courses: Array<{ course_id: string }> }>;
        const courseIds = [...new Set(moduleData.flatMap(mod => mod.courses.map(c => c.course_id)))];

        // Fetch all courses in parallel
        const fetched = await Promise.allSettled(courseIds.map(cid => coursesApi.get(cid)));
        const map = new Map<string, CourseResponse>();
        fetched.forEach((result, i) => {
          if (result.status === "fulfilled") map.set(courseIds[i], result.value);
        });
        setCourses(map);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="max-w-5xl mx-auto px-6 py-16 text-center text-gray-400">Chargement…</div>
  );

  if (!mooc) return (
    <div className="max-w-5xl mx-auto px-6 py-16 text-center">
      <p className="text-gray-400 mb-4">Parcours introuvable.</p>
      <Link href="/learning-ai/moocs" className="text-primary text-sm">← Retour aux MOOCs</Link>
    </div>
  );

  const moduleData = mooc.modules as Array<{
    id: string;
    title: string;
    position: number;
    courses: Array<{ course_id: string; position: number }>;
  }>;
  const sortedModules = [...moduleData].sort((a, b) => a.position - b.position);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/20 to-gray-900 border border-white/10 rounded-2xl p-8 mb-8">
        <Link href="/learning-ai/moocs" className="text-xs text-gray-500 hover:text-white mb-4 inline-block">
          ← Retour aux MOOCs
        </Link>
        <div className="flex items-start justify-between gap-6 flex-col sm:flex-row">
          <div className="flex-1">
            <div className="flex gap-2 mb-3">
              <Badge variant="primary">MOOC</Badge>
              {mooc.school && <Badge variant="neutral">{mooc.school}</Badge>}
            </div>
            <h1 className="text-3xl font-extrabold text-white mb-3">{mooc.title}</h1>
            {mooc.description && <p className="text-gray-300 text-sm leading-relaxed mb-5">{mooc.description}</p>}
            <div className="flex gap-5 text-sm text-gray-400 flex-wrap">
              <span>{sortedModules.length} module{sortedModules.length !== 1 ? "s" : ""}</span>
              <span>{mooc.enrolled_count.toLocaleString("fr-FR")} inscrit{mooc.enrolled_count !== 1 ? "s" : ""}</span>
              {mooc.is_linear && <span>Parcours linéaire</span>}
            </div>
          </div>
          <button
            onClick={() => setEnrolled(true)}
            className={"shrink-0 px-8 py-3 rounded-xl font-semibold text-sm transition-all " + (
              enrolled
                ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 cursor-default"
                : "bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20"
            )}
          >
            {enrolled ? "✓ Inscrit" : "Commencer le parcours"}
          </button>
        </div>
      </div>

      {/* Modules */}
      <h2 className="text-xl font-bold text-white mb-5">Plan du parcours</h2>
      {sortedModules.length === 0 ? (
        <p className="text-gray-500 text-sm">Aucun module disponible pour ce parcours.</p>
      ) : (
        <div className="space-y-3">
          {sortedModules.map((mod, idx) => {
            const isOpen = open === mod.id;
            const locked = !enrolled && idx > 0;
            const modCourses = [...mod.courses]
              .sort((a, b) => a.position - b.position)
              .map(c => courses.get(c.course_id))
              .filter(Boolean) as CourseResponse[];

            return (
              <div key={mod.id} className={`border rounded-2xl overflow-hidden ${locked ? "border-white/5 opacity-60" : "border-white/10"}`}>
                <button
                  onClick={() => !locked && setOpen(isOpen ? null : mod.id)}
                  className="w-full flex items-center justify-between px-6 py-4 bg-gray-900 hover:bg-gray-800 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      locked ? "bg-gray-800 text-gray-600" : "bg-primary/20 text-primary"
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-white text-sm">{mod.title}</span>
                    <span className="text-xs text-gray-500">{mod.courses.length} cours</span>
                    {locked && <Badge variant="neutral" size="sm">Inscrivez-vous</Badge>}
                  </div>
                  <span className="text-gray-500 text-sm">{isOpen ? "^" : "v"}</span>
                </button>

                {isOpen && !locked && (
                  <div className="p-4 bg-gray-950">
                    {modCourses.length === 0 ? (
                      <p className="text-xs text-gray-600 text-center py-4">Les cours de ce module ne sont pas encore disponibles.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {modCourses.map(c => (
                          <CourseCard
                            key={c.id}
                            id={c.id}
                            title={c.title}
                            description={c.description ?? ""}
                            category={c.category ?? ""}
                            level={c.level as "beginner" | "intermediate" | "advanced"}
                            school={c.school ?? ""}
                            estimated_duration_minutes={c.estimated_duration_minutes}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
