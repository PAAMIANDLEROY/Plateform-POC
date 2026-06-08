"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

// La vérification par lien email a été remplacée par le flow OTP.
// Cette page est conservée pour rétrocompatibilité avec d'anciens liens.
export default function VerifyEmailPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-card">
        <div className="text-4xl mb-4">🔑</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t.verifyEmail.title}</h2>
        <p className="text-gray-400 text-sm mb-6">
          {t.verifyEmail.description}
        </p>
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
