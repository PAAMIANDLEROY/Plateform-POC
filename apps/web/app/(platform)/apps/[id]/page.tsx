import { AppPageClient } from "./AppPageClient";

/**
 * Stub pour output: 'export' — Next.js refuse [] vide.
 * Les vrais IDs sont résolus côté client par AppPageClient.
 */
export function generateStaticParams() {
  return [{ id: '_' }];
}

export default function AppPage({ params }: { params: { id: string } }) {
  return <AppPageClient id={params.id} />;
}
