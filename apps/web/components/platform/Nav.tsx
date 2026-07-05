/**
 * @file Nav.tsx
 * @description Barre de navigation principale de Hi! Platform.
 *
 * Composants exportés :
 *   - `Nav`               — barre sticky complète (logo + nav principale + droite)
 *
 * Composants internes (non exportés) :
 *   - `NavDropdown`       — menu déroulant pour les 3 sections Learning (Learning AI / With / Edge)
 *   - `LangSwitcher`      — pill FR | EN (persisté dans localStorage)
 *
 * Architecture z-index :
 *   z-[150]  Backdrop des NavDropdown (fermeture au clic extérieur)
 *   z-[160]  Header sticky (passe au-dessus du contenu page)
 *   z-[200]  Panneaux des dropdowns (NavDropdown + menu utilisateur)
 *
 * Stratégie de positionnement (position: fixed) :
 *   Les dropdowns utilisent `getBoundingClientRect()` + `position: fixed` plutôt que
 *   `position: absolute` pour éviter tout clipping causé par un ancêtre avec
 *   `overflow: hidden` ou un contexte de pile (stacking context).
 */

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { Avatar } from "@/components/ui/Avatar";
import { useState, useRef, useEffect } from "react";

// ─── Styles des badges de rôle ────────────────────────────────────────────────
/**
 * Classes Tailwind pour le chip de rôle affiché dans la nav utilisateur.
 * Clé = valeur du champ `role` renvoyé par l'API.
 * Fallback : `roleChip.student` si le rôle est inconnu.
 */
const roleChip: Record<string, string> = {
  admin:     "bg-danger/10 text-danger border border-danger/20",
  super_admin: "bg-purple-100 text-purple-700 border border-purple-200",
  teacher:   "bg-primary/10 text-primary border border-primary/20",
  student:   "bg-gray-100 text-gray-600 border border-gray-200",
  public:    "bg-gray-100 text-gray-600 border border-gray-200",
};

// ─── NavDropdown ──────────────────────────────────────────────────────────────
/**
 * Dropdown des sections Learning (Learning AI / With AI / at the Edge).
 *
 * Chaque instance correspond à une section thématique et affiche les 4 modules
 * (Tube, Course, MOOC, App) vers ce thème.
 *
 * Comportement :
 * - Contrôlé par le parent via `isOpen` / `onToggle`
 *   → un seul dropdown ouvert à la fois (géré dans `Nav`)
 * - Positionné en `fixed` : calculé au clic pour rester dans le viewport
 * - `stopPropagation` sur le panneau évite la fermeture via le backdrop
 *
 * @param label       - Nom de la section (ex : "Learning AI")
 * @param slug        - Préfixe URL (ex : "learning-ai")
 * @param description - Sous-titre affiché dans l'en-tête du panneau
 * @param items       - Liste des modules avec href, icône, label, description courte
 * @param isOpen      - État ouvert/fermé piloté par le parent
 * @param onToggle    - Callback appelé avec `slug` pour basculer l'état dans le parent
 */
