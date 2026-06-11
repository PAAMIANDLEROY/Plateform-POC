import { VideoPageClient } from "./VideoPageClient";

/**
 * Stub pour output: 'export' — Next.js refuse [] vide.
 * Les vrais IDs sont résolus côté client par VideoPageClient.
 */
export function generateStaticParams() {
  return [{ id: '_' }];
}

export default function VideoPage({ params }: { params: { id: string } }) {
  return <VideoPageClient id={params.id} />;
}
