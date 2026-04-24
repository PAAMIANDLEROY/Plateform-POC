"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { MOCK_USER } from "@/lib/mock";

const links = [
  { href: "/insights", label: "Insights" },
  { href: "/tube", label: "Hi! Tube" },
  { href: "/courses", label: "Hi! Course" },
  { href: "/moocs", label: "Hi! MOOC" },
  { href: "/apps", label: "Hi! App" },
  { href: "/studio", label: "Studio" },
  { href: "/lms", label: "LMS" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <header className="bg-black border-b border-white/10 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center gap-8">
        <Link href="/dashboard" className="text-2xl font-bold text-white shrink-0 tracking-tight">
          Hi! <span className="text-primary">Platform</span>
        </Link>
        <nav className="flex items-center gap-1 flex-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                "px-5 py-2.5 rounded-lg text-base font-semibold transition-all",
                pathname.startsWith(l.href)
                  ? "bg-primary text-white shadow-lg shadow-primary/30"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm text-gray-400 hidden sm:block">
            {MOCK_USER.first_name} {MOCK_USER.last_name}
          </span>
          <span className="text-xs bg-primary text-white font-medium px-3 py-1 rounded-full">
            {MOCK_USER.role}
          </span>
        </div>
      </div>
    </header>
  );
}
