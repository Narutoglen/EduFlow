// Server-only: resolve the AI Principal from the EduFlow session and enrich AI requests with the
// LMS content the web app owns (the ai-service stays loosely coupled and never reads the LMS DB).
import "server-only";

import { courses } from "./mock-data";
import { userForRole } from "./mock-data";
import {
  getCoursesForLecturer,
  getCoursesForTa,
  getEnrollmentsForStudent,
  getLessons,
} from "./eduflow";
import type { Principal } from "./ai-client";
import type { Role } from "./types";

// Demo wiring: the MVP exposes role-scoped demo users (see README). In production this resolves the
// authenticated user from the httpOnly session. Default to the Student demo persona.
export function getCurrentPrincipal(role: Role = "STUDENT"): Principal {
  const user = userForRole(role);
  const enrolled = getEnrollmentsForStudent(user.id).map((e) => e.courseId);
  const owned =
    role === "LECTURER"
      ? getCoursesForLecturer(user.id).map((c) => c.id)
      : role === "TA"
        ? getCoursesForTa(user.id).map((c) => c.id)
        : [];
  return {
    userId: user.id,
    role: user.role,
    enrolledCourseIds: enrolled,
    ownedCourseIds: owned,
  };
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
