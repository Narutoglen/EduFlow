import { prisma } from "./prisma";

// A unified "scored item" — a graded quiz attempt or a graded assignment — so
// the student portal can show everything a lecturer has marked in one list.
export type TestScore = {
  id: string;
  kind: "quiz" | "assignment";
  title: string;
  courseTitle: string;
  scorePercent: number | null;
  rawScore: number | null;
  maxScore: number | null;
  passed: boolean | null;
  status: string;
  feedback: string | null;
  date: Date;
};

export type AchievementSummary = {
  coursesEnrolled: number;
  coursesCompleted: number;
  averageGrade: number;
  certificates: number;
  testsTaken: number;
  testsPassed: number;
};

export type StudentCertificate = {
  id: string;
  verificationId: string;
  courseTitle: string;
  issuedAt: Date;
};

// A collectible achievement badge. `earned` reflects the student's real DB
// aggregates, so the portal shows exactly what they have unlocked.
export type Achievement = {
  id: string;
  label: string;
  description: string;
  earned: boolean;
};

export type StudentAchievements = {
  summary: AchievementSummary;
  scores: TestScore[];
  certificates: StudentCertificate[];
  achievements: Achievement[];
};

/** Derive the badge wall from the student's verified results. */
function computeAchievements(
  summary: AchievementSummary,
  scores: TestScore[],
): Achievement[] {
  const hasPerfectQuiz = scores.some(
    (score) => score.kind === "quiz" && score.scorePercent === 100,
  );
  return [
    {
      id: "first-pass",
      label: "First Pass",
      description: "Passed your first scored test",
      earned: summary.testsPassed > 0,
    },
    {
      id: "perfect-score",
      label: "Perfect Score",
      description: "Scored 100% on a quiz",
      earned: hasPerfectQuiz,
    },
    {
      id: "course-complete",
      label: "Course Complete",
      description: "Finished a full course end to end",
      earned: summary.coursesCompleted > 0,
    },
    {
      id: "certified",
      label: "Certified",
      description: "Earned a verifiable certificate",
      earned: summary.certificates > 0,
    },
    {
      id: "high-achiever",
      label: "High Achiever",
      description: "Holding an average grade of 85% or higher",
      earned: summary.averageGrade >= 85,
    },
    {
      id: "consistent",
      label: "Consistent Learner",
      description: "Passed three or more tests",
      earned: summary.testsPassed >= 3,
    },
  ];
}

/** Everything a student needs for the achievements portal: scores, summary, certs. */
export async function getStudentAchievements(
  studentId: string,
): Promise<StudentAchievements> {
  const [enrollments, attempts, submissions, certs] = await Promise.all([
    prisma.enrollment.findMany({
      where: { studentId },
      select: { progressPercent: true, gradePercent: true },
    }),
    prisma.quizAttempt.findMany({
      where: { studentId },
      orderBy: { submittedAt: "desc" },
      select: {
        id: true,
        scorePercent: true,
        passed: true,
        submittedAt: true,
        quiz: { select: { title: true, course: { select: { title: true } } } },
      },
    }),
    prisma.assignmentSubmission.findMany({
      where: { studentId },
      orderBy: { submittedAt: "desc" },
      select: {
        id: true,
        score: true,
        status: true,
        feedback: true,
        submittedAt: true,
        assignment: {
          select: { title: true, maxScore: true, course: { select: { title: true } } },
        },
      },
    }),
    prisma.certificate.findMany({
      where: { studentId },
      orderBy: { issuedAt: "desc" },
      select: {
        id: true,
        verificationId: true,
        issuedAt: true,
        course: { select: { title: true } },
      },
    }),
  ]);

  const quizScores: TestScore[] = attempts.map((attempt) => ({
    id: attempt.id,
    kind: "quiz",
    title: attempt.quiz.title,
    courseTitle: attempt.quiz.course.title,
    scorePercent: attempt.scorePercent,
    rawScore: attempt.scorePercent,
    maxScore: 100,
    passed: attempt.passed,
    status: attempt.passed ? "Passed" : "Needs review",
    feedback: null,
    date: attempt.submittedAt,
  }));

  const assignmentScores: TestScore[] = submissions.map((submission) => {
    const max = submission.assignment.maxScore;
    const percent =
      submission.score != null && max > 0
        ? Math.round((submission.score / max) * 100)
        : null;
    return {
      id: submission.id,
      kind: "assignment",
      title: submission.assignment.title,
      courseTitle: submission.assignment.course.title,
      scorePercent: percent,
      rawScore: submission.score,
      maxScore: max,
      passed: percent == null ? null : percent >= 50,
      status: submission.status === "GRADED" ? "Graded" : "Submitted",
      feedback: submission.feedback,
      date: submission.submittedAt,
    };
  });

  const scores = [...quizScores, ...assignmentScores].sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  );

  const coursesEnrolled = enrollments.length;
  const coursesCompleted = enrollments.filter((e) => e.progressPercent === 100).length;
  const averageGrade = coursesEnrolled
    ? Math.round(
        enrollments.reduce((total, e) => total + e.gradePercent, 0) / coursesEnrolled,
      )
    : 0;

  const summary: AchievementSummary = {
    coursesEnrolled,
    coursesCompleted,
    averageGrade,
    certificates: certs.length,
    testsTaken: attempts.length,
    testsPassed: attempts.filter((a) => a.passed).length,
  };

  return {
    summary,
    scores,
    certificates: certs.map((c) => ({
      id: c.id,
      verificationId: c.verificationId,
      courseTitle: c.course.title,
      issuedAt: c.issuedAt,
    })),
    achievements: computeAchievements(summary, scores),
  };
}
