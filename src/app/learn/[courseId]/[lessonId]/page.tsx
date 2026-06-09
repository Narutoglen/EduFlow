import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  FileText,
  Lock,
  MessageSquare,
  Play,
} from "lucide-react";
import { PageShell } from "@/components/site-shell";
import { Badge, ButtonLink, EmptyState, Panel, ProgressBar } from "@/components/ui";
import {
  canAccessLesson,
  completionForCourse,
  getAssignmentsForLesson,
  getCourseById,
  getEnrollment,
  getLessonDiscussions,
  getLessons,
  getNextLesson,
  getPreviousLesson,
  getQuizForLesson,
} from "@/lib/eduflow";
import { userForRole } from "@/lib/mock-data";
import { videoAdapter } from "@/lib/adapters";

export default async function LearnPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const course = getCourseById(courseId);
  if (!course) notFound();

  const student = userForRole("STUDENT");
  const enrollment = getEnrollment(student.id, course.id);
  const lesson = getLessons(course).find((item) => item.id === lessonId);
  if (!lesson) notFound();

  const canAccess = canAccessLesson(course, lesson, enrollment);
  const playback = videoAdapter.playbackUrl(lesson.videoUrl);
  const quiz = getQuizForLesson(course, lesson.id);
  const assignments = getAssignmentsForLesson(course, lesson.id);
  const posts = getLessonDiscussions(lesson.forumThreadId);
  const previous = getPreviousLesson(course, lesson.id);
  const next = getNextLesson(course, lesson.id);
  const progress = completionForCourse(course, enrollment);

  return (
    <PageShell user={student} className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-cyan-700 dark:text-cyan-300">
            {course.title}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal dark:text-white">
            {lesson.title}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {previous ? (
            <ButtonLink href={`/learn/${course.id}/${previous.id}`} variant="secondary">
              <ArrowLeft size={16} />
              Previous
            </ButtonLink>
          ) : null}
          {next ? (
            <ButtonLink href={`/learn/${course.id}/${next.id}`}>
              Next
              <ArrowRight size={16} />
            </ButtonLink>
          ) : null}
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-4">
          <Panel>
            <div className="mb-3 flex justify-between text-sm font-medium">
              <span>Course progress</span>
              <span>{progress}%</span>
            </div>
            <ProgressBar value={progress} />
          </Panel>
          <Panel>
            <h2 className="text-lg font-semibold">Lessons</h2>
            <div className="mt-4 space-y-2">
              {getLessons(course).map((item) => {
                const completed = enrollment?.completedLessonIds.includes(item.id);
                const accessible = canAccessLesson(course, item, enrollment);
                return (
                  <a
                    key={item.id}
                    href={accessible ? `/learn/${course.id}/${item.id}` : "#"}
                    className={`flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm ${
                      item.id === lesson.id
                        ? "bg-cyan-50 text-cyan-900 dark:bg-cyan-950 dark:text-cyan-100"
                        : "bg-stone-50 text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      {completed ? (
                        <CheckCircle2 size={15} className="text-emerald-500" />
                      ) : accessible ? (
                        <Play size={15} />
                      ) : (
                        <Lock size={15} />
                      )}
                      {item.title}
                    </span>
                    <span>{item.durationMinutes}m</span>
                  </a>
                );
              })}
            </div>
          </Panel>
        </aside>

        <div className="space-y-6">
          {!canAccess ? (
            <EmptyState
              title="Lesson locked"
              body="Complete the previous lessons first. This course uses a sequential completion gate."
            />
          ) : (
            <>
              <Panel className="p-0">
                <div className="aspect-video overflow-hidden rounded-t-lg bg-zinc-950">
                  <iframe
                    className="h-full w-full"
                    src={playback.url}
                    title={lesson.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3 p-4 text-sm">
                  <Badge tone="blue">{playback.provider}</Badge>
                  <label>
                    Speed{" "}
                    <select className="ml-2 rounded-md border border-zinc-200 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-950">
                      {playback.speeds.map((speed) => (
                        <option key={speed}>{speed}x</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Quality{" "}
                    <select className="ml-2 rounded-md border border-zinc-200 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-950">
                      {playback.qualities.map((quality) => (
                        <option key={quality}>{quality}</option>
                      ))}
                    </select>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" defaultChecked />
                    Subtitles
                  </label>
                  <form action="/api/progress" method="post">
                    <input type="hidden" name="courseId" value={course.id} />
                    <input type="hidden" name="lessonId" value={lesson.id} />
                    <button className="rounded-md bg-emerald-600 px-3 py-2 font-semibold text-white">
                      Mark complete
                    </button>
                  </form>
                </div>
              </Panel>

              <Panel>
                <h2 className="text-xl font-semibold">Lesson notes</h2>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                  Personal notes are scoped to this lesson and can be exported by
                  the notes service adapter.
                </p>
                <textarea
                  className="mt-4 min-h-32 w-full rounded-md border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  defaultValue="Summarize the educator review checkpoint and examples I can reuse in my class."
                />
                <div className="mt-3">
                  <ButtonLink href="/api/progress?export=notes" variant="secondary">
                    <FileText size={16} />
                    Export notes PDF
                  </ButtonLink>
                </div>
              </Panel>

              <Panel>
                <h2 className="text-xl font-semibold">Resources</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {lesson.resources.map((resource) => (
                    <a
                      key={resource.id}
                      href={resource.url}
                      className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 text-sm hover:bg-stone-50 dark:border-zinc-800 dark:hover:bg-zinc-950"
                    >
                      <span>{resource.title}</span>
                      <Download size={16} />
                    </a>
                  ))}
                </div>
              </Panel>

              {quiz ? (
                <Panel>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold">{quiz.title}</h2>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                        Pass score {quiz.passScore}%{" "}
                        {quiz.timeLimitMinutes ? `, ${quiz.timeLimitMinutes} minute limit` : ""}
                      </p>
                    </div>
                    {quiz.randomized ? <Badge tone="violet">Randomized</Badge> : null}
                  </div>
                  <form
                    action="/api/quizzes/submit"
                    method="post"
                    className="mt-4 space-y-4"
                  >
                    <input type="hidden" name="quizId" value={quiz.id} />
                    {quiz.questions.map((question) => (
                      <fieldset key={question.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                        <legend className="px-1 font-medium">{question.prompt}</legend>
                        <div className="mt-3 space-y-2">
                          {question.choices.map((choice) => (
                            <label key={choice.id} className="flex gap-2 text-sm">
                              <input
                                type="radio"
                                name={question.id}
                                value={choice.id}
                              />
                              {choice.label}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    ))}
                    <button className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950">
                      Submit quiz
                    </button>
                  </form>
                </Panel>
              ) : null}

              {assignments.map((assignment) => (
                <Panel key={assignment.id}>
                  <h2 className="text-xl font-semibold">{assignment.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                    {assignment.prompt}
                  </p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-semibold">Rubric</p>
                      <ul className="mt-2 space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
                        {assignment.rubric.map((item) => (
                          <li key={item}>- {item}</li>
                        ))}
                      </ul>
                    </div>
                    <form action="/api/assignments/submit" method="post" className="space-y-3">
                      <input type="hidden" name="assignmentId" value={assignment.id} />
                      <textarea
                        name="body"
                        className="min-h-24 w-full rounded-md border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                        placeholder="Paste your submission or upload metadata"
                      />
                      <button className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950">
                        Submit assignment
                      </button>
                    </form>
                  </div>
                </Panel>
              ))}

              <Panel>
                <div className="flex items-center gap-2">
                  <MessageSquare className="text-cyan-700" size={20} />
                  <h2 className="text-xl font-semibold">Lesson discussion</h2>
                </div>
                <div className="mt-4 space-y-3">
                  {posts.map((post) => (
                    <div key={post.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-zinc-600 dark:text-zinc-300">
                          {post.body}
                        </p>
                        {post.isAnswer ? <Badge tone="green">Answered</Badge> : null}
                      </div>
                      {post.replies.map((reply) => (
                        <div key={reply.id} className="mt-3 rounded-md bg-cyan-50 p-3 text-sm text-cyan-950 dark:bg-cyan-950 dark:text-cyan-50">
                          <div className="mb-1 flex gap-2">
                            {reply.isPinned ? <Badge tone="amber">Pinned</Badge> : null}
                            {reply.isAnswer ? <Badge tone="green">Answer</Badge> : null}
                          </div>
                          {reply.body}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </Panel>
            </>
          )}
        </div>
      </section>
    </PageShell>
  );
}
