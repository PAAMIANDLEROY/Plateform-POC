/**
 * @file (platform)/studio/video-course/page.tsx
 * @description Pipeline IA "Vidéo + Slides → Cours" dans Hi! Studio — "/studio/video-course".
 *
 * Flux en 4 étapes (`Step`) :
 *   1. `sources`    : saisie des sources (YouTube URL ou fichier vidéo/audio) + fichier slides (PPTX/PDF).
 *   2. `processing` : spinner + message rotatif toutes les 2.5s + informations sur le modèle.
 *   3. `edit`       : éditeur Markdown side-by-side (gauche: code | droite: préview rendu).
 *   4. `published`  : confirmation de publication avec options "Retour au Studio" / "Créer un autre".
 *
 * Appels API :
 *   - `POST /api/v1/studio/video-to-course` (FormData) : génère le cours.
 *   - `POST /api/v1/studio/save-course` (JSON) : publie le cours édité.
 *   L'URL de base est `NEXT_PUBLIC_API_URL` ou `http://localhost:8000` par défaut.
 *
 * Sources vidéo (choix exclusif) :
 *   - URL YouTube/Vimeo → champ texte `youtubeUrl`.
 *   - Fichier vidéo/audio local → `videoFile` via `<input ref={videoRef} type="file">`.
 *   Au moins une source est requise + titre pour débloquer le bouton "Générer".
 *
 * Slides (optionnel) :
 *   PPTX ou PDF — `slidesFile` via `<input ref={slidesRef} type="file">`.
 *   Améliore la qualité du cours généré si fourni.
 *
 * `MarkdownPreview` :
 *   Rendu ligne-par-ligne du Markdown généré par le LLM.
 *   Reconnaît : #/##/### (titres), > et > ** (citations), ``` (code),
 *   - [x] / - [ ] (quiz checkbox), - (liste), **Question**, *Explication*,
 *   **bold**, *italic*, `code` inline, et les paragraphes normaux.
 *
 * `StepBar` :
 *   Indicateur de progression en 4 étapes.
 *   Étape passée : fond primary + ✓.
 *   Étape courante : fond primary + `ring-4 ring-primary/20`.
 *   Étape future : fond gris.
 *
 * Gestion des erreurs :
 *   Sur erreur API → revient à l'étape "sources" avec message d'erreur affiché.
 *   `try/catch` autour des deux appels fetch.
 */

"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Spinner } from "@/components/ui/Spinner";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Données du cours généré par l'API. */
interface GeneratedCourse {
  title: string;
  content: string;
  level: string;
  language: string;
  sources_used: string[];
}

/** Étapes du pipeline de génération. */
type Step = "sources" | "processing" | "edit" | "published";

// ── Indicateur de progression ─────────────────────────────────────────────────

/** Labels des 4 étapes affichés dans la barre de progression. */
const STEPS = ["Sources", "Traitement IA", "Édition", "Publication"];

