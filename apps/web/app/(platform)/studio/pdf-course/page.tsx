/**
 * @file (platform)/studio/pdf-course/page.tsx
 * @description Pipeline Studio « PDF → Cours » — génération en BLOCS structurés (LLM configuré, ex.
 * Mistral, + OCR Mistral pour les PDF-images), édition via un éditeur de blocs, puis stockage en base.
 */
"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Spinner } from "@/components/ui/Spinner";
import { StepBar } from "@/components/platform/StudioMarkdown";

type Block = { type: string; content: Record<string, unknown> };
interface Generated { title: string; blocks: Block[]; level: string; language: string; sources_used: string[]; }

type Step = "source" | "processing" | "edit" | "published";
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const cstr = (c: Record<string, unknown>, k: string) => (typeof c[k] === "string" ? (c[k] as string) : "");
const carr = (c: Record<string, unknown>, k: string) => (Array.isArray(c[k]) ? (c[k] as string[]) : []);
const cnum = (c: Record<string, unknown>, k: string) => (typeof c[k] === "number" ? (c[k] as number) : 0);

const BLOCK_LABEL: Record<string, string> = { heading: "Titre", text: "Texte", markdown: "Code / Markdown", quiz: "Quiz" };

function newBlock(type: string): Block {
  if (type === "quiz") return { type, content: { question: "", options: ["", "", "", ""], answer: 0, explanation: "" } };
  if (type === "heading") return { type, content: { content: "Nouveau titre" } };
  return { type, content: { content: "" } };
}

