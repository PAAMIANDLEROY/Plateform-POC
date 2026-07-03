/**
 * @file (platform)/profile/page.tsx
 * @description Page de profil utilisateur "/profile".
 *
 * Deux modes d'affichage contrôlés par l'état `editing` :
 *   - Mode lecture (défaut) : tableau de champs en lecture seule via le composant `Row`.
 *   - Mode édition         : formulaire complet avec les mêmes champs éditables.
 *
 * Section RGPD (en bas de page, toujours visible) :
 *   - Export des données personnelles → `authApi.exportMyData()` → téléchargement JSON.
 *   - Lien vers la politique de confidentialité.
 *   - Suppression du compte → `confirm()` → `authApi.deleteMe()` → `logout()` → "/login".
 *
 * Badge de rôle :
 *   - admin / super_admin → `danger` (rouge)
 *   - teacher           → `primary` (bleu)
 *   - student / autre   → `neutral` (gris)
 *
 * Feedback visuel :
 *   - Bannière verte "Profil mis à jour" disparaît après 3 secondes.
 *   - Bannière rouge en cas d'erreur API.
 *
 * Chargement :
 *   - `PageSpinner` affiché pendant `authLoading`.
 *   - `null` rendu si `user` est null après chargement (redirigé par le middleware).
 */

"use client";

import { useState, FormEvent, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageSpinner } from "@/components/ui/Spinner";

/** Liste des établissements partenaires (identique à CompleteProfilePage). */
const SCHOOLS = [
  "École Polytechnique", "Télécom Paris", "ENSTA Paris", "ENSAE Paris",
  "HEC Paris", "AgroParisTech", "Mines Paris", "Institut Polytechnique de Paris", "Autre",
];

/**
 * Page de profil avec gestion des données personnelles (RGPD).
 */
