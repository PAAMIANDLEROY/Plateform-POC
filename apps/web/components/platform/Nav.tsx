"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { useAuth } from "@/lib/auth";
import { Avatar } from "@/components/ui/Avatar";
import { useState, useRef, useEffect } from "react";

// ─── Structure des menus ──────────────────────────────────────────────────────

const LEARNING_SECTIONS = [
  {
    label: "Learning AI",
    slug: "learning-ai",
    description: "Fondamentaux et recherche en IA",
    items: [
      { href: "/learning-ai/tube",    icon: "▶",  label: "Hi! Tube",   desc: "Vidéothèque pédagogique" },
      { href: "/learning-ai/courses", icon: "📖", label: "Hi! Course", desc: "Cours interactifs" },
      { href: "/learning-ai/moocs",   icon: "🎓", label: "Hi! MOOC",   desc: "Parcours structurés" },
      { href: "/learning-ai/apps",    icon: "⚡", label: "Hi! App",    desc: "Applications interactives" },
    ],
  },
  {
    label: "Learning With AI",
    slug: "learning-with-ai",
    description: "Apprendre en utilisant l'IA comme outil",
    items: [
      { href: "/learning-with-ai/tube",    icon: "▶",  label: "Hi! Tube",   desc: "Vidéothèque pédagogique" },
      { href: "/learning-with-ai/courses", icon: "📖", label: "Hi! Course", desc: "Cours interactifs" },
      { href: "/learning-with-ai/moocs",   icon: "🎓", label: "Hi! MOOC",   desc: "Parcours structurés" },
      { href: "/learning-with-ai/apps",    icon: "⚡", label: "Hi! App",    desc: "Applications interactives" },
    ],
  },
  {
    label: "Learning at the Edge of AI",
    slug: "learning-edge-ai",
    description: "Frontières et enjeux de l'IA",
    items: [
      { href: "/learning-edge-ai/tube",    icon: "▶",  label: "Hi! Tube",   desc: "Vidéothèque pédagogique" },
      { href: "/learning-edge-ai/courses", icon: "📖", label: "Hi! Course", desc: "Cours interactifs" },
      { href: "/learning-edge-ai/moocs",   icon: "🎓", label: "Hi! MOOC",   desc: "Parcours structurés" },
      { href: "/learning-edge-ai/apps",    icon: "⚡", label: "Hi! App",    desc: "Applications interactives" },
    ],
  },
];

const roleVariant: Record<string, string> = {
  admin:     "bg-danger text-white",
  superuser: "bg-purple-600 text-white",
  teacher:   "bg-primary text-white",
  student:   "bg-white/10 text-gray-300",
  public:    "bg-white/10 text-gray-300",
};

// ─── Dropdown générique ───────────────────────────────────────────────────────

function NavDropdown({
  label,
  items,
  description,
  slug,
}: {
  label: string;
  slug: string;
  description: string;
  items: { href: string; icon: string; label: string; desc: string }[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const isActive = pathname.startsWith(`/${slug}`);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap",
          isActive
            ? "bg-primary text-white shadow-lg shadow-primary/20"
            : "text-gray-400 hover:text-white hover:bg-white/10"
        )}
      >
        {label}
        <svg
          className={clsx("w-3.5 h-3.5 transition-transform", open && "rotate-180")}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-72 bg-gray-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
          <div className="px-4 pt-4 pb-2 border-b border-white/5">
            <p className="text-xs font-semibold text-white uppercase tracking-wider">{label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          </div>
          <div className="p-2">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                  pathname.startsWith(item.href)
                    ? "bg-primary/15 text-white"
                    : "hover:bg-white/5 text-gray-400 hover:text-white"
                )}
              >
                <span className="text-xl w-7 text-center shrink-0">{item.icon}</span>
                <div>
                  <p className="text-sm font-semibold leading-none mb-0.5">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Nav principale ───────────────────────────────────────────────────────────

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))
        setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  const isTeacher = user && ["teacher", "admin", "superuser"].includes(user.role);

  return (
    <header className="bg-black border-b border-white/10 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-2">

        {/* Logo */}
        <Link href="/dashboard" className="text-xl font-bold text-white shrink-0 tracking-tight mr-4">
          Hi! <span className="text-primary">Platform</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-0.5 flex-1 overflow-x-auto">
          {/* Insights — lien direct */}
          <Link
            href="/insights"
            className={clsx(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap",
              pathname.startsWith("/insights")
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "text-gray-400 hover:text-white hover:bg-white/10"
            )}
          >
            Insights
          </Link>

          {/* Trois menus déroulants */}
          {LEARNING_SECTIONS.map((section) => (
            <NavDropdown key={section.slug} {...section} />
          ))}

          {/* Studio + LMS — réservés teachers */}
          {isTeacher && (
            <>
              <Link
                href="/studio"
                className={clsx(
                  "px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap",
                  pathname.startsWith("/studio")
                    ? "bg-danger text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/10"
                )}
              >
                Studio
              </Link>
              <Link
                href="/lms"
                className={clsx(
                  "px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap",
                  pathname.startsWith("/lms")
                    ? "bg-danger text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/10"
                )}
              >
                LMS
              </Link>
            </>
          )}
        </nav>

        {/* User menu */}
        {user ? (
          <div ref={userMenuRef} className="relative shrink-0">
            <button
              onClick={() => setUserMenuOpen((o) => !o)}
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

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="block px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                  Mon profil
                </Link>
                <div className="border-t border-white/10" />
                <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm text-danger hover:bg-danger/10 transition-colors">
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className="shrink-0 text-sm font-semibold bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors">
            Connexion
          </Link>
        )}
      </div>
    </header>
  );
}
