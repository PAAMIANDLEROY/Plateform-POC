"use client";

import { useState, FormEvent, useEffect } from "react";
import { authApi, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageSpinner } from "@/components/ui/Spinner";

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

const roleLabel: Record<string, string> = {
  student:   "Étudiant",
  teacher:   "Enseignant",
  admin:     "Administrateur",
  superuser: "Super Admin",
  public:    "Visiteur",
};

export default function ProfilePage() {
  const { user, setUser, loading: authLoading } = useAuth();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    school: "",
    bio: "",
    linkedin: "",
    github: "",
    avatar_url: "",
  });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name,
        last_name: user.last_name,
        school: user.school ?? "",
        bio: user.bio ?? "",
        linkedin: user.linkedin ?? "",
        github: user.github ?? "",
        avatar_url: user.avatar_url ?? "",
      });
    }
  }, [user]);

  if (authLoading) return <PageSpinner />;
  if (!user) return null;

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSaving(true);
    try {
      const updated = await authApi.updateProfile({
        ...form,
        avatar_url: form.avatar_url || null,
      });
      setUser(updated);
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue");
    } finally {
      setSaving(false);
    }
  }

  const fullName = `${user.first_name} ${user.last_name}`.trim() || user.email;

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">

      {/* Header */}
      <div className="flex items-start gap-6 mb-10">
        <Avatar name={fullName} src={user.avatar_url} size="lg" className="w-20 h-20 text-2xl" />
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-white">
            {fullName || "Profil incomplet"}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{user.email}</p>
          <div className="flex items-center gap-2 mt-3">
            <Badge variant={user.role === "admin" || user.role === "superuser" ? "danger" : user.role === "teacher" ? "primary" : "neutral"}>
              {roleLabel[user.role] ?? user.role}
            </Badge>
            {user.school && <Badge variant="ghost">{user.school}</Badge>}
          </div>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-primary hover:text-primary-light font-medium transition-colors"
          >
            Modifier
          </button>
        )}
      </div>

      {/* Succès */}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-xl px-4 py-3 mb-6">
          Profil mis à jour avec succès.
        </div>
      )}

      {/* Lecture seule */}
      {!editing && (
        <div className="bg-gray-950 border border-white/10 rounded-2xl divide-y divide-white/5">
          <Row label="Prénom" value={user.first_name || "—"} />
          <Row label="Nom" value={user.last_name || "—"} />
          <Row label="Email" value={user.email} />
          <Row label="Institution" value={user.school || "—"} />
          <Row label="Biographie" value={user.bio || "—"} multiline />
          <Row label="LinkedIn" value={user.linkedin || "—"} />
          <Row label="GitHub" value={user.github || "—"} />
        </div>
      )}

      {/* Formulaire d'édition */}
      {editing && (
        <form onSubmit={handleSave} className="bg-gray-950 border border-white/10 rounded-2xl p-7 flex flex-col gap-5">

          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input label="Prénom *" value={form.first_name} onChange={set("first_name")} required />
            <Input label="Nom *" value={form.last_name} onChange={set("last_name")} required />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-300">Institution</label>
            <select
              value={form.school}
              onChange={set("school")}
              className="w-full px-4 py-2.5 bg-gray-900 border border-white/10 text-white rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            >
              <option value="">— Sélectionner —</option>
              {SCHOOLS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-300">Biographie</label>
            <textarea
              value={form.bio}
              onChange={set("bio")}
              rows={3}
              placeholder="Quelques mots sur vous..."
              className="w-full px-4 py-2.5 bg-gray-900 border border-white/10 text-white rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none placeholder-gray-600"
            />
          </div>

          <Input label="URL photo de profil" value={form.avatar_url} onChange={set("avatar_url")} placeholder="https://..." />
          <Input label="LinkedIn" value={form.linkedin} onChange={set("linkedin")} placeholder="linkedin.com/in/..." />
          <Input label="GitHub" value={form.github} onChange={set("github")} placeholder="github.com/..." />

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={saving}>Enregistrer</Button>
            <button
              type="button"
              onClick={() => { setEditing(false); setError(""); }}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:text-white hover:border-white/30 transition-all"
            >
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Row({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className="flex gap-4 px-6 py-4">
      <span className="text-sm text-gray-500 w-28 shrink-0">{label}</span>
      <span className={`text-sm text-white flex-1 ${multiline ? "whitespace-pre-wrap" : ""}`}>{value}</span>
    </div>
  );
}
