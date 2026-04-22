"use client";

import { clsx } from "clsx";
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "danger";
  loading?: boolean;
}

export function Button({ variant = "primary", loading = false, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        "w-full px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed",
        {
          "bg-primary text-white hover:bg-primary-dark focus:ring-primary": variant === "primary",
          "border border-primary text-primary hover:bg-primary/5 focus:ring-primary": variant === "outline",
          "bg-danger text-white hover:bg-danger-dark focus:ring-danger": variant === "danger",
        },
        className
      )}
      {...props}
    >
      {loading ? <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : children}
    </button>
  );
}
