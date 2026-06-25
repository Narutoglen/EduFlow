import { Award, CheckCircle2, Clock, Filter, Search, Target } from "lucide-react";
import { CourseCard } from "@/components/course-card";
import { PageShell, PageTitle } from "@/components/site-shell";
import { Badge, ButtonLink, EmptyState, Panel } from "@/components/ui";
<<<<<<< HEAD
import { filterCoursesFromDb, getCategoriesFromDb } from "@/lib/course-data";
import { getCurrentUser } from "@/lib/session";
=======
import { categories } from "@/lib/mock-data";
import { filterCourses } from "@/lib/eduflow";
import { getSessionUser } from "@/lib/session";
>>>>>>> 1676408760a8ccb2072fe64933b6be5d1efca3e9

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = valueOf(params.q);
  const category = valueOf(params.category);
  const difficulty = valueOf(params.difficulty);
  const price = valueOf(params.price) as "free" | "paid" | undefined;
  const sort = valueOf(params.sort) as "rating" | "duration" | "price" | undefined;
<<<<<<< HEAD
  const [courses, categories, user] = await Promise.all([
    filterCoursesFromDb({ q, category, difficulty, price, sort }),
    getCategoriesFromDb(),
    getCurrentUser(),
  ]);

  return (
    <PageShell user={user ?? undefined}>
=======
  const courses = filterCourses({ q, category, difficulty, price, sort });
  const user = (await getSessionUser()) ?? undefined;

  return (
    <PageShell user={user}>
>>>>>>> 1676408760a8ccb2072fe64933b6be5d1efca3e9
      <PageTitle
        eyebrow="Course catalog"
        title="Find the next course to move your work forward"
        body="Compare outcomes, audience fit, effort, skill level, and certificate availability before you start."
      />

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <Panel>
          <div className="flex items-center gap-2">
            <Target className="text-cyan-700" size={18} />
            <p className="font-semibold">Outcome-led courses</p>
          </div>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Each course shows the practical skills you should gain.
          </p>
        </Panel>
        <Panel>
          <div className="flex items-center gap-2">
            <Clock className="text-amber-600" size={18} />
            <p className="font-semibold">Clear time commitment</p>
          </div>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Compare total duration and weekly effort before enrolling.
          </p>
        </Panel>
        <Panel>
          <div className="flex items-center gap-2">
            <Award className="text-emerald-600" size={18} />
            <p className="font-semibold">Verifiable certificates</p>
          </div>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Completed eligible courses link to public verification.
          </p>
        </Panel>
      </section>

      <Panel className="mb-6">
        <form className="grid gap-3 md:grid-cols-[1fr_180px_180px_150px_150px_auto]">
          <label className="flex min-h-11 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950">
            <Search size={16} className="text-zinc-400" />
            <input
              className="w-full bg-transparent text-sm outline-none"
              name="q"
              placeholder="Search courses"
              defaultValue={q}
            />
          </label>
          <select
            className="min-h-11 rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            name="category"
            defaultValue={category ?? ""}
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            className="min-h-11 rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            name="difficulty"
            defaultValue={difficulty ?? ""}
          >
            <option value="">All levels</option>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
          <select
            className="min-h-11 rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            name="price"
            defaultValue={price ?? ""}
          >
            <option value="">Any price</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>
          <select
            className="min-h-11 rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            name="sort"
            defaultValue={sort ?? "rating"}
          >
            <option value="rating">Top rated</option>
            <option value="duration">Shortest</option>
            <option value="price">Lowest price</option>
          </select>
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950">
            <Filter size={16} />
            Apply
          </button>
        </form>
      </Panel>

      <div className="mb-5 flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="green">
            <CheckCircle2 size={14} />
            {courses.length} matching courses
          </Badge>
          {(q || category || difficulty || price || sort) ? (
            <ButtonLink href="/courses" variant="secondary">
              Reset filters
            </ButtonLink>
          ) : null}
        </div>
        <ButtonLink href="/dashboard" variant="secondary">
          My learning
        </ButtonLink>
      </div>

      {courses.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No courses matched"
          body="Reset the filters or try a broader topic such as AI, data, or assessment."
        />
      )}
    </PageShell>
  );
}
