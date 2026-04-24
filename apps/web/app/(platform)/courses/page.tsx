import Link from "next/link";
import { MOCK_COURSES } from "@/lib/mock";

const levels: Record<string, string> = {
  Débutant: "bg-green-900/50 text-green-400",
  Intermédiaire: "bg-yellow-900/50 text-yellow-400",
  Avancé: "bg-red-900/50 text-red-400",
};

export default function CoursesPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Hi! Course</h1>
          <p className="text-gray-400 mt-1">Catalogue de cours interactifs</p>
        </div>
        <Link href="/studio" className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/30">
          + Créer un cours
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_COURSES.map((c) => (
          <Link
            key={c.id}
            href={`/courses/${c.id}`}
            className="bg-gray-900 rounded-xl p-6 border border-white/10 hover:border-primary/50 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-primary bg-primary/15 px-2 py-0.5 rounded-full">{c.category}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${levels[c.level] ?? ""}`}>{c.level}</span>
            </div>
            <h3 className="font-semibold text-white group-hover:text-primary transition-colors">{c.title}</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">{c.description}</p>
            <div className="flex items-center justify-between text-xs text-gray-600 border-t border-white/5 pt-3">
              <span>{c.school}</span>
              <span>{Math.floor(c.duration / 60)}h · {c.blocks} blocs</span>
            </div>
            {c.status === "draft" && (
              <span className="mt-2 inline-block text-xs bg-white/10 text-gray-400 px-2 py-0.5 rounded-full">Brouillon</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