export default function PdfCoursePage() {
  const [step, setStep] = useState<Step>("source");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState("intermediate");
  const [language, setLanguage] = useState("fr");
  const [nSections, setNSections] = useState(5);

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [editedTitle, setEditedTitle] = useState("");
  const [sources, setSources] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [processingMsg, setProcessingMsg] = useState("Extraction du PDF…");
  const [publishCategory, setPublishCategory] = useState("IA & Data");
  const [publishSchool, setPublishSchool] = useState("");
  const [accessLevel, setAccessLevel] = useState("public");
  const [publishedId, setPublishedId] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const stepIndex: Record<Step, number> = { source: 0, processing: 1, edit: 2, published: 3 };

  function pickFile(f: File | null) {
    setError("");
    if (f && !f.name.toLowerCase().endsWith(".pdf")) { setError("Un fichier PDF (.pdf) est requis."); return; }
    if (f && f.size > 25 * 1024 * 1024) { setError("PDF trop volumineux (max 25 Mo)."); return; }
    setFile(f);
    if (f && !title.trim()) setTitle(f.name.replace(/\.pdf$/i, ""));
  }

  // ── Édition de blocs ────────────────────────────────────────────────────────
  function setBlock(i: number, content: Record<string, unknown>) {
    setBlocks((bs) => bs.map((b, idx) => (idx === i ? { ...b, content } : b)));
  }
  function moveBlock(i: number, dir: -1 | 1) {
    setBlocks((bs) => {
      const j = i + dir;
      if (j < 0 || j >= bs.length) return bs;
      const copy = [...bs];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }
  function deleteBlock(i: number) { setBlocks((bs) => bs.filter((_, idx) => idx !== i)); }
  function addBlock(type: string) { setBlocks((bs) => [...bs, newBlock(type)]); }

  async function generate() {
    if (!file || !title.trim()) return;
    setError("");
    setStep("processing");
    const msgs = ["Extraction du texte du PDF…", "OCR si nécessaire…", "Génération du cours (Mistral)…", "Structuration en blocs…", "Finalisation…"];
    let idx = 0;
    const interval = setInterval(() => { idx = (idx + 1) % msgs.length; setProcessingMsg(msgs[idx]); }, 2500);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("title", title.trim());
      form.append("level", level);
      form.append("language", language);
      form.append("n_sections", String(nSections));
      const res = await fetch(`${API}/api/v1/studio/pdf-to-course`, { method: "POST", credentials: "include", body: form });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: "Erreur serveur" }));
        throw new Error(body.detail ?? "Erreur lors de la génération");
      }
      const data: Generated = await res.json();
      setBlocks(data.blocks || []);
      setEditedTitle(data.title);
      setSources(data.sources_used || []);
      setStep("edit");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      setStep("source");
    } finally {
      clearInterval(interval);
    }
  }

  async function publish() {
    const res = await fetch(`${API}/api/v1/studio/save-course`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editedTitle, level, language, blocks,
        category: publishCategory, school: publishSchool || undefined, access_level: accessLevel,
      }),
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      setPublishedId(data.course_id ?? null);
      setStep("published");
    } else {
      const body = await res.json().catch(() => ({ detail: "Erreur" }));
      setError(body.detail ?? "Échec de la publication");
    }
  }

  const inp = "w-full bg-gray-800 border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-primary/50 placeholder-gray-600";

  return (
    <div className="bg-navy min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/studio" className="text-gray-500 hover:text-white transition-colors text-sm">← Studio</Link>
          <span className="text-gray-700">/</span>
          <h1 className="text-xl font-bold text-white">PDF → Cours</h1>
          <span className="text-xs bg-primary/15 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-medium">IA</span>
        </div>

        <StepBar current={stepIndex[step]} />

        {/* ── Étape 1 : Source ── */}
        {step === "source" && (
          <div className="max-w-2xl space-y-6">
            {error && <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-xl px-4 py-3">{error}</div>}
            <div>
              <label className="block text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1.5">Titre du cours *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ex: Introduction au Deep Learning" className={inp} />
            </div>
            <div className="bg-gray-900 border border-white/10 rounded-2xl p-5">
              <p className="text-sm font-semibold text-white mb-3">Document PDF *</p>
              <div onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${file ? "border-primary/50 bg-primary/5" : "border-white/10 hover:border-white/20"}`}>
                <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={(e) => pickFile(e.target.files?.[0] ?? null)} />
                <div className="text-3xl mb-2">📄</div>
                {file ? <p className="text-sm text-white">{file.name} <span className="text-gray-500">({(file.size / 1024 / 1024).toFixed(1)} Mo)</span></p>
                     : <p className="text-sm text-gray-500">Cliquez pour choisir un PDF · 25 Mo max</p>}
              </div>
              <p className="text-xs text-gray-600 mt-2">PDF texte ou PDF-image (OCR Mistral automatique si nécessaire).</p>
            </div>
            <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1.5">Niveau</label>
                <select value={level} onChange={(e) => setLevel(e.target.value)} className={inp}>
                  <option value="beginner">Débutant</option><option value="intermediate">Intermédiaire</option><option value="advanced">Avancé</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1.5">Langue</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className={inp}>
                  <option value="fr">Français</option><option value="en">Anglais</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1.5">Nombre de sections : <span className="text-white font-bold">{nSections}</span></label>
                <input type="range" min={2} max={12} value={nSections} onChange={(e) => setNSections(Number(e.target.value))} className="w-full accent-primary" />
              </div>
            </div>
            <button onClick={generate} disabled={!file || !title.trim()}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-40 shadow-lg shadow-primary/20">
              ✨ Générer le cours avec l'IA
            </button>
          </div>
        )}

        {/* ── Étape 2 : Traitement ── */}
        {step === "processing" && (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <Spinner size="lg" />
            <p className="text-lg font-bold text-white">{processingMsg}</p>
            <div className="text-xs text-gray-700 bg-gray-900 border border-white/5 rounded-xl px-4 py-3 text-center max-w-sm space-y-1">
              <p>Extraction : <span className="text-gray-400">pdfplumber + OCR Mistral</span></p>
              <p>Génération : <span className="text-gray-400">provider LLM configuré (ex. Mistral)</span></p>
            </div>
          </div>
        )}

        {/* ── Étape 3 : Éditeur de blocs ── */}
        {step === "edit" && (
          <div className="space-y-4">
            {sources.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap text-xs text-gray-600">
                <span>Sources :</span>
                {sources.map((s) => <span key={s} className="bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-gray-400">{s}</span>)}
              </div>
            )}
            {error && <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-xl px-4 py-3">{error}</div>}

            <input value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)}
              className="w-full text-xl font-extrabold text-white bg-transparent border-b border-white/10 focus:border-primary focus:outline-none pb-1" />

            {/* Blocs */}
            <div className="space-y-3">
              {blocks.map((b, i) => (
                <div key={i} className="bg-gray-900 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">{BLOCK_LABEL[b.type] ?? b.type}</span>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <button onClick={() => moveBlock(i, -1)} className="hover:text-white px-1" title="Monter">↑</button>
                      <button onClick={() => moveBlock(i, 1)} className="hover:text-white px-1" title="Descendre">↓</button>
                      <button onClick={() => deleteBlock(i)} className="hover:text-danger px-1" title="Supprimer">✕</button>
                    </div>
                  </div>

                  {b.type === "heading" && (
                    <input value={cstr(b.content, "content")} onChange={(e) => setBlock(i, { ...b.content, content: e.target.value })} className={inp} placeholder="Titre de section" />
                  )}
                  {(b.type === "text" || b.type === "markdown") && (
                    <textarea value={cstr(b.content, "content")} onChange={(e) => setBlock(i, { ...b.content, content: e.target.value })}
                      rows={b.type === "markdown" ? 4 : 3} className={`${inp} ${b.type === "markdown" ? "font-mono text-xs" : ""}`} placeholder={b.type === "markdown" ? "```python ...```" : "Paragraphe…"} />
                  )}
                  {b.type === "quiz" && (
                    <div className="space-y-2">
                      <input value={cstr(b.content, "question")} onChange={(e) => setBlock(i, { ...b.content, question: e.target.value })} className={inp} placeholder="Question" />
                      {carr(b.content, "options").map((opt, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <input type="radio" checked={cnum(b.content, "answer") === j} onChange={() => setBlock(i, { ...b.content, answer: j })} className="accent-primary" title="Bonne réponse" />
                          <input value={opt} onChange={(e) => { const o = [...carr(b.content, "options")]; o[j] = e.target.value; setBlock(i, { ...b.content, options: o }); }}
                            className={inp} placeholder={`Option ${String.fromCharCode(65 + j)}`} />
                        </div>
                      ))}
                      <textarea value={cstr(b.content, "explanation")} onChange={(e) => setBlock(i, { ...b.content, explanation: e.target.value })} rows={2} className={inp} placeholder="Explication (affichée après réponse)" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Ajouter un bloc */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-gray-500">Ajouter :</span>
              {["heading", "text", "markdown", "quiz"].map((t) => (
                <button key={t} onClick={() => addBlock(t)} className="border border-white/10 text-gray-300 px-3 py-1.5 rounded-lg hover:bg-white/5 hover:text-white transition-all">+ {BLOCK_LABEL[t]}</button>
              ))}
            </div>

            {/* Publication */}
            <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1.5">Catégorie</label>
                <select value={publishCategory} onChange={(e) => setPublishCategory(e.target.value)} className={inp}>
                  {["IA & Data", "Mathématiques", "Programmation", "Statistiques", "Finance", "DevOps", "Société & Éthique"].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1.5">École (optionnel)</label>
                <select value={publishSchool} onChange={(e) => setPublishSchool(e.target.value)} className={inp}>
                  <option value="">— Sélectionner —</option>
                  {["École Polytechnique", "Télécom Paris", "HEC Paris", "ENSAE Paris", "Hi! PARIS"].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1.5">Niveau d'accès</label>
                <select value={accessLevel} onChange={(e) => setAccessLevel(e.target.value)} className={inp}>
                  <option value="public">Ouvert — tous (base simple)</option>
                  <option value="hiparis">Hi! PARIS — élèves</option>
                  <option value="cohort">Cohorte — réservé (à assigner via le LMS)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep("source")} className="border border-white/10 text-gray-400 px-5 py-2.5 rounded-xl text-sm hover:text-white hover:border-white/30 transition-all">← Recommencer</button>
              <button onClick={publish} disabled={blocks.length === 0} className="flex-1 bg-danger text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-danger-dark transition-colors disabled:opacity-40 shadow-lg shadow-danger/20">Publier le cours →</button>
            </div>
          </div>
        )}

        {/* ── Étape 4 : Publié ── */}
        {step === "published" && (
          <div className="flex flex-col items-center text-center py-16 gap-6">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-3xl">✓</div>
            <div>
              <h2 className="text-2xl font-extrabold text-white mb-2">Cours publié !</h2>
              <p className="text-gray-400 text-sm"><strong className="text-white">{editedTitle}</strong></p>
            </div>
            <div className="flex gap-3 flex-wrap justify-center">
              {publishedId && <Link href={`/courses/${publishedId}`} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm hover:bg-emerald-700 transition-colors">Voir le cours →</Link>}
              <Link href="/studio" className="border border-white/10 text-gray-300 px-5 py-2.5 rounded-xl text-sm hover:bg-white/5 transition-colors">Retour au Studio</Link>
              <button onClick={() => { setStep("source"); setBlocks([]); setTitle(""); setFile(null); setPublishedId(null); }}
                className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm hover:bg-primary-dark transition-colors">Créer un autre cours</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
