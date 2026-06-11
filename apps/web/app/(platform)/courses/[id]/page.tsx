import { CoursePageClient } from "./CoursePageClient";

/**
 * Stub pour output: 'export' — Next.js refuse [] vide.
 * Les vrais IDs sont résolus côté client par CoursePageClient.
 */
export function generateStaticParams() {
  return [{ id: '_' }];
}

export default function CoursePage({ params }: { params: { id: string } }) {
  return <CoursePageClient id={params.id} />;
}
