/**
 * @file CookieBanner.tsx
 * @description Bannière de consentement aux cookies (RGPD) de Hi! Platform.
 *
 * Conforme au RGPD et aux recommandations de la CNIL :
 *   - 3 catégories : nécessaires (obligatoires), analytiques, tracking comportemental.
 *   - Durée de stockage du cookie de consentement : 13 mois maximum (recommandation CNIL).
 *   - Synchronisation avec le backend si l'utilisateur est connecté (`authApi.updateConsent`).
 *
 * Stockage du consentement :
 *   Le consentement est stocké dans un cookie de première partie (non httpOnly) nommé
 *   `"hi_consent_v1"` pour être lisible côté client. Encodé en JSON puis URI-encoded.
 *
 * Affichage conditionnel :
 *   La bannière n'est affichée que si aucun consentement n'a encore été enregistré
 *   (`decided: false` ou cookie absent). Une fois la décision prise, la bannière disparaît
 *   et ne réapparaît plus (jusqu'à expiration du cookie à 13 mois).
 *
 * Deux vues :
 *   1. Vue simplifiée : titre + description + 3 boutons (Personnaliser, Refuser tout, Accepter tout).
 *   2. Vue détaillée : toggles par catégorie + bouton "Enregistrer mes choix".
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { authApi } from "@/lib/api";

/** Clé du cookie de consentement. Le suffixe `_v1` permet de versionner le schéma. */
const COOKIE_KEY = "hi_consent_v1";

/**
 * Structure du consentement stocké dans le cookie.
 *
 * @property necessary - Toujours `true` — cookies obligatoires au fonctionnement.
 * @property analytics - Consentement aux cookies d'analyse (Matomo, etc.).
 * @property tracking  - Consentement au suivi comportemental détaillé.
 * @property decided   - `true` une fois que l'utilisateur a fait un choix explicite.
 *                       Permet de distinguer un refus volontaire d'un cookie absent.
 */
interface Consent {
  necessary: true;
  analytics: boolean;
  tracking: boolean;
  decided: boolean;
}

/**
 * Lit le consentement depuis le cookie de première partie.
 *
 * @returns Objet `Consent` si le cookie existe et est valide JSON, `null` sinon.
 */
function readConsent(): Consent | null {
  try {
    const raw = document.cookie.split("; ").find((r) => r.startsWith(COOKIE_KEY + "="));
    if (!raw) return null;
    return JSON.parse(decodeURIComponent(raw.split("=")[1]));
  } catch {
    // Cookie malformé ou absent — on retourne null pour déclencher l'affichage de la bannière
    return null;
  }
}

/**
 * Écrit le consentement dans un cookie de première partie.
 * Durée de vie : 13 mois (durée maximale recommandée par la CNIL).
 * `SameSite=Lax` : protège contre le CSRF tout en permettant les navigations normales.
 *
 * @param c - Objet `Consent` à stocker.
 */
function writeConsent(c: Consent) {
  const expires = new Date();
  expires.setMonth(expires.getMonth() + 13); // 13 mois max RGPD/CNIL
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(JSON.stringify(c))}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

/**
 * Bannière de consentement aux cookies — positionnée fixe en bas de l'écran.
 * Rendue `null` si le consentement a déjà été décidé.
 */
