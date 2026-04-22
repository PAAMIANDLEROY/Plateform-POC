import Link from "next/link";
import { MOCK_MOOCS } from "@/lib/mock";

export default function MoocsPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Hi! MOOC</h1>
        <p className="text-text-muted mt-1">Parcours pédagogiques structurés</p>
      </div>

      <div className="flex flex-col gap-6">
        {MOCK_MOOCS.map((m) => (
          <Link
            key={m.id}
            href={`/moocs/${m.id}`}
            className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-6 group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{m.school}</span>
                <h2 className="mt-2 text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">{m.title}</h2>
                <p className="text-text-muted text-sm mt-1">{m.description}</p>
                <div className="mt-4 flex items-center gap-4 text-sm text-text-muted">
                  <span>📖 {m.courses} cours</span>
                  <span>👥 {m.enrolled} inscrits</span>
                </div>
              </div>
              <button className="shrink-0 bg-primary text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors">
                Commencer
              </button>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
