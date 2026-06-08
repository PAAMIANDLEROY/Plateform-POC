"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { Avatar } from "@/components/ui/Avatar";
import { useState, useRef, useEffect } from "react";

const roleChip: Record<string, string> = {
  admin:     "bg-danger/10 text-danger border border-danger/20",
  superuser: "bg-purple-100 text-purple-700 border border-purple-200",
  teacher:   "bg-primary/10 text-primary border border-primary/20",
  student:   "bg-gray-100 text-gray-600 border border-gray-200",
  public:    "bg-gray-100 text-gray-600 border border-gray-200",
};

// ─── Dropdown with fixed positioning ─────────────────────────────────────────

function NavDropdown({
  label,
  description,
  slug,
  items,
  isOpen,
  onToggle,
}: {
  label: string;
  slug: string;
  description: string;
  items: { href: string; icon: string; label: string; desc: string }[];
  isOpen: boolean;
  onToggle: (slug: string) => void;
}) {
  const pathname = usePathname();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropPos, setDropPos] = useState({ top: 72, left: 0 });

  const isActive = pathname.startsWith(`/${slug}`);

  function handleToggle() {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropPos({ top: rect.bottom + 6, left: rect.left });
    }
    onToggle(slug);
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        aria-expanded={isOpen}
        className={clsx(
          "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
          isActive
            ? "bg-primary/10 text-primary font-semibold"
            : "text-gray-600 hover:text-primary hover:bg-primary/5"
        )}
      >
        {label}
        <svg
          className={clsx("w-3 h-3 transition-transform shrink-0 opacity-60", isOpen && "rotate-180")}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{ position: "fixed", top: dropPos.top, left: dropPos.left }}
          className="w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden z-[200]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 pt-4 pb-2.5 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-900 uppercase tracking-wider">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{description}</p>
          </div>
          <div className="p-2">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onToggle(slug)}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                  pathname.startsWith(item.href)
                    ? "bg-primary/8 text-primary"
                    : "hover:bg-gray-50 text-gray-600 hover:text-primary"
                )}
              >
                <span className="text-xl w-7 text-center shrink-0">{item.icon}</span>
                <div>
                  <p className="text-sm font-semibold leading-none mb-0.5">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Language switcher ────────────────────────────────────────────────────────

function LangSwitcher() {
  const { locale, setLocale } = useLanguage();
  return (
    <div className="flex items-center gap-0.5 shrink-0 border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setLocale("fr")}
        className={clsx(
          "text-xs px-2.5 py-1.5 font-semibold transition-colors",
          locale === "fr"
            ? "bg-primary text-white"
            : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
        )}
      >
        FR
      </button>
      <button
        onClick={() => setLocale("en")}
        className={clsx(
          "text-xs px-2.5 py-1.5 font-semibold transition-colors",
          locale === "en"
            ? "bg-primary text-white"
            : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
        )}
      >
        EN
      </button>
    </div>
  );
}

