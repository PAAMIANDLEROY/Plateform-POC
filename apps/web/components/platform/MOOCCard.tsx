import Link from "next/link";
import { clsx } from "clsx";

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
        "group bg-white border border-primary/15 rounded-2xl overflow-hidden flex flex-col",
        "hover:border-primary/40 hover:shadow-card-hover transition-all shadow-card",
        className
      )}
    >
      {/* Image / placeholder */}
      {cover_url ? (
        <div className="h-44 overflow-hidden">
          <img src={cover_url} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      ) : (
        <div className="h-44 bg-gradient-to-br from-primary/10 via-primary/6 to-primary/3 flex items-center justify-center">
          <span className="text-5xl">🎓</span>
        </div>
      )}

      {/* Corps */}
      <div className="p-5 flex flex-col flex-1">
        {/* Label type */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-primary/70">
            Parcours{is_linear ? " · Linéaire" : ""}
          </span>
        </div>

        <h3 className="font-bold text-gray-900 text-sm leading-snug group-hover:text-primary transition-colors mb-2 line-clamp-2">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-4">{description}</p>
        )}

        {/* Pied */}
        <div className="mt-auto flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-3">
          <span>{school ?? ""}</span>
          <span>{enrolled_count.toLocaleString("fr-FR")} inscrits · {modules_count} modules</span>
        </div>
      </div>
    </Link>
  );
}
