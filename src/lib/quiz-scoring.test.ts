import { describe, expect, it } from "vitest";
import {
  normalizeSelectedChoiceIds,
  scoreQuestion,
  scoreQuiz,
  type ScorableQuestion,
} from "./quiz-scoring";

describe("Quiz Scoring Engine", () => {
  describe("normalizeSelectedChoiceIds", () => {
    it("handles null, undefined, and empty inputs", () => {
      expect(normalizeSelectedChoiceIds(null)).toEqual([]);
      expect(normalizeSelectedChoiceIds(undefined)).toEqual([]);
      expect(normalizeSelectedChoiceIds("")).toEqual([]);
      expect(normalizeSelectedChoiceIds("   ")).toEqual([]);
    });

    it("normalizes a single choice ID string", () => {
      expect(normalizeSelectedChoiceIds("choice-1")).toEqual(["choice-1"]);
      expect(normalizeSelectedChoiceIds("  choice-2  ")).toEqual(["choice-2"]);
    });

    it("normalizes a comma-separated string of IDs", () => {
      expect(normalizeSelectedChoiceIds("c1,c2,c3")).toEqual(["c1", "c2", "c3"]);
      expect(normalizeSelectedChoiceIds(" c1 , c2 , c1 ")).toEqual(["c1", "c2"]);
    });

    it("normalizes an array of choice IDs and deduplicates", () => {
      expect(normalizeSelectedChoiceIds(["c1", "c2", "c1", "  c3  "])).toEqual(["c1", "c2", "c3"]);
    });
  });

  describe("Single Choice (MCQ & True/False)", () => {
    const mcqQuestion: ScorableQuestion = {
      id: "q-mcq",
      points: 10,
      type: "MCQ",
      choices: [
        { id: "a", isCorrect: false },
        { id: "b", isCorrect: true },
        { id: "c", isCorrect: false },
      ],
    };

    it("awards full points when the correct choice is selected", () => {
      const result = scoreQuestion(mcqQuestion, "b");
      expect(result.earnedPoints).toBe(10);
      expect(result.isCorrect).toBe(true);
      expect(result.isPartiallyCorrect).toBe(false);
      expect(result.selectedChoiceIds).toEqual(["b"]);
    });

    it("awards 0 points when an incorrect choice is selected", () => {
      const result = scoreQuestion(mcqQuestion, "a");
      expect(result.earnedPoints).toBe(0);
      expect(result.isCorrect).toBe(false);
      expect(result.isPartiallyCorrect).toBe(false);
    });

    it("awards 0 points when no answer is provided", () => {
      const result = scoreQuestion(mcqQuestion, null);
      expect(result.earnedPoints).toBe(0);
      expect(result.isCorrect).toBe(false);
    });

    it("awards 0 points when multiple choices are sent for a single-choice question", () => {
      const result = scoreQuestion(mcqQuestion, ["a", "b"]);
      expect(result.earnedPoints).toBe(0);
      expect(result.isCorrect).toBe(false);
    });

    it("correctly scores a True/False question", () => {
      const tfQuestion: ScorableQuestion = {
        id: "q-tf",
        points: 5,
        type: "TRUE_FALSE",
        choices: [
          { id: "true-choice", isCorrect: true },
          { id: "false-choice", isCorrect: false },
        ],
      };

      expect(scoreQuestion(tfQuestion, "true-choice").earnedPoints).toBe(5);
      expect(scoreQuestion(tfQuestion, "true-choice").isCorrect).toBe(true);
      expect(scoreQuestion(tfQuestion, "false-choice").earnedPoints).toBe(0);
      expect(scoreQuestion(tfQuestion, "false-choice").isCorrect).toBe(false);
    });
  });

  describe("Multi-Select with Partial Credit", () => {
    // 2 correct (b, d), 2 incorrect (a, c)
    const multiQuestion: ScorableQuestion = {
      id: "q-multi",
      points: 10,
      type: "MULTI_SELECT",
      choices: [
        { id: "a", isCorrect: false },
        { id: "b", isCorrect: true },
        { id: "c", isCorrect: false },
        { id: "d", isCorrect: true },
      ],
    };

    it("awards 100% points when all correct choices are selected without penalty", () => {
      const result = scoreQuestion(multiQuestion, ["b", "d"]);
      expect(result.earnedPoints).toBe(10);
      expect(result.isCorrect).toBe(true);
      expect(result.isPartiallyCorrect).toBe(false);
      expect(result.selectedChoiceIds).toEqual(["b", "d"]);
    });

    it("awards partial credit (50%) when 1 out of 2 correct choices is selected", () => {
      const result = scoreQuestion(multiQuestion, ["b"]);
      expect(result.earnedPoints).toBe(5);
      expect(result.isCorrect).toBe(false);
      expect(result.isPartiallyCorrect).toBe(true);
    });

    it("applies penalty for selecting incorrect choices: 1 correct + 1 incorrect = 0 points", () => {
      // 1/2 correct (50%) - 1/2 incorrect (50%) = 0%
      const result = scoreQuestion(multiQuestion, ["b", "a"]);
      expect(result.earnedPoints).toBe(0);
      expect(result.isCorrect).toBe(false);
      expect(result.isPartiallyCorrect).toBe(false);
    });

    it("awards 0 points when student selects all choices (guessing attempt)", () => {
      // 2/2 correct (100%) - 2/2 incorrect (100%) = 0%
      const result = scoreQuestion(multiQuestion, ["a", "b", "c", "d"]);
      expect(result.earnedPoints).toBe(0);
      expect(result.isCorrect).toBe(false);
    });

    it("clamps score to 0 and never awards negative points", () => {
      // 0 correct + 2 incorrect = 0% (clamped)
      const result = scoreQuestion(multiQuestion, ["a", "c"]);
      expect(result.earnedPoints).toBe(0);
      expect(result.isCorrect).toBe(false);
    });

    it("enforces allOrNothing mode when set on question", () => {
      const allOrNothingQuestion: ScorableQuestion = {
        ...multiQuestion,
        allOrNothing: true,
      };

      // Partial selection earns 0 in all-or-nothing
      expect(scoreQuestion(allOrNothingQuestion, ["b"]).earnedPoints).toBe(0);
      // Full selection earns full points
      expect(scoreQuestion(allOrNothingQuestion, ["b", "d"]).earnedPoints).toBe(10);
    });

    it("handles multi-select where all choices are correct", () => {
      const allCorrectQuestion: ScorableQuestion = {
        id: "q-all-correct",
        points: 9,
        type: "MULTI_SELECT",
        choices: [
          { id: "x", isCorrect: true },
          { id: "y", isCorrect: true },
          { id: "z", isCorrect: true },
        ],
      };

      expect(scoreQuestion(allCorrectQuestion, ["x"]).earnedPoints).toBe(3);
      expect(scoreQuestion(allCorrectQuestion, ["x", "y"]).earnedPoints).toBe(6);
      expect(scoreQuestion(allCorrectQuestion, ["x", "y", "z"]).earnedPoints).toBe(9);
      expect(scoreQuestion(allCorrectQuestion, ["x", "y", "z"]).isCorrect).toBe(true);
    });
  });

  describe("Full Quiz Scoring (scoreQuiz)", () => {
    const mixedQuiz: ScorableQuestion[] = [
      {
        id: "q1",
        points: 10,
        type: "MCQ",
        choices: [
          { id: "q1-a", isCorrect: false },
          { id: "q1-b", isCorrect: true },
        ],
      },
      {
        id: "q2",
        points: 10,
        type: "TRUE_FALSE",
        choices: [
          { id: "q2-true", isCorrect: true },
          { id: "q2-false", isCorrect: false },
        ],
      },
      {
        id: "q3",
        points: 20,
        type: "MULTI_SELECT",
        choices: [
          { id: "q3-a", isCorrect: true },
          { id: "q3-b", isCorrect: false },
          { id: "q3-c", isCorrect: true },
        ],
      },
    ];

    it("calculates 100% score and passes when all questions are answered perfectly", () => {
      const answers = {
        q1: "q1-b",
        q2: "q2-true",
        q3: ["q3-a", "q3-c"],
      };

      const result = scoreQuiz(mixedQuiz, answers, 75);
      expect(result.totalPoints).toBe(40);
      expect(result.earnedPoints).toBe(40);
      expect(result.scorePercent).toBe(100);
      expect(result.passed).toBe(true);
      expect(result.correctCount).toBe(3);
      expect(result.totalQuestions).toBe(3);
    });

    it("correctly computes weighted score with partial credit", () => {
      // q1: 10/10, q2: 0/10, q3: 10/20 (partial credit for 1 of 2 correct choices)
      // Total: 20 / 40 = 50%
      const answers = {
        q1: "q1-b",
        q2: "q2-false",
        q3: ["q3-a"],
      };

      const result = scoreQuiz(mixedQuiz, answers, 60);
      expect(result.earnedPoints).toBe(20);
      expect(result.scorePercent).toBe(50);
      expect(result.passed).toBe(false);
      expect(result.correctCount).toBe(1); // only q1 was 100% correct
    });

    it("evaluates passing threshold at exact boundary", () => {
      // 30 / 40 = 75%
      const answers = {
        q1: "q1-b",
        q2: "q2-true",
        q3: ["q3-a"], // 10/20 pts
      };

      const atExactPass = scoreQuiz(mixedQuiz, answers, 75);
      expect(atExactPass.scorePercent).toBe(75);
      expect(atExactPass.passed).toBe(true);

      const abovePass = scoreQuiz(mixedQuiz, answers, 76);
      expect(abovePass.scorePercent).toBe(75);
      expect(abovePass.passed).toBe(false);
    });

    it("handles zero total points edge case gracefully", () => {
      const zeroQuiz: ScorableQuestion[] = [
        { id: "q0", points: 0, choices: [{ id: "c1", isCorrect: true }] },
      ];

      const resultPass0 = scoreQuiz(zeroQuiz, { q0: "c1" }, 0);
      expect(resultPass0.scorePercent).toBe(100);
      expect(resultPass0.passed).toBe(true);

      const resultPass50 = scoreQuiz(zeroQuiz, { q0: "c1" }, 50);
      expect(resultPass50.scorePercent).toBe(0);
      expect(resultPass50.passed).toBe(false);
    });

    it("handles empty questions list", () => {
      const result = scoreQuiz([], {}, 70);
      expect(result.totalQuestions).toBe(0);
      expect(result.earnedPoints).toBe(0);
      expect(result.passed).toBe(false);
    });

    it("provides detailed breakdown for every question in the quiz", () => {
      const answers = { q1: "q1-b", q2: "q2-false", q3: ["q3-a"] };
      const result = scoreQuiz(mixedQuiz, answers, 50);

      expect(result.breakdown).toHaveLength(3);
      expect(result.breakdown[0]).toEqual({
        questionId: "q1",
        earnedPoints: 10,
        maxPoints: 10,
        isCorrect: true,
        isPartiallyCorrect: false,
        selectedChoiceIds: ["q1-b"],
        correctChoiceIds: ["q1-b"],
      });
      expect(result.breakdown[1].isCorrect).toBe(false);
      expect(result.breakdown[2].isPartiallyCorrect).toBe(true);
    });
  });
});
