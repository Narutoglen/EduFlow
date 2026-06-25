import "server-only";
import { prisma } from "./prisma";
import { canGrade, type Principalish } from "./grading-rules";

// Object-level authorization against the database. Every identifier that arrives
// from a URL or request body (courseId, submissionId, certificate id, ...) must
// be checked against the authenticated principal here before it is acted on.
// This is what stops a user from swapping an id in the URL to reach data that
// isn't theirs (OWASP A01: Broken Access Control / IDOR). The pure decision rule
// lives in ./grading-rules so it can be unit-tested without a database.

/** True if the student has an enrollment row for this course. */
export async function isEnrolled(studentId: string, courseId: string): Promise<boolean> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
    select: { id: true },
  });
  return enrollment !== null;
}

/** DB-backed variant of {@link canGrade}: loads ownership/assistants for a course id. */
export async function canGradeCourseId(
  user: Principalish,
  courseId: string,
): Promise<boolean> {
  if (user.role === "STUDENT") return false;
  if (user.role === "ADMIN") {
    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } });
    return course !== null;
  }
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { lecturerId: true, assistants: { select: { userId: true } } },
  });
  if (!course) return false;
  return canGrade(user, {
    lecturerId: course.lecturerId,
    assistantIds: course.assistants.map((a) => a.userId),
  });
}

/** Course ids a staff member may grade/manage — for scoping list queries. */
export async function gradableCourseIds(user: Principalish): Promise<string[]> {
  if (user.role === "ADMIN") {
    const all = await prisma.course.findMany({ select: { id: true } });
    return all.map((c) => c.id);
  }
  if (user.role === "LECTURER") {
    const owned = await prisma.course.findMany({
      where: { lecturerId: user.id },
      select: { id: true },
    });
    return owned.map((c) => c.id);
  }
  if (user.role === "TA") {
    const assisted = await prisma.courseAssistant.findMany({
      where: { userId: user.id },
      select: { courseId: true },
    });
    return assisted.map((a) => a.courseId);
  }
  return [];
}
