/**
 * @file contentRegistry.ts
 * @description Registre des blocs de texte éditables de la plateforme.
 *
 * Sert au panneau « Contenu » de l'admin pour lister/éditer tous les blocs, y compris
 * ceux jamais encore modifiés (qui n'existent pas en base). Quand on rend un nouveau
 * texte éditable avec <EditableBlock> / <EditableLink>, on ajoute sa clé ici.
 */

export interface RegistryEntry {
  key: string;
  label: string;
  group: string;
  fallback: string;
  multiline?: boolean;
  type?: "text" | "url";
}

export const CONTENT_REGISTRY: RegistryEntry[] = [
  // NeuriPP
  { key: "neuripp.title", group: "NeuriPP", label: "Titre", fallback: "Appel à soumissions — Outils EdTech" },
  { key: "neuripp.intro", group: "NeuriPP", label: "Introduction", multiline: true,
    fallback: "Les étudiants développent une infinité d'outils pédagogiques. L'objectif de ce track est de les mettre en commun et de créer une base sur laquelle itérer collectivement." },
  { key: "neuripp.note", group: "NeuriPP", label: "Note", multiline: true,
    fallback: "Soumettez votre projet : dépôt GitHub, page de présentation, démo et licence. Ouvert en priorité aux étudiants Hi! PARIS." },

  // Footer
  { key: "footer.hiparis.label", group: "Footer", label: "Lien hi-paris.fr — libellé", fallback: "hi-paris.fr ↗" },
  { key: "footer.hiparis.url", group: "Footer", label: "Lien hi-paris.fr — URL", type: "url", fallback: "https://hi-paris.fr" },
];
