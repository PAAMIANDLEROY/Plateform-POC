import { MOCK_COURSES } from "@/lib/mock";
import { CoursePageClient } from "./CoursePageClient";

export function generateStaticParams() {
  return MOCK_COURSES.map((c) => ({ id: c.id }));
}

export default function CoursePage({ params }: { params: { id: string } }) {
  const course = MOCK_COURSES.find((c) => c.id === params.id) ?? MOCK_COURSES[0];
  return <CoursePageClient course={course} />;
}
