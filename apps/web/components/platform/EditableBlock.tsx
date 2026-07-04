/**
 * @file EditableBlock.tsx
 * @description Bloc de texte éditable réutilisable sur n'importe quelle page.
 *
 * Affiche le texte du bloc `blockKey` (surcharge base) ou son `fallback` (texte en dur).
 * Pour un admin / super_admin, un crayon ✏️ ouvre un éditeur inline (sauvegarde immédiate,
 * sans déploiement). N'édite que du texte — ne change aucune structure de page.
 *
 * @example
 * <EditableBlock blockKey="neuripp.title" as="h1" className="text-3xl font-bold"
 *   fallback="Appel à soumissions" />
 */
"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { contentApi } from "@/lib/api";
import { useContentBlock, useContentHasDraft, setContentDraft, publishBlock } from "@/lib/content";

const ADMIN_ROLES = ["admin", "super_admin"];

export default function EditableBlock({
  blockKey,
  fallback,
  as = "span",
  className,
  multiline = false,
}: {
  blockKey: string;
  fallback: string;
  as?: React.ElementType;
  className?: string;
  multiline?: boolean;
}) {
  const { user } = useAuth();
  const isAdmin = !!user && ADMIN_ROLES.includes(user.role);
  const value = useContentBlock(blockKey, fallback);
  const hasDraft = useContentHasDraft(blockKey);

  const [editing, setEditing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const Tag = as as React.ElementType;

  async function save() {
    setSaving(true);
    setError("");
    try {
      await contentApi.update(blockKey, draft);
      setContentDraft(blockKey, draft);
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
      await publishBlock(blockKey);
    } finally {
      setPublishing(false);
    }
  }

  if (editing) {
    return (
      <span className="block">
        {multiline ? (
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={4}
            className="w-full text-sm border border-primary/40 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30" />
        ) : (
          <input value={draft} onChange={(e) => setDraft(e.target.value)}
            className="w-full text-sm border border-primary/40 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30" />
        )}
        <span className="flex items-center gap-2 mt-1.5">
          <button onClick={save} disabled={saving}
            className="text-xs bg-primary text-white px-3 py-1 rounded-lg disabled:opacity-40">
            {saving ? "…" : "Enregistrer"}
          </button>
          <button onClick={() => setEditing(false)} className="text-xs text-gray-500 hover:text-gray-800 px-2 py-1">Annuler</button>
          {error && <span className="text-xs text-danger">{error}</span>}
        </span>
      </span>
    );
  }

  return (
    <Tag className={className} style={{ whiteSpace: "pre-line" }}>
      {value}
      {isAdmin && (
        <button
          onClick={() => { setDraft(value); setError(""); setEditing(true); }}
          title="Modifier ce texte"
          className="ml-1.5 align-middle text-xs text-gray-300 hover:text-primary print:hidden"
          aria-label="Modifier ce texte"
        >
          ✏️
        </button>
      )}
      {isAdmin && hasDraft && (
        <span className="ml-1.5 align-middle inline-flex items-center gap-1 print:hidden">
          <span className="text-[10px] font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded px-1">brouillon</span>
          <button onClick={publish} disabled={publishing} className="text-[10px] text-primary hover:underline">
            {publishing ? "…" : "publier"}
          </button>
        </span>
      )}
    </Tag>
  );
}
