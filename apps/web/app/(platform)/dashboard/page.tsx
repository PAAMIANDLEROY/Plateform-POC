import Link from "next/link";
import { MOCK_USER, MOCK_COURSES } from "@/lib/mock";

const modules = [
  { name: "Hi! Tube", desc: "Vidéothèque pédagogique", icon: "▶", href: "/tube", count: "6 vidéos" },
  { name: "Hi! Course", desc: "Cours interactifs markdown", icon: "📖", href: "/courses", count: "6 cours" },
  { name: "Hi! MOOC", desc: "Parcours structurés", icon: "🎓", href: "/moocs", count: "3 parcours" },
  { name: "Hi! App", desc: "Applications interactives", icon: "⚡", href: "/apps", count: "3 apps" },
  { name: "Hi! Studio", desc: "Builder de cours", icon: "✏️", href: "/studio", count: "Créer" },
];

export default function DashboardPage() {
  return (
    <>
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Bonjour, {MOCK_USER.first_name} 👋
        </h1>
        <p className="text-text-muted">Bienvenue sur Hi! Platform — mode démo</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
        {modules.map((m) => (
          <Link
            key={m.name}
            href={m.href}
            className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group"
          >
            <div className="text-3xl mb-3">{m.icon}</div>
            <h3 className="text-base font-semibold text-gray-900 mb-0.5 group-hover:text-primary transition-colors">
              {m.name}
            </h3>
            <p className="text-text-muted text-sm">{m.desc}</p>
            <span className="mt-3 inline-block text-xs text-primary font-medium">{m.count} →</span>
          </Link>
        ))}
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-4">Cours récents</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_COURSES.slice(0, 3).map((c) => (
          <Link
            key={c.id}
            href={`/courses/${c.id}`}
            className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all"
          >
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {c.category}
            </span>
            <h3 className="mt-2 font-semibold text-gray-900 text-sm">{c.title}</h3>
            <p className="text-xs text-text-muted mt-1">{c.description}</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-text-muted">
              <span>{c.school}</span>
              <span>·</span>
              <span>{Math.floor(c.duration / 60)}h{c.duration % 60 > 0 ? `${c.duration % 60}min` : ""}</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
