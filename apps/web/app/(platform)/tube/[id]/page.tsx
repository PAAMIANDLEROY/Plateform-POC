"use client";

import { useState } from "react";
import Link from "next/link";
import { MOCK_VIDEOS } from "@/lib/mock";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";

type Comment = { id: string; author: string; content: string; createdAt: string };

export function generateStaticParams() {
  return MOCK_VIDEOS.map((v) => ({ id: v.id }));
}

export default function VideoPage({ params }: { params: { id: string } }) {
  const video = MOCK_VIDEOS.find((v) => v.id === params.id) ?? MOCK_VIDEOS[0];
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([
    { id: "1", author: "Alice M.", content: "Excellente introduction, très claire !", createdAt: "il y a 2 jours" },
    { id: "2", author: "Thomas B.", content: "La partie sur la rétropropagation mériterait d'être développée.", createdAt: "il y a 5 jours" },
  ]);
  const [watched, setWatched] = useState(0);

  const related = MOCK_VIDEOS.filter((v) => v.id !== params.id && v.category === video.category).slice(0, 4);

  function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setComments((c) => [{ id: Date.now().toString(), author: "Moi", content: comment, createdAt: "à l'instant" }, ...c]);
    setComment("");
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="lg:col-span-2 space-y-6">
          {/* Lecteur */}
          <div className="bg-black rounded-2xl overflow-hidden border border-white/10">
            {video.youtubeId ? (
              <div className="relative" style={{ aspectRatio: "16/9" }}>
                <iframe
                  src={`https://www.youtube.com/embed/${video.youtubeId}?rel=0&modestbranding=1`}
                  title={video.title}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            ) : (
              <div className="aspect-video bg-gray-900 flex items-center justify-center">
                <span className="text-6xl">▶</span>
              </div>
            )}
          </div>

          {/* Méta */}
          <div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Badge variant="primary">{video.category}</Badge>
              {video.tags.slice(0, 3).map((t) => <Badge key={t} variant="ghost">{t}</Badge>)}
            </div>
            <h1 className="text-2xl font-extrabold text-white leading-snug mb-2">{video.title}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
              <span>{video.school}</span>
              <span>·</span>
              <span>{video.views.toLocaleString("fr-FR")} vues</span>
              <span>·</span>
              <span>{video.duration}</span>
              <span>·</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className={`text-sm ${s <= Math.round(video.rating) ? "text-yellow-400" : "text-gray-700"}`}>★</span>
                ))}
                <span className="text-xs ml-1">{video.rating.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-gray-900 border border-white/10 rounded-xl p-5">
            <p className="text-sm text-gray-300 leading-relaxed">{video.description}</p>
          </div>

          {/* Progression */}
          <div className="bg-gray-900 border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-white">Ma progression</p>
              <span className="text-xs text-gray-500">{watched}% visionné</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${watched}%` }} />
            </div>
            <div className="flex gap-2">
              {[25, 50, 75, 100].map((p) => (
                <button key={p} onClick={() => setWatched(p)}
                  className={`text-xs px-3 py-1 rounded-lg border transition-all ${watched >= p ? "border-primary text-primary" : "border-white/10 text-gray-400 hover:border-primary/50"}`}>
                  {p === 100 ? "Terminé ✓" : `${p}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Commentaires */}
          <div>
            <h2 className="text-lg font-bold text-white mb-4">{comments.length} commentaire{comments.length > 1 ? "s" : ""}</h2>
            <form onSubmit={submitComment} className="flex gap-3 mb-6">
              <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Ajouter un commentaire..."
                className="flex-1 bg-gray-900 border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-primary transition-all placeholder-gray-600" />
              <button type="submit" disabled={!comment.trim()}
                className="bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-40">
                Envoyer
              </button>
            </form>
            <div className="space-y-4">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <Avatar name={c.author} size="sm" />
                  <div className="flex-1 bg-gray-900 border border-white/5 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-white">{c.author}</span>
                      <span className="text-xs text-gray-600">{c.createdAt}</span>
                    </div>
                    <p className="text-sm text-gray-300">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Vidéos similaires</h2>
            <Link href="/learning-ai/tube" className="text-xs text-primary">Voir tout →</Link>
          </div>
          {related.map((v) => (
            <Link key={v.id} href={`/tube/${v.id}`} className="flex gap-3 group hover:bg-white/5 rounded-xl p-2 -m-2 transition-all">
              <div className="relative w-32 shrink-0 rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
                <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded font-mono">{v.duration}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white group-hover:text-primary transition-colors line-clamp-2 leading-snug">{v.title}</p>
                <p className="text-xs text-gray-500 mt-1">{v.school}</p>
                <p className="text-xs text-gray-600">{v.views.toLocaleString("fr-FR")} vues</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
