import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-2xl font-bold text-primary">Hi! Platform</span>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-text-muted hover:text-primary transition-colors">
              Connexion
            </Link>
            <Link
              href="/register"
              className="text-sm bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
            >
              S'inscrire
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          Hi! PARIS — IP Paris
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          La plateforme pédagogique<br />
          <span className="text-primary">mutualisée d'IP Paris</span>
        </h1>
        <p className="text-xl text-text-muted mb-10 max-w-2xl mx-auto">
          Accédez aux cours, vidéos, MOOCs et applications de Hi! PARIS et Hi! PACE depuis un seul endroit.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="bg-primary text-white px-8 py-3 rounded-lg text-base font-semibold hover:bg-primary-dark transition-colors"
          >
            Commencer gratuitement
          </Link>
          <Link
            href="/login"
            className="text-primary border border-primary px-8 py-3 rounded-lg text-base font-semibold hover:bg-primary/5 transition-colors"
          >
            Se connecter
          </Link>
        </div>
      </section>

      {/* Modules */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: "Hi! Tube", desc: "Vidéothèque pédagogique", icon: "▶" },
            { name: "Hi! Course", desc: "Cours interactifs markdown", icon: "📖" },
            { name: "Hi! MOOC", desc: "Parcours structurés", icon: "🎓" },
          ].map((m) => (
            <div key={m.name} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div className="text-3xl mb-3">{m.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{m.name}</h3>
              <p className="text-text-muted text-sm">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
