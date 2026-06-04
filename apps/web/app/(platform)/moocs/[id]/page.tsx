import { MOCK_MOOCS } from "@/lib/mock";
import { MOOCPageClient } from "./MOOCPageClient";

export function generateStaticParams() {
  return MOCK_MOOCS.map((m) => ({ id: m.id }));
}

export default function MOOCPage({ params }: { params: { id: string } }) {
  const mooc = MOCK_MOOCS.find((m) => m.id === params.id) ?? MOCK_MOOCS[0];
  return <MOOCPageClient mooc={mooc} />;
}