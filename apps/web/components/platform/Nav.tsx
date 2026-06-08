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
 *   - `SiteMapDropdown`   — menu "Toutes les pages" à 2 niveaux, toujours visible (maquette)
 *
 * Architecture z-index :
 *   z-[150]  Backdrop des NavDropdown (fermeture au clic extérieur)
 *   z-[160]  Header sticky (passe au-dessus du contenu page)
 *   z-[185]  Backdrop du SiteMapDropdown
 *   z-[200]  Panneaux des dropdowns (NavDropdown + panneau niveau-1 du SiteMap)
 *   z-[210]  Sous-panneau niveau-2 du SiteMap (doit passer au-dessus de tout)
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
  superuser: "bg-purple-100 text-purple-700 border border-purple-200",
  teacher:   "bg-primary/10 text-primary border border-primary/20",
  student:   "bg-gray-100 text-gray-600 border border-gray-200",
  public:    "bg-gray-100 text-gray-600 border border-gray-200",
};

// ─── Types du plan de site ─────────────────────────────────────────────────────
/**
 * Entrée enfant d'un sous-menu (niveau 2).
 * @property label - Texte affiché dans le sous-panneau
 * @property href  - Route Next.js cible
 * @property tag   - Badge optionnel affiché à droite (ex : "admin")
 */
type SiteMapChild = {
  label: string;
  href:  string;
  tag?:  string;
};

/**
 * Union discriminée décrivant chaque entrée du plan de site (niveau 1).
 *
 * - `"link"` : lien direct (1 clic → navigation immédiate)
 * - `"sub"`  : entrée parente déclenchant un sous-panneau au survol
 * - `"sep"`  : séparateur visuel horizontal
 */
type SiteMapItem =
  | { type: "link"; label: string; icon: string; href: string; tag?: string }
  | { type: "sub";  label: string; icon: string; key: string;  children: SiteMapChild[] }
  | { type: "sep" };

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

// ─── Données du plan de site ──────────────────────────────────────────────────
/**
 * Arbre statique de toutes les pages de la maquette.
 *
 * Structure :
 *   - `type: "link"` → lien direct, navigation en 1 clic
 *   - `type: "sub"`  → ouvre un sous-panneau au survol ; `key` sert d'identifiant
 *                      pour `activeSub` dans le state du composant
 *   - `type: "sep"`  → séparateur visuel (pas de données)
 *
 * IDs mock utilisés (issus de lib/mock.ts) :
 *   Insights : 1, 2
 *   Vidéos   : 1
 *   Cours    : 1, 2
 *   MOOCs    : 1, 2
 *   Apps     : 1, 3
 *   LMS      : 1
 */
const SITE_MAP: SiteMapItem[] = [
  { type: "link", label: "Tableau de bord", icon: "🏠", href: "/dashboard" },
  { type: "link", label: "Mon Parcours",    icon: "📈", href: "/my-learning" },
  { type: "sep" },
  {
    type: "sub", label: "Insights", icon: "🔬", key: "insights",
    children: [
      { label: "Catalogue",               href: "/insights" },
      { label: "Article — Intro ML",      href: "/insights/1" },
      { label: "Article — Deep Learning", href: "/insights/2" },
      { label: "Nouvel article",          href: "/insights/new" },
    ],
  },
  {
    type: "sub", label: "Hi! Tube", icon: "🎬", key: "tube",
    children: [
      { label: "Learning AI → Tube",          href: "/learning-ai/tube" },
      { label: "Learning With AI → Tube",     href: "/learning-with-ai/tube" },
      { label: "Learning at the Edge → Tube", href: "/learning-edge-ai/tube" },
      { label: "Vidéo (détail)",              href: "/tube/1" },
    ],
  },
  {
    type: "sub", label: "Hi! Course", icon: "📖", key: "courses",
    children: [
      { label: "Learning AI → Cours",             href: "/learning-ai/courses" },
      { label: "Learning With AI → Cours",        href: "/learning-with-ai/courses" },
      { label: "Learning at the Edge → Cours",    href: "/learning-edge-ai/courses" },
      { label: "Cours détail — Fondamentaux ML",  href: "/courses/1" },
      { label: "Cours détail — Python Data Sc.",  href: "/courses/2" },
    ],
  },
  {
    type: "sub", label: "Hi! MOOC", icon: "🎓", key: "moocs",
    children: [
      { label: "Learning AI → MOOC",             href: "/learning-ai/moocs" },
      { label: "Learning With AI → MOOC",        href: "/learning-with-ai/moocs" },
      { label: "Learning at the Edge → MOOC",    href: "/learning-edge-ai/moocs" },
      { label: "MOOC détail — Data Scientist",   href: "/moocs/1" },
      { label: "MOOC détail — IA pour managers", href: "/moocs/2" },
    ],
  },
  {
    type: "sub", label: "Hi! App", icon: "⚡", key: "apps",
    children: [
      { label: "Learning AI → Apps",         href: "/learning-ai/apps" },
      { label: "Learning With AI → Apps",    href: "/learning-with-ai/apps" },
      { label: "Learning at the Edge → Apps",href: "/learning-edge-ai/apps" },
      { label: "App détail — Playground ML", href: "/apps/1" },
      { label: "App détail — NLP Demo",      href: "/apps/3" },
    ],
  },
  { type: "sep" },
  {
    type: "sub", label: "Studio", icon: "🛠", key: "studio",
    children: [
      { label: "Accueil Studio",  href: "/studio" },
      { label: "Excel → Quiz",    href: "/studio/excel-quiz" },
      { label: "Vidéo → Cours",   href: "/studio/video-course" },
    ],
  },
  {
    type: "sub", label: "LMS", icon: "📊", key: "lms",
    children: [
      { label: "Liste des cohortes", href: "/lms" },
      { label: "Cohorte (détail)",   href: "/lms/1" },
    ],
  },
  { type: "link", label: "Administration", icon: "👑", href: "/admin", tag: "admin" },
  { type: "sep" },
  {
    type: "sub", label: "Compte & Auth", icon: "👤", key: "auth",
    children: [
      { label: "Mon Profil",           href: "/profile" },
      { label: "Connexion",            href: "/login" },
      { label: "Compléter le profil",  href: "/complete-profile" },
      { label: "Confidentialité",      href: "/privacy" },
      { label: "CGU",                  href: "/cgu" },
      { label: "Vérification email",   href: "/verify-email" },
    ],
  },
];

