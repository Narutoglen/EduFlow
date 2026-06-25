import { NextResponse } from "next/server";
<<<<<<< HEAD
import { createUserNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
=======
import { requireApiRole } from "@/lib/api-auth";
import { scoreAndRecordQuizAttempt } from "@/lib/assessments";
>>>>>>> 1676408760a8ccb2072fe64933b6be5d1efca3e9

// Submit a quiz attempt. The student is taken from the session; the quiz is
// scored server-side from the database (the client cannot submit its own score),
// and the attempt is persisted only if the student is enrolled in the course.
export async function POST(request: Request) {
<<<<<<< HEAD
  const auth = await requireApiRole(["STUDENT"]);
  if (auth instanceof NextResponse) return auth;
=======
  const contentType = request.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await request.json()
    : Object.fromEntries((await request.formData()).entries());
  const quizId = String(payload.quizId ?? "");
  const courseId = String(payload.courseId ?? "");
  const lessonId = String(payload.lessonId ?? "");
<<<<<<< HEAD
  const student = await requireRole("STUDENT");
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
=======
  const quiz = courses.flatMap((course) => course.quizzes).find((item) => item.id === quizId);
>>>>>>> 1c01f0308f5fafe3f3ca847d57554f19db9da16a
>>>>>>> 1676408760a8ccb2072fe64933b6be5d1efca3e9

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

<<<<<<< HEAD
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
=======
  const answers = Object.fromEntries(
    quiz.questions.map((question) => [question.id, String(payload[question.id] ?? "")]),
  );
  const possiblePoints = quiz.questions.reduce((total, question) => total + question.points, 0);
  const earnedPoints = quiz.questions.reduce((total, question) => {
    const selected = question.choices.find((choice) => choice.id === answers[question.id]);
    return total + (selected?.isCorrect ? question.points : 0);
  }, 0);
  const scorePercent = possiblePoints ? Math.round((earnedPoints / possiblePoints) * 100) : 0;
  const result = {
    scorePercent,
    correctCount: quiz.questions.filter((question) =>
      question.choices.some((choice) => choice.id === answers[question.id] && choice.isCorrect),
    ).length,
    totalQuestions: quiz.questions.length,
    passed: scorePercent >= quiz.passScore,
  };
  await prisma.quizAttempt.create({
    data: {
      quizId,
      studentId: student.id,
      answers,
      scorePercent,
      passed: result.passed,
    },
  });
  await createUserNotification({
    userId: student.id,
    title: "Quiz submitted",
    body: `${quiz.title} was submitted for ${quiz.course.title}. Score: ${scorePercent}%.`,
    kind: "exam-submitted",
    emailSubject: `EduFlow quiz submitted: ${quiz.title}`,
    emailBody: [
      `Hi ${student.name},`,
      "",
      `Your quiz "${quiz.title}" for ${quiz.course.title} has been submitted.`,
      `Score: ${scorePercent}%`,
      result.passed ? "Status: Passed" : "Status: Needs review",
    ].join("\n"),
  });

  if (!contentType.includes("application/json")) {
    const notice = result.passed ? "quiz-passed" : "quiz-review";
    return NextResponse.redirect(
      new URL(`/learn/${courseId}/${lessonId}?notice=${notice}`, request.url),
      303,
    );
>>>>>>> 1c01f0308f5fafe3f3ca847d57554f19db9da16a
  }

  return NextResponse.json({
    quizId,
<<<<<<< HEAD
    scorePercent: result.data.scorePercent,
    passed: result.data.passed,
    earnedPoints: result.data.earnedPoints,
    totalPoints: result.data.totalPoints,
=======
    ...result,
    feedback: "Instant feedback generated by the quiz service.",
>>>>>>> 1c01f0308f5fafe3f3ca847d57554f19db9da16a
  });
}
