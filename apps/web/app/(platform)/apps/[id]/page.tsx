/**
 * @file (platform)/apps/[id]/page.tsx
 * @description Page de lecture d'une application Hi! App "/apps/[id]".
 *
 * Composant serveur (SSG) — rendu statique.
 *   `generateStaticParams()` pré-génère les routes pour toutes les apps connues.
 *   Compatible avec `output: "export"`.
 *   Fallback : si l'ID n'existe pas, affiche la première app (`MOCK_APPS[0]`).
 *
 * Layout 2 colonnes (lg:grid-cols-4) :
 *   - Sidebar (1 colonne) : carte info sticky — titre, description, tags, school, bouton plein écran.
 *   - Contenu (3 colonnes) : iframe simulant une barre d'adresse "style navigateur"
 *     (dots rouge/jaune/vert + URL) pour encadrer l'app embarquée.
 *
 * Iframe :
 *   `sandbox="allow-scripts allow-same-origin allow-forms allow-popups"` pour les apps
 *   Streamlit / Gradio qui ont besoin d'exécuter du JS et de faire des requêtes.
 *   Hauteur fixe `75vh` pour laisser la topbar visible.
 *
 * @param params - Route params Next.js — `id` est l'identifiant de l'app.
 */

import Link from "next/link";
import { MOCK_APPS } from "@/lib/mock";
import { Badge } from "@/components/ui/Badge";

/**
 * Génère les paramètres statiques pour toutes les routes `/apps/[id]`.
 *
 * @returns Tableau de `{ id }` pour chaque app dans `MOCK_APPS`.
 */
export function generateStaticParams() {
  return MOCK_APPS.map((a) => ({ id: a.id }));
}

/**
 * Page de lecture d'une application interactive.
 *
 * @param params - Contient `id` — identifiant de l'app dans `MOCK_APPS`.
 */
export default function AppPage({ params }: { params: { id: string } }) {
  /**
   * Recherche l'app par ID.
   * Fallback sur la première app si l'ID n'est pas trouvé.
   */
  const app = MOCK_APPS.find((a) => a.id === params.id) ?? MOCK_APPS[0];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Lien retour catalogue apps */}
      <Link href="/learning-ai/apps" className="text-sm text-gray-500 hover:text-white mb-6 inline-block">
        ← Retour aux apps
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ── Sidebar : informations sur l'app ── */}
        <div className="lg:col-span-1">
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 sticky top-24">
            {/* Icône de l'app — placeholder ⚡ */}
            <div className="h-20 bg-gradient-to-br from-primary/20 to-transparent flex items-center justify-center rounded-xl mb-4 text-4xl">⚡</div>
            <h1 className="text-lg font-bold text-white mb-1">{app.title}</h1>
            <p className="text-xs text-gray-500 mb-4">{app.description}</p>
            {/* Tags de l'app */}
            <div className="flex flex-wrap gap-1 mb-4">
              {app.tags.map((t) => <Badge key={t} variant="ghost">{t}</Badge>)}
            </div>
            <div className="text-xs text-gray-600 mb-5">{app.school}</div>
            {/* Bouton ouvrir en plein écran (nouvel onglet) */}
            <a href={app.url} target="_blank" rel="noopener noreferrer"
              className="block w-full text-center bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors">
              Ouvrir en plein écran ↗
            </a>
          </div>
        </div>

        {/* ── Zone principale : iframe de l'app ── */}
        <div className="lg:col-span-3">
          <div className="bg-gray-900 border border-white/10 rounded-2xl overflow-hidden">
            {/* Barre de navigateur simulée (dots + URL) */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
              {/* Boutons fenêtre macOS-style */}
              <div className="flex gap-1.5">
                <span className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span className="w-3 h-3 bg-green-500 rounded-full" />
              </div>
              {/* URL de l'app dans la barre d'adresse */}
              <span className="text-xs text-gray-500 flex-1 text-center truncate">{app.url}</span>
            </div>
            {/* Iframe embarquant l'app avec sandbox sécurisé */}
            <iframe
              src={app.url}
              title={app.title}
              className="w-full"
              style={{ height: "75vh" }}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
