/**
 * @file (platform)/my-learning/page.tsx
 * @description Page "Mon parcours" "/my-learning" — tableau de bord d'apprentissage personnel.
 *
 * Structure :
 *   1. Toast de feedback (3s) — confirmation après actions (compléter, émettre cert, erreur).
 *   2. En-tête personnalisé avec le prénom de l'utilisateur.
 *   3. 4 cartes statistiques : cours commencés, complétés, badges, certificats.
 *   4. 3 onglets : Progression | Badges | Certificats.
 *   5. Contenu de l'onglet actif.
 *
 * Chargement des données :
 *   `Promise.all([learningApi.dashboard(), learningApi.getBadges()])` au montage.
 *   En cas d'erreur API (mode dev), fallback sur des objets vides pour ne pas bloquer l'UI.
 *
 * Onglet Progression (`ProgressTab`) :
 *   - Liste des cours en cours et complétés.
 *   - Barre de progression colorée : verte si complété, bleue sinon.
 *   - Score quiz coloré : vert ≥80%, orange ≥60%, rouge <60%.
 *   - Bouton "Marquer comme terminé" → `learningApi.completeCourse(courseId)`.
 *   - Bouton "Obtenir le certificat" → `learningApi.issueCertificate()` + switch vers l'onglet certificats.
 *
 * Onglet Badges (`BadgesTab`) :
 *   - Section "Obtenus" (cartes avec bordure bleue) + "À débloquer" (grayscale + opacité 50%).
 *
 * Onglet Certificats (`CertificatesTab`) :
 *   - Liste des certificats avec lien de vérification externe et bouton de téléchargement PDF.
 *   - Téléchargement : `learningApi.downloadCertificate(certId)` → blob → `<a>` temporaire.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { learningApi, coursesApi, LearningDashboard, Badge, Certificate, LearningProgress } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useLanguage, type Locale } from "@/lib/i18n";
import { PageSpinner } from "@/components/ui/Spinner";
// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Formate une date ISO en format long localisé.
 *
 * @param iso    - Date ISO 8601 (ex. "2026-04-18T10:30:00Z").
 * @param locale - Locale active — `"fr"` → "fr-FR", tout autre → "en-GB".
 * @returns Chaîne formatée (ex. "18 avril 2026").
 */
function formatDate(iso: string, locale: Locale) {
  return new Date(iso).toLocaleDateString(
    locale === "fr" ? "fr-FR" : "en-GB",
    { day: "numeric", month: "long", year: "numeric" }
  );
}

// ─── Composant StatCard ───────────────────────────────────────────────────────

/**
 * Carte statistique centrée avec icône, valeur et libellé.
 *
 * @property icon  - Emoji ou caractère affiché en haut.
 * @property value - Valeur numérique (compteur).
 * @property label - Libellé descriptif en dessous.
 */
