/**
 * @file (platform)/learning-edge-ai/moocs/page.tsx
 * @description Page MOOCs de la section "Learning at the Edge of AI" — "/learning-edge-ai/moocs".
 *
 * Délègue entièrement le rendu au composant `SectionCatalogue` avec :
 *   - `section.label` = "Learning at the Edge of AI"
 *   - `section.slug`  = "learning-edge-ai"
 *   - `section.description` = "Frontières et enjeux de l'IA"
 *   - `section.color` = "primary"
 *   - `activeModule` = "moocs" (onglet MOOCs actif par défaut)
 */

import { SectionCatalogue } from "@/components/platform/SectionCatalogue";

/** Page MOOCs de la section Learning at the Edge of AI. */
export default function Page() {
  return (
    <SectionCatalogue
      section={{ label: "Learning at the Edge of AI", slug: "learning-edge-ai", description: "Frontières et enjeux de l'IA", color: "primary" }}
      activeModule="moocs"
    />
  );
}
