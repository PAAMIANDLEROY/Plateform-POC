"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authApi, ApiError } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function setField(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.first_name.trim()) errs.first_name = "Le prénom est requis";
    if (!form.last_name.trim()) errs.last_name = "Le nom est requis";
    if (!form.email.includes("@")) errs.email = "Email invalide";
    if (form.password.length < 8) errs.password = "8 caractères minimum";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setGlobalError("");
    if (!validate()) return;
    setLoading(true);
    try {
      await authApi.register(form);
      setSuccess(true);
    } catch (err) {
      setGlobalError(err instanceof ApiError ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-4xl mb-4">📬</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Vérifiez votre email</h2>
          <p className="text-text-muted text-sm">
            Un lien de vérification a été envoyé à <strong>{form.email}</strong>.<br />
            Cliquez sur le lien pour activer votre compte.
          </p>
          <Link href="/login" className="mt-6 inline-block text-primary text-sm font-medium hover:underline">
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-primary">
            Hi! Platform
          </Link>
          <p className="mt-2 text-text-muted text-sm">Créez votre compte avec votre email institutionnel</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-6">Inscription</h1>

          {globalError && (
            <div className="bg-red-50 border border-red-200 text-danger text-sm rounded-lg px-4 py-3 mb-4">
              {globalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Prénom"
                value={form.first_name}
                onChange={setField("first_name")}
                error={errors.first_name}
                required
                autoComplete="given-name"
              />
              <Input
                label="Nom"
                value={form.last_name}
                onChange={setField("last_name")}
                error={errors.last_name}
                required
                autoComplete="family-name"
              />
            </div>
            <Input
              label="Email institutionnel"
              type="email"
              value={form.email}
              onChange={setField("email")}
              error={errors.email}
              placeholder="prenom.nom@polytechnique.edu"
              required
              autoComplete="email"
            />
            <Input
              label="Mot de passe"
              type="password"
              value={form.password}
              onChange={setField("password")}
              error={errors.password}
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
            <p className="text-xs text-text-muted -mt-1">
              8 caractères minimum, avec une majuscule et un chiffre.
            </p>
            <Button type="submit" loading={loading} className="mt-2">
              Créer mon compte
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-text-muted">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-text-muted">
          Réservé aux membres des institutions partenaires d'IP Paris.
        </p>
      </div>
    </div>
  );
}
