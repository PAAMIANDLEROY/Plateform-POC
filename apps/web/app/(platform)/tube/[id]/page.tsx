import { VideoPageClient } from "./VideoPageClient";

/** Pas de pré-génération : les IDs sont des UUIDs créés via l'API. */
export function generateStaticParams() {
  return [];
}

export default function VideoPage({ params }: { params: { id: string } }) {
  return <VideoPageClient id={params.id} />;
}