// ─── Nav principale ───────────────────────────────────────────────────────────

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Build translated learning sections
  const LEARNING_SECTIONS = [
    {
      label: t.nav.sections.learningAI.label,
      slug: "learning-ai",
      description: t.nav.sections.learningAI.description,
      items: [
        { href: "/learning-ai/tube",    icon: "▶",  label: "Hi! Tube",   desc: t.nav.items.tube },
        { href: "/learning-ai/courses", icon: "📖", label: "Hi! Course", desc: t.nav.items.course },
        { href: "/learning-ai/moocs",   icon: "🎓", label: "Hi! MOOC",   desc: t.nav.items.mooc },
        { href: "/learning-ai/apps",    icon: "⚡", label: "Hi! App",    desc: t.nav.items.app },
      ],
    },
    {
      label: t.nav.sections.learningWith.label,
      slug: "learning-with-ai",
      description: t.nav.sections.learningWith.description,
      items: [
        { href: "/learning-with-ai/tube",    icon: "▶",  label: "Hi! Tube",   desc: t.nav.items.tube },
        { href: "/learning-with-ai/courses", icon: "📖", label: "Hi! Course", desc: t.nav.items.course },
        { href: "/learning-with-ai/moocs",   icon: "🎓", label: "Hi! MOOC",   desc: t.nav.items.mooc },
        { href: "/learning-with-ai/apps",    icon: "⚡", label: "Hi! App",    desc: t.nav.items.app },
      ],
    },
    {
      label: t.nav.sections.learningEdge.label,
      slug: "learning-edge-ai",
      description: t.nav.sections.learningEdge.description,
      items: [
        { href: "/learning-edge-ai/tube",    icon: "▶",  label: "Hi! Tube",   desc: t.nav.items.tube },
        { href: "/learning-edge-ai/courses", icon: "📖", label: "Hi! Course", desc: t.nav.items.course },
        { href: "/learning-edge-ai/moocs",   icon: "🎓", label: "Hi! MOOC",   desc: t.nav.items.mooc },
        { href: "/learning-edge-ai/apps",    icon: "⚡", label: "Hi! App",    desc: t.nav.items.app },
      ],
    },
  ];

  // Close everything on route change
  useEffect(() => {
    setOpenDropdown(null);
    setUserMenuOpen(false);
  }, [pathname]);

  // Close user menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))
        setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleDropdownToggle(slug: string) {
    setOpenDropdown((prev) => (prev === slug ? null : slug));
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  const isTeacher = user && ["teacher", "admin", "superuser"].includes(user.role);
  const isAdmin = user && ["admin", "superuser"].includes(user.role);

  return (
    <>
      {/* Backdrop */}
      {openDropdown && (
        <div
          className="fixed inset-0 z-[150]"
          onClick={() => setOpenDropdown(null)}
          aria-hidden="true"
        />
      )}

      <header className="bg-white border-b border-gray-200 sticky top-0 z-[160]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-2">

          {/* Logo */}
          <Link href="/dashboard" className="shrink-0 mr-4 flex items-center gap-0 select-none">
            <span className="text-xl font-extrabold text-primary tracking-tight">Hi!</span>
            <span className="text-xl font-extrabold text-gray-900 tracking-tight"> Platform</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-0.5 flex-1 min-w-0 overflow-x-auto">

            <Link
              href="/insights"
              className={clsx(
                "px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                pathname.startsWith("/insights")
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-gray-600 hover:text-primary hover:bg-primary/5"
              )}
            >
              {t.nav.insights}
            </Link>

            {LEARNING_SECTIONS.map((section) => (
              <NavDropdown
                key={section.slug}
                {...section}
                isOpen={openDropdown === section.slug}
                onToggle={handleDropdownToggle}
              />
            ))}

            <Link
              href="/my-learning"
              className={clsx(
                "px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                pathname.startsWith("/my-learning")
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-gray-600 hover:text-primary hover:bg-primary/5"
              )}
            >
              {t.nav.myLearning}
            </Link>

            {isTeacher && (
              <>
                <div className="w-px h-5 bg-gray-200 mx-1 shrink-0" />
                <Link
                  href="/studio"
                  className={clsx(
                    "px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                    pathname.startsWith("/studio")
                      ? "bg-danger/10 text-danger font-semibold"
                      : "text-gray-600 hover:text-danger hover:bg-danger/5"
                  )}
                >
                  {t.nav.studio}
                </Link>
                <Link
                  href="/lms"
                  className={clsx(
                    "px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                    pathname.startsWith("/lms")
                      ? "bg-danger/10 text-danger font-semibold"
                      : "text-gray-600 hover:text-danger hover:bg-danger/5"
                  )}
                >
                  {t.nav.lms}
                </Link>
              </>
            )}

            {isAdmin && (
              <Link
                href="/admin"
                className={clsx(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                  pathname.startsWith("/admin")
                    ? "bg-purple-100 text-purple-700 font-semibold"
                    : "text-gray-600 hover:text-purple-700 hover:bg-purple-50"
                )}
              >
                {t.nav.admin}
              </Link>
            )}
          </nav>

          {/* Right side: lang switcher + user */}
          <div className="flex items-center gap-3 shrink-0 ml-2">
            <LangSwitcher />

            {user ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-semibold text-gray-900 leading-none">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
                  </div>
                  <Avatar name={`${user.first_name} ${user.last_name}`} size="sm" />
                  <span className={clsx("text-xs font-semibold px-2 py-0.5 rounded-full hidden sm:inline", roleChip[user.role] ?? roleChip.student)}>
                    {t.roles[user.role as keyof typeof t.roles] ?? user.role}
                  </span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-[200]">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{user.first_name} {user.last_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{user.email}</p>
                    </div>
                    <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">
                      {t.nav.profile}
                    </Link>
                    <Link href="/my-learning" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">
                      {t.nav.myLearning}
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">
                        {t.nav.administration}
                      </Link>
                    )}
                    <div className="border-t border-gray-100" />
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-danger hover:bg-danger/5 transition-colors">
                      {t.nav.logout}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors shadow-sm">
                {t.nav.login}
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
