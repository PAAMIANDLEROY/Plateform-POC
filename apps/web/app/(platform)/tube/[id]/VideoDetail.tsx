"use client";

import { useState } from "react";
import Link from "next/link";
import { MOCK_VIDEOS } from "@/lib/mock";

type Video = (typeof MOCK_VIDEOS)[number];

interface Comment {
  id: string;
  author: string;
  initials: string;
  role: string;
  text: string;
  date: string;
  likes: number;
  liked: boolean;
}

const DEFAULT_COMMENTS: Comment[] = [
  {
    id: "1",
    author: "Sophie Laurent",
    initials: "SL",
    role: "Étudiante M2",
    text: "Contenu excellent, très bien structuré. J'ai enfin compris les concepts fondamentaux après plusieurs tentatives !",
    date: "10 avril 2026",
    likes: 14,
    liked: false,
  },
  {
    id: "2",
    author: "Martin Dubois",
    initials: "MD",
    role: "Doctorant",
    text: "La progression pédagogique est parfaite pour les débutants. Je recommande vivement à tous mes collègues.",
    date: "12 avril 2026",
    likes: 8,
    liked: false,
  },
  {
    id: "3",
    author: "Aïcha Koné",
    initials: "AK",
    role: "Étudiante M1",
    text: "Super contenu ! Serait-il possible d'ajouter des exercices pratiques à la fin ? Ce serait un vrai plus pour consolider les acquis.",
    date: "15 avril 2026",
    likes: 5,
    liked: false,
  },
];

function StarRating({ initialRating, count }: { initialRating: number; count: number }) {
  const [userRating, setUserRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [voted, setVoted] = useState(false);

  const display = hover || userRating || initialRating;
  const displayCount = count + (voted ? 1 : 0);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => { setUserRating(star); setVoted(true); }}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="text-2xl transition-transform hover:scale-110 focus:outline-none"
            >
              <span className={star <= Math.round(display) ? "text-yellow-400" : "text-gray-700"}>★</span>
            </button>
          ))}
        </div>
        <span className="text-xl font-bold text-yellow-400">
          {(userRating || initialRating).toFixed(1)}
        </span>
        <span className="text-sm text-gray-500">/ 5 · {displayCount} avis</span>
      </div>
      {voted ? (
        <p className="text-sm text-green-400">Merci pour votre note {userRating}/5 !</p>
      ) : (
        <p className="text-xs text-gray-600">Cliquez sur une étoile pour noter cette vidéo</p>
      )}
    </div>
  );
}

export function VideoDetail({ video, related }: { video: Video; related: Video[] }) {
  const [comments, setComments] = useState<Comment[]>(DEFAULT_COMMENTS);
  const [newComment, setNewComment] = useState("");
  const [authorName, setAuthorName] = useState("");

  function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    const name = authorName.trim() || "Anonyme";
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    setComments([
      ...comments,
      {
        id: Date.now().toString(),
        author: name,
        initials,
        role: "Étudiant·e",
        text: newComment.trim(),
        date: new Date().toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        likes: 0,
        liked: false,
      },
    ]);
    setNewComment("");
    setAuthorName("");
  }

  function toggleLike(id: string) {
    setComments(
      comments.map((c) =>
        c.id === id
          ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 }
          : c
      )
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 bg-navy min-h-screen">
      <Link
        href="/tube"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8"
      >
        ← Retour à Hi! Tube
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* ── Colonne principale ── */}
        <div className="lg:col-span-2 flex flex-col gap-8">

          {/* Lecteur vidéo */}
          <div className="aspect-video w-full rounded-2xl overflow-hidden bg-gray-900 border border-white/10 shadow-2xl">
            <iframe
              src={`https://www.youtube.com/embed/${video.youtubeId}?rel=0&modestbranding=1`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full"
            />
          </div>

          {/* Titre + méta */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs font-medium text-primary bg-primary/15 px-2.5 py-0.5 rounded-full">
                {video.category}
              </span>
              {video.tags.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="text-xs bg-white/5 border border-white/10 text-gray-400 px-2.5 py-0.5 rounded-full"
                >
                  {t}
                </span>
              ))}
            </div>
            <h1 className="text-2xl font-extrabold text-white mb-3 leading-tight">
              {video.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 pb-5 border-b border-white/10">
              <span className="font-medium text-gray-300">{video.school}</span>
              <span>·</span>
              <span>{video.duration}</span>
              <span>·</span>
              <span>{video.views.toLocaleString()} vues</span>
            </div>
          </div>

          {/* Satisfaction */}
          <div className="bg-gray-900 border border-white/10 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
              Votre avis
            </h2>
            <StarRating initialRating={video.rating} count={video.ratingsCount} />
          </div>

          {/* Description */}
          <div>
            <h2 className="text-base font-bold text-white mb-3">À propos de cette vidéo</h2>
            <p className="text-gray-400 leading-relaxed text-sm">{video.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-4">
              {video.tags.map((t) => (
                <span
                  key={t}
                  className="text-xs bg-white/5 border border-white/10 text-gray-400 px-3 py-1 rounded-full"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Commentaires */}
          <div>
            <h2 className="text-lg font-bold text-white mb-6">
              Commentaires{" "}
              <span className="text-sm font-normal text-gray-500">({comments.length})</span>
            </h2>

            {/* Formulaire */}
            <form
              onSubmit={submitComment}
              className="mb-8 bg-gray-900 border border-white/10 rounded-xl p-5 flex flex-col gap-3"
            >
              <input
                type="text"
                placeholder="Votre nom (optionnel)"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="bg-gray-800 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
              />
              <textarea
                placeholder="Partagez votre avis sur cette vidéo..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                className="bg-gray-800 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Publier
                </button>
              </div>
            </form>

            {/* Liste des commentaires */}
            <div className="flex flex-col gap-6">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-4">
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {c.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-white">{c.author}</span>
                      <span className="text-xs text-gray-600">{c.role}</span>
                      <span className="text-xs text-gray-700 ml-auto">{c.date}</span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed mb-2">{c.text}</p>
                    <button
                      onClick={() => toggleLike(c.id)}
                      className={`flex items-center gap-1.5 text-xs transition-colors ${
                        c.liked ? "text-primary" : "text-gray-600 hover:text-gray-400"
                      }`}
                    >
                      <span>👍</span>
                      <span>{c.likes} utile{c.likes !== 1 ? "s" : ""}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
              Vidéos similaires
            </h2>
            <div className="flex flex-col gap-3">
              {related.map((v) => (
                <Link
                  key={v.id}
                  href={`/tube/${v.id}`}
                  className="group flex gap-3 bg-gray-900 border border-white/10 rounded-xl overflow-hidden hover:border-white/30 transition-all"
                >
                  <div className="w-28 shrink-0 overflow-hidden" style={{ aspectRatio: "16/9" }}>
                    <img
                      src={v.thumbnail}
                      alt={v.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3 flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">{v.category}</p>
                    <p className="text-sm font-semibold text-white line-clamp-2 leading-snug group-hover:text-gray-300 transition-colors">
                      {v.title}
                    </p>
                    <div className="flex items-center gap-0.5 mt-1.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span
                          key={s}
                          className={`text-xs ${s <= Math.round(v.rating) ? "text-yellow-400" : "text-gray-700"}`}
                        >
                          ★
                        </span>
                      ))}
                      <span className="text-xs text-gray-600 ml-1">{v.rating.toFixed(1)}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {v.duration} · {v.views.toLocaleString()} vues
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
