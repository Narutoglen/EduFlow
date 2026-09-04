import { describe, expect, it } from "vitest";
import {
  computeAchievements,
  type AchievementSummary,
  type TestScore,
} from "./achievements";

describe("Student Achievements & Gamification Engine", () => {
  const emptySummary: AchievementSummary = {
    coursesEnrolled: 0,
    coursesCompleted: 0,
    averageGrade: 0,
    certificates: 0,
    testsTaken: 0,
    testsPassed: 0,
  };

  it("locks all achievement badges for a new student with zero activity", () => {
    const badges = computeAchievements(emptySummary, []);
    expect(badges).toHaveLength(6);
    expect(badges.every((b) => !b.earned)).toBe(true);
  });

  it("unlocks 'First Pass' badge when student passes their first test", () => {
    const summary: AchievementSummary = {
      ...emptySummary,
      testsPassed: 1,
      testsTaken: 1,
    };
    const badges = computeAchievements(summary, []);
    const firstPass = badges.find((b) => b.id === "first-pass");
    expect(firstPass?.earned).toBe(true);
  });

  it("unlocks 'Perfect Score' badge when student achieves 100% on a quiz", () => {
    const score100: TestScore = {
      id: "attempt-1",
      kind: "quiz",
      title: "AI Ethics Quiz",
      courseTitle: "AI in Higher Education",
      scorePercent: 100,
      rawScore: 100,
      maxScore: 100,
      passed: true,
      status: "Passed",
      feedback: null,
      date: new Date(),
    };

    const badges = computeAchievements(emptySummary, [score100]);
    const perfectBadge = badges.find((b) => b.id === "perfect-score");
    expect(perfectBadge?.earned).toBe(true);
  });

  it("does not unlock 'Perfect Score' badge for 100% on assignment submissions (quiz only)", () => {
    const assignment100: TestScore = {
      id: "sub-1",
      kind: "assignment",
      title: "Prompt Engineering Essay",
      courseTitle: "AI in Higher Education",
      scorePercent: 100,
      rawScore: 50,
      maxScore: 50,
      passed: true,
      status: "Graded",
      feedback: "Flawless work!",
      date: new Date(),
    };

    const badges = computeAchievements(emptySummary, [assignment100]);
    const perfectBadge = badges.find((b) => b.id === "perfect-score");
    expect(perfectBadge?.earned).toBe(false);
  });

  it("unlocks 'Course Complete' badge when completed courses > 0", () => {
    const summary: AchievementSummary = {
      ...emptySummary,
      coursesCompleted: 1,
      coursesEnrolled: 2,
    };
    const badges = computeAchievements(summary, []);
    const badge = badges.find((b) => b.id === "course-complete");
    expect(badge?.earned).toBe(true);
  });

  it("unlocks 'Certified' badge when certificates earned > 0", () => {
    const summary: AchievementSummary = {
      ...emptySummary,
      certificates: 1,
    };
    const badges = computeAchievements(summary, []);
    const badge = badges.find((b) => b.id === "certified");
    expect(badge?.earned).toBe(true);
  });

  it("unlocks 'High Achiever' badge when average grade is 85% or higher", () => {
    const below85: AchievementSummary = { ...emptySummary, averageGrade: 84 };
    expect(computeAchievements(below85, []).find((b) => b.id === "high-achiever")?.earned).toBe(false);

    const at85: AchievementSummary = { ...emptySummary, averageGrade: 85 };
    expect(computeAchievements(at85, []).find((b) => b.id === "high-achiever")?.earned).toBe(true);

    const above85: AchievementSummary = { ...emptySummary, averageGrade: 98 };
    expect(computeAchievements(above85, []).find((b) => b.id === "high-achiever")?.earned).toBe(true);
  });

  it("unlocks 'Consistent Learner' badge when tests passed >= 3", () => {
    const twoPassed: AchievementSummary = { ...emptySummary, testsPassed: 2 };
    expect(computeAchievements(twoPassed, []).find((b) => b.id === "consistent")?.earned).toBe(false);

    const threePassed: AchievementSummary = { ...emptySummary, testsPassed: 3 };
    expect(computeAchievements(threePassed, []).find((b) => b.id === "consistent")?.earned).toBe(true);
  });
});
