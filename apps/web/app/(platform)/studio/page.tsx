/**
 * @file (platform)/studio/page.tsx
 * @description Éditeur Hi! Studio pour la création de contenus pédagogiques "/studio".
 *
 * Interface à 5 modes de création (onglets) :
 *   - `course`  : Éditeur de cours par blocs.
 *   - `mooc`    : Éditeur de parcours multi-cours (séquence de `MOCK_COURSES`).
 *   - `video`   : Éditeur de vidéo avec préview miniature live.
 *   - `app`     : Éditeur d'application interactive (URL Streamlit/Gradio).
 *   - `ai`      : Studio IA — pipelines "Excel → Quiz" et "Vidéo + Slides → Cours".
 *
 * Architecture du fichier :
 *   - `CourseEditor`  : palette de blocs + titre + métadonnées + séquence de blocs éditables.
 *   - `MOOCEditor`    : sélecteur de cours (sidebar scroll) + séquence ordonnée + formulaire.
 *   - `VideoEditor`   : carte préview live (miniature YouTube auto) + formulaire + TagInput.
 *   - `AppEditor`     : aperçu carte + formulaire URL + validation "https://" + TagInput.
 *   - `AIStudio`      : 2 cartes pipelines avec lien vers `/studio/excel-quiz` et `/studio/video-course`.
 *
 * Composants utilitaires internes :
 *   - `Field`    : label + champ + hint optionnel.
 *   - `TagInput` : input + chips — ajout sur Entrée/Virgule, suppression par ×.
 *
 * Classes CSS partagées :
 *   - `INP` : input standard (fond blanc, bordure gris, focus primary).
 *   - `SEL` : select standard.
 *   - `TXA` : textarea (= INP + resize-none).
 *
 * Sauvegarde :
 *   Bouton "Sauvegarder" → `saved` state → feedback vert 2.5s.
 *   Pas d'appel API dans le MVP — état local.
 *
 * `CourseEditor` — blocs de cours :
 *   `blocks` : tableau `{ id: number, type: string, content: string }`.
 *   `addBlock(type)` : pousse un bloc avec `id: Date.now()`.
 *   `removeBlock(id)` : filtre hors tableau.
 *   `move(id, dir)` : échange avec le voisin (↑/↓), ignore les limites du tableau.
 *
 * `MOOCEditor` — sélection et ordonnancement des cours :
 *   `selectedCourses` : tableau des IDs de cours cochés.
 *   `toggle(id)` : ajoute ou retire un cours de la sélection.
 *   `move(id, dir)` : réordonne dans le tableau (identique à CourseEditor).
 *   `totalMin` : somme des `duration` des cours sélectionnés.
 *
 * `VideoEditor` — préview miniature :
 *   `thumbSrc` : si `youtubeId` → URL miniature YouTube `maxresdefault.jpg` ;
 *                sinon `thumbnailUrl` si fourni ; sinon `null` (placeholder).
 *
 * `AppEditor` — validation URL :
 *   `validUrl` = `url.startsWith("http://") || url.startsWith("https://")`.
 *   Bordure verte si valide, rouge si invalide et non vide.
 *   Message d'erreur inline si URL présente mais invalide.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { MOCK_COURSES } from "@/lib/mock";

// ─── Types & constantes ───────────────────────────────────────────────────────

/** Mode de création actif dans l'éditeur Studio. */
type Mode = "course" | "mooc" | "video" | "app" | "ai";

/** Écoles disponibles dans les sélecteurs. */
const SCHOOLS = ["Polytechnique", "Télécom Paris", "ENSAE", "HEC", "Hi! PARIS"];

/** Catégories de contenu disponibles. */
const CATEGORIES = ["IA & Data", "Mathématiques", "Finance", "Programmation", "Statistiques", "DevOps"];

/** Niveaux de difficulté disponibles. */
const LEVELS = ["Débutant", "Intermédiaire", "Avancé"];

/** Types de blocs disponibles dans l'éditeur de cours. */
const BLOCK_TYPES = [
  { type: "heading", label: "Titre",  icon: "H"  },
  { type: "text",    label: "Texte",  icon: "¶"  },
  { type: "code",    label: "Code",   icon: "<>" },
  { type: "quiz",    label: "Quiz",   icon: "?"  },
  { type: "video",   label: "Vidéo",  icon: "▶"  },
  { type: "image",   label: "Image",  icon: "🖼" },
];

