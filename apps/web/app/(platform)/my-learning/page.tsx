"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { learningApi, LearningDashboard, Badge, Certificate, LearningProgress } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useLanguage, type Locale } from "@/lib/i18n";
import { PageSpinner } from "@/components/ui/Spinner";
import { MOCK_COURSES } from "@/lib/mock";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string, locale: Locale) {
  return new Date(iso).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function getCourseTitle(courseId: string) {
  return MOCK_COURSES.find((c) => c.id === courseId)?.title ?? `Course ${courseId}`;
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-2xl font-extrabold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

// ── Progress tab ──────────────────────────────────────────────────────────────

function ProgressTab({ progress, locale, onComplete, onIssue }: {
  progress: LearningProgress[];
  locale: Locale;
  onComplete: (courseId: string) => void;
  onIssue: (courseId: string, title: string) => void;
}) {
  const { t } = useLanguage();

  if (progress.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">📖</div>
        <p className="text-gray-900 font-semibold mb-1">{t.myLearning.progress.empty}</p>
        <p className="text-gray-500 text-sm mb-5">{t.myLearning.progress.emptyDesc}</p>
        <Link href="/learning-ai/courses" className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors">
          {t.myLearning.progress.explore}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {progress.map((p) => {
        const title = getCourseTitle(p.course_id);
        return (
          <div key={p.course_id} className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <Link href={`/courses/${p.course_id}`} className="font-semibold text-gray-900 hover:text-primary transition-colors">
                  {title}
                </Link>
                {p.completed && p.completed_at && (
                  <p className="text-xs text-emerald-600 mt-0.5">
                    {t.myLearning.progress.completedOn} {formatDate(p.completed_at, locale)}
                  </p>
                )}
                {!p.completed && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t.myLearning.progress.startedOn} {p.started_at ? formatDate(p.started_at, locale) : "—"}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!p.completed && (
                  <button onClick={() => onComplete(p.course_id)}
                    className="text-xs border border-primary/30 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors">
                    {t.myLearning.progress.markDone}
                  </button>
                )}
                {p.completed && (
                  <button onClick={() => onIssue(p.course_id, title)}
                    className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary-dark transition-colors">
                    {t.myLearning.progress.getCert}
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${p.completed ? "bg-emerald-500" : "bg-primary"}`}
                  style={{ width: `${p.progress_pct}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-500 w-10 text-right">{p.progress_pct}%</span>
            </div>

            {p.score !== undefined && (
              <p className="text-xs text-gray-500 mt-2">
                {t.myLearning.progress.quizScore}{" "}
                <span className={`font-semibold ${p.score >= 80 ? "text-emerald-600" : p.score >= 60 ? "text-amber-600" : "text-danger"}`}>
                  {p.score}%
                </span>
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Badges tab ────────────────────────────────────────────────────────────────

function BadgesTab({ earned, locked, locale }: { earned: Badge[]; locked: Badge[]; locale: Locale }) {
  const { t } = useLanguage();
  return (
    <div>
      {earned.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            {t.myLearning.badges.earned} · {earned.length}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {earned.map((b) => (
              <div key={b.id} className="bg-white border border-primary/20 rounded-2xl p-5 text-center shadow-card">
                <div className="text-4xl mb-2">{b.icon}</div>
                <p className="text-sm font-bold text-gray-900 mb-1">{b.name}</p>
                <p className="text-xs text-gray-500">{b.description}</p>
                {b.awarded_at && (
                  <p className="text-xs text-primary mt-2">{formatDate(b.awarded_at, locale)}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {locked.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            {t.myLearning.badges.locked} · {locked.length}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {locked.map((b) => (
              <div key={b.id} className="bg-white border border-gray-100 rounded-2xl p-5 text-center opacity-50 grayscale shadow-card">
                <div className="text-4xl mb-2">{b.icon}</div>
                <p className="text-sm font-bold text-gray-400 mb-1">{b.name}</p>
                <p className="text-xs text-gray-400">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {earned.length === 0 && locked.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🏅</div>
          <p className="text-gray-900 font-semibold">{t.myLearning.badges.empty}</p>
        </div>
      )}
    </div>
  );
}

// ── Certificates tab ──────────────────────────────────────────────────────────

function CertificatesTab({ certs, locale, onDownload }: {
  certs: Certificate[];
  locale: Locale;
  onDownload: (certId: string) => void;
}) {
  const { t } = useLanguage();

  if (certs.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🏆</div>
        <p className="text-gray-900 font-semibold mb-1">{t.myLearning.certificates.empty}</p>
        <p className="text-gray-500 text-sm">{t.myLearning.certificates.emptyDesc}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {certs.map((c) => (
        <div key={c.id} className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-2xl shrink-0">
            🏆
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 line-clamp-1">{c.course_title}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {t.myLearning.certificates.issuedOn} {formatDate(c.issued_at, locale)}
            </p>
            <Link href={c.verification_url} target="_blank"
              className="text-xs text-primary hover:text-primary-dark transition-colors">
              {t.myLearning.certificates.verify}
            </Link>
          </div>
          <button onClick={() => onDownload(c.id)}
            className="shrink-0 border border-gray-200 text-gray-600 text-xs px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            {t.myLearning.certificates.download}
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
  const { t, locale } = useLanguage();
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
    showToast(t.myLearning.toast.completed);
  }

  async function handleIssue(courseId: string, title: string) {
    await learningApi.issueCertificate(courseId, title).catch(() => null);
    const dash = await learningApi.dashboard().catch(() => null);
    if (dash) setDashboard(dash);
    showToast(t.myLearning.toast.issued);
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
      showToast(t.myLearning.toast.downloadError);
    }
  }

  if (loading) return <PageSpinner />;

  const tabs: { key: Tab; label: string; icon: string; count?: number }[] = [
    { key: "progress",     label: t.myLearning.tabs.progress,     icon: "📈", count: dashboard?.total_courses_started },
    { key: "badges",       label: t.myLearning.tabs.badges,       icon: "🏅", count: dashboard?.total_badges },
    { key: "certificates", label: t.myLearning.tabs.certificates, icon: "🏆", count: dashboard?.total_certificates },
  ];

  const subtitle = user
    ? t.myLearning.subtitle.replace("{{name}}", user.first_name)
    : t.myLearning.subtitleGuest;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-6 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-5 py-3 rounded-xl shadow-lg z-50 transition-all">
          ✓ {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-1">{t.myLearning.title}</h1>
        <p className="text-gray-500 text-sm">{subtitle}</p>
      </div>

      {/* Stats */}
      {dashboard && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard icon="📖" value={dashboard.total_courses_started}  label={t.myLearning.stats.started} />
          <StatCard icon="✅" value={dashboard.total_courses_completed} label={t.myLearning.stats.completed} />
          <StatCard icon="🏅" value={dashboard.total_badges}           label={t.myLearning.stats.badges} />
          <StatCard icon="🏆" value={dashboard.total_certificates}     label={t.myLearning.stats.certificates} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-gray-200 rounded-2xl p-1.5 mb-6 w-fit">
        {tabs.map((tabItem) => (
          <button key={tabItem.key} onClick={() => setTab(tabItem.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === tabItem.key ? "bg-primary text-white shadow-md" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <span>{tabItem.icon}</span>
            {tabItem.label}
            {tabItem.count !== undefined && tabItem.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === tabItem.key ? "bg-white/20" : "bg-gray-100"}`}>
                {tabItem.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "progress" && dashboard && (
        <ProgressTab progress={dashboard.progress} locale={locale} onComplete={handleComplete} onIssue={handleIssue} />
      )}
      {tab === "badges" && badges && (
        <BadgesTab earned={badges.earned} locked={badges.locked} locale={locale} />
      )}
      {tab === "certificates" && dashboard && (
        <CertificatesTab certs={dashboard.certificates} locale={locale} onDownload={handleDownload} />
      )}
    </div>
  );
}
