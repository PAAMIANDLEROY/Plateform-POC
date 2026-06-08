"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { VideoCard } from "@/components/platform/VideoCard";
import { CourseCard } from "@/components/platform/CourseCard";
import { MOCK_VIDEOS, MOCK_COURSES, MOCK_INSIGHTS } from "@/lib/mock";

const modules = [
  { name: "Insights",     desc: "Recherche & actualité",    icon: "🔬", href: "/insights", iconCls: "bg-danger/10 border-danger/20",   textCls: "text-danger"   },
  { name: "Hi! Tube",     desc: "Vidéothèque pédagogique",  icon: "▶",  href: "/tube",     iconCls: "bg-primary/10 border-primary/20", textCls: "text-primary"  },
  { name: "Hi! Course",   desc: "Cours interactifs",        icon: "📖", href: "/courses",  iconCls: "bg-primary/10 border-primary/20", textCls: "text-primary"  },
  { name: "Hi! MOOC",     desc: "Parcours structurés",      icon: "🎓", href: "/moocs",    iconCls: "bg-primary/10 border-primary/20", textCls: "text-primary"  },
  { name: "Hi! App",      desc: "Applications interactives",icon: "⚡", href: "/apps",     iconCls: "bg-amber-50 border-amber-200",    textCls: "text-amber-700"},
];

const highlightBanners = [
  {
    title: "Recherche & Insights Hi! PARIS",
    desc: "Articles interactifs publiés par les chercheurs de Hi! PARIS, Polytechnique, Télécom Paris et HEC.",
    href: "/insights",
    cta: "Lire les Insights",
    bg: "bg-gradient-to-br from-danger to-[#A01E2A]",
    icon: "🔬",
  },
  {
    title: "Apprenez les fondamentaux de l'IA",
    desc: "Des cours conçus par les chercheurs de Hi! PARIS, Polytechnique et Télécom Paris.",
    href: "/courses",
    cta: "Explorer les cours",
    bg: "bg-gradient-to-br from-primary to-primary-dark",
    icon: "📖",
  },
  {
    title: "Expérimentez en temps réel",
    desc: "Accédez à des applications interactives pour tester vos modèles directement dans le navigateur.",
    href: "/apps",
    cta: "Lancer une app",
    bg: "bg-gradient-to-br from-gray-700 to-gray-900",
    icon: "⚡",
  },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: 480 }}>
        <img
          src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1600&q=80"
          alt="Intelligence Artificielle"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Blue-tinted overlay aligned with Hi! PARIS brand */}
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-primary/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6 py-24 flex flex-col justify-center">
          {/* Hi! PARIS badge */}
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur border border-white/25 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-6 w-fit tracking-wide uppercase">
            Hi! PARIS · Hi! PACE
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight mb-4 max-w-2xl">
            La recherche IA<br />
            <span className="text-[#6C9EF5]">à votre portée</span>
          </h1>

          <p className="text-lg text-white/75 max-w-xl mb-8 leading-relaxed">
            Articles de recherche, cours, vidéos et MOOCs produits par les
            chercheurs de Hi! PARIS — tout en un seul endroit.
          </p>

          <div className="flex items-center gap-4 flex-wrap">
            <Link
              href="/insights"
              className="bg-danger text-white px-7 py-3 rounded-xl font-semibold text-base hover:bg-danger-dark transition-colors shadow-lg"
            >
              Découvrir les Insights
            </Link>
            <Link
              href="/courses"
              className="bg-white/15 backdrop-blur border border-white/30 text-white px-7 py-3 rounded-xl font-semibold text-base hover:bg-white/25 transition-colors"
            >
              Explorer les cours
            </Link>
          </div>
        </div>
      </section>

      {/* ── Highlight banners ────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 -mt-10 relative z-10 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {highlightBanners.map((b) => (
            <Link
              key={b.title}
              href={b.href}
              className={`group relative overflow-hidden rounded-2xl ${b.bg} p-6 hover:scale-[1.02] transition-all shadow-lg`}
            >
              <div className="text-3xl mb-3">{b.icon}</div>
              <h3 className="text-base font-bold text-white mb-2 leading-snug">{b.title}</h3>
              <p className="text-sm text-white/70 mb-4">{b.desc}</p>
              <span className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">
                {b.cta} →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Accès rapide ─────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 mb-16">
        <h2 className="text-xl font-bold text-gray-900 mb-5">
          Bonjour{user ? `, ${user.first_name}` : ""} 👋
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {modules.map((m) => (
            <Link
              key={m.name}
              href={m.href}
              className="group bg-white border border-gray-200 rounded-xl p-5 hover:border-primary/30 hover:shadow-card-hover transition-all shadow-card"
            >
              <div className={`w-10 h-10 ${m.iconCls} border rounded-lg flex items-center justify-center text-xl mb-3`}>
                {m.icon}
              </div>
              <p className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">{m.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Derniers Insights ────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Derniers Insights</h2>
            <p className="text-sm text-gray-400 mt-0.5">Articles publiés par Hi! PARIS</p>
          </div>
          <Link href="/insights" className="text-sm text-danger hover:text-danger-dark transition-colors font-semibold">
            Voir tout →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {MOCK_INSIGHTS.slice(0, 3).map((article) => (
            <Link
              key={article.id}
              href={`/insights/${article.id}`}
              className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-card-hover transition-all shadow-card"
            >
              <div className="relative h-40 overflow-hidden">
                <img
                  src={article.cover}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <span className="absolute top-3 left-3 text-xs font-semibold bg-danger text-white px-2.5 py-0.5 rounded-full">
                  {article.category}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 text-sm leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-3">{article.abstract}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {article.tags.slice(0, 2).map((t) => (
                    <span key={t} className="text-xs bg-gray-50 border border-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-2.5">
                  <span>{article.authors[0]}</span>
                  <span>{article.read_time} min · {article.school}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Vidéos populaires ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Vidéos populaires</h2>
          <Link href="/tube" className="text-sm text-primary hover:text-primary-dark transition-colors font-semibold">
            Voir tout →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MOCK_VIDEOS.slice(0, 3).map((v) => (
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
      </section>

      {/* ── Cours récents ─────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Cours récents</h2>
          <Link href="/courses" className="text-sm text-primary hover:text-primary-dark transition-colors font-semibold">
            Voir tout →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MOCK_COURSES.slice(0, 3).map((c) => (
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
      </section>
    </>
  );
}
