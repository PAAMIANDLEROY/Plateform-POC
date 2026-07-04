/**
 * @file (platform)/studio/pdf-course/page.tsx
 * @description Pipeline Studio « PDF → Cours Markdown » (boosté par le provider LLM configuré, ex. Mistral).
 *
 * Flux : upload PDF + titre → génération (`POST /studio/pdf-to-course`) → édition markdown → publication.
 */
"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Spinner } from "@/components/ui/Spinner";
import { StepBar, MarkdownPreview } from "@/components/platform/StudioMarkdown";

interface GeneratedCourse {
  title: string;
  content: string;
  level: string;
  language: string;
  sources_used: string[];
}

type Step = "source" | "processing" | "edit" | "published";
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function PdfCoursePage() {
  const [step, setStep] = useState<Step>("source");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState("intermediate");
  const [language, setLanguage] = useState("fr");
  const [nSections, setNSections] = useState(5);

  const [course, setCourse] = useState<GeneratedCourse | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [editedTitle, setEditedTitle] = useState("");
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

  async function generate() {
    if (!file || !title.trim()) return;
    setError("");
    setStep("processing");
    const msgs = ["Extraction du texte du PDF…", "Analyse du contenu…", "Génération du cours (Mistral)…", "Structuration en markdown…", "Finalisation…"];
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
      const data: GeneratedCourse = await res.json();
      setCourse(data);
      setEditedContent(data.content);
      setEditedTitle(data.title);
      setStep("edit");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      setStep("source");
    } finally {
      clearInterval(interval);
    }
  }

  async function publish() {
    if (!course) return;
    const res = await fetch(`${API}/api/v1/studio/save-course`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editedTitle, content: editedContent, level: course.level, language: course.language,
        category: publishCategory, school: publishSchool || undefined, access_level: accessLevel,
      }),
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      setPublishedId(data.course_id ?? null);
      setStep("published");
    }
  }

  return (
    <div className="bg-navy min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/studio" className="text-gray-500 hover:text-white transition-colors text-sm">← Studio</Link>
          <span className="text-gray-700">/</span>
          <h1 className="text-xl font-bold text-white">PDF → Cours</h1>
          <span className="text-xs bg-primary/15 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-medium">IA</span>
        </div>

        <StepBar current={stepIndex[step]} />

        {/* ── Étape 1 : Source PDF ── */}
        {step === "source" && (
          <div className="max-w-2xl space-y-6">
            {error && <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-xl px-4 py-3">{error}</div>}

            <div>
              <label className="block text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1.5">Titre du cours *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ex: Introduction au Deep Learning"
                className="w-full bg-gray-900 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/50 placeholder-gray-600" />
            </div>

            <div className="bg-gray-900 border border-white/10 rounded-2xl p-5">
              <p className="text-sm font-semibold text-white mb-3">Document PDF *</p>
              <div onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  file ? "border-primary/50 bg-primary/5" : "border-white/10 hover:border-white/20"
                }`}>
                <input ref={fileRef} type="file" accept=".pdf" className="hidden"
                  onChange={(e) => pickFile(e.target.files?.[0] ?? null)} />
                <div className="text-3xl mb-2">📄</div>
                {file
                  ? <p className="text-sm text-white">{file.name} <span className="text-gray-500">({(file.size / 1024 / 1024).toFixed(1)} Mo)</span></p>
                  : <p className="text-sm text-gray-500">Cliquez pour choisir un PDF · 25 Mo max · texte extrait automatiquement</p>}
              </div>
              <p className="text-xs text-gray-600 mt-2">Astuce : un PDF « texte » (pas scanné) donne les meilleurs résultats. L'OCR n'est pas géré ici.</p>
            </div>

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
              <div className="col-span-2">
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1.5">
                  Nombre de sections : <span className="text-white font-bold">{nSections}</span>
                </label>
                <input type="range" min={2} max={12} value={nSections} onChange={(e) => setNSections(Number(e.target.value))} className="w-full accent-primary" />
              </div>
            </div>

            <button onClick={generate} disabled={!file || !title.trim()}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary/20">
              ✨ Générer le cours avec l'IA
            </button>
          </div>
        )}

        {/* ── Étape 2 : Traitement ── */}
        {step === "processing" && (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <Spinner size="lg" />
            <div className="text-center">
              <p className="text-lg font-bold text-white mb-1">{processingMsg}</p>
              <p className="text-sm text-gray-500">Extraction PDF + génération LLM</p>
            </div>
            <div className="text-xs text-gray-700 bg-gray-900 border border-white/5 rounded-xl px-4 py-3 text-center max-w-sm space-y-1">
              <p>Extraction : <span className="text-gray-400">pdfplumber</span></p>
              <p>Génération : <span className="text-gray-400">provider LLM configuré (ex. Mistral)</span></p>
              <p>Durée estimée : <span className="text-gray-400">20–60 secondes</span></p>
            </div>
          </div>
        )}

        {/* ── Étape 3 : Édition ── */}
        {step === "edit" && course && (
          <div className="space-y-4">
            {course.sources_used.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap text-xs text-gray-600">
                <span>Source :</span>
                {course.sources_used.map((s) => (
                  <span key={s} className="bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-gray-400">{s}</span>
                ))}
              </div>
            )}
            <input value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)}
              className="w-full text-xl font-extrabold text-white bg-transparent border-b border-white/10 focus:border-primary focus:outline-none pb-1 transition-colors" />

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
              <div className="col-span-2">
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1.5">Niveau d'accès</label>
                <select value={accessLevel} onChange={(e) => setAccessLevel(e.target.value)}
                  className="w-full bg-gray-800 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-primary/50">
                  <option value="public">Ouvert — tous (base simple)</option>
                  <option value="hiparis">Hi! PARIS — élèves (domaine autorisé)</option>
                  <option value="cohort">Cohorte — réservé (à assigner ensuite via le LMS)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep("source")} className="border border-white/10 text-gray-400 px-5 py-2.5 rounded-xl text-sm hover:text-white hover:border-white/30 transition-all">← Recommencer</button>
              <button onClick={publish} className="flex-1 bg-danger text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-danger-dark transition-colors shadow-lg shadow-danger/20">Publier le cours →</button>
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
              {publishedId && (
                <Link href={`/courses/view?id=${publishedId}`} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm hover:bg-emerald-700 transition-colors">Voir le cours →</Link>
              )}
              <Link href="/studio" className="border border-white/10 text-gray-300 px-5 py-2.5 rounded-xl text-sm hover:bg-white/5 transition-colors">Retour au Studio</Link>
              <button onClick={() => { setStep("source"); setCourse(null); setTitle(""); setFile(null); setPublishedId(null); }}
                className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm hover:bg-primary-dark transition-colors">Créer un autre cours</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
