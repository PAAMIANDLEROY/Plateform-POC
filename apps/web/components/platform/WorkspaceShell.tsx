/**
 * @file WorkspaceShell.tsx
 * @description Enveloppe le contenu des pages de l'« espace » (compte + pages à droits)
 * avec le menu latéral gauche (WorkspaceSidebar). Sur toutes les autres routes, rend
 * le contenu inchangé — aucune modification de structure ailleurs.
 */
"use client";

import { usePathname } from "next/navigation";
import { WorkspaceSidebar } from "./WorkspaceSidebar";

// Routes rattachées à l'espace « Mon profil » (menu latéral).
const WORKSPACE_ROUTES = ["/profile", "/my-learning", "/studio", "/lms", "/admin"];

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const inWorkspace = WORKSPACE_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/"),
  );

  if (!inWorkspace) return <>{children}</>;

  return (
    <div className="flex">
      <WorkspaceSidebar />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
