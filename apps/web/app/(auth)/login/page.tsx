/**
 * @file (auth)/login/page.tsx
 * @description Page de connexion "/login" — authentification sans mot de passe (Magic Link / OTP).
 *
 * Flux d'authentification en 2 étapes :
 *   1. Étape "email" : l'utilisateur saisit son adresse email institutionnel.
 *      → Appel `authApi.requestCode(email)` → un code à 6 chiffres est envoyé par email.
 *      → Passage à l'étape "code" si succès.
 *
 *   2. Étape "code" : l'utilisateur saisit le code reçu dans 6 champs individuels.
 *      → Appel `authApi.verifyCode(email, code)` → retourne `{ user, is_new, ... }`.
 *      → Redirection :
 *          - Profil incomplet OU nouveau compte  → "/complete-profile"
 *          - Profil complet                      → "/dashboard"
 *
 * Expérience de saisie du code OTP :
 *   - Chaque chiffre a son propre `<input>` (focus automatique sur le suivant).
 *   - Backspace sur un champ vide → focus sur le champ précédent.
 *   - Coller 6 chiffres depuis le presse-papiers remplit tous les champs d'un coup.
 *   - Tous les 6 champs remplis → soumission automatique du formulaire via `requestSubmit()`.
 *
 * Layout :
 *   - Grand écran : split 50/50 (panel branding navy à gauche + formulaire à droite).
 *   - Mobile : formulaire centré uniquement, logo affiché en haut.
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, FormEvent, useRef } from "react";
import { authApi, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

/** Étapes du flux de connexion. */
type Step = "email" | "code";

/**
 * Page de connexion OTP (sans mot de passe).
 */
