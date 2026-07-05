import { withDbFallback } from "./db-fallback";
import { getCoursesForLecturer } from "./eduflow";
import { enrollments as seedEnrollments } from "./mock-data";
import { prisma } from "./prisma";

// Read-side data access for the lecturer workspace. These queries hit Postgres
// directly (course content now lives in the DB, not the mock store). When
// Postgres is unavailable they degrade to the seeded catalog so the workspace
// still renders for an offline demo.

export type LecturerLesson = {
  id: string;
  title: string;
  durationMinutes: number;
  order: number;
};

export type LecturerModule = {
  id: string;
  title: string;
  order: number;
  lessons: LecturerLesson[];
};

export type LecturerCourse = {
  id: string;
  slug: string;
  title: string;
  status: string;
  priceCents: number;
  moduleCount: number;
  lessonCount: number;
  enrollmentCount: number;
  averageCompletion: number;
  modules: LecturerModule[];
};

export type LecturerStats = {
  courseCount: number;
  enrollmentCount: number;
  revenueCents: number;
  toGrade: number;
};

/** All courses owned by a lecturer, newest first, with module/lesson/enrollment rollups. */
export async function getLecturerCourses(lecturerId: string): Promise<LecturerCourse[]> {
  return withDbFallback(
    "lecturer courses",
    () => getLecturerCoursesFromDb(lecturerId),
    () => getLecturerCoursesFromSeed(lecturerId),
  );
}

async function getLecturerCoursesFromDb(lecturerId: string): Promise<LecturerCourse[]> {
  const courses = await prisma.course.findMany({
    where: { lecturerId },
    orderBy: [{ createdAt: "desc" }],
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            select: { id: true, title: true, durationMinutes: true, order: true },
          },
        },
      },
      enrollments: { select: { progressPercent: true } },
    },
  });

  return courses.map((course) => {
    const enrollmentCount = course.enrollments.length;
    const averageCompletion = enrollmentCount
      ? Math.round(
          course.enrollments.reduce((total, e) => total + e.progressPercent, 0) /
            enrollmentCount,
        )
      : 0;
    const lessonCount = course.modules.reduce(
      (total, m) => total + m.lessons.length,
      0,
    );
    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      status: course.status,
      priceCents: course.priceCents,
      moduleCount: course.modules.length,
      lessonCount,
      enrollmentCount,
      averageCompletion,
      modules: course.modules.map((m) => ({
        id: m.id,
        title: m.title,
        order: m.order,
        lessons: m.lessons,
      })),
    };
  });
}

/** Seeded-catalog variant of {@link getLecturerCourses} for offline demos. */
function getLecturerCoursesFromSeed(lecturerId: string): LecturerCourse[] {
  return getCoursesForLecturer(lecturerId).map((course) => {
    const courseEnrollments = seedEnrollments.filter((e) => e.courseId === course.id);
    const enrollmentCount = courseEnrollments.length;
    const averageCompletion = enrollmentCount
      ? Math.round(
          courseEnrollments.reduce((total, e) => total + e.progressPercent, 0) /
            enrollmentCount,
        )
      : 0;
    const lessonCount = course.modules.reduce((total, m) => total + m.lessons.length, 0);
    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      status: course.status,
      priceCents: course.priceCents,
      moduleCount: course.modules.length,
      lessonCount,
      enrollmentCount,
      averageCompletion,
      modules: course.modules.map((m) => ({
        id: m.id,
        title: m.title,
        order: m.order,
        lessons: m.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          durationMinutes: l.durationMinutes,
          order: l.order,
        })),
      })),
    };
  });
}

/** Headline stats for the lecturer dashboard, derived from their courses + DB. */
export async function getLecturerStats(
  lecturerId: string,
  courses: LecturerCourse[],
): Promise<LecturerStats> {
  const enrollmentCount = courses.reduce((total, c) => total + c.enrollmentCount, 0);
  const revenueCents = courses.reduce(
    (total, c) => total + c.enrollmentCount * c.priceCents,
    0,
  );
  const toGrade = await withDbFallback(
    "lecturer submissions to grade",
    () =>
      prisma.assignmentSubmission.count({
        where: { status: "SUBMITTED", assignment: { course: { lecturerId } } },
      }),
    () => 0,
  );

  return {
    courseCount: courses.length,
    enrollmentCount,
    revenueCents,
    toGrade,
  };
}
