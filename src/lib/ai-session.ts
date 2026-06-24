// Server-only: resolve the AI Principal from the EduFlow session and enrich AI requests with the
// LMS content the web app owns (the ai-service stays loosely coupled and never reads the LMS DB).
import "server-only";
import { NextResponse } from "next/server";

import { courses } from "./mock-data";
import { getLessons } from "./eduflow";
import { prisma } from "./prisma";
import { getSessionUser } from "./session";
import type { Principal } from "./ai-client";

// Resolve the AI Principal from the AUTHENTICATED session (httpOnly cookie) and
// the database — never from a client-supplied role. The minted service token
// carries these enrolled/owned course ids, so the ai-service can scope retrieval
// and ownership to exactly what this user may see (anti-IDOR). Returns null when
// no valid session is present.
export async function getCurrentPrincipal(): Promise<Principal | null> {
  const user = await getSessionUser();
  if (!user) return null;

  let enrolledCourseIds: string[] = [];
  let ownedCourseIds: string[] = [];

  if (user.role === "STUDENT") {
    const rows = await prisma.enrollment.findMany({
      where: { studentId: user.id },
      select: { courseId: true },
    });
    enrolledCourseIds = rows.map((r) => r.courseId);
  } else if (user.role === "LECTURER") {
    const rows = await prisma.course.findMany({
      where: { lecturerId: user.id },
      select: { id: true },
    });
    ownedCourseIds = rows.map((r) => r.id);
  } else if (user.role === "TA") {
    const rows = await prisma.courseAssistant.findMany({
      where: { userId: user.id },
      select: { courseId: true },
    });
    ownedCourseIds = rows.map((r) => r.courseId);
  } else if (user.role === "ADMIN") {
    const rows = await prisma.course.findMany({ select: { id: true } });
    ownedCourseIds = rows.map((r) => r.id);
  }

  return { userId: user.id, role: user.role, enrolledCourseIds, ownedCourseIds };
}

/**
 * Require an authenticated AI principal. Returns the `Principal`, or a 401
 * `NextResponse` the route should return immediately when no session is present.
 */
export async function requireAiPrincipal(): Promise<Principal | NextResponse> {
  const principal = await getCurrentPrincipal();
  if (!principal) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in required." } },
      { status: 401 },
    );
  }
  return principal;
}

export type LessonContent = {
  courseId: string;
  title: string;
  content: string;
};

/** Find a lesson across all courses and return its course id, title, and text body. */
export function resolveLessonContent(lessonId: string): LessonContent | null {
  for (const course of courses) {
    const lesson = getLessons(course).find((l) => l.id === lessonId);
    if (lesson) {
      return { courseId: course.id, title: lesson.title, content: lesson.content };
    }
  }
  return null;
}

export type CourseLesson = { lessonId: string; title: string; content: string };

/** All lessons for a course (for RAG ingestion); empty if the course is unknown. */
export function getCourseLessons(courseId: string): CourseLesson[] {
  const course = courses.find((c) => c.id === courseId);
  if (!course) return [];
  return getLessons(course).map((l) => ({ lessonId: l.id, title: l.title, content: l.content }));
}

/** lessonId -> title map for a course (so RAG citations carry human titles). */
export function getCourseLessonTitles(courseId: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const l of getCourseLessons(courseId)) map[l.lessonId] = l.title;
  return map;
}
