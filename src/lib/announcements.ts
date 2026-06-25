import { prisma } from "./prisma";

export type LecturerAnnouncement = {
  id: string;
  title: string;
  body: string;
  startsAt: Date;
  courseTitle: string | null;
};

export type StudentAnnouncement = {
  id: string;
  title: string;
  body: string;
  startsAt: Date;
  authorName: string;
  courseTitle: string | null;
};

/** Recent announcements authored by a lecturer (newest first). */
export async function getLecturerAnnouncements(
  lecturerId: string,
): Promise<LecturerAnnouncement[]> {
  const rows = await prisma.announcement.findMany({
    where: { authorId: lecturerId },
    orderBy: { startsAt: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      body: true,
      startsAt: true,
      course: { select: { title: true } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    startsAt: row.startsAt,
    courseTitle: row.course?.title ?? null,
  }));
}

/**
 * Announcements a student should see: ones targeted at a course they're
 * enrolled in, plus untargeted announcements from the lecturers of those
 * courses. Newest first.
 */
export async function getStudentAnnouncements(
  studentId: string,
): Promise<StudentAnnouncement[]> {
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId },
    select: { course: { select: { id: true, lecturerId: true } } },
  });

  const courseIds = enrollments.map((e) => e.course.id);
  const lecturerIds = [...new Set(enrollments.map((e) => e.course.lecturerId))];
  if (courseIds.length === 0 && lecturerIds.length === 0) return [];

  const rows = await prisma.announcement.findMany({
    where: {
      OR: [
        { courseId: { in: courseIds } },
        { courseId: null, authorId: { in: lecturerIds } },
      ],
    },
    orderBy: { startsAt: "desc" },
    take: 8,
    select: {
      id: true,
      title: true,
      body: true,
      startsAt: true,
      author: { select: { name: true } },
      course: { select: { title: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    startsAt: row.startsAt,
    authorName: row.author.name,
    courseTitle: row.course?.title ?? null,
  }));
}
