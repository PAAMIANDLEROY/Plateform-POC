/**
 * @file (auth)/register/page.tsx
 * @description Page d'inscription "/register" — redirection vers "/login".
 *
 * L'inscription est intégrée directement dans le flux de connexion (login page)
 * via l'étape de création de compte. Cette page sert donc d'alias de redirection
 * pour ne pas produire une erreur 404 si quelqu'un navigue directement vers "/register".
 *
 * Comportement : redirection immédiate via `router.replace` (sans entrée dans l'historique).
 */

"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Page de redirection "/register" → "/login".
 * Le flux d'inscription se fait depuis la page login.
 */
export default function RegisterPage() {
  const router = useRouter();

  // L'inscription passe par le flux login — redirection silencieuse
  useEffect(() => { router.replace("/login"); }, [router]);

  return null;
}
