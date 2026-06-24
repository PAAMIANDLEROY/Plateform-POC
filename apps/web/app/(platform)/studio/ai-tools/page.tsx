/**
 * @file (platform)/studio/ai-tools/page.tsx
 * @description Studio IA — outils dérivés d'un contenu de cours (Phase 11).
 *
 * Une seule page, 4 générateurs branchés sur le backend (couche LLM-agnostique) :
 *   - Flashcards        → POST /api/v1/studio/flashcards
 *   - Carte mentale     → POST /api/v1/studio/mindmap
 *   - Fiche de révision → POST /api/v1/studio/study-sheet
 *   - FAQ               → POST /api/v1/studio/faq
 *
 * L'enseignant colle le contenu d'un cours (markdown/texte), choisit un outil,
 * et obtient un résultat structuré. Sans clé LLM configurée côté backend, l'API
 * renvoie un contenu de démonstration (le flux fonctionne quand même).
 *
 * Thème sombre (bg-navy) — cohérent avec les autres sous-pages Studio IA
 * (excel-quiz, video-course).
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { Spinner } from "@/components/ui/Spinner";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Outil de génération sélectionné. */
type Tool = "flashcards" | "mindmap" | "study-sheet" | "faq";

interface Flashcard { id: number; front: string; back: string }
interface FlashcardsResult { title: string; language: string; cards: Flashcard[] }

interface MindNode { label: string; children: MindNode[] }
interface MindMapResult { title: string; root: MindNode }

interface KeyConcept { term: string; definition: string }
interface StudySheetResult { title: string; language: string; summary: string; key_concepts: KeyConcept[]; key_points: string[] }

interface FaqItem { question: string; answer: string }
interface FaqResult { title: string; language: string; items: FaqItem[] }

type Result = FlashcardsResult | MindMapResult | StudySheetResult | FaqResult;

