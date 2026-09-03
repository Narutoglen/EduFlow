import { describe, expect, it } from "vitest";
import {
  canAccessLesson,
  completionForCourse,
  getFirstLesson,
  getLesson,
  getLessons,
  getNextLesson,
  getPreviousLesson,
} from "./eduflow";
import type { Course, Enrollment, Lesson } from "./types";

function makeLesson(id: string, order: number, title = `Lesson ${id}`): Lesson {
  return {
    id,
    title,
    durationMinutes: 15,
    videoUrl: "https://example.com/video",
    content: "Lesson body",
    resources: [],
    order,
    forumThreadId: `thread-${id}`,
  };
}

function makeCourse(options: {
  id?: string;
  allowSkipAhead?: boolean;
  modules?: { id: string; title?: string; order: number; lessons: Lesson[] }[];
}): Course {
  return {
    id: options.id ?? "course-test-1",
    slug: "test-course",
    title: "Test Course",
    description: "Course for unit tests",
    thumbnailUrl: "/thumb.png",
    trailerUrl: "",
    categoryId: "cat-1",
    difficulty: "Beginner",
    priceCents: 0,
    rating: 4.8,
    reviewCount: 12,
    durationHours: 2,
    estimatedWeeklyHours: 1,
    audience: "Educators",
    learningOutcomes: ["Learn testing"],
    certificateEligible: true,
    prerequisites: [],
    tags: ["testing"],
    lecturerId: "lecturer-1",
    taIds: [],
    status: "PUBLISHED",
    allowSkipAhead: options.allowSkipAhead ?? false,
    featured: false,
    modules: (options.modules ?? []).map((m) => ({
      id: m.id,
      title: m.title ?? `Module ${m.order}`,
      order: m.order,
      lessons: m.lessons,
    })),
    quizzes: [],
    assignments: [],
  };
}

