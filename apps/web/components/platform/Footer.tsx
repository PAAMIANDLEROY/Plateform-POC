/**
 * @file Footer.tsx
 * @description Pied de page de la plateforme Hi! Platform.
 *
 * Affiché sur toutes les pages du groupe `(platform)` via le layout `app/(platform)/layout.tsx`.
 * Fond sombre `bg-navy` (couleur marine de la charte Hi! PARIS).
 *
 * Structure (grille 4 colonnes sur grands écrans) :
 *   - Col 1-2 : Branding (logo "Hi! Platform"), description, liens externes hi-paris.fr et contact.
 *   - Col 3   : Liens plateforme (Insights, Vidéos, Cours, MOOCs, Apps).
 *   - Col 4   : Liens légaux et compte (Confidentialité, CGU, Mon compte, Mon parcours).
 *
 * Internationalisation :
 *   Toutes les chaînes sont issues de `t.footer.*` via `useLanguage()`.
 *   Le composant est `"use client"` pour accéder au hook d'i18n.
 *
 * Copyright :
 *   L'année est calculée dynamiquement via `new Date().getFullYear()` pour rester à jour
 *   sans intervention manuelle.
 */

"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

/**
 * Pied de page global de la plateforme.
 */
export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-navy text-white mt-auto">
      {/* Grille principale : 1 col mobile, 2 cols sm, 4 cols lg */}
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

        {/* ── Branding (occupe 2 colonnes sur lg) ── */}
        <div className="sm:col-span-2 lg:col-span-2">
          {/* Logo texte "Hi! Platform" */}
          <div className="flex items-baseline gap-0 mb-3">
            <span className="text-2xl font-extrabold text-primary-light tracking-tight">Hi!</span>
            <span className="text-2xl font-extrabold text-white tracking-tight"> Platform</span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
            {t.footer.description}
          </p>
          {/* Liens externes hi-paris.fr et contact email */}
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
              {t.footer.contact}
            </a>
          </div>
        </div>

        {/* ── Colonne Plateforme — liens vers les modules de contenu ── */}
        <div>
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
            {t.footer.sections.platform}
          </h4>
          <ul className="space-y-2.5">
            {[
              { label: t.footer.links.insights,  href: "/insights" },
              { label: t.footer.links.videos,    href: "/tube" },
              { label: t.footer.links.courses,   href: "/courses" },
              { label: t.footer.links.moocs,     href: "/moocs" },
              { label: t.footer.links.apps,      href: "/apps" },
            ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Colonne Informations — liens légaux et compte ── */}
        <div>
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
            {t.footer.sections.info}
          </h4>
          <ul className="space-y-2.5">
            {[
              { label: t.footer.links.privacy,    href: "/privacy" },
              { label: t.footer.links.cgu,        href: "/cgu" },
              { label: t.footer.links.account,    href: "/profile" },
              { label: t.footer.links.myLearning, href: "/my-learning" },
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

      {/* ── Barre de bas de page : copyright + logos institutions ── */}
      <div className="border-t border-white/8">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
          {/* Année calculée dynamiquement */}
          <p>© {new Date().getFullYear()} Hi! PARIS — HEC Paris & Institut Polytechnique de Paris. {t.footer.copyright}</p>
          {/* Logos texte des institutions partenaires */}
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
