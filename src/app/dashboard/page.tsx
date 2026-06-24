import { Award, Bell, BookOpen, Flame, GraduationCap, Megaphone, Trophy } from "lucide-react";
import { CourseCard } from "@/components/course-card";
import { PageShell, PageTitle } from "@/components/site-shell";
import { Badge, ButtonLink, Panel, ProgressBar, StatCard } from "@/components/ui";
import { getStudentAchievements } from "@/lib/achievements";
import { getStudentAnnouncements } from "@/lib/announcements";
import {
  canIssueCertificate,
  getCourseById,
  getEnrollmentsForStudent,
  getNotifications,
} from "@/lib/eduflow";
import { requireRole } from "@/lib/session";

export default async function StudentDashboardPage() {
  const student = await requireRole(["STUDENT"]);
  const enrollments = getEnrollmentsForStudent(student.id);
  const announcements = await getStudentAnnouncements(student.id);
  // Real graded work from the database, so quizzes a learner just took and
  // assignments a lecturer just scored show up immediately.
  const { scores } = await getStudentAchievements(student.id);
  const enrolledCourses = enrollments
    .map((enrollment) => ({
      enrollment,
      course: getCourseById(enrollment.courseId),
    }))
    .filter((item) => item.course);
  const notifications = getNotifications(student.id);
  const averageGrade =
    enrollments.reduce((total, enrollment) => total + enrollment.gradePercent, 0) /
    Math.max(enrollments.length, 1);

  return (
    <PageShell user={student}>
      <PageTitle
        eyebrow="Student dashboard"
        title={`Welcome back, ${student.name.split(" ")[0]}`}
        body="Track your enrolled courses, grades, streak, certificates, and the notifications that need attention."
        action={
          <>
            <ButtonLink href="/achievements" variant="secondary">
              <Trophy size={16} />
              Achievements
            </ButtonLink>
            <ButtonLink href="/courses">
              <BookOpen size={16} />
              Browse courses
            </ButtonLink>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Enrolled"
          value={`${enrollments.length}`}
          detail="Active learning paths"
        />
        <StatCard
          label="Average grade"
          value={`${Math.round(averageGrade)}%`}
          detail="Quiz and assignment results"
        />
        <StatCard
          label="Streak"
          value={`${enrollments.reduce((max, item) => Math.max(max, item.streakDays), 0)} days`}
          detail="Learning consistency"
        />
        <StatCard
          label="Certificates"
          value={`${enrollments.filter((item) => canIssueCertificate(item)).length}`}
          detail="Ready to verify"
        />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Panel>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">My courses</h2>
              <GraduationCap className="text-cyan-700" size={22} />
            </div>
            <div className="grid gap-5 xl:grid-cols-2">
              {enrolledCourses.map(({ course, enrollment }) =>
                course ? (
                  <CourseCard
                    key={course.id}
                    course={course}
                    progress={enrollment.progressPercent}
                  />
                ) : null,
              )}
            </div>
          </Panel>

          <Panel>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Grade book</h2>
              <ButtonLink href="/achievements" variant="secondary">
                <Trophy size={16} />
                View results
              </ButtonLink>
            </div>
            {scores.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No scored work yet. Take a quiz or submit an assignment to start your grade book.
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-left text-sm">
                  <thead className="bg-stone-100 text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300">
                    <tr>
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3">Score</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {scores.map((score) => (
                      <tr key={`${score.kind}-${score.id}`}>
                        <td className="px-4 py-3">
                          <span className="font-medium">{score.title}</span>
                          <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                            {score.courseTitle}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {score.kind === "assignment" && score.rawScore != null
                            ? `${score.rawScore}/${score.maxScore}`
                            : score.scorePercent != null
                              ? `${score.scorePercent}%`
                              : "Pending"}
                        </td>
                        <td className="px-4 py-3">
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
            <div className="mt-4 space-y-3">
              {announcements.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No announcements from your lecturers yet.
                </p>
              ) : (
                announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{announcement.title}</p>
                      <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                        {announcement.startsAt.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="mt-1 text-zinc-600 dark:text-zinc-300">{announcement.body}</p>
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                      {announcement.authorName}
                      {announcement.courseTitle ? ` · ${announcement.courseTitle}` : ""}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel>
            <div className="flex items-center gap-2">
              <Bell className="text-cyan-700" size={20} />
              <h2 className="text-xl font-semibold">Notifications</h2>
            </div>
            <div className="mt-4 space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{notification.title}</p>
                    {!notification.read ? <Badge tone="amber">New</Badge> : null}
                  </div>
                  <p className="mt-1 text-zinc-600 dark:text-zinc-300">
                    {notification.body}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <div className="flex items-center gap-2">
              <Flame className="text-amber-600" size={20} />
              <h2 className="text-xl font-semibold">Progress</h2>
            </div>
            <div className="mt-4 space-y-4">
              {enrolledCourses.map(({ course, enrollment }) =>
                course ? (
                  <div key={course.id}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span>{course.title}</span>
                      <span>{enrollment.progressPercent}%</span>
                    </div>
                    <ProgressBar value={enrollment.progressPercent} />
                  </div>
                ) : null,
              )}
            </div>
          </Panel>

          <Panel>
            <div className="flex items-center gap-2">
              <Award className="text-emerald-600" size={20} />
              <h2 className="text-xl font-semibold">Certificates</h2>
            </div>
            <div className="mt-4 space-y-3">
              {enrollments.filter(canIssueCertificate).map((enrollment) => {
                const course = getCourseById(enrollment.courseId);
                return (
                  <div key={enrollment.id} className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
                    <p className="font-semibold">{course?.title}</p>
                    <ButtonLink href="/verify/EDU-2026-DATA-9K2" variant="secondary">
                      Verify certificate
                    </ButtonLink>
                  </div>
                );
              })}
            </div>
          </Panel>
        </aside>
      </section>
    </PageShell>
  );
}
