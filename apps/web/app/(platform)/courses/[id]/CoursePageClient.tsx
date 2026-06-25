"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import type { CourseResponse, CourseBlockResponse } from "@/lib/api";

type QuizState = { selected: number | null; revealed: boolean };

// ── Block content helpers ─────────────────────────────────────────────────────

function getStr(content: Record<string, unknown>, key: string): string {
  return typeof content[key] === "string" ? (content[key] as string) : "";
}

function getNum(content: Record<string, unknown>, key: string, fallback = 0): number {
  return typeof content[key] === "number" ? (content[key] as number) : fallback;
}

function getStrArr(content: Record<string, unknown>, key: string): string[] {
  return Array.isArray(content[key]) ? (content[key] as string[]) : [];
}

// ── Level label (API → French) ────────────────────────────────────────────────
function levelLabel(level: string) {
  return level === "beginner" ? "Débutant" : level === "advanced" ? "Avancé" : "Intermédiaire";
}

function levelVariant(level: string): "success" | "danger" | "warning" {
  return level === "beginner" ? "success" : level === "advanced" ? "danger" : "warning";
}

// ── Duration format ───────────────────────────────────────────────────────────
function fmtDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h${m > 0 ? `${m}min` : ""}` : `${m}min`;
}

// ── Démo : cours en dur (aucune base de données) ──────────────────────────────
function demoBlocks(courseId: string, title: string, desc: string): CourseBlockResponse[] {
  const raw: Array<{ type: string; content: Record<string, unknown> }> = [
    { type: "heading",  content: { content: "Introduction" } },
    { type: "text",     content: { content: `Bienvenue dans « ${title} ». ${desc} Ce module mêle théorie et pratique, avec des exercices à chaque étape.` } },
    { type: "heading",  content: { content: "Concepts clés" } },
    { type: "text",     content: { content: "Posons d'abord les fondations et le vocabulaire utilisés tout au long du cours." } },
    { type: "markdown", content: { content: "# Exemple rapide\nimport numpy as np\n\nX = np.array([1, 2, 3, 4])\nprint('moyenne =', X.mean())\nprint('ecart-type =', X.std())" } },
    { type: "quiz",     content: { question: "Quel est l'objectif principal de ce module ?", options: ["Mémoriser des formules par cœur", "Comprendre les concepts et savoir les appliquer", "Recopier du code sans le lire", "Aucun de ces objectifs"], answer: 1, explanation: "L'objectif est de comprendre les concepts et de les mettre en pratique." } },
    { type: "divider",  content: {} },
    { type: "text",     content: { content: "Une fois les exercices terminés, vous pourrez passer au module suivant du parcours." } },
  ];
  return raw.map((b, i) => ({ id: `${courseId}-b${i}`, course_id: courseId, position: i, type: b.type, content: b.content }));
}

function mkCourse(id: string, title: string, description: string, category: string,
                  level: string, school: string, minutes: number): CourseResponse {
  return {
    id, title, description, cover_url: null, category, tags: [category],
    level, school, status: "published", estimated_duration_minutes: minutes,
    created_by: "demo", created_at: "", updated_at: "",
    blocks: demoBlocks(id, title, description),
  };
}

/** Cours de démonstration affichés sans backend. Fallback sur "1" pour tout id inconnu. */
const DEMO_COURSES: Record<string, CourseResponse> = {
  "1": mkCourse("1", "Fondamentaux du ML", "Régression, classification et évaluation de modèles.", "IA & Data", "beginner", "Polytechnique", 180),
  "2": mkCourse("2", "Python pour la Data Science", "NumPy, Pandas, Matplotlib, Scikit-learn.", "Programmation", "beginner", "Télécom Paris", 240),
  "3": mkCourse("3", "Réseaux de neurones profonds", "Architectures CNN, RNN et Transformer.", "IA & Data", "advanced", "Polytechnique", 360),
};

// ── Main component ────────────────────────────────────────────────────────────

export function CoursePageClient({ id }: { id: string }) {
  // Cours affiché en dur — aucun appel API/base de données.
  const course = DEMO_COURSES[id] ?? DEMO_COURSES["1"];
  const [completed,  setCompleted]  = useState<Set<string>>(new Set());
  const [quizStates, setQuizStates] = useState<Record<string, QuizState>>({});

  const interactiveBlocks = course.blocks.filter(b => b.type !== "divider");
  const progress = interactiveBlocks.length > 0
    ? Math.round((completed.size / interactiveBlocks.length) * 100)
    : 0;

  function markDone(blockId: string) {
    setCompleted(s => new Set([...s, blockId]));
  }

  function selectQuiz(blockId: string, index: number) {
    setQuizStates(s => ({ ...s, [blockId]: { selected: index, revealed: true } }));
    markDone(blockId);
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 bg-navy min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* ── Sidebar ── */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <div className="sticky top-24 bg-gray-900 border border-white/10 rounded-2xl p-5 space-y-4">
            <Link href="/learning-ai/courses" className="text-xs text-gray-500 hover:text-white transition-colors">
              ← Catalogue
            </Link>
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-white">Progression</p>
                <span className="text-xs text-gray-500">{progress}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div className="space-y-1 text-xs text-gray-500">
              <p>📖 {course.blocks.length} bloc{course.blocks.length !== 1 ? "s" : ""}</p>
              <p>⏱ {fmtDuration(course.estimated_duration_minutes)}</p>
              {course.school && <p>🏫 {course.school}</p>}
            </div>
            {progress === 100 && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl p-3 text-center">
                ✓ Cours terminé !<br />Attestation disponible
              </div>
            )}
            <div className="flex flex-wrap gap-1">
              {course.category && <Badge variant="primary" size="sm">{course.category}</Badge>}
              <Badge variant={levelVariant(course.level)} size="sm">{levelLabel(course.level)}</Badge>
            </div>
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="lg:col-span-3 order-1 lg:order-2 space-y-4">
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-white mb-2">{course.title}</h1>
            {course.description && <p className="text-gray-400 text-sm">{course.description}</p>}
          </div>

          {course.blocks.length === 0 ? (
            <div className="bg-gray-900 border border-white/10 rounded-xl p-8 text-center text-gray-500 text-sm">
              Le contenu de ce cours est en cours de rédaction.
            </div>
          ) : (
            course.blocks
              .sort((a, b) => a.position - b.position)
              .map((block) => (
                <Block
                  key={block.id}
                  block={block}
                  completed={completed.has(block.id)}
                  quizState={quizStates[block.id]}
                  onMarkDone={() => markDone(block.id)}
                  onSelectQuiz={(i) => selectQuiz(block.id, i)}
                />
              ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Block renderer ────────────────────────────────────────────────────────────

function Block({ block, completed, quizState, onMarkDone, onSelectQuiz }: {
  block: CourseBlockResponse;
  completed: boolean;
  quizState?: QuizState;
  onMarkDone: () => void;
  onSelectQuiz: (i: number) => void;
}) {
  const c = block.content as Record<string, unknown>;

  if (block.type === "divider") return <hr className="border-white/10 my-2" />;

  return (
    <div className={`bg-gray-900 border rounded-xl p-5 transition-all ${
      completed ? "border-primary/30" : "border-white/10"
    }`}>
      {block.type === "heading" && (
        <h2 className="text-xl font-bold text-white">{getStr(c, "content") || getStr(c, "text")}</h2>
      )}

      {block.type === "text" && (
        <div>
          <p className="text-gray-300 leading-relaxed text-sm">{getStr(c, "content") || getStr(c, "text")}</p>
          {!completed
            ? <button onClick={onMarkDone} className="mt-3 text-xs text-gray-500 hover:text-primary transition-colors">Marquer comme lu ✓</button>
            : <span className="mt-2 inline-block text-xs text-primary">✓ Lu</span>}
        </div>
      )}

      {block.type === "markdown" && (
        <div>
          <pre className="bg-gray-950 border border-white/10 text-emerald-400 rounded-xl p-4 text-sm overflow-x-auto font-mono whitespace-pre">
            {getStr(c, "content") || getStr(c, "text")}
          </pre>
          {!completed
            ? <button onClick={onMarkDone} className="mt-3 text-xs text-gray-500 hover:text-primary transition-colors">Marquer comme vu ✓</button>
            : <span className="mt-2 inline-block text-xs text-primary">✓ Vu</span>}
        </div>
      )}

      {block.type === "quiz" && (() => {
        const question    = getStr(c, "question");
        const options     = getStrArr(c, "options");
        const answer      = getNum(c, "answer");
        const explanation = getStr(c, "explanation");
        return (
          <div>
            <p className="font-semibold text-white mb-4 text-sm">❓ {question}</p>
            <div className="flex flex-col gap-2">
              {options.map((opt, i) => {
                const revealed   = quizState?.revealed;
                const isCorrect  = i === answer;
                const isSelected = quizState?.selected === i;
                return (
                  <button key={i}
                    onClick={() => !revealed && onSelectQuiz(i)}
                    className={`text-left px-4 py-2.5 rounded-xl border text-sm transition-all ${
                      !revealed       ? "border-white/10 text-gray-300 hover:border-primary hover:text-white" :
                      isCorrect       ? "border-emerald-500 bg-emerald-500/10 text-emerald-300" :
                      isSelected      ? "border-red-500 bg-red-500/10 text-red-300" :
                      "border-white/5 text-gray-600"
                    }`}>
                    <span className="font-mono text-xs mr-2 opacity-50">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                    {revealed && isCorrect  && <span className="ml-2">✓</span>}
                    {revealed && isSelected && !isCorrect && <span className="ml-2">✗</span>}
                  </button>
                );
              })}
            </div>
            {quizState?.revealed && (
              <div className="mt-3 bg-primary/10 border border-primary/20 rounded-xl p-3 text-xs text-gray-300">
                <span className="text-primary font-semibold">Explication : </span>{explanation}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
