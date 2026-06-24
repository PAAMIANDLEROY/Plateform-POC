/**
 * @file (platform)/studio/excel-quiz/page.tsx
 * @description Pipeline IA "Excel → Quiz" dans Hi! Studio — "/studio/excel-quiz".
 *
 * Flux en 4 étapes (`Step`) :
 *   1. `upload`     : zone de drop d'un fichier .xlsx/.xls + configuration du quiz.
 *   2. `generating` : spinner + information sur le modèle utilisé.
 *   3. `preview`    : éditeur du quiz généré (`QuizEditor`) + sélection du cours cible.
 *   4. `published`  : confirmation avec options "Retour au Studio" / "Créer un autre".
 *
 * Appels API :
 *   - `POST /api/v1/studio/excel-to-quiz` (FormData) : génère le quiz depuis Excel.
 *   - `POST /api/v1/studio/save-quiz` (JSON) : publie le quiz édité.
 *
 * `QuizEditor` :
 *   Éditeur question par question avec :
 *   - `updateQuestion(idx, field, value)` : modifie un champ d'une question.
 *   - `updateOption(qIdx, oIdx, value)` : modifie le texte d'une option.
 *   - `removeQuestion(idx)` : supprime une question du tableau.
 *   - Bouton lettre (A/B/C/D) — cliquer marque cette option comme correcte.
 *   - Options : fond vert + bordure verte pour la bonne réponse.
 *
 * `StepBar` (identique à video-course/page.tsx) :
 *   Indicateur de progression. Étapes : Upload / Génération IA / Prévisualisation / Publication.
 *
 * Configuration du quiz :
 *   - `nQuestions` (1–20) via slider.
 *   - `difficulty` : facile / intermédiaire / avancé.
 *   - `language` : fr / en.
 *   - `quizTitle` : titre optionnel (généré automatiquement par le LLM si vide).
 *
 * Rattachement à un cours (étape 3) :
 *   `selectedCourse` : ID du cours cible ou "" pour quiz autonome.
 *   En production, la liste de cours viendrait de l'API.
 *
 * Gestion d'erreurs :
 *   Sur erreur API → revient à l'étape précédente avec message d'erreur.
 */

"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ApiError } from "@/lib/api";
import { Spinner } from "@/components/ui/Spinner";

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Question d'un quiz générée par le LLM.
 *
 * @property id          - ID unique (numérique, fourni par l'API).
 * @property question    - Texte de la question.
 * @property options     - Tableau des options de réponse.
 * @property correct     - Lettre de la bonne réponse ("A", "B", "C", etc.).
 * @property explanation - Explication de la réponse correcte.
 * @property difficulty  - Difficulté de la question.
 * @property source_row  - Ligne Excel source (optionnel, pour traçabilité).
 */
interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct: string;
  explanation: string;
  difficulty: string;
  source_row?: number;
}

/**
 * Quiz généré par le LLM.
 *
 * @property quiz_title  - Titre du quiz.
 * @property difficulty  - Difficulté globale.
 * @property language    - Langue ("fr" ou "en").
 * @property questions   - Tableau des questions.
 */
interface GeneratedQuiz {
  quiz_title: string;
  difficulty: string;
  language: string;
  questions: QuizQuestion[];
}

/** Étapes du pipeline de génération. */
type Step = "upload" | "generating" | "preview" | "published";

// ── Indicateur de progression ─────────────────────────────────────────────────

/** Labels des 4 étapes. */
const STEPS = ["Upload", "Génération IA", "Prévisualisation", "Publication"];

/**
 * Barre de progression à 4 étapes avec connecteurs.
 *
 * @property current - Index de l'étape courante (0–3).
 */
