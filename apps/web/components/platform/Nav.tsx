"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { Avatar } from "@/components/ui/Avatar";
import { useState, useRef, useEffect } from "react";

// ─── Role chip styles ─────────────────────────────────────────────────────────

const roleChip: Record<string, string> = {
  admin:     "bg-danger/10 text-danger border border-danger/20",
  superuser: "bg-purple-100 text-purple-700 border border-purple-200",
  teacher:   "bg-primary/10 text-primary border border-primary/20",
  student:   "bg-gray-100 text-gray-600 border border-gray-200",
  public:    "bg-gray-100 text-gray-600 border border-gray-200",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type SiteMapChild = { label: string; href: string; tag?: string };
type SiteMapItem  =
  | { type: "link";    label: string; icon: string; href: string; tag?: string }
  | { type: "sub";     label: string; icon: string; key: string; children: SiteMapChild[] }
  | { type: "sep" };

// ─── Existing learning dropdown ───────────────────────────────────────────────

function NavDropdown({
  label, description, slug, items, isOpen, onToggle,
}: {
  label: string; slug: string; description: string;
  items: { href: string; icon: string; label: string; desc: string }[];
  isOpen: boolean; onToggle: (slug: string) => void;
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
          isActive ? "bg-primary/10 text-primary font-semibold" : "text-gray-600 hover:text-primary hover:bg-primary/5"
        )}
      >
        {label}
        <svg className={clsx("w-3 h-3 transition-transform shrink-0 opacity-60", isOpen && "rotate-180")}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div style={{ position: "fixed", top: dropPos.top, left: dropPos.left }}
          className="w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden z-[200]"
          onClick={(e) => e.stopPropagation()}>
          <div className="px-4 pt-4 pb-2.5 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-900 uppercase tracking-wider">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{description}</p>
          </div>
          <div className="p-2">
            {items.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => onToggle(slug)}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                  pathname.startsWith(item.href) ? "bg-primary/8 text-primary" : "hover:bg-gray-50 text-gray-600 hover:text-primary"
                )}>
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
      <button onClick={() => setLocale("fr")}
        className={clsx("text-xs px-2.5 py-1.5 font-semibold transition-colors",
          locale === "fr" ? "bg-primary text-white" : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
        )}>FR</button>
      <button onClick={() => setLocale("en")}
        className={clsx("text-xs px-2.5 py-1.5 font-semibold transition-colors",
          locale === "en" ? "bg-primary text-white" : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
        )}>EN</button>
    </div>
  );
}

// ─── Site map dropdown — always visible, for demo navigation ──────────────────

const SITE_MAP: SiteMapItem[] = [
  { type: "link", label: "Tableau de bord",    icon: "🏠", href: "/dashboard" },
  { type: "link", label: "Mon Parcours",        icon: "📈", href: "/my-learning" },
  { type: "sep" },
  {
    type: "sub", label: "Insights", icon: "🔬", key: "insights",
    children: [
      { label: "Catalogue",                href: "/insights" },
      { label: "Article — Intro ML",       href: "/insights/1" },
      { label: "Article — Deep Learning",  href: "/insights/2" },
      { label: "Nouvel article",           href: "/insights/new" },
    ],
  },
  {
    type: "sub", label: "Hi! Tube", icon: "🎬", key: "tube",
    children: [
      { label: "Learning AI → Tube",           href: "/learning-ai/tube" },
      { label: "Learning With AI → Tube",      href: "/learning-with-ai/tube" },
      { label: "Learning at the Edge → Tube",  href: "/learning-edge-ai/tube" },
      { label: "Vidéo (détail)",               href: "/tube/1" },
    ],
  },
  {
    type: "sub", label: "Hi! Course", icon: "📖", key: "courses",
    children: [
      { label: "Learning AI → Cours",              href: "/learning-ai/courses" },
      { label: "Learning With AI → Cours",         href: "/learning-with-ai/courses" },
      { label: "Learning at the Edge → Cours",     href: "/learning-edge-ai/courses" },
      { label: "Cours détail — Fondamentaux ML",   href: "/courses/1" },
      { label: "Cours détail — Python Data Sc.",   href: "/courses/2" },
    ],
  },
  {
    type: "sub", label: "Hi! MOOC", icon: "🎓", key: "moocs",
    children: [
      { label: "Learning AI → MOOC",              href: "/learning-ai/moocs" },
      { label: "Learning With AI → MOOC",         href: "/learning-with-ai/moocs" },
      { label: "Learning at the Edge → MOOC",     href: "/learning-edge-ai/moocs" },
      { label: "MOOC détail — Data Scientist",    href: "/moocs/1" },
      { label: "MOOC détail — IA pour managers",  href: "/moocs/2" },
    ],
  },
  {
    type: "sub", label: "Hi! App", icon: "⚡", key: "apps",
    children: [
      { label: "Learning AI → Apps",          href: "/learning-ai/apps" },
      { label: "Learning With AI → Apps",     href: "/learning-with-ai/apps" },
      { label: "Learning at the Edge → Apps", href: "/learning-edge-ai/apps" },
      { label: "App détail — Playground ML",  href: "/apps/1" },
      { label: "App détail — NLP Demo",       href: "/apps/3" },
    ],
  },
  { type: "sep" },
  {
    type: "sub", label: "Studio", icon: "🛠", key: "studio",
    children: [
      { label: "Accueil Studio",    href: "/studio" },
      { label: "Excel → Quiz",      href: "/studio/excel-quiz" },
      { label: "Vidéo → Cours",     href: "/studio/video-course" },
    ],
  },
  {
    type: "sub", label: "LMS", icon: "📊", key: "lms",
    children: [
      { label: "Liste des cohortes",   href: "/lms" },
      { label: "Cohorte (détail)",     href: "/lms/1" },
    ],
  },
  { type: "link", label: "Administration", icon: "👑", href: "/admin", tag: "admin" },
  { type: "sep" },
  {
    type: "sub", label: "Compte & Auth", icon: "👤", key: "auth",
    children: [
      { label: "Mon Profil",          href: "/profile" },
      { label: "Connexion",           href: "/login" },
      { label: "Compléter le profil", href: "/complete-profile" },
      { label: "Confidentialité",     href: "/privacy" },
      { label: "CGU",                 href: "/cgu" },
      { label: "Vérification email",  href: "/verify-email" },
    ],
  },
];

