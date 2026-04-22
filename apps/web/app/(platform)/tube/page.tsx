import Link from "next/link";
import { MOCK_VIDEOS } from "@/lib/mock";

const categories = ["Tous", "IA & Data", "Mathématiques", "Finance", "Programmation"];

export default function TubePage() {
  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hi! Tube</h1>
          <p className="text-text-muted mt-1">Vidéothèque pédagogique IP Paris</p>
        </div>
      </div>

      <div className="flex gap-2 mb-8 flex-wrap">
        {categories.map((c) => (
          <button
            key={c}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              c === "Tous"
                ? "bg-primary text-white"
                : "bg-white border border-gray-200 text-text-muted hover:border-primary hover:text-primary"
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
            className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="relative aspect-video bg-gray-100 overflow-hidden">
              <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                {v.duration}
              </span>
            </div>
            <div className="p-4">
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {v.category}
              </span>
              <h3 className="mt-2 font-semibold text-gray-900 text-sm leading-snug group-hover:text-primary transition-colors">
                {v.title}
              </h3>
              <div className="mt-2 flex items-center gap-2 text-xs text-text-muted">
                <span>{v.school}</span>
                <span>·</span>
                <span>{v.views.toLocaleString()} vues</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
