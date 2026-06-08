/**
 * @file (auth)/complete-profile/page.tsx
 * @description Page de complétion de profil "/complete-profile".
 *
 * Affichée après la première connexion (nouvel utilisateur) ou si le profil est incomplet.
 * Collecte les informations manquantes : prénom, nom (obligatoires), école, bio, LinkedIn, GitHub.
 *
 * Flux :
 *   1. L'utilisateur remplit le formulaire.
 *   2. Validation front : prénom ET nom obligatoires (vérification non vide après trim).
 *   3. Appel `authApi.updateProfile(form)` → retourne l'utilisateur mis à jour.
 *   4. `setUser(updated)` → met à jour le contexte d'auth.
 *   5. Redirection vers "/dashboard".
 *
 * Champs :
 *   - `first_name` + `last_name` : grid 2 colonnes — obligatoires.
 *   - `school`     : `<select>` avec 9 écoles partenaires + "Autre".
 *   - `bio`        : `<textarea>` 3 lignes — optionnel.
 *   - `linkedin`   : URL LinkedIn — optionnel.
 *   - `github`     : URL GitHub — optionnel.
 *
 * Le helper `set(key)` génère un handler `onChange` typé pour chaque champ du formulaire,
 * permettant de mettre à jour le state sans répéter le pattern de spread.
 */

"use client";

import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { authApi, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

/**
 * Liste des établissements partenaires Hi! PARIS.
 * Affichée dans le `<select>` "École d'appartenance".
 * "Autre" permet aux utilisateurs n'appartenant à aucune école listée de compléter leur profil.
 */
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

/**
 * Page de complétion de profil utilisateur.
 */
export default function CompleteProfilePage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const { t } = useLanguage();

  /** État du formulaire — tous les champs initialisés à vide. */
  const [form, setForm] = useState({
    first_name: "",
    last_name:  "",
    school:     "",
    bio:        "",
    linkedin:   "",
    github:     "",
  });

  /** Message d'erreur de validation ou d'API. */
  const [error, setError] = useState("");

  /** État de chargement — désactive le bouton pendant l'appel API. */
  const [loading, setLoading] = useState(false);

  /**
   * Fabrique un handler `onChange` typé pour chaque clé du formulaire.
   * Accepte les événements de `<input>`, `<textarea>` et `<select>`.
   *
   * @param key - Clé du champ à mettre à jour dans l'objet `form`.
   * @returns Handler onChange qui met à jour `form[key]` via spread immutable.
   */
  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  /**
   * Soumet le formulaire de complétion de profil.
   * Valide les champs obligatoires avant l'appel API.
   */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Validation front : prénom ET nom obligatoires (trim pour rejeter les espaces)
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError(t.completeProfile.requiredError);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const updated = await authApi.updateProfile(form);
      setUser(updated);          // Met à jour le contexte global d'auth
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.common.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">👋</div>
          <h1 className="text-2xl font-extrabold text-gray-900">{t.completeProfile.title}</h1>
          <p className="text-gray-500 text-sm mt-2">{t.completeProfile.subtitle}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-card">

          {/* Bannière d'erreur — visible uniquement si `error` est non vide */}
          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Prénom + Nom : grid 2 colonnes — les deux sont obligatoires */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t.completeProfile.firstName}
                value={form.first_name}
                onChange={set("first_name")}
                placeholder={t.completeProfile.firstNamePlaceholder}
                required
                autoComplete="given-name"
              />
              <Input
                label={t.completeProfile.lastName}
                value={form.last_name}
                onChange={set("last_name")}
                placeholder={t.completeProfile.lastNamePlaceholder}
                required
                autoComplete="family-name"
              />
            </div>

            {/* École — select custom (pas le composant Input) pour utiliser <select> */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                {t.completeProfile.school}
              </label>
              <select
                value={form.school}
                onChange={set("school")}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 text-gray-900 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              >
                <option value="">{t.completeProfile.selectSchool}</option>
                {SCHOOLS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Bio — textarea optionnel, resize-none pour cohérence UI */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                {t.completeProfile.bio}{" "}
                <span className="text-gray-400 font-normal">{t.completeProfile.optional}</span>
              </label>
              <textarea
                value={form.bio}
                onChange={set("bio")}
                placeholder={t.completeProfile.bioPlaceholder}
                rows={3}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 text-gray-900 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none placeholder-gray-400"
              />
            </div>

            {/* Section réseaux sociaux — séparée du reste par une ligne horizontale */}
            <div className="border-t border-gray-100 pt-4 flex flex-col gap-4">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                {t.completeProfile.networks}{" "}
                <span className="normal-case font-normal">{t.completeProfile.optional}</span>
              </p>
              <Input
                label="LinkedIn"
                value={form.linkedin}
                onChange={set("linkedin")}
                placeholder={t.completeProfile.linkedinPlaceholder}
              />
              <Input
                label="GitHub"
                value={form.github}
                onChange={set("github")}
                placeholder={t.completeProfile.githubPlaceholder}
              />
            </div>

            <Button type="submit" loading={loading} className="mt-2">
              {t.completeProfile.submit}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
