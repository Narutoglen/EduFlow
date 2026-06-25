import { Award, CheckCircle2, Circle, ListChecks, Lock, Medal, Trophy } from "lucide-react";
import { PageShell, PageTitle } from "@/components/site-shell";
import { Badge, ButtonLink, EmptyState, Panel, StatCard } from "@/components/ui";
import { getStudentAchievements } from "@/lib/achievements";
import { requireRole } from "@/lib/session";

const FLASH: Record<string, { tone: "green" | "amber" | "red"; message: string }> = {
  "quiz-passed": { tone: "green", message: "Nice work — you passed the quiz. Your score is recorded below." },
  "quiz-scored": { tone: "amber", message: "Quiz submitted. Your score is recorded below." },
  "quiz-error": { tone: "red", message: "We couldn't record that quiz — check you're enrolled in the course." },
  "assignment-submitted": { tone: "green", message: "Assignment submitted. It will appear once your lecturer grades it." },
  "assignment-error": { tone: "red", message: "We couldn't record that submission — check you're enrolled in the course." },
};

export default async function AchievementsPage({
  searchParams,
}: {
  searchParams: Promise<{ flash?: string; score?: string }>;
}) {
  const student = await requireRole(["STUDENT"]);
  const { summary, scores, certificates, achievements } = await getStudentAchievements(
    student.id,
  );

  const params = await searchParams;
  const flash = params.flash ? FLASH[params.flash] : undefined;

  const milestones = [
    { done: summary.testsPassed > 0, label: "Passed your first scored test" },
    { done: summary.coursesCompleted > 0, label: "Completed a full course" },
    { done: summary.certificates > 0, label: "Earned a verifiable certificate" },
  ];

  return (
    <PageShell user={student}>
      <PageTitle
        eyebrow="Student portal"
        title="Achievements & results"
        body="Review the tests your lecturers have scored, track your overall progress, and access the certificates you've earned."
        action={
          <ButtonLink href="/dashboard" variant="secondary">
            Back to dashboard
          </ButtonLink>
        }
      />

      {flash ? (
        <div
          className={
            flash.tone === "green"
              ? "mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
              : flash.tone === "amber"
                ? "mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"
                : "mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
          }
        >
          {flash.message}
          {params.score ? <span className="font-semibold"> ({params.score}%)</span> : null}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Average grade" value={`${summary.averageGrade}%`} detail="Across enrolled courses" />
        <StatCard
          label="Tests passed"
          value={`${summary.testsPassed}/${summary.testsTaken}`}
          detail="Quizzes scored by lecturers"
        />
        <StatCard
          label="Courses completed"
          value={`${summary.coursesCompleted}/${summary.coursesEnrolled}`}
          detail="Fully finished"
        />
        <StatCard label="Certificates" value={`${summary.certificates}`} detail="Verifiable awards" />
      </section>

      <Panel className="mt-8">
        <div className="mb-5 flex items-center gap-2">
          <Medal className="text-amber-500" size={20} />
          <h2 className="text-xl font-semibold">Achievements collected</h2>
          <Badge tone="amber">
            {achievements.filter((a) => a.earned).length}/{achievements.length}
          </Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={
                achievement.earned
                  ? "flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30"
                  : "flex items-start gap-3 rounded-lg border border-zinc-200 bg-stone-50 p-4 opacity-70 dark:border-zinc-800 dark:bg-zinc-950"
              }
            >
              {achievement.earned ? (
                <Medal size={20} className="mt-0.5 shrink-0 text-amber-500" />
              ) : (
                <Lock size={18} className="mt-0.5 shrink-0 text-zinc-400 dark:text-zinc-600" />
              )}
              <div>
                <p
                  className={
                    achievement.earned
                      ? "font-semibold text-amber-900 dark:text-amber-200"
                      : "font-semibold text-zinc-500 dark:text-zinc-400"
                  }
                >
                  {achievement.label}
                </p>
                <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
                  {achievement.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <Panel>
          <div className="mb-5 flex items-center gap-2">
            <ListChecks className="text-cyan-700" size={20} />
            <h2 className="text-xl font-semibold">Test &amp; assignment scores</h2>
          </div>
          {scores.length === 0 ? (
            <EmptyState
              title="No scored work yet"
              body="Once your lecturers grade your quizzes and assignments, the results will appear here."
            />
          ) : (
            <div className="space-y-3">
              {scores.map((score) => (
                <div
                  key={`${score.kind}-${score.id}`}
                  className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{score.title}</p>
                        <Badge tone={score.kind === "quiz" ? "blue" : "violet"}>
                          {score.kind === "quiz" ? "Quiz" : "Assignment"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                        {score.courseTitle}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">
                        {score.kind === "assignment" && score.rawScore != null
                          ? `${score.rawScore}/${score.maxScore}`
                          : score.scorePercent != null
                            ? `${score.scorePercent}%`
                            : "Pending"}
                      </p>
                      <Badge
                        tone={
                          score.passed === true
                            ? "green"
                            : score.passed === false
                              ? "red"
                              : "amber"
                        }
                      >
                        {score.status}
                      </Badge>
                    </div>
                  </div>
                  {score.feedback ? (
                    <p className="mt-3 rounded-md bg-stone-50 p-3 text-sm text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300">
                      <span className="font-medium text-zinc-700 dark:text-zinc-200">
                        Lecturer feedback:{" "}
                      </span>
                      {score.feedback}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </Panel>

        <aside className="space-y-6">
          <Panel>
            <div className="mb-5 flex items-center gap-2">
              <Award className="text-emerald-600" size={20} />
              <h2 className="text-xl font-semibold">Certificates</h2>
            </div>
            {certificates.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Complete a course to earn a verifiable certificate.
              </p>
            ) : (
              <div className="space-y-3">
                {certificates.map((certificate) => (
                  <div
                    key={certificate.id}
                    className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-900/50 dark:bg-emerald-950/30"
                  >
                    <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                      {certificate.courseTitle}
                    </p>
                    <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                      Issued{" "}
                      {certificate.issuedAt.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      · {certificate.verificationId}
                    </p>
                    <div className="mt-3">
                      <ButtonLink href={`/verify/${certificate.verificationId}`} variant="secondary">
                        Verify certificate
                      </ButtonLink>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel>
            <div className="mb-4 flex items-center gap-2">
              <Trophy className="text-amber-500" size={20} />
              <h2 className="text-xl font-semibold">Milestones</h2>
            </div>
            <ul className="space-y-2.5 text-sm">
              {milestones.map((milestone) => (
                <li key={milestone.label} className="flex items-center gap-2">
                  {milestone.done ? (
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                  ) : (
                    <Circle size={16} className="shrink-0 text-zinc-300 dark:text-zinc-600" />
                  )}
                  <span
                    className={
                      milestone.done
                        ? "text-zinc-700 dark:text-zinc-200"
                        : "text-zinc-400 dark:text-zinc-500"
                    }
                  >
                    {milestone.label}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </aside>
      </section>
    </PageShell>
  );
}
