/**
 * @file (platform)/courses/[id]/CoursePageClient.tsx
 * @description Composant client de lecture interactive d'un cours Hi! Course.
 *
 * Séparé du composant serveur `page.tsx` pour gérer le state interactif
 * (progression par bloc, états de quiz) sans bloquer le SSG.
 *
 * Layout 2 colonnes (lg:grid-cols-4) :
 *   - Sidebar sticky (1 colonne) : progression, métadonnées, badge niveau, attestation.
 *   - Contenu (3 colonnes) : titre + description + séquence de blocs.
 *
 * Progression :
 *   `completed` : `Set<string>` des IDs de blocs lus/répondus.
 *   `progress` = `Math.round((completed.size / nonDividerCount) * 100)`.
 *   Les blocs "divider" sont exclus du calcul (non-interactifs).
 *
 * Blocs de contenu :
 *   `MOCK_BLOCKS` — 9 blocs statiques (heading, text, markdown, quiz, divider).
 *   En production, ce tableau viendrait de l'API.
 *
 * Composant `Block` :
 *   - `heading`  : h2 sans interaction.
 *   - `text`     : paragraphe + bouton "Marquer comme lu ✓" → ajoute à `completed`.
 *   - `markdown` : code block + bouton "Marquer comme vu ✓".
 *   - `quiz`     : question + 4 options →  `selectQuiz(blockId, index)` révèle la réponse
 *                  et colore : vert (bonne) / rouge (mauvaise) / gris (non choisie).
 *   - `divider`  : `<hr>` simple sans interaction.
 *
 * Attestation de complétion :
 *   Affichée dans la sidebar uniquement quand `progress === 100`.
 *
 * @property course - Données du cours à afficher (titre, description, niveau, école, etc.).
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

/** Données minimales d'un cours transmises par le composant serveur parent. */
type MockCourse = {
  id: string; title: string; description: string; category: string;
  level: string; school: string; duration: number; blocks: number; status: string;
};

/**
 * État du quiz pour un bloc : option sélectionnée + si la réponse est révélée.
 *
 * @property selected - Index de l'option choisie par l'utilisateur, ou `null` si aucun choix.
 * @property revealed - `true` une fois que l'utilisateur a répondu (révèle correct/incorrect).
 */
type QuizState = { selected: number | null; revealed: boolean };

/**
 * Union discriminée des types de blocs de contenu d'un cours.
 * Chaque type a ses propres propriétés spécifiques.
 */
type BlockData =
  | { id: string; type: "heading"; content: string; level?: number }
  | { id: string; type: "text"; content: string }
  | { id: string; type: "markdown"; content: string }
  | { id: string; type: "quiz"; question: string; options: string[]; answer: number; explanation: string }
  | { id: string; type: "divider" };

/**
 * Blocs de contenu mock du cours.
 * En production, ces blocs viendraient de l'API `GET /api/v1/courses/{id}/blocks`.
 * Inclut 1 quiz sur Pandas et 1 quiz sur le tri rapide.
 */
