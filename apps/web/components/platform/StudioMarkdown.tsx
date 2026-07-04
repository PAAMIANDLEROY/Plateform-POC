/**
 * @file StudioMarkdown.tsx
 * @description Composants partagés des pipelines Studio : barre d'étapes + aperçu Markdown
 * (rendu sur fond sombre `bg-navy`). Utilisé par « PDF → Cours » (et réutilisable ailleurs).
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

/** Rendu simplifié du Markdown généré par le LLM (titres, listes, code, quiz, inline). */
export function MarkdownPreview({ content }: { content: string }) {
  const lines = content.split("\n");
  const rendered: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("# ")) {
      rendered.push(<h1 key={i} className="text-2xl font-extrabold text-white mt-6 mb-3">{line.slice(2)}</h1>);
    } else if (line.startsWith("## ")) {
      rendered.push(<h2 key={i} className="text-lg font-bold text-white mt-5 mb-2 border-b border-white/10 pb-1">{line.slice(3)}</h2>);
    } else if (line.startsWith("### ")) {
      rendered.push(<h3 key={i} className="text-base font-semibold text-white mt-4 mb-1">{line.slice(4)}</h3>);
    } else if (line.startsWith("> **")) {
      rendered.push(
        <div key={i} className="border-l-2 border-primary pl-4 py-2 my-3 bg-primary/5 rounded-r-xl">
          <p className="text-sm text-gray-300">{line.slice(2)}</p>
        </div>
      );
    } else if (line.startsWith("> ")) {
      rendered.push(<blockquote key={i} className="border-l-2 border-white/20 pl-4 text-sm text-gray-400 my-2">{line.slice(2)}</blockquote>);
    } else if (line.startsWith("```")) {
      const lang = line.slice(3);
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      rendered.push(
        <pre key={i} className="bg-gray-950 border border-white/10 rounded-xl p-4 text-sm font-mono text-emerald-400 overflow-x-auto my-3">
          {lang && <div className="text-xs text-gray-600 mb-2">{lang}</div>}
          {codeLines.join("\n")}
        </pre>
      );
    } else if (line.startsWith("- [x] ") || line.startsWith("- [ ] ")) {
      const correct = line.startsWith("- [x]");
      const text = line.slice(6);
      rendered.push(
        <div key={i} className={`flex items-center gap-2 text-sm py-1.5 px-3 rounded-lg my-0.5 ${correct ? "bg-emerald-500/10 text-emerald-300" : "text-gray-500"}`}>
          <span className={`w-4 h-4 rounded border flex items-center justify-center text-xs shrink-0 ${correct ? "bg-emerald-500 border-emerald-500 text-white" : "border-white/20"}`}>
            {correct ? "✓" : ""}
          </span>
          {text.replace(" (correct)", "")}
        </div>
      );
    } else if (line.startsWith("- ")) {
      rendered.push(<li key={i} className="text-sm text-gray-300 ml-4 list-disc my-0.5">{line.slice(2)}</li>);
    } else if (line.trim() === "") {
      rendered.push(<div key={i} className="my-1" />);
    } else {
      const html = line
        .replace(/\*\*([^*]+)\*\*/g, "<strong class='text-white font-semibold'>$1</strong>")
        .replace(/\*([^*]+)\*/g, "<em class='text-gray-400'>$1</em>")
        .replace(/`([^`]+)`/g, "<code class='bg-gray-800 text-emerald-400 px-1.5 py-0.5 rounded text-xs font-mono'>$1</code>");
      rendered.push(<p key={i} className="text-sm text-gray-300 leading-relaxed my-1" dangerouslySetInnerHTML={{ __html: html }} />);
    }
    i++;
  }

  return <div className="space-y-0.5">{rendered}</div>;
}
