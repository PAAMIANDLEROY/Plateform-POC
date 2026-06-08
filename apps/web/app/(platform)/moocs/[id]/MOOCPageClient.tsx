/**
 * @file (platform)/moocs/[id]/MOOCPageClient.tsx
 * @description Composant client de lecture d'un parcours MOOC Hi!.
 *
 * Séparé du composant serveur `page.tsx` pour gérer l'état d'inscription
 * et l'accordéon des modules.
 *
 * Structure du MOOC :
 *   3 modules statiques (`MODULES`) avec des IDs de cours assignés (`courseIds`).
 *   En production, les modules viendraient de l'API.
 *
 * Accordéon des modules :
 *   `open` : ID du module actuellement ouvert (`null` = tout fermé).
 *   Seul le module 1 (m1) est ouvert par défaut.
 *   Les modules 2+ sont verrouillés si l'utilisateur n'est pas inscrit (`!enrolled && idx > 0`).
 *
 * Inscription :
 *   `enrolled` : `false` → bouton "Commencer le parcours" → passe à `true`.
 *   Une fois inscrit, tous les modules sont débloqués.
 *   Pas d'appel API dans le MVP — état local seulement.
 *
 * Courses dans un module :
 *   Filtre `MOCK_COURSES` par `courseIds` du module.
 *   Convertit le niveau en anglais pour `CourseCard` :
 *   "Avance" → "advanced", "Intermediaire" → "intermediate", sinon "beginner".
 *
 * @property mooc - Données du MOOC (titre, description, école, nb cours, inscrits, statut).
 */

"use client";
import { useState } from "react";
import Link from "next/link";
import { MOCK_COURSES } from "@/lib/mock";
import { Badge } from "@/components/ui/Badge";
import { CourseCard } from "@/components/platform/CourseCard";

/** Données minimales d'un MOOC transmises par le composant serveur parent. */
type MockMOOC = {
  id: string; title: string; description: string;
  school: string; courses: number; enrolled: number; status: string;
};

/**
 * Modules du MOOC — statiques dans le MVP.
 * Chaque module référence des cours par ID depuis `MOCK_COURSES`.
 */
const MODULES = [
  { id: "m1", title: "Module 1 - Fondamentaux",        courseIds: ["1", "2"] },
  { id: "m2", title: "Module 2 - Approfondissement",    courseIds: ["3", "4"] },
  { id: "m3", title: "Module 3 - Mise en pratique",     courseIds: ["5", "6"] },
];

/**
 * Composant client de lecture de MOOC avec accordéon et gestion d'inscription.
 *
 * @param mooc - Données du MOOC à afficher.
 */
export function MOOCPageClient({ mooc }: { mooc: MockMOOC }) {
  /** `true` une fois que l'utilisateur a cliqué sur "Commencer le parcours". */
  const [enrolled, setEnrolled] = useState(false);

  /** ID du module actuellement ouvert dans l'accordéon. */
  const [open, setOpen] = useState<string | null>("m1");

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Hero du MOOC — gradient de fond primary */}
      <div className="bg-gradient-to-br from-primary/20 to-gray-900 border border-white/10 rounded-2xl p-8 mb-8">
        <Link href="/learning-ai/moocs" className="text-xs text-gray-500 hover:text-white mb-4 inline-block">
          Back to MOOCs
        </Link>
        <div className="flex items-start justify-between gap-6 flex-col sm:flex-row">
          <div className="flex-1">
            <div className="flex gap-2 mb-3">
              <Badge variant="primary">MOOC</Badge>
              <Badge variant="neutral">{mooc.school}</Badge>
            </div>
            <h1 className="text-3xl font-extrabold text-white mb-3">{mooc.title}</h1>
            <p className="text-gray-300 text-sm leading-relaxed mb-5">{mooc.description}</p>
            {/* Métadonnées : nb cours, nb modules, nb inscrits */}
            <div className="flex gap-5 text-sm text-gray-400 flex-wrap">
              <span>{mooc.courses} cours</span>
              <span>{MODULES.length} modules</span>
              <span>{mooc.enrolled.toLocaleString("fr-FR")} inscrits</span>
            </div>
          </div>
          {/* Bouton inscription — état toggle une fois inscrit */}
          <button
            onClick={() => setEnrolled(true)}
            className={"shrink-0 px-8 py-3 rounded-xl font-semibold text-sm transition-all " + (
              // Branche déjà inscrit : bouton vert désactivé
              enrolled ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 cursor-default"
              // Branche non inscrit : bouton primary interactif
              : "bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20"
            )}
          >
            {enrolled ? "Inscrit" : "Commencer le parcours"}
          </button>
        </div>
      </div>

      <h2 className="text-xl font-bold text-white mb-5">Plan du parcours</h2>
      <div className="space-y-3">
        {MODULES.map((mod, idx) => {
          const isOpen = open === mod.id;
          const courses = MOCK_COURSES.filter((c) => mod.courseIds.includes(c.id));
          /** Module verrouillé si pas inscrit ET pas le premier module. */
          const locked = !enrolled && idx > 0;

          return (
            <div key={mod.id} className={"border rounded-2xl overflow-hidden " + (
              // Branche verrouillé : bordure discrète + opacité réduite
              locked ? "border-white/5 opacity-60" : "border-white/10"
            )}>
              {/* En-tête du module — cliquable si non verrouillé */}
              <button
                onClick={() => !locked && setOpen(isOpen ? null : mod.id)}
                className="w-full flex items-center justify-between px-6 py-4 bg-gray-900 hover:bg-gray-800 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  {/* Numéro du module avec couleur selon état */}
                  <span className={"w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 " + (
                    locked ? "bg-gray-800 text-gray-600" : "bg-primary/20 text-primary"
                  )}>
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-white text-sm">{mod.title}</span>
                  <span className="text-xs text-gray-500">{mod.courseIds.length} cours</span>
                  {/* Badge "Inscrivez-vous" pour les modules verrouillés */}
                  {locked && <Badge variant="neutral" size="sm">Inscrivez-vous</Badge>}
                </div>
                {/* Chevron accordéon */}
                <span className="text-gray-500 text-sm">{isOpen ? "^" : "v"}</span>
              </button>

              {/* Contenu du module — visible si ouvert ET non verrouillé */}
              {isOpen && !locked && (
                <div className="p-4 bg-gray-950 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {courses.map((c) => (
                    <CourseCard
                      key={c.id} id={c.id} title={c.title} description={c.description}
                      category={c.category}
                      {/* Conversion du niveau français → anglais attendu par CourseCard */}
                      level={c.level === "Avance" ? "advanced" : c.level === "Intermediaire" ? "intermediate" : "beginner"}
                      school={c.school} estimated_duration_minutes={c.duration}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
