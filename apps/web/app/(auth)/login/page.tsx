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

  function handleCodeInput(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
    if (next.every((d) => d !== "")) {
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

  return (
    <div className="min-h-screen bg-surface flex">

      {/* ── Left panel — branding ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-danger rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative">
          <div className="flex items-baseline gap-0 mb-2">
            <span className="text-3xl font-extrabold text-primary-light">Hi!</span>
            <span className="text-3xl font-extrabold text-white"> Platform</span>
          </div>
          <p className="text-white/50 text-sm">Plateforme pédagogique Hi! PARIS</p>
        </div>

        <div className="relative space-y-8">
          <blockquote className="border-l-2 border-primary-light pl-6">
            <p className="text-xl font-light text-white/90 leading-relaxed italic">
              "La plateforme qui réunit la recherche en IA et la formation de demain."
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

      {/* ── Right panel — form ────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* Logo (mobile only) */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-baseline gap-0">
              <span className="text-2xl font-extrabold text-primary">Hi!</span>
              <span className="text-2xl font-extrabold text-gray-900"> Platform</span>
            </Link>
            <p className="mt-1 text-sm text-gray-400">Plateforme pédagogique Hi! PARIS</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-card">

            {step === "email" ? (
              <>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Connexion</h1>
                <p className="text-sm text-gray-500 mb-6">
                  Entrez votre email institutionnel pour recevoir un code à 6 chiffres.
                </p>

                {error && (
                  <div className="bg-danger/5 border border-danger/20 text-danger text-sm rounded-xl px-4 py-3 mb-4">
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

                <p className="mt-6 text-center text-xs text-gray-400">
                  Réservé aux membres des institutions partenaires d'Hi! PARIS.
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={() => { setStep("email"); setCode(["", "", "", "", "", ""]); setError(""); }}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors text-sm"
                  >
                    ←
                  </button>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Code envoyé ✓</h1>
                    <p className="text-sm text-gray-500">
                      Code envoyé à <span className="text-gray-900 font-medium">{email}</span>
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="bg-danger/5 border border-danger/20 text-danger text-sm rounded-xl px-4 py-3 mb-4">
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
                        className="w-12 h-14 text-center text-2xl font-bold bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
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
                  className="mt-4 w-full text-center text-sm text-gray-400 hover:text-primary transition-colors"
                >
                  Renvoyer le code
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
