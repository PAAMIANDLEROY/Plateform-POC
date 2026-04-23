import Link from "next/link";
import { MOCK_USER, MOCK_COURSES, MOCK_VIDEOS } from "@/lib/mock";

const subBanners = [
  {
    title: "Apprenez les fondamentaux de l'IA",
    desc: "Des cours conçus par les chercheurs d'IP Paris, de Polytechnique et de Télécom Paris.",
    href: "/courses",
    cta: "Explorer les cours",
    accent: "from-primary/80 to-primary/20",
    icon: "📖",
  },
  {
    title: "Suivez un parcours complet",
    desc: "Nos MOOCs structurés vous guident du machine learning aux applications en production.",
    href: "/moocs",
    cta: "Voir les parcours",
    accent: "from-danger/80 to-danger/20",
    icon: "🎓",
  },
  {
    title: "Expérimentez en temps réel",
    desc: "Accédez à des applications interactives pour tester vos modèles directement dans le navigateur.",
    href: "/apps",
    cta: "Lancer une app",
    accent: "from-white/20 to-white/5",
    icon: "⚡",
  },
];

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
      {/* ── Grosse bannière hero ─────────────────────────────────────── */}
      <section className="relative w-full h-[560px] overflow-hidden">
        {/* Image IA en fond */}
        <img
          src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1600&q=80"
          alt="Intelligence Artificielle"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay gradient noir */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />

        {/* Contenu */}
        <div className="relative h-full max-w-7xl mx-auto px-6 flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-white/80 text-sm font-medium px-4 py-1.5 rounded-full mb-6 w-fit">
            Hi! PARIS — IP Paris
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight mb-4 max-w-2xl">
            L'IA au cœur de<br />
            <span className="text-primary">votre formation</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-xl mb-8">
            La plateforme pédagogique mutualisée d'IP Paris. Cours, vidéos,
            MOOCs et applications en un seul endroit.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/courses"
              className="bg-primary text-white px-7 py-3 rounded-xl font-semibold text-base hover:bg-primary-dark transition-colors shadow-lg shadow-primary/30"
            >
              Commencer maintenant
            </Link>
            <Link
              href="/tube"
              className="border border-white/30 text-white px-7 py-3 rounded-xl font-semibold text-base hover:bg-white/10 transition-colors"
            >
              Voir les vidéos
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trois sous-bannières ─────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 -mt-12 relative z-10 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {subBanners.map((b) => (
            <Link
              key={b.title}
              href={b.href}
              className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${b.accent} border border-white/10 p-6 hover:border-white/30 transition-all hover:scale-[1.02]`}
            >
              <div className="text-3xl mb-3">{b.icon}</div>
              <h3 className="text-lg font-bold text-white mb-2 leading-snug">{b.title}</h3>
              <p className="text-sm text-gray-300 mb-4">{b.desc}</p>
              <span className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">
                {b.cta} →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Accès rapide modules ─────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 mb-16">
        <h2 className="text-2xl font-bold text-white mb-6">
          Bonjour, {MOCK_USER.first_name} 👋
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {modules.map((m) => (
            <Link
              key={m.name}
              href={m.href}
              className="group bg-gray-900 border border-white/10 rounded-xl p-5 hover:border-primary/50 hover:bg-gray-800 transition-all"
            >
              <div className="text-2xl mb-2">{m.icon}</div>
              <p className="text-sm font-semibold text-white group-hover:text-primary transition-colors">{m.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{m.count}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Vidéos populaires ───────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Vidéos populaires</h2>
          <Link href="/tube" className="text-sm text-primary hover:text-primary-light transition-colors font-medium">
            Voir tout →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MOCK_VIDEOS.slice(0, 3).map((v) => (
            <Link
              key={v.id}
              href={`/tube/${v.id}`}
              className="group bg-gray-900 border border-white/10 rounded-xl overflow-hidden hover:border-primary/40 transition-all"
            >
              <div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
                <img
                  src={v.thumbnail}
                  alt={v.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-mono">
                  {v.duration}
                </span>
                <span className="absolute top-2 left-2 text-xs font-medium bg-primary/80 backdrop-blur text-white px-2 py-0.5 rounded-full">
                  {v.category}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-white text-sm leading-snug group-hover:text-primary transition-colors mb-2">
                  {v.title}
                </h3>
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className={`text-sm ${s <= Math.round(v.rating) ? "text-yellow-400" : "text-gray-700"}`}>★</span>
                  ))}
                  <span className="text-xs text-gray-500 ml-1">{v.rating.toFixed(1)}</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {v.tags.slice(0, 2).map((t) => (
                    <span key={t} className="text-xs bg-white/5 border border-white/10 text-gray-400 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 border-t border-white/5 pt-2.5">
                  <span>{v.school}</span>
                  <span>{v.views.toLocaleString()} vues</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Cours récents ────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Cours récents</h2>
          <Link href="/courses" className="text-sm text-primary hover:text-primary-light transition-colors font-medium">
            Voir tout →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MOCK_COURSES.slice(0, 3).map((c) => (
            <Link
              key={c.id}
              href={`/courses/${c.id}`}
              className="group bg-gray-900 border border-white/10 rounded-xl p-5 hover:border-primary/40 hover:bg-gray-800 transition-all"
            >
              <span className="text-xs font-medium text-primary bg-primary/15 px-2 py-0.5 rounded-full">
                {c.category}
              </span>
              <h3 className="mt-3 font-semibold text-white text-sm leading-snug group-hover:text-primary transition-colors">
                {c.title}
              </h3>
              <p className="text-xs text-gray-500 mt-1 mb-4">{c.description}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500 border-t border-white/5 pt-3">
                <span>{c.school}</span>
                <span>·</span>
                <span>{Math.floor(c.duration / 60)}h{c.duration % 60 > 0 ? `${c.duration % 60}min` : ""}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
