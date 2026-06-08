/**
 * @file (platform)/learning-ai/tube/page.tsx
 * @description Page Hi! Tube de la section "Learning AI" — "/learning-ai/tube".
 *
 * Délègue entièrement le rendu au composant `SectionCatalogue` avec :
 *   - `section.label` = "Learning AI"
 *   - `section.slug`  = "learning-ai"
 *   - `section.description` = "Fondamentaux et recherche en IA"
 *   - `section.color` = "primary"
 *   - `activeModule` = "tube" (onglet Vidéos actif par défaut)
 *
 * Le composant serveur ne contient pas d'état — `SectionCatalogue` est un
 * composant client qui gère le filtrage et les onglets.
 */

import { SectionCatalogue } from "@/components/platform/SectionCatalogue";

/** Page Hi! Tube de la section Learning AI. */
export default function Page() {
  return (
    <SectionCatalogue
      section={{ label: "Learning AI", slug: "learning-ai", description: "Fondamentaux et recherche en IA", color: "primary" }}
      activeModule="tube"
    />
  );
}
