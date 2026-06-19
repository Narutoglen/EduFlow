import { ArrowRight, Award, BookOpen, CheckCircle2, Sparkles } from "lucide-react";
import Image from "next/image";
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
        <Image
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-45"
        />
        <div className="relative grid gap-10 px-6 py-12 md:grid-cols-[1.15fr_0.85fr] md:px-10 lg:px-12">
          <div className="max-w-2xl">
            <Badge tone="amber">
              <Sparkles size={14} />
              Guided learning platform
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
            <h2 className="text-lg font-semibold">Platform highlights</h2>
            <div className="mt-5 space-y-4">
              {[
                "Secure sign-in and role-based workspaces",
                "Course review and checkout workflows",
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
          detail="Active learner profiles"
        />
        <StatCard
          label="Courses"
          value={`${courses.length}`}
          detail={`${stats.pendingApprovals} awaiting approval`}
        />
        <StatCard
          label="Enrollments"
          value={`${enrollments.length}`}
          detail="Free and paid course access"
        />
        <StatCard
          label="Completion"
          value={`${stats.completionAverage}%`}
          detail="Average learner progress"
        />
      </section>

      <Panel className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
        <div className="flex gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-emerald-50 text-emerald-700">
            <Award size={24} />
          </span>
          <div>
            <h2 className="text-xl font-semibold">Verifiable certificates</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              Completed courses can produce a public certificate page with the
              learner, course, lecturer, completion date, and verification ID.
            </p>
          </div>
        </div>
        <ButtonLink href="/verify/EDU-2026-DATA-9K2" variant="secondary">
          View certificate example
        </ButtonLink>
      </Panel>

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
