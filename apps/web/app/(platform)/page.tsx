/**
 * @file (platform)/page.tsx
 * @description Page d'accueil racine "/" de la plateforme.
 *
 * Sert le contenu du tableau de bord directement à la racine, à l'intérieur du
 * layout `(platform)` (Nav + Footer). Remplace l'ancienne redirection "/" → "/dashboard"
 * (l'ex `app/page.tsx`) : plus aucune redirection sur la page de garde.
 *
 * La route "/dashboard" reste disponible et rend le même composant.
 */

export { default } from "./dashboard/page";
