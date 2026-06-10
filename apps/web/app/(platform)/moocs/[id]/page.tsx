import { MOOCPageClient } from "./MOOCPageClient";

/** Pas de pré-génération : les IDs sont des UUIDs créés via l'API. */
export function generateStaticParams() {
  return [];
}

export default function MOOCPage({ params }: { params: { id: string } }) {
  return <MOOCPageClient id={params.id} />;
}
