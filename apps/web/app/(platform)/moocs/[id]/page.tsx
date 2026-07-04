import { MOOCPageClient } from "./MOOCPageClient";

export default function MOOCPage({ params }: { params: { id: string } }) {
  return <MOOCPageClient id={params.id} />;
}
