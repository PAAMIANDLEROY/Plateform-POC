"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { authApi } from "@/lib/api";

const COOKIE_KEY = "hi_consent_v1";

interface Consent {
  necessary: true;
  analytics: boolean;
  tracking: boolean;
  decided: boolean;
}

function readConsent(): Consent | null {
  try {
    const raw = document.cookie.split("; ").find((r) => r.startsWith(COOKIE_KEY + "="));
    if (!raw) return null;
    return JSON.parse(decodeURIComponent(raw.split("=")[1]));
  } catch {
    return null;
  }
}

function writeConsent(c: Consent) {
  const expires = new Date();
  expires.setMonth(expires.getMonth() + 13); // 13 mois max RGPD
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(JSON.stringify(c))}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

export function CookieBanner() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [tracking, setTracking] = useState(false);

  useEffect(() => {
    const stored = readConsent();
    if (!stored || !stored.decided) {
      setShow(true);
    }
  }, []);

  async function save(a: boolean, t: boolean) {
    const consent: Consent = { necessary: true, analytics: a, tracking: t, decided: true };
    writeConsent(consent);
    setShow(false);
    if (user) {
      try { await authApi.updateConsent(a, t); } catch {}
    }
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4">
      <div className="max-w-4xl mx-auto bg-gray-950 border border-white/20 rounded-2xl shadow-2xl p-6">
        {!showDetails ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-white mb-1">🍪 Cookies & confidentialité</p>
              <p className="text-xs text-gray-400">
                Nous utilisons des cookies nécessaires au fonctionnement de la plateforme. Avec votre accord, nous collectons aussi des données d'usage anonymisées pour améliorer votre expérience.{" "}
                <Link href="/privacy" className="text-primary underline">Politique de confidentialité</Link>
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                onClick={() => setShowDetails(true)}
                className="text-xs text-gray-400 hover:text-white border border-white/10 px-4 py-2 rounded-lg transition-colors"
              >
                Personnaliser
              </button>
              <button
                onClick={() => save(false, false)}
                className="text-xs text-gray-300 border border-white/20 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                Refuser tout
              </button>
              <button
                onClick={() => save(true, true)}
                className="text-xs bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors font-semibold"
              >
                Accepter tout
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm font-semibold text-white mb-4">Gérer mes préférences</p>
            <div className="space-y-3 mb-5">
              <ConsentRow
                title="Cookies nécessaires"
                desc="Authentification, sécurité, session. Obligatoires au fonctionnement."
                checked={true}
                disabled
              />
              <ConsentRow
                title="Cookies analytiques"
                desc="Statistiques d'usage anonymisées (pages vues, temps passé). 6 mois."
                checked={analytics}
                onChange={setAnalytics}
              />
              <ConsentRow
                title="Tracking comportemental"
                desc="Suivi détaillé de votre parcours d'apprentissage. 6 mois max."
                checked={tracking}
                onChange={setTracking}
              />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => save(analytics, tracking)}
                className="text-sm bg-primary text-white px-5 py-2 rounded-lg hover:bg-primary-dark transition-colors font-semibold"
              >
                Enregistrer mes choix
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConsentRow({
  title, desc, checked, disabled, onChange,
}: {
  title: string; desc: string; checked: boolean; disabled?: boolean; onChange?: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-4 p-3 bg-white/5 rounded-xl">
      <div className="flex-1">
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
      <button
        disabled={disabled}
        onClick={() => onChange && onChange(!checked)}
        className={`w-10 h-6 rounded-full transition-colors shrink-0 mt-0.5 ${
          checked ? "bg-primary" : "bg-gray-700"
        } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span className={`block w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${checked ? "translate-x-4" : "translate-x-0"}`} />
      </button>
    </div>
  );
}
