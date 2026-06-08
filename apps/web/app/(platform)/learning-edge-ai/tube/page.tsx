/**
 * @file (platform)/learning-edge-ai/tube/page.tsx
 * @description Page Hi! Tube de la section "Learning at the Edge of AI" — "/learning-edge-ai/tube".
 *
 * Délègue entièrement le rendu au composant `SectionCatalogue` avec :
 *   - `section.label` = "Learning at the Edge of AI"
 *   - `section.slug`  = "learning-edge-ai"
 *   - `section.description` = "Frontières et enjeux de l'IA"
 *   - `section.color` = "primary"
 *   - `activeModule` = "tube" (onglet Vidéos actif par défaut)
 */

import { SectionCatalogue } from "@/components/platform/SectionCatalogue";

/** Page Hi! Tube de la section Learning at the Edge of AI. */
export default function Page() {
  return (
    <SectionCatalogue
      section={{ label: "Learning at the Edge of AI", slug: "learning-edge-ai", description: "Frontières et enjeux de l'IA", color: "primary" }}
      activeModule="tube"
    />
  );
}
