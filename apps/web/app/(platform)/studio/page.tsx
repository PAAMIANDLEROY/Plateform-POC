"use client";

import { useState } from "react";
import Link from "next/link";
import { MOCK_COURSES } from "@/lib/mock";

const BLOCK_TYPES = [
  { type: "heading", label: "Titre", icon: "H" },
  { type: "text", label: "Texte", icon: "¶" },
  { type: "markdown", label: "Code", icon: "<>" },
  { type: "quiz", label: "Quiz", icon: "?" },
  { type: "video", label: "Vidéo", icon: "▶" },
  { type: "image", label: "Image", icon: "🖼" },
];

export default function StudioPage() {
  const [blocks, setBlocks] = useState([
    { id: 1, type: "heading", content: "Mon premier cours" },
    { id: 2, type: "text", content: "Introduction au sujet..." },
  ]);
  const [title, setTitle] = useState("Nouveau cours");
  const [saved, setSaved] = useState(false);

  function addBlock(type: string) {
    setBlocks((b) => [...b, { id: Date.now(), type, content: "" }]);
  }

  function removeBlock(id: number) {
    setBlocks((b) => b.filter((block) => block.id !== id));
  }

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex gap-8">
      {/* Sidebar */}
      <aside className="w-64 shrink-0">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Mes cours</h2>
          <div className="flex flex-col gap-1">
            {MOCK_COURSES.slice(0, 4).map((c) => (
              <button
                key={c.id}
                className="text-left text-sm text-text-muted hover:text-primary px-2 py-1.5 rounded hover:bg-primary/5 transition-colors"
              >
                {c.title}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Ajouter un bloc</h2>
          <div className="grid grid-cols-2 gap-2">
            {BLOCK_TYPES.map((bt) => (
              <button
                key={bt.type}
                onClick={() => addBlock(bt.type)}
                className="flex flex-col items-center gap-1 p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors text-xs font-medium text-text-muted hover:text-primary"
              >
                <span className="text-base font-bold">{bt.icon}</span>
                {bt.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Editor */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-transparent hover:border-gray-200 focus:border-primary focus:outline-none px-1 py-0.5 transition-colors"
          />
          <div className="flex items-center gap-3">
            <button className="text-sm text-text-muted border border-gray-200 px-4 py-2 rounded-lg hover:border-gray-300 transition-colors">
              Prévisualiser
            </button>
            <button
              onClick={save}
              className="text-sm bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
            >
              {saved ? "✓ Sauvegardé" : "Sauvegarder"}
            </button>
            <button className="text-sm bg-danger text-white px-4 py-2 rounded-lg hover:bg-danger-dark transition-colors">
              Publier
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {blocks.map((block, i) => (
            <div key={block.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 group relative">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-text-muted bg-gray-100 px-2 py-0.5 rounded uppercase">
                  {block.type}
                </span>
                <div className="flex-1" />
                <button
                  onClick={() => removeBlock(block.id)}
                  className="opacity-0 group-hover:opacity-100 text-xs text-danger hover:text-danger-dark transition-all"
                >
                  Supprimer
                </button>
              </div>
              {block.type === "heading" && (
                <input
                  defaultValue={block.content}
                  placeholder="Titre de la section..."
                  className="w-full text-lg font-bold text-gray-900 focus:outline-none border-b border-transparent focus:border-primary pb-1"
                />
              )}
              {(block.type === "text" || block.type === "video" || block.type === "image") && (
                <textarea
                  defaultValue={block.content}
                  placeholder={block.type === "text" ? "Contenu texte..." : block.type === "video" ? "URL de la vidéo..." : "URL de l'image..."}
                  rows={3}
                  className="w-full text-sm text-gray-700 focus:outline-none resize-none border border-transparent focus:border-gray-200 rounded p-1"
                />
              )}
              {block.type === "markdown" && (
                <textarea
                  defaultValue={block.content || "```python\n# Votre code ici\n```"}
                  rows={5}
                  className="w-full text-sm font-mono text-gray-700 bg-gray-50 focus:outline-none resize-none border border-gray-200 rounded-lg p-3"
                />
              )}
              {block.type === "quiz" && (
                <div className="flex flex-col gap-2">
                  <input
                    placeholder="Question..."
                    className="w-full text-sm font-semibold text-gray-900 focus:outline-none border-b border-transparent focus:border-primary pb-1"
                  />
                  {["Option A", "Option B", "Option C", "Option D"].map((opt) => (
                    <div key={opt} className="flex items-center gap-2">
                      <input type="radio" name={`quiz-${block.id}`} className="accent-primary" />
                      <input
                        placeholder={opt}
                        className="flex-1 text-sm text-gray-700 focus:outline-none border-b border-transparent focus:border-gray-200 pb-0.5"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <button
            onClick={() => addBlock("text")}
            className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-sm text-text-muted hover:border-primary hover:text-primary transition-colors text-center"
          >
            + Ajouter un bloc
          </button>
        </div>
      </div>
    </div>
  );
}
