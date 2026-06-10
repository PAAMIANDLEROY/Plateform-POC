"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { videosApi } from "@/lib/api";
import type { VideoResponse } from "@/lib/api";

type Comment = { id: string; author: string; content: string; createdAt: string };

function fmtDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function VideoPageClient({ id }: { id: string }) {
  const [video,   setVideo]   = useState<VideoResponse | null>(null);
  const [related, setRelated] = useState<VideoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([
    { id: "1", author: "Alice M.", content: "Excellente introduction, très claire !", createdAt: "il y a 2 jours" },
    { id: "2", author: "Thomas B.", content: "La partie sur la rétropropagation mériterait d'être développée.", createdAt: "il y a 5 jours" },
  ]);
  const [watched, setWatched] = useState(0);

  useEffect(() => {
    setLoading(true);
    videosApi.get(id)
      .then(async (v) => {
        setVideo(v);
        // Fetch related videos from same category
        if (v.category) {
          const all = await videosApi.list({ category: v.category });
          setRelated(all.filter(r => r.id !== id).slice(0, 4));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setComments(c => [{ id: Date.now().toString(), author: "Moi", content: comment, createdAt: "à l'instant" }, ...c]);
    setComment("");
  }

  if (loading) return (
    <div className="max-w-7xl mx-auto px-6 py-16 text-center text-gray-400">Chargement…</div>
  );

  if (!video) return (
    <div className="max-w-7xl mx-auto px-6 py-16 text-center">
      <p className="text-gray-400 mb-4">Vidéo introuvable.</p>
      <Link href="/learning-ai/tube" className="text-primary text-sm">← Retour aux vidéos</Link>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Main content ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Player */}
          <div className="bg-black rounded-2xl overflow-hidden border border-white/10">
            {video.youtube_id ? (
              <div className="relative" style={{ aspectRatio: "16/9" }}>
                <iframe
                  src={`https://www.youtube.com/embed/${video.youtube_id}?rel=0&modestbranding=1`}
                  title={video.title}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            ) : video.url ? (
              <div className="relative" style={{ aspectRatio: "16/9" }}>
                <video src={video.url} controls className="w-full h-full" />
              </div>
            ) : (
              <div className="aspect-video bg-gray-900 flex items-center justify-center">
                <span className="text-6xl">▶</span>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {video.category && <Badge variant="primary">{video.category}</Badge>}
              {video.tags.slice(0, 3).map(t => <Badge key={t} variant="ghost">{t}</Badge>)}
            </div>
            <h1 className="text-2xl font-extrabold text-white leading-snug mb-2">{video.title}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
              {video.school && <><span>{video.school}</span><span>·</span></>}
              <span>{video.view_count.toLocaleString("fr-FR")} vues</span>
              {video.duration_seconds > 0 && <><span>·</span><span>{fmtDuration(video.duration_seconds)}</span></>}
            </div>
          </div>

          {/* Description */}
          {video.description && (
            <div className="bg-gray-900 border border-white/10 rounded-xl p-5">
              <p className="text-sm text-gray-300 leading-relaxed">{video.description}</p>
            </div>
          )}

          {/* Progress */}
          <div className="bg-gray-900 border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-white">Ma progression</p>
              <span className="text-xs text-gray-500">{watched}% visionné</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${watched}%` }} />
            </div>
            <div className="flex gap-2">
              {[25, 50, 75, 100].map(p => (
                <button key={p} onClick={() => setWatched(p)}
                  className={`text-xs px-3 py-1 rounded-lg border transition-all ${
                    watched >= p ? "border-primary text-primary" : "border-white/10 text-gray-400 hover:border-primary/50"
                  }`}>
                  {p === 100 ? "Terminé ✓" : `${p}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div>
            <h2 className="text-lg font-bold text-white mb-4">
              {comments.length} commentaire{comments.length > 1 ? "s" : ""}
            </h2>
            <form onSubmit={submitComment} className="flex gap-3 mb-6">
              <input value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Ajouter un commentaire..."
                className="flex-1 bg-gray-900 border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-primary transition-all placeholder-gray-600" />
              <button type="submit" disabled={!comment.trim()}
                className="bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-40">
                Envoyer
              </button>
            </form>
            <div className="space-y-4">
              {comments.map(c => (
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

        {/* ── Sidebar: related videos ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Vidéos similaires</h2>
            <Link href="/learning-ai/tube" className="text-xs text-primary">Voir tout →</Link>
          </div>
          {related.length === 0 ? (
            <p className="text-xs text-gray-600">Aucune vidéo similaire.</p>
          ) : related.map(v => (
            <Link key={v.id} href={`/tube/${v.id}`}
              className="flex gap-3 group hover:bg-white/5 rounded-xl p-2 -m-2 transition-all">
              <div className="relative w-32 shrink-0 rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
                {v.thumbnail_url
                  ? <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  : <div className="w-full h-full bg-gray-800 flex items-center justify-center text-2xl">▶</div>
                }
                {v.duration_seconds > 0 && (
                  <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded font-mono">
                    {fmtDuration(v.duration_seconds)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white group-hover:text-primary transition-colors line-clamp-2 leading-snug">{v.title}</p>
                {v.school && <p className="text-xs text-gray-500 mt-1">{v.school}</p>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
