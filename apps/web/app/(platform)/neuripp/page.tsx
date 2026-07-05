/**
 * @file (platform)/neuripp/page.tsx
 * @description NeuriPP — Appel à soumissions (track « Outils EdTech »).
 *
 * Formulaire de soumission d'un projet EdTech : repo GitHub, page projet, licence,
 * démo, catégorie d'usage, périmètre, type de modèle, consentement aux règles,
 * auteurs, + pièce jointe optionnelle (< 10 Mo, Supabase Storage via le backend).
 *
 * Réservé aux comptes authentifiés (hors visiteur). Les admins voient les soumissions reçues.
 *
 * Accessible depuis le menu « Hi! PARIS Education » de la barre de navigation.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { submissionsApi, SubmissionEntry, ApiError } from "@/lib/api";
import EditableBlock from "@/components/platform/EditableBlock";

const MAX_SIZE = 1 * 1024 * 1024;
const SUBMIT_ROLES = ["student", "teacher", "admin", "super_admin"];
const ADMIN_ROLES = ["admin", "super_admin"];

const USAGE_OPTIONS = [
  { value: "tuteur_personnalise", label: "Tuteur personnalisé" },
  { value: "revision", label: "Révision" },
  { value: "contenus_interactifs", label: "Construction de contenus interactifs" },
  { value: "assistance_correction", label: "Assistance à la correction" },
  { value: "apprendre_avec_ia", label: "Apprendre avec et malgré l'IA" },
  { value: "qcm_automatiques", label: "QCM automatiques" },
];
const USAGE_LABELS: Record<string, string> = Object.fromEntries(USAGE_OPTIONS.map((o) => [o.value, o.label]));
const LICENSES = ["MIT", "Apache-2.0", "GPL-3.0", "AGPL-3.0", "CC BY 4.0", "Autre"];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

const EMPTY = {
  project_name: "", repo_url: "", pages_url: "", demo_url: "", license: "",
  usage_category: "", domain_scope: "all", domain_detail: "", model_type: "",
  authors: "", description: "",
};

export default function NeuriPPSubmitPage() {
  const { user, loading } = useAuth();
  const canSubmit = !!user && SUBMIT_ROLES.includes(user.role);
  const isAdmin = !!user && ADMIN_ROLES.includes(user.role);

  const [form, setForm] = useState({ ...EMPTY });
  const [consent, setConsent] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [submissions, setSubmissions] = useState<SubmissionEntry[]>([]);

  const loadSubmissions = useCallback(async () => {
    try { setSubmissions(await submissionsApi.list()); } catch { setSubmissions([]); }
  }, []);

  useEffect(() => {
    if (isAdmin) loadSubmissions();
  }, [isAdmin, loadSubmissions]);

  function set<K extends keyof typeof form>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > MAX_SIZE) {
      setError(`Pièce jointe trop volumineuse (${formatSize(f.size)}). Maximum : 1 Mo.`);
      setFile(null);
      return;
    }
    setFile(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.project_name.trim() || !form.repo_url.trim() || !form.usage_category) {
      setError("Nom du projet, lien du repo et catégorie d'usage sont requis.");
      return;
    }
    if (!consent) {
      setError("Vous devez confirmer le respect des règles (consentement de l'enseignant).");
      return;
    }
    setSubmitting(true);
    try {
      const created = await submissionsApi.create(
        {
          project_name: form.project_name.trim(),
          repo_url: form.repo_url.trim(),
          usage_category: form.usage_category,
          rules_consent: true,
          pages_url: form.pages_url.trim() || undefined,
          demo_url: form.demo_url.trim() || undefined,
          license: form.license || undefined,
          domain_scope: form.domain_scope,
          domain_detail: form.domain_scope === "specific" ? form.domain_detail.trim() || undefined : undefined,
          model_type: form.model_type || undefined,
          authors: form.authors.trim() || undefined,
          description: form.description.trim() || undefined,
        },
        file,
      );
      setSuccess(`Projet « ${created.project_name} » soumis avec succès. Merci !`);
      setForm({ ...EMPTY });
      setConsent(false);
      setFile(null);
      if (isAdmin) loadSubmissions();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Échec de la soumission. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = "w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30";
  const labelCls = "text-sm font-medium text-gray-700 block mb-1";

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* En-tête */}
      <span className="text-xs font-semibold bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full">NeuriPP · Édition 2026</span>
      <EditableBlock blockKey="neuripp.title" as="h1" className="text-3xl font-bold text-gray-900 mt-4 mb-2"
        fallback="Appel à soumissions — Outils EdTech" />
      <EditableBlock blockKey="neuripp.intro" as="p" multiline className="text-gray-600 leading-relaxed mb-2"
        fallback="Les étudiants développent une infinité d'outils pédagogiques. L'objectif de ce track est de les mettre en commun et de créer une base sur laquelle itérer collectivement." />
      <EditableBlock blockKey="neuripp.note" as="p" multiline className="text-gray-500 text-sm mb-10"
        fallback="Soumettez votre projet : dépôt GitHub, page de présentation, démo et licence. Ouvert en priorité aux étudiants Hi! PARIS." />

      {/* Formulaire */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-card">
        {loading ? (
          <p className="text-sm text-gray-500">Chargement…</p>
        ) : !user ? (
          <p className="text-sm text-gray-600">
            Vous devez être connecté pour soumettre un projet.{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">Se connecter</Link>
          </p>
        ) : !canSubmit ? (
          <p className="text-sm text-gray-600">Les soumissions sont réservées aux membres de la plateforme.</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Projet */}
            <div>
              <label className={labelCls}>Nom du projet *</label>
              <input value={form.project_name} onChange={set("project_name")} required className={inputCls} placeholder="Ex. TutorMath" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Dépôt GitHub *</label>
                <input value={form.repo_url} onChange={set("repo_url")} required className={inputCls} placeholder="https://github.com/…" />
              </div>
              <div>
                <label className={labelCls}>Page projet (github.io)</label>
                <input value={form.pages_url} onChange={set("pages_url")} className={inputCls} placeholder="https://…github.io/…" />
              </div>
              <div>
                <label className={labelCls}>Lien démo</label>
                <input value={form.demo_url} onChange={set("demo_url")} className={inputCls} placeholder="Vidéo ou démo en ligne" />
              </div>
              <div>
                <label className={labelCls}>Licence</label>
                <select value={form.license} onChange={set("license")} className={inputCls}>
                  <option value="">— Choisir —</option>
                  {LICENSES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            {/* Catégorie d'usage */}
            <div>
              <label className={labelCls}>Catégorie d'usage *</label>
              <select value={form.usage_category} onChange={set("usage_category")} required className={inputCls}>
                <option value="">— Choisir —</option>
                {USAGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Périmètre + modèle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Périmètre</label>
                <div className="flex gap-4 text-sm text-gray-700 pt-1">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="scope" checked={form.domain_scope === "all"} onChange={() => setForm((f) => ({ ...f, domain_scope: "all" }))} />
                    Tous domaines
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="scope" checked={form.domain_scope === "specific"} onChange={() => setForm((f) => ({ ...f, domain_scope: "specific" }))} />
                    Matière spécifique
                  </label>
                </div>
                {form.domain_scope === "specific" && (
                  <input value={form.domain_detail} onChange={set("domain_detail")} className={`${inputCls} mt-2`} placeholder="Ex. Mathématiques, Droit…" />
                )}
              </div>
              <div>
                <label className={labelCls}>Modèle</label>
                <div className="flex gap-4 text-sm text-gray-700 pt-1">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="model" checked={form.model_type === "open"} onChange={() => setForm((f) => ({ ...f, model_type: "open" }))} />
                    Open model
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="model" checked={form.model_type === "api"} onChange={() => setForm((f) => ({ ...f, model_type: "api" }))} />
                    API
                  </label>
                </div>
              </div>
            </div>

            {/* Auteurs + description */}
            <div>
              <label className={labelCls}>Auteur·rice·s</label>
              <input value={form.authors} onChange={set("authors")} className={inputCls} placeholder="Noms / emails — pour l'identification des créateurs" />
            </div>
            <div>
              <label className={labelCls}>Description courte</label>
              <textarea value={form.description} onChange={set("description")} rows={3} className={inputCls} placeholder="Que fait l'outil ? Pour qui ?" />
            </div>

            {/* Pièce jointe */}
            <div>
              <label className={labelCls}>Pièce jointe (optionnelle, &lt; 1 Mo)</label>
              <input type="file" onChange={pickFile} className="text-sm text-gray-600" />
              {file && <span className="text-xs text-gray-400 ml-2">{file.name} · {formatSize(file.size)}</span>}
            </div>

            {/* Consentement */}
            <label className="flex items-start gap-2.5 bg-gray-50 border border-gray-200 rounded-lg p-3 cursor-pointer">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
              <span className="text-sm text-gray-700">
                Je confirme respecter les règles, notamment avoir <strong>obtenu le consentement de l'enseignant</strong>
                {" "}avant d'utiliser son contenu pédagogique. *
              </span>
            </label>

            {error && <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">{error}</p>}
            {success && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{success}</p>}

            <button type="submit" disabled={submitting}
              className="self-start bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-40">
              {submitting ? "Envoi…" : "Soumettre mon projet"}
            </button>
          </form>
        )}
      </div>

      {/* Liste admin */}
      {isAdmin && (
        <div className="mt-10">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Soumissions reçues ({submissions.length})</h2>
          {submissions.length === 0 ? (
            <p className="text-sm text-gray-500 bg-white border border-gray-200 rounded-xl p-4">Aucune soumission pour l'instant.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {submissions.map((s) => (
                <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{s.project_name ?? "—"}</p>
                      <p className="text-xs text-gray-500">
                        {s.usage_category ? USAGE_LABELS[s.usage_category] ?? s.usage_category : "—"}
                        {s.model_type ? ` · ${s.model_type === "open" ? "Open model" : "API"}` : ""}
                        {s.domain_scope === "specific" && s.domain_detail ? ` · ${s.domain_detail}` : s.domain_scope === "all" ? " · Tous domaines" : ""}
                        {s.license ? ` · ${s.license}` : ""}
                      </p>
                      {s.authors && <p className="text-xs text-gray-400 mt-0.5">{s.authors}</p>}
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">
                      {s.created_at ? new Date(s.created_at).toLocaleDateString("fr-FR") : ""}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs">
                    {s.repo_url && <a href={s.repo_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Repo ↗</a>}
                    {s.pages_url && <a href={s.pages_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Page ↗</a>}
                    {s.demo_url && <a href={s.demo_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Démo ↗</a>}
                    {s.file_url && <a href={s.file_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Pièce jointe ↗</a>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