function SiteMapDropdown() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [panelPos, setPanelPos] = useState({ top: 72, left: 0 });
  const [subPos, setSubPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeSubTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
    setActiveSub(null);
  }, [pathname]);

  function handleToggle() {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // Try to fit within viewport
      const left = Math.min(rect.left, window.innerWidth - 248);
      setPanelPos({ top: rect.bottom + 6, left });
    }
    setIsOpen((o) => !o);
    setActiveSub(null);
  }

  function handleItemEnter(key: string, el: HTMLDivElement) {
    if (closeSubTimer.current) clearTimeout(closeSubTimer.current);
    setActiveSub(key);
    const rect = el.getBoundingClientRect();
    const subLeft = Math.min(rect.right + 4, window.innerWidth - 236);
    setSubPos({ top: rect.top, left: subLeft });
  }

  function handleMainLeave() {
    closeSubTimer.current = setTimeout(() => setActiveSub(null), 120);
  }

  function handleSubEnter() {
    if (closeSubTimer.current) clearTimeout(closeSubTimer.current);
  }

  function handleSubLeave() {
    closeSubTimer.current = setTimeout(() => setActiveSub(null), 120);
  }

  function closeAll() {
    setIsOpen(false);
    setActiveSub(null);
  }

  const activeChildren = activeSub
    ? (SITE_MAP.find((i): i is Extract<SiteMapItem, { type: "sub" }> => i.type === "sub" && i.key === activeSub)?.children ?? [])
    : [];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-[185]" onClick={closeAll} aria-hidden="true" />
      )}

      {/* Toggle button */}
      <button
        ref={buttonRef}
        onClick={handleToggle}
        title="Accéder à toutes les pages de la maquette"
        className={clsx(
          "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap shrink-0",
          isOpen
            ? "bg-gray-900 text-white border-gray-900"
            : "border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50"
        )}
      >
        <span>🗺</span>
        <span className="hidden sm:inline">Toutes les pages</span>
        <svg className={clsx("w-3 h-3 transition-transform opacity-60", isOpen && "rotate-180")}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* ── Level 1 — main panel ───────────────────────────────────────── */}
      {isOpen && (
        <div
          style={{ position: "fixed", top: panelPos.top, left: panelPos.left }}
          className="w-56 bg-white border border-gray-200 rounded-2xl shadow-2xl z-[200] py-1.5"
          onMouseLeave={handleMainLeave}
        >
          {/* Header */}
          <div className="px-4 pt-2 pb-2.5 border-b border-gray-100 mb-1">
            <p className="text-xs font-bold text-gray-900 uppercase tracking-wider">Plan du site</p>
            <p className="text-xs text-gray-400 mt-0.5">Navigation maquette</p>
          </div>

          {SITE_MAP.map((item, idx) => {
            if (item.type === "sep") {
              return <div key={idx} className="h-px bg-gray-100 my-1 mx-3" />;
            }

            if (item.type === "link") {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeAll}
                  className="flex items-center justify-between gap-2 px-3 py-2 mx-1 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base w-5 text-center">{item.icon}</span>
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">{item.label}</span>
                  </div>
                  {item.tag && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">{item.tag}</span>
                  )}
                </Link>
              );
            }

            // type === "sub"
            const isActive = activeSub === item.key;
            return (
              <div
                key={item.key}
                onMouseEnter={(e) => handleItemEnter(item.key, e.currentTarget)}
                className={clsx(
                  "flex items-center justify-between gap-2 px-3 py-2 mx-1 rounded-xl cursor-pointer transition-colors",
                  isActive ? "bg-primary/10 text-primary" : "hover:bg-gray-50 text-gray-700"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base w-5 text-center">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <svg className="w-3.5 h-3.5 opacity-40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Level 2 — sub-panel ───────────────────────────────────────── */}
      {isOpen && activeSub && activeChildren.length > 0 && (
        <div
          style={{ position: "fixed", top: subPos.top, left: subPos.left }}
          className="w-60 bg-white border border-gray-200 rounded-2xl shadow-2xl z-[210] py-1.5"
          onMouseEnter={handleSubEnter}
          onMouseLeave={handleSubLeave}
        >
          {/* Sub-panel header */}
          <div className="px-4 pt-2 pb-2 border-b border-gray-100 mb-1">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {SITE_MAP.find((i): i is Extract<SiteMapItem, { type: "sub" }> => i.type === "sub" && i.key === activeSub)?.label}
            </p>
          </div>

          {activeChildren.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              onClick={closeAll}
              className="flex items-center justify-between gap-2 px-3 py-2 mx-1 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <span className="text-sm text-gray-700 group-hover:text-gray-900 leading-tight">{child.label}</span>
              {child.tag && (
                <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{child.tag}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </>
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

  useEffect(() => {
    setOpenDropdown(null);
    setUserMenuOpen(false);
  }, [pathname]);

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
  const isAdmin   = user && ["admin", "superuser"].includes(user.role);

  return (
    <>
      {/* Backdrop for learning dropdowns */}
      {openDropdown && (
        <div className="fixed inset-0 z-[150]" onClick={() => setOpenDropdown(null)} aria-hidden="true" />
      )}

      <header className="bg-white border-b border-gray-200 sticky top-0 z-[160]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-2">

          {/* Logo */}
          <Link href="/dashboard" className="shrink-0 mr-4 flex items-center gap-0 select-none">
            <span className="text-xl font-extrabold text-primary tracking-tight">Hi!</span>
            <span className="text-xl font-extrabold text-gray-900 tracking-tight"> Platform</span>
          </Link>

          {/* Main nav */}
          <nav className="flex items-center gap-0.5 flex-1 min-w-0 overflow-x-auto">
            <Link
              href="/insights"
              className={clsx(
                "px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                pathname.startsWith("/insights") ? "bg-primary/10 text-primary font-semibold" : "text-gray-600 hover:text-primary hover:bg-primary/5"
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
                pathname.startsWith("/my-learning") ? "bg-primary/10 text-primary font-semibold" : "text-gray-600 hover:text-primary hover:bg-primary/5"
              )}
            >
              {t.nav.myLearning}
            </Link>

            {isTeacher && (
              <>
                <div className="w-px h-5 bg-gray-200 mx-1 shrink-0" />
                <Link href="/studio" className={clsx("px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                  pathname.startsWith("/studio") ? "bg-danger/10 text-danger font-semibold" : "text-gray-600 hover:text-danger hover:bg-danger/5"
                )}>{t.nav.studio}</Link>
                <Link href="/lms" className={clsx("px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                  pathname.startsWith("/lms") ? "bg-danger/10 text-danger font-semibold" : "text-gray-600 hover:text-danger hover:bg-danger/5"
                )}>{t.nav.lms}</Link>
              </>
            )}

            {isAdmin && (
              <Link href="/admin" className={clsx("px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                pathname.startsWith("/admin") ? "bg-purple-100 text-purple-700 font-semibold" : "text-gray-600 hover:text-purple-700 hover:bg-purple-50"
              )}>{t.nav.admin}</Link>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0 ml-2">

            <LangSwitcher />

            {/* User menu or login */}
            {user ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-semibold text-gray-900 leading-none">{user.first_name} {user.last_name}</p>
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
                    <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">{t.nav.profile}</Link>
                    <Link href="/my-learning" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">{t.nav.myLearning}</Link>
                    {isAdmin && (
                      <Link href="/admin" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">{t.nav.administration}</Link>
                    )}
                    <div className="border-t border-gray-100" />
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-danger hover:bg-danger/5 transition-colors">{t.nav.logout}</button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors shadow-sm shrink-0">
                {t.nav.login}
              </Link>
            )}

            {/* Site map — toujours visible, après le bouton connexion */}
            <SiteMapDropdown />
          </div>
        </div>
      </header>
    </>
  );
}
