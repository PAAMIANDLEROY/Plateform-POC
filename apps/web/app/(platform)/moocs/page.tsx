/**
 * @file (platform)/moocs/page.tsx
 * @description Redirecteur "/moocs" → "/learning-ai/moocs".
 *
 * Redirige immédiatement vers la section MOOCs de l'espace "Learning AI".
 * Utilise `router.replace()` pour ne pas créer d'entrée d'historique.
 *
 * `"use client"` est requis pour `useEffect` et `useRouter`.
 */

"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Redirige "/moocs" vers "/learning-ai/moocs" sans historique. */
export default function Page() {
  const router = useRouter();
  // Branche unique : redirection immédiate au montage du composant
  useEffect(() => { router.replace("/learning-ai/moocs"); }, [router]);
  return null;
}
