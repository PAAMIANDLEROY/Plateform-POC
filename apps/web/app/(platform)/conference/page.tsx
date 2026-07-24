/**
 * @file (platform)/conference/page.tsx
 * @description Page « AIStuCon » — présentation de la conférence blog-post étudiante Hi! PARIS.
 *
 * Contenu statique (Server Component). Reprend la page « about » de la conférence
 * (format inspiré du ICLR Blogposts track : billets Markdown soumis par Pull Request GitHub,
 * relus, puis publiés). Rédigé en anglais, comme la conférence.
 *
 * NB : les liens « submission instructions » / « sample post » pointent vers le dépôt GitHub
 * de la conférence. TODO : les faire pointer vers le site al-folio de la conférence une fois en ligne.
 */

import Link from "next/link";

/** Dépôt GitHub de la conférence (canal de soumission). */
const REPO_URL = "https://github.com/hi-paris/NeuriX-hi-paris-Student-AI-Conference";

/** Dates clés de l'édition. */
const DATES = [
  { label: "Submission deadline", value: "30 Sep 2026" },
  { label: "Notification of acceptance", value: "31 Oct 2026" },
  { label: "Publication", value: "15 Nov 2026" },
];

/** Types de billets acceptés. */
const TOPICS = [
  <><strong className="text-gray-900">Explain and build intuition</strong> about an ML paper, method, or concept.</>,
  <><strong className="text-gray-900">Offer a fresh perspective</strong> or a comparison of existing techniques.</>,
  <><strong className="text-gray-900">Discuss an open issue</strong> in AI/ML (for example reproducibility, evaluation, or ethics).</>,
  <><strong className="text-gray-900">Analyze the societal impact</strong> of a recent AI advance.</>,
  <><strong className="text-gray-900">Share an idea you tried that didn&apos;t work</strong> — and what you learned from it.</>,
];

/**
 * Page de présentation de la conférence AIStuCon.
 */
export default function ConferencePage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative w-full overflow-hidden bg-navy">
        <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy to-primary/50" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-danger/20 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
        <div className="relative max-w-4xl mx-auto px-6 py-20">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-danger mb-5">
            <span className="w-6 h-px bg-danger" /> Hi! PARIS · Student AI Conference
          </p>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-none mb-6">
            AIStuCon<span className="text-danger">.</span>
          </h1>
          <p className="text-lg text-white/85 leading-relaxed max-w-2xl mb-4">
            Welcome! <strong className="text-white">AIStuCon</strong> is a student blog-post
            conference organized by Hi! PARIS. Instead of writing a traditional paper, you write a
            clear, technical <strong className="text-white">blog post in Markdown</strong>, submit it
            through a <strong className="text-white">GitHub Pull Request</strong>, and — once it&apos;s
            reviewed and accepted — see it <strong className="text-white">published right here on this
            website</strong>.
          </p>
          <p className="text-base text-white/60 leading-relaxed max-w-2xl">
            It&apos;s a friendly, hands-on way to deepen your understanding of AI/ML, practice writing
            about technical ideas, and share your work with a wider community.
          </p>
        </div>
      </section>

      {/* ── Key Dates ── */}
      <section className="max-w-4xl mx-auto px-6 py-14">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Dates</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {DATES.map((d) => (
            <div key={d.label} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-card">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5">{d.label}</p>
              <p className="text-2xl font-extrabold text-primary tabular-nums tracking-tight">{d.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Who Can Participate ── */}
      <section className="max-w-4xl mx-auto px-6 pb-14">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Who Can Participate</h2>
        <p className="text-gray-600 leading-relaxed mb-3">This conference is open to students.</p>
        <div className="bg-amber-50 border border-dashed border-amber-300 rounded-xl px-4 py-3">
          <p className="text-sm text-amber-900">
            <strong className="text-amber-700">TODO :</strong> confirm the eligibility details — which
            students can take part (e.g. Master&apos;s / PhD, specific institutions or open to all), the
            expected level, and whether posts may be written solo or in small teams.
          </p>
        </div>
      </section>

      {/* ── What to Write About ── */}
      <section className="max-w-4xl mx-auto px-6 pb-14">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">What to Write About</h2>
        <p className="text-gray-600 leading-relaxed mb-5">Your blog post can do any one of the following:</p>
        <ol className="flex flex-col gap-3">
          {TOPICS.map((node, i) => (
            <li
              key={i}
              className="relative flex items-start gap-4 bg-white border border-gray-200 rounded-xl p-4 shadow-card"
            >
              <span className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 text-primary font-extrabold text-sm flex items-center justify-center tabular-nums">
                {i + 1}
              </span>
              <span className="text-sm text-gray-700 leading-relaxed pt-1">{node}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* ── How to Submit ── */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Submit</h2>
        <div className="bg-gray-50 border border-gray-200 border-l-[3px] border-l-primary rounded-2xl p-6">
          <p className="text-gray-600 leading-relaxed mb-3">
            Everything happens on GitHub. You fork the repository, add your blog post in Markdown, and
            open a <strong className="text-gray-900">Pull Request</strong>. Your submission is then
            checked automatically for compliance and reviewed by the organizers; accepted posts are
            merged and published on this site.
          </p>
          <p className="text-gray-600 leading-relaxed">
            For a step-by-step guide, see the submission instructions, and take a look at the sample
            post to see the expected structure and formatting.
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <Link
              href="/conference/submission"
              className="inline-flex items-center gap-1.5 bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-primary-dark transition-colors"
            >
              Submission instructions
            </Link>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 border border-gray-300 text-primary text-sm font-semibold px-5 py-2.5 rounded-lg hover:border-primary transition-colors"
            >
              Sample post
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
