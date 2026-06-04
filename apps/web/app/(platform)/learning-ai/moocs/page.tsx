import { SectionCatalogue } from "@/components/platform/SectionCatalogue";

export default function Page() {
  return (
    <SectionCatalogue
      section={{ label: "Learning AI", slug: "learning-ai", description: "Fondamentaux et recherche en IA", color: "primary" }}
      activeModule="moocs"
    />
  );
}
