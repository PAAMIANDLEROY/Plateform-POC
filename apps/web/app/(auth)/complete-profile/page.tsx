"use client";

import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { authApi, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const SCHOOLS = [
  "École Polytechnique",
  "Télécom Paris",
  "ENSTA Paris",
  "ENSAE Paris",
  "HEC Paris",
  "AgroParisTech",
  "Mines Paris",
  "Institut Polytechnique de Paris",
  "Autre",
];

export default function CompleteProfilePage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    school: "",
    bio: "",
    linkedin: "",
    github: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError("Le prénom et le nom sont requis.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const updated = await authApi.updateProfile(form);
      setUser(updated);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        <div className="text-center mb-8">
          <div className="text-4xl mb-3">👋</div>
          <h1 className="text-2xl font-extrabold text-gray-900">Bienvenue sur Hi! Platform</h1>
          <p className="text-gray-500 text-sm mt-2">Complétez votre profil pour commencer.</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-card">

          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Prénom *"
                value={form.first_name}
                onChange={set("first_name")}
                placeholder="Marie"
                required
                autoComplete="given-name"
              />
              <Input
                label="Nom *"
                value={form.last_name}
                onChange={set("last_name")}
                placeholder="Curie"
                required
                autoComplete="family-name"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-300">École / Institution</label>
              <select
                value={form.school}
                onChange={set("school")}
                className="w-full px-4 py-2.5 bg-gray-900 border border-white/10 text-white rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              >
                <option value="">— Sélectionner —</option>
                {SCHOOLS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-300">Biographie <span className="text-gray-600">(optionnel)</span></label>
              <textarea
                value={form.bio}
                onChange={set("bio")}
                placeholder="Quelques mots sur vous, vos centres d'intérêt..."
                rows={3}
                className="w-full px-4 py-2.5 bg-gray-900 border border-white/10 text-white rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none placeholder-gray-600"
              />
            </div>

            <div className="border-t border-white/5 pt-4 flex flex-col gap-4">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Réseaux <span className="normal-case">(optionnel)</span></p>
              <Input
                label="LinkedIn"
                value={form.linkedin}
                onChange={set("linkedin")}
                placeholder="linkedin.com/in/marie-curie"
              />
              <Input
                label="GitHub"
                value={form.github}
                onChange={set("github")}
                placeholder="github.com/marie-curie"
              />
            </div>

            <Button type="submit" loading={loading} className="mt-2">
              Accéder à la plateforme →
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
