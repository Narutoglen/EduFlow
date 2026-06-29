import {
  MessageSquare,
  NotebookPen,
  UsersRound,
} from "lucide-react";
import { PageShell, PageTitle } from "@/components/site-shell";
import { Badge, ButtonLink, Panel, ProgressBar, StatCard } from "@/components/ui";
import {
  getCourseById,
  getCoursesForTa,
  getLessonDiscussions,
  getLessons,
} from "@/lib/eduflow";
import { assignmentSubmissions, enrollments, users } from "@/lib/mock-data";
import { requireRole } from "@/lib/session";

export default async function TaDashboardPage() {
  const ta = await requireRole("TA");
  const courses = getCoursesForTa(ta.id);
  const courseIds = new Set(courses.map((course) => course.id));
  const roster = enrollments.filter((enrollment) => courseIds.has(enrollment.courseId));
  const submissions = assignmentSubmissions.filter((submission) =>
    roster.some((enrollment) => enrollment.studentId === submission.studentId),
  );

  return (
    <PageShell user={ta}>
      <PageTitle
        eyebrow="Teaching assistant"
        title="Support learners without editing course content"
        body="Review assigned course rosters, respond to forum questions, and grade submissions delegated by lecturers."
        action={
          <ButtonLink href="/lecturer/grading">
            <NotebookPen size={16} />
            Open grading queue
          </ButtonLink>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Assigned courses" value={`${courses.length}`} detail="Delegated by lecturer" />
        <StatCard label="Roster" value={`${roster.length}`} detail="Learners in scope" />
        <StatCard label="Submissions" value={`${submissions.length}`} detail="Visible grading queue" />
        <StatCard
          label="Forum threads"
          value={`${courses.flatMap(getLessons).length}`}
          detail="Lesson Q and A spaces"
        />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
        <Panel>
          <div className="mb-5 flex items-center gap-2">
            <UsersRound className="text-cyan-700" size={20} />
            <h2 className="text-xl font-semibold">Student roster</h2>
          </div>
          <div className="space-y-4">
            {roster.map((enrollment) => {
              const student = users.find((user) => user.id === enrollment.studentId);
              const course = getCourseById(enrollment.courseId);
              return (
                <div
                  key={enrollment.id}
                  className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{student?.name}</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-300">
                        {course?.title}
                      </p>
                    </div>
                    <Badge tone="green">{enrollment.gradePercent}% grade</Badge>
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={enrollment.progressPercent} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <aside className="space-y-6">
          <Panel>
            <div className="flex items-center gap-2">
              <NotebookPen className="text-emerald-600" size={20} />
              <h2 className="text-xl font-semibold">Grading queue</h2>
            </div>
            <div className="mt-4 space-y-3">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">Assignment submission</p>
                    <Badge tone={submission.status === "GRADED" ? "green" : "amber"}>
                      {submission.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-zinc-600 dark:text-zinc-300">
                    {submission.feedback ?? "Ready for written feedback."}
                  </p>
                  <ButtonLink href="/lecturer/grading" variant="secondary">
                    Grade
                  </ButtonLink>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <div className="flex items-center gap-2">
              <MessageSquare className="text-amber-600" size={20} />
              <h2 className="text-xl font-semibold">Forum moderation</h2>
            </div>
            <div className="mt-4 space-y-3">
              {courses.flatMap(getLessons).slice(0, 3).map((lesson) => (
                <div key={lesson.id} className="rounded-lg bg-stone-50 p-3 text-sm dark:bg-zinc-950">
                  <p className="font-semibold">{lesson.title}</p>
                  <p className="mt-1 text-zinc-600 dark:text-zinc-300">
                    {getLessonDiscussions(lesson.forumThreadId).length} open posts
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </aside>
      </section>
    </PageShell>
  );
}