function StatCard({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-2xl font-extrabold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

// ─── Onglet Progression ───────────────────────────────────────────────────────

/**
 * Onglet de progression par cours.
 *
 * @property progress   - Liste des progressions de cours.
 * @property locale     - Locale pour le formatage des dates.
 * @property onComplete - Callback appelé quand l'utilisateur marque un cours comme terminé.
 * @property onIssue    - Callback appelé quand l'utilisateur demande un certificat.
 */
function ProgressTab({ progress, locale, onComplete, onIssue }: {
  progress: LearningProgress[];
  locale: Locale;
  onComplete: (courseId: string) => void;
  onIssue: (courseId: string, title: string) => void;
}) {
  const { t } = useLanguage();

  // Titres des cours (réels) pour l'affichage — remplace l'ancienne recherche mock.
  const [titles, setTitles] = useState<Record<string, string>>({});
  useEffect(() => {
    coursesApi.list().then((cs) => setTitles(Object.fromEntries(cs.map((c) => [c.id, c.title])))).catch(() => {});
  }, []);

  // Branche aucun cours commencé : état vide avec CTA vers le catalogue
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
        const title = titles[p.course_id] ?? `Course ${p.course_id}`;
        return (
          <div key={p.course_id} className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <Link href={`/courses/${p.course_id}`} className="font-semibold text-gray-900 hover:text-primary transition-colors">
                  {title}
                </Link>
                {/* Branche cours complété : date de complétion en vert */}
                {p.completed && p.completed_at && (
                  <p className="text-xs text-emerald-600 mt-0.5">
                    {t.myLearning.progress.completedOn} {formatDate(p.completed_at, locale)}
                  </p>
                )}
                {/* Branche cours en cours : date de démarrage en gris */}
                {!p.completed && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t.myLearning.progress.startedOn} {p.started_at ? formatDate(p.started_at, locale) : "—"}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Bouton "Marquer comme terminé" — affiché si cours non complété */}
                {!p.completed && (
                  <button onClick={() => onComplete(p.course_id)}
                    className="text-xs border border-primary/30 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors">
                    {t.myLearning.progress.markDone}
                  </button>
                )}
                {/* Bouton "Obtenir le certificat" — affiché si cours complété */}
                {p.completed && (
                  <button onClick={() => onIssue(p.course_id, title)}
                    className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary-dark transition-colors">
                    {t.myLearning.progress.getCert}
                  </button>
                )}
              </div>
            </div>

            {/* Barre de progression : verte si complété, bleue sinon */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${p.completed ? "bg-emerald-500" : "bg-primary"}`}
                  style={{ width: `${p.progress_pct}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-500 w-10 text-right">{p.progress_pct}%</span>
            </div>

            {/* Score quiz — coloré selon le seuil : vert ≥80%, orange ≥60%, rouge <60% */}
            {p.score !== undefined && (
              <p className="text-xs text-gray-500 mt-2">
                {t.myLearning.progress.quizScore}{" "}
                <span className={`font-semibold ${
                  p.score >= 80 ? "text-emerald-600"
                  : p.score >= 60 ? "text-amber-600"
                  : "text-danger"
                }`}>
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

// ─── Onglet Badges ────────────────────────────────────────────────────────────

/**
 * Onglet de badges obtenus et à débloquer.
 *
 * @property earned - Badges déjà obtenus (bordure bleue).
 * @property locked - Badges non encore débloqués (grayscale + opacité).
 * @property locale - Locale pour formater la date d'attribution.
 */
function BadgesTab({ earned, locked, locale }: { earned: Badge[]; locked: Badge[]; locale: Locale }) {
  const { t } = useLanguage();
  return (
    <div>
      {/* Section badges obtenus — avec compteur */}
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
                {/* Date d'attribution — affichée uniquement si disponible */}
                {b.awarded_at && (
                  <p className="text-xs text-primary mt-2">{formatDate(b.awarded_at, locale)}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section badges verrouillés — grayscale pour indiquer qu'ils ne sont pas encore débloqués */}
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

      {/* État vide si aucun badge (obtenu ou verrouillé) */}
      {earned.length === 0 && locked.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🏅</div>
          <p className="text-gray-900 font-semibold">{t.myLearning.badges.empty}</p>
        </div>
      )}
    </div>
  );
}

// ─── Onglet Certificats ───────────────────────────────────────────────────────

/**
 * Onglet de certificats obtenus.
 *
 * @property certs      - Liste des certificats.
 * @property locale     - Locale pour le formatage des dates.
 * @property onDownload - Callback de téléchargement PDF déclenché par le bouton.
 */
function CertificatesTab({ certs, locale, onDownload }: {
  certs: Certificate[];
  locale: Locale;
  onDownload: (certId: string) => void;
}) {
  const { t } = useLanguage();

  // Branche aucun certificat : état vide
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
            {/* Lien de vérification externe — s'ouvre dans un nouvel onglet */}
            <Link href={c.verification_url} target="_blank" className="text-xs text-primary hover:text-primary-dark transition-colors">
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

// ─── Page principale ──────────────────────────────────────────────────────────

/** Types d'onglets disponibles. */
type Tab = "progress" | "badges" | "certificates";

/**
 * Page "Mon parcours" — tableau de bord d'apprentissage personnel.
 */
export default function MyLearningPage() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();

  /** Onglet actif. */
  const [tab, setTab] = useState<Tab>("progress");

  /** Données du dashboard (null pendant le chargement). */
  const [dashboard, setDashboard] = useState<LearningDashboard | null>(null);

  /** Badges (null pendant le chargement). */
  const [badges, setBadges] = useState<{ earned: Badge[]; locked: Badge[] } | null>(null);

  /** `true` pendant le chargement initial. */
  const [loading, setLoading] = useState(true);

  /** Message du toast de feedback (vide = pas de toast). */
  const [toast, setToast] = useState("");

  /**
   * Chargement initial des données du dashboard et des badges en parallèle.
   * En cas d'erreur (API indisponible en dev), fallback sur des objets vides.
   */
  useEffect(() => {
    Promise.all([learningApi.dashboard(), learningApi.getBadges()])
      .then(([dash, b]) => {
        setDashboard(dash);
        setBadges(b);
      })
      .catch(() => {
        // Fallback mode dev : données vides pour éviter un écran bloqué
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

  /**
   * Affiche un toast pendant 3 secondes puis le masque.
   */
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  /**
   * Marque un cours comme complété, rafraîchit le dashboard et les badges.
   * Les `.catch(() => null)` évitent que des erreurs silencieuses bloquent l'UI.
   */
  async function handleComplete(courseId: string) {
    await learningApi.completeCourse(courseId).catch(() => null);
    const dash = await learningApi.dashboard().catch(() => null);
    if (dash) setDashboard(dash);
    const b = await learningApi.getBadges().catch(() => null);
    if (b) setBadges(b);
    showToast(t.myLearning.toast.completed);
  }

  /**
   * Émet un certificat pour un cours complété.
   * Rafraîchit le dashboard et bascule automatiquement sur l'onglet "certificats".
   */
  async function handleIssue(courseId: string, title: string) {
    await learningApi.issueCertificate(courseId, title).catch(() => null);
    const dash = await learningApi.dashboard().catch(() => null);
    if (dash) setDashboard(dash);
    showToast(t.myLearning.toast.issued);
    setTab("certificates"); // Bascule vers l'onglet certificats pour visibilité immédiate
  }

  /**
   * Télécharge un certificat PDF via un `<a>` temporaire.
   * `URL.revokeObjectURL` libère la mémoire après le déclenchement du téléchargement.
   */
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

  /**
   * Définition des onglets avec compteur dans le badge.
   * Le compteur est masqué si la valeur est 0 ou undefined.
   */
  const tabs: { key: Tab; label: string; icon: string; count?: number }[] = [
    { key: "progress",     label: t.myLearning.tabs.progress,     icon: "📈", count: dashboard?.total_courses_started },
    { key: "badges",       label: t.myLearning.tabs.badges,       icon: "🏅", count: dashboard?.total_badges },
    { key: "certificates", label: t.myLearning.tabs.certificates, icon: "🏆", count: dashboard?.total_certificates },
  ];

  /**
   * Sous-titre personnalisé avec le prénom de l'utilisateur.
   * Utilise `t.myLearning.subtitleGuest` si non connecté.
   */
  const subtitle = user
    ? t.myLearning.subtitle.replace("{{name}}", user.first_name)
    : t.myLearning.subtitleGuest;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">

      {/* Toast de feedback — position fixed en haut à droite, z-50 */}
      {toast && (
        <div className="fixed top-20 right-6 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-5 py-3 rounded-xl shadow-lg z-50 transition-all">
          ✓ {toast}
        </div>
      )}

      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-1">{t.myLearning.title}</h1>
        <p className="text-gray-500 text-sm">{subtitle}</p>
      </div>

      {/* 4 cartes statistiques — 2 cols mobile, 4 cols sm+ */}
      {dashboard && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard icon="📖" value={dashboard.total_courses_started}  label={t.myLearning.stats.started} />
          <StatCard icon="✅" value={dashboard.total_courses_completed} label={t.myLearning.stats.completed} />
          <StatCard icon="🏅" value={dashboard.total_badges}           label={t.myLearning.stats.badges} />
          <StatCard icon="🏆" value={dashboard.total_certificates}     label={t.myLearning.stats.certificates} />
        </div>
      )}

      {/* Sélecteur d'onglets en "pill group" */}
      <div className="flex gap-1 bg-white border border-gray-200 rounded-2xl p-1.5 mb-6 w-fit">
        {tabs.map((tabItem) => (
          <button key={tabItem.key} onClick={() => setTab(tabItem.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              // Branche onglet actif : fond bleu plein
              tab === tabItem.key ? "bg-primary text-white shadow-md"
              // Branche onglet inactif : fond transparent avec hover gris
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <span>{tabItem.icon}</span>
            {tabItem.label}
            {/* Compteur — affiché uniquement si > 0 */}
            {tabItem.count !== undefined && tabItem.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                tab === tabItem.key ? "bg-white/20" : "bg-gray-100"
              }`}>
                {tabItem.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contenu de l'onglet actif — rendu conditionnel par onglet */}
      {tab === "progress"     && dashboard && <ProgressTab progress={dashboard.progress} locale={locale} onComplete={handleComplete} onIssue={handleIssue} />}
      {tab === "badges"       && badges    && <BadgesTab earned={badges.earned} locked={badges.locked} locale={locale} />}
      {tab === "certificates" && dashboard && <CertificatesTab certs={dashboard.certificates} locale={locale} onDownload={handleDownload} />}
    </div>
  );
}
