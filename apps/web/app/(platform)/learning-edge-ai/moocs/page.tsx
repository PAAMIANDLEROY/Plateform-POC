import { SectionCatalogue } from "@/components/platform/SectionCatalogue";

export default function Page() {
  return (
    <SectionCatalogue
      section={{ label: "Learning at the Edge of AI", slug: "learning-edge-ai", description: "Frontières et enjeux de l'IA", color: "primary" }}
      activeModule="moocs"
    />
  );
}
