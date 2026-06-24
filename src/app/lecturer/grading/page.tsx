import { ClipboardCheck } from "lucide-react";
import { PageShell, PageTitle } from "@/components/site-shell";
import { Badge, Button, ButtonLink, EmptyState, Panel } from "@/components/ui";
import { gradableCourseIds } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { gradeSubmissionAction } from "../actions";

const FLASH: Record<string, { tone: "green" | "red"; message: string }> = {
  saved: { tone: "green", message: "Grade saved and the learner's results updated." },
  invalid: { tone: "red", message: "Choose a submission to grade." },
  missing: { tone: "red", message: "That submission no longer exists." },
  forbidden: { tone: "red", message: "You can only grade work in your own courses." },
  range: { tone: "red", message: "Score must be within the assignment's maximum." },
};

export default async function GradingPage({
  searchParams,
}: {
  searchParams: Promise<{ grade?: string }>;
}) {
  // Both lecturers and TAs grade; admins can grade anywhere.
  const grader = await requireRole(["LECTURER", "TA", "ADMIN"]);
  const params = await searchParams;
  const flash = params.grade ? FLASH[params.grade] : undefined;

  // Only submissions for courses this grader owns/assists — scoped at the query
  // level so no other course's work is ever loaded.
  const courseIds = await gradableCourseIds(grader);
  const submissions = await prisma.assignmentSubmission.findMany({
    where: { status: "SUBMITTED", assignment: { courseId: { in: courseIds } } },
    orderBy: { submittedAt: "asc" },
    select: {
      id: true,
      body: true,
      submittedAt: true,
      student: { select: { name: true, email: true } },
      assignment: {
        select: { title: true, maxScore: true, course: { select: { title: true } } },
      },
    },
  });

  return (
    <PageShell user={grader}>
      <PageTitle
        eyebrow="Grading queue"
        title="Score learner submissions"
        body="Review and grade assignments for the courses you teach or assist. Scores flow straight to each learner's results portal."
        action={
          <ButtonLink href="/lecturer" variant="secondary">
            Back to workspace
          </ButtonLink>
        }
      />

      {flash ? (
        <div
          className={
            flash.tone === "green"
              ? "mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
          }
        >
          {flash.message}
        </div>
      ) : null}

      {submissions.length === 0 ? (
        <EmptyState
          title="Nothing to grade"
          body="When learners submit assignments in your courses, they'll appear here ready to score."
        />
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <Panel key={submission.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="text-cyan-700" size={18} />
                    <h2 className="text-lg font-semibold">{submission.assignment.title}</h2>
                    <Badge tone="amber">Awaiting grade</Badge>
                  </div>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                    {submission.assignment.course.title} · {submission.student.name} (
                    {submission.student.email})
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    Submitted{" "}
                    {submission.submittedAt.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {submission.body ? (
                <p className="mt-4 rounded-md bg-stone-50 p-3 text-sm text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
                  {submission.body}
                </p>
              ) : (
                <p className="mt-4 text-sm italic text-zinc-500 dark:text-zinc-400">
                  No written submission body.
                </p>
              )}

              <form action={gradeSubmissionAction} className="mt-4 grid gap-3 sm:grid-cols-[160px_1fr_auto] sm:items-end">
                <input type="hidden" name="submissionId" value={submission.id} />
                <label className="text-sm font-medium">
                  Score (out of {submission.assignment.maxScore})
                  <input
                    type="number"
                    name="score"
                    min={0}
                    max={submission.assignment.maxScore}
                    required
                    className="mt-1 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </label>
                <label className="text-sm font-medium">
                  Feedback
                  <input
                    type="text"
                    name="feedback"
                    maxLength={2000}
                    placeholder="Specific, actionable feedback for the learner"
                    className="mt-1 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </label>
                <Button type="submit">Save grade</Button>
              </form>
            </Panel>
          ))}
        </div>
      )}
    </PageShell>
  );
}
