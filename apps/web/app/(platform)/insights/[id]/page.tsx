import { InsightDetailClient } from "./InsightDetailClient";

export default function InsightPage({ params }: { params: { id: string } }) {
  return <InsightDetailClient id={params.id} />;
}
