import "server-only";
import { prisma } from "./prisma";
import { isEnrolled } from "./authz";
import { scoreQuiz, type QuizScore } from "./quiz-scoring";

// Write side of the student "scored work" flow. All scoring happens on the
// server from the database's source of truth (QuizChoice.isCorrect); any score
// a client might send is ignored. Every write is bound to the authenticated
// studentId and gated by enrollment so a tampered courseId/quizId/assignmentId
// in the request cannot reach another learner's data.

export type AssessmentResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: 403 | 404; error: string };

/**
 * Recompute an enrollment's headline grade from real graded work: the best
 * attempt per quiz plus each graded assignment (as a percentage of its max),
 * averaged. Called after a quiz is taken or an assignment is graded.
 */
export async function recomputeEnrollmentGrade(studentId: string, courseId: string): Promise<void> {
  const [attempts, gradedSubmissions] = await Promise.all([
    prisma.quizAttempt.findMany({
      where: { studentId, quiz: { courseId } },
      select: { quizId: true, scorePercent: true },
    }),
    prisma.assignmentSubmission.findMany({
      where: { studentId, status: "GRADED", assignment: { courseId } },
      select: { score: true, assignment: { select: { maxScore: true } } },
    }),
  ]);

  const components: number[] = [];

  const bestByQuiz = new Map<string, number>();
  for (const a of attempts) {
    const prev = bestByQuiz.get(a.quizId) ?? 0;
    if (a.scorePercent > prev) bestByQuiz.set(a.quizId, a.scorePercent);
  }
  components.push(...bestByQuiz.values());

  for (const s of gradedSubmissions) {
    if (s.score != null && s.assignment.maxScore > 0) {
      components.push(Math.round((s.score / s.assignment.maxScore) * 100));
    }
  }

  if (components.length === 0) return;
  const gradePercent = Math.round(
    components.reduce((sum, value) => sum + value, 0) / components.length,
  );
  // updateMany: no-op (rather than throw) if the enrollment was removed.
  await prisma.enrollment.updateMany({
    where: { studentId, courseId },
    data: { gradePercent },
  });
}

/** Score a quiz attempt server-side and persist it for the enrolled student. */
export async function scoreAndRecordQuizAttempt(input: {
  studentId: string;
  quizId: string;
  answers: Record<string, string>;
}): Promise<AssessmentResult<{ attemptId: string } & QuizScore>> {
  const quiz = await prisma.quiz.findUnique({
    where: { id: input.quizId },
    select: {
      id: true,
      courseId: true,
      passScore: true,
      questions: {
        select: { id: true, points: true, choices: { select: { id: true, isCorrect: true } } },
      },
    },
  });
  if (!quiz) return { ok: false, status: 404, error: "Quiz not found." };

  if (!(await isEnrolled(input.studentId, quiz.courseId))) {
    return { ok: false, status: 403, error: "You are not enrolled in this course." };
  }

  const score = scoreQuiz(quiz.questions, input.answers, quiz.passScore);

  const attempt = await prisma.quizAttempt.create({
    data: {
      quizId: quiz.id,
      studentId: input.studentId,
      answers: input.answers,
      scorePercent: score.scorePercent,
      passed: score.passed,
    },
    select: { id: true },
  });

  await recomputeEnrollmentGrade(input.studentId, quiz.courseId);

  return { ok: true, data: { attemptId: attempt.id, ...score } };
}

/** Record (or update an ungraded) assignment submission for the enrolled student. */
export async function recordAssignmentSubmission(input: {
  studentId: string;
  assignmentId: string;
  body: string;
}): Promise<AssessmentResult<{ submissionId: string; status: string }>> {
  const assignment = await prisma.assignment.findUnique({
    where: { id: input.assignmentId },
    select: { id: true, courseId: true },
  });
  if (!assignment) return { ok: false, status: 404, error: "Assignment not found." };

  if (!(await isEnrolled(input.studentId, assignment.courseId))) {
    return { ok: false, status: 403, error: "You are not enrolled in this course." };
  }

  // Reuse an existing ungraded submission so re-submitting doesn't pile up rows;
  // once graded, a fresh submission row is created.
  const existing = await prisma.assignmentSubmission.findFirst({
    where: { assignmentId: assignment.id, studentId: input.studentId, status: "SUBMITTED" },
    select: { id: true },
  });

  const submission = existing
    ? await prisma.assignmentSubmission.update({
        where: { id: existing.id },
        data: { body: input.body, submittedAt: new Date() },
        select: { id: true, status: true },
      })
    : await prisma.assignmentSubmission.create({
        data: {
          assignmentId: assignment.id,
          studentId: input.studentId,
          body: input.body,
          status: "SUBMITTED",
        },
        select: { id: true, status: true },
      });

  return { ok: true, data: { submissionId: submission.id, status: submission.status } };
}

/** Mark a lesson complete for the enrolled student and recompute course progress. */
export async function recordLessonProgress(input: {
  studentId: string;
  lessonId: string;
}): Promise<AssessmentResult<{ progressPercent: number }>> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: input.lessonId },
    select: { id: true, module: { select: { courseId: true } } },
  });
  if (!lesson) return { ok: false, status: 404, error: "Lesson not found." };

  const courseId = lesson.module.courseId;
  if (!(await isEnrolled(input.studentId, courseId))) {
    return { ok: false, status: 403, error: "You are not enrolled in this course." };
  }

  await prisma.lessonProgress.upsert({
    where: { studentId_lessonId: { studentId: input.studentId, lessonId: lesson.id } },
    update: { completed: true },
    create: { studentId: input.studentId, lessonId: lesson.id, completed: true },
  });

  const [totalLessons, completedLessons] = await Promise.all([
    prisma.lesson.count({ where: { module: { courseId } } }),
    prisma.lessonProgress.count({
      where: { studentId: input.studentId, completed: true, lesson: { module: { courseId } } },
    }),
  ]);

  const progressPercent =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  await prisma.enrollment.update({
    where: { studentId_courseId: { studentId: input.studentId, courseId } },
    data: {
      progressPercent,
      completedAt: progressPercent === 100 ? new Date() : null,
    },
  });

  return { ok: true, data: { progressPercent } };
}