export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const { t } = useLanguage();

  /** Étape courante du flux : saisie email ou saisie code OTP. */
  const [step, setStep] = useState<Step>("email");

  /** Email saisi à l'étape 1. Conservé pour l'affichage à l'étape 2. */
  const [email, setEmail] = useState("");

  /** Tableau de 6 chiffres du code OTP (un par champ). */
  const [code, setCode] = useState(["", "", "", "", "", ""]);

  /** Message d'erreur affiché en rouge sous le formulaire. */
  const [error, setError] = useState("");

  /** État de chargement pour les appels API. Désactive le bouton et affiche un spinner. */
  const [loading, setLoading] = useState(false);

  /**
   * Références aux 6 inputs OTP.
   * Utilisées pour le focus programmatique (avancement, retour en arrière).
   * `useRef` évite les re-renders lors du focus.
   */
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  /**
   * Soumet l'email pour déclencher l'envoi du code OTP.
   * En cas de succès, passe à l'étape "code" et focus le premier champ.
   */
  async function handleRequestCode(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.requestCode(email);
      setStep("code");
      // setTimeout nécessaire : le DOM de l'étape "code" n'est pas encore rendu
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.login.errorDefault);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Vérifie le code OTP saisi.
   * En cas de succès, redirige selon l'état du profil :
   *   - Nouveau compte OU profil incomplet → "/complete-profile"
   *   - Profil complet → "/dashboard"
   * En cas d'erreur, vide les champs et remet le focus sur le premier.
   */
  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault();
    const fullCode = code.join("");
    // Guard : soumission impossible si moins de 6 chiffres saisis
    if (fullCode.length < 6) return;
    setError("");
    setLoading(true);
    try {
      const data = await authApi.verifyCode(email, fullCode);
      setUser(data.user);
      // Branche nouveau compte ou profil incomplet : complétion obligatoire
      // Branche profil complet : accès direct au dashboard
      router.push(data.is_new || !data.user.is_profile_complete ? "/complete-profile" : "/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.login.errorCode);
      // Réinitialise les champs OTP après une erreur
      setCode(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Gère la saisie dans un champ OTP individuel.
   * - Filtre pour ne garder que les chiffres.
   * - Avance automatiquement au champ suivant après saisie.
   * - Déclenche la soumission automatique si tous les 6 chiffres sont remplis.
   *
   * @param index - Index du champ (0–5).
   * @param value - Valeur saisie (brute, avant filtrage).
   */
  function handleCodeInput(index: number, value: string) {
    // Filtre les non-chiffres et ne garde que le dernier caractère (colle ou frappe rapide)
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    // Avance automatiquement si un chiffre vient d'être saisi et qu'il reste des champs
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
    // Auto-submit si tous les chiffres sont remplis
    if (next.every((d) => d !== "")) {
      const form = document.getElementById("code-form") as HTMLFormElement;
      form?.requestSubmit();
    }
  }

  /**
   * Gère la touche Backspace sur un champ OTP.
   * Si le champ courant est vide, recule au champ précédent.
   */
  function handleCodeKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  /**
   * Gère le collage d'un code OTP depuis le presse-papiers.
   * Si exactement 6 chiffres sont collés, remplit tous les champs d'un coup.
   */
  function handleCodePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  }

  return (
    <div className="min-h-screen bg-surface flex">

      {/* ── Panneau gauche : branding (masqué sur mobile) ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy flex-col justify-between p-12 relative overflow-hidden">
        {/* Éléments décoratifs : cercles flous bleu et rouge */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-danger rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>

        {/* Logo */}
        <div className="relative">
          <div className="flex items-baseline gap-0 mb-2">
            <span className="text-3xl font-extrabold text-primary-light">Hi!</span>
            <span className="text-3xl font-extrabold text-white"> Platform</span>
          </div>
          <p className="text-white/50 text-sm">{t.login.tagline}</p>
        </div>

        {/* Citation et logos institutions */}
        <div className="relative space-y-8">
          <blockquote className="border-l-2 border-primary-light pl-6">
            <p className="text-xl font-light text-white/90 leading-relaxed italic">
              {t.login.quote}
            </p>
          </blockquote>
          <div className="flex items-center gap-6 flex-wrap">
            {["IP Paris", "HEC Paris", "Télécom Paris", "Inria", "ENSAE"].map((school) => (
              <span key={school} className="text-xs text-white/40 font-medium">{school}</span>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-white/25">
          © {new Date().getFullYear()} Hi! PARIS
        </div>
      </div>

      {/* ── Panneau droit : formulaire ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* Logo mobile uniquement (caché sur lg) */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-baseline gap-0">
              <span className="text-2xl font-extrabold text-primary">Hi!</span>
              <span className="text-2xl font-extrabold text-gray-900"> Platform</span>
            </Link>
            <p className="mt-1 text-sm text-gray-400">{t.login.tagline}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-card">

            {/* ── Branche étape 1 : saisie de l'email ── */}
            {step === "email" ? (
              <>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{t.login.title}</h1>
                <p className="text-sm text-gray-500 mb-6">{t.login.subtitle}</p>

                {/* Bannière d'erreur — affichée uniquement si `error` est non vide */}
                {error && (
                  <div className="bg-danger/5 border border-danger/20 text-danger text-sm rounded-xl px-4 py-3 mb-4">
                    {error}
                  </div>
                )}

                <form onSubmit={handleRequestCode} className="flex flex-col gap-4">
                  <Input
                    label={t.login.emailLabel}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.login.emailPlaceholder}
                    required
                    autoComplete="email"
                  />
                  <Button type="submit" loading={loading} className="mt-2">
                    {t.login.sendCode}
                  </Button>
                </form>

                <p className="mt-6 text-center text-xs text-gray-400">
                  {t.login.disclaimer}
                </p>
              </>
            ) : (
              /* ── Branche étape 2 : saisie du code OTP ── */
              <>
                {/* En-tête avec bouton retour et email masqué */}
                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={() => { setStep("email"); setCode(["", "", "", "", "", ""]); setError(""); }}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors text-sm"
                  >
                    ←
                  </button>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">{t.login.codeSentTitle}</h1>
                    <p className="text-sm text-gray-500">
                      {t.login.codeSentTo} <span className="text-gray-900 font-medium">{email}</span>
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="bg-danger/5 border border-danger/20 text-danger text-sm rounded-xl px-4 py-3 mb-4">
                    {error}
                  </div>
                )}

                <form id="code-form" onSubmit={handleVerifyCode} className="flex flex-col gap-6">
                  {/* 6 champs OTP individuels avec gestion de paste */}
                  <div className="flex justify-center gap-3" onPaste={handleCodePaste}>
                    {code.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { inputRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"   /* Clavier numérique sur mobile */
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeInput(i, e.target.value)}
                        onKeyDown={(e) => handleCodeKeyDown(i, e)}
                        className="w-12 h-14 text-center text-2xl font-bold bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    ))}
                  </div>

                  {/* Bouton désactivé tant que les 6 chiffres ne sont pas saisis */}
                  <Button type="submit" loading={loading} disabled={code.join("").length < 6}>
                    {t.login.verify}
                  </Button>
                </form>

                {/* Lien "Renvoyer le code" — réutilise handleRequestCode */}
                <button
                  onClick={handleRequestCode}
                  disabled={loading}
                  className="mt-4 w-full text-center text-sm text-gray-400 hover:text-primary transition-colors"
                >
                  {t.login.resend}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