// ─── SiteMapDropdown ──────────────────────────────────────────────────────────
/**
 * Bouton "🗺 Toutes les pages" — navigation complète de la maquette.
 *
 * Toujours visible, indépendamment de l'état d'authentification.
 * Placé après le bouton Connexion / menu utilisateur dans la barre.
 *
 * Structure à 2 niveaux :
 *   Niveau 1 — panneau principal (clic sur le bouton)
 *     - Items `"link"` : lien direct
 *     - Items `"sub"`  : déclenche le sous-panneau au survol
 *     - Items `"sep"`  : séparateur visuel
 *   Niveau 2 — sous-panneau latéral (survol d'un item `"sub"`)
 *     - Apparaît à droite du panneau principal
 *     - Disparaît quand la souris quitte les deux panneaux
 *
 * Anti-flicker (setTimeout 120 ms) :
 *   Quand la souris passe du panneau principal vers le sous-panneau,
 *   il y a un micro-intervalle où elle n'est sur aucun des deux.
 *   Sans délai, `activeSub` serait remis à `null` puis recalculé,
 *   ce qui produirait un clignotement. Le timer est annulé si la souris
 *   entre dans le sous-panneau avant expiration.
 *
 * Fermeture :
 *   - Clic sur le backdrop transparent (z-[185], couvre tout l'écran)
 *   - Changement de route (useEffect sur pathname)
 *   - Clic sur n'importe quel lien dans les panneaux (appel à closeAll)
 */