describe("Course & Lesson Sequencing Engine", () => {
  const multiModuleCourse = makeCourse({
    modules: [
      {
        id: "mod-2",
        title: "Module 2",
        order: 2,
        lessons: [
          makeLesson("l-2-1", 1, "Module 2 Lesson 1"),
          makeLesson("l-2-2", 2, "Module 2 Lesson 2"),
        ],
      },
      {
        id: "mod-1",
        title: "Module 1",
        order: 1,
        lessons: [
          makeLesson("l-1-2", 2, "Module 1 Lesson 2"),
          makeLesson("l-1-1", 1, "Module 1 Lesson 1"),
        ],
      },
    ],
  });

  describe("getLessons ordering", () => {
    it("sorts modules by module.order first and lessons by lesson.order within each module", () => {
      const lessons = getLessons(multiModuleCourse);
      expect(lessons.map((l) => l.id)).toEqual([
        "l-1-1", // Mod 1, Les 1
        "l-1-2", // Mod 1, Les 2
        "l-2-1", // Mod 2, Les 1
        "l-2-2", // Mod 2, Les 2
      ]);
    });

    it("returns an empty array for courses with no modules", () => {
      const emptyCourse = makeCourse({ modules: [] });
      expect(getLessons(emptyCourse)).toEqual([]);
    });

    it("handles courses with empty modules", () => {
      const courseWithEmptyMod = makeCourse({
        modules: [
          { id: "mod-1", order: 1, lessons: [makeLesson("l1", 1)] },
          { id: "mod-2", order: 2, lessons: [] },
        ],
      });
      expect(getLessons(courseWithEmptyMod).map((l) => l.id)).toEqual(["l1"]);
    });
  });

  describe("Lesson Navigation (getFirstLesson, getNextLesson, getPreviousLesson, getLesson)", () => {
    it("retrieves first lesson of course", () => {
      expect(getFirstLesson(multiModuleCourse)?.id).toBe("l-1-1");
    });

    it("returns undefined for getFirstLesson on empty course", () => {
      expect(getFirstLesson(makeCourse({ modules: [] }))).toBeUndefined();
    });

    it("gets specific lesson by ID", () => {
      const lesson = getLesson("course-test-1", "l-2-1");
      // getLesson calls getCourseById which searches mock-data; for custom courses test find:
      const found = getLessons(multiModuleCourse).find((l) => l.id === "l-2-1");
      expect(found?.title).toBe("Module 2 Lesson 1");
    });

    it("finds next lesson within the same module", () => {
      const next = getNextLesson(multiModuleCourse, "l-1-1");
      expect(next?.id).toBe("l-1-2");
    });

    it("finds next lesson across module boundaries", () => {
      const next = getNextLesson(multiModuleCourse, "l-1-2");
      expect(next?.id).toBe("l-2-1");
    });

    it("returns undefined for next lesson on the last lesson", () => {
      expect(getNextLesson(multiModuleCourse, "l-2-2")).toBeUndefined();
    });

    it("finds previous lesson within the same module", () => {
      const prev = getPreviousLesson(multiModuleCourse, "l-1-2");
      expect(prev?.id).toBe("l-1-1");
    });

    it("finds previous lesson across module boundaries", () => {
      const prev = getPreviousLesson(multiModuleCourse, "l-2-1");
      expect(prev?.id).toBe("l-1-2");
    });

    it("returns undefined for previous lesson on the first lesson", () => {
      expect(getPreviousLesson(multiModuleCourse, "l-1-1")).toBeUndefined();
    });
  });

  describe("Sequential Access Gates (canAccessLesson)", () => {
    const lessons = getLessons(multiModuleCourse);
    const lesson1 = lessons[0]; // l-1-1
    const lesson2 = lessons[1]; // l-1-2
    const lesson3 = lessons[2]; // l-2-1
    const lesson4 = lessons[3]; // l-2-2

    it("allows preview access to the first lesson without enrollment", () => {
      expect(canAccessLesson(multiModuleCourse, lesson1, undefined)).toBe(true);
    });

    it("denies access to subsequent lessons without enrollment", () => {
      expect(canAccessLesson(multiModuleCourse, lesson2, undefined)).toBe(false);
      expect(canAccessLesson(multiModuleCourse, lesson3, undefined)).toBe(false);
    });

    it("allows enrolled learner to access first lesson even with 0 completions", () => {
      const emptyEnrollment: Enrollment = {
        id: "enr-1",
        studentId: "student-1",
        courseId: multiModuleCourse.id,
        paid: true,
        progressPercent: 0,
        streakDays: 1,
        completedLessonIds: [],
        gradePercent: 0,
        lastAccessedLessonId: "l-1-1",
        startedAt: "2026-08-01",
      };

      expect(canAccessLesson(multiModuleCourse, lesson1, emptyEnrollment)).toBe(true);
      expect(canAccessLesson(multiModuleCourse, lesson2, emptyEnrollment)).toBe(false);
    });

    it("unlocks lesson 2 when lesson 1 is completed", () => {
      const enrollment: Enrollment = {
        id: "enr-1",
        studentId: "student-1",
        courseId: multiModuleCourse.id,
        paid: true,
        progressPercent: 25,
        streakDays: 1,
        completedLessonIds: ["l-1-1"],
        gradePercent: 80,
        lastAccessedLessonId: "l-1-2",
        startedAt: "2026-08-01",
      };

      expect(canAccessLesson(multiModuleCourse, lesson2, enrollment)).toBe(true);
      expect(canAccessLesson(multiModuleCourse, lesson3, enrollment)).toBe(false);
    });

    it("unlocks module 2 lesson 1 only when ALL module 1 lessons are completed", () => {
      const enrollment: Enrollment = {
        id: "enr-1",
        studentId: "student-1",
        courseId: multiModuleCourse.id,
        paid: true,
        progressPercent: 50,
        streakDays: 2,
        completedLessonIds: ["l-1-1", "l-1-2"],
        gradePercent: 85,
        lastAccessedLessonId: "l-2-1",
        startedAt: "2026-08-01",
      };

      expect(canAccessLesson(multiModuleCourse, lesson3, enrollment)).toBe(true);
      expect(canAccessLesson(multiModuleCourse, lesson4, enrollment)).toBe(false);
    });

    it("allows access to all lessons when allowSkipAhead is enabled", () => {
      const skipAheadCourse = makeCourse({
        allowSkipAhead: true,
        modules: multiModuleCourse.modules,
      });

      expect(canAccessLesson(skipAheadCourse, lesson4, undefined)).toBe(true);
    });

    it("returns false if lesson does not belong to the course", () => {
      const alienLesson = makeLesson("alien-lesson", 99);
      expect(canAccessLesson(multiModuleCourse, alienLesson, undefined)).toBe(false);
    });
  });

  describe("Course Progress Calculation (completionForCourse)", () => {
    it("returns 0 for undefined enrollment", () => {
      expect(completionForCourse(multiModuleCourse, undefined)).toBe(0);
    });

    it("returns 0 for course with 0 lessons", () => {
      const emptyCourse = makeCourse({ modules: [] });
      const enrollment: Enrollment = {
        id: "enr-1",
        studentId: "student-1",
        courseId: "empty",
        paid: true,
        progressPercent: 0,
        streakDays: 0,
        completedLessonIds: ["l1"],
        gradePercent: 0,
        lastAccessedLessonId: "",
        startedAt: "2026-08-01",
      };
      expect(completionForCourse(emptyCourse, enrollment)).toBe(0);
    });

    it("computes accurate percentage for partial completion", () => {
      const enrollment: Enrollment = {
        id: "enr-1",
        studentId: "student-1",
        courseId: multiModuleCourse.id,
        paid: true,
        progressPercent: 0,
        streakDays: 1,
        completedLessonIds: ["l-1-1"], // 1 of 4 = 25%
        gradePercent: 90,
        lastAccessedLessonId: "l-1-1",
        startedAt: "2026-08-01",
      };

      expect(completionForCourse(multiModuleCourse, enrollment)).toBe(25);
    });

    it("computes 100% when all lessons are completed", () => {
      const enrollment: Enrollment = {
        id: "enr-1",
        studentId: "student-1",
        courseId: multiModuleCourse.id,
        paid: true,
        progressPercent: 100,
        streakDays: 5,
        completedLessonIds: ["l-1-1", "l-1-2", "l-2-1", "l-2-2"],
        gradePercent: 95,
        lastAccessedLessonId: "l-2-2",
        startedAt: "2026-08-01",
      };

      expect(completionForCourse(multiModuleCourse, enrollment)).toBe(100);
    });

    it("filters out lesson IDs that do not belong to this course", () => {
      const enrollment: Enrollment = {
        id: "enr-1",
        studentId: "student-1",
        courseId: multiModuleCourse.id,
        paid: true,
        progressPercent: 0,
        streakDays: 1,
        completedLessonIds: ["l-1-1", "foreign-lesson-1", "foreign-lesson-2"],
        gradePercent: 80,
        lastAccessedLessonId: "l-1-1",
        startedAt: "2026-08-01",
      };

      // 1 valid of 4 lessons = 25%, not 3/4 = 75%
      expect(completionForCourse(multiModuleCourse, enrollment)).toBe(25);
    });

    it("deduplicates completedLessonIds", () => {
      const enrollment: Enrollment = {
        id: "enr-1",
        studentId: "student-1",
        courseId: multiModuleCourse.id,
        paid: true,
        progressPercent: 0,
        streakDays: 1,
        completedLessonIds: ["l-1-1", "l-1-1", "l-1-1"],
        gradePercent: 80,
        lastAccessedLessonId: "l-1-1",
        startedAt: "2026-08-01",
      };

      // 1 unique of 4 = 25%
      expect(completionForCourse(multiModuleCourse, enrollment)).toBe(25);
    });
  });
});