/** Onglets de création disponibles dans Hi! Studio. */
const MODE_TABS: { key: Mode; label: string; icon: string; desc: string }[] = [
  { key: "course", label: "Cours",        icon: "📖", desc: "Cours interactif par blocs" },
  { key: "mooc",   label: "MOOC",         icon: "🎓", desc: "Parcours multi-cours" },
  { key: "video",  label: "Vidéo",        icon: "▶",  desc: "Vidéo pédagogique" },
  { key: "app",    label: "Application",  icon: "⚡", desc: "App interactive" },
  { key: "ai",     label: "Studio IA",    icon: "✨", desc: "Génération automatique de contenu via IA" },
];

// ─── Classes CSS partagées ────────────────────────────────────────────────────

/** Classe CSS pour les champs input. */
const INP = "w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";

/** Classe CSS pour les select. */
const SEL = "w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";

/** Classe CSS pour les textarea (= INP + resize-none). */
const TXA = `${INP} resize-none`;

// ─── Composants utilitaires ───────────────────────────────────────────────────

/**
 * Champ de formulaire avec label et hint optionnel.
 *
 * @property label    - Label du champ (affiché en majuscules).
 * @property children - Champ de saisie (input, select, textarea).
 * @property hint     - Texte d'aide optionnel affiché sous le champ.
 */
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-700 mt-1">{hint}</p>}
    </div>
  );
}

/**
 * Champ de saisie de tags avec chips interactives.
 * - Ajoute un tag sur Entrée ou Virgule.
 * - Supprime un tag en cliquant sur ×.
 * - Évite les doublons.
 *
 * @property tags     - Liste des tags actuels.
 * @property onChange - Callback appelé avec la nouvelle liste de tags.
 */
