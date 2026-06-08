/**
 * @file (platform)/apps/page.tsx
 * @description Redirecteur "/apps" → "/learning-ai/apps".
 *
 * Redirige immédiatement vers la section Applications de l'espace "Learning AI".
 * Utilise `router.replace()` pour ne pas créer d'entrée d'historique.
 *
 * `"use client"` est requis pour `useEffect` et `useRouter`.
 */

"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Redirige "/apps" vers "/learning-ai/apps" sans historique. */
export default function Page() {
  const router = useRouter();
  // Branche unique : redirection immédiate au montage du composant
  useEffect(() => { router.replace("/learning-ai/apps"); }, [router]);
  return null;
}