function SiteMapDropdown() {
  const pathname = usePathname();

  /** `true` quand le panneau niveau-1 est visible */
  const [isOpen, setIsOpen] = useState(false);

  /**
   * Clé de l'item `"sub"` actuellement survolé (null = sous-panneau fermé).
   * Correspond au champ `key` dans SITE_MAP.
   */
  const [activeSub, setActiveSub] = useState<string | null>(null);

  /** Coordonnées (fixed) du panneau niveau-1, calculées au clic */
  const [panelPos, setPanelPos] = useState({ top: 72, left: 0 });

  /** Coordonnées (fixed) du sous-panneau niveau-2, calculées au survol */
  const [subPos, setSubPos] = useState({ top: 0, left: 0 });

  const buttonRef      = useRef<HTMLButtonElement>(null);

  /**
   * Référence vers le timer d'anti-flicker.
   * `useRef` (et non `useState`) car on n'a pas besoin de re-rendu
   * lors de sa mise à jour.
   */
  const closeSubTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fermeture automatique au changement de route ──
  useEffect(() => {
    setIsOpen(false);
    setActiveSub(null);
  }, [pathname]);

  /**
   * Bascule l'ouverture/fermeture du panneau niveau-1.
   * - À l'ouverture : calcule la position en tenant compte des bords du viewport
   *   pour ne pas déborder à droite.
   * - À la fermeture : réinitialise aussi le sous-panneau actif.
   */
  function handleToggle() {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // Clamp gauche : si le panneau (largeur 224px = w-56) dépasse le bord droit
      // du viewport, on le recule (248 = 224 + 24px de marge de sécurité).
      const left = Math.min(rect.left, window.innerWidth - 248);
      setPanelPos({ top: rect.bottom + 6, left });
    }
    setIsOpen((o) => !o);
    setActiveSub(null);
  }

  /**
   * Déclenché quand la souris entre sur un item `"sub"` du panneau niveau-1.
   * - Annule le timer de fermeture si actif (cas : retour depuis le sous-panneau)
   * - Calcule la position du sous-panneau (aligné sur le bord droit de l'item,
   *   avec clamp pour ne pas dépasser le viewport)
   *
   * @param key - Identifiant de l'item (`SiteMapItem.key`)
   * @param el  - Élément DOM de l'item, pour lire son BoundingClientRect
   */
  function handleItemEnter(key: string, el: HTMLDivElement) {
    if (closeSubTimer.current) clearTimeout(closeSubTimer.current);
    setActiveSub(key);
    const rect    = el.getBoundingClientRect();
    // Clamp droit : sous-panneau largeur 240px (w-60) + 4px de gap
    const subLeft = Math.min(rect.right + 4, window.innerWidth - 236);
    setSubPos({ top: rect.top, left: subLeft });
  }

  /**
   * La souris quitte le panneau niveau-1 vers une zone extérieure.
   * Lance le timer : si la souris n'entre pas dans le sous-panneau
   * dans les 120 ms, ferme le sous-panneau.
   */
  function handleMainLeave() {
    closeSubTimer.current = setTimeout(() => setActiveSub(null), 120);
  }

  /**
   * La souris entre dans le sous-panneau niveau-2.
   * Annule le timer lancé par handleMainLeave → garde le sous-panneau ouvert.
   */
  function handleSubEnter() {
    if (closeSubTimer.current) clearTimeout(closeSubTimer.current);
  }

  /**
   * La souris quitte le sous-panneau vers une zone extérieure.
   * Lance le timer : ferme le sous-panneau après 120 ms.
   */
  function handleSubLeave() {
    closeSubTimer.current = setTimeout(() => setActiveSub(null), 120);
  }

  /**
   * Ferme tout (panneau + sous-panneau).
   * Appelé par : clic backdrop, clic sur un lien, changement de route.
   */
  function closeAll() {
    setIsOpen(false);
    setActiveSub(null);
  }

  /**
   * Enfants de l'item `"sub"` actuellement actif.
   * - Recherche dans SITE_MAP avec type guard TypeScript pour affiner à `{ type: "sub" }`
   * - Retourne [] si aucun item actif (évite le rendu du sous-panneau vide)
   */
  const activeChildren = activeSub
    ? (
        SITE_MAP
          .find((i): i is Extract<SiteMapItem, { type: "sub" }> =>
            i.type === "sub" && i.key === activeSub
          )
          ?.children ?? []
      )
    : [];

  return (
    <>
      {/*
       * Backdrop transparent.
       * Rendu uniquement quand le panneau est ouvert.
       * Couvre tout l'écran (inset-0) en z-[185], soit sous les panneaux
       * mais au-dessus du header (z-[160]).
       * Un clic sur ce backdrop appelle closeAll.
       */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[185]"
          onClick={closeAll}
          aria-hidden="true" // masqué aux lecteurs d'écran (décoration pure)
        />
      )}

      {/* ── Bouton déclencheur ── */}
      <button
        ref={buttonRef}
        onClick={handleToggle}
        title="Accéder à toutes les pages de la maquette"
        className={clsx(
          "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap shrink-0",
          // Branche ouvert : fond sombre pour indiquer l'état actif
          // Branche fermé  : bordure pointillée grise pour le distinguer
          //                  des éléments de navigation principale
          isOpen
            ? "bg-gray-900 text-white border-gray-900"
            : "border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50"
        )}
      >
        <span>🗺</span>
        {/* Texte masqué sur très petits écrans (< sm) pour économiser l'espace */}
        <span className="hidden sm:inline">Toutes les pages</span>
        {/* Chevron : tourne à 180° quand ouvert */}
        <svg
          className={clsx("w-3 h-3 transition-transform opacity-60", isOpen && "rotate-180")}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* ═══════════════════════════════════════════════════════════════════
          Niveau 1 — Panneau principal
          Rendu conditionnel : uniquement si isOpen === true
          Position : fixed, calculée dans handleToggle
      ═══════════════════════════════════════════════════════════════════ */}
      {isOpen && (
        <div
          style={{ position: "fixed", top: panelPos.top, left: panelPos.left }}
          className="w-56 bg-white border border-gray-200 rounded-2xl shadow-2xl z-[200] py-1.5"
          onMouseLeave={handleMainLeave} // lance le timer de fermeture du sous-panneau
        >
          {/* En-tête du panneau niveau-1 */}
          <div className="px-4 pt-2 pb-2.5 border-b border-gray-100 mb-1">
            <p className="text-xs font-bold text-gray-900 uppercase tracking-wider">Plan du site</p>
            <p className="text-xs text-gray-400 mt-0.5">Navigation maquette</p>
          </div>

          {/*
           * Itération sur SITE_MAP.
           * Switch sur `item.type` avec 3 branches :
           *   "sep"  → séparateur horizontal
           *   "link" → lien cliquable direct
           *   "sub"  → entrée avec chevron, déclenche le sous-panneau
           */}
          {SITE_MAP.map((item, idx) => {

            // ── Branche "sep" : séparateur visuel ──
            if (item.type === "sep") {
              return <div key={idx} className="h-px bg-gray-100 my-1 mx-3" />;
            }

            // ── Branche "link" : lien direct ──
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
                  {/* Badge optionnel (ex : "admin") affiché à droite si défini */}
                  {item.tag && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">
                      {item.tag}
                    </span>
                  )}
                </Link>
              );
            }

            // ── Branche "sub" : entrée avec sous-panneau ──
            // `isActive` : true si ce sous-panneau est actuellement affiché
            const isActive = activeSub === item.key;
            return (
              <div
                key={item.key}
                // Au survol : ouvre le sous-panneau correspondant et calcule sa position
                onMouseEnter={(e) => handleItemEnter(item.key, e.currentTarget)}
                className={clsx(
                  "flex items-center justify-between gap-2 px-3 py-2 mx-1 rounded-xl cursor-pointer transition-colors",
                  // Branche actif : fond primaire si ce sous-panneau est ouvert
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-gray-50 text-gray-700"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base w-5 text-center">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {/* Chevron droit : indique qu'un sous-panneau est disponible */}
                <svg className="w-3.5 h-3.5 opacity-40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          Niveau 2 — Sous-panneau latéral
          Conditions de rendu (toutes doivent être vraies) :
            1. Le panneau niveau-1 est ouvert (isOpen)
            2. Un item "sub" est survolé (activeSub !== null)
            3. Cet item a au moins un enfant (activeChildren.length > 0)
          Position : fixed, alignée sur l'item survolé (calculée dans handleItemEnter)
          z-[210] : au-dessus du panneau niveau-1 (z-[200])
      ═══════════════════════════════════════════════════════════════════ */}
      {isOpen && activeSub && activeChildren.length > 0 && (
        <div
          style={{ position: "fixed", top: subPos.top, left: subPos.left }}
          className="w-60 bg-white border border-gray-200 rounded-2xl shadow-2xl z-[210] py-1.5"
          onMouseEnter={handleSubEnter} // annule le timer de fermeture
          onMouseLeave={handleSubLeave} // relance le timer de fermeture
        >
          {/* En-tête du sous-panneau : reprend le label de l'item parent */}
          <div className="px-4 pt-2 pb-2 border-b border-gray-100 mb-1">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {
                /* Retrouve le label de l'item actif via le même type guard TypeScript */
                SITE_MAP
                  .find((i): i is Extract<SiteMapItem, { type: "sub" }> =>
                    i.type === "sub" && i.key === activeSub
                  )
                  ?.label
              }
            </p>
          </div>

          {/* Liste des liens enfants */}
          {activeChildren.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              onClick={closeAll}
              className="flex items-center justify-between gap-2 px-3 py-2 mx-1 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <span className="text-sm text-gray-700 group-hover:text-gray-900 leading-tight">
                {child.label}
              </span>
              {/* Badge optionnel (ex : marqueur de rôle requis) */}
              {child.tag && (
                <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                  {child.tag}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

// ─── Nav (composant principal exporté) ───────────────────────────────────────
/**
 * Barre de navigation principale, sticky en haut de toutes les pages platform.
 *
 * Layout (gauche → droite) :
 *   Logo | Insights | [Learning AI] [Learning With AI] [Learning at the Edge]
 *   Mon parcours | [Studio LMS]? | [Admin]? | FR/EN | [Connexion / UserMenu] | 🗺
 *
 * Visibilité conditionnelle des entrées :
 *   - Studio + LMS : visibles si `user.role` ∈ {teacher, admin, superuser}
 *   - Admin        : visible si `user.role` ∈ {admin, superuser}
 *   - Bouton "Connexion" : affiché si pas de session (`user === null`)
 *   - Menu utilisateur   : affiché si session active (`user !== null`)
 *   - "Toutes les pages" : TOUJOURS visible (maquette démonstration)
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

  /**
   * `true` si l'utilisateur a un rôle d'enseignant ou supérieur.
   * Conditionne l'affichage des liens Studio et LMS dans la nav.
   */
  const isTeacher = user && ["teacher", "admin", "superuser"].includes(user.role);

  /**
   * `true` si l'utilisateur a un rôle administrateur ou superuser.
   * Conditionne l'affichage du lien Admin dans la nav et dans le menu utilisateur.
   */
  const isAdmin = user && ["admin", "superuser"].includes(user.role);

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

            {/* 3 dropdowns Learning — itération sur LEARNING_SECTIONS */}
            {LEARNING_SECTIONS.map((section) => (
              <NavDropdown
                key={section.slug}
                {...section}
                isOpen={openDropdown === section.slug}
                onToggle={handleDropdownToggle}
              />
            ))}

            {/* Lien direct Mon parcours */}
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

            {/*
             * Branche enseignant : Studio + LMS
             * Visibles uniquement pour les rôles teacher, admin, superuser.
             * Un séparateur visuel précède ces liens pour les distinguer
             * des liens "étudiants".
             */}
            {isTeacher && (
              <>
                <div className="w-px h-5 bg-gray-200 mx-1 shrink-0" />
                <Link href="/studio" className={clsx(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                  pathname.startsWith("/studio")
                    ? "bg-danger/10 text-danger font-semibold"
                    : "text-gray-600 hover:text-danger hover:bg-danger/5"
                )}>
                  {t.nav.studio}
                </Link>
                <Link href="/lms" className={clsx(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                  pathname.startsWith("/lms")
                    ? "bg-danger/10 text-danger font-semibold"
                    : "text-gray-600 hover:text-danger hover:bg-danger/5"
                )}>
                  {t.nav.lms}
                </Link>
              </>
            )}

            {/*
             * Branche admin : lien Administration
             * Visible uniquement pour les rôles admin et superuser.
             */}
            {isAdmin && (
              <Link href="/admin" className={clsx(
                "px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                pathname.startsWith("/admin")
                  ? "bg-purple-100 text-purple-700 font-semibold"
                  : "text-gray-600 hover:text-purple-700 hover:bg-purple-50"
              )}>
                {t.nav.admin}
              </Link>
            )}
          </nav>

          {/* ── Zone droite : langue + auth + plan du site ── */}
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
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  {/* Nom et email masqués sur mobile (< sm) */}
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-semibold text-gray-900 leading-none">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
                  </div>
                  <Avatar name={`${user.first_name} ${user.last_name}`} size="sm" />
                  {/* Badge de rôle avec style conditionnel selon roleChip */}
                  <span className={clsx(
                    "text-xs font-semibold px-2 py-0.5 rounded-full hidden sm:inline",
                    // Fallback sur "student" si le rôle n'est pas dans le mapping
                    roleChip[user.role] ?? roleChip.student
                  )}>
                    {/* Traduction du rôle, fallback sur la valeur brute */}
                    {t.roles[user.role as keyof typeof t.roles] ?? user.role}
                  </span>
                </button>

                {/* Panneau du menu utilisateur (position absolute car dans un relative) */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-[200]">
                    {/* En-tête avec nom + email */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{user.email}</p>
                    </div>

                    {/* Liens communs à tous les utilisateurs connectés */}
                    <Link href="/profile"     onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">{t.nav.profile}</Link>
                    <Link href="/my-learning" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">{t.nav.myLearning}</Link>

                    {/* Branche admin : lien Administration dans le menu utilisateur */}
                    {isAdmin && (
                      <Link href="/admin" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">
                        {t.nav.administration}
                      </Link>
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

            {/*
             * Plan du site — TOUJOURS visible, après le bouton Connexion.
             * Placé en dernier dans la zone droite conformément à la demande :
             * "après le bouton connexion".
             * Fournit un accès à toutes les pages de la maquette sans authentification.
             */}
            <SiteMapDropdown />

          </div>
        </div>
      </header>
    </>
  );
}
