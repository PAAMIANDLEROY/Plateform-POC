import { SectionCatalogue } from "@/components/platform/SectionCatalogue";

export default function Page() {
  return (
    <SectionCatalogue
      section={{ label: "Learning With AI", slug: "learning-with-ai", description: "Apprendre en utilisant l'IA comme outil", color: "primary" }}
      activeModule="tube"
    />
  );
}
