import { ArrowRight, BookOpen, CheckCircle2, Sparkles } from "lucide-react";
import { CourseCard } from "@/components/course-card";
import { PageShell } from "@/components/site-shell";
import { Badge, ButtonLink, Panel, StatCard } from "@/components/ui";
import {
  categories,
  courses,
  enrollments,
  userForRole,
  users,
} from "@/lib/mock-data";
import { getPublishedCourses, platformStats } from "@/lib/eduflow";

export default function Home() {
  const featured = getPublishedCourses().filter((course) => course.featured);
  const stats = platformStats();
  const student = userForRole("STUDENT");

  return (
    <PageShell user={student} className="space-y-10">
      <section className="relative overflow-hidden rounded-lg bg-zinc-950 text-white">
        <img
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="relative grid gap-10 px-6 py-12 md:grid-cols-[1.15fr_0.85fr] md:px-10 lg:px-12">
          <div className="max-w-2xl">
            <Badge tone="amber">
              <Sparkles size={14} />
              Full LMS vertical slice
            </Badge>
            <h1 className="mt-5 text-4xl font-semibold tracking-normal md:text-6xl">
              EduFlow
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-8 text-zinc-100">
              Video courses, role dashboards, quizzes, assignments, discussions,
              certificates, and admin review workflows in one learning platform.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href="/courses">
                Browse catalog
                <ArrowRight size={16} />
              </ButtonLink>
              <ButtonLink href="/dashboard" variant="secondary">
                Open student dashboard
              </ButtonLink>
            </div>
          </div>
          <Panel className="bg-white/95 text-zinc-950 backdrop-blur">
            <h2 className="text-lg font-semibold">Demo status</h2>
            <div className="mt-5 space-y-4">
              {[
                "Email/password and Google SSO boundaries",
                "Course approval and mocked payments",
                "Progress, grades, forums, and certificates",
              ].map((item) => (
                <div key={item} className="flex gap-3 text-sm">
                  <CheckCircle2 className="mt-0.5 text-emerald-600" size={18} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Students"
          value={`${users.filter((user) => user.role === "STUDENT").length}`}
          detail="Seeded learner profiles"
        />
        <StatCard
          label="Courses"
          value={`${courses.length}`}
          detail={`${stats.pendingApprovals} awaiting approval`}
        />
        <StatCard
          label="Enrollments"
          value={`${enrollments.length}`}
          detail="Paid and free access paths"
        />
        <StatCard
          label="Completion"
          value={`${stats.completionAverage}%`}
          detail="Average demo progress"
        />
      </section>

      <section>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-cyan-700 dark:text-cyan-300">
              Featured courses
            </p>
            <h2 className="mt-2 text-2xl font-semibold dark:text-white">
              Start from the catalog
            </h2>
          </div>
          <ButtonLink href="/courses" variant="secondary">
            <BookOpen size={16} />
            View all courses
          </ButtonLink>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {featured.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {categories.map((category) => (
          <Panel key={category.id}>
            <span
              className={`${category.color} rounded-md px-2 py-1 text-xs font-semibold`}
            >
              {category.name}
            </span>
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">
              {
                getPublishedCourses().filter(
                  (course) => course.categoryId === category.id,
                ).length
              }{" "}
              published courses
            </p>
          </Panel>
        ))}
      </section>
    </PageShell>
  );
}
