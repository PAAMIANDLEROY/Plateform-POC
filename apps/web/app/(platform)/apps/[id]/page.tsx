import { AppPageClient } from "./AppPageClient";

export default function AppPage({ params }: { params: { id: string } }) {
  return <AppPageClient id={params.id} />;
}
