import Link from "next/link";
import { MOCK_VIDEOS } from "@/lib/mock";

const categories = ["Tous", "IA & Data", "Mathématiques", "Finance", "Programmation"];

export default function TubePage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Hi! Tube</h1>
          <p className="text-gray-400 mt-1">Vidéothèque pédagogique Hi! PARIS</p>
        </div>
      </div>

      <div className="flex gap-2 mb-8 flex-wrap">
        {categories.map((c) => (
          <button
            key={c}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              c === "Tous"
                ? "bg-primary text-white shadow-lg shadow-primary/30"
                : "bg-white/10 border border-white/10 text-gray-400 hover:border-primary hover:text-white"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_VIDEOS.map((v) => (
          <Link
            key={v.id}
            href={`/tube/${v.id}`}
            className="bg-gray-900 rounded-xl overflow-hidden border border-white/10 hover:border-primary/50 transition-all group"
          >
            <div className="relative aspect-video overflow-hidden">
              <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                {v.duration}
              </span>
            </div>
            <div className="p-4">
              <span className="text-xs font-medium text-primary bg-primary/15 px-2 py-0.5 rounded-full">
                {v.category}
              </span>
              <h3 className="mt-2 font-semibold text-white text-sm leading-snug group-hover:text-primary transition-colors">
                {v.title}
              </h3>
              <div className="flex items-center gap-1 mt-1.5 mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className={`text-sm ${s <= Math.round(v.rating) ? "text-yellow-400" : "text-gray-700"}`}>★</span>
                ))}
                <span className="text-xs text-gray-500 ml-1">{v.rating.toFixed(1)}</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {v.tags.slice(0, 3).map((t) => (
                  <span key={t} className="text-xs bg-white/5 border border-white/10 text-gray-400 px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 border-t border-white/5 pt-2.5">
                <span>{v.school}</span>
                <span>·</span>
                <span>{v.views.toLocaleString()} vues</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
