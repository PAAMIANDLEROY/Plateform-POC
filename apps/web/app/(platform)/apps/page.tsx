import { MOCK_APPS } from "@/lib/mock";

export default function AppsPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Hi! App</h1>
        <p className="text-gray-400 mt-1">Applications interactives hébergées</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_APPS.map((app) => (
          <div key={app.id} className="bg-gray-900 rounded-xl border border-white/10 overflow-hidden group hover:border-primary/50 transition-all">
            <div className="h-36 bg-gradient-to-br from-primary/20 to-black flex items-center justify-center">
              <span className="text-5xl">⚡</span>
            </div>
            <div className="p-5">
              <span className="text-xs font-medium text-primary bg-primary/15 px-2 py-0.5 rounded-full">{app.school}</span>
              <h3 className="mt-2 font-semibold text-white">{app.title}</h3>
              <p className="text-sm text-gray-500 mt-1 mb-4">{app.description}</p>
              <div className="flex flex-wrap gap-1 mb-4">
                {app.tags.map((t) => (
                  <span key={t} className="text-xs bg-white/10 text-gray-400 px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
              <a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full block text-center bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
              >
                Ouvrir l'application
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
