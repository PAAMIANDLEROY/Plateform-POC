/**
 * @file (platform)/lms/[id]/CohortDetail.tsx
 * @description Composant client de détail d'une cohorte LMS — rendu interactif avec filtre
 * par statut, recherche textuelle, et export CSV.
 *
 * ## Types locaux
 *
 * `FilterType` : union des 5 onglets de filtre possibles.
 *   - "all"       : tous les étudiants.
 *   - "active"    : étudiants actifs.
 *   - "at-risk"   : étudiants à risque.
 *   - "completed" : parcours terminé.
 *   - "inactive"  : inactifs.
 *
 * ## Constantes de style
 *
 * `STATUS_STYLES` : `Record<StudentEnrollment["status"], string>`
 *   Classe Tailwind (fond + texte + bordure) pour chaque statut.
 *
 * `STATUS_LABELS` : `Record<StudentEnrollment["status"], string>`
 *   Label français pour chaque statut.
 *
 * ## Sous-composant `ProgressBar`
 *
 * @property value - Pourcentage de progression (0–100).
 * @property green - Si `true`, utilise `bg-green-500` ; sinon `bg-primary`.
 *
 * ## `filtered` : tableau dérivé
 *
 * Combine le filtre actif (`filter` state) et la recherche (`search` state) :
 *   - `matchFilter` : `filter === "all"` ou `s.status === filter`.
 *   - `matchSearch` : pas de texte OR nom/email contient la chaîne (insensible à la casse).
 *
 * ## `counts` : badges des onglets
 *
 * `Record<FilterType, number>` pré-calculé sur `students` (pas `filtered`), de sorte
 * que les compteurs montrent toujours les vrais totaux, indépendamment de la recherche.
 *
 * ## `handleExportCSV()`
 *
 * Exporte les étudiants de la cohorte (pas filtrés) en CSV horodaté.
 * Nom du fichier : `cohorte-{id}-{todayStamp()}.csv`.
 *
 * ## Tableau des étudiants
 *
 * Colonnes : Étudiant | Dernière activité | Progression cours (mini barres) | Score | Temps | Statut | Actions.
 *
 * Couleur "Dernière activité" :
 *   - 0 jour  : `text-green-400`  ("Aujourd'hui").
 *   - ≤ 3 j   : `text-gray-300`.
 *   - ≤ 7 j   : `text-yellow-400`.
 *   - > 7 j   : `text-red-400`.
 *
 * Couleur "Score" :
 *   - ≥ 80    : `text-green-400`.
 *   - ≥ 60    : `text-yellow-400`.
 *   - > 0     : `text-orange-400`.
 *   - 0 (pas de score) : `text-gray-600` + "—".
 *
 * Actions (visibles au survol via `opacity-0 group-hover:opacity-100`) :
 *   - "Voir →" : lien vers la page étudiant.
 *   - "✉️"    : bouton notifier (placeholder).
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import type { Cohort, StudentEnrollment } from "@/lib/mock";
import { downloadCSV, todayStamp } from "@/lib/export";

/** Types de filtre disponibles dans les onglets. */
type FilterType = "all" | "active" | "at-risk" | "completed" | "inactive";

/**
 * Styles Tailwind pour chaque statut d'étudiant.
 * Utilisés dans les badges et avatars du tableau.
 */
const STATUS_STYLES: Record<StudentEnrollment["status"], string> = {
  active:    "bg-green-500/15 text-green-400 border-green-500/25",
  "at-risk": "bg-orange-500/15 text-orange-400 border-orange-500/25",
  completed: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  inactive:  "bg-gray-500/15 text-gray-400 border-gray-500/25",
};

/**
 * Labels français pour chaque statut d'étudiant.
 */
const STATUS_LABELS: Record<StudentEnrollment["status"], string> = {
  active:    "Actif",
  "at-risk": "À risque",
  completed: "Terminé",
  inactive:  "Inactif",
};

