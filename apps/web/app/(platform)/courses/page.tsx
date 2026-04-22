import Link from "next/link";
import { MOCK_COURSES } from "@/lib/mock";

const levels: Record<string, string> = { Débutant: "bg-green-100 text-green-700", Intermédiaire: "bg-yellow-100 text-yellow-700", Avancé: "bg-red-100 text-red-700" };

export default function CoursesPage() {
  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hi! Course</h1>
          <p className="text-text-muted mt-1">Catalogue de cours interactifs</p>
        </div>
        <Link href="/studio" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors">
          + Créer un cours
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_COURSES.map((c) => (
          <Link
            key={c.id}
            href={`/courses/${c.id}`}
            className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{c.category}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${levels[c.level] ?? ""}`}>{c.level}</span>
            </div>
            <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">{c.title}</h3>
            <p className="text-sm text-text-muted mt-1 mb-4">{c.description}</p>
            <div className="flex items-center justify-between text-xs text-text-muted border-t border-gray-100 pt-3">
              <span>{c.school}</span>
              <span>{Math.floor(c.duration / 60)}h · {c.blocks} blocs</span>
            </div>
            {c.status === "draft" && (
              <span className="mt-2 inline-block text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Brouillon</span>
            )}
          </Link>
        ))}
      </div>
    </>
  );
}
