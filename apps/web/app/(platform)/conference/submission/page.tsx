/**
 * @file (platform)/conference/submission/page.tsx
 * @description Page « Submission Requirements » de la conférence AIStuCon.
 *
 * Explique, simplement, comment soumettre un billet de blog (inspiré des guidelines
 * du ICLR Blogposts track). Contenu statique (Server Component), en anglais.
 *
 * NB : les extraits de code Liquid / HTML (figure.liquid, <d-cite>) sont stockés dans
 * des constantes chaîne pour éviter que JSX interprète `{% %}` ou `<...>`.
 */

import Link from "next/link";

/** Classe utilitaire pour le code inline. */
const IC = "bg-gray-100 text-primary px-1.5 py-0.5 rounded text-[0.85em] font-mono";

/** Les trois fichiers d'exemple fournis dans le dépôt. */
const EXAMPLE_FILES = [
  "_posts/2026-04-28-my-blog-post.md",
  "assets/img/2026-04-28-my-blog-post/",
  "assets/bibliography/2026-04-28-my-blog-post.bib",
];

/** Tableau « structure des fichiers ». */
const FILE_ROWS = [
  ["Your post (Markdown)", "_posts/2026-04-28-your-post-name.md"],
  ["Your images", "assets/img/2026-04-28-your-post-name/"],
  ["Your references (BibTeX)", "assets/bibliography/2026-04-28-your-post-name.bib"],
];

/** Tableau « front matter ». */
const FRONTMATTER_ROWS: [string, React.ReactNode][] = [
  ["layout", <>Always <code className={IC}>distill</code>. Don&apos;t change it.</>],
  ["title", "The title of your post."],
  ["description", "A 2–3 sentence summary. No math, links, or images here."],
  ["date", "2026-04-28"],
  ["authors", <>Keep it as <code className={IC}>Anonymous</code> while your post is reviewed.</>],
  ["bibliography", <>The exact name of your <code className={IC}>.bib</code> file (e.g. <code className={IC}>2026-04-28-your-post-name.bib</code>).</>],
  ["toc", "The list of your section titles (for the table of contents)."],
];

/** Étapes de soumission. */
const STEPS: React.ReactNode[] = [
  "Create a new branch (or fork the repo).",
  "Add only your three files (post, images, bibliography).",
  <>Open a Pull Request whose title is <strong className="text-gray-900">exactly your post name</strong>, e.g. <code className={IC}>2026-04-28-your-post-name</code>.</>,
  <>An automatic check (<code className={IC}>filter-files</code>) verifies your files follow the rules. If something is wrong, a comment will tell you what to fix — just update your Pull Request.</>,
  "Once merged, your post is built and published automatically.",
];

/** Checklist finale. */
const CHECKLIST: React.ReactNode[] = [
  <>My <code className={IC}>.md</code>, image folder, and <code className={IC}>.bib</code> file all have the same name.</>,
  <>The name starts with a date, like <code className={IC}>2026-04-28-…</code></>,
  <>My front matter has <code className={IC}>title</code>, <code className={IC}>description</code>, <code className={IC}>date</code>, <code className={IC}>authors</code>, <code className={IC}>bibliography</code>, <code className={IC}>toc</code>.</>,
  <><code className={IC}>bibliography:</code> matches my <code className={IC}>.bib</code> file name exactly.</>,
  <>Every <code className={IC}>## Heading</code> is listed in <code className={IC}>toc:</code>.</>,
  <>My images are inside my <code className={IC}>assets/img/…</code> folder.</>,
  <>My citations use <code className={IC}>{`<d-cite key="…">`}</code> and exist in the <code className={IC}>.bib</code> file.</>,
  "My Pull Request title matches my post name.",
  "I only added files that belong to my post.",
];

const FIGURE_SNIPPET = `{% include figure.liquid
   path="assets/img/2026-04-28-your-post-name/your-image.png"
   caption="Your caption." %}`;

const CITE_SNIPPET = `<d-cite key="the-reference-key"></d-cite>`;

/** Petit en-tête de section numéroté. */
function SectionHeader({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 text-primary font-extrabold text-sm flex items-center justify-center tabular-nums">
        {n}
      </span>
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
    </div>
  );
}

/** Bloc de code (affichage statique, fond sombre). */
function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-gray-950 text-emerald-300 font-mono text-sm rounded-xl p-4 overflow-x-auto my-3 whitespace-pre">
      {children}
    </pre>
  );
}

/**
 * Page « Submission Requirements ».
 */
