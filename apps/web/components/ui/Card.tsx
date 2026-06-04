import { clsx } from "clsx";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddings = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export function Card({ children, className, hover = false, padding = "md" }: CardProps) {
  return (
    <div
      className={clsx(
        "bg-gray-900 border border-white/10 rounded-xl",
        hover && "hover:border-white/20 hover:bg-gray-800 transition-all",
        paddings[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
