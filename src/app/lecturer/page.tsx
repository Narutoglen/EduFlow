import {
  BarChart3,
  CalendarPlus,
  CheckCircle2,
<<<<<<< HEAD
  ClipboardCheck,
=======
>>>>>>> 1c01f0308f5fafe3f3ca847d57554f19db9da16a
  GripVertical,
  Megaphone,
  Pencil,
  Plus,
  Send,
} from "lucide-react";
import { PageShell, PageTitle } from "@/components/site-shell";
import {
  formatMoney,
  getCoursesForLecturer,
  getLessons,
  getNotifications,
} from "@/lib/eduflow";
import { assignmentSubmissions, enrollments } from "@/lib/mock-data";
import { requireRole } from "@/lib/session";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LecturerDashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const isCreatingCourse = valueOf(params.new) === "course";
  const notice = valueOf(params.notice);
  const lecturer = await requireRole("LECTURER");
  const courses = getCoursesForLecturer(lecturer.id);
  const totalEnrollments = enrollments.filter((enrollment) =>
    courses.some((course) => course.id === enrollment.courseId),
  );
  const revenue = totalEnrollments.reduce((total, enrollment) => {
    const course = courses.find((item) => item.id === enrollment.courseId);
    return total + (course?.priceCents ?? 0);
  }, 0);
