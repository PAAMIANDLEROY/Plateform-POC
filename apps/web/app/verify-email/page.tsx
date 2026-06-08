/**
 * @file verify-email/page.tsx
 * @description Page de confirmation d'email "/verify-email".
 *
 * Cette page est conservée pour rétrocompatibilité avec les anciens liens
 * d'activation par email. Le flow OTP (code à 6 chiffres) utilisé depuis la
 * page `/login` a remplacé la vérification par lien.
 *
 * Contenu :
 *   - Icône 🔑 + titre + description (via i18n `t.verifyEmail`).
 *   - Bouton "Se connecter" → `/login`.
 *
 * `"use client"` est requis pour l'utilisation du hook `useLanguage()`.
 */

"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

/**
 * Page d'information de vérification d'email.
 * Affiche un message indiquant que le lien a été envoyé et redirige vers la connexion.
 */
export default function VerifyEmailPage() {
  /** Traductions i18n pour la clé `verifyEmail`. */
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-card">
        {/* Icône de la page */}
        <div className="text-4xl mb-4">🔑</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t.verifyEmail.title}</h2>
        <p className="text-gray-400 text-sm mb-6">
          {t.verifyEmail.description}
        </p>
        {/* Lien retour vers la page de connexion */}
        <Link
          href="/login"
          className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors"
        >
          {t.verifyEmail.loginBtn}
        </Link>
      </div>
    </div>
  );
}
