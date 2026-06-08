/**
 * @file (platform)/courses/page.tsx
 * @description Redirecteur "/courses" → "/learning-ai/courses".
 *
 * Redirige immédiatement vers la section Cours de l'espace "Learning AI".
 * Utilise `router.replace()` pour ne pas créer d'entrée d'historique.
 *
 * `"use client"` est requis pour `useEffect` et `useRouter`.
 */

"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Redirige "/courses" vers "/learning-ai/courses" sans historique. */
export default function Page() {
  const router = useRouter();
  // Branche unique : redirection immédiate au montage du composant
  useEffect(() => { router.replace("/learning-ai/courses"); }, [router]);
  return null;
}