/**
 * Barre de progression horizontale à 4 étapes avec connecteurs.
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
              // Branche étape passée : ✓ primary
              i < current ? "bg-primary text-white" :
              // Branche étape courante : primary + ring focus
              i === current ? "bg-primary text-white ring-4 ring-primary/20" :
              // Branche étape future : gris
              "bg-gray-800 text-gray-600"
            }`}>
              {/* Étapes passées : ✓ ; étapes courante/future : numéro */}
              {i < current ? "✓" : i + 1}
            </div>
            <span className={`text-xs mt-1.5 whitespace-nowrap ${i === current ? "text-white font-semibold" : "text-gray-600"}`}>
              {label}
            </span>
          </div>
          {/* Connecteur entre étapes — coloré si étape passée */}
          {i < STEPS.length - 1 && (
            <div className={`h-px w-16 sm:w-20 mx-1 mb-5 transition-all ${i < current ? "bg-primary" : "bg-gray-800"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Rendu Markdown ligne par ligne ────────────────────────────────────────────

/**
 * Rendu simplifié de Markdown généré par le LLM.
 * Parcourt les lignes une par une et reconnaît les patterns Markdown courants.
 *
 * Patterns reconnus (ordre de priorité) :
 *   - `# ` → h1 blanc
 *   - `## ` → h2 blanc + border-b
 *   - `### ` → h3 blanc
 *   - `> **` → citation mise en avant (fond primary/5)
 *   - `> ` → blockquote gris
 *   - ` ``` ` → bloc de code multilignes jusqu'au ``` fermant
 *   - `- [x] ` → checkbox cochée (vert) — réponse correcte
 *   - `- [ ] ` → checkbox non cochée (gris) — option incorrecte
 *   - `- ` → li liste simple
 *   - `**Question` → titre question (blanc bold)
 *   - `*Explication` → explication (gris italic)
 *   - ligne vide → div spacer
 *   - autre → paragraphe avec **bold**, *italic*, `code` inline
 *
 * @property content - Contenu Markdown à rendre.
 */
function MarkdownPreview({ content }: { content: string }) {
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
      // Citation mise en avant — fond primary léger
      rendered.push(
        <div key={i} className="border-l-2 border-primary pl-4 py-2 my-3 bg-primary/5 rounded-r-xl">
          <p className="text-sm text-gray-300">{line.slice(2)}</p>
        </div>
      );
    } else if (line.startsWith("> ")) {
      rendered.push(<blockquote key={i} className="border-l-2 border-white/20 pl-4 text-sm text-gray-400 my-2">{line.slice(2)}</blockquote>);
    } else if (line.startsWith("```")) {
      // Bloc de code multilignes — collecte toutes les lignes jusqu'au ``` fermant
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
      // Checkbox de quiz — [x] = correct (vert), [ ] = incorrect (gris)
      const correct = line.startsWith("- [x]");
      const text = line.slice(6);
      rendered.push(
        <div key={i} className={`flex items-center gap-2 text-sm py-1.5 px-3 rounded-lg my-0.5 ${correct ? "bg-emerald-500/10 text-emerald-300" : "text-gray-500"}`}>
          <span className={`w-4 h-4 rounded border flex items-center justify-center text-xs shrink-0 ${correct ? "bg-emerald-500 border-emerald-500 text-white" : "border-white/20"}`}>
            {correct ? "✓" : ""}
          </span>
          {text.replace(" (correct)", "")}
          {correct && <span className="text-xs text-emerald-500 ml-1">✓</span>}
        </div>
      );
    } else if (line.startsWith("- ")) {
      rendered.push(<li key={i} className="text-sm text-gray-300 ml-4 list-disc my-0.5">{line.slice(2)}</li>);
    } else if (line.startsWith("**Question")) {
      rendered.push(<p key={i} className="text-sm font-bold text-white mt-4 mb-2">{line.replace(/\*\*/g, "")}</p>);
    } else if (line.startsWith("*Explication")) {
      rendered.push(<p key={i} className="text-xs text-gray-500 italic mt-1 mb-3">{line.replace(/\*/g, "")}</p>);
    } else if (line.trim() === "") {
      rendered.push(<div key={i} className="my-1" />);
    } else {
      // Paragraphe avec mise en forme inline : **bold**, *italic*, `code`
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

// ── Page principale ────────────────────────────────────────────────────────────

/**
 * Page du pipeline "Vidéo + Slides → Cours".
 */
export default function VideoCoursePage() {
  /** Étape courante du pipeline. */
  const [step, setStep] = useState<Step>("sources");
  /** URL YouTube ou Vimeo de la vidéo source. */
  const [youtubeUrl, setYoutubeUrl] = useState("");
  /** Fichier vidéo/audio local uploadé. */
  const [videoFile, setVideoFile] = useState<File | null>(null);
  /** Fichier slides (PPTX/PDF) uploadé. */
  const [slidesFile, setSlidesFile] = useState<File | null>(null);
  /** Titre du cours à générer. */
  const [title, setTitle] = useState("");
  /** Niveau du cours généré. */
  const [level, setLevel] = useState("intermediate");
  /** Langue du cours généré. */
  const [language, setLanguage] = useState("fr");
  /** Nombre de sections demandées au LLM. */
  const [nSections, setNSections] = useState(4);
  /** Cours généré par l'API (null avant génération). */
  const [course, setCourse] = useState<GeneratedCourse | null>(null);
  /** Contenu Markdown en cours d'édition. */
  const [editedContent, setEditedContent] = useState("");
  /** Titre en cours d'édition. */
  const [editedTitle, setEditedTitle] = useState("");
  /** Message d'erreur API (vide si aucune erreur). */
  const [error, setError] = useState("");
  /** Message rotatif affiché pendant le traitement IA. */
  const [processingMsg, setProcessingMsg] = useState("Analyse des sources…");
  /** Catégorie choisie pour la publication. */
  const [publishCategory, setPublishCategory] = useState("IA & Data");
  /** École choisie pour la publication (optionnel). */
  const [publishSchool, setPublishSchool] = useState("");
  /** Ref pour l'input file vidéo (déclenchement programmatique). */
  const videoRef = useRef<HTMLInputElement>(null);
  /** Ref pour l'input file slides (déclenchement programmatique). */
  const slidesRef = useRef<HTMLInputElement>(null);

  /** Mapping étape → index pour `StepBar`. */
  const stepIndex: Record<Step, number> = { sources: 0, processing: 1, edit: 2, published: 3 };

  /** `true` si au moins une source est fournie. */
  const hasSource = youtubeUrl.trim() || videoFile || slidesFile;

  /**
   * Lance la génération du cours via l'API.
   * Fait tourner un intervalle de messages rotatifs toutes les 2.5s.
   * En cas d'erreur : revient à "sources" avec le message d'erreur.
   */
  async function generate() {
    // Guard : source ou titre manquant
    if (!hasSource || !title.trim()) return;
    setError("");
    setStep("processing");

    const msgs = ["Extraction des sources…", "Transcription en cours…", "Analyse du contenu…", "Génération du cours avec Claude…", "Finalisation…"];
    let msgIdx = 0;
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % msgs.length;
      setProcessingMsg(msgs[msgIdx]);
    }, 2500);

    try {
      const form = new FormData();
      form.append("title", title.trim());
      form.append("level", level);
      form.append("language", language);
      form.append("n_sections", String(nSections));
      if (youtubeUrl.trim()) form.append("youtube_url", youtubeUrl.trim());
      if (videoFile) form.append("video_file", videoFile);
      if (slidesFile) form.append("slides_file", slidesFile);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/studio/video-to-course`,
        { method: "POST", credentials: "include", body: form }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: "Erreur serveur" }));
        throw new Error(body.detail ?? "Erreur lors de la génération");
      }

      const data: GeneratedCourse = await res.json();
      setCourse(data);
      setEditedContent(data.content);
      setEditedTitle(data.title);
      setStep("edit");
    } catch (err: unknown) {
      // Branche erreur : retour à l'étape sources avec message
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      setStep("sources");
    } finally {
      clearInterval(interval);
    }
  }

  /**
   * Publie le cours édité via l'API.
   * Passe à l'étape "published" si succès.
   */
  async function publish() {
    if (!course) return;
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/studio/save-course`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editedTitle,
          content: editedContent,
          level: course.level,
          language: course.language,
          category: publishCategory,
          school: publishSchool || undefined,
        }),
      }
    );
    // Branche succès API : passage à l'étape "published"
    if (res.ok) setStep("published");
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/studio" className="text-gray-500 hover:text-white transition-colors text-sm">← Studio</Link>
        <span className="text-gray-700">/</span>
        <h1 className="text-xl font-bold text-white">Vidéo + Slides → Cours</h1>
        <span className="text-xs bg-primary/15 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-medium">IA</span>
      </div>

      <StepBar current={stepIndex[step]} />

      {/* ── Étape 1 : Sources ── */}
      {step === "sources" && (
        <div className="max-w-2xl space-y-6">
          {/* Affichage erreur API */}
          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-xl px-4 py-3">{error}</div>
          )}

          {/* Champ titre */}
          <div>
            <label className="block text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1.5">Titre du cours *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ex: Introduction au Deep Learning"
              className="w-full bg-gray-900 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/50 placeholder-gray-600" />
          </div>

          {/* Source vidéo — URL ou fichier local */}
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 space-y-4">
            <p className="text-sm font-semibold text-white mb-1">Source vidéo <span className="text-gray-500 font-normal">(choisir une option)</span></p>
            <div>
              <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1.5">URL YouTube / Vimeo</label>
              <input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full bg-gray-800 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/50 placeholder-gray-600" />
            </div>
            <div className="text-center text-xs text-gray-600">— ou —</div>
            {/* Fichier vidéo/audio — zone cliquable */}
            <div>
              <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1.5">Fichier vidéo / audio</label>
              <div onClick={() => videoRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                  videoFile ? "border-primary/50 bg-primary/5" : "border-white/10 hover:border-white/20"
                }`}>
                <input ref={videoRef} type="file" accept=".mp4,.mov,.mp3,.wav,.m4a,.webm" className="hidden"
                  onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)} />
                {/* Branche fichier chargé : afficher nom + taille */}
                {videoFile ? (
                  <p className="text-sm text-white">{videoFile.name} <span className="text-gray-500">({(videoFile.size / 1024 / 1024).toFixed(1)} MB)</span></p>
                ) : (
                  // Branche pas de fichier : instructions
                  <p className="text-sm text-gray-500">MP4, MOV, MP3, WAV · 100 MB max</p>
                )}
              </div>
            </div>
          </div>

          {/* Slides optionnels */}
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-5">
            <p className="text-sm font-semibold text-white mb-3">Slides <span className="text-gray-500 font-normal">(optionnel)</span></p>
            <div onClick={() => slidesRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                slidesFile ? "border-primary/50 bg-primary/5" : "border-white/10 hover:border-white/20"
              }`}>
              <input ref={slidesRef} type="file" accept=".pptx,.pdf" className="hidden"
                onChange={(e) => setSlidesFile(e.target.files?.[0] ?? null)} />
              {slidesFile
                ? <p className="text-sm text-white">{slidesFile.name}</p>
                : <p className="text-sm text-gray-500">PPTX ou PDF · Le texte est extrait automatiquement</p>}
            </div>
          </div>

          {/* Configuration du cours */}
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1.5">Niveau</label>
              <select value={level} onChange={(e) => setLevel(e.target.value)}
                className="w-full bg-gray-800 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-primary/50">
                <option value="beginner">Débutant</option>
                <option value="intermediate">Intermédiaire</option>
                <option value="advanced">Avancé</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1.5">Langue</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-gray-800 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-primary/50">
                <option value="fr">Français</option>
                <option value="en">Anglais</option>
              </select>
            </div>
            {/* Slider nombre de sections */}
            <div className="col-span-2">
              <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1.5">
                Nombre de sections : <span className="text-white font-bold">{nSections}</span>
              </label>
              <input type="range" min={2} max={8} value={nSections} onChange={(e) => setNSections(Number(e.target.value))}
                className="w-full accent-primary" />
            </div>
          </div>

          {/* Bouton générer — désactivé si pas de source ou pas de titre */}
          <button onClick={generate} disabled={!hasSource || !title.trim()}
            className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary/20">
            ✨ Générer le cours avec l'IA
          </button>
        </div>
      )}

      {/* ── Étape 2 : Traitement IA ── */}
      {step === "processing" && (
        <div className="flex flex-col items-center justify-center py-24 gap-6">
          <Spinner size="lg" />
          <div className="text-center">
            <p className="text-lg font-bold text-white mb-1">{processingMsg}</p>
            <p className="text-sm text-gray-500">Transcription + extraction + génération Claude</p>
          </div>
          {/* Informations techniques sur la génération */}
          <div className="text-xs text-gray-700 bg-gray-900 border border-white/5 rounded-xl px-4 py-3 text-center max-w-sm space-y-1">
            <p>Modèle : <span className="text-gray-400">claude-sonnet-4-6</span></p>
            <p>Transcription : <span className="text-gray-400">Whisper API</span></p>
            <p>Durée estimée : <span className="text-gray-400">30–90 secondes</span></p>
          </div>
        </div>
      )}

      {/* ── Étape 3 : Édition side-by-side ── */}
      {step === "edit" && course && (
        <div className="space-y-4">
          {/* Badges des sources utilisées par le LLM */}
          {course.sources_used.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap text-xs text-gray-600">
              <span>Sources :</span>
              {course.sources_used.map((s) => (
                <span key={s} className="bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-gray-400">{s}</span>
              ))}
            </div>
          )}

          {/* Titre éditable */}
          <input value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)}
            className="w-full text-xl font-extrabold text-white bg-transparent border-b border-white/10 focus:border-primary focus:outline-none pb-1 transition-colors" />

          {/* Éditeur Markdown (gauche) + Aperçu rendu (droite) — hauteur fixe */}
          <div className="grid grid-cols-2 gap-4" style={{ height: "65vh" }}>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Markdown</span>
                <span className="text-xs text-gray-700">{editedContent.split("\n").length} lignes</span>
              </div>
              <textarea value={editedContent} onChange={(e) => setEditedContent(e.target.value)}
                className="flex-1 bg-gray-900 border border-white/10 text-gray-300 text-xs font-mono p-4 rounded-xl resize-none focus:outline-none focus:border-primary/50 leading-relaxed" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Aperçu</span>
              <div className="flex-1 bg-gray-950 border border-white/5 rounded-xl p-5 overflow-y-auto">
                <MarkdownPreview content={editedContent} />
              </div>
            </div>
          </div>

          {/* Configuration de publication */}
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1.5">Catégorie</label>
              <select value={publishCategory} onChange={(e) => setPublishCategory(e.target.value)}
                className="w-full bg-gray-800 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-primary/50">
                {["IA & Data", "Mathématiques", "Programmation", "Statistiques", "Finance", "DevOps", "Société & Éthique"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1.5">École (optionnel)</label>
              <select value={publishSchool} onChange={(e) => setPublishSchool(e.target.value)}
                className="w-full bg-gray-800 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-primary/50">
                <option value="">— Sélectionner —</option>
                {["École Polytechnique", "Télécom Paris", "HEC Paris", "ENSAE Paris", "Hi! PARIS"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep("sources")} className="border border-white/10 text-gray-400 px-5 py-2.5 rounded-xl text-sm hover:text-white hover:border-white/30 transition-all">
              ← Recommencer
            </button>
            <button onClick={publish}
              className="flex-1 bg-danger text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-danger-dark transition-colors shadow-lg shadow-danger/20">
              Publier le cours →
            </button>
          </div>
        </div>
      )}

      {/* ── Étape 4 : Cours publié ── */}
      {step === "published" && (
        <div className="flex flex-col items-center text-center py-16 gap-6">
          <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-3xl">✓</div>
          <div>
            <h2 className="text-2xl font-extrabold text-white mb-2">Cours publié !</h2>
            <p className="text-gray-400 text-sm"><strong className="text-white">{editedTitle}</strong></p>
          </div>
          <div className="flex gap-3">
            <Link href="/studio" className="border border-white/10 text-gray-300 px-5 py-2.5 rounded-xl text-sm hover:bg-white/5 transition-colors">
              Retour au Studio
            </Link>
            {/* Bouton réinitialiser tous les états pour créer un nouveau cours */}
            <button onClick={() => { setStep("sources"); setCourse(null); setTitle(""); setYoutubeUrl(""); setVideoFile(null); setSlidesFile(null); }}
              className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm hover:bg-primary-dark transition-colors">
              Créer un autre cours
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
