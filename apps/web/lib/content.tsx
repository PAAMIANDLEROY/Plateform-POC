/**
 * @file content.tsx
 * @description Cache partagé + hooks pour les blocs de texte éditables (brouillon / publication).
 *
 * Un seul appel `/api/v1/content` par session (mémoïsé), partagé par tous les composants éditables.
 * Le backend renvoie le brouillon aux admins → un admin voit automatiquement son aperçu ;
 * le public voit la valeur publiée. Aucun Provider (n'impacte pas le layout).
 */
"use client";

import { useEffect, useState } from "react";
import { contentApi } from "./api";

type Block = { value: string; draft: string | null };

let cache: Record<string, Block> | null = null;
let inflight: Promise<Record<string, Block>> | null = null;
const listeners = new Set<() => void>();

function notifyAll() {
  listeners.forEach((l) => l());
}

function ensureLoaded(): Promise<Record<string, Block>> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = contentApi
      .list()
      .then((blocks) => {
        cache = Object.fromEntries(blocks.map((b) => [b.key, { value: b.value, draft: b.draft_value }]));
        return cache;
      })
      .catch(() => {
        cache = {};
        return cache;
      });
  }
  return inflight;
}

/** Valeur à afficher : le brouillon s'il existe (admin), sinon la valeur publiée. */
function display(key: string): string | null {
  const b = cache?.[key];
  if (!b) return null;
  return b.draft != null ? b.draft : b.value;
}

/** Renvoie la valeur du bloc `key` (brouillon pour un admin, sinon publiée), ou `fallback`. */
export function useContentBlock(key: string, fallback: string): string {
  const [, force] = useState(0);
  useEffect(() => {
    let active = true;
    ensureLoaded().then(() => { if (active) force((n) => n + 1); });
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => { active = false; listeners.delete(l); };
  }, [key]);
  const v = display(key);
  return v != null && v !== "" ? v : fallback;
}

/** True si un brouillon non publié existe pour `key`. */
export function useContentHasDraft(key: string): boolean {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, [key]);
  const b = cache?.[key];
  return !!b && b.draft != null && b.draft !== b.value;
}

/** Met à jour le brouillon local (après un PUT) et notifie les blocs affichés. */
export function setContentDraft(key: string, draft: string): void {
  if (!cache) cache = {};
  cache[key] = { value: cache[key]?.value ?? "", draft };
  notifyAll();
}

/** Marque un bloc comme publié localement (après un POST publish). */
export function markPublished(key: string): void {
  const b = cache?.[key];
  if (b) {
    cache![key] = { value: b.draft != null ? b.draft : b.value, draft: null };
    notifyAll();
  }
}

/** Publie le brouillon (API) puis met à jour le cache. */
export async function publishBlock(key: string): Promise<void> {
  await contentApi.publish(key);
  markPublished(key);
}
