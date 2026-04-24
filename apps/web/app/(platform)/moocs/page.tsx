import Link from "next/link";
import { MOCK_MOOCS } from "@/lib/mock";

export default function MoocsPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Hi! MOOC</h1>
        <p className="text-gray-400 mt-1">Parcours pédagogiques structurés</p>
      </div>

      <div className="flex flex-col gap-5">
        {MOCK_MOOCS.map((m) => (
          <Link
            key={m.id}
            href={`/moocs/${m.id}`}
            className="bg-gray-900 rounded-xl border border-white/10 hover:border-primary/50 transition-all p-6 group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <span className="text-xs font-medium text-primary bg-primary/15 px-2 py-0.5 rounded-full">{m.school}</span>
                <h2 className="mt-3 text-xl font-bold text-white group-hover:text-primary transition-colors">{m.title}</h2>
                <p className="text-gray-400 text-sm mt-1">{m.description}</p>
                <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                  <span>📖 {m.courses} cours</span>
                  <span>👥 {m.enrolled} inscrits</span>
                </div>
              </div>
              <button className="shrink-0 bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20">
                Commencer
              </button>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