function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i < current ? "bg-primary text-white" :
              i === current ? "bg-primary text-white ring-4 ring-primary/20" :
              "bg-gray-800 text-gray-600"
            }`}>
              {i < current ? "✓" : i + 1}
            </div>
            <span className={`text-xs mt-1.5 whitespace-nowrap ${i === current ? "text-white font-semibold" : "text-gray-600"}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-px w-16 sm:w-24 mx-1 mb-5 transition-all ${i < current ? "bg-primary" : "bg-gray-800"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Éditeur de quiz ───────────────────────────────────────────────────────────

/**
 * Éditeur de quiz question par question.
 * Permet de modifier les questions, options, bonne réponse et explications.
 *
 * @property quiz     - Quiz actuel à éditer.
 * @property onChange - Callback appelé avec le quiz modifié.
 */
function QuizEditor({ quiz, onChange }: { quiz: GeneratedQuiz; onChange: (q: GeneratedQuiz) => void }) {
  /**
   * Met à jour un champ d'une question par son index.
   *
   * @param idx   - Index de la question dans le tableau.
   * @param field - Nom du champ à modifier.
   * @param value - Nouvelle valeur.
   */
  function updateQuestion(idx: number, field: keyof QuizQuestion, value: string) {
    const updated = { ...quiz, questions: quiz.questions.map((q, i) => i === idx ? { ...q, [field]: value } : q) };
    onChange(updated);
  }

  /**
   * Met à jour le texte d'une option d'une question.
   *
   * @param qIdx - Index de la question.
   * @param oIdx - Index de l'option.
   * @param value - Nouveau texte.
   */
  function updateOption(qIdx: number, oIdx: number, value: string) {
    const updated = { ...quiz, questions: quiz.questions.map((q, i) => {
      if (i !== qIdx) return q;
      const opts = [...q.options];
      opts[oIdx] = value;
      return { ...q, options: opts };
    })};
    onChange(updated);
  }

  /** Supprime une question par son index. */
  function removeQuestion(idx: number) {
    onChange({ ...quiz, questions: quiz.questions.filter((_, i) => i !== idx) });
  }

  /** Lettres correspondant aux indices d'options. */
  const LETTERS = ["A", "B", "C", "D", "E", "F"];

  return (
    <div className="space-y-5">
      {/* En-tête du quiz : titre éditable + métadonnées */}
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-5">
        <label className="block text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1.5">Titre du quiz</label>
        <input
          value={quiz.quiz_title}
          onChange={(e) => onChange({ ...quiz, quiz_title: e.target.value })}
          className="w-full text-lg font-bold text-white bg-transparent border-b border-white/10 focus:border-primary focus:outline-none pb-1 transition-colors"
        />
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <span>{quiz.questions.length} questions</span>
          <span>·</span>
          <span>Difficulté : {quiz.difficulty}</span>
          <span>·</span>
          <span>Langue : {quiz.language === "fr" ? "Français" : "Anglais"}</span>
        </div>
      </div>

      {/* Questions individuelles */}
      {quiz.questions.map((q, qIdx) => (
        <div key={q.id} className="bg-gray-900 border border-white/10 rounded-2xl p-5">
          <div className="flex items-start gap-3 mb-4">
            {/* Numéro de la question */}
            <span className="w-7 h-7 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              {qIdx + 1}
            </span>
            {/* Texte de la question éditable */}
            <textarea
              value={q.question}
              onChange={(e) => updateQuestion(qIdx, "question", e.target.value)}
              rows={2}
              className="flex-1 text-sm font-semibold text-white bg-gray-800 border border-white/10 rounded-xl px-3 py-2 focus:outline-none focus:border-primary/50 resize-none transition-colors"
            />
            {/* Bouton suppression de la question */}
            <button onClick={() => removeQuestion(qIdx)} className="text-gray-600 hover:text-danger transition-colors text-sm mt-1">✕</button>
          </div>

          {/* Options de réponse */}
          <div className="space-y-2 mb-4">
            {q.options.map((opt, oIdx) => {
              const letter = LETTERS[oIdx] ?? String(oIdx);
              const isCorrect = q.correct === letter;
              return (
                <div key={oIdx} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                  // Branche bonne réponse : bordure + fond vert
                  isCorrect ? "border-emerald-500/40 bg-emerald-500/5" : "border-white/5"
                }`}>
                  {/* Bouton lettre — marquer comme correcte au clic */}
                  <button
                    onClick={() => updateQuestion(qIdx, "correct", letter)}
                    className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                      isCorrect ? "bg-emerald-500 border-emerald-500 text-white" : "border-white/20 text-gray-600 hover:border-emerald-500/50"
                    }`}
                  >
                    {letter}
                  </button>
                  {/* Texte de l'option éditable */}
                  <input
                    value={opt}
                    onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                    className="flex-1 text-sm text-gray-300 bg-transparent focus:outline-none"
                  />
                  {isCorrect && <span className="text-xs text-emerald-400 shrink-0">✓ Correcte</span>}
                </div>
              );
            })}
          </div>

          {/* Explication de la bonne réponse */}
          <div>
            <label className="text-xs text-gray-600 uppercase tracking-wider font-semibold">Explication</label>
            <textarea
              value={q.explanation}
              onChange={(e) => updateQuestion(qIdx, "explanation", e.target.value)}
              rows={2}
              className="w-full mt-1.5 text-xs text-gray-400 bg-gray-800 border border-white/5 rounded-xl px-3 py-2 focus:outline-none resize-none"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────────────────

/**
 * Page du pipeline "Excel → Quiz".
 */
export default function ExcelQuizPage() {
  /** Étape courante du pipeline. */
  const [step, setStep] = useState<Step>("upload");
  /** Fichier Excel uploadé. */
  const [file, setFile] = useState<File | null>(null);
  /** Nombre de questions à générer (1–20). */
  const [nQuestions, setNQuestions] = useState(5);
  /** Difficulté demandée au LLM. */
  const [difficulty, setDifficulty] = useState("intermédiaire");
  /** Langue du quiz. */
  const [language, setLanguage] = useState("fr");
  /** Titre optionnel (le LLM en génère un si vide). */
  const [quizTitle, setQuizTitle] = useState("");
  /** Quiz généré par l'API (null avant génération). */
  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null);
  /** Message d'erreur API (vide si aucune erreur). */
  const [error, setError] = useState("");
  /** ID du cours cible ("" = quiz autonome). */
  const [selectedCourse, setSelectedCourse] = useState("");
  /** Ref pour l'input file (déclenchement programmatique). */
  const fileRef = useRef<HTMLInputElement>(null);

  /** Mapping étape → index pour `StepBar`. */
  const stepIndex = { upload: 0, generating: 1, preview: 2, published: 3 }[step];

  /**
   * Lance la génération du quiz via l'API.
   * En cas d'erreur : revient à "upload" avec message d'erreur.
   */
  async function generate() {
    // Guard : pas de fichier sélectionné
    if (!file) return;
    setError("");
    setStep("generating");

    const form = new FormData();
    form.append("file", file);
    form.append("n_questions", String(nQuestions));
    form.append("difficulty", difficulty);
    form.append("language", language);
    if (quizTitle) form.append("quiz_title", quizTitle);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/studio/excel-to-quiz`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: "Erreur serveur" }));
        throw new Error(body.detail ?? "Erreur lors de la génération");
      }
      const data: GeneratedQuiz = await res.json();
      setQuiz(data);
      setStep("preview");
    } catch (err: unknown) {
      // Branche erreur : retour à upload avec message
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      setStep("upload");
    }
  }

  /**
   * Publie le quiz édité via l'API.
   * Passe à l'étape "published" si succès.
   */
  async function publish() {
    if (!quiz) return;
    setError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/studio/save-quiz`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // Branche course_id vide : "standalone" (quiz autonome)
            course_id: selectedCourse || "standalone",
            quiz,
          }),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: "Erreur serveur" }));
        throw new Error(body.detail ?? "Erreur lors de la publication");
      }
      setStep("published");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue lors de la publication");
    }
  }

  return (
    <div className="bg-navy min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/studio" className="text-gray-500 hover:text-white transition-colors text-sm">← Studio</Link>
        <span className="text-gray-700">/</span>
        <h1 className="text-xl font-bold text-white">Excel → Quiz</h1>
        <span className="text-xs bg-primary/15 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-medium">IA</span>
      </div>

      <StepBar current={stepIndex} />

      {/* ── Étape 1 : Upload ── */}
      {step === "upload" && (
        <div className="space-y-6">
          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* Zone de drop / click pour sélectionner le fichier Excel */}
          <div
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
              // Branche fichier chargé : bordure + fond primary léger
              file ? "border-primary/50 bg-primary/5"
              : "border-white/10 hover:border-white/25 hover:bg-white/5"
            }`}
          >
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <div className="text-4xl mb-3">{file ? "📊" : "📂"}</div>
            {/* Branche fichier présent : afficher nom + taille */}
            {file ? (
              <>
                <p className="text-sm font-semibold text-white">{file.name}</p>
                <p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB · Cliquez pour changer</p>
              </>
            ) : (
              // Branche pas de fichier : instructions
              <>
                <p className="text-sm font-semibold text-white mb-1">Déposez votre fichier Excel</p>
                <p className="text-xs text-gray-500">Format .xlsx ou .xls · 10 MB max</p>
                <p className="text-xs text-gray-600 mt-3">Colonnes : question, options, réponse, données brutes — le LLM s'adapte à votre format</p>
              </>
            )}
          </div>

          {/* Configuration du quiz */}
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 space-y-4">
            <p className="text-sm font-semibold text-white mb-3">Configuration du quiz</p>
            <div className="grid grid-cols-2 gap-4">
              {/* Slider nombre de questions */}
              <div>
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1.5">Nombre de questions</label>
                <div className="flex items-center gap-2">
                  <input type="range" min={1} max={20} value={nQuestions} onChange={(e) => setNQuestions(Number(e.target.value))}
                    className="flex-1 accent-primary" />
                  <span className="text-sm font-bold text-white w-6 text-center">{nQuestions}</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1.5">Difficulté</label>
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-gray-800 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-primary/50">
                  <option value="facile">Facile</option>
                  <option value="intermédiaire">Intermédiaire</option>
                  <option value="avancé">Avancé</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1.5">Langue</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-gray-800 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-primary/50">
                  <option value="fr">Français</option>
                  <option value="en">Anglais</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1.5">Titre du quiz (optionnel)</label>
                <input value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="Généré automatiquement"
                  className="w-full bg-gray-800 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-primary/50 placeholder-gray-600" />
              </div>
            </div>
          </div>

          {/* Bouton générer — désactivé si pas de fichier */}
          <button
            onClick={generate}
            disabled={!file}
            className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
          >
            ✨ Générer le quiz avec l'IA
          </button>
        </div>
      )}

      {/* ── Étape 2 : Génération IA ── */}
      {step === "generating" && (
        <div className="flex flex-col items-center justify-center py-24 gap-6">
          <Spinner size="lg" />
          <div className="text-center">
            <p className="text-lg font-bold text-white mb-1">Génération en cours…</p>
            <p className="text-sm text-gray-500">Claude analyse votre fichier et génère {nQuestions} questions</p>
          </div>
          <div className="text-xs text-gray-700 bg-gray-900 border border-white/5 rounded-xl px-4 py-3 text-center max-w-sm">
            Modèle : <span className="text-gray-400">claude-sonnet-4-6</span> · Durée estimée : 10–30 secondes
          </div>
        </div>
      )}

      {/* ── Étape 3 : Prévisualisation et édition ── */}
      {step === "preview" && quiz && (
        <div className="space-y-6">
          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">{quiz.questions.length} questions générées — éditez avant de publier</p>
            <button onClick={() => setStep("upload")} className="text-xs text-gray-500 hover:text-white transition-colors">
              ← Recommencer
            </button>
          </div>

          <QuizEditor quiz={quiz} onChange={setQuiz} />

          {/* Rattachement optionnel à un cours existant */}
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-5">
            <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-2">
              Rattacher à un cours (optionnel)
            </label>
            <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full bg-gray-800 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-primary/50">
              <option value="">— Publier comme quiz autonome —</option>
              {/* Cours disponibles — hardcodés dans le MVP */}
              <option value="1">Fondamentaux du ML</option>
              <option value="2">Python pour la Data Science</option>
              <option value="3">Réseaux de neurones profonds</option>
            </select>
          </div>

          <button
            onClick={publish}
            className="w-full bg-danger text-white py-3 rounded-xl font-semibold text-sm hover:bg-danger-dark transition-colors shadow-lg shadow-danger/20"
          >
            Publier le quiz →
          </button>
        </div>
      )}

      {/* ── Étape 4 : Quiz publié ── */}
      {step === "published" && quiz && (
        <div className="flex flex-col items-center text-center py-16 gap-6">
          <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-3xl">✓</div>
          <div>
            <h2 className="text-2xl font-extrabold text-white mb-2">Quiz publié !</h2>
            <p className="text-gray-400 text-sm">
              <strong className="text-white">{quiz.quiz_title}</strong> — {quiz.questions.length} questions disponibles
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/studio" className="border border-white/10 text-gray-300 px-5 py-2.5 rounded-xl text-sm hover:bg-white/5 transition-colors">
              Retour au Studio
            </Link>
            {/* Réinitialise l'état pour créer un nouveau quiz */}
            <button onClick={() => { setStep("upload"); setFile(null); setQuiz(null); }}
              className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm hover:bg-primary-dark transition-colors">
              Créer un autre quiz
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
