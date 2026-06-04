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
  primary: "bg-primary/15 text-primary border border-primary/20",
  danger:  "bg-danger/15 text-danger border border-danger/20",
  success: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  warning: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  neutral: "bg-white/10 text-gray-300 border border-white/10",
  ghost:   "bg-white/5 text-gray-400 border border-white/5",
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
