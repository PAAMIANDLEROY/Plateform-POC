import { VideoPageClient } from "./VideoPageClient";

export default function VideoPage({ params }: { params: { id: string } }) {
  return <VideoPageClient id={params.id} />;
}
