/**
 * @file (platform)/databootcamp/courses/page.tsx
 * @description Page « Liste des cours » du pilier Hi! Databootcamp.
 *
 * La liste des cours du bootcamp n'est pas encore rattachée (placeholder).
 * En attendant, la page présente une **démo du module de code exécutable**
 * (`RunnableCodeBlock`, Python dans le navigateur via Pyodide) afin de montrer
 * l'interactivité façon Google Colab prévue pour les cours.
 */

import Link from "next/link";
import { RunnableCodeBlock } from "@/components/platform/RunnableCodeBlock";

/** Extrait de code de démonstration proposé dans l'éditeur. */
const DEMO_CODE = `# Éditez ce code puis cliquez sur « Exécuter »
# Tout tourne dans votre navigateur — aucun serveur.

def fibonacci(n):
    a, b = 0, 1
    suite = []
    for _ in range(n):
        suite.append(a)
        a, b = b, a + b
    return suite

print("Suite de Fibonacci :", fibonacci(10))
`;

/**
 * Placeholder de la liste des cours du Data Bootcamp + démo du module exécutable.
 */
export default function DataBootcampCoursesPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
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
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4 bg-white border border-dashed border-gray-200 rounded-2xl mb-14">
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

      {/* Démo du module de code exécutable */}
      <section>
        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full mb-3">
            Aperçu · nouveauté
          </span>
          <h2 className="text-xl font-bold text-gray-900">Exécutez du Python dans votre navigateur</h2>
          <p className="text-sm text-gray-500 mt-1">
            Les futurs cours pourront intégrer des blocs de code exécutables, façon Google Colab —
            sans installation. Essayez ci-dessous : modifiez le code et cliquez sur « Exécuter ».
          </p>
        </div>
        <RunnableCodeBlock code={DEMO_CODE} />
      </section>
    </div>
  );
}
