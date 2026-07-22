/**
 * @file (platform)/databootcamp/page.tsx
 * @description Page de présentation du pilier « Hi! Databootcamp ».
 *
 * Reproduit le contenu de la page publique Hi! PARIS Data Bootcamp
 * (https://hi-paris.fr/data-bootcamp/) : présentation du programme, format & dates,
 * parcours, objectifs pédagogiques, récompenses, témoignage, organisateurs, contact.
 *
 * Contenu statique (Server Component, aucun hook). Non internationalisé pour l'instant :
 * le corps de page est rédigé en français. La navigation (dropdown) reste, elle, traduite.
 */

import Link from "next/link";

/** Format & sessions du bootcamp. */
const SESSIONS = [
  {
    tag: "En ligne",
    dates: "18 – 22 août",
    detail: "9h00 – 17h00 chaque jour",
    icon: "💻",
    accent: "from-primary to-primary-dark",
  },
  {
    tag: "Présentiel",
    dates: "25 – 29 août",
    detail: "À l'ENSAE · 9h00 – 17h00 chaque jour",
    icon: "🏛",
    accent: "from-danger to-[#A01E2A]",
  },
];

/** Les deux parcours proposés. */
const TRACKS = [
  {
    name: "Débutant",
    desc: "Pour les novices en data science et en IA. Aucune connaissance préalable requise.",
    icon: "🌱",
  },
  {
    name: "Intermédiaire",
    desc: "Pour les participant·es ayant déjà une première expérience en programmation ou en data.",
    icon: "🚀",
  },
];

/** Objectifs pédagogiques. */
const OUTCOMES = [
  "Les bases essentielles du langage Python",
  "Les concepts clés : transformation de données et machine learning",
  "Des sessions de code pratiques et guidées",
  "Des applications concrètes tirées du monde de l'entreprise",
];

/** Récompenses de la compétition finale. */
const AWARDS = [
  { title: "Prix de l'Excellence Technique", icon: "🛠" },
  { title: "Prix de la Meilleure Approche Scientifique", icon: "🔬" },
  { title: "Prix de la Meilleure Opportunité Business", icon: "💡" },
];

/**
 * Page de présentation du Data Bootcamp.
 */
export default function DataBootcampPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: 460 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=1600&q=80"
          alt="Data Science & IA"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-primary/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6 py-24 flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur border border-white/25 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-6 w-fit tracking-wide uppercase">
            Hi! PARIS · Été 2025
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight mb-4 max-w-2xl">
            Data Bootcamp
          </h1>

          <p className="text-lg text-white/80 max-w-2xl mb-8 leading-relaxed">
            Un programme d'été de <strong className="text-white">5 jours</strong> pour découvrir l'Intelligence
            Artificielle et la Data Science avec Python. Ouvert aux étudiant·es de HEC Paris et de l'Institut
            Polytechnique de Paris — <strong className="text-white">aucune connaissance préalable requise</strong>.
          </p>

          <div className="flex items-center gap-4 flex-wrap">
            <Link
              href="/databootcamp/courses"
              className="bg-danger text-white px-7 py-3 rounded-xl font-semibold text-base hover:bg-danger-dark transition-colors shadow-lg"
            >
              Voir la liste des cours
            </Link>
            <a
              href="mailto:contact@hi-paris.fr"
              className="bg-white/15 backdrop-blur border border-white/30 text-white px-7 py-3 rounded-xl font-semibold text-base hover:bg-white/25 transition-colors"
            >
              Nous contacter
            </a>
          </div>
        </div>
      </section>

      {/* ── À propos ── */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">À propos du programme</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          Le <strong>Hi! PARIS Data Boot Camp</strong> est un cours de découverte intensif de 5 jours consacré à
          l'Intelligence Artificielle et à la Data Science avec Python. Il s'adresse aux étudiant·es de HEC Paris
          et de l'Institut Polytechnique de Paris intéressé·es par ces domaines, et ne nécessite aucun prérequis.
        </p>
        <p className="text-gray-600 leading-relaxed">
          L'objectif est de développer la sensibilité des étudiant·es et de leur offrir un aperçu de l'usage de la
          Data Science dans le monde de l'entreprise, tout en les aidant à le mettre en pratique.
        </p>
      </section>

      {/* ── Format & dates ── */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Format &amp; dates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {SESSIONS.map((s) => (
            <div
              key={s.tag}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${s.accent} p-7 text-white shadow-lg`}
            >
              <div className="text-3xl mb-3">{s.icon}</div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">{s.tag}</p>
              <p className="text-2xl font-extrabold mb-1">{s.dates}</p>
              <p className="text-sm text-white/80">{s.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Deux parcours ── */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Deux parcours au choix</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {TRACKS.map((tr) => (
            <div key={tr.name} className="bg-white border border-gray-200 rounded-2xl p-7 shadow-card">
              <div className="text-3xl mb-3">{tr.icon}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{tr.name}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{tr.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Objectifs pédagogiques ── */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Ce que vous allez apprendre</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {OUTCOMES.map((o) => (
            <div key={o} className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-5 shadow-card">
              <span className="text-primary text-lg leading-none mt-0.5">✓</span>
              <p className="text-sm text-gray-700">{o}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Récompenses ── */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Compétition finale</h2>
        <p className="text-sm text-gray-500 mb-6">
          Le bootcamp se conclut par une compétition par équipes, récompensée par trois prix.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {AWARDS.map((a) => (
            <div key={a.title} className="bg-surface border border-gray-200 rounded-2xl p-6 text-center shadow-card">
              <div className="text-4xl mb-3">{a.icon}</div>
              <p className="text-sm font-semibold text-gray-900">{a.title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Témoignage ── */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <blockquote className="relative bg-gradient-to-br from-navy to-primary-dark rounded-2xl p-8 text-white shadow-lg">
          <p className="text-lg leading-relaxed mb-4">
            « J'ai découvert les fondamentaux de la data science, le code en Python et les multiples phases d'un
            projet data de bout en bout — une compréhension complète de la data science, du machine learning et
            de l'IA. »
          </p>
          <footer className="text-sm text-white/70">— Un·e participant·e du Data Bootcamp</footer>
        </blockquote>
      </section>

      {/* ── Organisateurs ── */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Organisé par</h2>
        <p className="text-gray-600 leading-relaxed">
          <strong>Hi! PARIS</strong> est un centre interdisciplinaire créé en 2020 par HEC Paris et l'Institut
          Polytechnique de Paris, rejoint par Inria en 2021. Il fédère la recherche et la formation en Intelligence
          Artificielle et en Data Science.
        </p>
      </section>

      {/* ── CTA final / contact ── */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 md:p-10 shadow-card flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Prêt·e à vous lancer ?</h2>
            <p className="text-sm text-gray-500">
              Consultez les cours du bootcamp ou contactez l'équipe Hi! PARIS.
            </p>
            <p className="text-sm text-gray-400 mt-2">
              📞 +33 (0)1 75 31 92 03 · ✉️{" "}
              <a href="mailto:contact@hi-paris.fr" className="text-primary hover:underline">
                contact@hi-paris.fr
              </a>
            </p>
          </div>
          <Link
            href="/databootcamp/courses"
            className="shrink-0 bg-primary text-white px-7 py-3 rounded-xl font-semibold text-base hover:bg-primary-dark transition-colors shadow-sm text-center"
          >
            Liste des cours →
          </Link>
        </div>
      </section>
    </>
  );
}
