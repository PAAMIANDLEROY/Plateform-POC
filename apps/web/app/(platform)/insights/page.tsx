import Link from "next/link";
import { MOCK_INSIGHTS } from "@/lib/mock";

const categories = ["Tous", "IA & Cognition", "IA & Société", "Génération & Synthèse", "IA & Raisonnement"];

export default function InsightsPage() {
  const [featured, ...rest] = MOCK_INSIGHTS;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white">Inside &amp; Insights</h1>
          <p className="text-gray-400 mt-1">Articles de recherche interactifs — Hi! PARIS</p>
        </div>
        <Link
          href="/insights/new"
          className="bg-danger text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-danger-dark transition-colors shadow-lg shadow-danger/30"
        >
          + Publier un article
        </Link>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-10 flex-wrap">
        {categories.map((c) => (
          <button
            key={c}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              c === "Tous"
                ? "bg-white text-black"
                : "bg-white/10 border border-white/10 text-gray-400 hover:text-white hover:border-white/30"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Article à la une */}
      <Link href={`/insights/${featured.id}`} className="group block mb-10">
        <div className="relative rounded-2xl overflow-hidden h-80">
          <img src={featured.cover} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          <div className="absolute inset-0 p-8 flex flex-col justify-end">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-medium bg-danger text-white px-3 py-1 rounded-full">À la une</span>
              <span className="text-xs font-medium bg-white/10 text-white px-3 py-1 rounded-full border border-white/20">{featured.category}</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-gray-200 transition-colors max-w-2xl">
              {featured.title}
            </h2>
            <p className="text-gray-300 text-sm max-w-xl line-clamp-2">{featured.abstract}</p>
            <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
              <span>{featured.authors.join(", ")}</span>
              <span>·</span>
              <span>{featured.school}</span>
              <span>·</span>
              <span>{featured.read_time} min de lecture</span>
            </div>
          </div>
        </div>
      </Link>

      {/* Grille d'articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rest.map((article) => (
          <Link
            key={article.id}
            href={`/insights/${article.id}`}
            className="group bg-gray-900 rounded-xl border border-white/10 overflow-hidden hover:border-white/30 transition-all"
          >
            <div className="relative h-44 overflow-hidden">
              <img src={article.cover} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
              <span className="absolute top-3 left-3 text-xs font-medium bg-black/50 backdrop-blur text-white px-2.5 py-1 rounded-full border border-white/10">
                {article.category}
              </span>
            </div>
            <div className="p-5">
              <h3 className="font-bold text-white text-sm leading-snug mb-2 group-hover:text-gray-200 transition-colors line-clamp-2">
                {article.title}
              </h3>
              <p className="text-xs text-gray-500 line-clamp-2 mb-4">{article.abstract}</p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {article.tags.map((t) => (
                  <span key={t} className="text-xs bg-white/5 border border-white/10 text-gray-400 px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600 border-t border-white/5 pt-3">
                <span>{article.authors[0]}</span>
                <span>{article.read_time} min</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
