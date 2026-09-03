import { describe, expect, it } from "vitest";
import {
  askOutSchema,
  cardSchema,
  citationSchema,
  deckSchema,
  dueListSchema,
  errorSchema,
  flashcardsListSchema,
  jobSchema,
  reviewSchema,
  summarySchema,
  AiApiError,
} from "./ai-api";

describe("AI API Zod Contract Schemas & Client Errors", () => {
  describe("summarySchema", () => {
    it("validates a complete lesson summary payload", () => {
      const payload = {
        id: "sum-1",
        sourceType: "LESSON",
        lessonId: "lesson-1",
        courseId: "course-1",
        summary: "This is a summary.",
        keyPoints: ["Point 1", "Point 2"],
        readingSeconds: 45,
        model: "llama3.1:8b",
        promptVersion: "1.0.0",
        status: "READY",
        updatedAt: "2026-08-14T10:00:00Z",
      };

      const parsed = summarySchema.parse(payload);
      expect(parsed.id).toBe("sum-1");
      expect(parsed.keyPoints).toHaveLength(2);
    });

    it("rejects invalid sourceType", () => {
      const invalid = {
        id: "sum-1",
        sourceType: "UNSUPPORTED_TYPE",
        courseId: "course-1",
        model: "llama3.1:8b",
        promptVersion: "1.0.0",
        status: "READY",
        updatedAt: "2026-08-14T10:00:00Z",
      };

      expect(() => summarySchema.parse(invalid)).toThrow();
    });
  });

  describe("jobSchema", () => {
    it("validates an asynchronous job payload", () => {
      const payload = {
        jobId: "job-1234",
        kind: "SUMMARIZE",
        status: "RUNNING",
        createdAt: "2026-08-14T10:00:00Z",
        updatedAt: "2026-08-14T10:00:05Z",
      };

      const parsed = jobSchema.parse(payload);
      expect(parsed.jobId).toBe("job-1234");
      expect(parsed.status).toBe("RUNNING");
    });

    it("accepts optional result and error fields", () => {
      const readyPayload = {
        jobId: "job-ready",
        kind: "FLASHCARDS",
        status: "READY",
        resultId: "res-1",
        createdAt: "2026-08-14T10:00:00Z",
        updatedAt: "2026-08-14T10:00:10Z",
        result: { cardCount: 5 },
      };

      const parsed = jobSchema.parse(readyPayload);
      expect(parsed.status).toBe("READY");
      expect(parsed.resultId).toBe("res-1");
    });
  });

  describe("cardSchema & deckSchema", () => {
    it("validates a flashcard object with SM-2 parameters", () => {
      const card = {
        id: "card-1",
        front: "What is Backpropagation?",
        back: "Algorithm for computing gradient of loss function.",
        difficulty: "MEDIUM",
        dueAt: "2026-08-15T00:00:00Z",
        interval: 1,
        repetitions: 0,
      };

      const parsed = cardSchema.parse(card);
      expect(parsed.front).toBe("What is Backpropagation?");
      expect(parsed.difficulty).toBe("MEDIUM");
    });

    it("validates flashcard deck and list", () => {
      const list = {
        deck: {
          id: "deck-1",
          lessonId: "lesson-1",
          title: "Neural Networks Deck",
          cardCount: 1,
        },
        cards: [
          {
            id: "c1",
            front: "Q1",
            back: "A1",
            difficulty: "EASY",
            dueAt: "2026-08-15T00:00:00Z",
            interval: 1,
            repetitions: 1,
          },
        ],
      };

      const parsed = flashcardsListSchema.parse(list);
      expect(parsed.deck.cardCount).toBe(1);
      expect(parsed.cards).toHaveLength(1);
    });

    it("validates dueListSchema and reviewSchema", () => {
      const due = {
        items: [
          {
            id: "c1",
            front: "Q1",
            back: "A1",
            difficulty: "HARD",
            dueAt: "2026-08-15T00:00:00Z",
            interval: 1,
            repetitions: 0,
          },
        ],
      };
      expect(dueListSchema.parse(due).items).toHaveLength(1);

      const review = {
        id: "c1",
        ease: 2.5,
        interval: 3,
        repetitions: 1,
        dueAt: "2026-08-18T00:00:00Z",
      };
      expect(reviewSchema.parse(review).ease).toBe(2.5);
    });
  });

  describe("askOutSchema & citationSchema", () => {
    it("validates assistant Q&A output with RAG citations", () => {
      const askOut = {
        conversationId: "conv-1",
        messageId: "msg-1",
        answer: "Gradient descent iteratively updates parameters to minimize loss.",
        citations: [
          {
            lessonId: "lesson-optimization",
            title: "Optimization Algorithms",
            chunkIndex: 2,
            score: 0.92,
          },
        ],
      };

      const parsed = askOutSchema.parse(askOut);
      expect(parsed.citations).toHaveLength(1);
      expect(parsed.citations[0].title).toBe("Optimization Algorithms");
      expect(parsed.citations[0].score).toBe(0.92);
    });
  });

  describe("errorSchema & AiApiError", () => {
    it("validates standard API error structure", () => {
      const err = {
        error: {
          code: "FORBIDDEN",
          message: "You are not enrolled in this course.",
          requestId: "req-999",
        },
      };

      const parsed = errorSchema.parse(err);
      expect(parsed.error.code).toBe("FORBIDDEN");
      expect(parsed.error.requestId).toBe("req-999");
    });

    it("constructs AiApiError class with status code and error code", () => {
      const error = new AiApiError("NOT_FOUND", "Lesson not found", 404);
      expect(error.code).toBe("NOT_FOUND");
      expect(error.message).toBe("Lesson not found");
      expect(error.httpStatus).toBe(404);
      expect(error instanceof Error).toBe(true);
    });
  });
});
