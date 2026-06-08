/**
 * @file (platform)/tube/page.tsx
 * @description Redirecteur "/tube" → "/learning-ai/tube".
 *
 * Redirige immédiatement vers la section Hi! Tube de l'espace "Learning AI".
 * Utilise `router.replace()` pour ne pas créer d'entrée d'historique —
 * le bouton "Retour" naviguera directement à la page précédant `/tube`.
 *
 * `"use client"` est requis pour `useEffect` et `useRouter`.
 */

"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Redirige "/tube" vers "/learning-ai/tube" sans historique. */
export default function Page() {
  const router = useRouter();
  // Branche unique : redirection immédiate au montage du composant
  useEffect(() => { router.replace("/learning-ai/tube"); }, [router]);
  return null;
}
