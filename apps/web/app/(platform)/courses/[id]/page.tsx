import { CoursePageClient } from "./CoursePageClient";

/** Pas de pré-génération : les IDs sont des UUIDs créés via l'API. */
export function generateStaticParams() {
  return [];
}

export default function CoursePage({ params }: { params: { id: string } }) {
  return <CoursePageClient id={params.id} />;
}
