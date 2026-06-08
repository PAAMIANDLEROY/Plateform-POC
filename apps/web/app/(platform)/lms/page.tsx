"use client";

import { useState } from "react";
import Link from "next/link";
import { MOCK_COHORTS, MOCK_STUDENTS } from "@/lib/mock";
import { downloadCSV, todayStamp } from "@/lib/export";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active:   "bg-green-500/15 text-green-400 border-green-500/25",
    archived: "bg-gray-500/15 text-gray-400 border-gray-500/25",
    draft:    "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
  };
  const labels: Record<string, string> = { active: "Actif", archived: "Archivé", draft: "Brouillon" };
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${styles[status] ?? styles.archived}`}>
      {labels[status] ?? status}
    </span>
  );
}

// ─── CSV export helper ─────────────────────────────────────────────────────────

function exportStudentsCSV(inactivityThreshold: number, scoreThreshold: number) {
  const rows = MOCK_STUDENTS.map((s) => ({
    "Nom": s.name,
    "Email": s.email,
    "École": s.school,
    "Cohorte ID": s.cohortId,
    "Statut": s.status,
    "Cours complétés": `${s.coursesCompleted}/${s.totalCourses}`,
    "Score moyen (quiz)": s.quizAvg > 0 ? `${s.quizAvg}/100` : "—",
    "Temps investi (min)": s.timeSpent,
    "Jours inactif": s.daysInactive,
    "Dernière activité": s.lastActive,
    "À risque (seuil inactivité)": s.daysInactive >= inactivityThreshold ? "Oui" : "Non",
    "À risque (seuil score)": s.quizAvg > 0 && s.quizAvg < scoreThreshold ? "Oui" : "Non",
  }));
  downloadCSV(rows, `lms-apprenants-${todayStamp()}.csv`);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LMSPage() {
  const [inactivityDays, setInactivityDays] = useState(7);
  const [scoreThreshold, setScoreThreshold] = useState(60);
  const [showConfig, setShowConfig] = useState(false);

  const activeCohorts = MOCK_COHORTS.filter((c) => c.status === "active");
  const totalStudents = activeCohorts.reduce((acc, c) => acc + c.enrolledCount, 0);
  const avgCompletion = Math.round(
    activeCohorts.reduce((acc, c) => acc + c.completionRate, 0) / activeCohorts.length
  );

  // Dynamic at-risk calculation based on configurable thresholds
  const atRiskStudents = MOCK_STUDENTS.filter(
    (s) => s.daysInactive >= inactivityDays || (s.quizAvg > 0 && s.quizAvg < scoreThreshold)
  );

  const stats = [
    { label: "Cohortes actives",    value: activeCohorts.length,          icon: "👥", danger: false },
    { label: "Apprenants inscrits", value: totalStudents,                  icon: "🎓", danger: false },
    { label: "Complétion moyenne",  value: `${avgCompletion}%`,            icon: "📊", danger: false },
    { label: "Nécessitent attention", value: atRiskStudents.length,        icon: "⚠️", danger: atRiskStudents.length > 0 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-10 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">LMS</h1>
            <span className="text-xs font-medium bg-danger/15 text-danger border border-danger/25 px-2.5 py-0.5 rounded-full">
              Superuser
            </span>
          </div>
          <p className="text-gray-400">Gestion des cohortes et suivi de la progression des apprenants</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowConfig((v) => !v)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 px-4 py-2.5 rounded-xl transition-all shadow-sm"
          >
            ⚙️ Seuils d'alerte
          </button>
          <button
            onClick={() => exportStudentsCSV(inactivityDays, scoreThreshold)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 px-4 py-2.5 rounded-xl transition-all shadow-sm"
          >
            📊 Exporter CSV
          </button>
          <button className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20">
            + Nouvelle cohorte
          </button>
        </div>
      </div>

      {/* Alert threshold configuration panel */}
      {showConfig && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-8">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">⚙️ Configuration des seuils d'alerte</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-400">Jours d'inactivité avant alerte</label>
                <span className="text-sm font-bold text-white">{inactivityDays} j</span>
              </div>
              <input
                type="range"
                min={1}
                max={30}
                value={inactivityDays}
                onChange={(e) => setInactivityDays(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>1 jour</span>
                <span>30 jours</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-400">Score quiz minimum (alerte si inférieur)</label>
                <span className="text-sm font-bold text-white">{scoreThreshold}/100</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={scoreThreshold}
                onChange={(e) => setScoreThreshold(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>0</span>
                <span>100</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-4">
            Les étudiants inactifs depuis ≥ {inactivityDays} jours ou avec un score moyen &lt; {scoreThreshold}/100 apparaissent dans le panel "Nécessitent attention".
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`bg-gray-900 border rounded-xl p-5 ${
              s.danger ? "border-danger/30 bg-danger/5" : "border-white/10"
            }`}
          >
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className={`text-2xl font-extrabold mb-1 ${s.danger ? "text-danger" : "text-gray-900"}`}>
              {s.value}
            </div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cohort list */}
        <div className="lg:col-span-2">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Cohortes</h2>
          <div className="flex flex-col gap-4">
            {MOCK_COHORTS.map((cohort) => (
              <div
                key={cohort.id}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:border-white/20 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2.5 mb-1">
                      <h3 className="font-bold text-gray-900 text-base">{cohort.name}</h3>
                      <StatusBadge status={cohort.status} />
                    </div>
                    <p className="text-xs text-gray-500">
                      {cohort.school} · {cohort.startDate} → {cohort.endDate}
                    </p>
                  </div>
                  {cohort.status !== "archived" && (
                    <Link
                      href={`/lms/${cohort.id}`}
                      className="text-sm font-semibold text-primary hover:text-primary-light transition-colors whitespace-nowrap"
                    >
                      Gérer →
                    </Link>
                  )}
                </div>
                <p className="text-sm text-gray-400 mb-4">{cohort.description}</p>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>Complétion globale</span>
                    <span className="font-semibold text-gray-900">{cohort.completionRate}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        cohort.completionRate >= 80
                          ? "bg-green-500"
                          : cohort.completionRate >= 50
                          ? "bg-primary"
                          : "bg-orange-500"
                      }`}
                      style={{ width: `${cohort.completionRate}%` }}
                    />
                  </div>
                </div>

                {/* Mini stats */}
                <div className="flex flex-wrap items-center gap-5 text-xs text-gray-500 pt-3 border-t border-white/5">
                  <span><span className="text-white font-semibold">{cohort.enrolledCount}</span> apprenants</span>
                  <span><span className="text-white font-semibold">{cohort.avgScore}/100</span> score moy.</span>
                  <span>
                    <span className="text-white font-semibold">{Math.floor(cohort.avgTimeSpent / 60)}h</span> temps moy.
                  </span>
                  <span><span className="text-white font-semibold">{cohort.assignedCourseIds.length}</span> cours</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-6">
          {/* At-risk panel */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                ⚠️ Nécessite attention
              </h2>
              <span className="text-xs text-gray-600">seuil : {inactivityDays}j / {scoreThreshold}pts</span>
            </div>
            {atRiskStudents.length === 0 ? (
              <p className="text-sm text-gray-600 bg-white border border-gray-200 rounded-xl p-4">
                Aucun étudiant ne dépasse les seuils configurés.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {atRiskStudents.slice(0, 5).map((s) => (
                  <Link
                    key={s.userId}
                    href={`/lms/${s.cohortId}/student/${s.userId}`}
                    className="group bg-gray-900 border border-orange-500/20 rounded-xl p-4 hover:border-orange-500/40 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-xs font-bold text-orange-400 shrink-0">
                        {s.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-orange-600 transition-colors truncate">
                          {s.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {s.daysInactive >= inactivityDays
                            ? `${s.daysInactive}j sans activité`
                            : `Score: ${s.quizAvg}/100`}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-orange-500/15 text-orange-400 border-orange-500/25 shrink-0">
                        À risque
                      </span>
                    </div>
                    <div className="mt-2.5">
                      <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500 rounded-full"
                          style={{ width: `${Math.round((s.coursesCompleted / s.totalCourses) * 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {s.coursesCompleted}/{s.totalCourses} cours · {s.lastActive}
                      </p>
                    </div>
                  </Link>
                ))}
                {atRiskStudents.length > 5 && (
                  <p className="text-xs text-gray-600 text-center py-1">
                    + {atRiskStudents.length - 5} autres étudiants à risque
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Actions rapides</h3>
            <div className="flex flex-col gap-1">
              {[
                { icon: "📧", label: "Notifier les étudiants à risque" },
                { icon: "📊", label: "Exporter rapport global (CSV)", action: () => exportStudentsCSV(inactivityDays, scoreThreshold) },
                { icon: "🏆", label: "Générer les certificats" },
                { icon: "➕", label: "Importer des étudiants" },
                { icon: "📅", label: "Planifier une session" },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={action.action}
                  className="flex items-center gap-3 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg px-3 py-2.5 transition-all text-left w-full"
                >
                  <span className="shrink-0">{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Platform stats */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Plateforme — Cumul</h3>
            <div className="flex flex-col gap-3">
              {[
                { label: "Cohortes total",              value: MOCK_COHORTS.length },
                { label: "Apprenants (toutes cohortes)", value: MOCK_COHORTS.reduce((a, c) => a + c.enrolledCount, 0) },
                { label: "Meilleur taux complétion",    value: `${Math.max(...MOCK_COHORTS.map(c => c.completionRate))}%` },
                { label: "Score max moyen",             value: `${Math.max(...MOCK_COHORTS.map(c => c.avgScore))}/100` },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{item.label}</span>
                  <span className="font-semibold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
