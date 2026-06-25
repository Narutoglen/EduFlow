// Server-only: resolve the AI Principal from the EduFlow session and enrich AI requests with
// LMS-owned content. The ai-service stays loosely coupled and never reads the LMS DB directly.
import "server-only";

import { prisma } from "./prisma";
import { getCurrentUser } from "./session";
import type { Principal } from "./ai-client";

export async function getCurrentPrincipal(): Promise<Principal | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const [enrollments, ownedCourses, assistedCourses] = await Promise.all([
    prisma.enrollment.findMany({
      where: { studentId: user.id },
      select: { courseId: true },
    }),
    user.role === "LECTURER" || user.role === "ADMIN"
      ? prisma.course.findMany({
          where: user.role === "ADMIN" ? { deletedAt: null } : { lecturerId: user.id, deletedAt: null },
          select: { id: true },
        })
      : Promise.resolve([]),
    user.role === "TA"
      ? prisma.courseAssistant.findMany({
          where: { userId: user.id },
          select: { courseId: true },
        })
      : Promise.resolve([]),
  ]);

  return {
    userId: user.id,
    role: user.role,
    enrolledCourseIds: enrollments.map((enrollment) => enrollment.courseId),
    ownedCourseIds: [
      ...ownedCourses.map((course) => course.id),
      ...assistedCourses.map((course) => course.courseId),
    ],
  };
}

export type LessonContent = {
  courseId: string;
  title: string;
  content: string;
};

/** Find a lesson and return its course id, title, and text body for AI enrichment. */
export async function resolveLessonContent(lessonId: string): Promise<LessonContent | null> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { select: { courseId: true } } },
  });
  if (!lesson) return null;
  return { courseId: lesson.module.courseId, title: lesson.title, content: lesson.content };
}

export type CourseLesson = { lessonId: string; title: string; content: string };

/** All lessons for a course (for RAG ingestion); empty if the course is unknown. */
export async function getCourseLessons(courseId: string): Promise<CourseLesson[]> {
  const lessons = await prisma.lesson.findMany({
    where: { module: { courseId, course: { deletedAt: null } } },
    orderBy: [{ module: { order: "asc" } }, { order: "asc" }],
  });
  return lessons.map((lesson) => ({
    lessonId: lesson.id,
    title: lesson.title,
    content: lesson.content,
  }));
}

/** lessonId -> title map for a course (so RAG citations carry human titles). */
export async function getCourseLessonTitles(courseId: string): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  for (const lesson of await getCourseLessons(courseId)) map[lesson.lessonId] = lesson.title;
  return map;
}