/** Métadonnées d'affichage de chaque outil. */
const TOOLS: { key: Tool; icon: string; label: string; desc: string; endpoint: string }[] = [
  { key: "flashcards",  icon: "🃏", label: "Flashcards",        desc: "Cartes recto/verso de révision",        endpoint: "flashcards" },
  { key: "mindmap",     icon: "🧠", label: "Carte mentale",     desc: "Arborescence des concepts",             endpoint: "mindmap" },
  { key: "study-sheet", icon: "📝", label: "Fiche de révision", desc: "Résumé + concepts clés + points clés",  endpoint: "study-sheet" },
  { key: "faq",         icon: "❓", label: "FAQ",               desc: "Questions/réponses anticipées",         endpoint: "faq" },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Rendu d'un nœud de carte mentale (récursif) ───────────────────────────────

function MindBranch({ node, depth = 0 }: { node: MindNode; depth?: number }) {
  return (
    <li className="my-1">
      <span className={`inline-block rounded-lg px-3 py-1 text-sm ${
        depth === 0 ? "bg-primary text-white font-bold"
        : depth === 1 ? "bg-primary/20 text-primary-light font-semibold border border-primary/30"
        : "bg-gray-800 text-gray-300 border border-white/10"
      }`}>
        {node.label}
      </span>
      {node.children && node.children.length > 0 && (
        <ul className="ml-6 mt-1 border-l border-white/10 pl-4">
          {node.children.map((child, i) => (
            <MindBranch key={i} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

// ── Rendu du résultat selon l'outil ───────────────────────────────────────────

function ResultView({ tool, result }: { tool: Tool; result: Result }) {
  if (tool === "flashcards") {
    const r = result as FlashcardsResult;
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {r.cards.map((c) => (
          <div key={c.id} className="bg-gray-900 border border-white/10 rounded-2xl p-5">
            <p className="text-sm font-bold text-white mb-2">{c.front}</p>
            <p className="text-sm text-gray-400 border-t border-white/10 pt-2">{c.back}</p>
          </div>
        ))}
      </div>
    );
  }

  if (tool === "mindmap") {
    const r = result as MindMapResult;
    return (
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 overflow-x-auto">
        <ul>
          <MindBranch node={r.root} />
        </ul>
      </div>
    );
  }

  if (tool === "study-sheet") {
    const r = result as StudySheetResult;
    return (
      <div className="space-y-5">
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Résumé</h3>
          <p className="text-sm text-gray-300 leading-relaxed">{r.summary}</p>
        </div>
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Concepts clés</h3>
          <dl className="space-y-3">
            {r.key_concepts.map((kc, i) => (
              <div key={i}>
                <dt className="text-sm font-bold text-white">{kc.term}</dt>
                <dd className="text-sm text-gray-400">{kc.definition}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">À retenir</h3>
          <ul className="space-y-2">
            {r.key_points.map((p, i) => (
              <li key={i} className="text-sm text-gray-300 flex gap-2">
                <span className="text-primary-light shrink-0">•</span>{p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // faq
  const r = result as FaqResult;
  return (
    <div className="space-y-3">
      {r.items.map((it, i) => (
        <div key={i} className="bg-gray-900 border border-white/10 rounded-2xl p-5">
          <p className="text-sm font-bold text-white mb-1.5">{it.question}</p>
          <p className="text-sm text-gray-400">{it.answer}</p>
        </div>
      ))}
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────────────────

export default function AIToolsPage() {
  const [tool, setTool] = useState<Tool>("flashcards");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("fr");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [resultTool, setResultTool] = useState<Tool>("flashcards");

  const active = TOOLS.find((t) => t.key === tool)!;

  /** Lance la génération via l'endpoint correspondant à l'outil choisi. */
  async function generate() {
    if (!content.trim()) return;
    setError("");
    setLoading(true);
    setResult(null);

    // Corps adapté : flashcards/faq acceptent un compteur, les autres non.
    const body: Record<string, unknown> = { content, language };
    if (tool === "flashcards") body.n_cards = 10;
    if (tool === "faq") body.n_items = 6;

    try {
      const res = await fetch(`${API_BASE}/api/v1/studio/${active.endpoint}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ detail: "Erreur serveur" }));
        throw new Error(errBody.detail ?? "Erreur lors de la génération");
      }
      const data: Result = await res.json();
      setResult(data);
      setResultTool(tool);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-navy min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/studio" className="text-gray-500 hover:text-white transition-colors text-sm">← Studio</Link>
          <span className="text-gray-700">/</span>
          <h1 className="text-xl font-bold text-white">Outils IA</h1>
          <span className="text-xs bg-primary/15 text-primary-light border border-primary/20 px-2 py-0.5 rounded-full font-medium">Phase 11</span>
        </div>

        {/* Sélecteur d'outil */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {TOOLS.map((t) => (
            <button key={t.key} onClick={() => setTool(t.key)}
              className={`flex flex-col items-start gap-1 p-4 rounded-2xl border text-left transition-all ${
                tool === t.key
                  ? "bg-primary/15 border-primary/40"
                  : "bg-gray-900 border-white/10 hover:border-white/25"
              }`}
            >
              <span className="text-2xl">{t.icon}</span>
              <span className={`text-sm font-semibold ${tool === t.key ? "text-white" : "text-gray-300"}`}>{t.label}</span>
              <span className="text-xs text-gray-500 leading-tight">{t.desc}</span>
            </button>
          ))}
        </div>

        {/* Saisie du contenu */}
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contenu du cours</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}
              className="bg-gray-800 border border-white/10 text-white text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-primary/50">
              <option value="fr">Français</option>
              <option value="en">Anglais</option>
            </select>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            placeholder="Collez ici le contenu (markdown ou texte) d'un cours pour générer les ressources…"
            className="w-full text-sm text-gray-200 bg-gray-800 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 resize-none placeholder-gray-600 transition-colors"
          />
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-xl px-4 py-3 mb-5">
            {error}
          </div>
        )}

        {/* Bouton générer */}
        <button
          onClick={generate}
          disabled={!content.trim() || loading}
          className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary/20 mb-8"
        >
          {loading ? "Génération en cours…" : `✨ Générer — ${active.label}`}
        </button>

        {/* Résultat */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Spinner size="lg" />
            <p className="text-sm text-gray-500">L'IA génère votre contenu…</p>
          </div>
        )}

        {!loading && result && (
          <div>
            <h2 className="text-lg font-bold text-white mb-4">
              {TOOLS.find((t) => t.key === resultTool)?.label} — résultat
            </h2>
            <ResultView tool={resultTool} result={result} />
          </div>
        )}
      </div>
    </div>
  );
}
