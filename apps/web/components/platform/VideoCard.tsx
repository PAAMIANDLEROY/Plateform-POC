import Link from "next/link";
import { clsx } from "clsx";
import { Badge } from "@/components/ui/Badge";

interface VideoCardProps {
  id: string;
  title: string;
  thumbnail_url?: string | null;
  youtube_id?: string | null;
  category?: string | null;
  school?: string | null;
  tags?: string[];
  duration_seconds?: number;
  view_count?: number;
  className?: string;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function VideoCard({
  id,
  title,
  thumbnail_url,
  youtube_id,
  category,
  school,
  tags = [],
  duration_seconds = 0,
  view_count = 0,
  className,
}: VideoCardProps) {
  const thumb =
    thumbnail_url ??
    (youtube_id ? `https://img.youtube.com/vi/${youtube_id}/mqdefault.jpg` : null);

  return (
    <Link
      href={`/tube/${id}`}
      className={clsx(
        "group bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-card-hover transition-all block shadow-card",
        className
      )}
    >
      <div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
        {thumb ? (
          <img
            src={thumb}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-4xl text-gray-300">▶</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {duration_seconds > 0 && (
          <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded font-mono">
            {formatDuration(duration_seconds)}
          </span>
        )}
        {category && (
          <span className="absolute top-2 left-2 text-xs font-semibold bg-primary text-white px-2.5 py-0.5 rounded-full shadow-sm">
            {category}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug group-hover:text-primary transition-colors mb-2 line-clamp-2">
          {title}
        </h3>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.slice(0, 2).map((t) => (
              <Badge key={t} variant="ghost">{t}</Badge>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-2.5">
          <span>{school ?? ""}</span>
          <span>{view_count.toLocaleString("fr-FR")} vues</span>
        </div>
      </div>
    </Link>
  );
}
