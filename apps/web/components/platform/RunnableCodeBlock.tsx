/**
 * @file RunnableCodeBlock.tsx
 * @description Bloc de code Python exécutable dans le navigateur (façon Google Colab).
 *
 * Exécute le code via Pyodide (WebAssembly) dans un Web Worker (`public/pyodide-worker.js`),
 * donc **100 % côté client** : aucune charge serveur, sandbox = le navigateur.
 *
 * Garde-fous (« capacités et mémoire limitées ») :
 *   - exécution isolée dans un Web Worker ;
 *   - timeout d'exécution (15 s) : le worker est tué et recréé si le code dépasse ;
 *   - timeout de chargement (60 s) séparé, pour ne pas pénaliser le 1er téléchargement de Pyodide ;
 *   - la mémoire est naturellement bornée par l'onglet du navigateur.
 *
 * Intégration : rendu par `MarkdownPreview` pour les fences ```python-run```, et utilisable
 * directement (ex. démo sur la page Databootcamp).
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Messages émis par le worker Pyodide. */
type WorkerMsg =
  | { id: number; type: "status"; status: "loading" | "running" }
  | { id: number; type: "result"; ok: true; stdout: string; result: string }
  | { id: number; type: "result"; ok: false; stdout: string; error: string };

/** Compteur global d'identifiants de messages (évite les collisions entre instances). */
let msgCounter = 0;

/** Délais maximum (ms). */
const EXEC_TIMEOUT_MS = 15_000;
const LOAD_TIMEOUT_MS = 60_000;

/**
 * Bloc de code Python éditable et exécutable.
 *
 * @param code - Code Python initial affiché dans l'éditeur.
 */
export function RunnableCodeBlock({ code: initialCode }: { code: string }) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "running">("idle");

  const workerRef = useRef<Worker | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Nettoie le worker et le timer courants. */
  const cleanupTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // Détruit le worker au démontage du composant.
  useEffect(() => {
    return () => {
      cleanupTimer();
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const run = useCallback(() => {
    setOutput("");
    setError("");

    // (Re)crée le worker si nécessaire (il a pu être tué par un timeout précédent).
    if (!workerRef.current) {
      workerRef.current = new Worker("/pyodide-worker.js");
    }
    const worker = workerRef.current;
    const id = ++msgCounter;
    setStatus("loading");

    // Timeout de chargement : si Pyodide n'a pas démarré l'exécution à temps, on abandonne.
    cleanupTimer();
    timerRef.current = setTimeout(() => {
      worker.removeEventListener("message", handleMessage);
      worker.terminate();
      workerRef.current = null;
      setStatus("idle");
      setError("⏱ Chargement trop long — réessayez (vérifiez votre connexion).");
    }, LOAD_TIMEOUT_MS);

    function handleMessage(e: MessageEvent) {
      const data = e.data as WorkerMsg;
      if (data.id !== id) return;

      if (data.type === "status") {
        setStatus(data.status);
        // Dès que l'exécution démarre, bascule sur le timeout d'exécution.
        if (data.status === "running") {
          cleanupTimer();
          timerRef.current = setTimeout(() => {
            worker.removeEventListener("message", handleMessage);
            worker.terminate();
            workerRef.current = null;
            setStatus("idle");
            setError(`⏱ Temps dépassé (${EXEC_TIMEOUT_MS / 1000} s) — exécution interrompue.`);
          }, EXEC_TIMEOUT_MS);
        }
        return;
      }

      // type === "result"
      cleanupTimer();
      worker.removeEventListener("message", handleMessage);
      setStatus("idle");

      if (data.ok) {
        let combined = data.stdout || "";
        if (data.result) {
          combined += combined && !combined.endsWith("\n") ? "\n" : "";
          combined += data.result;
        }
        setOutput(combined || "(aucune sortie)");
      } else {
        setOutput(data.stdout || "");
        setError(data.error || "Erreur d'exécution.");
      }
    }

    worker.addEventListener("message", handleMessage);
    worker.postMessage({ id, code });
  }, [code]);

  const busy = status !== "idle";
  const rows = Math.min(Math.max(code.split("\n").length, 3), 20);

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-gray-800 bg-gray-950">
      {/* Barre d'en-tête : label + bouton Exécuter */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
        <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
          <span className="text-yellow-400">●</span> Python
        </span>
        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {status === "loading" ? "Chargement…" : status === "running" ? "Exécution…" : "▶ Exécuter"}
        </button>
      </div>

      {/* Éditeur de code (textarea monospace, sans dépendance externe) */}
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
        rows={rows}
        className="block w-full bg-gray-950 text-emerald-300 font-mono text-sm p-4 outline-none resize-y leading-relaxed"
      />

      {/* Zone de sortie — affichée dès qu'il y a un résultat, une erreur, ou une exécution en cours */}
      {(output || error || busy) && (
        <div className="border-t border-gray-800 px-4 py-3 bg-black/40">
          <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-1">Sortie</p>
          {output && (
            <pre className="text-sm text-gray-200 font-mono whitespace-pre-wrap break-words">{output}</pre>
          )}
          {error && (
            <pre className="text-sm text-red-400 font-mono whitespace-pre-wrap break-words">{error}</pre>
          )}
          {busy && !output && <p className="text-sm text-gray-500">…</p>}
        </div>
      )}

      {/* Mention de contexte */}
      <div className="px-4 py-1.5 bg-gray-900/60 border-t border-gray-800">
        <span className="text-[10px] text-gray-600">
          Exécuté dans votre navigateur (Pyodide) · limité à {EXEC_TIMEOUT_MS / 1000} s
        </span>
      </div>
    </div>
  );
}
