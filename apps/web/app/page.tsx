/**
 * @file app/page.tsx
 * @description Page racine "/" de l'application Next.js.
 *
 * Redirige immédiatement vers `/dashboard` dès le montage client.
 * `router.replace` est utilisé (et non `router.push`) pour ne pas créer
 * d'entrée dans l'historique de navigation — la page "/" ne doit pas être
 * accessible via le bouton "Retour" du navigateur.
 *
 * Retourne `null` — aucun contenu n'est affiché le temps de la redirection.
 */

"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Page de redirection racine.
 * Redirige vers `/dashboard` sans laisser d'entrée dans l'historique.
 */
export default function HomePage() {
  const router = useRouter();

  // Redirection immédiate au montage — replace évite la création d'une entrée dans l'historique
  useEffect(() => { router.replace("/dashboard"); }, [router]);

  return null;
}
