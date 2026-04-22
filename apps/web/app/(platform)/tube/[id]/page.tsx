import Link from "next/link";
import { MOCK_VIDEOS } from "@/lib/mock";

export function generateStaticParams() {
  return MOCK_VIDEOS.map((v) => ({ id: v.id }));
}

export default function VideoPage({ params }: { params: { id: string } }) {
  const video = MOCK_VIDEOS.find((v) => v.id === params.id) ?? MOCK_VIDEOS[0];
  const related = MOCK_VIDEOS.filter((v) => v.id !== video.id && v.category === video.category).slice(0, 3);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden mb-6">
          <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
        </div>
        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{video.category}</span>
        <h1 className="text-xl font-bold text-gray-900 mt-3 mb-2">{video.title}</h1>
        <div className="flex items-center gap-3 text-sm text-text-muted">
          <span>{video.school}</span>
          <span>·</span>
          <span>{video.duration}</span>
          <span>·</span>
          <span>{video.views.toLocaleString()} vues</span>
        </div>
        <div className="mt-6 p-4 bg-white rounded-xl border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-2">Description</h2>
          <p className="text-sm text-text-muted">
            Cette vidéo couvre les concepts fondamentaux de {video.title.toLowerCase()}.
            Elle s'adresse aux étudiants souhaitant approfondir leurs connaissances dans ce domaine.
          </p>
        </div>
      </div>

      <div>
        <h2 className="font-semibold text-gray-900 mb-4">Vidéos similaires</h2>
        <div className="flex flex-col gap-4">
          {(related.length ? related : MOCK_VIDEOS.slice(0, 3)).map((v) => (
            <Link key={v.id} href={`/tube/${v.id}`} className="flex gap-3 group">
              <div className="w-32 aspect-video rounded-lg overflow-hidden shrink-0 bg-gray-100">
                <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors leading-snug">
                  {v.title}
                </p>
                <p className="text-xs text-text-muted mt-1">{v.duration}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
