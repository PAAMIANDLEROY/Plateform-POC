"use client";

import { useState } from "react";
import { MOCK_COURSES } from "@/lib/mock";

// ─── Types & constants ────────────────────────────────────────────────────────

type Mode = "course" | "mooc" | "video" | "app";

const SCHOOLS = ["Polytechnique", "Télécom Paris", "ENSAE", "HEC", "IP Paris"];
const CATEGORIES = ["IA & Data", "Mathématiques", "Finance", "Programmation", "Statistiques", "DevOps"];
const LEVELS = ["Débutant", "Intermédiaire", "Avancé"];

const BLOCK_TYPES = [
  { type: "heading", label: "Titre",  icon: "H"  },
  { type: "text",    label: "Texte",  icon: "¶"  },
  { type: "code",    label: "Code",   icon: "<>" },
  { type: "quiz",    label: "Quiz",   icon: "?"  },
  { type: "video",   label: "Vidéo",  icon: "▶"  },
  { type: "image",   label: "Image",  icon: "🖼" },
];

const MODE_TABS: { key: Mode; label: string; icon: string; desc: string }[] = [
  { key: "course", label: "Cours",        icon: "📖", desc: "Cours interactif par blocs" },
  { key: "mooc",   label: "MOOC",         icon: "🎓", desc: "Parcours multi-cours" },
  { key: "video",  label: "Vidéo",        icon: "▶",  desc: "Vidéo pédagogique" },
  { key: "app",    label: "Application",  icon: "⚡", desc: "App interactive" },
];

// ─── Shared UI helpers ────────────────────────────────────────────────────────

const INP = "w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors";
const SEL = "w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors";
const TXA = `${INP} resize-none`;

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