>>>>>>> 1c01f0308f5fafe3f3ca847d57554f19db9da16a
  const notifications = getNotifications(lecturer.id);

  return (
    <PageShell user={lecturer}>
      <PageTitle
        eyebrow="Lecturer workspace"
        title="Create, teach, grade, and improve your courses"
        body="Manage course structure, learner feedback, announcements, live sessions, and practical analytics from one place."
        action={
          <>
            <ButtonLink href="/lecturer/grading" variant="secondary">
              <ClipboardCheck size={16} />
              Grade submissions
            </ButtonLink>
            <ButtonLink href="/lecturer/courses/new">
              <Plus size={16} />
              New course
            </ButtonLink>
          </>
        }
      />

<<<<<<< HEAD
      {params.created ? (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle2 size={16} />
          Course created as a draft. Add modules and lessons, then submit it for review.
        </div>
=======
      {notice ? (
        <Panel className="mb-6 border-emerald-200 bg-emerald-50 text-emerald-950">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} />
            <p className="font-semibold">
              {notice === "announcement-sent"
                ? "Announcement queued for enrolled learners."
                : notice === "session-scheduled"
                  ? "Live session added to the course calendar."
                  : "Course plan saved for review."}
            </p>
          </div>
        </Panel>
      ) : null}

      {isCreatingCourse ? (
        <Panel className="mb-6">
          <div className="mb-5 flex items-center gap-2">
            <Plus className="text-cyan-700" size={20} />
            <h2 className="text-xl font-semibold">Plan a new course</h2>
          </div>
          <form action="/lecturer" className="grid gap-4 md:grid-cols-2">
            <input type="hidden" name="notice" value="course-saved" />
            <label className="block text-sm font-medium">
              Course title
              <input
                name="courseTitle"
                className="mt-2 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950"
                placeholder="Course name"
              />
            </label>
            <label className="block text-sm font-medium">
              Audience
              <input
                name="audience"
                className="mt-2 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950"
                placeholder="Who should take it?"
              />
            </label>
            <label className="block text-sm font-medium md:col-span-2">
              Learner outcome
              <textarea
                name="outcome"
                className="mt-2 min-h-24 w-full rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-950"
                placeholder="What should learners be able to do?"
              />
            </label>
            <div className="md:col-span-2">
              <button className="inline-flex min-h-10 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950">
                <CheckCircle2 size={16} />
                Save course plan
              </button>
            </div>
          </form>
        </Panel>
>>>>>>> 1c01f0308f5fafe3f3ca847d57554f19db9da16a
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Courses" value={`${stats.courseCount}`} detail="Draft, pending, and live" />
        <StatCard
          label="Enrollments"
          value={`${stats.enrollmentCount}`}
          detail="Across owned courses"
        />
<<<<<<< HEAD
        <StatCard label="Revenue" value={formatMoney(stats.revenueCents)} detail="Mock Stripe gross" />
        <StatCard label="To grade" value={`${stats.toGrade}`} detail="Pending submissions" />
=======
        <StatCard label="Revenue" value={formatMoney(revenue)} detail="Course sales" />
        <StatCard
          label="To grade"
          value={`${assignmentSubmissions.filter((submission) => submission.status === "SUBMITTED").length}`}
          detail="Pending submissions"
        />
>>>>>>> 1c01f0308f5fafe3f3ca847d57554f19db9da16a
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Panel>
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Course builder</h2>
              <Badge tone="blue">Structure editor</Badge>
            </div>
            {courses.length === 0 ? (
              <EmptyState
                title="No courses yet"
                body="Create your first course to start building modules, lessons, and assessments."
                action={
                  <ButtonLink href="/lecturer/courses/new">
                    <Plus size={16} />
                    New course
                  </ButtonLink>
                }
              />
            ) : (
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
                          {course.moduleCount} modules, {course.lessonCount} lessons
                        </p>
                      </div>
                      {course.status === "PUBLISHED" ? (
                        <ButtonLink href={`/courses/${course.slug}`} variant="secondary">
                          <Pencil size={16} />
                          Preview
                        </ButtonLink>
                      ) : (
                        <Badge tone="neutral">Not published yet</Badge>
                      )}
                    </div>
                    {course.modules.length === 0 ? (
                      <p className="mt-4 rounded-lg border border-dashed border-zinc-300 bg-stone-50 p-3 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
                        No modules yet — add your first module to start structuring this course.
                      </p>
                    ) : (
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
                    )}
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel>
            <div className="mb-5 flex items-center gap-2">
              <BarChart3 className="text-cyan-700" size={20} />
              <h2 className="text-xl font-semibold">Course analytics</h2>
            </div>
            {courses.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Analytics appear here once you have a course with enrollments.
              </p>
            ) : (
              <div className="space-y-5">
                {courses.map((course) => (
                  <div key={course.id}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span>{course.title}</span>
                      <span>{course.averageCompletion}% completion</span>
                    </div>
                    <ProgressBar value={course.averageCompletion} />
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <aside className="space-y-6">
          <Panel>
            <div className="flex items-center gap-2">
              <Megaphone className="text-amber-600" size={20} />
              <h2 className="text-xl font-semibold">Announcements</h2>
            </div>
<<<<<<< HEAD
            {params.announce === "posted" ? (
              <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                Announcement posted.
              </p>
            ) : null}
            {params.announce === "invalid" ? (
              <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                Add a title and a message before posting.
              </p>
            ) : null}
            <form action={createAnnouncementAction} className="mt-4 space-y-3">
              <input
                name="title"
                required
                maxLength={140}
=======
            <form action="/lecturer" className="mt-4 space-y-3">
              <input type="hidden" name="notice" value="announcement-sent" />
              <select
                name="courseId"
                className="min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
              <input
                name="title"
>>>>>>> 1c01f0308f5fafe3f3ca847d57554f19db9da16a
                className="min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                placeholder="Announcement title"
              />
              <textarea
<<<<<<< HEAD
                name="body"
                required
                maxLength={2000}
                className="min-h-28 w-full rounded-md border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                placeholder="Message to enrolled learners"
              />
              <select
                name="courseId"
                defaultValue=""
                aria-label="Announcement audience"
                className="min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              >
                <option value="">All my learners</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950"
              >
=======
                name="message"
                className="min-h-28 w-full rounded-md border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                placeholder="Message to enrolled learners"
              />
              <button className="inline-flex min-h-10 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950">
                <Send size={16} />
>>>>>>> 1c01f0308f5fafe3f3ca847d57554f19db9da16a
                Post announcement
              </button>
            </form>
            {announcements.length > 0 ? (
              <div className="mt-5 space-y-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="rounded-lg bg-stone-50 p-3 text-sm dark:bg-zinc-950">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">{announcement.title}</p>
                      <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                        {announcement.startsAt.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="mt-1 text-zinc-600 dark:text-zinc-300">{announcement.body}</p>
                    <span className="mt-2 inline-block text-xs font-medium text-brand-600 dark:text-brand-400">
                      {announcement.courseTitle ?? "All my learners"}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </Panel>

          <Panel>
            <div className="flex items-center gap-2">
              <CalendarPlus className="text-emerald-600" size={20} />
              <h2 className="text-xl font-semibold">Live sessions</h2>
            </div>
            <div className="mt-4 rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800">
              <p className="font-semibold">AI critique lab</p>
              <p className="mt-1 text-zinc-600 dark:text-zinc-300">
<<<<<<< HEAD
                Scheduled for Thursday · meeting link shared with enrolled learners.
=======
                Schedule a live critique session and share the event with enrolled learners.
>>>>>>> 1c01f0308f5fafe3f3ca847d57554f19db9da16a
              </p>
              <ButtonLink href="/lecturer?notice=session-scheduled" variant="secondary">
                Schedule session
              </ButtonLink>
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
