/**
 * @file (platform)/lms/page.tsx
 * @description Dashboard LMS — "/lms". Gestion des cohortes (Lot 3).
 *
 * Données 100 % réelles via `cohortsApi` (plus aucun mock). La gestion d'une
 * cohorte (membres + accès aux cours) se fait dans un panneau inline sur cette
 * même page — pas de route dynamique, compatible `output: "export"`.
 *
 * Accès : `teacher` (ses cohortes), `admin` / `super_admin` (toutes).
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { PageSpinner } from "@/components/ui/Spinner";
import {
  cohortsApi, coursesApi, ApiError,
  CohortApi, CohortDetailApi, CourseResponse,
} from "@/lib/api";
import { downloadCSV, todayStamp } from "@/lib/export";

const ALLOWED = ["teacher", "admin", "super_admin"];

const COHORT_STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon", active: "Actif", archived: "Archivé",
};
const MEMBER_STATUS_LABELS: Record<string, string> = {
  active: "Actif", "at-risk": "À risque", completed: "Terminé", inactive: "Inactif",
};
const MEMBER_STATUS_STYLES: Record<string, string> = {
  active: "bg-green-500/10 text-green-600 border-green-500/20",
  "at-risk": "bg-orange-500/10 text-orange-600 border-orange-500/20",
  completed: "bg-primary/10 text-primary border-primary/20",
  inactive: "bg-gray-400/10 text-gray-500 border-gray-300",
};

function completionColor(pct: number) {
  return pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-primary" : "bg-orange-500";
}

export default function LMSPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const authorized = !!user && ALLOWED.includes(user.role);

  const [cohorts, setCohorts] = useState<CohortApi[]>([]);
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CohortDetailApi | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [panelError, setPanelError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", school: "", status: "active" });
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [grantCourseId, setGrantCourseId] = useState("");

  // ── Chargement ──────────────────────────────────────────────────────────────
  const loadCohorts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await cohortsApi.list();
      setCohorts(list);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Impossible de charger les cohortes.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setPanelError("");
    try {
      setDetail(await cohortsApi.get(id));
    } catch (e) {
      setPanelError(e instanceof ApiError ? e.message : "Impossible de charger la cohorte.");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/login"); return; }
    if (!authorized) { router.replace("/dashboard"); return; }
    loadCohorts();
    coursesApi.list().then(setCourses).catch(() => setCourses([]));
  }, [authLoading, user, authorized, router, loadCohorts]);

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
    else setDetail(null);
  }, [selectedId, loadDetail]);

  // ── KPIs réels ────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const active = cohorts.filter((c) => c.status === "active");
    const totalEnrolled = cohorts.reduce((a, c) => a + c.enrolled_count, 0);
    const avgCompletion = active.length
      ? Math.round(active.reduce((a, c) => a + c.completion_rate, 0) / active.length)
      : 0;
    const atRisk = cohorts.reduce((a, c) => a + c.at_risk_count, 0);
    return { activeCount: active.length, totalEnrolled, avgCompletion, atRisk };
  }, [cohorts]);

  const courseTitle = useCallback(
    (id: string) => courses.find((c) => c.id === id)?.title ?? id,
    [courses],
  );

  // ── Actions ──────────────────────────────────────────────────────────────────
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm.name.trim()) return;
    try {
      const created = await cohortsApi.create({
        name: createForm.name.trim(),
        school: createForm.school.trim() || null,
        status: createForm.status,
      });
      setShowCreate(false);
      setCreateForm({ name: "", school: "", status: "active" });
      await loadCohorts();
      setSelectedId(created.id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Échec de la création.");
    }
  }

  async function refreshAfterMutation(id: string) {
    await Promise.all([loadDetail(id), loadCohorts()]);
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!detail || !newMemberEmail.trim()) return;
    setPanelError("");
    try {
      await cohortsApi.addMember(detail.id, { email: newMemberEmail.trim() });
      setNewMemberEmail("");
      await refreshAfterMutation(detail.id);
    } catch (e) {
      setPanelError(e instanceof ApiError ? e.message : "Échec de l'ajout.");
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!detail) return;
    try {
      await cohortsApi.removeMember(detail.id, userId);
      await refreshAfterMutation(detail.id);
    } catch (e) {
      setPanelError(e instanceof ApiError ? e.message : "Échec du retrait.");
    }
  }

  async function handleGrantCourse(e: React.FormEvent) {
    e.preventDefault();
    if (!detail || !grantCourseId) return;
    setPanelError("");
    try {
      await cohortsApi.grantCourse(detail.id, grantCourseId);
      setGrantCourseId("");
      await refreshAfterMutation(detail.id);
    } catch (e) {
      setPanelError(e instanceof ApiError ? e.message : "Échec de l'ajout du cours.");
    }
  }

  async function handleRevokeCourse(courseId: string) {
    if (!detail) return;
    try {
      await cohortsApi.revokeCourse(detail.id, courseId);
      await refreshAfterMutation(detail.id);
    } catch (e) {
      setPanelError(e instanceof ApiError ? e.message : "Échec du retrait du cours.");
    }
  }

  function exportCohortsCSV() {
    const rows = cohorts.map((c) => ({
      "Cohorte": c.name,
      "École": c.school ?? "",
      "Statut": COHORT_STATUS_LABELS[c.status] ?? c.status,
      "Apprenants": c.enrolled_count,
      "Complétion (%)": c.completion_rate,
      "Score moyen": c.avg_score ?? "",
      "À risque": c.at_risk_count,
      "Cours assignés": c.assigned_course_ids.length,
    }));
    downloadCSV(rows, `lms-cohortes-${todayStamp()}.csv`);
  }

  // ── Rendu ──────────────────────────────────────────────────────────────────
  if (authLoading || !authorized) return <PageSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* En-tête */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">LMS — Cohortes</h1>
          <p className="text-gray-500">Gestion des cohortes et suivi réel de la progression</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={exportCohortsCSV} disabled={cohorts.length === 0}
            className="text-sm text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 px-4 py-2.5 rounded-xl transition-all disabled:opacity-40">
            📊 Exporter CSV
          </button>
          <button onClick={() => setShowCreate((v) => !v)}
            className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors">
            + Nouvelle cohorte
          </button>
        </div>
      </div>

      {/* Formulaire de création */}
      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-xl p-5 mb-8 flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-gray-500 block mb-1">Nom de la cohorte *</label>
            <input value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Master IA — Promo 2026" required
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="min-w-[160px]">
            <label className="text-xs text-gray-500 block mb-1">École</label>
            <input value={createForm.school} onChange={(e) => setCreateForm((f) => ({ ...f, school: e.target.value }))}
              placeholder="Polytechnique"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Statut</label>
            <select value={createForm.status} onChange={(e) => setCreateForm((f) => ({ ...f, status: e.target.value }))}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
              <option value="draft">Brouillon</option>
              <option value="active">Actif</option>
            </select>
          </div>
          <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark">Créer</button>
        </form>
      )}

      {error && <div className="mb-6 text-sm text-danger bg-danger/5 border border-danger/20 rounded-xl px-4 py-3">{error}</div>}

      {/* KPIs réels */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Cohortes actives", value: kpis.activeCount, icon: "👥", danger: false },
          { label: "Apprenants inscrits", value: kpis.totalEnrolled, icon: "🎓", danger: false },
          { label: "Complétion moyenne", value: `${kpis.avgCompletion}%`, icon: "📊", danger: false },
          { label: "Nécessitent attention", value: kpis.atRisk, icon: "⚠️", danger: kpis.atRisk > 0 },
        ].map((s) => (
          <div key={s.label} className={`bg-white border rounded-xl p-5 ${s.danger ? "border-danger/30 bg-danger/5" : "border-gray-200"}`}>
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className={`text-2xl font-extrabold mb-1 ${s.danger ? "text-danger" : "text-gray-900"}`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Liste des cohortes */}
        <div className="lg:col-span-1">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Cohortes</h2>
          {loading ? (
            <p className="text-sm text-gray-500">Chargement…</p>
          ) : cohorts.length === 0 ? (
            <p className="text-sm text-gray-500 bg-white border border-gray-200 rounded-xl p-4">
              Aucune cohorte. Créez-en une avec « + Nouvelle cohorte ».
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {cohorts.map((c) => (
                <button key={c.id} onClick={() => setSelectedId(c.id)}
                  className={`text-left bg-white border rounded-xl p-4 transition-all ${
                    selectedId === c.id ? "border-primary ring-2 ring-primary/20" : "border-gray-200 hover:border-gray-300"
                  }`}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{c.name}</h3>
                    <span className="text-xs text-gray-500 shrink-0">{COHORT_STATUS_LABELS[c.status] ?? c.status}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{c.school ?? "—"} · {c.enrolled_count} apprenants · {c.assigned_course_ids.length} cours</p>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden flex-1">
                      <div className={`h-full rounded-full ${completionColor(c.completion_rate)}`} style={{ width: `${c.completion_rate}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-gray-700">{c.completion_rate}%</span>
                    {c.at_risk_count > 0 && <span className="text-xs text-orange-600">⚠️ {c.at_risk_count}</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Panneau de gestion */}
        <div className="lg:col-span-2">
          {!selectedId ? (
            <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-sm text-gray-500">
              Sélectionnez une cohorte pour gérer ses membres et ses cours.
            </div>
          ) : detailLoading || !detail ? (
            <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-sm text-gray-500">Chargement…</div>
          ) : (
            <div className="flex flex-col gap-6">
              {panelError && <div className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-xl px-4 py-3">{panelError}</div>}

              {/* En-tête cohorte */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{detail.name}</h2>
                    <p className="text-xs text-gray-500">{detail.school ?? "—"} · {COHORT_STATUS_LABELS[detail.status] ?? detail.status}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-extrabold text-gray-900">{detail.completion_rate}%</div>
                    <p className="text-xs text-gray-500">complétion{detail.avg_score != null ? ` · ${detail.avg_score}/100 score` : ""}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-5 text-xs text-gray-500 pt-3 border-t border-gray-100">
                  <span><b className="text-gray-900">{detail.enrolled_count}</b> apprenants</span>
                  <span><b className="text-gray-900">{detail.assigned_course_ids.length}</b> cours</span>
                  <span className="text-orange-600"><b>{detail.at_risk_count}</b> à risque</span>
                </div>
              </div>

              {/* Membres */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Membres</h3>
                <form onSubmit={handleAddMember} className="flex gap-2 mb-4">
                  <input type="email" value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="email@institution.edu"
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark">Inscrire</button>
                </form>
                {detail.members.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucun membre inscrit.</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {detail.members.map((m) => (
                      <div key={m.user_id} className="flex items-center gap-3 py-2.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                          <p className="text-xs text-gray-500 truncate">{m.email}</p>
                        </div>
                        <span className="text-xs text-gray-600 w-28 text-right">
                          {m.courses_completed}/{m.total_courses} cours · {m.completion}%
                        </span>
                        <span className="text-xs text-gray-600 w-16 text-right">{m.avg_score != null ? `${m.avg_score}/100` : "—"}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border w-20 text-center ${MEMBER_STATUS_STYLES[m.status] ?? MEMBER_STATUS_STYLES.inactive}`}>
                          {MEMBER_STATUS_LABELS[m.status] ?? m.status}
                        </span>
                        <button onClick={() => handleRemoveMember(m.user_id)}
                          className="text-xs text-gray-400 hover:text-danger px-2">Retirer</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cours accessibles */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Cours accessibles à la cohorte</h3>
                <p className="text-xs text-gray-500 mb-4">Les membres ont accès à ces cours du catalogue.</p>
                <form onSubmit={handleGrantCourse} className="flex gap-2 mb-4">
                  <select value={grantCourseId} onChange={(e) => setGrantCourseId(e.target.value)}
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
                    <option value="">Choisir un cours à ajouter…</option>
                    {courses
                      .filter((c) => !detail.assigned_course_ids.includes(c.id))
                      .map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                  <button type="submit" disabled={!grantCourseId}
                    className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark disabled:opacity-40">Ajouter</button>
                </form>
                {detail.assigned_course_ids.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucun cours assigné.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {detail.assigned_course_ids.map((cid) => (
                      <div key={cid} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <span className="text-sm text-gray-800 truncate">{courseTitle(cid)}</span>
                        <button onClick={() => handleRevokeCourse(cid)} className="text-xs text-gray-400 hover:text-danger px-2">Retirer</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
