/**
 * @file (platform)/about/page.tsx
 * @description Onglet « About us » — 1re page : soumission de fichier (< 10 Mo) vers Supabase Storage.
 *
 * L'upload passe par le backend (`submissionsApi.create`) qui valide et stocke.
 * Réservé aux rôles authentifiés (hors visiteur). Les admins voient la liste des soumissions.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { submissionsApi, SubmissionEntry, ApiError } from "@/lib/api";

const MAX_SIZE = 10 * 1024 * 1024; // 10 Mo
const SUBMIT_ROLES = ["student", "teacher", "admin", "super_admin"];
const ADMIN_ROLES = ["admin", "super_admin"];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

export default function AboutPage() {
  const { user, loading } = useAuth();
  const canSubmit = !!user && SUBMIT_ROLES.includes(user.role);
  const isAdmin = !!user && ADMIN_ROLES.includes(user.role);

  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [submissions, setSubmissions] = useState<SubmissionEntry[]>([]);

  const loadSubmissions = useCallback(async () => {
    try {
      setSubmissions(await submissionsApi.list());
    } catch {
      setSubmissions([]);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) loadSubmissions();
  }, [isAdmin, loadSubmissions]);

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    setSuccess("");
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > MAX_SIZE) {
      setError(`Fichier trop volumineux (${formatSize(f.size)}). Maximum : 10 Mo.`);
      setFile(null);
      return;
    }
    setFile(f);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setError("");
    setSuccess("");
    setUploading(true);
    try {
      const created = await submissionsApi.create(file);
      setSuccess(`« ${created.filename} » envoyé avec succès.`);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      if (isAdmin) loadSubmissions();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Échec de l'envoi. Réessayez.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">About us</h1>
      <p className="text-gray-500 mb-10">
        Partagez un document avec l'équipe Hi! PARIS. Formats acceptés : tous, jusqu'à 10 Mo.
      </p>

      {/* Carte d'upload */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-card">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Soumettre un fichier</h2>
        <p className="text-sm text-gray-500 mb-6">Le fichier est envoyé de façon sécurisée et conservé par la plateforme.</p>

        {loading ? (
          <p className="text-sm text-gray-500">Chargement…</p>
        ) : !user ? (
          <p className="text-sm text-gray-600">
            Vous devez être connecté pour soumettre un fichier.{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">Se connecter</Link>
          </p>
        ) : !canSubmit ? (
          <p className="text-sm text-gray-600">Cette fonctionnalité est réservée aux membres de la plateforme.</p>
        ) : (
          <form onSubmit={handleUpload} className="flex flex-col gap-4">
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl px-6 py-10 cursor-pointer hover:border-primary/40 hover:bg-gray-50 transition-all">
              <span className="text-3xl">📎</span>
              <span className="text-sm font-medium text-gray-700">
                {file ? file.name : "Cliquez pour choisir un fichier"}
              </span>
              <span className="text-xs text-gray-400">
                {file ? formatSize(file.size) : "Maximum 10 Mo"}
              </span>
              <input ref={inputRef} type="file" onChange={pick} className="hidden" />
            </label>

            {error && <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">{error}</p>}
            {success && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{success}</p>}

            <button type="submit" disabled={!file || uploading}
              className="self-start bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              {uploading ? "Envoi…" : "Envoyer"}
            </button>
          </form>
        )}
      </div>

      {/* Liste admin */}
      {isAdmin && (
        <div className="mt-10">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Soumissions reçues</h2>
          {submissions.length === 0 ? (
            <p className="text-sm text-gray-500 bg-white border border-gray-200 rounded-xl p-4">Aucune soumission pour l'instant.</p>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-50">
              {submissions.map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-lg">📄</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{s.filename}</p>
                    <p className="text-xs text-gray-500">
                      {formatSize(s.size)} · {s.created_at ? new Date(s.created_at).toLocaleString("fr-FR") : ""}
                    </p>
                  </div>
                  {s.url && (
                    <a href={s.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs font-medium text-primary hover:underline shrink-0">Télécharger</a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
