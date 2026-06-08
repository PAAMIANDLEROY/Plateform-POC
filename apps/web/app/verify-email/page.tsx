"use client";

import Link from "next/link";

// La vérification par lien email a été remplacée par le flow OTP (code 6 chiffres).
// Cette page est conservée pour rétrocompatibilité avec d'anciens liens.
export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-card">
        <div className="text-4xl mb-4">🔑</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Authentification par code</h2>
        <p className="text-gray-400 text-sm mb-6">
          Hi! Platform utilise désormais un code à 6 chiffres envoyé par email.
          Connectez-vous directement depuis la page de connexion.
        </p>
        <Link
          href="/login"
          className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors"
        >
          Aller à la connexion
        </Link>
      </div>
    </div>
  );
}
