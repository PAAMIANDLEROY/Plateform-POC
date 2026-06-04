"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { useAuth } from "@/lib/auth";
import { Avatar } from "@/components/ui/Avatar";
import { useState } from "react";

const links = [
  { href: "/insights", label: "Insights" },
  { href: "/tube", label: "Hi! Tube" },
  { href: "/courses", label: "Hi! Course" },
  { href: "/moocs", label: "Hi! MOOC" },
  { href: "/apps", label: "Hi! App" },
];

const teacherLinks = [
  { href: "/studio", label: "Studio" },
  { href: "/lms", label: "LMS" },
];

const roleVariant: Record<string, string> = {
  admin:     "bg-danger text-white",
  superuser: "bg-purple-600 text-white",
  teacher:   "bg-primary text-white",
  student:   "bg-white/10 text-gray-300",
  public:    "bg-white/10 text-gray-300",
};

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const visibleTeacherLinks =
    user && ["teacher", "admin", "superuser"].includes(user.role) ? teacherLinks : [];

  const allLinks = [...links, ...visibleTeacherLinks];

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <header className="bg-black border-b border-white/10 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-6">
        <Link href="/dashboard" className="text-xl font-bold text-white shrink-0 tracking-tight">
          Hi! <span className="text-primary">Platform</span>
        </Link>

        <nav className="flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-hide">
          {allLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap",
                pathname.startsWith(l.href)
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {user ? (
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            >
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-white leading-none">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
              </div>
              <Avatar name={`${user.first_name} ${user.last_name}`} size="sm" />
              <span className={clsx("text-xs font-semibold px-2 py-0.5 rounded-full hidden sm:inline", roleVariant[user.role] ?? roleVariant.student)}>
                {user.role}
              </span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                >
                  Mon profil
                </Link>
                <Link
                  href="/courses?mine=1"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                >
                  Mes cours
                </Link>
                <div className="border-t border-white/10" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-sm text-danger hover:bg-danger/10 transition-colors"
                >
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="shrink-0 text-sm font-semibold bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
          >
            Connexion
          </Link>
        )}
      </div>
    </header>
  );
}
