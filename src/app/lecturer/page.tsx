import {
  BarChart3,
  CalendarPlus,
  GripVertical,
  Megaphone,
  Pencil,
  Plus,
} from "lucide-react";
import { PageShell, PageTitle } from "@/components/site-shell";
import { Badge, ButtonLink, Panel, ProgressBar, StatCard } from "@/components/ui";
import {
  formatMoney,
  getCoursesForLecturer,
  getLessons,
  getNotifications,
} from "@/lib/eduflow";
import { assignmentSubmissions, enrollments, userForRole } from "@/lib/mock-data";

export default function LecturerDashboardPage() {
  const lecturer = userForRole("LECTURER");
  const courses = getCoursesForLecturer(lecturer.id);
  const totalEnrollments = enrollments.filter((enrollment) =>
    courses.some((course) => course.id === enrollment.courseId),
  );
  const revenue = totalEnrollments.reduce((total, enrollment) => {
    const course = courses.find((item) => item.id === enrollment.courseId);
    return total + (course?.priceCents ?? 0);
  }, 0);
  const notifications = getNotifications(lecturer.id);

  return (
    <PageShell user={lecturer}>
      <PageTitle
        eyebrow="Lecturer workspace"
        title="Create, teach, grade, and improve your courses"
        body="Manage course structure, learner feedback, announcements, live sessions, and practical analytics from one place."
        action={
          <ButtonLink href="/lecturer?new=course">
            <Plus size={16} />
            New course
          </ButtonLink>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Courses" value={`${courses.length}`} detail="Draft, pending, and live" />
        <StatCard
          label="Enrollments"
          value={`${totalEnrollments.length}`}
          detail="Across owned courses"
        />
        <StatCard label="Revenue" value={formatMoney(revenue)} detail="Mock Stripe gross" />
        <StatCard
          label="To grade"
          value={`${assignmentSubmissions.filter((submission) => submission.status === "SUBMITTED").length}`}
          detail="Pending submissions"
        />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Panel>
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Course builder</h2>
              <Badge tone="blue">Drag handles modeled</Badge>
            </div>
            <div className="space-y-4">
              {courses.map((course) => (
                <div key={course.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{course.title}</h3>
                        <Badge tone={course.status === "PUBLISHED" ? "green" : "amber"}>
                          {course.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                        {course.modules.length} modules, {getLessons(course).length} lessons
                      </p>
                    </div>
                    <ButtonLink href={`/courses/${course.slug}`} variant="secondary">
                      <Pencil size={16} />
                      Preview
                    </ButtonLink>
                  </div>
                  <div className="mt-4 space-y-3">
                    {course.modules.map((module) => (
                      <div key={module.id} className="rounded-lg bg-stone-50 p-3 dark:bg-zinc-950">
                        <div className="flex items-center gap-2 font-medium">
                          <GripVertical size={16} className="text-zinc-400" />
                          {module.title}
                        </div>
                        <div className="mt-2 space-y-2 pl-6">
                          {module.lessons.map((lesson) => (
                            <div
                              key={lesson.id}
                              className="flex items-center justify-between rounded-md bg-white px-3 py-2 text-sm dark:bg-zinc-900"
                            >
                              <span>{lesson.title}</span>
                              <span>{lesson.durationMinutes}m</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <div className="mb-5 flex items-center gap-2">
              <BarChart3 className="text-cyan-700" size={20} />
              <h2 className="text-xl font-semibold">Course analytics</h2>
            </div>
            <div className="space-y-5">
              {courses.map((course) => {
                const courseEnrollments = enrollments.filter(
                  (enrollment) => enrollment.courseId === course.id,
                );
                const averageCompletion =
                  courseEnrollments.reduce(
                    (total, enrollment) => total + enrollment.progressPercent,
                    0,
                  ) / Math.max(courseEnrollments.length, 1);
                return (
                  <div key={course.id}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span>{course.title}</span>
                      <span>{Math.round(averageCompletion)}% completion</span>
                    </div>
                    <ProgressBar value={averageCompletion} />
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        <aside className="space-y-6">
          <Panel>
            <div className="flex items-center gap-2">
              <Megaphone className="text-amber-600" size={20} />
              <h2 className="text-xl font-semibold">Announcements</h2>
            </div>
            <form className="mt-4 space-y-3">
              <input
                className="min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                placeholder="Announcement title"
              />
              <textarea
                className="min-h-28 w-full rounded-md border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                placeholder="Message to enrolled learners"
              />
              <button className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950">
                Post announcement
              </button>
            </form>
          </Panel>

          <Panel>
            <div className="flex items-center gap-2">
              <CalendarPlus className="text-emerald-600" size={20} />
              <h2 className="text-xl font-semibold">Live sessions</h2>
            </div>
            <div className="mt-4 rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800">
              <p className="font-semibold">AI critique lab</p>
              <p className="mt-1 text-zinc-600 dark:text-zinc-300">
                Zoom link and calendar event adapters are mocked for the MVP.
              </p>
            </div>
          </Panel>

          <Panel>
            <h2 className="text-xl font-semibold">Notifications</h2>
            <div className="mt-4 space-y-3">
              {notifications.map((item) => (
                <div key={item.id} className="rounded-lg bg-stone-50 p-3 text-sm dark:bg-zinc-950">
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-zinc-600 dark:text-zinc-300">{item.body}</p>
                </div>
              ))}
            </div>
          </Panel>
        </aside>
      </section>
    </PageShell>
  );
}
