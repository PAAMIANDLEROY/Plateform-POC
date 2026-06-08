import Link from "next/link";
import { clsx } from "clsx";
import { Badge } from "@/components/ui/Badge";

interface MOOCCardProps {
  id: string;
  title: string;
  description?: string | null;
  cover_url?: string | null;
  school?: string | null;
  enrolled_count?: number;
  modules_count?: number;
  is_linear?: boolean;
  className?: string;
}

export function MOOCCard({
  id,
  title,
  description,
  cover_url,
  school,
  enrolled_count = 0,
  modules_count = 0,
  is_linear = true,
  className,
}: MOOCCardProps) {
  return (
    <Link
      href={`/moocs/${id}`}
      className={clsx(
        "group bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-card-hover transition-all block shadow-card",
        className
      )}
    >
      {cover_url ? (
        <div className="h-36 overflow-hidden">
          <img src={cover_url} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      ) : (
        <div className="h-28 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-5xl">🎓</div>
      )}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="primary">MOOC</Badge>
          {is_linear && <Badge variant="neutral">Linéaire</Badge>}
        </div>
        <h3 className="font-semibold text-gray-900 text-sm leading-snug group-hover:text-primary transition-colors mb-1.5 line-clamp-2">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-4">{description}</p>
        )}
        <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-3">
          <span>{school ?? ""}</span>
          <span>{enrolled_count.toLocaleString("fr-FR")} inscrits · {modules_count} modules</span>
        </div>
      </div>
    </Link>
  );
}
