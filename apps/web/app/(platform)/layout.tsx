/**
 * @file app/(platform)/layout.tsx
 * @description Layout des pages de la plateforme — s'applique à toutes les routes du groupe `(platform)`.
 *
 * Le groupe de routes `(platform)` regroupe toutes les pages accessibles après authentification :
 * dashboard, tube, courses, moocs, apps, insights, studio, lms, admin, profile, my-learning.
 *
 * Structure :
 *   - Fond gris clair `bg-surface` (#F4F6FA) pour distinguer la plateforme des pages auth.
 *   - `flex flex-col min-h-screen` avec `main flex-1` pour que le footer reste en bas de page
 *     même sur les pages avec peu de contenu (footer "collant").
 *   - `Nav` sticky en haut (z-[160]) — gère la navigation principale et les menus déroulants.
 *   - `Footer` en bas — liens plateforme + informations légales.
 *
 * Note : Ce layout ne protège PAS les routes par authentification.
 * La protection est assurée individuellement par chaque page via `useAuth()`.
 */

import { Nav } from "@/components/platform/Nav";
import { Footer } from "@/components/platform/Footer";

/**
 * Layout wrapper pour toutes les pages de la plateforme.
 *
 * @param children - Page rendue par Next.js App Router pour la route courante.
 */
export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    // flex flex-col + min-h-screen : garantit que le footer reste en bas même sur page courte
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Barre de navigation sticky — z-[160] défini dans Nav.tsx */}
      <Nav />
      {/* Zone de contenu principale — flex-1 pour pousser le footer en bas */}
      <main className="flex-1">{children}</main>
      {/* Pied de page — liens plateforme, légaux et copyright */}
      <Footer />
    </div>
  );
}
