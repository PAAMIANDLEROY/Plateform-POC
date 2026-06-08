/**
 * @file (platform)/learning-ai/moocs/page.tsx
 * @description Page Catalogue MOOCs de la section "Learning AI" — "/learning-ai/moocs".
 *
 * Délègue entièrement le rendu au composant `SectionCatalogue` avec :
 *   - `section.label` = "Learning AI"
 *   - `section.slug`  = "learning-ai"
 *   - `section.description` = "Fondamentaux et recherche en IA"
 *   - `section.color` = "primary"
 *   - `activeModule` = "moocs" (onglet MOOCs actif par défaut)
 */

import { SectionCatalogue } from "@/components/platform/SectionCatalogue";

/** Page Catalogue MOOCs de la section Learning AI. */
export default function Page() {
  return (
    <SectionCatalogue
      section={{ label: "Learning AI", slug: "learning-ai", description: "Fondamentaux et recherche en IA", color: "primary" }}
      activeModule="moocs"
    />
  );
}
