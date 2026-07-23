/*
 * pyodide-worker.js
 * ------------------
 * Web Worker qui exécute du Python dans le navigateur via Pyodide (WebAssembly).
 *
 * Chargé côté client par le composant `RunnableCodeBlock` (new Worker("/pyodide-worker.js")).
 * Tout tourne dans le navigateur de l'utilisateur : aucun serveur, aucune charge infra.
 *
 * Protocole de messages (main thread → worker) :
 *   { id: number, code: string }
 *
 * Protocole de réponses (worker → main thread) :
 *   { id, type: "status", status: "loading" | "running" }
 *   { id, type: "result", ok: true,  stdout: string, result: string }
 *   { id, type: "result", ok: false, stdout: string, error: string }
 *
 * Pyodide est chargé depuis le CDN jsDelivr. Si une CSP stricte est ajoutée à l'app,
 * il faudra autoriser https://cdn.jsdelivr.net (script-src / worker-src / connect-src).
 */

const PYODIDE_VERSION = "v0.26.4";
const PYODIDE_URL = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`;

// Promesse d'initialisation partagée : Pyodide n'est chargé qu'une seule fois par worker.
let pyodideReady = null;

async function initPyodide() {
  importScripts(PYODIDE_URL + "pyodide.js");
  // `loadPyodide` est exposé en global par le script importé ci-dessus.
  return await loadPyodide({ indexURL: PYODIDE_URL });
}

self.onmessage = async (event) => {
  const { id, code } = event.data;

  try {
    // Première exécution : téléchargement + init de Pyodide (~6-10 Mo).
    if (!pyodideReady) {
      self.postMessage({ id, type: "status", status: "loading" });
      pyodideReady = initPyodide();
    }
    const pyodide = await pyodideReady;

    // Capture de stdout/stderr — réattachée à chaque exécution.
    let out = "";
    pyodide.setStdout({ batched: (s) => { out += s; } });
    pyodide.setStderr({ batched: (s) => { out += s; } });

    // Charge automatiquement les paquets importés disponibles (numpy, pandas…).
    try {
      await pyodide.loadPackagesFromImports(code);
    } catch (_) {
      // Erreurs de chargement de paquet : ignorées ici, elles ressortiront à l'exécution.
    }

    // Signale le début d'exécution — c'est ici que le main thread arme le timeout d'exécution.
    self.postMessage({ id, type: "status", status: "running" });

    let result;
    try {
      result = await pyodide.runPythonAsync(code);
    } catch (err) {
      self.postMessage({
        id, type: "result", ok: false,
        stdout: out,
        error: err && err.message ? err.message : String(err),
      });
      return;
    }

    // Convertit la valeur de la dernière expression en texte (si présente).
    let resultStr = "";
    if (result !== undefined && result !== null) {
      try { resultStr = result.toString(); } catch (_) { resultStr = ""; }
      if (pyodide.isPyProxy && pyodide.isPyProxy(result)) {
        try { result.destroy(); } catch (_) { /* noop */ }
      }
    }

    self.postMessage({ id, type: "result", ok: true, stdout: out, result: resultStr });
  } catch (err) {
    self.postMessage({
      id, type: "result", ok: false,
      stdout: "",
      error: err && err.message ? err.message : String(err),
    });
  }
};
