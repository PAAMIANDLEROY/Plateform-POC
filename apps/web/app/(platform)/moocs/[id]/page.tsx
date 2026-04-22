import Link from "next/link";
import { MOCK_MOOCS, MOCK_COURSES } from "@/lib/mock";

export function generateStaticParams() {
  return MOCK_MOOCS.map((m) => ({ id: m.id }));
}

export default function MoocPage({ params }: { params: { id: string } }) {
  const mooc = MOCK_MOOCS.find((m) => m.id === params.id) ?? MOCK_MOOCS[0];
  const courses = MOCK_COURSES.slice(0, mooc.courses);

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/moocs" className="text-sm text-text-muted hover:text-primary transition-colors mb-6 inline-block">
        ← Retour aux parcours
      </Link>

      <div className="bg-gradient-to-r from-primary to-primary-light rounded-2xl p-8 text-white mb-8">
        <span className="text-xs font-medium bg-white/20 px-2 py-0.5 rounded-full">{mooc.school}</span>
        <h1 className="text-2xl font-bold mt-3 mb-2">{mooc.title}</h1>
        <p className="text-white/80 text-sm mb-6">{mooc.description}</p>
        <div className="flex items-center gap-4 text-sm text-white/80 mb-6">
          <span>📖 {mooc.courses} cours</span>
          <span>👥 {mooc.enrolled} inscrits</span>
        </div>
        <button className="bg-white text-primary px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">
          S'inscrire au parcours
        </button>
      </div>

      <h2 className="text-lg font-bold text-gray-900 mb-4">Contenu du parcours</h2>
      <div className="flex flex-col gap-3">
        {courses.map((c, i) => (
          <Link
            key={c.id}
            href={`/courses/${c.id}`}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-all group"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">
              {i + 1}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 group-hover:text-primary transition-colors text-sm">{c.title}</p>
              <p className="text-xs text-text-muted mt-0.5">{Math.floor(c.duration / 60)}h · {c.blocks} blocs</p>
            </div>
            <span className="text-text-muted text-sm">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