function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState("");
  function add(e: React.KeyboardEvent) {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
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

// ─── Course Editor ────────────────────────────────────────────────────────────

function CourseEditor() {
  const [blocks, setBlocks] = useState([
    { id: 1, type: "heading", content: "Introduction" },
    { id: 2, type: "text",    content: "Bienvenue dans ce cours..." },
  ]);
  const [title,    setTitle]    = useState("Nouveau cours");
  const [category, setCategory] = useState("IA & Data");
  const [level,    setLevel]    = useState("Débutant");
  const [school,   setSchool]   = useState("Polytechnique");

  function addBlock(type: string) { setBlocks((b) => [...b, { id: Date.now(), type, content: "" }]); }
  function removeBlock(id: number) { setBlocks((b) => b.filter((bl) => bl.id !== id)); }
  function move(id: number, dir: "up" | "down") {
    setBlocks((b) => {
      const i = b.findIndex((bl) => bl.id === id);
      if (dir === "up" && i === 0) return b;
      if (dir === "down" && i === b.length - 1) return b;
      const n = [...b];
      const j = dir === "up" ? i - 1 : i + 1;
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });
  }

  return (
    <div className="flex gap-6">
      {/* Block palette */}
      <aside className="w-48 shrink-0">
        <div className="bg-gray-900 border border-white/10 rounded-xl p-4 sticky top-24">
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

      {/* Main editor */}
      <div className="flex-1 min-w-0">
        {/* Metadata */}
        <div className="bg-gray-900 border border-white/10 rounded-xl p-5 mb-4 grid grid-cols-3 gap-4">
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

        {/* Title */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre du cours..."
          className="w-full text-2xl font-extrabold text-white bg-transparent border-b-2 border-white/10 focus:border-primary focus:outline-none px-1 py-2 mb-5 transition-colors"
        />

        {/* Blocks */}
        <div className="flex flex-col gap-3">
          {blocks.map((block) => (
            <div key={block.id} className="bg-gray-900 border border-white/10 rounded-xl p-4 group">
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

              {block.type === "heading" && (
                <input defaultValue={block.content} placeholder="Titre de section..."
                  className="w-full text-lg font-bold text-white bg-transparent border-b border-white/10 focus:border-primary focus:outline-none pb-1 transition-colors"
                />
              )}
              {(block.type === "text" || block.type === "video" || block.type === "image") && (
                <textarea defaultValue={block.content} rows={3}
                  placeholder={block.type === "text" ? "Contenu texte..." : block.type === "video" ? "URL ou ID YouTube..." : "URL de l'image..."}
                  className="w-full text-sm text-gray-300 bg-gray-800 border border-white/10 rounded-lg p-3 focus:outline-none focus:border-primary/50 resize-none transition-colors"
                />
              )}
              {block.type === "code" && (
                <textarea defaultValue="```python\n# Votre code ici\n```" rows={5}
                  className="w-full text-sm font-mono text-green-400 bg-gray-950 border border-white/10 rounded-lg p-3 focus:outline-none resize-none"
                />
              )}
              {block.type === "quiz" && (
                <div className="flex flex-col gap-2">
                  <input placeholder="Question..." className="w-full text-sm font-semibold text-white bg-transparent border-b border-white/10 focus:border-primary focus:outline-none pb-1" />
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

// ─── MOOC Editor ──────────────────────────────────────────────────────────────

function MOOCEditor() {
  const [title,           setTitle]           = useState("Nouveau parcours MOOC");
  const [description,     setDescription]     = useState("");
  const [school,          setSchool]          = useState("Polytechnique");
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  function toggle(id: string) {
    setSelectedCourses((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }
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

  const ordered = selectedCourses.map((id) => MOCK_COURSES.find((c) => c.id === id)).filter(Boolean) as typeof MOCK_COURSES;
  const totalMin = ordered.reduce((acc, c) => acc + c.duration, 0);

  return (
    <div className="flex gap-6">
      {/* Course picker */}
      <aside className="w-64 shrink-0">
        <div className="bg-gray-900 border border-white/10 rounded-xl p-4 sticky top-24">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Cours disponibles
          </p>
          <div className="flex flex-col gap-2 max-h-[70vh] overflow-y-auto pr-1">
            {MOCK_COURSES.map((c) => {
              const selected = selectedCourses.includes(c.id);
              return (
                <button key={c.id} onClick={() => toggle(c.id)}
                  className={`text-left flex items-start gap-3 p-3 rounded-lg border transition-all ${
                    selected ? "bg-primary/10 border-primary/30" : "border-white/5 hover:border-white/20"
                  }`}
                >
                  <span className={`mt-0.5 shrink-0 w-4 h-4 rounded border flex items-center justify-center text-xs font-bold ${
                    selected ? "bg-primary border-primary text-white" : "border-white/20 text-transparent"
                  }`}>✓</span>
                  <div>
                    <p className={`text-xs font-semibold leading-tight ${selected ? "text-primary-light" : "text-gray-300"}`}>{c.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{Math.floor(c.duration / 60)}h · {c.level}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Form */}
      <div className="flex-1 min-w-0 flex flex-col gap-5">
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre du parcours..."
          className="w-full text-2xl font-extrabold text-white bg-transparent border-b-2 border-white/10 focus:border-primary focus:outline-none px-1 py-2 transition-colors"
        />

        <div className="bg-gray-900 border border-white/10 rounded-xl p-5 grid grid-cols-2 gap-4">
          <Field label="École">
            <select value={school} onChange={(e) => setSchool(e.target.value)} className={SEL}>
              {SCHOOLS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
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

        {/* Sequenced courses */}
        <div className="bg-gray-900 border border-white/10 rounded-xl p-5">
          <p className="text-sm font-semibold text-white mb-4">
            Séquence du parcours
            {ordered.length > 0 && (
              <span className="text-xs text-gray-500 font-normal ml-2">
                {ordered.length} cours · {Math.floor(totalMin / 60)}h au total
              </span>
            )}
          </p>
          {ordered.length === 0 ? (
            <p className="text-sm text-gray-600 text-center py-10">
              Cochez des cours dans le panneau de gauche pour les ajouter au parcours.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {ordered.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3 bg-gray-800 border border-white/10 rounded-lg px-4 py-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{c.title}</p>
                    <p className="text-xs text-gray-500">{c.school} · {Math.floor(c.duration / 60)}h · {c.level}</p>
                  </div>
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

// ─── Video Editor ─────────────────────────────────────────────────────────────

function VideoEditor() {
  const [title,        setTitle]        = useState("");
  const [youtubeId,    setYoutubeId]    = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [category,     setCategory]     = useState("IA & Data");
  const [school,       setSchool]       = useState("Polytechnique");
  const [duration,     setDuration]     = useState("");
  const [tags,         setTags]         = useState<string[]>([]);
  const [description,  setDescription]  = useState("");

  const thumbSrc = youtubeId.trim()
    ? `https://img.youtube.com/vi/${youtubeId.trim()}/maxresdefault.jpg`
    : thumbnailUrl || null;

  return (
    <div className="flex gap-6">
      {/* Live preview */}
      <aside className="w-72 shrink-0">
        <div className="bg-gray-900 border border-white/10 rounded-xl overflow-hidden sticky top-24">
          <div className="aspect-video bg-gray-800 flex items-center justify-center relative overflow-hidden">
            {thumbSrc ? (
              <img src={thumbSrc} alt="Miniature" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-700">
                <span className="text-4xl">▶</span>
                <span className="text-xs">Aperçu miniature</span>
              </div>
            )}
            {duration && (
              <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-mono">
                {duration}
              </span>
            )}
          </div>
          <div className="p-4">
            <p className="text-sm font-semibold text-white line-clamp-2 mb-1">{title || "Titre de la vidéo"}</p>
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

      {/* Form */}
      <div className="flex-1 min-w-0 flex flex-col gap-5">
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre de la vidéo..."
          className="w-full text-2xl font-extrabold text-white bg-transparent border-b-2 border-white/10 focus:border-primary focus:outline-none px-1 py-2 transition-colors"
        />

        <div className="bg-gray-900 border border-white/10 rounded-xl p-5 flex flex-col gap-4">
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

// ─── App Editor ───────────────────────────────────────────────────────────────

function AppEditor() {
  const [title,       setTitle]       = useState("");
  const [url,         setUrl]         = useState("");
  const [description, setDescription] = useState("");
  const [school,      setSchool]      = useState("Polytechnique");
  const [tags,        setTags]        = useState<string[]>([]);

  const validUrl = url.startsWith("http://") || url.startsWith("https://");

  return (
    <div className="flex gap-6">
      {/* Card preview */}
      <aside className="w-72 shrink-0">
        <div className="bg-gray-900 border border-white/10 rounded-xl p-5 sticky top-24">
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
              <span className={validUrl ? "text-primary font-medium" : "text-gray-700"}>
                {validUrl ? "Lancer →" : "URL manquante"}
              </span>
            </div>
          </div>
          {validUrl && (
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-xs text-primary hover:text-primary-light border border-primary/25 rounded-lg px-3 py-2 transition-colors"
            >
              Tester l'URL ↗
            </a>
          )}
        </div>
      </aside>

      {/* Form */}
      <div className="flex-1 min-w-0 flex flex-col gap-5">
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Nom de l'application..."
          className="w-full text-2xl font-extrabold text-white bg-transparent border-b-2 border-white/10 focus:border-primary focus:outline-none px-1 py-2 transition-colors"
        />

        <div className="bg-gray-900 border border-white/10 rounded-xl p-5 flex flex-col gap-4">
          <Field label="URL de l'application *" hint="Streamlit, Gradio, Observable, Colab, etc.">
            <input value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="https://mon-app.streamlit.app"
              className={`${INP} ${url && validUrl ? "border-green-500/40 focus:border-green-500/60" : url ? "border-danger/40" : ""}`}
            />
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

// ─── Main Studio page ─────────────────────────────────────────────────────────

export default function StudioPage() {
  const [mode,  setMode]  = useState<Mode>("course");
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-extrabold text-white">Hi! Studio</h1>
            <span className="text-xs font-medium bg-primary/15 text-primary border border-primary/25 px-2.5 py-0.5 rounded-full">
              Enseignant
            </span>
          </div>
          <p className="text-sm text-gray-400">
            {MODE_TABS.find((t) => t.key === mode)?.desc ?? "Créez et publiez des contenus pédagogiques"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-sm text-gray-400 border border-white/10 hover:border-white/30 hover:text-white px-4 py-2 rounded-lg transition-all">
            Prévisualiser
          </button>
          <button onClick={save}
            className={`text-sm border px-4 py-2 rounded-lg transition-all ${
              saved
                ? "border-green-500/40 text-green-400 bg-green-500/10"
                : "border-white/10 hover:border-white/30 text-white"
            }`}
          >
            {saved ? "✓ Sauvegardé" : "Sauvegarder"}
          </button>
          <button className="text-sm bg-danger text-white px-4 py-2 rounded-lg hover:bg-danger-dark transition-colors shadow-lg shadow-danger/20">
            Publier
          </button>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1.5 mb-8 bg-gray-900 border border-white/10 rounded-2xl p-1.5 w-fit">
        {MODE_TABS.map((tab) => (
          <button key={tab.key} onClick={() => setMode(tab.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              mode === tab.key
                ? "bg-primary text-white shadow-lg shadow-primary/25"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Editor */}
      {mode === "course" && <CourseEditor />}
      {mode === "mooc"   && <MOOCEditor />}
      {mode === "video"  && <VideoEditor />}
      {mode === "app"    && <AppEditor />}
    </div>
  );
}
