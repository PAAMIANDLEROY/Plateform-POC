import Link from "next/link";
import { clsx } from "clsx";
import { Badge } from "@/components/ui/Badge";

interface CourseCardProps {
  id: string;
  title: string;
  description?: string | null;
  cover_url?: string | null;
  category?: string | null;
  level?: string;
  school?: string | null;
  estimated_duration_minutes?: number;
  status?: string;
  tags?: string[];
  className?: string;
}

const levelVariant: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  beginner:     "success",
  intermediate: "warning",
  advanced:     "danger",
};

const levelLabel: Record<string, string> = {
  beginner:     "Débutant",
  intermediate: "Intermédiaire",
  advanced:     "Avancé",
};

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m}min` : `${h}h`;
}

export function CourseCard({
  id,
  title,
  description,
  cover_url,
  category,
  level = "beginner",
  school,
  estimated_duration_minutes = 0,
  status,
  tags = [],
  className,
}: CourseCardProps) {
  return (
    <Link
      href={`/courses/${id}`}
      className={clsx(
        "group bg-gray-900 border border-white/10 rounded-xl overflow-hidden hover:border-primary/40 hover:bg-gray-800 transition-all block",
        className
      )}
    >
      {cover_url && (
        <div className="h-36 overflow-hidden">
          <img
            src={cover_url}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {category && <Badge variant="primary">{category}</Badge>}
          <Badge variant={levelVariant[level] ?? "neutral"}>{levelLabel[level] ?? level}</Badge>
          {status === "draft" && <Badge variant="warning">Brouillon</Badge>}
        </div>
        <h3 className="font-semibold text-white text-sm leading-snug group-hover:text-primary transition-colors mb-1.5 line-clamp-2">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-4">{description}</p>
        )}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.slice(0, 2).map((t) => (
              <Badge key={t} variant="ghost">{t}</Badge>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-gray-500 border-t border-white/5 pt-3">
          {school && <span>{school}</span>}
          {school && estimated_duration_minutes > 0 && <span>·</span>}
          {estimated_duration_minutes > 0 && <span>{formatDuration(estimated_duration_minutes)}</span>}
        </div>
      </div>
    </Link>
  );
}
