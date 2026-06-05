"use client";

import { useState } from "react";
import Link from "next/link";
import { MOCK_COHORTS, MOCK_STUDENTS, MOCK_VIDEOS, MOCK_COURSES, MOCK_MOOCS, MOCK_APPS, MOCK_INSIGHTS } from "@/lib/mock";
import { downloadCSV, todayStamp } from "@/lib/export";

// ─── Platform stats derived from mock data ─────────────────────────────────

const PLATFORM_USERS = {
  total: 287,
  student: 241,
  teacher: 35,
  admin: 8,
  superuser: 3,
  activeToday: 48,
  newThisWeek: 12,
};

const publishedCourses = MOCK_COURSES.filter((c) => c.status === "published").length;
const activeCohorts    = MOCK_COHORTS.filter((c) => c.status === "active");
const atRiskStudents   = MOCK_STUDENTS.filter((s) => s.status === "at-risk" || s.status === "inactive");
const avgPlatformCompletion = Math.round(
  MOCK_COHORTS.reduce((a, c) => a + c.completionRate, 0) / MOCK_COHORTS.length
);

// ─── KPI section ──────────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, accent }: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  accent?: "danger" | "green" | "purple";
}) {
  const valueColor =
    accent === "danger" ? "text-danger" :
    accent === "green"  ? "text-green-400" :
    accent === "purple" ? "text-purple-400" :
    "text-white";
  const borderColor =
    accent === "danger" ? "border-danger/20 bg-danger/5" :
    accent === "green"  ? "border-green-500/20 bg-green-500/5" :
    "border-white/10";

  return (
    <div className={`bg-gray-900 border rounded-xl p-5 ${borderColor}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className={`text-2xl font-extrabold mb-0.5 ${valueColor}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
      {sub && <div className="text-xs text-gray-600 mt-1">{sub}</div>}
    </div>
  );
}

// ─── Mini sparkline (CSS-based) ───────────────────────────────────────────────

function MiniBar({ pct, color = "bg-primary" }: { pct: number; color?: string }) {
  return (
    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden flex-1">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "cohorts" | "users" | "content">("overview");

  function exportGlobalCSV() {
    const rows = MOCK_COHORTS.map((c) => ({
      "Cohorte": c.name,
      "École": c.school,
      "Statut": c.status,
      "Apprenants": c.enrolledCount,
      "Complétion (%)": c.completionRate,
      "Score moyen": c.avgScore,
      "Temps moyen (min)": c.avgTimeSpent,
      "Début": c.startDate,
      "Fin": c.endDate,
    }));
    downloadCSV(rows, `admin-plateforme-${todayStamp()}.csv`);
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-white">Administration</h1>
            <span className="text-xs font-medium bg-purple-600/20 text-purple-400 border border-purple-600/30 px-2.5 py-0.5 rounded-full">
              Admin
            </span>
          </div>
          <p className="text-gray-400">KPIs globaux · Hi! PARIS Platform</p>
        </div>
        <button
          onClick={exportGlobalCSV}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white border border-white/10 hover:border-white/30 px-4 py-2.5 rounded-xl transition-all"
        >
          📊 Exporter rapport CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-white/10 rounded-xl p-1 mb-8 w-fit">
        {([
          { key: "overview", label: "Vue d'ensemble" },
          { key: "cohorts",  label: "Cohortes" },
          { key: "users",    label: "Utilisateurs" },
          { key: "content",  label: "Contenus" },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-primary text-white shadow-sm shadow-primary/30"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Overview tab ── */}
      {activeTab === "overview" && (
        <>
          {/* Primary KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard icon="👤" label="Utilisateurs total" value={PLATFORM_USERS.total}    sub={`+${PLATFORM_USERS.newThisWeek} cette semaine`} />
            <KpiCard icon="🟢" label="Actifs aujourd'hui" value={PLATFORM_USERS.activeToday} accent="green" />
            <KpiCard icon="📖" label="Cours publiés"      value={publishedCourses}        sub={`/${MOCK_COURSES.length} total`} />
            <KpiCard icon="🎓" label="Cohortes actives"   value={activeCohorts.length}    sub={`/${MOCK_COHORTS.length} total`} />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <KpiCard icon="▶"  label="Vidéos"           value={MOCK_VIDEOS.length} />
            <KpiCard icon="🔀" label="MOOCs"             value={MOCK_MOOCS.length} />
            <KpiCard icon="⚡" label="Applications"      value={MOCK_APPS.length} />
            <KpiCard icon="📰" label="Articles Insights" value={MOCK_INSIGHTS.length} />
          </div>

          {/* Cohort health + at-risk */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Completion overview */}
            <div className="lg:col-span-2 bg-gray-900 border border-white/10 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-white mb-1">Santé des cohortes actives</h2>
              <p className="text-xs text-gray-500 mb-5">Taux de complétion et score moyen par cohorte</p>
              <div className="flex flex-col gap-5">
                {activeCohorts.map((c) => (
                  <div key={c.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <p className="text-sm font-medium text-white">{c.name}</p>
                        <p className="text-xs text-gray-600">{c.school} · {c.enrolledCount} apprenants</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-bold ${
                          c.completionRate >= 80 ? "text-green-400" :
                          c.completionRate >= 50 ? "text-yellow-400" : "text-orange-400"
                        }`}>
                          {c.completionRate}%
                        </span>
                        <p className="text-xs text-gray-600">score: {c.avgScore}/100</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MiniBar
                        pct={c.completionRate}
                        color={c.completionRate >= 80 ? "bg-green-500" : c.completionRate >= 50 ? "bg-primary" : "bg-orange-500"}
                      />
                      <Link href={`/lms/${c.id}`} className="text-xs text-primary hover:text-primary-light whitespace-nowrap">
                        Gérer →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Platform average */}
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-4">
                <div className="text-xs text-gray-500">Complétion moyenne plateforme</div>
                <div className="flex-1">
                  <MiniBar pct={avgPlatformCompletion} />
                </div>
                <div className="text-sm font-bold text-white">{avgPlatformCompletion}%</div>
              </div>
            </div>

            {/* At-risk + recent activity */}
            <div className="flex flex-col gap-5">
              {/* At-risk */}
              <div className="bg-gray-900 border border-danger/20 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-1">
                  ⚠️ Apprenants à risque
                </h3>
                <p className="text-xs text-gray-500 mb-4">{atRiskStudents.length} sur {MOCK_STUDENTS.length} étudiants suivis</p>
                <div className="flex flex-col gap-2">
                  {atRiskStudents.slice(0, 4).map((s) => (
                    <Link
                      key={s.userId}
                      href={`/lms/${s.cohortId}/student/${s.userId}`}
                      className="flex items-center gap-2.5 hover:bg-white/5 rounded-lg px-2 py-1.5 transition-all group"
                    >
                      <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center text-xs font-bold text-orange-400 shrink-0">
                        {s.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white group-hover:text-orange-300 transition-colors truncate">{s.name}</p>
                        <p className="text-xs text-gray-600">{s.daysInactive}j inactif</p>
                      </div>
                    </Link>
                  ))}
                  {atRiskStudents.length > 4 && (
                    <Link href="/lms" className="text-xs text-primary hover:text-primary-light text-center py-1">
                      Voir tous ({atRiskStudents.length}) →
                    </Link>
                  )}
                </div>
              </div>

              {/* Platform metrics */}
              <div className="bg-gray-900 border border-white/10 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Métriques globales</h3>
                <div className="flex flex-col gap-3">
                  {[
                    { label: "Enrollements total",    value: MOCK_COHORTS.reduce((a, c) => a + c.enrolledCount, 0) },
                    { label: "Certificats émis",      value: 34 },
                    { label: "Badges attribués",      value: 128 },
                    { label: "Vues vidéos (total)",   value: MOCK_VIDEOS.reduce((a, v) => a + v.views, 0).toLocaleString("fr-FR") },
                    { label: "Taux rétention moy.",   value: "74%" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{item.label}</span>
                      <span className="font-semibold text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Cohorts tab ── */}
      {activeTab === "cohorts" && (
        <div className="bg-gray-900 border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {["Cohorte", "École", "Statut", "Apprenants", "Complétion", "Score moy.", "Temps moy.", "Actions"].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3.5 first:pl-6">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {MOCK_COHORTS.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-white">{c.name}</p>
                    <p className="text-xs text-gray-600">{c.startDate} → {c.endDate}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-400">{c.school}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                      c.status === "active" ? "bg-green-500/15 text-green-400 border-green-500/25" :
                      c.status === "draft"  ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/25" :
                      "bg-gray-500/15 text-gray-400 border-gray-500/25"
                    }`}>
                      {c.status === "active" ? "Actif" : c.status === "draft" ? "Brouillon" : "Archivé"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-white">{c.enrolledCount}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20">
                        <MiniBar
                          pct={c.completionRate}
                          color={c.completionRate >= 80 ? "bg-green-500" : c.completionRate >= 50 ? "bg-primary" : "bg-orange-500"}
                        />
                      </div>
                      <span className="text-sm font-semibold text-white">{c.completionRate}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-white">{c.avgScore}/100</td>
                  <td className="px-5 py-4 text-sm text-gray-400">{Math.floor(c.avgTimeSpent / 60)}h</td>
                  <td className="px-5 py-4">
                    {c.status !== "archived" && (
                      <Link href={`/lms/${c.id}`} className="text-xs text-primary hover:text-primary-light font-semibold">
                        Gérer →
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Users tab ── */}
      {activeTab === "users" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Role distribution */}
          <div className="bg-gray-900 border border-white/10 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-white mb-5">Répartition par rôle</h2>
            <div className="flex flex-col gap-4">
              {([
                { role: "Étudiants",    count: PLATFORM_USERS.student,    color: "bg-primary",    pct: Math.round((PLATFORM_USERS.student    / PLATFORM_USERS.total) * 100) },
                { role: "Enseignants",  count: PLATFORM_USERS.teacher,    color: "bg-blue-500",   pct: Math.round((PLATFORM_USERS.teacher    / PLATFORM_USERS.total) * 100) },
                { role: "Admins",       count: PLATFORM_USERS.admin,      color: "bg-danger",     pct: Math.round((PLATFORM_USERS.admin      / PLATFORM_USERS.total) * 100) },
                { role: "Superusers",   count: PLATFORM_USERS.superuser,  color: "bg-purple-500", pct: Math.round((PLATFORM_USERS.superuser  / PLATFORM_USERS.total) * 100) },
              ]).map((r) => (
                <div key={r.role}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-gray-300">{r.role}</span>
                    <span className="text-sm font-bold text-white">{r.count} <span className="text-xs font-normal text-gray-500">({r.pct}%)</span></span>
                  </div>
                  <MiniBar pct={r.pct} color={r.color} />
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-white/5 text-xs text-gray-500">
              Total : {PLATFORM_USERS.total} comptes · {PLATFORM_USERS.activeToday} actifs aujourd'hui
            </div>
          </div>

          {/* Enrollment by school */}
          <div className="bg-gray-900 border border-white/10 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-white mb-5">Apprenants par école</h2>
            <div className="flex flex-col gap-4">
              {([
                { school: "Polytechnique",  count: 98,  pct: 34 },
                { school: "Télécom Paris",  count: 74,  pct: 26 },
                { school: "HEC Paris",      count: 54,  pct: 19 },
                { school: "ENSAE",          count: 38,  pct: 13 },
                { school: "Autres",         count: 23,  pct: 8  },
              ]).map((s) => (
                <div key={s.school}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-gray-300">{s.school}</span>
                    <span className="text-sm font-bold text-white">{s.count} <span className="text-xs font-normal text-gray-500">({s.pct}%)</span></span>
                  </div>
                  <MiniBar pct={s.pct} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Content tab ── */}
      {activeTab === "content" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top videos by views */}
          <div className="bg-gray-900 border border-white/10 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-white mb-5">Top vidéos (vues)</h2>
            <div className="flex flex-col gap-3">
              {[...MOCK_VIDEOS]
                .sort((a, b) => b.views - a.views)
                .slice(0, 6)
                .map((v, i) => (
                  <div key={v.id} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-600 w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{v.title}</p>
                      <p className="text-xs text-gray-600">{v.school}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{v.views.toLocaleString("fr-FR")} vues</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Content summary */}
          <div className="bg-gray-900 border border-white/10 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-white mb-5">Catalogue — Résumé</h2>
            <div className="flex flex-col gap-4">
              {[
                { icon: "▶",  label: "Vidéos",      total: MOCK_VIDEOS.length,                                           published: MOCK_VIDEOS.length,                                           draft: 0 },
                { icon: "📖", label: "Cours",        total: MOCK_COURSES.length,                                          published: publishedCourses,                                             draft: MOCK_COURSES.length - publishedCourses },
                { icon: "🎓", label: "MOOCs",        total: MOCK_MOOCS.length,                                            published: MOCK_MOOCS.length,                                            draft: 0 },
                { icon: "⚡", label: "Applications", total: MOCK_APPS.length,                                             published: MOCK_APPS.length,                                             draft: 0 },
                { icon: "📰", label: "Insights",     total: MOCK_INSIGHTS.length,                                         published: MOCK_INSIGHTS.length,                                         draft: 0 },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-3">
                  <span className="text-lg w-6 text-center">{c.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{c.label}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-white">{c.total}</span>
                    {c.draft > 0 && <span className="text-xs text-yellow-500 ml-2">({c.draft} brouillons)</span>}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-white/5">
              <p className="text-xs text-gray-500 mb-3">Cours les plus populaires</p>
              {MOCK_COURSES.slice(0, 3).map((c) => (
                <div key={c.id} className="flex items-center justify-between text-xs py-1.5">
                  <span className="text-gray-400 truncate max-w-[180px]">{c.title}</span>
                  <span className="text-gray-600 ml-2">{c.duration}min</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
