/**
 * @file (platform)/learning-edge-ai/courses/page.tsx
 * @description Page Cours de la section "Learning at the Edge of AI" — "/learning-edge-ai/courses".
 *
 * Délègue entièrement le rendu au composant `SectionCatalogue` avec :
 *   - `section.label` = "Learning at the Edge of AI"
 *   - `section.slug`  = "learning-edge-ai"
 *   - `section.description` = "Frontières et enjeux de l'IA"
 *   - `section.color` = "primary"
 *   - `activeModule` = "courses" (onglet Cours actif par défaut)
 */

import { SectionCatalogue } from "@/components/platform/SectionCatalogue";

/** Page Cours de la section Learning at the Edge of AI. */
export default function Page() {
  return (
    <SectionCatalogue
      section={{ label: "Learning at the Edge of AI", slug: "learning-edge-ai", description: "Frontières et enjeux de l'IA", color: "primary" }}
      activeModule="courses"
    />
  );
}
