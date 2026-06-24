<<<<<<< HEAD
import {
  ArrowRight,
  Award,
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  MessagesSquare,
  Sparkles,
  Users,
} from "lucide-react";
=======
import { ArrowRight, Award, BookOpen, CheckCircle2, Sparkles } from "lucide-react";
import Image from "next/image";
>>>>>>> 1c01f0308f5fafe3f3ca847d57554f19db9da16a
import { CourseCard } from "@/components/course-card";
import { PageShell } from "@/components/site-shell";
import { Badge, ButtonLink, Panel, StatCard } from "@/components/ui";
import { categories, enrollments, users } from "@/lib/mock-data";
import { getPublishedCourses, platformStats } from "@/lib/eduflow";
import { getSessionUser, homeForRole } from "@/lib/session";

const features = [
  {
    icon: <BookOpen size={18} />,
    title: "Video courses",
    body: "Structured modules, lesson player, notes, and downloadable resources.",
  },
  {
    icon: <Award size={18} />,
    title: "Quizzes & certificates",
    body: "Auto-graded quizzes, assignment rubrics, and verifiable certificates.",
  },
  {
    icon: <MessagesSquare size={18} />,
    title: "Discussions",
    body: "Per-lesson Q&A threads with pinned answers and TA moderation.",
  },
  {
    icon: <Users size={18} />,
    title: "Role workspaces",
    body: "Tailored dashboards for students, lecturers, TAs, and admins.",
  },
];

export default async function Home() {
  const user = (await getSessionUser()) ?? undefined;
  const featured = getPublishedCourses().filter((course) => course.featured);
  const stats = platformStats();

  return (
<<<<<<< HEAD
    <PageShell user={user} className="space-y-16">
      {/* Hero */}
      <section className="bg-aurora relative overflow-hidden rounded-3xl border border-zinc-200/60 px-6 py-16 text-center sm:px-10 dark:border-zinc-800">
        <div className="mx-auto max-w-3xl animate-fade-in-up">
          <Badge tone="brand">
            <Sparkles size={14} />
            Learn. Teach. Grow.
          </Badge>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-zinc-950 sm:text-6xl dark:text-white">
            The learning platform for{" "}
            <span className="bg-gradient-to-r from-brand-600 to-violet-600 bg-clip-text text-transparent dark:from-brand-400 dark:to-violet-400">
              modern teams
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
            Video courses, role dashboards, quizzes, assignments, discussions,
            certificates, and admin workflows — all in one place.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {user ? (
              <ButtonLink href={homeForRole(user.role)}>
                <LayoutDashboard size={16} />
                Go to your dashboard
              </ButtonLink>
            ) : (
              <ButtonLink href="/auth/register">
                Get started free
=======
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
>>>>>>> 1c01f0308f5fafe3f3ca847d57554f19db9da16a
                <ArrowRight size={16} />
              </ButtonLink>
            )}
            <ButtonLink href="/courses" variant="secondary">
              <BookOpen size={16} />
              Browse catalog
            </ButtonLink>
          </div>
<<<<<<< HEAD
=======
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
>>>>>>> 1c01f0308f5fafe3f3ca847d57554f19db9da16a
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
<<<<<<< HEAD
          label="Learners"
          value={`${users.filter((u) => u.role === "STUDENT").length * 1240}`}
          detail="Across the platform"
          icon={<Users size={18} />}
=======
          label="Students"
          value={`${users.filter((user) => user.role === "STUDENT").length}`}
          detail="Active learner profiles"
>>>>>>> 1c01f0308f5fafe3f3ca847d57554f19db9da16a
        />
        <StatCard
          label="Courses"
          value={`${getPublishedCourses().length}`}
          detail="Published and growing"
          icon={<BookOpen size={18} />}
        />
        <StatCard
          label="Enrollments"
<<<<<<< HEAD
          value={`${enrollments.length * 318}`}
          detail="Active learning paths"
          icon={<GraduationCap size={18} />}
=======
          value={`${enrollments.length}`}
          detail="Free and paid course access"
>>>>>>> 1c01f0308f5fafe3f3ca847d57554f19db9da16a
        />
        <StatCard
          label="Avg. completion"
          value={`${stats.completionAverage}%`}
<<<<<<< HEAD
          detail="For enrolled learners"
          icon={<Award size={18} />}
        />
      </section>

      {/* Features */}
=======
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

>>>>>>> 1c01f0308f5fafe3f3ca847d57554f19db9da16a
      <section>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
            Everything you need
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
            One platform, every role
          </h2>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Panel key={feature.title}>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300">
                {feature.icon}
              </span>
              <h3 className="mt-4 font-semibold text-zinc-950 dark:text-white">
                {feature.title}
              </h3>
              <p className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                {feature.body}
              </p>
            </Panel>
          ))}
        </div>
      </section>

      {/* Featured courses */}
      <section>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
              Featured courses
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              Start learning today
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

      {/* Categories */}
      <section>
        <h2 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
          Explore by category
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Panel key={category.id} className="transition hover:-translate-y-0.5 hover:shadow-md">
              <span
                className={`${category.color} inline-flex rounded-full px-3 py-1 text-xs font-semibold`}
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
        </div>
      </section>

      {/* CTA */}
      {!user ? (
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-violet-700 px-6 py-14 text-center text-white sm:px-10">
          <h2 className="text-3xl font-semibold tracking-tight">
            Ready to start learning?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-50">
            Create a free account and enroll in your first course in minutes.
          </p>
          <div className="mt-7 flex justify-center">
            <ButtonLink href="/auth/register" variant="secondary">
              Create your free account
              <ArrowRight size={16} />
            </ButtonLink>
          </div>
        </section>
      ) : null}
    </PageShell>
  );
}
