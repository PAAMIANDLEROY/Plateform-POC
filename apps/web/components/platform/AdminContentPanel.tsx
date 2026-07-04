/**
 * @file AdminContentPanel.tsx
 * @description Panneau « Contenu » de l'admin. Deux niveaux :
 *   1. liste des pages éditables ;
 *   2. en cliquant une page, édition de ses blocs (brouillon + publication).
 */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { contentApi, ContentBlock, ApiError } from "@/lib/api";
import { CONTENT_REGISTRY, RegistryEntry } from "@/lib/contentRegistry";

export default function AdminContentPanel() {
  const [blocks, setBlocks] = useState<Record<string, ContentBlock>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [selectedPage, setSelectedPage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await contentApi.list();
      const map = Object.fromEntries(list.map((b) => [b.key, b]));
      setBlocks(map);
      const d: Record<string, string> = {};
      CONTENT_REGISTRY.forEach((e) => {
        const b = map[e.key];
        d[e.key] = (b ? (b.draft_value ?? b.value) : "") || e.fallback;
      });
      setDrafts(d);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Impossible de charger les contenus.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveDraft(key: string) {
    setBusy(key);
    setError("");
    try {
      const b = await contentApi.update(key, drafts[key] ?? "");
      setBlocks((m) => ({ ...m, [key]: b }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Échec de l'enregistrement.");
    } finally {
      setBusy(null);
    }
  }

  async function publish(key: string) {
    setBusy(key);
    try {
      const b = await contentApi.publish(key);
      setBlocks((m) => ({ ...m, [key]: b }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Échec de la publication.");
    } finally {
      setBusy(null);
    }
  }

  // Pages = groupes distincts du registre, avec compteurs.
  const pages = useMemo(() => {
    const byPage: Record<string, RegistryEntry[]> = {};
    CONTENT_REGISTRY.forEach((e) => { (byPage[e.group] ??= []).push(e); });
    return Object.entries(byPage).map(([name, entries]) => ({
      name,
      entries,
      pending: entries.filter((e) => blocks[e.key]?.has_draft).length,
    }));
  }, [blocks]);

  if (loading) return <p className="text-sm text-gray-500">Chargement…</p>;

  // ── Vue 1 : liste des pages ─────────────────────────────────────────────────
  if (!selectedPage) {
    return (
      <div>
        <p className="text-xs text-gray-500 mb-4">
          Choisissez une page pour éditer son texte. Les modifications sont des <strong>brouillons</strong>
          {" "}(visibles des seuls admins) jusqu'à publication.
        </p>
        {error && <div className="mb-4 text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">{error}</div>}
        <div className="flex flex-col gap-2">
          {pages.map((p) => (
            <button key={p.name} onClick={() => setSelectedPage(p.name)}
              className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 text-left hover:border-primary/40 hover:bg-primary/[0.02] transition-all">
              <div>
                <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                <p className="text-xs text-gray-500">{p.entries.length} bloc(s) éditable(s)</p>
              </div>
              <div className="flex items-center gap-3">
                {p.pending > 0 && (
                  <span className="text-[11px] font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                    {p.pending} brouillon(s)
                  </span>
                )}
                <span className="text-gray-300">›</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Vue 2 : édition des blocs d'une page ────────────────────────────────────
  const entries = pages.find((p) => p.name === selectedPage)?.entries ?? [];
  return (
    <div>
      <button onClick={() => setSelectedPage(null)} className="text-sm text-primary hover:underline mb-4">← Pages</button>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{selectedPage}</h3>

      {error && <div className="mb-4 text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">{error}</div>}

      <div className="flex flex-col gap-4">
        {entries.map((e) => {
          const b = blocks[e.key];
          const hasDraft = !!b?.has_draft;
          return (
            <div key={e.key} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{e.label}</p>
                  <p className="text-[11px] text-gray-400 font-mono">{e.key}</p>
                </div>
                {hasDraft && (
                  <span className="text-[10px] font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 shrink-0">
                    brouillon non publié
                  </span>
                )}
              </div>

              {e.multiline ? (
                <textarea value={drafts[e.key] ?? ""} onChange={(ev) => setDrafts((d) => ({ ...d, [e.key]: ev.target.value }))}
                  rows={3} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30" />
              ) : (
                <input value={drafts[e.key] ?? ""} onChange={(ev) => setDrafts((d) => ({ ...d, [e.key]: ev.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30" />
              )}

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <button onClick={() => saveDraft(e.key)} disabled={busy === e.key}
                  className="text-xs border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-40">
                  Enregistrer le brouillon
                </button>
                <button onClick={() => publish(e.key)} disabled={busy === e.key || !hasDraft}
                  className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary-dark disabled:opacity-40">
                  Publier
                </button>
                {b?.value && <span className="text-[11px] text-gray-400 truncate">publié : « {b.value} »</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
