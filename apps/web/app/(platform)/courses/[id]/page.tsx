/**
 * @file (platform)/courses/[id]/page.tsx
 * @description Page de lecture d'un cours Hi! Course "/courses/[id]".
 *
 * Composant serveur (SSG) :
 *   `generateStaticParams()` pré-génère les routes pour tous les cours connus.
 *   Compatible avec `output: "export"`.
 *   Fallback : si l'ID n'existe pas, affiche le premier cours (`MOCK_COURSES[0]`).
 *
 * Délégation au composant client :
 *   `CoursePageClient` gère la progression interactive, les quiz et le marking
 *   de blocs comme lus — incompatibles avec le SSG pur.
 *
 * @param params - Route params Next.js — `id` est l'identifiant du cours.
 */

import { MOCK_COURSES } from "@/lib/mock";
import { CoursePageClient } from "./CoursePageClient";

/**
 * Génère les paramètres statiques pour toutes les routes `/courses/[id]`.
 *
 * @returns Tableau de `{ id }` pour chaque cours dans `MOCK_COURSES`.
 */
export function generateStaticParams() {
  return MOCK_COURSES.map((c) => ({ id: c.id }));
}

/**
 * Page de lecture de cours.
 *
 * @param params - Contient `id` — identifiant du cours dans `MOCK_COURSES`.
 */
export default function CoursePage({ params }: { params: { id: string } }) {
  /**
   * Recherche le cours par ID.
   * Fallback sur le premier cours si l'ID n'est pas trouvé.
   */
  const course = MOCK_COURSES.find((c) => c.id === params.id) ?? MOCK_COURSES[0];
  return <CoursePageClient course={course} />;
}
