import { CoursePageClient } from "./CoursePageClient";

/**
 * Stub pour output: 'export' — Next.js refuse [] vide.
 * Les vrais IDs sont résolus côté client par CoursePageClient.
 */
export function generateStaticParams() {
  // output: 'export' ne sert que les ids générés ici → buffer couvrant le
  // contenu seedé (+ marge). Les données sont chargées côté client.
  return Array.from({ length: 50 }, (_, i) => ({ id: String(i + 1) }));
}

export default function CoursePage({ params }: { params: { id: string } }) {
  return <CoursePageClient id={params.id} />;
}
