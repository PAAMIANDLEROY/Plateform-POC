/**
 * @file (platform)/moocs/[id]/page.tsx
 * @description Page de lecture d'un parcours MOOC "/moocs/[id]".
 *
 * Composant serveur (SSG) :
 *   `generateStaticParams()` pré-génère les routes pour tous les MOOCs connus.
 *   Compatible avec `output: "export"`.
 *   Fallback : si l'ID n'existe pas, affiche le premier MOOC (`MOCK_MOOCS[0]`).
 *
 * Délégation au composant client :
 *   `MOOCPageClient` gère l'état d'inscription, l'ouverture/fermeture des modules
 *   (accordéon) et le rendu des cours assignés à chaque module.
 *
 * @param params - Route params Next.js — `id` est l'identifiant du MOOC.
 */

import { MOCK_MOOCS } from "@/lib/mock";
import { MOOCPageClient } from "./MOOCPageClient";

/**
 * Génère les paramètres statiques pour toutes les routes `/moocs/[id]`.
 *
 * @returns Tableau de `{ id }` pour chaque MOOC dans `MOCK_MOOCS`.
 */
export function generateStaticParams() {
  return MOCK_MOOCS.map((m) => ({ id: m.id }));
}

/**
 * Page de lecture d'un parcours MOOC.
 *
 * @param params - Contient `id` — identifiant du MOOC dans `MOCK_MOOCS`.
 */
export default function MOOCPage({ params }: { params: { id: string } }) {
  /**
   * Recherche le MOOC par ID.
   * Fallback sur le premier MOOC si l'ID n'est pas trouvé.
   */
  const mooc = MOCK_MOOCS.find((m) => m.id === params.id) ?? MOCK_MOOCS[0];
  return <MOOCPageClient mooc={mooc} />;
}
