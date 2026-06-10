import { AppPageClient } from "./AppPageClient";

/** Pas de pré-génération : les IDs sont des UUIDs créés via l'API. */
export function generateStaticParams() {
  return [];
}

export default function AppPage({ params }: { params: { id: string } }) {
  return <AppPageClient id={params.id} />;
}
