/**
 * @file StudioMarkdown.tsx
 * @description Composants partagés des pipelines Studio : barre d'étapes + aperçu Markdown.
 *
 * `MarkdownPreview` accepte une variante de thème :
 *   - `"dark"`  (défaut) — rendu sur fond sombre `bg-navy` (aperçu Studio « PDF → Cours »).
 *   - `"light"` — rendu sur fond clair (page de lecture de cours `/courses/[id]`).
 */
"use client";

import type React from "react";

const DEFAULT_STEPS = ["Source", "Traitement IA", "Édition", "Publication"];

/** Barre de progression horizontale à 4 étapes. */
export function StepBar({ current, steps = DEFAULT_STEPS }: { current: number; steps?: string[] }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {steps.map((label, i) => (
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
          {i < steps.length - 1 && (
            <div className={`h-px w-16 sm:w-20 mx-1 mb-5 transition-all ${i < current ? "bg-primary" : "bg-gray-800"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

/** Variante de thème pour le rendu Markdown. */
type MarkdownVariant = "dark" | "light";

/**
 * Jeux de classes par variante.
 * Chaque clé décrit un rôle sémantique ; les classes sont statiques (compatibles JIT Tailwind).
 */
const MD: Record<MarkdownVariant, {
  h1: string; h2: string; h3: string; calloutText: string; quote: string;
  code: string; codeLang: string; correctRow: string; correctBox: string;
  wrongRow: string; wrongBox: string; li: string; img: string; p: string;
  strong: string; em: string; inlineCode: string;
}> = {
  dark: {
    h1: "text-white",
    h2: "text-white border-b border-white/10",
    h3: "text-white",
    calloutText: "text-gray-300",
    quote: "border-white/20 text-gray-400",
    code: "bg-gray-950 border-white/10 text-emerald-400",
    codeLang: "text-gray-600",
    correctRow: "bg-emerald-500/10 text-emerald-300",
    correctBox: "bg-emerald-500 border-emerald-500 text-white",
    wrongRow: "text-gray-500",
    wrongBox: "border-white/20",
    li: "text-gray-300",
    img: "border-white/10",
    p: "text-gray-300",
    strong: "text-white font-semibold",
    em: "text-gray-400",
    inlineCode: "bg-gray-800 text-emerald-400",
  },
  light: {
    h1: "text-gray-900",
    h2: "text-gray-900 border-b border-gray-200",
    h3: "text-gray-900",
    calloutText: "text-gray-600",
    quote: "border-gray-300 text-gray-500",
    code: "bg-gray-950 border-gray-800 text-emerald-400",
    codeLang: "text-gray-500",
    correctRow: "bg-emerald-50 text-emerald-700",
    correctBox: "bg-emerald-500 border-emerald-500 text-white",
    wrongRow: "text-gray-500",
    wrongBox: "border-gray-300",
    li: "text-gray-700",
    img: "border-gray-200",
    p: "text-gray-700",
    strong: "text-gray-900 font-semibold",
    em: "text-gray-500",
    inlineCode: "bg-gray-100 text-primary",
  },
};

/** Rendu simplifié du Markdown généré par le LLM (titres, listes, code, quiz, inline). */
export function MarkdownPreview({ content, variant = "dark" }: { content: string; variant?: MarkdownVariant }) {
  const s = MD[variant];
  const lines = content.split("\n");
  const rendered: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("# ")) {
      rendered.push(<h1 key={i} className={`text-2xl font-extrabold mt-6 mb-3 ${s.h1}`}>{line.slice(2)}</h1>);
    } else if (line.startsWith("## ")) {
      rendered.push(<h2 key={i} className={`text-lg font-bold mt-5 mb-2 pb-1 ${s.h2}`}>{line.slice(3)}</h2>);
    } else if (line.startsWith("### ")) {
      rendered.push(<h3 key={i} className={`text-base font-semibold mt-4 mb-1 ${s.h3}`}>{line.slice(4)}</h3>);
    } else if (line.startsWith("> **")) {
      rendered.push(
        <div key={i} className="border-l-2 border-primary pl-4 py-2 my-3 bg-primary/5 rounded-r-xl">
          <p className={`text-sm ${s.calloutText}`}>{line.slice(2)}</p>
        </div>
      );
    } else if (line.startsWith("> ")) {
      rendered.push(<blockquote key={i} className={`border-l-2 pl-4 text-sm my-2 ${s.quote}`}>{line.slice(2)}</blockquote>);
    } else if (line.startsWith("```")) {
      const lang = line.slice(3);
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      rendered.push(
        <pre key={i} className={`border rounded-xl p-4 text-sm font-mono overflow-x-auto my-3 ${s.code}`}>
          {lang && <div className={`text-xs mb-2 ${s.codeLang}`}>{lang}</div>}
          {codeLines.join("\n")}
        </pre>
      );
    } else if (line.startsWith("- [x] ") || line.startsWith("- [ ] ")) {
      const correct = line.startsWith("- [x]");
      const text = line.slice(6);
      rendered.push(
        <div key={i} className={`flex items-center gap-2 text-sm py-1.5 px-3 rounded-lg my-0.5 ${correct ? s.correctRow : s.wrongRow}`}>
          <span className={`w-4 h-4 rounded border flex items-center justify-center text-xs shrink-0 ${correct ? s.correctBox : s.wrongBox}`}>
            {correct ? "✓" : ""}
          </span>
          {text.replace(" (correct)", "")}
        </div>
      );
    } else if (line.startsWith("- ")) {
      rendered.push(<li key={i} className={`text-sm ml-4 list-disc my-0.5 ${s.li}`}>{line.slice(2)}</li>);
    } else if (/^!\[[^\]]*\]\([^)]+\)/.test(line.trim())) {
      // Image markdown ![légende](url) — ex. figures OCR des slides
      const m = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)/);
      if (m) {
        // eslint-disable-next-line @next/next/no-img-element
        rendered.push(<img key={i} src={m[2]} alt={m[1]} className={`rounded-lg max-w-full my-3 border ${s.img}`} />);
      }
    } else if (line.trim() === "") {
      rendered.push(<div key={i} className="my-1" />);
    } else {
      const html = line
        .replace(/\*\*([^*]+)\*\*/g, `<strong class='${s.strong}'>$1</strong>`)
        .replace(/\*([^*]+)\*/g, `<em class='${s.em}'>$1</em>`)
        .replace(/`([^`]+)`/g, `<code class='${s.inlineCode} px-1.5 py-0.5 rounded text-xs font-mono'>$1</code>`);
      rendered.push(<p key={i} className={`text-sm leading-relaxed my-1 ${s.p}`} dangerouslySetInnerHTML={{ __html: html }} />);
    }
    i++;
  }

  return <div className="space-y-0.5">{rendered}</div>;
}
