import { MOOCPageClient } from "./MOOCPageClient";

/**
 * Stub pour output: 'export' — Next.js refuse [] vide.
 * Les vrais IDs sont résolus côté client par MOOCPageClient.
 */
export function generateStaticParams() {
  return [{ id: '_' }];
}

export default function MOOCPage({ params }: { params: { id: string } }) {
  return <MOOCPageClient id={params.id} />;
}
