import { MOCK_VIDEOS } from "@/lib/mock";
import { VideoDetail } from "./VideoDetail";

export function generateStaticParams() {
  return MOCK_VIDEOS.map((v) => ({ id: v.id }));
}

export default function VideoPage({ params }: { params: { id: string } }) {
  const video = MOCK_VIDEOS.find((v) => v.id === params.id) ?? MOCK_VIDEOS[0];
  const related = MOCK_VIDEOS.filter((v) => v.id !== video.id).slice(0, 4);
  return <VideoDetail video={video} related={related} />;
}
