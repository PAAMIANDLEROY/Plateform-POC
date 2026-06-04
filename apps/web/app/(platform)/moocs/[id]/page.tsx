"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MOCK_MOOCS, MOCK_COURSES } from "@/lib/mock";
import { Badge } from "@/components/ui/Badge";
import { CourseCard } from "@/components/platform/CourseCard";
import { PageSpinner } from "@/components/ui/Spinner";
const MODULES = [
  { id: "m1", title: "Module 1 - Fondamentaux", courseIds: ["1", "2"] },
  { id: "m2", title: "Module 2 - Approfondissement", courseIds: ["3", "4"] },
  { id: "m3", title: "Module 3 - Mise en pratique", courseIds: ["5", "6"] },
];
export default function MOOCPage() {
  const { id } = useParams<{ id: string }>();
  const mooc = MOCK_MOOCS.find((m) => m.id === id);
  const [enrolled, setEnrolled] = useState(false);
  const [open, setOpen] = useState<string | null>("m1");
  if (!mooc) return <PageSpinner />;
  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="bg-gradient-to-br from-primary/20 to-gray-900 border border-white/10 rounded-2xl p-8 mb-8">
        <Link href="/learning-ai/moocs" className="text-xs text-gray-500 hover:text-white mb-4 inline-block">Back to MOOCs</Link>
        <div className="flex items-start justify-between gap-6 flex-col sm:flex-row">
          <div className="flex-1">
            <div className="flex gap-2 mb-3"><Badge variant="primary">MOOC</Badge><Badge variant="neutral">{mooc.school}</Badge></div>
            <h1 className="text-3xl font-extrabold text-white mb-3">{mooc.title}</h1>
            <p className="text-gray-300 text-sm mb-5">{mooc.description}</p>
            <div className="flex gap-5 text-sm text-gray-400"><span>Cours: {mooc.courses}</span><span>Inscrits: {mooc.enrolled}</span></div>
          </div>
          <button onClick={() => setEnrolled(true)} className={"shrink-0 px-8 py-3 rounded-xl font-semibold text-sm " + (enrolled ? "bg-emerald-500/20 text-emerald-400" : "bg-primary text-white hover:bg-primary-dark")}>
            {enrolled ? "Inscrit" : "Commencer"}
          </button>
        </div>
      </div>
      <h2 className="text-xl font-bold text-white mb-5">Plan du parcours</h2>
      <div className="space-y-3">
        {MODULES.map((mod, idx) => {
          const isOpen = open === mod.id;
          const courses = MOCK_COURSES.filter((c) => mod.courseIds.includes(c.id));
          const locked = !enrolled && idx > 0;
          return (
            <div key={mod.id} className={"border rounded-2xl overflow-hidden " + (locked ? "border-white/5 opacity-60" : "border-white/10")}>
              <button onClick={() => !locked && setOpen(isOpen ? null : mod.id)} className="w-full flex items-center justify-between px-6 py-4 bg-gray-900 hover:bg-gray-800 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <span className={"w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold " + (locked ? "bg-gray-800 text-gray-600" : "bg-primary/20 text-primary")}>{idx+1}</span>
                  <span className="font-semibold text-white text-sm">{mod.title}</span>
                  <span className="text-xs text-gray-500">{mod.courseIds.length} cours</span>
                </div>
                <span className="text-gray-500">{isOpen ? "v" : ">"}</span>
              </button>
              {isOpen && !locked && (
                <div className="p-4 bg-gray-950 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {courses.map((c) => <CourseCard key={c.id} id={c.id} title={c.title} description={c.description} category={c.category} level={c.level === "Debutant" ? "beginner" : c.level === "Avance" ? "advanced" : "intermediate"} school={c.school} estimated_duration_minutes={c.duration} />)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}