// ── Sous-composant ProgressBar ─────────────────────────────────────────────────

/**
 * Barre de progression CSS horizontale.
 *
 * @property value - Pourcentage de remplissage (0–100).
 * @property green - Si `true`, barre verte ; sinon barre `primary` (bleu).
 */
function ProgressBar({ value, green }: { value: number; green?: boolean }) {
  return (
    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden w-full min-w-[64px]">
      <div
        className={`h-full rounded-full ${green ? "bg-green-500" : "bg-primary"}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────────────────────

/**
 * Détail d'une cohorte avec liste d'étudiants filtrables et exportables.
 *
 * @property cohort          - Données de la cohorte.
 * @property students        - Étudiants inscrits dans cette cohorte.
 * @property assignedCourses - Cours assignés, sous forme `{ id, title }`.
 */
export function CohortDetail({
  cohort,
  students,
  assignedCourses,
}: {
  cohort: Cohort;
  students: StudentEnrollment[];
  assignedCourses: { id: string; title: string }[];
}) {
  /** Filtre actif sur le statut des étudiants. */
  const [filter, setFilter] = useState<FilterType>("all");
  /** Texte de recherche sur le nom ou l'email. */
  const [search, setSearch] = useState("");

  /**
   * Exporte la liste complète des étudiants de la cohorte en CSV.
   * Utilise `todayStamp()` pour l'horodatage du nom de fichier.
   */
  function handleExportCSV() {
    const rows = students.map((s) => ({
      "Nom":                   s.name,
      "Email":                 s.email,
      "École":                 s.school,
      "Statut":                STATUS_LABELS[s.status],
      "Cours complétés":       `${s.coursesCompleted}/${s.totalCourses}`,
      "Score moyen":           s.quizAvg > 0 ? `${s.quizAvg}/100` : "—",
      "Temps investi (min)":   s.timeSpent,
      "Jours inactif":         s.daysInactive,
      "Dernière activité":     s.lastActive,
    }));
    downloadCSV(rows, `cohorte-${cohort.id}-${todayStamp()}.csv`);
  }

  /**
   * Étudiants après application du filtre actif ET de la recherche textuelle.
   * Les deux conditions sont combinées par un ET logique.
   */
  const filtered = students.filter((s) => {
    // Branche "all" : pas de filtre sur le statut
    const matchFilter = filter === "all" || s.status === filter;
    // Branche pas de texte : retourne tous
    const matchSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  /**
   * Compteurs pré-calculés pour les badges des onglets.
   * Calculés sur `students` (pas `filtered`) pour refléter les vrais totaux.
   */
  const counts: Record<FilterType, number> = {
    all:       students.length,
    active:    students.filter((s) => s.status === "active").length,
    "at-risk": students.filter((s) => s.status === "at-risk").length,
    completed: students.filter((s) => s.status === "completed").length,
    inactive:  students.filter((s) => s.status === "inactive").length,
  };

  /** Définitions des onglets de filtre. */
  const tabs: { key: FilterType; label: string }[] = [
    { key: "all",       label: "Tous" },
    { key: "active",    label: "Actifs" },
    { key: "at-risk",   label: "À risque" },
    { key: "completed", label: "Terminé" },
    { key: "inactive",  label: "Inactifs" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 bg-navy min-h-screen">
      {/* Lien retour au tableau de bord LMS */}
      <Link
        href="/lms"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8"
      >
        ← Retour au LMS
      </Link>

      {/* ── En-tête de la cohorte ── */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-extrabold text-white">{cohort.name}</h1>
            {/* Badge statut cohorte */}
            <span
              className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                // Branche active : vert. Branche autre : gris.
                cohort.status === "active"
                  ? "bg-green-500/15 text-green-400 border-green-500/25"
                  : "bg-gray-500/15 text-gray-400 border-gray-500/25"
              }`}
            >
              {cohort.status === "active" ? "Actif" : "Archivé"}
            </span>
          </div>
          <p className="text-sm text-gray-400">
            {cohort.school} · {cohort.startDate} → {cohort.endDate}
          </p>
          <p className="text-sm text-gray-500 mt-1 max-w-xl">{cohort.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white border border-white/10 hover:border-white/30 px-4 py-2 rounded-lg transition-all"
          >
            📊 Exporter CSV
          </button>
          <button className="flex items-center gap-2 text-sm text-white bg-primary hover:bg-primary-dark px-4 py-2 rounded-lg transition-colors shadow-lg shadow-primary/20">
            + Ajouter un étudiant
          </button>
        </div>
      </div>

      {/* ── Stats de la cohorte (4 KPI) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Apprenants inscrits",  value: cohort.enrolledCount },
          { label: "Taux de complétion",   value: `${cohort.completionRate}%` },
          { label: "Score moyen aux quiz", value: `${cohort.avgScore}/100` },
          {
            label: "Temps moyen investi",
            // Format "Xh[Ymin]" : minutes restantes affichées seulement si > 0
            value: `${Math.floor(cohort.avgTimeSpent / 60)}h${cohort.avgTimeSpent % 60 > 0 ? `${cohort.avgTimeSpent % 60}min` : ""}`,
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-900 border border-white/10 rounded-xl p-4">
            <div className="text-xl font-extrabold text-white mb-1">{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Cours assignés à la cohorte ── */}
      <div className="mb-8 bg-gray-900 border border-white/10 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">Cours assignés à cette cohorte</h2>
          <button className="text-xs text-primary hover:text-primary-light transition-colors font-medium">
            + Assigner un cours
          </button>
        </div>
        {/* Branche cours présents : badges pills */}
        {assignedCourses.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {assignedCourses.map((c) => (
              <span
                key={c.id}
                className="text-xs bg-primary/10 border border-primary/20 text-primary-light px-3 py-1.5 rounded-full"
              >
                📖 {c.title}
              </span>
            ))}
          </div>
        ) : (
          // Branche pas de cours : état vide
          <p className="text-sm text-gray-600">Aucun cours assigné.</p>
        )}
      </div>

      {/* ── Onglets de filtre + champ de recherche ── */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex gap-1 bg-gray-900 border border-white/10 rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                // Branche actif : fond primary + texte blanc
                filter === tab.key
                  ? "bg-primary text-white shadow-sm shadow-primary/30"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
              {/* Badge compteur de l'onglet */}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  filter === tab.key ? "bg-white/20 text-white" : "bg-white/5 text-gray-600"
                }`}
              >
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Rechercher un étudiant..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-gray-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors w-64"
        />
      </div>

      {/* ── Tableau des étudiants ── */}
      <div className="bg-gray-900 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3.5">
                Étudiant
              </th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3.5">
                Dernière activité
              </th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3.5 hidden lg:table-cell">
                Progression cours
              </th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3.5">
                Score
              </th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3.5 hidden md:table-cell">
                Temps
              </th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3.5">
                Statut
              </th>
              <th className="px-4 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((student) => (
              <tr key={student.userId} className="hover:bg-white/[0.03] transition-colors group">

                {/* Colonne Étudiant : avatar coloré par statut + nom + email */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        // Branche statut avatar : couleur selon statut
                        student.status === "at-risk"
                          ? "bg-orange-500/20 text-orange-400"
                          : student.status === "inactive"
                          ? "bg-gray-500/20 text-gray-500"
                          : student.status === "completed"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-primary/20 text-primary" // actif
                      }`}
                    >
                      {student.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white leading-tight">{student.name}</p>
                      <p className="text-xs text-gray-600">{student.email}</p>
                    </div>
                  </div>
                </td>

                {/* Colonne Dernière activité : couleur selon ancienneté */}
                <td className="px-4 py-4">
                  <p
                    className={`text-xs font-medium ${
                      // Branche 0 j : vert (actif aujourd'hui)
                      student.daysInactive === 0
                        ? "text-green-400"
                        // Branche ≤ 3 j : gris clair
                        : student.daysInactive <= 3
                        ? "text-gray-300"
                        // Branche ≤ 7 j : jaune
                        : student.daysInactive <= 7
                        ? "text-yellow-400"
                        // Branche > 7 j : rouge
                        : "text-red-400"
                    }`}
                  >
                    {student.daysInactive === 0 ? "Aujourd'hui" : `Il y a ${student.daysInactive}j`}
                  </p>
                  <p className="text-xs text-gray-600">{student.lastActive}</p>
                </td>

                {/* Colonne Progression (masquée sur mobile) : mini barres par cours */}
                <td className="px-4 py-4 hidden lg:table-cell">
                  <div className="flex flex-col gap-1.5 min-w-[120px]">
                    {student.courseProgress.map((cp) => (
                      <div key={cp.courseId} className="flex items-center gap-2">
                        {/* Branche 100 % : barre verte */}
                        <ProgressBar value={cp.progress} green={cp.progress === 100} />
                        <span className="text-xs text-gray-600 w-8 text-right shrink-0">
                          {cp.progress}%
                        </span>
                      </div>
                    ))}
                  </div>
                </td>

                {/* Colonne Score : couleur selon valeur */}
                <td className="px-4 py-4">
                  <span
                    className={`text-sm font-bold ${
                      // Branche ≥ 80 : vert
                      student.quizAvg >= 80
                        ? "text-green-400"
                        // Branche ≥ 60 : jaune
                        : student.quizAvg >= 60
                        ? "text-yellow-400"
                        // Branche > 0 : orange
                        : student.quizAvg > 0
                        ? "text-orange-400"
                        // Branche 0 (pas de score) : gris
                        : "text-gray-600"
                    }`}
                  >
                    {student.quizAvg > 0 ? `${student.quizAvg}/100` : "—"}
                  </span>
                </td>

                {/* Colonne Temps (masquée sur tablette) */}
                <td className="px-4 py-4 hidden md:table-cell">
                  <span className="text-sm text-gray-400">
                    {Math.floor(student.timeSpent / 60)}h
                    {student.timeSpent % 60 > 0 ? `${student.timeSpent % 60}` : ""}
                  </span>
                </td>

                {/* Colonne Statut : badge coloré */}
                <td className="px-4 py-4">
                  <span
                    className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${STATUS_STYLES[student.status]}`}
                  >
                    {STATUS_LABELS[student.status]}
                  </span>
                </td>

                {/* Colonne Actions (visible au survol de la ligne) */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      href={`/lms/${student.cohortId}/student/${student.userId}`}
                      className="text-xs text-primary hover:text-primary-light transition-colors font-semibold whitespace-nowrap"
                    >
                      Voir →
                    </Link>
                    <button
                      className="text-xs text-gray-500 hover:text-white transition-colors"
                      title="Envoyer un message"
                    >
                      ✉️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* État vide après filtre + recherche */}
        {filtered.length === 0 && (
          <div className="text-center py-14 text-gray-600 text-sm">
            {/* Branche recherche active : message contextuel */}
            {search
              ? `Aucun résultat pour « ${search} »`
              : "Aucun étudiant ne correspond à ce filtre."}
          </div>
        )}
      </div>

      {/* État vide si aucun étudiant dans la cohorte */}
      {students.length === 0 && (
        <div className="mt-8 bg-gray-900 border border-white/10 rounded-xl p-10 text-center">
          <p className="text-gray-600 text-sm mb-3">
            Aucun étudiant inscrit dans cette cohorte pour le moment.
          </p>
          <button className="text-sm text-primary hover:text-primary-light font-semibold transition-colors">
            + Inscrire le premier étudiant
          </button>
        </div>
      )}
    </div>
  );
}
