import { InsightDetailClient } from "./InsightDetailClient";

/**
 * Stub pour output: 'export' — Next.js refuse un tableau vide.
 * Les vrais ids sont résolus côté client par InsightDetailClient (fetch API).
 */
export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function InsightPage({ params }: { params: { id: string } }) {
  return <InsightDetailClient id={params.id} />;
}
