/**
 * @file (platform)/learning-ai/apps/page.tsx
 * @description Page Applications de la section "Learning AI" — "/learning-ai/apps".
 *
 * Délègue entièrement le rendu au composant `SectionCatalogue` avec :
 *   - `section.label` = "Learning AI"
 *   - `section.slug`  = "learning-ai"
 *   - `section.description` = "Fondamentaux et recherche en IA"
 *   - `section.color` = "primary"
 *   - `activeModule` = "apps" (onglet Applications actif par défaut)
 */

import { SectionCatalogue } from "@/components/platform/SectionCatalogue";

/** Page Applications de la section Learning AI. */
export default function Page() {
  return (
    <SectionCatalogue
      section={{ label: "Learning AI", slug: "learning-ai", description: "Fondamentaux et recherche en IA", color: "primary" }}
      activeModule="apps"
    />
  );
}
