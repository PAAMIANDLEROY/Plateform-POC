import { MOCK_APPS } from "@/lib/mock";

export default function AppsPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Hi! App</h1>
        <p className="text-text-muted mt-1">Applications interactives hébergées</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_APPS.map((app) => (
          <div key={app.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden group">
            <div className="h-36 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              <span className="text-4xl">⚡</span>
            </div>
            <div className="p-5">
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{app.school}</span>
              <h3 className="mt-2 font-semibold text-gray-900">{app.title}</h3>
              <p className="text-sm text-text-muted mt-1 mb-4">{app.description}</p>
              <div className="flex flex-wrap gap-1 mb-4">
                {app.tags.map((t) => (
                  <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
              <a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full block text-center bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors"
              >
                Ouvrir l'application
              </a>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