function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState("");

  /** Ajoute le tag courant si Entrée ou Virgule est pressée. */
  function add(e: React.KeyboardEvent) {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      // Guard : éviter les doublons
      if (!tags.includes(input.trim())) onChange([...tags, input.trim()]);
      setInput("");
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5 bg-gray-800 border border-white/10 rounded-lg p-2.5 min-h-[42px]">
      {tags.map((t) => (
        <span key={t} className="flex items-center gap-1 text-xs bg-primary/20 text-primary-light border border-primary/20 px-2 py-0.5 rounded-full">
          {t}
          <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} className="opacity-70 hover:opacity-100 ml-0.5">×</button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={add}
        placeholder={tags.length === 0 ? "Ajouter des tags (Entrée pour valider)..." : ""}
        className="text-sm text-white bg-transparent outline-none flex-1 min-w-[100px]"
      />
    </div>
  );
}

// ─── Éditeur de cours ─────────────────────────────────────────────────────────

/**
 * Éditeur de cours par blocs avec palette latérale.
 * Blocs pré-initialisés : heading "Introduction" + texte "Bienvenue...".
 */
function CourseEditor() {
  const [blocks, setBlocks] = useState([
    { id: 1, type: "heading", content: "Introduction" },
    { id: 2, type: "text",    content: "Bienvenue dans ce cours..." },
  ]);
  const [title,    setTitle]    = useState("Nouveau cours");
  const [category, setCategory] = useState("IA & Data");
  const [level,    setLevel]    = useState("Débutant");
  const [school,   setSchool]   = useState("Polytechnique");

  /** Ajoute un bloc de type donné à la fin de la liste. */
  function addBlock(type: string) { setBlocks((b) => [...b, { id: Date.now(), type, content: "" }]); }

  /** Supprime un bloc par son ID. */
  function removeBlock(id: number) { setBlocks((b) => b.filter((bl) => bl.id !== id)); }

  /**
   * Déplace un bloc d'une position vers le haut ("up") ou le bas ("down").
   * Ignore si déjà en limite de tableau.
   */
  function move(id: number, dir: "up" | "down") {
    setBlocks((b) => {
      const i = b.findIndex((bl) => bl.id === id);
      // Guard : déjà en tête → pas de déplacement vers le haut
      if (dir === "up" && i === 0) return b;
      // Guard : déjà en queue → pas de déplacement vers le bas
      if (dir === "down" && i === b.length - 1) return b;
      const n = [...b];
      const j = dir === "up" ? i - 1 : i + 1;
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });
  }

  return (
    <div className="flex gap-6">
      {/* Palette de blocs */}
      <aside className="w-48 shrink-0">
        <div className="bg-white border border-gray-200 rounded-xl p-4 sticky top-24">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Blocs</p>
          <div className="grid grid-cols-2 gap-2">
            {BLOCK_TYPES.map((bt) => (
              <button
                key={bt.type}
                onClick={() => addBlock(bt.type)}
                className="flex flex-col items-center gap-1 p-2.5 rounded-lg border border-white/10 hover:border-primary/40 hover:bg-primary/5 text-xs font-medium text-gray-400 hover:text-primary transition-all"
              >
                <span className="text-sm font-bold">{bt.icon}</span>
                {bt.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Zone principale */}
      <div className="flex-1 min-w-0">
        {/* Métadonnées en 3 colonnes */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4 grid grid-cols-3 gap-4">
          <Field label="Catégorie">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={SEL}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Niveau">
            <select value={level} onChange={(e) => setLevel(e.target.value)} className={SEL}>
              {LEVELS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </Field>
          <Field label="École">
            <select value={school} onChange={(e) => setSchool(e.target.value)} className={SEL}>
              {SCHOOLS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </div>

        {/* Titre du cours */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre du cours..."
          className="w-full text-2xl font-extrabold text-gray-900 bg-transparent border-b-2 border-gray-200 focus:border-primary focus:outline-none px-1 py-2 mb-5 transition-colors"
        />

        {/* Séquence des blocs éditables */}
        <div className="flex flex-col gap-3">
          {blocks.map((block) => (
            <div key={block.id} className="bg-white border border-gray-200 rounded-xl p-4 group">
              {/* Contrôles : type + déplacer + supprimer (visibles au hover) */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-gray-600 bg-white/5 px-2 py-0.5 rounded uppercase tracking-wide">
                  {block.type}
                </span>
                <div className="flex-1" />
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => move(block.id, "up")}   className="text-xs text-gray-500 hover:text-white px-1.5 py-0.5 rounded hover:bg-white/5">↑</button>
                  <button onClick={() => move(block.id, "down")} className="text-xs text-gray-500 hover:text-white px-1.5 py-0.5 rounded hover:bg-white/5">↓</button>
                  <button onClick={() => removeBlock(block.id)}  className="text-xs text-danger hover:text-danger-dark px-1.5 py-0.5 rounded hover:bg-danger/5">Supprimer</button>
                </div>
              </div>

              {/* Branche heading : input titre de section */}
              {block.type === "heading" && (
                <input defaultValue={block.content} placeholder="Titre de section..."
                  className="w-full text-lg font-bold text-gray-900 bg-transparent border-b border-gray-200 focus:border-primary focus:outline-none pb-1 transition-colors"
                />
              )}
              {/* Branche text/video/image : textarea avec placeholder contextuel */}
              {(block.type === "text" || block.type === "video" || block.type === "image") && (
                <textarea defaultValue={block.content} rows={3}
                  placeholder={block.type === "text" ? "Contenu texte..." : block.type === "video" ? "URL ou ID YouTube..." : "URL de l'image..."}
                  className="w-full text-sm text-gray-300 bg-gray-800 border border-white/10 rounded-lg p-3 focus:outline-none focus:border-primary/50 resize-none transition-colors"
                />
              )}
              {/* Branche code : textarea monospaced avec contenu Python par défaut */}
              {block.type === "code" && (
                <textarea defaultValue="```python\n# Votre code ici\n```" rows={5}
                  className="w-full text-sm font-mono text-green-400 bg-gray-950 border border-white/10 rounded-lg p-3 focus:outline-none resize-none"
                />
              )}
              {/* Branche quiz : question + 4 options radio */}
              {block.type === "quiz" && (
                <div className="flex flex-col gap-2">
                  <input placeholder="Question..." className="w-full text-sm font-semibold text-gray-900 bg-transparent border-b border-gray-200 focus:border-primary focus:outline-none pb-1" />
                  {["Option A", "Option B", "Option C", "Option D"].map((opt) => (
                    <div key={opt} className="flex items-center gap-3">
                      <input type="radio" name={`quiz-${block.id}`} className="accent-primary" />
                      <input placeholder={opt} className="flex-1 text-sm text-gray-300 bg-gray-800 border border-white/10 rounded px-3 py-1.5 focus:outline-none focus:border-primary/50 transition-colors" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Bouton ajout rapide d'un bloc texte */}
          <button onClick={() => addBlock("text")}
            className="border-2 border-dashed border-white/10 rounded-xl p-6 text-sm text-gray-600 hover:border-primary/30 hover:text-primary/60 transition-colors w-full"
          >
            + Ajouter un bloc
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Éditeur MOOC ─────────────────────────────────────────────────────────────

/**
 * Éditeur de parcours MOOC avec sélection et ordonnancement de cours existants.
 * Le temps estimé est calculé automatiquement depuis la somme des durées.
 */
function MOOCEditor() {
  const [title,           setTitle]           = useState("Nouveau parcours MOOC");
  const [description,     setDescription]     = useState("");
  const [school,          setSchool]          = useState("Polytechnique");
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  /** Bascule l'état sélectionné/désélectionné d'un cours par ID. */
  function toggle(id: string) {
    setSelectedCourses((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  /** Réordonne un cours dans la séquence. Ignore les limites. */
  function move(id: string, dir: "up" | "down") {
    setSelectedCourses((prev) => {
      const i = prev.indexOf(id);
      if (dir === "up" && i === 0) return prev;
      if (dir === "down" && i === prev.length - 1) return prev;
      const n = [...prev];
      const j = dir === "up" ? i - 1 : i + 1;
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });
  }

  /** Cours dans l'ordre de la sélection. */
  const ordered = selectedCourses.map((id) => MOCK_COURSES.find((c) => c.id === id)).filter(Boolean) as typeof MOCK_COURSES;

  /** Durée totale en minutes (somme des durées des cours sélectionnés). */
  const totalMin = ordered.reduce((acc, c) => acc + c.duration, 0);

  return (
    <div className="flex gap-6">
      {/* Sélecteur de cours (sidebar scroll) */}
      <aside className="w-64 shrink-0">
        <div className="bg-white border border-gray-200 rounded-xl p-4 sticky top-24">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Cours disponibles
          </p>
          <div className="flex flex-col gap-2 max-h-[70vh] overflow-y-auto pr-1">
            {MOCK_COURSES.map((c) => {
              const selected = selectedCourses.includes(c.id);
              return (
                <button key={c.id} onClick={() => toggle(c.id)}
                  className={`text-left flex items-start gap-3 p-3 rounded-lg border transition-all ${
                    // Branche sélectionné : fond primary léger + bordure primary
                    selected ? "bg-primary/10 border-primary/30"
                    // Branche non sélectionné : fond transparent + hover
                    : "border-white/5 hover:border-white/20"
                  }`}
                >
                  <span className={`mt-0.5 shrink-0 w-4 h-4 rounded border flex items-center justify-center text-xs font-bold ${
                    selected ? "bg-primary border-primary text-white" : "border-white/20 text-transparent"
                  }`}>✓</span>
                  <div>
                    <p className={`text-xs font-semibold leading-tight ${selected ? "text-primary-light" : "text-gray-700"}`}>{c.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{Math.floor(c.duration / 60)}h · {c.level}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Formulaire + séquence */}
      <div className="flex-1 min-w-0 flex flex-col gap-5">
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre du parcours..."
          className="w-full text-2xl font-extrabold text-gray-900 bg-transparent border-b-2 border-gray-200 focus:border-primary focus:outline-none px-1 py-2 transition-colors"
        />

        <div className="bg-white border border-gray-200 rounded-xl p-5 grid grid-cols-2 gap-4">
          <Field label="École">
            <select value={school} onChange={(e) => setSchool(e.target.value)} className={SEL}>
              {SCHOOLS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          {/* Durée estimée en lecture seule (calculée automatiquement) */}
          <Field label="Durée estimée (auto)">
            <div className={`${INP} text-gray-400 bg-gray-800/50 cursor-default`}>
              {ordered.length > 0 ? `~${Math.floor(totalMin / 60)}h${totalMin % 60 > 0 ? `${totalMin % 60}min` : ""} · ${ordered.length} cours` : "Sélectionnez des cours"}
            </div>
          </Field>
          <div className="col-span-2">
            <Field label="Description">
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez ce parcours MOOC..." rows={3} className={TXA}
              />
            </Field>
          </div>
        </div>

        {/* Séquence ordonnée des cours sélectionnés */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-900 mb-4">
            Séquence du parcours
            {ordered.length > 0 && (
              <span className="text-xs text-gray-500 font-normal ml-2">
                {ordered.length} cours · {Math.floor(totalMin / 60)}h au total
              </span>
            )}
          </p>
          {/* Branche liste vide : message guide */}
          {ordered.length === 0 ? (
            <p className="text-sm text-gray-600 text-center py-10">
              Cochez des cours dans le panneau de gauche pour les ajouter au parcours.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {ordered.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3 bg-gray-800 border border-white/10 rounded-lg px-4 py-3">
                  {/* Numéro de position */}
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{c.title}</p>
                    <p className="text-xs text-gray-500">{c.school} · {Math.floor(c.duration / 60)}h · {c.level}</p>
                  </div>
                  {/* Contrôles déplacer + retirer */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => move(c.id, "up")}   className="text-xs text-gray-500 hover:text-white px-1.5 py-1 rounded hover:bg-white/5 transition-colors">↑</button>
                    <button onClick={() => move(c.id, "down")} className="text-xs text-gray-500 hover:text-white px-1.5 py-1 rounded hover:bg-white/5 transition-colors">↓</button>
                    <button onClick={() => toggle(c.id)}       className="text-xs text-danger hover:text-danger-dark px-1.5 py-1 rounded hover:bg-danger/5 transition-colors">×</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Éditeur de vidéo ─────────────────────────────────────────────────────────

/**
 * Éditeur de vidéo pédagogique avec préview de miniature en temps réel.
 *
 * `thumbSrc` :
 *   - Si `youtubeId` → URL YouTube `maxresdefault.jpg` (générée automatiquement).
 *   - Sinon si `thumbnailUrl` fourni → URL personnalisée.
 *   - Sinon `null` → placeholder gris.
 */
function VideoEditor() {
  const [title,        setTitle]        = useState("");
  const [youtubeId,    setYoutubeId]    = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [category,     setCategory]     = useState("IA & Data");
  const [school,       setSchool]       = useState("Polytechnique");
  const [duration,     setDuration]     = useState("");
  const [tags,         setTags]         = useState<string[]>([]);
  const [description,  setDescription]  = useState("");

  /**
   * Source de la miniature prévisualisée.
   * Priorité : YouTube > URL personnalisée > null.
   */
  const thumbSrc = youtubeId.trim()
    ? `https://img.youtube.com/vi/${youtubeId.trim()}/maxresdefault.jpg`
    : thumbnailUrl || null;

  return (
    <div className="flex gap-6">
      {/* Préview de la carte vidéo */}
      <aside className="w-72 shrink-0">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden sticky top-24">
          <div className="aspect-video bg-gray-800 flex items-center justify-center relative overflow-hidden">
            {/* Branche miniature disponible : afficher l'image */}
            {thumbSrc ? (
              <img src={thumbSrc} alt="Miniature" className="w-full h-full object-cover" />
            ) : (
              // Branche pas de miniature : placeholder ▶
              <div className="flex flex-col items-center gap-2 text-gray-700">
                <span className="text-4xl">▶</span>
                <span className="text-xs">Aperçu miniature</span>
              </div>
            )}
            {/* Durée en overlay si fournie */}
            {duration && (
              <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-mono">
                {duration}
              </span>
            )}
          </div>
          <div className="p-4">
            <p className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">{title || "Titre de la vidéo"}</p>
            <p className="text-xs text-gray-500 mb-2">{school} · {category}</p>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.slice(0, 3).map((t) => (
                  <span key={t} className="text-xs bg-white/5 border border-white/10 text-gray-400 px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-2 text-center">Aperçu de la carte vidéo</p>
      </aside>

      {/* Formulaire */}
      <div className="flex-1 min-w-0 flex flex-col gap-5">
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre de la vidéo..."
          className="w-full text-2xl font-extrabold text-gray-900 bg-transparent border-b-2 border-gray-200 focus:border-primary focus:outline-none px-1 py-2 transition-colors"
        />

        <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Catégorie">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={SEL}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="École">
              <select value={school} onChange={(e) => setSchool(e.target.value)} className={SEL}>
                {SCHOOLS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="ID YouTube" hint="ex : aircAruvnKk — génère la miniature automatiquement">
              <input value={youtubeId} onChange={(e) => setYoutubeId(e.target.value)}
                placeholder="aircAruvnKk" className={INP}
              />
            </Field>
            <Field label="Durée" hint="Format : mm:ss ou h:mm:ss">
              <input value={duration} onChange={(e) => setDuration(e.target.value)}
                placeholder="42:18" className={INP}
              />
            </Field>
          </div>
          <Field label="URL miniature personnalisée (optionnel — remplace YouTube)">
            <input value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://..." className={INP}
            />
          </Field>
          <Field label="Tags">
            <TagInput tags={tags} onChange={setTags} />
          </Field>
          <Field label="Description">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez le contenu pédagogique de cette vidéo..." rows={3} className={TXA}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

// ─── Éditeur d'application ────────────────────────────────────────────────────

/**
 * Éditeur d'application interactive avec aperçu de carte et validation d'URL.
 *
 * Validation URL :
 *   `validUrl` = `url.startsWith("http://") || url.startsWith("https://")`.
 *   Bordure verte si valide, rouge si présente mais invalide.
 */
function AppEditor() {
  const [title,       setTitle]       = useState("");
  const [url,         setUrl]         = useState("");
  const [description, setDescription] = useState("");
  const [school,      setSchool]      = useState("Polytechnique");
  const [tags,        setTags]        = useState<string[]>([]);

  /** `true` si l'URL commence par http:// ou https://. */
  const validUrl = url.startsWith("http://") || url.startsWith("https://");

  return (
    <div className="flex gap-6">
      {/* Aperçu de la carte app */}
      <aside className="w-72 shrink-0">
        <div className="bg-white border border-gray-200 rounded-xl p-5 sticky top-24">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Aperçu de la carte</p>
          <div className="bg-gray-800 border border-white/10 rounded-xl p-4 mb-3">
            <h4 className="font-bold text-white text-sm mb-1 line-clamp-1">
              {title || "Nom de l'application"}
            </h4>
            <p className="text-xs text-gray-500 mb-3 line-clamp-3">
              {description || "Description de l'application..."}
            </p>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {tags.slice(0, 3).map((t) => (
                  <span key={t} className="text-xs bg-white/5 border border-white/10 text-gray-400 px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-gray-600 border-t border-white/5 pt-2.5">
              <span>{school}</span>
              {/* Indicateur URL valide / manquante */}
              <span className={validUrl ? "text-primary font-medium" : "text-gray-700"}>
                {validUrl ? "Lancer →" : "URL manquante"}
              </span>
            </div>
          </div>
          {/* Lien de test de l'URL — visible seulement si URL valide */}
          {validUrl && (
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-xs text-primary hover:text-primary-light border border-primary/25 rounded-lg px-3 py-2 transition-colors"
            >
              Tester l'URL ↗
            </a>
          )}
        </div>
      </aside>

      {/* Formulaire */}
      <div className="flex-1 min-w-0 flex flex-col gap-5">
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Nom de l'application..."
          className="w-full text-2xl font-extrabold text-gray-900 bg-transparent border-b-2 border-gray-200 focus:border-primary focus:outline-none px-1 py-2 transition-colors"
        />

        <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4">
          <Field label="URL de l'application *" hint="Streamlit, Gradio, Observable, Colab, etc.">
            <input value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="https://mon-app.streamlit.app"
              className={`${INP} ${
                // Branche URL valide : bordure verte
                url && validUrl ? "border-green-500/40 focus:border-green-500/60"
                // Branche URL présente mais invalide : bordure rouge
                : url ? "border-danger/40" : ""
              }`}
            />
            {/* Message d'erreur si URL présente mais invalide */}
            {url && !validUrl && (
              <p className="text-xs text-danger mt-1">L'URL doit commencer par https://</p>
            )}
          </Field>
          <Field label="École">
            <select value={school} onChange={(e) => setSchool(e.target.value)} className={SEL}>
              {SCHOOLS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Tags">
            <TagInput tags={tags} onChange={setTags} />
          </Field>
          <Field label="Description">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez l'objectif et les fonctionnalités de cette application interactive..." rows={4} className={TXA}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

// ─── Studio IA ────────────────────────────────────────────────────────────────

/**
 * Interface Studio IA — liste des pipelines de génération automatique.
 * Chaque pipeline est une carte avec lien vers sa page dédiée.
 */
function AIStudio() {
  const pipelines = [
    {
      href: "/studio/excel-quiz",
      icon: "📊",
      title: "Excel → Quiz",
      desc: "Uploadez un fichier Excel et générez automatiquement un QCM structuré grâce à Claude.",
      badge: "Phase 3",
      badgeColor: "bg-primary/15 text-primary border-primary/20",
      cta: "Générer un quiz",
    },
    {
      href: "/studio/video-course",
      icon: "🎬",
      title: "Vidéo + Slides → Cours",
      desc: "Combinez une vidéo et un fichier PPTX/PDF pour générer un cours Markdown complet avec quiz intégrés.",
      badge: "Phase 4",
      badgeColor: "bg-primary/15 text-primary border-primary/20",
      cta: "Générer un cours",
    },
    {
      href: "/studio/ai-tools",
      icon: "🧠",
      title: "Outils IA (cours → ressources)",
      desc: "Depuis un contenu de cours, générez flashcards, carte mentale, fiche de révision ou FAQ.",
      badge: "Phase 11",
      badgeColor: "bg-primary/15 text-primary border-primary/20",
      cta: "Générer des ressources",
    },
  ];

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Studio de création IA</h2>
        <p className="text-sm text-gray-400">
          Générez automatiquement des contenus pédagogiques à partir de vos fichiers existants,
          grâce à Claude (Anthropic).
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {pipelines.map((p) => (
          <div key={p.href} className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 hover:border-primary/30 hover:shadow-card-hover transition-all">
            <div className="text-4xl">{p.icon}</div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-gray-900">{p.title}</h3>
                <span className={`text-xs font-medium border px-2 py-0.5 rounded-full ${p.badgeColor}`}>{p.badge}</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">{p.desc}</p>
            </div>
            <Link href={p.href} className="bg-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary-dark transition-colors text-center">
              {p.cta} →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page principale Studio ───────────────────────────────────────────────────

/**
 * Page principale Hi! Studio — interface de création de contenus pédagogiques.
 */
export default function StudioPage() {
  /** Mode de création actif — "course" par défaut. */
  const [mode,  setMode]  = useState<Mode>("course");

  /** `true` pendant 2.5s après une sauvegarde simulée. */
  const [saved, setSaved] = useState(false);

  /** Simule une sauvegarde avec feedback visuel 2.5s. */
  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-extrabold text-gray-900">Hi! Studio</h1>
            <span className="text-xs font-medium bg-primary/15 text-primary border border-primary/25 px-2.5 py-0.5 rounded-full">
              Enseignant
            </span>
          </div>
          {/* Description contextuelle selon le mode actif */}
          <p className="text-sm text-gray-400">
            {MODE_TABS.find((t) => t.key === mode)?.desc ?? "Créez et publiez des contenus pédagogiques"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Bouton prévisualisation — fonctionnel en V2 */}
          <button className="text-sm text-gray-600 border border-gray-200 hover:border-gray-300 hover:text-gray-900 px-4 py-2 rounded-lg transition-all shadow-sm">
            Prévisualiser
          </button>
          {/* Bouton sauvegarder avec feedback vert */}
          <button onClick={save}
            className={`text-sm border px-4 py-2 rounded-lg transition-all shadow-sm ${
              saved
                ? "border-emerald-500/40 text-emerald-700 bg-emerald-50"
                : "border-gray-200 hover:border-gray-300 text-gray-700"
            }`}
          >
            {saved ? "✓ Sauvegardé" : "Sauvegarder"}
          </button>
          {/* Bouton publier — appel API futur */}
          <button className="text-sm bg-danger text-white px-4 py-2 rounded-lg hover:bg-danger-dark transition-colors shadow-lg shadow-danger/20">
            Publier
          </button>
        </div>
      </div>

      {/* Sélecteur de mode */}
      <div className="flex gap-1.5 mb-8 bg-white border border-gray-200 rounded-2xl p-1.5 w-fit">
        {MODE_TABS.map((tab) => (
          <button key={tab.key} onClick={() => setMode(tab.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              // Branche mode actif : fond primary + ombre
              mode === tab.key
                ? "bg-primary text-white shadow-lg shadow-primary/25"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Éditeur selon le mode sélectionné */}
      {mode === "course" && <CourseEditor />}
      {mode === "mooc"   && <MOOCEditor />}
      {mode === "video"  && <VideoEditor />}
      {mode === "app"    && <AppEditor />}
      {mode === "ai"     && <AIStudio />}
    </div>
  );
}