function NavDropdown({
  label, description, slug, items, isOpen, onToggle,
}: {
  label:       string;
  slug:        string;
  description: string;
  items:       { href: string; icon: string; label: string; desc: string }[];
  isOpen:      boolean;
  onToggle:    (slug: string) => void;
}) {
  const pathname  = usePathname();
  const buttonRef = useRef<HTMLButtonElement>(null);

  /**
   * Position fixe du panneau, calculée au moment de l'ouverture.
   * Défaut : top=72px (hauteur du header) pour éviter un saut visuel
   * lors du premier rendu avant le calcul.
   */
  const [dropPos, setDropPos] = useState({ top: 72, left: 0 });

  /**
   * `true` si l'URL courante commence par `/${slug}`.
   * Utilisé pour mettre le bouton en surbrillance "actif".
   */
  const isActive = pathname.startsWith(`/${slug}`);

  /**
   * Gestion du clic sur le bouton.
   * - Si on ouvre : recalcule la position avant d'afficher le panneau.
   * - Si on ferme : délègue directement à `onToggle`.
   */
  function handleToggle() {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // Aligne le bord gauche du panneau sur le bord gauche du bouton,
      // 6px en dessous du bas du bouton pour un petit espace visuel.
      setDropPos({ top: rect.bottom + 6, left: rect.left });
    }
    onToggle(slug);
  }

  return (
    <>
      {/* ── Bouton déclencheur ── */}
      <button
        ref={buttonRef}
        onClick={handleToggle}
        aria-expanded={isOpen} // accessibilité : lecteurs d'écran
        className={clsx(
          "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
          // Branche active : mise en avant si l'URL correspond à cette section
          isActive
            ? "bg-primary/10 text-primary font-semibold"
            : "text-gray-600 hover:text-primary hover:bg-primary/5"
        )}
      >
        {label}
        {/* Chevron : tourne à 180° quand le panneau est ouvert */}
        <svg
          className={clsx("w-3 h-3 transition-transform shrink-0 opacity-60", isOpen && "rotate-180")}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* ── Panneau déroulant (rendu uniquement si isOpen) ── */}
      {isOpen && (
        <div
          style={{ position: "fixed", top: dropPos.top, left: dropPos.left }}
          className="w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden z-[200]"
          // Stoppe la propagation du clic vers le backdrop parent,
          // ce qui empêcherait la fermeture involontaire lors d'un clic dans le panneau.
          onClick={(e) => e.stopPropagation()}
        >
          {/* En-tête du panneau */}
          <div className="px-4 pt-4 pb-2.5 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-900 uppercase tracking-wider">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{description}</p>
          </div>

          {/* Liste des modules */}
          <div className="p-2">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onToggle(slug)} // ferme le dropdown au clic sur un lien
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                  // Branche actif : surbrillance si l'URL commence par ce chemin
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

// ─── LangSwitcher ─────────────────────────────────────────────────────────────
/**
 * Pill de sélection de langue FR / EN.
 *
 * - Lit et écrit dans le contexte `LanguageProvider` (lib/i18n.tsx)
 * - La locale est persistée dans `localStorage` (clé `"hi_locale"`)
 *   et rechargée au montage du provider.
 * - Le bouton actif reçoit le fond `bg-primary` ; l'inactif reste grisé.
 */
function LangSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="flex items-center gap-0.5 shrink-0 border border-gray-200 rounded-lg overflow-hidden">
      {/* Branche FR : actif si locale === "fr" */}
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

      {/* Branche EN : actif si locale === "en" */}
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

// ─── Nav (composant principal exporté) ───────────────────────────────────────
/**
 * Barre de navigation principale, sticky en haut de toutes les pages platform.
 *
 * Layout (gauche → droite) :
 *   Logo | Insights | About | [Learning AI] [Learning With AI] [Learning at the Edge]
 *   … | FR/EN | [Connexion / UserMenu]
 *
 * Visibilité conditionnelle des entrées :
 *   - Studio + LMS : dans le menu avatar si `user.role` ∈ {teacher, admin, super_admin}
 *   - Admin        : dans le menu avatar si `user.role` ∈ {admin, super_admin}
 *   - Bouton "Connexion" : affiché si pas de session (`user === null`)
 *   - Menu utilisateur   : affiché si session active (`user !== null`)
 *
 * Gestion des dropdowns Learning :
 *   Un seul dropdown peut être ouvert à la fois (géré par `openDropdown: string | null`).
 *   Un backdrop z-[150] couvre l'écran pour fermer au clic extérieur.
 *
 * Menu utilisateur :
 *   Géré par `userMenuOpen` + un `useEffect` qui écoute `mousedown` sur le document
 *   pour fermer si le clic est en dehors du wrapper `userMenuRef`.
 */
export function Nav() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  /**
   * Slug du NavDropdown actuellement ouvert (ex: "learning-ai"), ou null si aucun.
   * Un seul dropdown Learning peut être ouvert simultanément.
   */
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  /** `true` si le menu déroulant du profil utilisateur est ouvert */
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  /** Ref sur le wrapper du menu utilisateur pour la détection du clic extérieur */
  const userMenuRef = useRef<HTMLDivElement>(null);

  /**
   * Configuration des 3 sections Learning.
   * Défini à l'intérieur du composant pour accéder aux traductions (`t`).
   * Chaque section génère un `NavDropdown` avec 4 modules (Tube, Course, MOOC, App).
   */
  const LEARNING_SECTIONS = [
    {
      label:       t.nav.sections.learningAI.label,
      slug:        "learning-ai",
      description: t.nav.sections.learningAI.description,
      items: [
        { href: "/learning-ai/tube",    icon: "▶",  label: "Hi! Tube",   desc: t.nav.items.tube },
        { href: "/learning-ai/courses", icon: "📖", label: "Hi! Course", desc: t.nav.items.course },
        { href: "/learning-ai/moocs",   icon: "🎓", label: "Hi! MOOC",   desc: t.nav.items.mooc },
        { href: "/learning-ai/apps",    icon: "⚡", label: "Hi! App",    desc: t.nav.items.app },
      ],
    },
    {
      label:       t.nav.sections.learningWith.label,
      slug:        "learning-with-ai",
      description: t.nav.sections.learningWith.description,
      items: [
        { href: "/learning-with-ai/tube",    icon: "▶",  label: "Hi! Tube",   desc: t.nav.items.tube },
        { href: "/learning-with-ai/courses", icon: "📖", label: "Hi! Course", desc: t.nav.items.course },
        { href: "/learning-with-ai/moocs",   icon: "🎓", label: "Hi! MOOC",   desc: t.nav.items.mooc },
        { href: "/learning-with-ai/apps",    icon: "⚡", label: "Hi! App",    desc: t.nav.items.app },
      ],
    },
    {
      label:       t.nav.sections.learningEdge.label,
      slug:        "learning-edge-ai",
      description: t.nav.sections.learningEdge.description,
      items: [
        { href: "/learning-edge-ai/tube",    icon: "▶",  label: "Hi! Tube",   desc: t.nav.items.tube },
        { href: "/learning-edge-ai/courses", icon: "📖", label: "Hi! Course", desc: t.nav.items.course },
        { href: "/learning-edge-ai/moocs",   icon: "🎓", label: "Hi! MOOC",   desc: t.nav.items.mooc },
        { href: "/learning-edge-ai/apps",    icon: "⚡", label: "Hi! App",    desc: t.nav.items.app },
      ],
    },
  ];

  // ── Fermeture de tous les menus au changement de route ──
  useEffect(() => {
    setOpenDropdown(null);
    setUserMenuOpen(false);
  }, [pathname]);

  // ── Fermeture du menu utilisateur au clic extérieur ──
  useEffect(() => {
    function handler(e: MouseEvent) {
      // Ferme uniquement si le clic est en dehors du wrapper du menu utilisateur
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    // Nettoyage : retire le listener quand le composant est démonté
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /**
   * Bascule l'ouverture d'un NavDropdown Learning.
   * - Si `slug` est déjà ouvert → ferme (set null)
   * - Sinon → ouvre ce slug (ferme automatiquement l'ancien car on set la nouvelle valeur)
   */
  function handleDropdownToggle(slug: string) {
    setOpenDropdown((prev) => (prev === slug ? null : slug));
  }

  /**
   * Déconnexion de l'utilisateur.
   * Appelle `logout()` du contexte Auth, puis redirige vers /login.
   */
  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <>
      {/*
       * Backdrop pour les NavDropdown Learning.
       * Rendu uniquement si un dropdown Learning est ouvert.
       * z-[150] : sous le header (z-[160]) pour ne pas bloquer le header lui-même,
       * mais au-dessus du contenu de la page.
       */}
      {openDropdown && (
        <div
          className="fixed inset-0 z-[150]"
          onClick={() => setOpenDropdown(null)}
          aria-hidden="true"
        />
      )}

      <header className="bg-white border-b border-gray-200 sticky top-0 z-[160]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-2">

          {/* ── Logo ── */}
          <Link href="/dashboard" className="shrink-0 mr-4 flex items-center gap-0 select-none">
            <span className="text-xl font-extrabold text-primary tracking-tight">Hi!</span>
            <span className="text-xl font-extrabold text-gray-900 tracking-tight"> Platform</span>
          </Link>

          {/* ── Navigation principale (flex, scrollable sur petits écrans) ── */}
          <nav className="flex items-center gap-0.5 flex-1 min-w-0 overflow-x-auto">

            {/* Lien direct Insights (pas de sous-menu) */}
            <Link
              href="/insights"
              className={clsx(
                "px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                // Branche actif si URL commence par /insights
                pathname.startsWith("/insights")
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-gray-600 hover:text-primary hover:bg-primary/5"
              )}
            >
              {t.nav.insights}
            </Link>

            {/* Lien direct About us */}
            <Link
              href="/about"
              className={clsx(
                "px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                pathname.startsWith("/about")
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-gray-600 hover:text-primary hover:bg-primary/5"
              )}
            >
              {t.nav.about}
            </Link>

            {/* 3 dropdowns Learning — itération sur LEARNING_SECTIONS */}
            {LEARNING_SECTIONS.map((section) => (
              <NavDropdown
                key={section.slug}
                {...section}
                isOpen={openDropdown === section.slug}
                onToggle={handleDropdownToggle}
              />
            ))}

            {/*
             * Studio, LMS, Admin et « Mon parcours » ne sont plus dans la barre :
             * ils vivent dans le menu déroulant de l'avatar (« Mon profil »).
             */}
          </nav>

          {/* ── Zone droite : langue + auth ── */}
          <div className="flex items-center gap-2 shrink-0 ml-2">

            {/* Switcher de langue FR / EN */}
            <LangSwitcher />

            {/*
             * Branche authentification :
             *   - user !== null → affiche le menu utilisateur (avatar + nom + rôle)
             *   - user === null → affiche le bouton "Connexion"
             */}
            {user ? (
              // ── Menu utilisateur (session active) ──
              <div ref={userMenuRef} className="relative">
                {/* Bouton déclencheur : avatar + nom + badge de rôle */}
                {/* Déclencheur épuré : avatar + prénom + chevron.
                    Email et rôle sont déplacés dans le panneau déroulant. */}
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  aria-expanded={userMenuOpen}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <Avatar name={`${user.first_name} ${user.last_name}`} size="sm" />
                  <span className="hidden sm:inline text-sm font-semibold text-gray-900 max-w-[90px] truncate">
                    {user.first_name}
                  </span>
                  <svg
                    className={clsx("w-3 h-3 text-gray-400 transition-transform shrink-0", userMenuOpen && "rotate-180")}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Panneau du menu utilisateur (position absolute car dans un relative) */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-[200]">
                    {/* En-tête : nom + badge de rôle, puis email */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {user.first_name} {user.last_name}
                        </p>
                        <span className={clsx(
                          "text-xs font-semibold px-2 py-0.5 rounded-full shrink-0",
                          roleChip[user.role] ?? roleChip.student
                        )}>
                          {t.roles[user.role as keyof typeof t.roles] ?? user.role}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>

                    {/* Compte */}
                    <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">{t.nav.profile}</Link>
                    <Link href="/my-learning" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">{t.nav.myLearning}</Link>

                    {/* Enseignant (teacher+) */}
                    {["teacher", "admin", "super_admin"].includes(user.role) && (
                      <>
                        <div className="border-t border-gray-100" />
                        <Link href="/studio" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">{t.nav.studio}</Link>
                        <Link href="/lms" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">{t.nav.lms}</Link>
                      </>
                    )}

                    {/* Administration (admin+) */}
                    {["admin", "super_admin"].includes(user.role) && (
                      <>
                        <div className="border-t border-gray-100" />
                        <Link href="/admin" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">{t.nav.administration}</Link>
                      </>
                    )}

                    {/* Séparateur puis déconnexion */}
                    <div className="border-t border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-danger hover:bg-danger/5 transition-colors"
                    >
                      {t.nav.logout}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // ── Bouton Connexion (aucune session) ──
              <Link
                href="/login"
                className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors shadow-sm shrink-0"
              >
                {t.nav.login}
              </Link>
            )}

          </div>
        </div>
      </header>
    </>
  );
}