export function CookieBanner() {
  const { user } = useAuth();
  const { t } = useLanguage();

  /** `true` si la bannière doit être affichée (pas encore de décision). */
  const [show, setShow] = useState(false);

  /** `true` si la vue détaillée (toggles par catégorie) est affichée. */
  const [showDetails, setShowDetails] = useState(false);

  /** État des toggles de la vue détaillée (valeurs initiales : refus). */
  const [analytics, setAnalytics] = useState(false);
  const [tracking, setTracking] = useState(false);

  /**
   * Au montage : vérifie si un consentement a déjà été enregistré.
   * Affiche la bannière seulement si le cookie est absent ou si `decided === false`.
   */
  useEffect(() => {
    const stored = readConsent();
    if (!stored || !stored.decided) {
      setShow(true);
    }
  }, []);

  /**
   * Enregistre le consentement localement et, si connecté, sur le backend.
   * Masque la bannière immédiatement après la décision.
   *
   * @param a  - Consentement analytics.
   * @param tk - Consentement tracking.
   */
  async function save(a: boolean, tk: boolean) {
    const consent: Consent = { necessary: true, analytics: a, tracking: tk, decided: true };
    writeConsent(consent);
    setShow(false);
    // Synchronisation avec le backend uniquement si l'utilisateur est connecté
    // Le try/catch garantit que la bannière disparaît même si l'API est inaccessible
    if (user) {
      try { await authApi.updateConsent(a, tk); } catch {}
    }
  }

  // Ne rend rien si la décision a déjà été prise
  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4">
      <div className="max-w-4xl mx-auto bg-navy border border-white/10 rounded-2xl shadow-2xl p-6">

        {/* ── Branche vue simplifiée (défaut) ── */}
        {!showDetails ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Description et lien politique de confidentialité */}
            <div className="flex-1">
              <p className="text-sm font-semibold text-white mb-1">{t.cookie.title}</p>
              <p className="text-xs text-gray-400">
                {t.cookie.description}{" "}
                <Link href="/privacy" className="text-primary underline">{t.cookie.privacyLink}</Link>
              </p>
            </div>
            {/* Boutons d'action */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {/* Personnaliser : affiche la vue détaillée */}
              <button
                onClick={() => setShowDetails(true)}
                className="text-xs text-gray-400 hover:text-white border border-white/10 px-4 py-2 rounded-lg transition-colors"
              >
                {t.cookie.customize}
              </button>
              {/* Refuser tout : analytics=false, tracking=false */}
              <button
                onClick={() => save(false, false)}
                className="text-xs text-gray-300 border border-white/20 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                {t.cookie.refuseAll}
              </button>
              {/* Accepter tout : analytics=true, tracking=true */}
              <button
                onClick={() => save(true, true)}
                className="text-xs bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors font-semibold"
              >
                {t.cookie.acceptAll}
              </button>
            </div>
          </div>

        ) : (
          /* ── Branche vue détaillée (après clic sur "Personnaliser") ── */
          <div>
            <p className="text-sm font-semibold text-white mb-4">{t.cookie.preferences}</p>
            <div className="space-y-3 mb-5">
              {/* Cookies nécessaires : toujours activés, toggle désactivé */}
              <ConsentRow
                title={t.cookie.necessary.title}
                desc={t.cookie.necessary.desc}
                checked={true}
                disabled
              />
              {/* Cookies analytiques : contrôlés par le state `analytics` */}
              <ConsentRow
                title={t.cookie.analytics.title}
                desc={t.cookie.analytics.desc}
                checked={analytics}
                onChange={setAnalytics}
              />
              {/* Tracking comportemental : contrôlé par le state `tracking` */}
              <ConsentRow
                title={t.cookie.tracking.title}
                desc={t.cookie.tracking.desc}
                checked={tracking}
                onChange={setTracking}
              />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => save(analytics, tracking)}
                className="text-sm bg-primary text-white px-5 py-2 rounded-lg hover:bg-primary-dark transition-colors font-semibold"
              >
                {t.cookie.saveChoices}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Ligne de consentement avec toggle bascule.
 * Utilisée dans la vue détaillée pour chaque catégorie de cookies.
 *
 * @property title    - Nom de la catégorie de cookies.
 * @property desc     - Description détaillée (durée, données collectées).
 * @property checked  - État actuel du toggle.
 * @property disabled - Si `true`, le toggle est désactivé (cookies nécessaires).
 * @property onChange - Callback appelé avec la nouvelle valeur au clic sur le toggle.
 */
function ConsentRow({
  title, desc, checked, disabled, onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-4 p-3 bg-white/5 rounded-xl">
      <div className="flex-1">
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
      {/* Toggle switch : bleu si activé, gris si désactivé */}
      <button
        disabled={disabled}
        onClick={() => onChange && onChange(!checked)}
        className={`w-10 h-6 rounded-full transition-colors shrink-0 mt-0.5 ${
          checked ? "bg-primary" : "bg-gray-700"
        } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
      >
        {/* Pastille blanche qui se déplace de gauche (off) à droite (on) */}
        <span className={`block w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${
          checked ? "translate-x-4" : "translate-x-0"
        }`} />
      </button>
    </div>
  );
}
