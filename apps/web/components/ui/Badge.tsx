import { clsx } from "clsx";

type BadgeVariant = "primary" | "danger" | "success" | "warning" | "neutral" | "ghost";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  primary: "bg-primary/10 text-primary border border-primary/20",
  danger:  "bg-danger/10 text-danger border border-danger/20",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border border-amber-200",
  neutral: "bg-gray-100 text-gray-600 border border-gray-200",
  ghost:   "bg-gray-50 text-gray-500 border border-gray-100",
};

const sizes: Record<BadgeSize, string> = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-3 py-1",
};

export function Badge({ children, variant = "neutral", size = "sm", className }: BadgeProps) {
  return (
    <span className={clsx("inline-flex items-center font-medium rounded-full", variants[variant], sizes[size], className)}>
      {children}
    </span>
  );
}
