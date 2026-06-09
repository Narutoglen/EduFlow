import { describe, expect, it } from "vitest";
import { courses, enrollments } from "./mock-data";
import {
  canAccessLesson,
  canIssueCertificate,
  filterCourses,
  getLessons,
  scoreQuiz,
} from "./eduflow";

describe("catalog filtering", () => {
  it("returns only published free courses when filtering by free price", () => {
    const result = filterCourses({ price: "free" });

    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("data-literacy-for-schools");
    expect(result.every((course) => course.status === "PUBLISHED")).toBe(true);
  });
});

describe("lesson access gates", () => {
  it("prevents skipping ahead when prior lessons are incomplete", () => {
    const course = courses.find((item) => item.id === "course-ai-teaching");
    expect(course).toBeDefined();
    const lessons = getLessons(course!);
    const lockedLesson = lessons[2];
    const partialEnrollment = {
      ...enrollments[0],
      completedLessonIds: ["lesson-ai-1"],
    };

    expect(canAccessLesson(course!, lockedLesson, partialEnrollment)).toBe(false);
  });

  it("allows access when all prior lessons are complete", () => {
    const course = courses.find((item) => item.id === "course-ai-teaching");
    const lessons = getLessons(course!);

    expect(canAccessLesson(course!, lessons[2], enrollments[0])).toBe(true);
  });
});

describe("quiz scoring", () => {
  it("scores correct answers and applies pass score", () => {
    const quiz = courses[0].quizzes[0];
    const result = scoreQuiz(quiz, {
      "q-ai-1": "q-ai-1-b",
      "q-ai-2": "q-ai-2-b",
    });

    expect(result).toMatchObject({
      correctCount: 2,
      totalQuestions: 2,
      scorePercent: 100,
      passed: true,
    });
  });

  it("fails attempts below the pass score", () => {
    const quiz = courses[0].quizzes[0];
    const result = scoreQuiz(quiz, {
      "q-ai-1": "q-ai-1-a",
      "q-ai-2": "q-ai-2-a",
    });

    expect(result.scorePercent).toBe(0);
    expect(result.passed).toBe(false);
  });
});

describe("certificate eligibility", () => {
  it("requires full course progress", () => {
    expect(canIssueCertificate(enrollments[0])).toBe(false);
    expect(canIssueCertificate(enrollments[1])).toBe(true);
  });
});
