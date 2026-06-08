/**
 * @file (platform)/learning-with-ai/courses/page.tsx
 * @description Page Cours de la section "Learning With AI" — "/learning-with-ai/courses".
 *
 * Délègue entièrement le rendu au composant `SectionCatalogue` avec :
 *   - `section.label` = "Learning With AI"
 *   - `section.slug`  = "learning-with-ai"
 *   - `section.description` = "Apprendre en utilisant l'IA comme outil"
 *   - `section.color` = "primary"
 *   - `activeModule` = "courses" (onglet Cours actif par défaut)
 */

import { SectionCatalogue } from "@/components/platform/SectionCatalogue";

/** Page Cours de la section Learning With AI. */
export default function Page() {
  return (
    <SectionCatalogue
      section={{ label: "Learning With AI", slug: "learning-with-ai", description: "Apprendre en utilisant l'IA comme outil", color: "primary" }}
      activeModule="courses"
    />
  );
}
