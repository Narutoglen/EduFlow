import { notFound } from "next/navigation";
import {
  Award,
  CheckCircle2,
  Clock,
  Play,
  Star,
  Users,
} from "lucide-react";
import { PageShell } from "@/components/site-shell";
import { Badge, ButtonLink, Panel, ProgressBar } from "@/components/ui";
import {
  canIssueCertificate,
  completionForCourse,
  formatMoney,
  getCategory,
  getCourseBySlug,
  getCourseReviews,
  getEnrollment,
  getFirstLesson,
  getInstructor,
} from "@/lib/eduflow";
import { userForRole } from "@/lib/mock-data";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = getCourseBySlug(slug);
  if (!course) notFound();

  const student = userForRole("STUDENT");
  const instructor = getInstructor(course);
  const category = getCategory(course.categoryId);
  const enrollment = getEnrollment(student.id, course.id);
  const firstLesson = getFirstLesson(course);
  const reviews = getCourseReviews(course.id);
  const progress = completionForCourse(course, enrollment);

  return (
    <PageShell user={student} className="space-y-8">
      <section className="grid overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative min-h-[420px] bg-zinc-950 text-white">
          <img
            src={course.thumbnailUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-55"
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
            <iframe
              className="h-full w-full"
              src={course.trailerUrl}
              title={`${course.title} trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <span className="inline-flex items-center gap-2">
              <Star className="fill-amber-400 text-amber-400" size={16} />
              {course.rating || "New"} rating
            </span>
            <span className="inline-flex items-center gap-2">
              <Users size={16} />
              {course.reviewCount} reviews
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
              <img
                src={instructor.avatarUrl}
                alt=""
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
        </div>

        <Panel>
          <h2 className="text-xl font-semibold">What you need</h2>
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
