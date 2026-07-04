/**
 * @file (platform)/admin/page.tsx
 * @description Dashboard d'administration "/admin" — données 100 % réelles.
 *
 * Accessible uniquement aux rôles `admin` / `super_admin` (garde côté client +
 * gating côté API). Onglets : Vue d'ensemble, Utilisateurs, Cohortes, Audit.
 *
 * Sources réelles :
 *   - `analyticsApi.platformKPIs()` : utilisateurs (total, par rôle, actifs 30j) + contenus.
 *   - `cohortsApi.list()`           : santé des cohortes (complétion, à risque).
 *   - `auditApi.list()`             : journal des actions sensibles (Lot 5).
 * Plus aucune donnée mock (`PLATFORM_USERS`, `MOCK_*`) — cf. consigne « fausses stats ».
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { PageSpinner } from "@/components/ui/Spinner";
import UserManagement from "@/components/platform/UserManagement";
import AdminContentPanel from "@/components/platform/AdminContentPanel";
import {
  analyticsApi, cohortsApi, auditApi, ApiError,
  PlatformKPIs, CohortApi, AuditLogEntry,
} from "@/lib/api";
import { downloadCSV, todayStamp } from "@/lib/export";

const ADMIN_ROLES = ["admin", "super_admin"];

const ROLE_LABELS: Record<string, string> = {
  public: "Visiteurs", student: "Étudiants", teacher: "Enseignants",
  admin: "Admins", super_admin: "Super Admins",
};
const ROLE_COLORS: Record<string, string> = {
  student: "bg-primary", teacher: "bg-blue-500", admin: "bg-danger",
  super_admin: "bg-purple-500", public: "bg-gray-400",
};

const AUDIT_LABELS: Record<string, string> = {
  role_change: "Changement de rôle",
  user_status: "Suspension / réactivation",
  cohort_create: "Création de cohorte",
  cohort_delete: "Suppression de cohorte",
  report_create: "Signalement",
  report_resolved: "Signalement traité",
  report_dismissed: "Signalement rejeté",
  content_hide: "Contenu masqué",
  content_edit: "Brouillon de contenu",
  content_publish: "Publication de contenu",
  submission_create: "Nouvelle soumission",
};

function KpiCard({ icon, label, value, sub, accent }: {
  icon: string; label: string; value: string | number; sub?: string;
  accent?: "danger" | "green";
}) {
  const valueColor = accent === "danger" ? "text-danger" : accent === "green" ? "text-emerald-600" : "text-primary";
  const border = accent === "danger" ? "border-danger/20 bg-danger/5" : "border-gray-200";
  return (
    <div className={`bg-white border rounded-xl p-5 shadow-card ${border}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className={`text-2xl font-extrabold mb-0.5 ${valueColor}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
      {sub && <div className="text-xs text-gray-600 mt-1">{sub}</div>}
    </div>
  );
}

function MiniBar({ pct, color = "bg-primary" }: { pct: number; color?: string }) {
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden flex-1">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  );
}

type AdminTab = "overview" | "users" | "cohorts" | "audit" | "content";

export default function AdminDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const authorized = !!user && ADMIN_ROLES.includes(user.role);

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [kpis, setKpis] = useState<PlatformKPIs | null>(null);
  const [cohorts, setCohorts] = useState<CohortApi[]>([]);
  const [audit, setAudit] = useState<AuditLogEntry[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }
    if (!authorized) { router.replace("/dashboard"); return; }
    (async () => {
      setDataLoading(true);
      try {
        const [k, c] = await Promise.all([analyticsApi.platformKPIs(), cohortsApi.list()]);
        setKpis(k);
        setCohorts(c);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Impossible de charger les données.");
      } finally {
        setDataLoading(false);
      }
    })();
  }, [loading, user, authorized, router]);

  const loadAudit = useCallback(async () => {
    try {
      const res = await auditApi.list({ limit: 100 });
      setAudit(res.items);
    } catch {
      setAudit([]);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "audit") loadAudit();
  }, [activeTab, loadAudit]);

  function exportCohortsCSV() {
    const rows = cohorts.map((c) => ({
      "Cohorte": c.name, "École": c.school ?? "", "Statut": c.status,
      "Apprenants": c.enrolled_count, "Complétion (%)": c.completion_rate,
      "Score moyen": c.avg_score ?? "", "À risque": c.at_risk_count,
    }));
    downloadCSV(rows, `admin-cohortes-${todayStamp()}.csv`);
  }

  if (loading || !authorized) return <PageSpinner />;

  const activeCohorts = cohorts.filter((c) => c.status === "active");
  const totalAtRisk = cohorts.reduce((a, c) => a + c.at_risk_count, 0);
  const byRole = kpis?.users.by_role ?? {};
  const usersTotal = kpis?.users.total ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
            <span className="text-xs font-medium bg-purple-600/15 text-purple-600 border border-purple-600/25 px-2.5 py-0.5 rounded-full">Admin</span>
          </div>
          <p className="text-gray-500">Données réelles · Hi! PARIS Platform</p>
        </div>
        <button onClick={exportCohortsCSV} disabled={cohorts.length === 0}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 px-4 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-40">
          📊 Exporter cohortes CSV
        </button>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-8 w-fit">
        {([
          { key: "overview", label: "Vue d'ensemble" },
          { key: "users", label: "Utilisateurs" },
          { key: "cohorts", label: "Cohortes" },
          { key: "audit", label: "Audit" },
          { key: "content", label: "Contenu" },
        ] as const).map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key ? "bg-primary text-white shadow-sm" : "text-gray-500 hover:text-gray-900"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div className="mb-6 text-sm text-danger bg-danger/5 border border-danger/20 rounded-xl px-4 py-3">{error}</div>}
      {dataLoading && activeTab !== "users" && activeTab !== "content" && <p className="text-sm text-gray-500 mb-6">Chargement…</p>}

      {/* ── Contenu (blocs de texte éditables) ── */}
      {activeTab === "content" && <AdminContentPanel />}

      {/* ── Vue d'ensemble ── */}
      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard icon="👤" label="Utilisateurs" value={usersTotal} />
            <KpiCard icon="🟢" label="Actifs (30 j)" value={kpis?.users.active_last_30d ?? 0} accent="green" />
            <KpiCard icon="📖" label="Cours publiés" value={kpis?.content.courses_published ?? 0} sub={`/${kpis?.content.courses_total ?? 0} total`} />
            <KpiCard icon="🎓" label="Cohortes actives" value={activeCohorts.length} sub={`/${cohorts.length} total`} />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <KpiCard icon="▶" label="Vidéos" value={kpis?.content.videos ?? 0} />
            <KpiCard icon="🔀" label="MOOCs" value={kpis?.content.moocs ?? 0} />
            <KpiCard icon="⚡" label="Applications" value={kpis?.content.apps ?? 0} />
            <KpiCard icon="⚠️" label="Apprenants à risque" value={totalAtRisk} accent={totalAtRisk > 0 ? "danger" : undefined} />
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Santé des cohortes actives</h2>
            <p className="text-xs text-gray-500 mb-5">Complétion et apprenants à risque (calculés)</p>
            {activeCohorts.length === 0 ? (
              <p className="text-sm text-gray-500">Aucune cohorte active.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {activeCohorts.map((c) => (
                  <div key={c.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.school ?? "—"} · {c.enrolled_count} apprenants</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-900">{c.completion_rate}%</span>
                        {c.at_risk_count > 0 && <p className="text-xs text-orange-600">⚠️ {c.at_risk_count} à risque</p>}
                      </div>
                    </div>
                    <MiniBar pct={c.completion_rate}
                      color={c.completion_rate >= 80 ? "bg-green-500" : c.completion_rate >= 50 ? "bg-primary" : "bg-orange-500"} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Utilisateurs ── */}
      {activeTab === "users" && (
        <div className="flex flex-col gap-8">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Gestion des utilisateurs</h2>
            <p className="text-xs text-gray-500 mb-4">Rechercher, changer les rôles, suspendre. Actions limitées selon vos droits.</p>
            <UserManagement />
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-5">Répartition par rôle</h2>
            <div className="flex flex-col gap-4">
              {["super_admin", "admin", "teacher", "student", "public"]
                .filter((r) => (byRole[r] ?? 0) > 0)
                .map((r) => {
                  const count = byRole[r] ?? 0;
                  const pct = usersTotal ? Math.round((count / usersTotal) * 100) : 0;
                  return (
                    <div key={r}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-gray-600">{ROLE_LABELS[r] ?? r}</span>
                        <span className="text-sm font-bold text-gray-900">{count} <span className="text-xs font-normal text-gray-500">({pct}%)</span></span>
                      </div>
                      <MiniBar pct={pct} color={ROLE_COLORS[r] ?? "bg-primary"} />
                    </div>
                  );
                })}
            </div>
            <div className="mt-5 pt-4 border-t border-gray-100 text-xs text-gray-500">
              Total : {usersTotal} comptes · {kpis?.users.active_last_30d ?? 0} actifs sur 30 j
            </div>
          </div>
        </div>
      )}

      {/* ── Cohortes ── */}
      {activeTab === "cohorts" && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {cohorts.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-gray-500">Aucune cohorte.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Cohorte", "École", "Statut", "Apprenants", "Complétion", "Score moy.", "À risque"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3.5 first:pl-6">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cohorts.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{c.name}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{c.school ?? "—"}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{c.status}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-900">{c.enrolled_count}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20"><MiniBar pct={c.completion_rate} /></div>
                        <span className="text-sm font-semibold text-gray-900">{c.completion_rate}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">{c.avg_score != null ? `${c.avg_score}/100` : "—"}</td>
                    <td className="px-5 py-4 text-sm">{c.at_risk_count > 0 ? <span className="text-orange-600 font-semibold">{c.at_risk_count}</span> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Audit ── */}
      {activeTab === "audit" && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Journal d'audit</h2>
            <p className="text-xs text-gray-500">100 dernières actions sensibles (rôles, suspensions, cohortes, modération).</p>
          </div>
          {audit.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-gray-500">Aucune entrée d'audit.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Date", "Action", "Cible", "Détail"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 first:pl-6">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {audit.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {a.created_at ? new Date(a.created_at).toLocaleString("fr-FR") : "—"}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-900">{AUDIT_LABELS[a.action] ?? a.action}</td>
                    <td className="px-5 py-3 text-xs text-gray-500">{a.target_type ? `${a.target_type} ${(a.target_id ?? "").slice(0, 8)}` : "—"}</td>
                    <td className="px-5 py-3 text-xs text-gray-500">{a.meta ? JSON.stringify(a.meta) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
