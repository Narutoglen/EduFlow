import { notFound } from "next/navigation";
import Image from "next/image";
import {
  Award,
  CheckCircle2,
  Clock,
  Play,
  Star,
  Target,
  Users,
} from "lucide-react";
import { PageShell } from "@/components/site-shell";
import { Badge, ButtonLink, Panel, ProgressBar } from "@/components/ui";
import {
  canIssueCertificate,
  completionForCourse,
  formatMoney,
  getCourseReviews,
  getFirstLesson,
  getInstructor,
} from "@/lib/eduflow";
import {
  getCategoriesFromDb,
  getCourseBySlugFromDb,
  getEnrollmentFromDb,
} from "@/lib/course-data";
import { getCurrentUser } from "@/lib/session";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const [course, categories, user] = await Promise.all([
    getCourseBySlugFromDb(slug),
    getCategoriesFromDb(),
    getCurrentUser(),
  ]);
  if (!course) notFound();

  const instructor = getInstructor(course);
  const category = categories.find((item) => item.id === course.categoryId);
  const enrollment =
    user?.role === "STUDENT" ? await getEnrollmentFromDb(user.id, course.id) : undefined;
  const firstLesson = getFirstLesson(course);
  const reviews = getCourseReviews(course.id);
  const progress = completionForCourse(course, enrollment);
  const checkoutComplete = valueOf(query.checkout) === "success";

  return (
    <PageShell user={user ?? undefined} className="space-y-8">
      {checkoutComplete ? (
        <Panel className="border-emerald-200 bg-emerald-50 text-emerald-950">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} />
            <p className="font-semibold">
              Enrollment confirmed. You can start the course when you are ready.
            </p>
          </div>
        </Panel>
      ) : null}

