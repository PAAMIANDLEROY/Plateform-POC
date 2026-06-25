import { InsightDetailClient } from "./InsightDetailClient";

/**
 * Stub pour output: 'export' — Next.js refuse un tableau vide.
 * Les vrais ids sont résolus côté client par InsightDetailClient (fetch API).
 */
export function generateStaticParams() {
  // output: 'export' ne sert que les ids générés ici → buffer large pour couvrir
  // les 4 articles seedés + les articles créés (ids séquentiels). Données chargées côté client.
  return Array.from({ length: 100 }, (_, i) => ({ id: String(i + 1) }));
}

export default function InsightPage({ params }: { params: { id: string } }) {
  return <InsightDetailClient id={params.id} />;
}
