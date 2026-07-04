/**
 * @file WorkspaceSidebar.tsx
 * @description Menu latéral de l'espace « Mon profil » (compte + pages à droits dédiés).
 *
 * Affiché à gauche sur les routes de l'espace (voir WorkspaceShell). Style inspiré d'un
 * dashboard : sections en capitales + une page par ligne (icône + libellé), état actif surligné.
 * Les sections Enseignant / Administration sont masquées selon le rôle.
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useAuth } from "@/lib/auth";

type Item = { label: string; href: string; icon: string };
type Section = { title: string; items: Item[] };

const TEACHER_ROLES = ["teacher", "admin", "super_admin"];
const ADMIN_ROLES = ["admin", "super_admin"];

export function WorkspaceSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = user?.role ?? "public";

  const sections: Section[] = [
    {
      title: "Compte",
      items: [
        { label: "Mon profil", href: "/profile", icon: "👤" },
        { label: "Mon parcours", href: "/my-learning", icon: "🎓" },
      ],
    },
  ];

  if (TEACHER_ROLES.includes(role)) {
    sections.push({
      title: "Enseignant",
      items: [
        { label: "Hi! Studio", href: "/studio", icon: "🎬" },
        { label: "Cohortes (LMS)", href: "/lms", icon: "👥" },
      ],
    });
  }
  if (ADMIN_ROLES.includes(role)) {
    sections.push({
      title: "Administration",
      items: [{ label: "Administration", href: "/admin", icon: "🛡️" }],
    });
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside className="hidden md:flex md:flex-col w-56 shrink-0 border-r border-gray-200 bg-white">
      <div className="px-4 py-5 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {user ? `${user.first_name} ${user.last_name}`.trim() || "Mon espace" : "Mon espace"}
        </p>
        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {sections.map((section) => (
          <div key={section.title} className="mb-4">
            <p className="px-4 mb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              {section.title}
            </p>
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-2.5 px-4 py-2 text-sm transition-colors border-l-2",
                  isActive(item.href)
                    ? "border-primary bg-primary/5 text-primary font-medium"
                    : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