const MOCK_BLOCKS: BlockData[] = [
  { id: "b1", type: "heading", content: "Introduction", level: 2 },
  { id: "b2", type: "text", content: "Ce cours couvre les concepts fondamentaux nécessaires pour comprendre ce domaine en profondeur. Vous apprendrez les bases théoriques et les applications pratiques à travers des exemples concrets et des exercices interactifs." },
  { id: "b3", type: "markdown", content: "```python\nimport numpy as np\nimport pandas as pd\n\n# Chargement des données\ndf = pd.read_csv('data.csv')\nprint(df.head())\nprint(df.describe())\n```" },
  { id: "b4", type: "quiz", question: "Quelle bibliothèque Python est utilisée pour la manipulation de données tabulaires ?", options: ["NumPy", "Pandas", "Matplotlib", "Scikit-learn"], answer: 1, explanation: "Pandas est la bibliothèque de référence pour manipuler des données tabulaires en Python." },
  { id: "b5", type: "heading", content: "Concepts avancés", level: 2 },
  { id: "b6", type: "text", content: "Dans cette section, nous approfondissons les notions vues précédemment avec des exemples concrets issus de la recherche et de l'industrie." },
  { id: "b7", type: "quiz", question: "Quelle est la complexité temporelle de l'algorithme de tri rapide en moyenne ?", options: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"], answer: 1, explanation: "Le tri rapide a une complexité moyenne de O(n log n), ce qui en fait l'un des algorithmes les plus efficaces en pratique." },
  { id: "b8", type: "divider" },
  { id: "b9", type: "text", content: "Félicitations ! Vous avez parcouru l'ensemble des blocs de ce cours." },
];

/**
 * Composant client de lecture de cours avec suivi de progression.
 *
 * @param course - Données du cours (titre, niveau, école, durée, etc.).
 */
export function CoursePageClient({ course }: { course: MockCourse }) {
  /** IDs des blocs marqués comme lus ou répondus. */
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  /** États des quiz par ID de bloc — `undefined` tant que non répondu. */
  const [quizStates, setQuizStates] = useState<Record<string, QuizState>>({});

  /**
   * Nombre de blocs interactifs (exclut les dividers).
   * Sert de dénominateur pour le calcul de la progression.
   */
  const nonDividerCount = MOCK_BLOCKS.filter((b) => b.type !== "divider").length;

  /** Progression globale en pourcentage (0–100). */
  const progress = Math.round((completed.size / nonDividerCount) * 100);

  /** Marque un bloc comme complété (ajout dans le Set immuable). */
  function markDone(blockId: string) {
    setCompleted((s) => new Set([...s, blockId]));
  }

  /**
   * Enregistre la réponse au quiz et marque le bloc comme complété.
   *
   * @param blockId - ID du bloc quiz.
   * @param index   - Index de l'option choisie par l'utilisateur.
   */
  function selectQuiz(blockId: string, index: number) {
    setQuizStates((s) => ({ ...s, [blockId]: { selected: index, revealed: true } }));
    markDone(blockId);
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* ── Sidebar sticky (order 2 sur mobile, order 1 sur desktop) ── */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <div className="sticky top-24 bg-gray-900 border border-white/10 rounded-2xl p-5 space-y-4">
            <Link href="/learning-ai/courses" className="text-xs text-gray-500 hover:text-white transition-colors">← Catalogue</Link>
            {/* Barre de progression */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-white">Progression</p>
                <span className="text-xs text-gray-500">{progress}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
            {/* Métadonnées : blocs, durée, école */}
            <div className="space-y-1 text-xs text-gray-500">
              <p>📖 {course.blocks} blocs</p>
              <p>⏱ {Math.floor(course.duration / 60)}h{course.duration % 60 > 0 ? `${course.duration % 60}min` : ""}</p>
              <p>🏫 {course.school}</p>
            </div>
            {/* Attestation de complétion — affiché uniquement quand progress === 100 */}
            {progress === 100 && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl p-3 text-center">
                ✓ Cours terminé !<br />Attestation disponible
              </div>
            )}
            {/* Badges catégorie + niveau */}
            <div className="flex flex-wrap gap-1">
              <Badge variant="primary" size="sm">{course.category}</Badge>
              {/* Couleur du badge selon le niveau */}
              <Badge variant={course.level === "Débutant" ? "success" : course.level === "Avancé" ? "danger" : "warning"} size="sm">
                {course.level}
              </Badge>
            </div>
          </div>
        </div>

        {/* ── Contenu principal (order 1 sur mobile, order 2 sur desktop) ── */}
        <div className="lg:col-span-3 order-1 lg:order-2 space-y-4">
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-white mb-2">{course.title}</h1>
            <p className="text-gray-400 text-sm">{course.description}</p>
          </div>
          {/* Séquence des blocs — le composant Block gère chaque type */}
          {MOCK_BLOCKS.map((block) => (
            <Block key={block.id} block={block}
              completed={completed.has(block.id)}
              quizState={quizStates[block.id]}
              onMarkDone={() => markDone(block.id)}
              onSelectQuiz={(i) => selectQuiz(block.id, i)} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Rendu d'un bloc de contenu de cours selon son type.
 * La bordure du bloc passe à `border-primary/30` une fois le bloc complété.
 *
 * @property block         - Données du bloc à rendre.
 * @property completed     - `true` si ce bloc a été marqué comme complété.
 * @property quizState     - État actuel du quiz (optionnel, défini seulement pour les quiz).
 * @property onMarkDone    - Callback appelé pour marquer le bloc comme lu/vu.
 * @property onSelectQuiz  - Callback appelé avec l'index de l'option choisie.
 */
function Block({ block, completed, quizState, onMarkDone, onSelectQuiz }: {
  block: BlockData; completed: boolean; quizState?: QuizState;
  onMarkDone: () => void; onSelectQuiz: (i: number) => void;
}) {
  // Branche divider : simple séparateur horizontal
  if (block.type === "divider") return <hr className="border-white/10 my-2" />;

  return (
    <div className={`bg-gray-900 border rounded-xl p-5 transition-all ${
      // Branche complété : bordure primary ; sinon bordure gris
      completed ? "border-primary/30" : "border-white/10"
    }`}>
      {/* Branche heading : titre h2 simple */}
      {block.type === "heading" && <h2 className="text-xl font-bold text-white">{block.content}</h2>}

      {/* Branche text : paragraphe + bouton "Marquer comme lu" */}
      {block.type === "text" && (
        <div>
          <p className="text-gray-300 leading-relaxed text-sm">{block.content}</p>
          {/* Bouton visible tant que non complété */}
          {!completed
            ? <button onClick={onMarkDone} className="mt-3 text-xs text-gray-500 hover:text-primary transition-colors">Marquer comme lu ✓</button>
            : <span className="mt-2 inline-block text-xs text-primary">✓ Lu</span>}
        </div>
      )}

      {/* Branche markdown : code block + bouton "Marquer comme vu" */}
      {block.type === "markdown" && (
        <div>
          <pre className="bg-gray-950 border border-white/10 text-emerald-400 rounded-xl p-4 text-sm overflow-x-auto font-mono whitespace-pre">{block.content}</pre>
          {!completed
            ? <button onClick={onMarkDone} className="mt-3 text-xs text-gray-500 hover:text-primary transition-colors">Marquer comme vu ✓</button>
            : <span className="mt-2 inline-block text-xs text-primary">✓ Vu</span>}
        </div>
      )}

      {/* Branche quiz : question + options colorées selon révélation */}
      {block.type === "quiz" && (
        <div>
          <p className="font-semibold text-white mb-4 text-sm">❓ {block.question}</p>
          <div className="flex flex-col gap-2">
            {block.options.map((opt, i) => {
              const revealed = quizState?.revealed;
              const isCorrect = i === block.answer;
              const isSelected = quizState?.selected === i;
              return (
                <button key={i}
                  // Désactiver les clics après révélation (réponse déjà donnée)
                  onClick={() => !revealed && onSelectQuiz(i)}
                  className={`text-left px-4 py-2.5 rounded-xl border text-sm transition-all ${
                    // Branche non révélée : hover primary
                    !revealed ? "border-white/10 text-gray-300 hover:border-primary hover:text-white" :
                    // Branche révélée + correcte : vert
                    isCorrect ? "border-emerald-500 bg-emerald-500/10 text-emerald-300" :
                    // Branche révélée + sélectionnée incorrecte : rouge
                    isSelected ? "border-red-500 bg-red-500/10 text-red-300" :
                    // Branche révélée + non sélectionnée : gris
                    "border-white/5 text-gray-600"
                  }`}>
                  {/* Lettre de l'option (A, B, C, D) */}
                  <span className="font-mono text-xs mr-2 opacity-50">{String.fromCharCode(65 + i)}.</span>
                  {opt}
                  {/* Indicateurs visuels après révélation */}
                  {revealed && isCorrect && <span className="ml-2">✓</span>}
                  {revealed && isSelected && !isCorrect && <span className="ml-2">✗</span>}
                </button>
              );
            })}
          </div>
          {/* Explication de la réponse — affichée seulement après réponse */}
          {quizState?.revealed && (
            <div className="mt-3 bg-primary/10 border border-primary/20 rounded-xl p-3 text-xs text-gray-300">
              <span className="text-primary font-semibold">Explication : </span>{block.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