>>>>>>> 1c01f0308f5fafe3f3ca847d57554f19db9da16a
      <section className="grid overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative min-h-[420px] bg-zinc-950 text-white">
          <Image
            src={course.thumbnailUrl}
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-cover opacity-55"
          />
          <div className="relative flex h-full flex-col justify-end p-6 md:p-10">
            <Badge tone="amber">{category?.name ?? "Course"}</Badge>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-normal md:text-6xl">
              {course.title}
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-100">
              {course.description}
            </p>
          </div>
        </div>
        <div className="space-y-6 p-6 md:p-8">
          <div className="aspect-video overflow-hidden rounded-lg bg-zinc-950">
            {course.trailerUrl ? (
              <iframe
                className="h-full w-full"
                src={course.trailerUrl}
                title={`${course.title} trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-white">
                <Play size={32} />
                <p className="text-sm font-semibold">Course preview video pending</p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <span className="inline-flex items-center gap-2">
              <Star className="fill-amber-400 text-amber-400" size={16} />
              {course.rating || "New"} rating
            </span>
            <span className="inline-flex items-center gap-2">
              <Users size={16} />
              {course.reviewCount} {course.reviewCount === 1 ? "review" : "reviews"}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock size={16} />
              {course.durationHours} hours
            </span>
            <span className="inline-flex items-center gap-2">
              <Award size={16} />
              Certificate
            </span>
          </div>
          <div className="rounded-lg bg-stone-100 p-4 dark:bg-zinc-950">
            <div className="flex items-center gap-3">
              <Image
                src={instructor.avatarUrl}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold">{instructor.name}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  {instructor.institution}
                </p>
              </div>
            </div>
          </div>
          {enrollment ? (
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium">
                <span>Enrolled progress</span>
                <span>{progress}%</span>
              </div>
              <ProgressBar value={progress} />
              <ButtonLink
                href={`/learn/${course.id}/${enrollment.lastAccessedLessonId}`}
              >
                <Play size={16} />
                Resume course
              </ButtonLink>
              {canIssueCertificate(enrollment) ? (
                <ButtonLink href="/verify/EDU-2026-DATA-9K2" variant="secondary">
                  <Award size={16} />
                  View certificate
                </ButtonLink>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <ButtonLink href={`/api/payments/checkout?courseId=${course.id}`}>
                {course.priceCents ? `Buy for ${formatMoney(course.priceCents)}` : "Enroll free"}
              </ButtonLink>
              {firstLesson ? (
                <ButtonLink
                  href={`/learn/${course.id}/${firstLesson.id}`}
                  variant="secondary"
                >
                  Preview first lesson
                </ButtonLink>
              ) : null}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Panel>
            <div className="flex items-center gap-2">
              <Target className="text-cyan-700" size={20} />
              <h2 className="text-xl font-semibold">Learner outcomes</h2>
            </div>
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
              Built for {course.audience.toLowerCase()}.
            </p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {course.learningOutcomes.map((outcome) => (
                <li key={outcome} className="flex gap-2 text-sm">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel>
            <h2 className="text-xl font-semibold">Syllabus</h2>
            <div className="mt-4 space-y-3">
              {course.modules.map((module) => (
                <details
                  key={module.id}
                  className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                  open={module.order === 1}
                >
                  <summary className="cursor-pointer font-semibold">
                    {module.order}. {module.title}
                  </summary>
                  <div className="mt-3 space-y-2">
                    {module.lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between gap-3 rounded-md bg-stone-50 px-3 py-2 text-sm dark:bg-zinc-950"
                      >
                        <span className="inline-flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-emerald-500" />
                          {lesson.title}
                        </span>
                        <span>{lesson.durationMinutes} min</span>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </Panel>

          <Panel>
            <h2 className="text-xl font-semibold">Reviews</h2>
            <div className="mt-4 space-y-3">
              {reviews.map((review) => (
                <blockquote
                  key={review.id}
                  className="rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800"
                >
                  <div className="mb-2 flex gap-1 text-amber-500">
                    {Array.from({ length: review.rating }).map((_, index) => (
                      <Star key={index} size={14} className="fill-current" />
                    ))}
                  </div>
                  {review.body}
                </blockquote>
              ))}
            </div>
          </Panel>

          <Panel>
            <h2 className="text-xl font-semibold">Sources and references</h2>
            <div className="mt-4 space-y-3">
              {course.references?.length ? (
                course.references.map((reference) => (
                  <div
                    key={reference.id}
                    className="rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800"
                  >
                    <p className="font-semibold">{reference.title}</p>
                    <p className="mt-2 leading-6 text-zinc-700 dark:text-zinc-200">
                      {reference.apaCitation}
                    </p>
                    {reference.annotation ? (
                      <p className="mt-2 text-zinc-600 dark:text-zinc-300">
                        {reference.annotation}
                      </p>
                    ) : null}
                    <a
                      href={reference.url}
                      className="mt-3 inline-flex text-cyan-700 hover:underline dark:text-cyan-300"
                    >
                      Open source
                    </a>
                  </div>
                ))
              ) : (
                <p className="rounded-md bg-stone-50 p-3 text-sm text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300">
                  Sources are being reviewed for this course.
                </p>
              )}
            </div>
          </Panel>
        </div>

        <Panel>
          <h2 className="text-xl font-semibold">What you need</h2>
          <div className="mt-4 grid gap-3 text-sm">
            <div className="rounded-md bg-stone-50 p-3 dark:bg-zinc-950">
              <p className="font-semibold">Skill level</p>
              <p className="mt-1 text-zinc-600 dark:text-zinc-300">
                {course.difficulty}
              </p>
            </div>
            <div className="rounded-md bg-stone-50 p-3 dark:bg-zinc-950">
              <p className="font-semibold">Estimated effort</p>
              <p className="mt-1 text-zinc-600 dark:text-zinc-300">
                {course.estimatedWeeklyHours} hours per week
              </p>
            </div>
            {course.certificateEligible ? (
              <div className="rounded-md bg-emerald-50 p-3 text-emerald-900">
                <p className="font-semibold">Certificate included</p>
                <p className="mt-1">
                  Completion unlocks a public verification page.
                </p>
              </div>
            ) : null}
          </div>
          <h3 className="mt-6 text-sm font-semibold">Prerequisites</h3>
          <ul className="mt-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
            {course.prerequisites.map((item) => (
              <li key={item} className="flex gap-2">
                <CheckCircle2 size={16} className="mt-0.5 text-emerald-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-2">
            {course.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        </Panel>
      </section>
    </PageShell>
  );
}
