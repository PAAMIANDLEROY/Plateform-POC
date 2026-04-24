import Link from "next/link";
import { MOCK_COHORTS, MOCK_STUDENTS } from "@/lib/mock";

export function generateStaticParams() {
  return MOCK_STUDENTS.map((s) => ({ id: s.cohortId, userId: s.userId }));
}

const STATUS_CONFIG = {
  active: { badge: "bg-green-500/15 text-green-400 border-green-500/25", label: "Actif", avatar: "bg-primary/20 text-primary" },
  "at-risk": { badge: "bg-orange-500/15 text-orange-400 border-orange-500/25", label: "À risque", avatar: "bg-orange-500/20 text-orange-400" },
  completed: { badge: "bg-blue-500/15 text-blue-400 border-blue-500/25", label: "Parcours terminé", avatar: "bg-blue-500/20 text-blue-400" },
  inactive: { badge: "bg-gray-500/15 text-gray-400 border-gray-500/25", label: "Inactif", avatar: "bg-gray-500/20 text-gray-500" },
} as const;

export default function StudentPage({ params }: { params: { id: string; userId: string } }) {
  const student =
    MOCK_STUDENTS.find((s) => s.cohortId === params.id && s.userId === params.userId) ??
    MOCK_STUDENTS[0];
  const cohort = MOCK_COHORTS.find((c) => c.id === params.id) ?? MOCK_COHORTS[0];
  const sc = STATUS_CONFIG[student.status];

  const completionPct = Math.round((student.coursesCompleted / student.totalCourses) * 100);
  const videoPct = Math.round((student.videosWatched / student.totalVideos) * 100);
  const timePct = Math.min(Math.round((student.timeSpent / 1200) * 100), 100);

  // Build activity timeline from course progress data
  const activity = student.courseProgress
    .flatMap((cp) => {
      const items: { icon: string; action: string; detail: string; date: string }[] = [];
      if (cp.completedAt) {
        if (cp.score !== null) {
          items.push({
            icon: "✅",
            action: "Quiz terminé",
            detail: `${cp.title} — Score : ${cp.score}/100`,
            date: cp.completedAt,
          });
        }
        items.push({
          icon: "🎓",
          action: "Cours terminé",
          detail: cp.title,
          date: cp.completedAt,
        });
      } else if (cp.progress > 0) {
        items.push({
          icon: "📖",
          action: "En cours",
          detail: `${cp.title} — ${cp.progress}% complété`,
          date: student.lastActive,
        });
      } else {
        items.push({
          icon: "🔒",
          action: "Pas encore commencé",
          detail: cp.title,
          date: "—",
        });
      }
      return items;
    })
    .slice(0, 7);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <Link
        href={`/lms/${params.id}`}
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8"
      >
        ← Retour à {cohort.name}
      </Link>

      {/* Student header card */}
      <div className="flex items-start gap-5 mb-10 bg-gray-900 border border-white/10 rounded-2xl p-6">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-extrabold shrink-0 ${sc.avatar}`}
        >
          {student.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-xl font-extrabold text-white">{student.name}</h1>
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${sc.badge}`}>
              {sc.label}
            </span>
          </div>
          <p className="text-sm text-gray-400 mb-2">
            {student.email} · {student.school}
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            <span>Inscrit le {student.enrolledAt}</span>
            <span>·</span>
            <span>Dernière activité : {student.lastActive}</span>
            <span>·</span>
            <span className={student.daysInactive > 7 ? "text-red-400 font-medium" : ""}>
              {student.daysInactive === 0
                ? "Actif aujourd'hui"
                : `Inactif depuis ${student.daysInactive} jour${student.daysInactive > 1 ? "s" : ""}`}
            </span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-lg transition-all">
            ✉️ Notifier
          </button>
          {student.status === "completed" && (
            <button className="flex items-center gap-1.5 text-sm text-white bg-primary hover:bg-primary-dark px-3 py-1.5 rounded-lg transition-colors">
              🏆 Certificat
            </button>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          {
            label: "Cours complétés",
            value: `${student.coursesCompleted} / ${student.totalCourses}`,
            pct: completionPct,
            color: completionPct === 100 ? "green" : completionPct >= 50 ? "primary" : "orange",
          },
          {
            label: "Score moyen aux quiz",
            value: student.quizAvg > 0 ? `${student.quizAvg}/100` : "—",
            pct: student.quizAvg,
            color: student.quizAvg >= 80 ? "green" : student.quizAvg >= 60 ? "yellow" : "orange",
          },
          {
            label: "Vidéos regardées",
            value: `${student.videosWatched} / ${student.totalVideos}`,
            pct: videoPct,
            color: videoPct === 100 ? "green" : "primary",
          },
          {
            label: "Temps investi",
            value: `${Math.floor(student.timeSpent / 60)}h${student.timeSpent % 60 > 0 ? `${student.timeSpent % 60}min` : ""}`,
            pct: timePct,
            color: "primary",
          },
        ].map((stat) => {
          const barColor =
            stat.color === "green"
              ? "bg-green-500"
              : stat.color === "yellow"
              ? "bg-yellow-400"
              : stat.color === "orange"
              ? "bg-orange-500"
              : "bg-primary";
          return (
            <div key={stat.label} className="bg-gray-900 border border-white/10 rounded-xl p-4">
              <div className="text-lg font-extrabold text-white mb-1">{stat.value}</div>
              <div className="text-xs text-gray-500 mb-2">{stat.label}</div>
              <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${barColor}`}
                  style={{ width: `${stat.pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Course-by-course progress */}
        <div className="lg:col-span-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
            Progression par cours
          </h2>
          <div className="flex flex-col gap-4">
            {student.courseProgress.map((cp) => (
              <div key={cp.courseId} className="bg-gray-900 border border-white/10 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{cp.title}</p>
                    {cp.completedAt ? (
                      <p className="text-xs text-gray-600 mt-0.5">Terminé le {cp.completedAt}</p>
                    ) : cp.progress > 0 ? (
                      <p className="text-xs text-gray-600 mt-0.5">En cours</p>
                    ) : (
                      <p className="text-xs text-gray-700 mt-0.5">Pas encore commencé</p>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    {cp.score !== null ? (
                      <span
                        className={`text-sm font-bold ${
                          cp.score >= 80
                            ? "text-green-400"
                            : cp.score >= 60
                            ? "text-yellow-400"
                            : "text-orange-400"
                        }`}
                      >
                        {cp.score}/100
                      </span>
                    ) : (
                      <span className="text-xs text-gray-600">—</span>
                    )}
                  </div>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      cp.progress === 100 ? "bg-green-500" : cp.progress > 0 ? "bg-primary" : "bg-gray-700"
                    }`}
                    style={{ width: `${cp.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-xs text-gray-600">{cp.progress}% complété</p>
                  {cp.progress === 100 && (
                    <span className="text-xs text-green-400 font-medium">✓ Terminé</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity timeline */}
        <div className="lg:col-span-2">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
            Activité récente
          </h2>
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-white/5" />
            <div className="flex flex-col gap-5">
              {activity.map((item, i) => (
                <div key={i} className="flex gap-4 relative">
                  <div className="w-7 h-7 rounded-full bg-gray-800 border border-white/10 flex items-center justify-center text-sm shrink-0 z-10">
                    {item.icon}
                  </div>
                  <div className="pb-1">
                    <p className="text-sm font-semibold text-white leading-tight">{item.action}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.detail}</p>
                    <p className="text-xs text-gray-700 mt-1">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes section */}
          <div className="mt-8 bg-gray-900 border border-white/10 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Notes superuser</h3>
            <textarea
              placeholder="Ajouter une note sur cet étudiant..."
              rows={3}
              className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors resize-none"
            />
            <button className="mt-2 text-xs text-primary hover:text-primary-light font-semibold transition-colors">
              Enregistrer la note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
