import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-navy text-white mt-auto">
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

        {/* Branding */}
        <div className="sm:col-span-2 lg:col-span-2">
          <div className="flex items-baseline gap-0 mb-3">
            <span className="text-2xl font-extrabold text-primary-light tracking-tight">Hi!</span>
            <span className="text-2xl font-extrabold text-white tracking-tight"> Platform</span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
            Plateforme pédagogique mutualisée Hi! PARIS — Institut Polytechnique de Paris,
            HEC Paris, Télécom Paris, ENSAE.
          </p>
          <div className="flex items-center gap-3 mt-5">
            <a
              href="https://hi-paris.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-gray-400 hover:text-white transition-colors border border-white/10 px-3 py-1.5 rounded-lg hover:border-white/30"
            >
              hi-paris.fr ↗
            </a>
            <a
              href="mailto:contact@hi-paris.fr"
              className="text-xs font-medium text-gray-400 hover:text-white transition-colors border border-white/10 px-3 py-1.5 rounded-lg hover:border-white/30"
            >
              Contact
            </a>
          </div>
        </div>

        {/* Plateforme */}
        <div>
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Plateforme</h4>
          <ul className="space-y-2.5">
            {[
              { label: "Insights",    href: "/insights" },
              { label: "Vidéos",      href: "/tube" },
              { label: "Cours",       href: "/courses" },
              { label: "MOOCs",       href: "/moocs" },
              { label: "Applications",href: "/apps" },
            ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Légal */}
        <div>
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Informations</h4>
          <ul className="space-y-2.5">
            {[
              { label: "Confidentialité", href: "/privacy" },
              { label: "CGU",             href: "/cgu" },
              { label: "Mon compte",      href: "/profile" },
              { label: "Mon parcours",    href: "/my-learning" },
            ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/8">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
          <p>© {new Date().getFullYear()} Hi! PARIS — HEC Paris & Institut Polytechnique de Paris. Tous droits réservés.</p>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">IP Paris</span>
            <span className="text-gray-700">·</span>
            <span className="text-gray-700">HEC Paris</span>
            <span className="text-gray-700">·</span>
            <span className="text-gray-700">Inria</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
