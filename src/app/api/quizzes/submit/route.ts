import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/api-auth";
import { scoreAndRecordQuizAttempt } from "@/lib/assessments";

// Submit a quiz attempt. The student is taken from the session; the quiz is
// scored server-side from the database (the client cannot submit its own score),
// and the attempt is persisted only if the student is enrolled in the course.
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

  // answers: questionId -> choiceId. Accept an explicit `answers` object (JSON
  // clients) or top-level question fields (the lesson form's radio inputs).
  const rawAnswers =
    payload.answers && typeof payload.answers === "object"
      ? (payload.answers as Record<string, unknown>)
      : payload;
  const answers: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawAnswers)) {
    if (key !== "quizId" && key !== "answers") answers[key] = String(value);
  }

  const result = await scoreAndRecordQuizAttempt({ studentId: auth.id, quizId, answers });

  if (!result.ok) {
    if (isForm) {
      return NextResponse.redirect(new URL("/achievements?flash=quiz-error", request.url), 303);
    }
    return NextResponse.json({ error: { code: "FORBIDDEN", message: result.error } }, {
      status: result.status,
    });
  }

  if (isForm) {
    // Return the learner to their results portal so the new score is visible.
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
