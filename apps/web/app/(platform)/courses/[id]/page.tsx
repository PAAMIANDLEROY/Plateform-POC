import { CoursePageClient } from "./CoursePageClient";

export default function CoursePage({ params }: { params: { id: string } }) {
  return <CoursePageClient id={params.id} />;
}