export default function ProfilePage() {
  const { user, setUser, logout, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  /** État du formulaire — pré-rempli avec les données utilisateur au montage. */
  const [form, setForm] = useState({
    first_name: "", last_name: "", school: "",
    bio: "", linkedin: "", github: "", avatar_url: "",
  });

  /** `true` si le formulaire d'édition est visible. */
  const [editing, setEditing] = useState(false);

  /** `true` pendant la sauvegarde du profil. */
  const [saving, setSaving] = useState(false);

  /** Message d'erreur API ou de validation. */
  const [error, setError] = useState("");

  /** `true` pour 3 secondes après une sauvegarde réussie. */
  const [success, setSuccess] = useState(false);

  /**
   * Pré-remplit le formulaire avec les données de l'utilisateur connecté.
   * Déclenché à chaque changement de `user` (ex. après un refresh token).
   * Les champs optionnels utilisent `?? ""` pour éviter les valeurs `undefined`.
   */
  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name,
        last_name:  user.last_name,
        school:     user.school ?? "",
        bio:        user.bio ?? "",
        linkedin:   user.linkedin ?? "",
        github:     user.github ?? "",
        avatar_url: user.avatar_url ?? "",
      });
    }
  }, [user]);

  // Branche chargement : spinner pleine page
  if (authLoading) return <PageSpinner />;
  // Branche non connecté : null (le middleware redirige vers /login)
  if (!user) return null;

  /**
   * Fabrique un handler `onChange` typé pour chaque champ du formulaire.
   * Identique au pattern de `CompleteProfilePage`.
   */
  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  /**
   * Sauvegarde le profil via l'API.
   * En cas de succès : ferme le formulaire et affiche la bannière verte pendant 3s.
   */
  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError(""); setSuccess(false); setSaving(true);
    try {
      // avatar_url vide → null pour ne pas stocker une chaîne vide en DB
      const updated = await authApi.updateProfile({ ...form, avatar_url: form.avatar_url || null });
      setUser(updated);
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.common.error);
    } finally { setSaving(false); }
  }

  /**
   * Exporte toutes les données personnelles de l'utilisateur (RGPD – droit à la portabilité).
   * Déclenche un téléchargement JSON via un `<a>` temporaire créé dans le DOM.
   */
  async function handleExport() {
    const blob = await authApi.exportMyData();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hi-platform-mes-donnees.json";
    a.click();
    URL.revokeObjectURL(url); // Libère la mémoire après le téléchargement
  }

  /**
   * Supprime le compte utilisateur après confirmation (RGPD – droit à l'effacement).
   * Flux : confirm() → API → logout() → redirection vers "/login".
   */
  async function handleDeleteAccount() {
    // Guard : confirmation native du navigateur
    if (!confirm(t.profile.rgpd.deleteConfirm)) return;
    await authApi.deleteMe();
    await logout();
    router.push("/login");
  }

  /**
   * Nom complet calculé pour l'affichage.
   * Fallback sur l'email si le prénom et le nom sont vides.
   */
  const fullName = `${user.first_name} ${user.last_name}`.trim() || user.email;

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">

      {/* En-tête : avatar, nom, email, badges rôle + école */}
      <div className="flex items-start gap-6 mb-10">
        <Avatar name={fullName} src={user.avatar_url} size="lg" className="w-20 h-20 text-2xl" />
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-gray-900">{fullName || t.profile.incomplete}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{user.email}</p>
          <div className="flex items-center gap-2 mt-3">
            {/* Badge rôle : rouge pour admin/super_admin, bleu pour teacher, gris sinon */}
            <Badge variant={
              user.role === "admin" || user.role === "super_admin" ? "danger"
              : user.role === "teacher" ? "primary"
              : "neutral"
            }>
              {t.roles[user.role as keyof typeof t.roles] ?? user.role}
            </Badge>
            {/* Badge école — affiché uniquement si défini */}
            {user.school && <Badge variant="ghost">{user.school}</Badge>}
          </div>
        </div>
        {/* Bouton "Modifier" — masqué en mode édition */}
        {!editing && (
          <button onClick={() => setEditing(true)} className="text-sm text-primary hover:text-primary-dark font-medium transition-colors">
            {t.profile.editBtn}
          </button>
        )}
      </div>

      {/* Bannière de succès — visible 3s après sauvegarde */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3 mb-6">
          {t.profile.success}
        </div>
      )}

      {/* ── Mode lecture — tableau de champs en lecture seule ── */}
      {!editing && (
        <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 mb-8">
          <Row label={t.profile.fields.firstName} value={user.first_name || "—"} />
          <Row label={t.profile.fields.lastName}  value={user.last_name || "—"} />
          <Row label={t.profile.fields.email}     value={user.email} />
          <Row label={t.profile.fields.school}    value={user.school || "—"} />
          <Row label={t.profile.fields.bio}       value={user.bio || "—"} multiline />
          <Row label={t.profile.fields.linkedin}  value={user.linkedin || "—"} />
          <Row label={t.profile.fields.github}    value={user.github || "—"} />
        </div>
      )}

      {/* ── Mode édition — formulaire complet ── */}
      {editing && (
        <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-2xl p-7 flex flex-col gap-5 mb-8">
          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg px-4 py-3">{error}</div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input label={t.profile.fields.firstName + " *"} value={form.first_name} onChange={set("first_name")} required />
            <Input label={t.profile.fields.lastName + " *"}  value={form.last_name}  onChange={set("last_name")}  required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">{t.profile.fields.school}</label>
            <select value={form.school} onChange={set("school")} className="w-full px-4 py-2.5 bg-white border border-gray-300 text-gray-900 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all">
              <option value="">—</option>
              {SCHOOLS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">{t.profile.fields.bio}</label>
            <textarea value={form.bio} onChange={set("bio")} rows={3}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 text-gray-900 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none placeholder-gray-400" />
          </div>
          <Input label={t.profile.fields.avatarUrl} value={form.avatar_url} onChange={set("avatar_url")} placeholder={t.profile.fields.avatarPlaceholder} />
          <Input label={t.profile.fields.linkedin}  value={form.linkedin}   onChange={set("linkedin")} />
          <Input label={t.profile.fields.github}    value={form.github}     onChange={set("github")} />
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={saving}>{t.profile.saveBtn}</Button>
            {/* Bouton Annuler : ferme le formulaire et réinitialise l'erreur */}
            <button type="button" onClick={() => { setEditing(false); setError(""); }}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:text-gray-900 hover:border-gray-300 transition-all">
              {t.profile.cancelBtn}
            </button>
          </div>
        </form>
      )}

      {/* ── Section RGPD ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-base font-bold text-gray-900 mb-4">{t.profile.rgpd.title}</h2>
        <div className="space-y-3">
          {/* Export JSON des données personnelles */}
          <RgpdRow title={t.profile.rgpd.exportTitle} desc={t.profile.rgpd.exportDesc}
            action={
              <button onClick={handleExport} className="text-xs border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap">
                {t.profile.rgpd.exportBtn}
              </button>
            }
          />
          {/* Lien vers la politique de confidentialité */}
          <RgpdRow title={t.profile.rgpd.consentTitle} desc={t.profile.rgpd.consentDesc}
            action={
              <Link href="/privacy" className="text-xs text-primary hover:text-primary-dark transition-colors whitespace-nowrap">
                {t.profile.rgpd.consentLink}
              </Link>
            }
          />
          {/* Suppression du compte — titre et bouton en rouge (danger=true) */}
          <RgpdRow title={t.profile.rgpd.deleteTitle} desc={t.profile.rgpd.deleteDesc} danger
            action={
              <button onClick={handleDeleteAccount} className="text-xs border border-danger/30 text-danger px-4 py-2 rounded-lg hover:bg-danger/10 transition-colors whitespace-nowrap">
                {t.profile.rgpd.deleteBtn}
              </button>
            }
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Ligne de champ en lecture seule dans le tableau de profil.
 *
 * @property label     - Libellé du champ (colonne gauche).
 * @property value     - Valeur affichée (colonne droite).
 * @property multiline - Si `true`, préserve les sauts de ligne (`whitespace-pre-wrap`).
 */
function Row({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className="flex gap-4 px-6 py-4">
      <span className="text-sm text-gray-500 w-28 shrink-0">{label}</span>
      <span className={`text-sm text-gray-900 flex-1 ${multiline ? "whitespace-pre-wrap" : ""}`}>{value}</span>
    </div>
  );
}

/**
 * Ligne RGPD avec titre, description et action.
 * Ligne avec séparateur (`border-t`) sauf la première.
 *
 * @property title  - Titre de l'action RGPD.
 * @property desc   - Description courte.
 * @property action - Bouton ou lien d'action.
 * @property danger - Si `true`, titre en rouge (actions destructives).
 */
function RgpdRow({ title, desc, action, danger }: {
  title: string; desc: string; action: React.ReactNode; danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-t border-gray-100 first:border-t-0 first:pt-0">
      <div>
        <p className={`text-sm font-medium ${danger ? "text-danger" : "text-gray-900"}`}>{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
      {action}
    </div>
  );
}
