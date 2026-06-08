/**
 * @file (platform)/lms/[id]/page.tsx
 * @description Page détail d'une cohorte — "/lms/[id]".
 *
 * Composant serveur (pas de `"use client"`) — génère les pages statiquement
 * au moment du build via `generateStaticParams()`.
 *
 * Stratégie SSG :
 *   - `generateStaticParams()` retourne un objet `{ id }` pour chaque cohorte de `MOCK_COHORTS`.
 *   - Le rendu trouve la cohorte par `params.id`; en cas d'ID inconnu (ex: deeplink direct),
 *     fallback sur `MOCK_COHORTS[0]`.
 *   - Filtre les étudiants `MOCK_STUDENTS` par `cohortId` correspondant.
 *   - Map les `assignedCourseIds` vers `{ id, title }` depuis `MOCK_COURSES`.
 *
 * Délégation :
 *   Tout l'UI est rendu par `<CohortDetail />` (composant client dans `CohortDetail.tsx`),
 *   ce qui permet de garder les filtres/recherches interactifs côté client
 *   tout en bénéficiant de la génération statique côté serveur.
 *
 * @see CohortDetail — composant client avec état filtre + recherche + export CSV.
 */

import { MOCK_COHORTS, MOCK_STUDENTS, MOCK_COURSES } from "@/lib/mock";
import { CohortDetail } from "./CohortDetail";

/**
 * Génère les paramètres statiques pour toutes les pages de cohorte.
 *
 * @returns Tableau d'objets `{ id }` — un par cohorte dans MOCK_COHORTS.
 */
export function generateStaticParams() {
  return MOCK_COHORTS.map((c) => ({ id: c.id }));
}

/**
 * Page de détail d'une cohorte.
 *
 * Prépare les données côté serveur avant de les passer à `CohortDetail` :
 *   - Trouve la cohorte par `params.id` (fallback : première cohorte).
 *   - Filtre les étudiants de cette cohorte.
 *   - Résout les `assignedCourseIds` → tableau `{ id, title }`.
 *
 * @param params - Paramètres dynamiques de la route Next.js.
 * @param params.id - Identifiant de la cohorte (ex : "1", "2").
 */
export default function CohortPage({ params }: { params: { id: string } }) {
  // Branche ID inconnu : fallback sur la première cohorte
  const cohort = MOCK_COHORTS.find((c) => c.id === params.id) ?? MOCK_COHORTS[0];
  /** Étudiants inscrits dans cette cohorte uniquement. */
  const students = MOCK_STUDENTS.filter((s) => s.cohortId === cohort.id);
  /** Cours assignés à cette cohorte, sous forme `{ id, title }` (sans les autres champs de MOCK_COURSES). */
  const assignedCourses = MOCK_COURSES.filter((c) =>
    cohort.assignedCourseIds.includes(c.id)
  ).map((c) => ({ id: c.id, title: c.title }));

  return <CohortDetail cohort={cohort} students={students} assignedCourses={assignedCourses} />;
}
