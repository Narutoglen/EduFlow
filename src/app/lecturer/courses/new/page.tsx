import { ArrowLeft, Plus } from "lucide-react";
import { PageShell, PageTitle } from "@/components/site-shell";
import { Button, ButtonLink, Panel } from "@/components/ui";
import { DIFFICULTIES, DIFFICULTY_LABELS } from "@/lib/courses";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { createCourseAction } from "../../actions";

const errorMessages: Record<string, string> = {
  invalid:
    "Please give the course a title (3+ chars), a description (20+ chars), a category, a difficulty, and a price of 0 or more.",
  category: "That category no longer exists. Pick another one.",
};

const fieldClass =
  "min-h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:ring-brand-950";
const labelClass =
  "block text-sm font-medium text-zinc-700 dark:text-zinc-200";

export default async function NewCoursePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const lecturer = await requireRole(["LECTURER"]);
  const params = await searchParams;
  const error = params.error ? errorMessages[params.error] : undefined;
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <PageShell user={lecturer}>
      <PageTitle
        eyebrow="Lecturer workspace"
        title="Create a new course"
        body="Start with the essentials. Your course is created as a draft — add modules, lessons, and assessments next, then submit it for review."
        action={
          <ButtonLink href="/lecturer" variant="secondary">
            <ArrowLeft size={16} />
            Back to workspace
          </ButtonLink>
        }
      />

      <div className="mx-auto max-w-2xl">
        {error ? (
          <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </div>
        ) : null}

        <Panel>
          <form action={createCourseAction} className="space-y-5">
            <label className={labelClass}>
              Course title
              <input
                name="title"
                type="text"
                required
                minLength={3}
                maxLength={120}
                placeholder="e.g. Designing Inclusive Online Assessments"
                className={`mt-1.5 ${fieldClass}`}
              />
            </label>

            <label className={labelClass}>
              Description
              <textarea
                name="description"
                required
                minLength={20}
                maxLength={2000}
                rows={4}
                placeholder="What will learners be able to do after completing this course?"
                className={`mt-1.5 min-h-28 ${fieldClass}`}
              />
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className={labelClass}>
                Category
                <select name="categoryId" required defaultValue="" className={`mt-1.5 ${fieldClass}`}>
                  <option value="" disabled>
                    Choose a category
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className={labelClass}>
                Difficulty
                <select
                  name="difficulty"
                  required
                  defaultValue="BEGINNER"
                  className={`mt-1.5 ${fieldClass}`}
                >
                  {DIFFICULTIES.map((difficulty) => (
                    <option key={difficulty} value={difficulty}>
                      {DIFFICULTY_LABELS[difficulty]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className={labelClass}>
              Price (USD)
              <input
                name="price"
                type="number"
                min={0}
                step={1}
                defaultValue={0}
                placeholder="0"
                className={`mt-1.5 ${fieldClass}`}
              />
              <span className="mt-1.5 block text-xs font-normal text-zinc-500 dark:text-zinc-400">
                Enter 0 for a free course.
              </span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-2">
              <ButtonLink href="/lecturer" variant="ghost">
                Cancel
              </ButtonLink>
              <Button type="submit">
                <Plus size={16} />
                Create course
              </Button>
            </div>
          </form>
        </Panel>
      </div>
    </PageShell>
  );
}
