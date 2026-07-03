/**
 * @file UserManagement.tsx
 * @description Table de gestion des utilisateurs pour l'onglet Admin → Utilisateurs.
 *
 * Permet de :
 *   - lister / rechercher / filtrer les utilisateurs (API `adminUsersApi.list`),
 *   - changer le rôle d'un utilisateur (délégation §6 — voir ROLES-ET-DROITS.md),
 *   - suspendre / réactiver un compte.
 *
 * La règle de délégation est ré-implémentée côté client UNIQUEMENT pour l'UX
 * (masquer/désactiver les actions interdites). L'autorité fait foi côté API :
 * chaque action est de toute façon revalidée par le backend (403 sinon).
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { adminUsersApi, AdminUser, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

// ─── Hiérarchie des rôles (miroir de core/roles.py) ──────────────────────────

const ROLE_LEVEL: Record<string, number> = {
  public: 0, student: 1, teacher: 2, admin: 3, super_admin: 4,
};

const ROLE_LABELS: Record<string, string> = {
  public: "Visiteur",
  student: "Étudiant",
  teacher: "Enseignant",
  admin: "Administrateur",
  super_admin: "Super Admin",
};

const ALL_ROLES = ["public", "student", "teacher", "admin", "super_admin"];

const level = (r: string) => ROLE_LEVEL[r] ?? -1;

/** Le super_admin domine tout le monde ; sinon niveau strictement supérieur. */
function canManageUser(actor: string, target: string): boolean {
  if (actor === "super_admin") return true;
  return level(actor) > level(target);
}

function canManageRole(actor: string, targetCurrent: string, newRole: string): boolean {
  return canManageUser(actor, targetCurrent) && canManageUser(actor, newRole);
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function UserManagement() {
  const { user } = useAuth();
  const actorRole = user?.role ?? "public";

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  /** Id de la ligne en cours de mutation (désactive ses contrôles). */
  const [busyId, setBusyId] = useState<string | null>(null);
  /** Message d'erreur par ligne (ex. 403 renvoyé par l'API). */
  const [rowError, setRowError] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminUsersApi.list({
        q: search || undefined,
        role: roleFilter || undefined,
        limit: 100,
      });
      setUsers(res.items);
      setTotal(res.total);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Impossible de charger les utilisateurs.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => { load(); }, [load]);

  function setRowMsg(id: string, msg: string) {
    setRowError((prev) => ({ ...prev, [id]: msg }));
  }

  async function handleRoleChange(u: AdminUser, newRole: string) {
    if (newRole === u.role) return;
    setBusyId(u.id);
    setRowMsg(u.id, "");
    try {
      const updated = await adminUsersApi.changeRole(u.id, newRole);
      setUsers((list) => list.map((x) => (x.id === u.id ? updated : x)));
    } catch (e) {
      setRowMsg(u.id, e instanceof ApiError ? e.message : "Échec du changement de rôle.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleStatusToggle(u: AdminUser) {
    setBusyId(u.id);
    setRowMsg(u.id, "");
    try {
      const updated = await adminUsersApi.changeStatus(u.id, !u.is_active);
      setUsers((list) => list.map((x) => (x.id === u.id ? updated : x)));
    } catch (e) {
      setRowMsg(u.id, e instanceof ApiError ? e.message : "Échec du changement de statut.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Barre de filtres */}
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher (nom, email)…"
          className="flex-1 min-w-[200px] text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
        >
          <option value="">Tous les rôles</option>
          {ALL_ROLES.map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
        <span className="text-xs text-gray-500 ml-auto">{total} utilisateur(s)</span>
      </div>

      {error && <div className="px-4 py-3 text-sm text-danger bg-danger/5">{error}</div>}
      {loading ? (
        <div className="px-4 py-10 text-center text-sm text-gray-500">Chargement…</div>
      ) : users.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-gray-500">Aucun utilisateur trouvé.</div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {["Utilisateur", "École", "Rôle", "Statut", "Actions"].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 first:pl-6">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((u) => {
              const isSelf = u.id === user?.id;
              const manageable = canManageUser(actorRole, u.role) && !isSelf;
              return (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  {/* Identité */}
                  <td className="px-6 py-3">
                    <p className="text-sm font-medium text-gray-900">
                      {(u.first_name || u.last_name) ? `${u.first_name} ${u.last_name}`.trim() : "—"}
                      {isSelf && <span className="ml-2 text-xs text-primary">(vous)</span>}
                    </p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                    {rowError[u.id] && <p className="text-xs text-danger mt-1">{rowError[u.id]}</p>}
                  </td>
                  {/* École */}
                  <td className="px-5 py-3 text-sm text-gray-600">{u.school || "—"}</td>
                  {/* Rôle — select limité par la délégation */}
                  <td className="px-5 py-3">
                    <select
                      value={u.role}
                      disabled={!manageable || busyId === u.id}
                      onChange={(e) => handleRoleChange(u, e.target.value)}
                      className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white disabled:bg-gray-50 disabled:text-gray-400"
                    >
                      {ALL_ROLES.map((r) => (
                        <option
                          key={r}
                          value={r}
                          // On ne peut choisir que les rôles assignables ; le rôle courant reste affiché.
                          disabled={r !== u.role && !canManageRole(actorRole, u.role, r)}
                        >
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                  {/* Statut */}
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                      u.is_active
                        ? "bg-green-500/10 text-green-600 border-green-500/20"
                        : "bg-danger/10 text-danger border-danger/20"
                    }`}>
                      {u.is_active ? "Actif" : "Suspendu"}
                    </span>
                  </td>
                  {/* Actions */}
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleStatusToggle(u)}
                      disabled={!manageable || busyId === u.id}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {u.is_active ? "Suspendre" : "Réactiver"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
