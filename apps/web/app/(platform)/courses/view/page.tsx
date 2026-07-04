/**
 * @file (platform)/courses/view/page.tsx
 * @description Visualiseur de cours par id en query string : `/courses/view?id=<uuid>`.
 *
 * Route STATIQUE (aucun segment dynamique) → compatible `output: "export"`, contrairement à
 * `/courses/[id]` qui ne pré-génère que des ids connus. Idéal pour les cours créés via Studio
 * (ids UUID). Réutilise le même rendu que la page de détail.
 */
"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CoursePageClient } from "../[id]/CoursePageClient";

function ViewInner() {
  const id = useSearchParams().get("id");
  if (!id) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center bg-navy min-h-screen">
        <p className="text-white text-lg font-semibold mb-2">Aucun cours sélectionné</p>
        <Link href="/learning-ai/courses" className="text-primary hover:underline text-sm">← Retour au catalogue</Link>
      </div>
    );
  }
  return <CoursePageClient id={id} />;
}

export default function CourseViewPage() {
  return (
    <Suspense fallback={null}>
      <ViewInner />
    </Suspense>
  );
}
