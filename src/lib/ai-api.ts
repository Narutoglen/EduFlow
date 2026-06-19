// Browser-safe client for the EduFlow AI BFF (/api/ai/*). No secrets here — same-origin fetch only.
// Every response is validated with Zod (Frontend rule: validate all responses).
import { z } from "zod";

export const summarySchema = z.object({
  id: z.string(),
  sourceType: z.enum(["LESSON", "RESOURCE"]),
  lessonId: z.string().nullable().optional(),
  resourceId: z.string().nullable().optional(),
  courseId: z.string(),
  summary: z.string().nullable().optional(),
  keyPoints: z.array(z.string()).default([]),
  readingSeconds: z.number().nullable().optional(),
  model: z.string(),
  promptVersion: z.string(),
  status: z.string(),
  updatedAt: z.string(),
});
export type Summary = z.infer<typeof summarySchema>;

const jobSchema = z.object({
  jobId: z.string(),
  kind: z.enum(["SUMMARIZE", "FLASHCARDS", "TRANSCRIBE", "INGEST", "RAG"]),
  status: z.enum(["PENDING", "RUNNING", "READY", "FAILED", "CANCELLED"]),
  resultId: z.string().nullable().optional(),
  error: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  result: z.unknown().optional(),
});
export type Job = z.infer<typeof jobSchema>;

const errorSchema = z.object({
  error: z.object({ code: z.string(), message: z.string(), requestId: z.string().optional() }),
});

export class AiApiError extends Error {
  constructor(public code: string, message: string, public httpStatus: number) {
    super(message);
  }
}

async function parse<T>(res: Response, schema: z.ZodType<T>): Promise<T> {
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = errorSchema.safeParse(data);
    if (err.success) throw new AiApiError(err.data.error.code, err.data.error.message, res.status);
    throw new AiApiError("INTERNAL", "Unexpected error", res.status);
  }
  return schema.parse(data);
}

/** GET cached summary for a lesson. Returns null on 404 (not generated yet). */
export async function getSummary(lessonId: string): Promise<Summary | null> {
  const res = await fetch(`/api/ai/summaries?lessonId=${encodeURIComponent(lessonId)}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  return parse(res, summarySchema);
}

/** POST to generate a summary. Returns a Job (202) or, if already cached, a ready Summary (200). */
export async function generateSummary(
  lessonId: string,
): Promise<{ kind: "job"; job: Job } | { kind: "summary"; summary: Summary }> {
  const res = await fetch(`/api/ai/summaries`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ lessonId }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = errorSchema.safeParse(data);
    throw new AiApiError(
      err.success ? err.data.error.code : "INTERNAL",
      err.success ? err.data.error.message : "Unexpected error",
      res.status,
    );
  }
  // 200 => summary object; 202 => job
  if (res.status === 200) return { kind: "summary", summary: summarySchema.parse(data) };
  return { kind: "job", job: jobSchema.parse(data) };
}

export async function getJob(jobId: string): Promise<Job> {
  const res = await fetch(`/api/ai/jobs/${encodeURIComponent(jobId)}`, { cache: "no-store" });
  return parse(res, jobSchema);
}

// ---- Flashcards (contract §3) ----
const cardSchema = z.object({
  id: z.string(),
  front: z.string(),
  back: z.string(),
  hint: z.string().nullable().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  dueAt: z.string(),
  interval: z.number(),
  repetitions: z.number(),
});
export type Card = z.infer<typeof cardSchema>;

const deckSchema = z.object({
  id: z.string(),
  lessonId: z.string(),
  title: z.string(),
  cardCount: z.number(),
});

export const flashcardsListSchema = z.object({ deck: deckSchema, cards: z.array(cardSchema) });
export type FlashcardsList = z.infer<typeof flashcardsListSchema>;

const dueListSchema = z.object({
  items: z.array(cardSchema),
  nextCursor: z.string().nullable().optional(),
});

const reviewSchema = z.object({
  id: z.string(),
  ease: z.number(),
  interval: z.number(),
  repetitions: z.number(),
  dueAt: z.string(),
});
export type Review = z.infer<typeof reviewSchema>;

/** Generate a deck. Returns a Job (202) or, if already generated, the deck list (200). */
export async function generateFlashcards(
  lessonId: string,
  count: number,
): Promise<{ kind: "job"; job: Job } | { kind: "list"; list: FlashcardsList }> {
  const res = await fetch(`/api/ai/flashcards/generate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ lessonId, count }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = errorSchema.safeParse(data);
    throw new AiApiError(
      err.success ? err.data.error.code : "INTERNAL",
      err.success ? err.data.error.message : "Unexpected error",
      res.status,
    );
  }
  if (res.status === 200) return { kind: "list", list: flashcardsListSchema.parse(data) };
  return { kind: "job", job: jobSchema.parse(data) };
}

export async function getDeck(lessonId: string): Promise<FlashcardsList | null> {
  const res = await fetch(`/api/ai/flashcards?lessonId=${encodeURIComponent(lessonId)}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  return parse(res, flashcardsListSchema);
}

export async function getDueCards(lessonId: string, limit = 20): Promise<Card[]> {
  const res = await fetch(
    `/api/ai/flashcards/due?lessonId=${encodeURIComponent(lessonId)}&limit=${limit}`,
    { cache: "no-store" },
  );
  if (res.status === 404) return [];
  const data = await parse(res, dueListSchema);
  return data.items;
}

export async function reviewCard(cardId: string, grade: number): Promise<Review> {
  const res = await fetch(`/api/ai/flashcards/${encodeURIComponent(cardId)}/review`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ grade }),
  });
  return parse(res, reviewSchema);
}

// ---- Assistant (contract §4) ----
const citationSchema = z.object({
  lessonId: z.string().nullable().optional(),
  title: z.string(),
  chunkIndex: z.number(),
  score: z.number(),
});
export type Citation = z.infer<typeof citationSchema>;

const askOutSchema = z.object({
  conversationId: z.string(),
  answer: z.string(),
  citations: z.array(citationSchema).default([]),
  messageId: z.string(),
});
export type AskOut = z.infer<typeof askOutSchema>;

export const transcriptSchema = z.object({
  transcript: z.string().nullable().optional(),
  language: z.string().nullable().optional(),
  durationSec: z.number().nullable().optional(),
});

/** Ensure a course's lessons are embedded for RAG (idempotent; fire-and-forget is fine). */
export async function ingestCourse(courseId: string): Promise<void> {
  await fetch(`/api/ai/ingest`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ courseId }),
  }).catch(() => undefined);
}

export async function askAssistant(
  courseId: string,
  question: string,
  conversationId?: string | null,
  sourceAudioId?: string | null,
): Promise<AskOut> {
  const res = await fetch(`/api/ai/assistant/ask`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ courseId, question, conversationId: conversationId ?? null, sourceAudioId: sourceAudioId ?? null }),
  });
  return parse(res, askOutSchema);
}

/** Upload recorded audio; returns the transcription Job id to poll. */
export async function uploadVoice(
  courseId: string,
  audio: Blob,
  conversationId?: string | null,
): Promise<Job> {
  const form = new FormData();
  form.append("audio", audio, "question.webm");
  form.append("courseId", courseId);
  if (conversationId) form.append("conversationId", conversationId);
  const res = await fetch(`/api/ai/assistant/voice`, { method: "POST", body: form });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = errorSchema.safeParse(data);
    throw new AiApiError(
      err.success ? err.data.error.code : "INTERNAL",
      err.success ? err.data.error.message : "Upload failed",
      res.status,
    );
  }
  return jobSchema.parse(data);
}
