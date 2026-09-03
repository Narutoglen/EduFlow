import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/api-auth";
import { scoreAndRecordQuizAttempt } from "@/lib/assessments";
import { createUserNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import type { QuizAnswers } from "@/lib/quiz-scoring";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  const auth = await requireApiRole(["STUDENT"]);
  if (auth instanceof NextResponse) return auth;
  const student = auth;

  const payload: Record<string, unknown> = isJson
    ? await request.json().catch(() => ({}))
    : Object.fromEntries((await request.formData()).entries());

  const quizId = String(payload.quizId ?? "").trim();
  const courseId = String(payload.courseId ?? "").trim();
  const lessonId = String(payload.lessonId ?? "").trim();

  if (!quizId) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "quizId is required." } },
      { status: 400 },
    );
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      course: true,
      questions: {
        include: { choices: true },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  // Build answer map from questions
  const answers: QuizAnswers = {};
  for (const question of quiz.questions) {
    const rawVal = payload[question.id];
    if (rawVal != null) {
      answers[question.id] = Array.isArray(rawVal) ? (rawVal as string[]) : String(rawVal);
    }
  }

  const result = await scoreAndRecordQuizAttempt({
    studentId: student.id,
    quizId,
    answers,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const scoreData = result.data;

  await createUserNotification({
    userId: student.id,
    title: "Quiz submitted",
    body: `${quiz.title} was submitted for ${quiz.course.title}. Score: ${scoreData.scorePercent}%.`,
    kind: "exam-submitted",
    emailSubject: `EduFlow quiz submitted: ${quiz.title}`,
    emailBody: [
      `Hi ${student.name},`,
      "",
      `Your quiz "${quiz.title}" for ${quiz.course.title} has been submitted.`,
      `Score: ${scoreData.scorePercent}%`,
      scoreData.passed ? "Status: Passed" : "Status: Needs review",
    ].join("\n"),
  });

  if (!isJson) {
    const notice = scoreData.passed ? "quiz-passed" : "quiz-review";
    return NextResponse.redirect(
      new URL(`/learn/${courseId || quiz.courseId}/${lessonId || quiz.lessonId}?notice=${notice}`, request.url),
      303,
    );
  }

  return NextResponse.json({
    quizId,
    attemptId: scoreData.attemptId,
    scorePercent: scoreData.scorePercent,
    passed: scoreData.passed,
    earnedPoints: scoreData.earnedPoints,
    totalPoints: scoreData.totalPoints,
    correctCount: scoreData.correctCount,
    totalQuestions: scoreData.totalQuestions,
    breakdown: scoreData.breakdown,
    feedback: scoreData.passed
      ? "Great job! You passed the quiz."
      : "Score is below passing threshold. Review the material and try again.",
  });
}
