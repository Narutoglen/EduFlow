// Pure quiz scoring — no database, no server-only deps, so it is unit-testable
// in isolation. The server (assessments.ts) loads questions/correct choices from
// the DB and calls this; a client-supplied score is never trusted.

export type ScorableQuestion = {
  id: string;
  points: number;
  choices: { id: string; isCorrect: boolean }[];
};

export type QuizScore = {
  scorePercent: number;
  passed: boolean;
  earnedPoints: number;
  totalPoints: number;
};

/**
 * Score a quiz. `answers` maps questionId -> chosen choiceId. A question earns
 * its full points only when the chosen choice is the correct one; the score is
 * the percentage of total points earned, and `passed` compares it to passScore.
 */
export function scoreQuiz(
  questions: ScorableQuestion[],
  answers: Record<string, string>,
  passScore: number,
): QuizScore {
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  let earnedPoints = 0;
  for (const question of questions) {
    const correct = question.choices.find((c) => c.isCorrect);
    if (correct && answers[question.id] === correct.id) {
      earnedPoints += question.points;
    }
  }
  const scorePercent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  return { scorePercent, passed: scorePercent >= passScore, earnedPoints, totalPoints };
}
