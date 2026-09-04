// Pure quiz scoring — no database, no server-only deps, so it is unit-testable
// in isolation. The server (assessments.ts) loads questions/correct choices from
// the DB and calls this; a client-supplied score is never trusted.

export type ScorableChoice = {
  id: string;
  isCorrect: boolean;
};

export type ScorableQuestion = {
  id: string;
  points: number;
  type?: "MCQ" | "TRUE_FALSE" | "MULTI_SELECT" | string;
  choices: ScorableChoice[];
  allOrNothing?: boolean;
};

export type QuestionScoreBreakdown = {
  questionId: string;
  earnedPoints: number;
  maxPoints: number;
  isCorrect: boolean;
  isPartiallyCorrect: boolean;
  selectedChoiceIds: string[];
  correctChoiceIds: string[];
};

export type QuizScore = {
  scorePercent: number;
  passed: boolean;
  earnedPoints: number;
  totalPoints: number;
  correctCount: number;
  totalQuestions: number;
  breakdown: QuestionScoreBreakdown[];
};

export type QuizAnswers = Record<string, string | string[] | null | undefined>;

export type ScoringOptions = {
  allowPartialCredit?: boolean; // default: true for MULTI_SELECT
};

/** Normalizes raw student answers for a single question into a unique array of choice IDs. */
export function normalizeSelectedChoiceIds(
  rawAnswer: string | string[] | null | undefined,
): string[] {
  if (!rawAnswer) return [];
  if (Array.isArray(rawAnswer)) {
    return Array.from(
      new Set(
        rawAnswer
          .map((item) => String(item).trim())
          .filter((item) => item.length > 0),
      ),
    );
  }
  const str = String(rawAnswer).trim();
  if (!str) return [];
  if (str.includes(",")) {
    return Array.from(
      new Set(
        str
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item.length > 0),
      ),
    );
  }
  return [str];
}

/**
 * Score a single question based on its type and choices.
 */
export function scoreQuestion(
  question: ScorableQuestion,
  rawAnswer: string | string[] | null | undefined,
  options?: ScoringOptions,
): QuestionScoreBreakdown {
  if (!question) {
    return {
      questionId: "",
      earnedPoints: 0,
      maxPoints: 0,
      isCorrect: false,
      isPartiallyCorrect: false,
      selectedChoiceIds: [],
      correctChoiceIds: [],
    };
  }

  const maxPoints = Number.isFinite(question.points) ? Math.max(0, question.points) : 0;
  const choices = Array.isArray(question.choices) ? question.choices.filter(Boolean) : [];
  const selectedChoiceIds = normalizeSelectedChoiceIds(rawAnswer);
  const validChoiceIds = new Set(choices.map((c) => c.id));
  const validSelected = selectedChoiceIds.filter((id) => validChoiceIds.has(id));
  const correctChoiceIds = choices.filter((c) => c.isCorrect).map((c) => c.id);

  if (maxPoints === 0) {
    return {
      questionId: question.id,
      earnedPoints: 0,
      maxPoints: 0,
      isCorrect: true,
      isPartiallyCorrect: false,
      selectedChoiceIds: validSelected,
      correctChoiceIds,
    };
  }

  const isMultiSelect =
    question.type === "MULTI_SELECT" || correctChoiceIds.length > 1;

  if (!isMultiSelect) {
    // Single choice MCQ or True/False
    const selectedId = validSelected[0];
    const isCorrect = Boolean(
      selectedId && correctChoiceIds.includes(selectedId) && validSelected.length === 1,
    );
    const earnedPoints = isCorrect ? maxPoints : 0;
    return {
      questionId: question.id,
      earnedPoints,
      maxPoints,
      isCorrect,
      isPartiallyCorrect: false,
      selectedChoiceIds: validSelected,
      correctChoiceIds,
    };
  }

  // Multi-select question
  const totalCorrect = correctChoiceIds.length;
  const incorrectChoices = choices.filter((c) => !c.isCorrect);
  const totalIncorrect = incorrectChoices.length;

  if (totalCorrect === 0) {
    // Edge case: no correct choices defined
    return {
      questionId: question.id,
      earnedPoints: 0,
      maxPoints,
      isCorrect: false,
      isPartiallyCorrect: false,
      selectedChoiceIds: validSelected,
      correctChoiceIds,
    };
  }

  const correctSelected = validSelected.filter((id) => correctChoiceIds.includes(id)).length;
  const incorrectSelected = validSelected.filter((id) => !correctChoiceIds.includes(id)).length;

  const isFullMatch =
    correctSelected === totalCorrect && incorrectSelected === 0;

  if (question.allOrNothing || options?.allowPartialCredit === false) {
    const earnedPoints = isFullMatch ? maxPoints : 0;
    return {
      questionId: question.id,
      earnedPoints,
      maxPoints,
      isCorrect: isFullMatch,
      isPartiallyCorrect: false,
      selectedChoiceIds: validSelected,
      correctChoiceIds,
    };
  }

  // Partial credit with penalty for guessing incorrect options
  let fraction = 0;
  if (totalIncorrect > 0) {
    const correctFraction = correctSelected / totalCorrect;
    const incorrectPenalty = incorrectSelected / totalIncorrect;
    fraction = Math.max(0, correctFraction - incorrectPenalty);
  } else {
    // All options are correct
    fraction = correctSelected / totalCorrect;
  }

  const rawEarned = maxPoints * fraction;
  // Round to 2 decimal places to avoid floating point anomalies (e.g. 3.3333333333333335)
  const earnedPoints = Math.round(rawEarned * 100) / 100;
  const isCorrect = isFullMatch;
  const isPartiallyCorrect = !isCorrect && earnedPoints > 0;

  return {
    questionId: question.id,
    earnedPoints,
    maxPoints,
    isCorrect,
    isPartiallyCorrect,
    selectedChoiceIds: validSelected,
    correctChoiceIds,
  };
}

/**
 * Score a quiz.
 * `answers` maps questionId -> choiceId or array of choiceIds.
 * Score is calculated as percentage of total available points.
 */
export function scoreQuiz(
  questions: ScorableQuestion[],
  answers: QuizAnswers = {},
  passScore = 70,
  options?: ScoringOptions,
): QuizScore {
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    const isPassing = Number.isFinite(passScore) && passScore <= 0;
    return {
      scorePercent: isPassing ? 100 : 0,
      passed: isPassing,
      earnedPoints: 0,
      totalPoints: 0,
      correctCount: 0,
      totalQuestions: 0,
      breakdown: [],
    };
  }

  const safeAnswers = answers ?? {};
  const validQuestions = questions.filter(Boolean);
  const breakdown: QuestionScoreBreakdown[] = validQuestions.map((q) =>
    scoreQuestion(q, safeAnswers[q.id], options),
  );

  const totalPoints = validQuestions.reduce(
    (sum, q) => sum + (Number.isFinite(q.points) ? Math.max(0, q.points) : 0),
    0,
  );
  const earnedPoints = breakdown.reduce((sum, b) => sum + b.earnedPoints, 0);
  const correctCount = breakdown.filter((b) => b.isCorrect).length;

  const scorePercent =
    totalPoints > 0
      ? Math.min(100, Math.max(0, Math.round((earnedPoints / totalPoints) * 100)))
      : passScore <= 0
        ? 100
        : 0;

  const passed = scorePercent >= passScore;

  return {
    scorePercent,
    passed,
    earnedPoints: Math.round(earnedPoints * 100) / 100,
    totalPoints,
    correctCount,
    totalQuestions: validQuestions.length,
    breakdown,
  };
}

