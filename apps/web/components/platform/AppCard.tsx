import Link from "next/link";
import { clsx } from "clsx";
import { Badge } from "@/components/ui/Badge";

interface AppCardProps {
  id: string;
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  school?: string | null;
  tags?: string[];
  className?: string;
}

export function AppCard({
  id,
  title,
  description,
  thumbnail_url,
  school,
  tags = [],
  className,
}: AppCardProps) {
  return (
    <Link
      href={`/apps/${id}`}
      className={clsx(
        "group bg-gray-900 border border-white/10 rounded-xl overflow-hidden hover:border-primary/40 hover:bg-gray-800 transition-all block",
        className
      )}
    >
      {thumbnail_url ? (
        <div className="h-32 overflow-hidden">
          <img src={thumbnail_url} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      ) : (
        <div className="h-32 bg-gradient-to-br from-white/5 to-white/0 flex items-center justify-center text-4xl">⚡</div>
      )}
      <div className="p-4">
        <h3 className="font-semibold text-white text-sm leading-snug group-hover:text-primary transition-colors mb-1.5 line-clamp-1">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">{description}</p>
        )}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.slice(0, 3).map((t) => (
              <Badge key={t} variant="ghost">{t}</Badge>
            ))}
          </div>
        )}
        {school && (
          <div className="text-xs text-gray-600 border-t border-white/5 pt-2.5">{school}</div>
        )}
      </div>
    </Link>
  );
}
