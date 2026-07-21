import { isDbUnavailable } from "./db-fallback";
import { prisma } from "./prisma";

type AnalyticsPayload = {
  eventType: string;
  lessonId?: string;
  quizId?: string;
  courseId?: string;
  studentId?: string;
  metadata?: Record<string, unknown>;
};

export async function recordAnalyticsEvent({
  eventType,
  lessonId,
  quizId,
  courseId,
  studentId,
  metadata,
}: AnalyticsPayload): Promise<void> {
  try {
    await prisma.analyticsEvent.create({
      data: {
        eventType,
        lessonId: lessonId ?? undefined,
        quizId: quizId ?? undefined,
        courseId: courseId ?? undefined,
        studentId: studentId ?? undefined,
        metadata: metadata ? metadata : undefined,
      },
    });
  } catch (error) {
    if (!isDbUnavailable(error)) throw error;
  }
}
