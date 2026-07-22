/**
 * @file (platform)/databootcamp/courses/page.tsx
 * @description Page « Liste des cours » du pilier Hi! Databootcamp.
 *
 * Volontairement vide pour l'instant : placeholder en attendant que les cours du
 * bootcamp soient rattachés. Server Component statique, aucune donnée chargée.
 */

import Link from "next/link";

/**
 * Placeholder de la liste des cours du Data Bootcamp.
 */
export default function DataBootcampCoursesPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* En-tête de page */}
      <div className="mb-10">
        <nav className="text-sm text-gray-400 mb-2">
          <Link href="/databootcamp" className="hover:text-primary transition-colors">
            Hi! Databootcamp
          </Link>{" "}
          <span className="mx-1">/</span> Liste des cours
        </nav>
        <h1 className="text-3xl font-extrabold text-gray-900">Liste des cours</h1>
        <p className="text-gray-500 mt-1">Les cours du Data Bootcamp seront bientôt disponibles ici.</p>
      </div>

      {/* État vide */}
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4 bg-white border border-dashed border-gray-200 rounded-2xl">
        <span className="text-5xl">📚</span>
        <div>
          <p className="text-lg font-semibold text-gray-900">Aucun cours pour l'instant</p>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            Le contenu de cette page est en cours de préparation. Revenez prochainement.
          </p>
        </div>
        <Link
          href="/databootcamp"
          className="mt-2 text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
        >
          ← Retour à la présentation
        </Link>
      </div>
    </div>
  );
}
