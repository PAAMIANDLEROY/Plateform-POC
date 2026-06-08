/**
 * @file (platform)/learning-edge-ai/apps/page.tsx
 * @description Page Applications de la section "Learning at the Edge of AI" — "/learning-edge-ai/apps".
 *
 * Délègue entièrement le rendu au composant `SectionCatalogue` avec :
 *   - `section.label` = "Learning at the Edge of AI"
 *   - `section.slug`  = "learning-edge-ai"
 *   - `section.description` = "Frontières et enjeux de l'IA"
 *   - `section.color` = "primary"
 *   - `activeModule` = "apps" (onglet Applications actif par défaut)
 */

import { SectionCatalogue } from "@/components/platform/SectionCatalogue";

/** Page Applications de la section Learning at the Edge of AI. */
export default function Page() {
  return (
    <SectionCatalogue
      section={{ label: "Learning at the Edge of AI", slug: "learning-edge-ai", description: "Frontières et enjeux de l'IA", color: "primary" }}
      activeModule="apps"
    />
  );
}
