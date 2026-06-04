"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, FormEvent, useRef } from "react";
import { authApi, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Step = "email" | "code";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Étape 1 : envoyer le code ─────────────────────────────────────────────

  async function handleRequestCode(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.requestCode(email);
      setStep("code");
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  // ── Étape 2 : vérifier le code ────────────────────────────────────────────

  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length < 6) return;
    setError("");
    setLoading(true);
    try {
      const data = await authApi.verifyCode(email, fullCode);
      setUser(data.user);
      router.push(data.is_new || !data.user.is_profile_complete ? "/complete-profile" : "/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Code invalide ou expiré");
      setCode(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  }

  // ── Saisie du code 6 chiffres ─────────────────────────────────────────────

  function handleCodeInput(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
    if (next.every((d) => d !== "")) {
      // auto-submit
      const form = document.getElementById("code-form") as HTMLFormElement;
      form?.requestSubmit();
    }
  }

  function handleCodeKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleCodePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="text-3xl font-extrabold text-white tracking-tight">
            Hi! <span className="text-primary">Platform</span>
          </Link>
          <p className="mt-2 text-gray-500 text-sm">Plateforme pédagogique Hi! PARIS</p>
        </div>

        <div className="bg-gray-950 border border-white/10 rounded-2xl p-8">

          {step === "email" ? (
            <>
              <h1 className="text-xl font-bold text-white mb-1">Connexion</h1>
              <p className="text-sm text-gray-500 mb-6">
                Entrez votre email institutionnel pour recevoir un code à 6 chiffres.
              </p>

              {error && (
                <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg px-4 py-3 mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleRequestCode} className="flex flex-col gap-4">
                <Input
                  label="Email institutionnel"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="prenom.nom@ip-paris.fr"
                  required
                  autoComplete="email"
                />
                <Button type="submit" loading={loading} className="mt-2">
                  Recevoir le code
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => { setStep("email"); setCode(["", "", "", "", "", ""]); setError(""); }}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  ←
                </button>
                <div>
                  <h1 className="text-xl font-bold text-white">Code envoyé</h1>
                  <p className="text-sm text-gray-500">
                    Entrez le code reçu à <span className="text-white font-medium">{email}</span>
                  </p>
                </div>
              </div>

              {error && (
                <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg px-4 py-3 mb-4">
                  {error}
                </div>
              )}

              <form id="code-form" onSubmit={handleVerifyCode} className="flex flex-col gap-6">
                <div className="flex justify-center gap-3" onPaste={handleCodePaste}>
                  {code.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeInput(i, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(i, e)}
                      className="w-12 h-14 text-center text-2xl font-bold bg-gray-900 border border-white/10 text-white rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                  ))}
                </div>

                <Button type="submit" loading={loading} disabled={code.join("").length < 6}>
                  Vérifier
                </Button>
              </form>

              <button
                onClick={handleRequestCode}
                disabled={loading}
                className="mt-4 w-full text-center text-sm text-gray-500 hover:text-white transition-colors"
              >
                Renvoyer le code
              </button>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-gray-600">
          Réservé aux membres des institutions partenaires d'Hi! PARIS.
        </p>
      </div>
    </div>
  );
}
