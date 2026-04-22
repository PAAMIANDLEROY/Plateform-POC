"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { MOCK_USER } from "@/lib/mock";

const links = [
  { href: "/tube", label: "Hi! Tube" },
  { href: "/courses", label: "Hi! Course" },
  { href: "/moocs", label: "Hi! MOOC" },
  { href: "/apps", label: "Hi! App" },
  { href: "/studio", label: "Studio" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-6">
        <Link href="/dashboard" className="text-xl font-bold text-primary shrink-0">
          Hi! Platform
        </Link>
        <nav className="flex items-center gap-1 flex-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                pathname.startsWith(l.href)
                  ? "bg-primary/10 text-primary"
                  : "text-text-muted hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm text-text-muted hidden sm:block">
            {MOCK_USER.first_name} {MOCK_USER.last_name}
          </span>
          <span className="text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">
            {MOCK_USER.role}
          </span>
        </div>
      </div>
    </header>
  );
}
