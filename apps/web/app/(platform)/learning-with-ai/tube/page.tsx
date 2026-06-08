/**
 * @file (platform)/learning-with-ai/tube/page.tsx
 * @description Page Hi! Tube de la section "Learning With AI" — "/learning-with-ai/tube".
 *
 * Délègue entièrement le rendu au composant `SectionCatalogue` avec :
 *   - `section.label` = "Learning With AI"
 *   - `section.slug`  = "learning-with-ai"
 *   - `section.description` = "Apprendre en utilisant l'IA comme outil"
 *   - `section.color` = "primary"
 *   - `activeModule` = "tube" (onglet Vidéos actif par défaut)
 */

import { SectionCatalogue } from "@/components/platform/SectionCatalogue";

/** Page Hi! Tube de la section Learning With AI. */
export default function Page() {
  return (
    <SectionCatalogue
      section={{ label: "Learning With AI", slug: "learning-with-ai", description: "Apprendre en utilisant l'IA comme outil", color: "primary" }}
      activeModule="tube"
    />
  );
}
