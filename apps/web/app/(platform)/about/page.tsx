/**
 * @file (platform)/about/page.tsx
 * @description « About us » — page de présentation de Hi! PARIS Education.
 *
 * Page volontairement minimale pour l'instant (« encore vide ») : titre + intro
 * en `EditableBlock` afin que les admins puissent rédiger le contenu directement
 * en ligne, sans redéploiement. Accessible depuis le menu « Hi! PARIS Education ».
 *
 * Note : le formulaire NeuriPP (appel à soumissions) vit désormais sur `/neuripp`.
 */

"use client";

import EditableBlock from "@/components/platform/EditableBlock";

export default function AboutUsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Badge de section */}
      <span className="text-xs font-semibold bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full">
        Hi! PARIS Education
      </span>

      {/* Titre + intro éditables par les admins */}
      <EditableBlock
        blockKey="about.title"
        as="h1"
        className="text-3xl font-bold text-gray-900 mt-4 mb-3"
        fallback="About us"
      />
      <EditableBlock
        blockKey="about.intro"
        as="p"
        multiline
        className="text-gray-600 leading-relaxed"
        fallback="Cette page est en cours de rédaction. Elle présentera bientôt Hi! PARIS Education, ses missions et son écosystème pédagogique."
      />

      {/* Placeholder visuel discret tant que le contenu n'est pas rédigé */}
      <div className="mt-10 bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center">
        <p className="text-sm text-gray-400">Contenu à venir.</p>
      </div>
    </div>
  );
}
