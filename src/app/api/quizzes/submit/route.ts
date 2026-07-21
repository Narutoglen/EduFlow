import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/api-auth";
import { scoreAndRecordQuizAttempt } from "@/lib/assessments";
import { isDbUnavailable } from "@/lib/db-fallback";
import { recordAnalyticsEvent } from "@/lib/analytics";

const DB_OFFLINE = {
  error: { code: "SERVICE_UNAVAILABLE", message: "The database is offline. Try again once it is running." },
} as const;

// Submit a quiz attempt.
export async function POST(request: Request) {
  const auth = await requireApiRole(["STUDENT"]);
  if (auth instanceof NextResponse) return auth;

  const contentType = request.headers.get("content-type") ?? "";
  const isForm = !contentType.includes("application/json");
  const payload = isForm
    ? Object.fromEntries((await request.formData()).entries())
    : await request.json().catch(() => ({}));

  const quizId = String(payload.quizId ?? "");
  if (!quizId) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "quizId is required." } },
      { status: 400 },
    );
  }

  const rawAnswers =
    payload.answers && typeof payload.answers === "object"
      ? (payload.answers as Record<string, unknown>)
      : payload;
  const answers: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawAnswers)) {
    if (key !== "quizId" && key !== "answers") answers[key] = String(value);
  }

  let result: Awaited<ReturnType<typeof scoreAndRecordQuizAttempt>>;
  let courseId: string | undefined;
  try {
    result = await scoreAndRecordQuizAttempt({ studentId: auth.id, quizId, answers });
    courseId = result.ok
      ? await requireQuizCourseId(quizId)
      : undefined;
  } catch (error) {
    if (!isDbUnavailable(error)) throw error;
    if (isForm) {
      return NextResponse.redirect(new URL("/achievements?flash=offline", request.url), 303);
    }
    return NextResponse.json(DB_OFFLINE, { status: 503 });
  }

  if (!result.ok) {
    if (isForm) {
      return NextResponse.redirect(new URL("/achievements?flash=quiz-error", request.url), 303);
    }
    return NextResponse.json({ error: { code: "FORBIDDEN", message: result.error } }, {
      status: result.status,
    });
  }

  await recordAnalyticsEvent({
    eventType: "quiz.submitted",
    quizId,
    courseId,
    studentId: auth.id,
    metadata: {
      scorePercent: result.data.scorePercent,
      passed: result.data.passed,
      earnedPoints: result.data.earnedPoints,
      totalPoints: result.data.totalPoints,
    },
  });

  if (isForm) {
    const to = new URL("/achievements", request.url);
    to.searchParams.set("flash", result.data.passed ? "quiz-passed" : "quiz-scored");
    to.searchParams.set("score", String(result.data.scorePercent));
    return NextResponse.redirect(to, 303);
  }

  return NextResponse.json({
    quizId,
    scorePercent: result.data.scorePercent,
    passed: result.data.passed,
    earnedPoints: result.data.earnedPoints,
    totalPoints: result.data.totalPoints,
  });
}

async function requireQuizCourseId(quizId: string): Promise<string | undefined> {
  const { prisma } = await import("@/lib/prisma");
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { courseId: true },
  });
  return quiz?.courseId;
}
