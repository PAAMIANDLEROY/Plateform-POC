import { MOCK_COHORTS, MOCK_STUDENTS, MOCK_COURSES } from "@/lib/mock";
import { CohortDetail } from "./CohortDetail";

export function generateStaticParams() {
  return MOCK_COHORTS.map((c) => ({ id: c.id }));
}

export default function CohortPage({ params }: { params: { id: string } }) {
  const cohort = MOCK_COHORTS.find((c) => c.id === params.id) ?? MOCK_COHORTS[0];
  const students = MOCK_STUDENTS.filter((s) => s.cohortId === cohort.id);
  const assignedCourses = MOCK_COURSES.filter((c) =>
    cohort.assignedCourseIds.includes(c.id)
  ).map((c) => ({ id: c.id, title: c.title }));

  return <CohortDetail cohort={cohort} students={students} assignedCourses={assignedCourses} />;
}
