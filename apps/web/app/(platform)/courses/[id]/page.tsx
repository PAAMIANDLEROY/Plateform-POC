import Link from "next/link";
import { MOCK_COURSES } from "@/lib/mock";

export function generateStaticParams() {
  return MOCK_COURSES.map((c) => ({ id: c.id }));
}

const MOCK_BLOCKS = [
  { type: "heading", content: "Introduction" },
  { type: "text", content: "Ce cours couvre les concepts fondamentaux nécessaires pour comprendre ce domaine en profondeur." },
  { type: "markdown", content: "```python\nimport numpy as np\nimport pandas as pd\n\ndf = pd.read_csv('data.csv')\nprint(df.head())\n```" },
  { type: "quiz", content: "Quelle bibliothèque Python est utilisée pour la manipulation de données tabulaires ?", options: ["NumPy", "Pandas", "Matplotlib", "Scikit-learn"], answer: 1 },
  { type: "heading", content: "Concepts avancés" },
  { type: "text", content: "Dans cette section, nous approfondissons les notions vues précédemment avec des exemples concrets." },
];

export default function CoursePage({ params }: { params: { id: string } }) {
  const course = MOCK_COURSES.find((c) => c.id === params.id) ?? MOCK_COURSES[0];

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/courses" className="text-sm text-text-muted hover:text-primary transition-colors mb-6 inline-block">
        ← Retour au catalogue
      </Link>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
        <div className="h-40 bg-gradient-to-r from-primary to-primary-light flex items-end p-6">
          <div>
            <span className="text-xs font-medium bg-white/20 text-white px-2 py-0.5 rounded-full">{course.category}</span>
            <h1 className="text-2xl font-bold text-white mt-2">{course.title}</h1>
          </div>
        </div>
        <div className="p-6 flex items-center gap-6 text-sm text-text-muted border-b border-gray-100">
          <span>🏫 {course.school}</span>
          <span>⏱ {Math.floor(course.duration / 60)}h{course.duration % 60 > 0 ? `${course.duration % 60}min` : ""}</span>
          <span>📦 {course.blocks} blocs</span>
          <span>📊 {course.level}</span>
        </div>
        <div className="p-6">
          <p className="text-text-muted">{course.description}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {MOCK_BLOCKS.map((block, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            {block.type === "heading" && (
              <h2 className="text-lg font-bold text-gray-900">{block.content}</h2>
            )}
            {block.type === "text" && (
              <p className="text-gray-700">{block.content}</p>
            )}
            {block.type === "markdown" && (
              <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-sm overflow-x-auto font-mono">
                {block.content}
              </pre>
            )}
            {block.type === "quiz" && (
              <div>
                <p className="font-semibold text-gray-900 mb-3">❓ {block.content}</p>
                <div className="flex flex-col gap-2">
                  {block.options?.map((opt, j) => (
                    <button
                      key={j}
                      className={`text-left px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                        j === block.answer
                          ? "border-green-400 bg-green-50 text-green-800"
                          : "border-gray-200 hover:border-primary hover:bg-primary/5"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
