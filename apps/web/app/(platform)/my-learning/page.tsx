"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { learningApi, LearningDashboard, Badge, Certificate, LearningProgress } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PageSpinner } from "@/components/ui/Spinner";
import { MOCK_COURSES } from "@/lib/mock";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function getCourseTitle(courseId: string) {
  return MOCK_COURSES.find((c) => c.id === courseId)?.title ?? `Cours ${courseId}`;
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-2xl font-extrabold text-white">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

// ── Progress tab ──────────────────────────────────────────────────────────────

function ProgressTab({ progress, onComplete, onIssue }: {
  progress: LearningProgress[];
  onComplete: (courseId: string) => void;
  onIssue: (courseId: string, title: string) => void;
}) {
  if (progress.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">📖</div>
        <p className="text-white font-semibold mb-1">Aucun cours commencé</p>
        <p className="text-gray-500 text-sm mb-5">Explorez le catalogue pour commencer à apprendre.</p>
        <Link href="/learning-ai/courses" className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors">
          Explorer les cours →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {progress.map((p) => {
        const title = getCourseTitle(p.course_id);
        return (
          <div key={p.course_id} className="bg-gray-900 border border-white/10 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <Link href={`/courses/${p.course_id}`} className="font-semibold text-white hover:text-primary transition-colors">
                  {title}
                </Link>
                {p.completed && p.completed_at && (
                  <p className="text-xs text-emerald-400 mt-0.5">✓ Complété le {formatDate(p.completed_at)}</p>
                )}
                {!p.completed && (
                  <p className="text-xs text-gray-500 mt-0.5">Commencé le {p.started_at ? formatDate(p.started_at) : "—"}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!p.completed && (
                  <button onClick={() => onComplete(p.course_id)}
                    className="text-xs border border-primary/30 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors">
                    Marquer terminé
                  </button>
                )}
                {p.completed && (
                  <button onClick={() => onIssue(p.course_id, title)}
                    className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary-dark transition-colors">
                    Obtenir certificat
                  </button>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${p.completed ? "bg-emerald-500" : "bg-primary"}`}
                  style={{ width: `${p.progress_pct}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-400 w-10 text-right">{p.progress_pct}%</span>
            </div>

            {p.score !== undefined && (
              <p className="text-xs text-gray-500 mt-2">Score quiz : <span className={`font-semibold ${p.score >= 80 ? "text-emerald-400" : p.score >= 60 ? "text-yellow-400" : "text-danger"}`}>{p.score}%</span></p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Badges tab ────────────────────────────────────────────────────────────────

function BadgesTab({ earned, locked }: { earned: Badge[]; locked: Badge[] }) {
  return (
    <div>
      {earned.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Badges obtenus · {earned.length}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {earned.map((b) => (
              <div key={b.id} className="bg-gray-900 border border-primary/30 rounded-2xl p-5 text-center">
                <div className="text-4xl mb-2">{b.icon}</div>
                <p className="text-sm font-bold text-white mb-1">{b.name}</p>
                <p className="text-xs text-gray-500">{b.description}</p>
                {b.awarded_at && (
                  <p className="text-xs text-primary mt-2">{formatDate(b.awarded_at)}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {locked.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-4">
            Badges à débloquer · {locked.length}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {locked.map((b) => (
              <div key={b.id} className="bg-gray-900 border border-white/5 rounded-2xl p-5 text-center opacity-50 grayscale">
                <div className="text-4xl mb-2">{b.icon}</div>
                <p className="text-sm font-bold text-gray-400 mb-1">{b.name}</p>
                <p className="text-xs text-gray-600">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {earned.length === 0 && locked.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🏅</div>
          <p className="text-white font-semibold">Aucun badge disponible</p>
        </div>
      )}
    </div>
  );
}

// ── Certificates tab ──────────────────────────────────────────────────────────

function CertificatesTab({ certs, onDownload }: {
  certs: Certificate[];
  onDownload: (certId: string) => void;
}) {
  if (certs.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🏆</div>
        <p className="text-white font-semibold mb-1">Aucun certificat encore</p>
        <p className="text-gray-500 text-sm">Complétez un cours pour obtenir votre premier certificat.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {certs.map((c) => (
        <div key={c.id} className="bg-gray-900 border border-white/10 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center text-2xl shrink-0">
            🏆
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white line-clamp-1">{c.course_title}</p>
            <p className="text-xs text-gray-500 mt-0.5">Délivré le {formatDate(c.issued_at)}</p>
            <Link href={c.verification_url} target="_blank"
              className="text-xs text-primary hover:text-primary-light transition-colors">
              Vérifier l'authenticité →
            </Link>
          </div>
          <button onClick={() => onDownload(c.id)}
            className="shrink-0 border border-white/10 text-gray-300 text-xs px-4 py-2 rounded-lg hover:bg-white/5 transition-colors">
            Télécharger PDF
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type Tab = "progress" | "badges" | "certificates";

export default function MyLearningPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("progress");
  const [dashboard, setDashboard] = useState<LearningDashboard | null>(null);
  const [badges, setBadges] = useState<{ earned: Badge[]; locked: Badge[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  useEffect(() => {
    Promise.all([learningApi.dashboard(), learningApi.getBadges()])
      .then(([dash, b]) => {
        setDashboard(dash);
        setBadges(b);
      })
      .catch(() => {
        // Fallback to empty state (API not running)
        setDashboard({
          total_courses_started: 0, total_courses_completed: 0,
          total_badges: 0, total_certificates: 0,
          progress: [], badges: [], certificates: [],
          in_progress: [], completed: [],
        });
        setBadges({ earned: [], locked: [] });
      })
      .finally(() => setLoading(false));
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function handleComplete(courseId: string) {
    await learningApi.completeCourse(courseId).catch(() => null);
    const dash = await learningApi.dashboard().catch(() => null);
    if (dash) setDashboard(dash);
    const b = await learningApi.getBadges().catch(() => null);
    if (b) setBadges(b);
    showToast("Cours marqué comme complété !");
  }

  async function handleIssue(courseId: string, title: string) {
    await learningApi.issueCertificate(courseId, title).catch(() => null);
    const dash = await learningApi.dashboard().catch(() => null);
    if (dash) setDashboard(dash);
    showToast("Certificat émis !");
    setTab("certificates");
  }

  async function handleDownload(certId: string) {
    try {
      const blob = await learningApi.downloadCertificate(certId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificat-${certId.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast("Erreur lors du téléchargement");
    }
  }

  if (loading) return <PageSpinner />;

  const tabs: { key: Tab; label: string; icon: string; count?: number }[] = [
    { key: "progress",     label: "Ma progression", icon: "📈", count: dashboard?.total_courses_started },
    { key: "badges",       label: "Badges",         icon: "🏅", count: dashboard?.total_badges },
    { key: "certificates", label: "Certificats",    icon: "🏆", count: dashboard?.total_certificates },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-6 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm px-5 py-3 rounded-xl shadow-lg z-50 transition-all">
          ✓ {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-white mb-1">Mon parcours</h1>
        <p className="text-gray-500 text-sm">Bonjour{user ? ` ${user.first_name}` : ""} — voici votre progression sur Hi! Platform</p>
      </div>

      {/* Stats */}
      {dashboard && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard icon="📖" value={dashboard.total_courses_started}  label="Cours commencés" />
          <StatCard icon="✅" value={dashboard.total_courses_completed} label="Cours complétés" />
          <StatCard icon="🏅" value={dashboard.total_badges}           label="Badges obtenus" />
          <StatCard icon="🏆" value={dashboard.total_certificates}     label="Certificats" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-white/10 rounded-2xl p-1.5 mb-6 w-fit">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === t.key ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === t.key ? "bg-white/20" : "bg-white/10"}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "progress" && dashboard && (
        <ProgressTab
          progress={dashboard.progress}
          onComplete={handleComplete}
          onIssue={handleIssue}
        />
      )}
      {tab === "badges" && badges && (
        <BadgesTab earned={badges.earned} locked={badges.locked} />
      )}
      {tab === "certificates" && dashboard && (
        <CertificatesTab certs={dashboard.certificates} onDownload={handleDownload} />
      )}
    </div>
  );
}
