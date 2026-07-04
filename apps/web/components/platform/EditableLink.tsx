/**
 * @file EditableLink.tsx
 * @description Lien éditable (libellé + URL) — contenu structuré, pas du texte libre.
 *
 * Stocke deux blocs de contenu : `{labelKey}` et `{urlKey}` (via le système content_blocks).
 * Pour un admin, un crayon ✏️ ouvre un mini-formulaire (libellé + URL avec validation
 * http(s):// ou mailto:). Fallback sur le libellé/URL codés si aucune valeur en base.
 *
 * @example
 * <EditableLink labelKey="footer.hiparis.label" urlKey="footer.hiparis.url"
 *   fallbackLabel="hi-paris.fr ↗" fallbackUrl="https://hi-paris.fr" className="…" />
 */
"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { contentApi } from "@/lib/api";
import { useContentBlock, useContentHasDraft, setContentDraft, publishBlock } from "@/lib/content";

const ADMIN_ROLES = ["admin", "super_admin"];
const URL_OK = /^(https?:\/\/|mailto:)/i;

export default function EditableLink({
  labelKey,
  urlKey,
  fallbackLabel,
  fallbackUrl,
  className,
}: {
  labelKey: string;
  urlKey: string;
  fallbackLabel: string;
  fallbackUrl: string;
  className?: string;
}) {
  const { user } = useAuth();
  const isAdmin = !!user && ADMIN_ROLES.includes(user.role);
  const label = useContentBlock(labelKey, fallbackLabel);
  const url = useContentBlock(urlKey, fallbackUrl);
  const hasDraft = useContentHasDraft(labelKey) || useContentHasDraft(urlKey);

  const [editing, setEditing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [dLabel, setDLabel] = useState("");
  const [dUrl, setDUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isMailto = url.toLowerCase().startsWith("mailto:");

  async function save() {
    if (!dLabel.trim()) { setError("Libellé requis."); return; }
    if (!URL_OK.test(dUrl.trim())) { setError("URL invalide (https://… ou mailto:…)."); return; }
    setSaving(true);
    setError("");
    try {
      await contentApi.update(labelKey, dLabel.trim());
      await contentApi.update(urlKey, dUrl.trim());
      setContentDraft(labelKey, dLabel.trim());
      setContentDraft(urlKey, dUrl.trim());
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    setPublishing(true);
    try {
      await Promise.allSettled([publishBlock(labelKey), publishBlock(urlKey)]);
    } finally {
      setPublishing(false);
    }
  }

  if (editing) {
    return (
      <span className="inline-flex flex-col gap-1 bg-white rounded-lg p-2 border border-gray-200">
        <input value={dLabel} onChange={(e) => setDLabel(e.target.value)} placeholder="Libellé"
          className="text-xs text-gray-900 border border-gray-200 rounded px-2 py-1 w-48" />
        <input value={dUrl} onChange={(e) => setDUrl(e.target.value)} placeholder="https://… ou mailto:…"
          className="text-xs text-gray-900 border border-gray-200 rounded px-2 py-1 w-48" />
        <span className="flex items-center gap-2">
          <button onClick={save} disabled={saving} className="text-xs bg-primary text-white px-2 py-0.5 rounded disabled:opacity-40">{saving ? "…" : "OK"}</button>
          <button onClick={() => setEditing(false)} className="text-xs text-gray-500">Annuler</button>
        </span>
        {error && <span className="text-xs text-danger">{error}</span>}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center">
      <a href={url} className={className} {...(isMailto ? {} : { target: "_blank", rel: "noopener noreferrer" })}>
        {label}
      </a>
      {isAdmin && (
        <button
          onClick={() => { setDLabel(label); setDUrl(url); setError(""); setEditing(true); }}
          title="Modifier le lien"
          aria-label="Modifier le lien"
          className="ml-1 text-xs opacity-50 hover:opacity-100 print:hidden"
        >
          ✏️
        </button>
      )}
      {isAdmin && hasDraft && (
        <span className="ml-1 inline-flex items-center gap-1 print:hidden">
          <span className="text-[10px] font-medium text-amber-300 bg-amber-500/15 border border-amber-400/30 rounded px-1">brouillon</span>
          <button onClick={publish} disabled={publishing} className="text-[10px] text-primary-light hover:underline">
            {publishing ? "…" : "publier"}
          </button>
        </span>
      )}
    </span>
  );
}
