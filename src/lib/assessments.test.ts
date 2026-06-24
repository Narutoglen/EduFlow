import { describe, expect, it } from "vitest";
import { scoreQuiz } from "./quiz-scoring";

const questions = [
  {
    id: "q1",
    points: 5,
    choices: [
      { id: "q1-a", isCorrect: false },
      { id: "q1-b", isCorrect: true },
    ],
  },
  {
    id: "q2",
    points: 10,
    choices: [
      { id: "q2-a", isCorrect: true },
      { id: "q2-b", isCorrect: false },
    ],
  },
];

describe("scoreQuiz (server-side scoring)", () => {
  it("awards full points for all-correct answers and marks pass", () => {
    const result = scoreQuiz(questions, { q1: "q1-b", q2: "q2-a" }, 70);
    expect(result.scorePercent).toBe(100);
    expect(result.passed).toBe(true);
    expect(result.earnedPoints).toBe(15);
  });

  it("scores by points, not question count", () => {
    // Only the 10-point question correct => 10/15 = 67%.
    const result = scoreQuiz(questions, { q1: "q1-a", q2: "q2-a" }, 70);
    expect(result.scorePercent).toBe(67);
    expect(result.passed).toBe(false);
  });

  it("treats missing/blank answers as incorrect", () => {
    const result = scoreQuiz(questions, {}, 50);
    expect(result.scorePercent).toBe(0);
    expect(result.passed).toBe(false);
  });

  it("uses the quiz pass threshold for the pass flag", () => {
    const onlyFirst = scoreQuiz(questions, { q1: "q1-b" }, 30); // 5/15 = 33%
    expect(onlyFirst.scorePercent).toBe(33);
    expect(onlyFirst.passed).toBe(true);
  });
});
