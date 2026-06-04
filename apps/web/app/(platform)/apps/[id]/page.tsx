import Link from "next/link";
import { MOCK_APPS } from "@/lib/mock";
import { Badge } from "@/components/ui/Badge";

export function generateStaticParams() {
  return MOCK_APPS.map((a) => ({ id: a.id }));
}

export default function AppPage({ params }: { params: { id: string } }) {
  const app = MOCK_APPS.find((a) => a.id === params.id) ?? MOCK_APPS[0];
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <Link href="/learning-ai/apps" className="text-sm text-gray-500 hover:text-white mb-6 inline-block">
        ← Retour aux apps
      </Link>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 sticky top-24">
            <div className="h-20 bg-gradient-to-br from-primary/20 to-transparent flex items-center justify-center rounded-xl mb-4 text-4xl">⚡</div>
            <h1 className="text-lg font-bold text-white mb-1">{app.title}</h1>
            <p className="text-xs text-gray-500 mb-4">{app.description}</p>
            <div className="flex flex-wrap gap-1 mb-4">
              {app.tags.map((t) => <Badge key={t} variant="ghost">{t}</Badge>)}
            </div>
            <div className="text-xs text-gray-600 mb-5">{app.school}</div>
            <a href={app.url} target="_blank" rel="noopener noreferrer"
              className="block w-full text-center bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors">
              Ouvrir en plein écran ↗
            </a>
          </div>
        </div>
        <div className="lg:col-span-3">
          <div className="bg-gray-900 border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span className="w-3 h-3 bg-green-500 rounded-full" />
              </div>
              <span className="text-xs text-gray-500 flex-1 text-center truncate">{app.url}</span>
            </div>
            <iframe src={app.url} title={app.title} className="w-full"
              style={{ height: "75vh" }}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
          </div>
        </div>
      </div>
    </div>
  );
}