export default function SubmissionRequirementsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* En-tête */}
      <nav className="text-sm text-gray-400 mb-3">
        <Link href="/conference" className="hover:text-primary transition-colors">AIStuCon</Link>
        <span className="mx-1">/</span> Submission Requirements
      </nav>
      <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">Submission Requirements</h1>
      <p className="text-gray-600 leading-relaxed mb-4">
        This page explains, in simple terms, how to submit a blog post. It is inspired by the ICLR
        Blogposts track guidelines. A ready-to-use example is already in the repo — start from these
        three files:
      </p>
      <ul className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-12 flex flex-col gap-1.5">
        {EXAMPLE_FILES.map((f) => (
          <li key={f}>
            <code className="text-sm font-mono text-primary break-all">{f}</code>
          </li>
        ))}
      </ul>

      {/* 1. File structure and naming */}
      <section className="mb-12">
        <SectionHeader n={1} title="File structure and naming" />
        <p className="text-sm font-semibold text-danger mb-4">The most important rule.</p>
        <p className="text-gray-600 leading-relaxed mb-4">
          Your submission is made of three things, and they all share the same name:
        </p>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-2.5 font-semibold text-gray-700 border-b border-gray-200">What</th>
                <th className="px-4 py-2.5 font-semibold text-gray-700 border-b border-gray-200">Where it goes</th>
              </tr>
            </thead>
            <tbody>
              {FILE_ROWS.map(([what, where]) => (
                <tr key={what} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-2.5 text-gray-700">{what}</td>
                  <td className="px-4 py-2.5"><code className="text-[0.85em] font-mono text-primary break-all">{where}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="font-semibold text-gray-900 mb-2">Rules</p>
        <ul className="list-disc pl-5 flex flex-col gap-2 text-sm text-gray-600 leading-relaxed">
          <li>The name must start with a date, like <code className={IC}>2026-04-28-</code>, followed by a short title with dashes instead of spaces (e.g. <code className={IC}>2026-04-28-my-cool-idea</code>).</li>
          <li>The <code className={IC}>.md</code> file, the image folder, and the <code className={IC}>.bib</code> file must all use the <strong className="text-gray-900">exact same name</strong>.</li>
          <li>Only add or change files that belong to your post. An automatic check will reject your submission if you touch anything else in the repo.</li>
        </ul>
      </section>

      {/* 2. Front matter */}
      <section className="mb-12">
        <SectionHeader n={2} title="Front matter (the top of your .md file)" />
        <p className="text-gray-600 leading-relaxed mb-4">
          Every post starts with a block between two <code className={IC}>---</code> lines. The
          important fields:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-2.5 font-semibold text-gray-700 border-b border-gray-200">Field</th>
                <th className="px-4 py-2.5 font-semibold text-gray-700 border-b border-gray-200">What to put</th>
              </tr>
            </thead>
            <tbody>
              {FRONTMATTER_ROWS.map(([field, what]) => (
                <tr key={field} className="border-b border-gray-100 last:border-0 align-top">
                  <td className="px-4 py-2.5"><code className="text-[0.85em] font-mono text-primary">{field}</code></td>
                  <td className="px-4 py-2.5 text-gray-600">{what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Writing your post */}
      <section className="mb-12">
        <SectionHeader n={3} title="Writing your post" />
        <ul className="list-disc pl-5 flex flex-col gap-2 text-sm text-gray-600 leading-relaxed mb-4">
          <li>Write in normal Markdown (headings, bold, lists, tables, code blocks…).</li>
          <li>Each main section uses a <code className={IC}>## Heading</code>, and that heading should also appear in the <code className={IC}>toc:</code> list so it shows in the table of contents.</li>
        </ul>
        <p className="font-semibold text-gray-900 mb-2">Images</p>
        <p className="text-sm text-gray-600 leading-relaxed mb-1">
          Put them in your <code className={IC}>assets/img/…</code> folder and include them with:
        </p>
        <CodeBlock>{FIGURE_SNIPPET}</CodeBlock>
        <p className="font-semibold text-gray-900 mb-2 mt-4">Citations</p>
        <p className="text-sm text-gray-600 leading-relaxed mb-1">
          Add the reference to your <code className={IC}>.bib</code> file, then cite it in the text with:
        </p>
        <CodeBlock>{CITE_SNIPPET}</CodeBlock>
        <p className="text-sm text-gray-500 leading-relaxed mt-1">The reference list is built automatically.</p>
        <p className="font-semibold text-gray-900 mb-2 mt-4">Math</p>
        <p className="text-sm text-gray-600 leading-relaxed">
          Use <code className={IC}>$$ … $$</code> for equations (LaTeX syntax).
        </p>
      </section>

      {/* 4. How to submit */}
      <section className="mb-12">
        <SectionHeader n={4} title="How to submit" />
        <ol className="flex flex-col gap-3">
          {STEPS.map((node, i) => (
            <li key={i} className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-4 shadow-card">
              <span className="shrink-0 w-6 h-6 rounded-md bg-primary/10 text-primary font-bold text-xs flex items-center justify-center tabular-nums mt-0.5">
                {i + 1}
              </span>
              <span className="text-sm text-gray-700 leading-relaxed">{node}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* 5. Do and Don't */}
      <section className="mb-12">
        <SectionHeader n={5} title="Do and Don't" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
            <p className="font-bold text-emerald-800 mb-3">Do</p>
            <ul className="flex flex-col gap-2 text-sm text-emerald-900">
              <li>✅ Keep the three names identical.</li>
              <li>✅ Cite your sources in the <code className="text-[0.85em] font-mono">.bib</code> file.</li>
              <li>✅ Keep your post readable and clear.</li>
            </ul>
          </div>
          <div className="bg-danger/5 border border-danger/20 rounded-xl p-5">
            <p className="font-bold text-danger-dark mb-3">Don&apos;t</p>
            <ul className="flex flex-col gap-2 text-sm text-gray-700">
              <li>❌ Edit files that are not part of your post.</li>
              <li>❌ Rename or change the layout.</li>
              <li>❌ Put links, images, or math in the description.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 6. Checklist */}
      <section className="mb-4">
        <SectionHeader n={6} title="Checklist before you submit" />
        <ul className="flex flex-col gap-2.5">
          {CHECKLIST.map((node, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-gray-700 leading-relaxed">
              <span className="shrink-0 w-5 h-5 mt-0.5 rounded border border-gray-300 bg-white" aria-hidden="true" />
              <span>{node}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Retour */}
      <div className="mt-12 pt-6 border-t border-gray-200">
        <Link href="/conference" className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors">
          ← Back to AIStuCon
        </Link>
      </div>
    </div>
  );
}
