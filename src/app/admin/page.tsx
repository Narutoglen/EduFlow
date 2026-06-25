import { Check, DollarSign, Edit3, Plus, RotateCcw, Settings, ShieldAlert, Trash2, UserCog, X } from "lucide-react";
import Image from "next/image";
import { PageShell, PageTitle } from "@/components/site-shell";
import { Badge, ButtonLink, Panel, ProgressBar, StatCard } from "@/components/ui";
import {
  formatMoney,
  getLessons,
  roleLabel,
} from "@/lib/eduflow";
import {
  getCategoriesFromDb,
  getCourseRecordsForAdmin,
  getUsersFromDb,
  mapCourse,
  platformStatsFromDb,
} from "@/lib/course-data";
import { requireRole } from "@/lib/session";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function noticeText(notice?: string) {
  return {
    "course-created": "Course created and saved to the database.",
    "course-updated": "Course updated.",
    "course-deleted": "Course removed from the public catalog.",
    "course-restored": "Course restored as a draft.",
    "course-published": "Course published.",
    "course-invalid": "Add a title and lecturer before saving.",
    "signed-in": "You are signed in as an admin.",
    approved: "Course approved for publishing.",
    "revisions-requested": "Revision request prepared for the lecturer.",
  }[notice ?? ""];
}

export default async function AdminDashboardPage({
  searchParams,
}: {
<<<<<<< HEAD
  searchParams: Promise<{ review?: string }>;
}) {
  const admin = await requireRole(["ADMIN"]);
  const params = await searchParams;
  const review = params.review ? reviewMessages[params.review] : undefined;
=======
  searchParams: SearchParams;
}) {
  const admin = await requireRole("ADMIN");
  const params = await searchParams;
  const notice = valueOf(params.notice);
  const editId = valueOf(params.edit);
  const isCreating = valueOf(params.new) === "course";

  const [records, categories, users, stats] = await Promise.all([
    getCourseRecordsForAdmin(),
    getCategoriesFromDb(),
    getUsersFromDb(),
    platformStatsFromDb(),
  ]);
  const courseRows = records.map((record) => ({
    record,
    course: mapCourse(record),
  }));
  const editableRow = courseRows.find((row) => row.course.id === editId);
  const editableCourse = editableRow?.course;
  const firstModule = editableCourse?.modules[0];
  const firstLesson = firstModule?.lessons[0];
  const firstResource = firstLesson?.resources[0];
  const firstReference = editableCourse?.references?.[0];
  const lecturers = users.filter((user) => user.role === "LECTURER" || user.role === "ADMIN");
  const pending = courseRows.filter(
    (row) => row.course.status === "PENDING_REVIEW" && !row.record.deletedAt,
  );
  const visibleCourses = courseRows.filter((row) => !row.record.deletedAt);
  const message = noticeText(notice);

  return (
    <PageShell user={admin}>
      <PageTitle
        eyebrow="Admin console"
        title="Operate EduFlow quality, access, revenue, and safety"
        body="Approve courses, manage roles, monitor platform analytics, feature categories, and configure global service settings."
        action={
          <ButtonLink href="/admin?new=course">
            <Plus size={16} />
            Add course
          </ButtonLink>
        }
      />

      {message ? (
        <Panel
          className={
            notice === "course-invalid" || notice === "revisions-requested"
              ? "mb-6 border-amber-200 bg-amber-50 text-amber-950"
              : "mb-6 border-emerald-200 bg-emerald-50 text-emerald-950"
          }
        >
          <div className="flex items-center gap-2">
            {notice === "course-invalid" || notice === "revisions-requested" ? <X size={18} /> : <Check size={18} />}
            <p className="font-semibold">{message}</p>
          </div>
        </Panel>
      ) : null}

      {(isCreating || editableCourse) ? (
        <Panel className="mb-8">
          <div className="mb-5 flex items-center gap-2">
            <Edit3 className="text-cyan-700" size={20} />
            <h2 className="text-xl font-semibold">
              {editableCourse ? `Edit ${editableCourse.title}` : "Create a course"}
            </h2>
          </div>
          <form action="/api/admin/courses" method="post" className="grid gap-4 lg:grid-cols-2">
            <input type="hidden" name="action" value={editableCourse ? "update" : "create"} />
            {editableCourse ? <input type="hidden" name="courseId" value={editableCourse.id} /> : null}
            <input type="hidden" name="resourceId" value={firstResource?.id ?? ""} />
            <input type="hidden" name="referenceId" value={firstReference?.id ?? ""} />

            <label className="block text-sm font-medium">
              Course title
              <input name="title" defaultValue={editableCourse?.title} className="mt-2 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950" />
            </label>
            <label className="block text-sm font-medium">
              Slug
              <input name="slug" defaultValue={editableCourse?.slug} className="mt-2 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950" />
            </label>
            <label className="block text-sm font-medium lg:col-span-2">
              Description
              <textarea name="description" defaultValue={editableCourse?.description} className="mt-2 min-h-24 w-full rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-950" />
            </label>
            <label className="block text-sm font-medium">
              Category
              <select name="categoryId" defaultValue={editableCourse?.categoryId ?? categories[0]?.id} className="mt-2 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950">
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Lecturer
              <select name="lecturerId" defaultValue={editableCourse?.lecturerId ?? lecturers[0]?.id} className="mt-2 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950">
                {lecturers.map((lecturer) => (
                  <option key={lecturer.id} value={lecturer.id}>{lecturer.name}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Difficulty
              <select name="difficulty" defaultValue={editableCourse?.difficulty.toUpperCase() ?? "BEGINNER"} className="mt-2 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950">
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </label>
            <label className="block text-sm font-medium">
              Status
              <select name="status" defaultValue={editableCourse?.status ?? "DRAFT"} className="mt-2 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950">
                <option value="DRAFT">Draft</option>
                <option value="PENDING_REVIEW">Pending review</option>
                <option value="PUBLISHED">Published</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </label>
            <label className="block text-sm font-medium">
              Price in USD
              <input name="price" type="number" min="0" step="1" defaultValue={editableCourse ? editableCourse.priceCents / 100 : 0} className="mt-2 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950" />
            </label>
            <label className="block text-sm font-medium">
              Duration hours
              <input name="durationHours" type="number" min="0" step="0.5" defaultValue={editableCourse?.durationHours ?? 4} className="mt-2 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950" />
            </label>
            <label className="block text-sm font-medium">
              Weekly effort
              <input name="estimatedWeeklyHours" type="number" min="0" defaultValue={editableCourse?.estimatedWeeklyHours ?? 2} className="mt-2 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950" />
            </label>
            <label className="block text-sm font-medium">
              Rating
              <input name="rating" type="number" min="0" max="5" step="0.1" defaultValue={editableCourse?.rating ?? 0} className="mt-2 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950" />
            </label>
            <label className="block text-sm font-medium">
              Review count
              <input name="reviewCount" type="number" min="0" defaultValue={editableCourse?.reviewCount ?? 0} className="mt-2 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950" />
            </label>
            <label className="block text-sm font-medium lg:col-span-2">
              Audience
              <input name="audience" defaultValue={editableCourse?.audience} className="mt-2 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950" />
            </label>
            <label className="block text-sm font-medium">
              Learning outcomes
              <textarea name="learningOutcomes" defaultValue={editableCourse?.learningOutcomes.join("\n")} className="mt-2 min-h-28 w-full rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-950" />
            </label>
            <label className="block text-sm font-medium">
              Prerequisites
              <textarea name="prerequisites" defaultValue={editableCourse?.prerequisites.join("\n")} className="mt-2 min-h-28 w-full rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-950" />
            </label>
            <label className="block text-sm font-medium lg:col-span-2">
              Tags
              <input name="tags" defaultValue={editableCourse?.tags.join(", ")} className="mt-2 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950" />
            </label>
            <label className="block text-sm font-medium">
              Thumbnail URL
              <input name="thumbnailUrl" defaultValue={editableCourse?.thumbnailUrl ?? "/globe.svg"} className="mt-2 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950" />
            </label>
            <label className="block text-sm font-medium">
              Trailer URL
              <input name="trailerUrl" defaultValue={editableCourse?.trailerUrl ?? ""} className="mt-2 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950" />
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-medium">
              <input name="featured" type="checkbox" defaultChecked={editableCourse?.featured ?? false} />
              Featured
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-medium">
              <input name="allowSkipAhead" type="checkbox" defaultChecked={editableCourse?.allowSkipAhead ?? true} />
              Allow skip ahead
            </label>

            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 lg:col-span-2">
              <h3 className="font-semibold">Primary module and lesson</h3>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <label className="block text-sm font-medium">
                  Module title
                  <input name="moduleTitle" defaultValue={firstModule?.title} className="mt-2 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950" />
                </label>
                <label className="block text-sm font-medium">
                  Lesson title
                  <input name="lessonTitle" defaultValue={firstLesson?.title} className="mt-2 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950" />
                </label>
                <label className="block text-sm font-medium">
                  Lesson duration minutes
                  <input name="lessonDurationMinutes" type="number" min="1" defaultValue={firstLesson?.durationMinutes ?? 20} className="mt-2 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950" />
                </label>
                <label className="block text-sm font-medium">
                  Lesson video URL
                  <input name="lessonVideoUrl" defaultValue={firstLesson?.videoUrl ?? ""} className="mt-2 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950" />
                </label>
                <label className="block text-sm font-medium lg:col-span-2">
                  Lesson content
                  <textarea name="lessonContent" defaultValue={firstLesson?.content} className="mt-2 min-h-28 w-full rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-950" />
                </label>
                <label className="block text-sm font-medium">
                  Resource title
                  <input name="resourceTitle" defaultValue={firstResource?.title} className="mt-2 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950" />
                </label>
                <label className="block text-sm font-medium">
                  Resource URL
                  <input name="resourceUrl" defaultValue={firstResource?.url} className="mt-2 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950" />
                </label>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 lg:col-span-2">
              <h3 className="font-semibold">Primary APA reference</h3>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <label className="block text-sm font-medium">
                  Reference title
                  <input name="referenceTitle" defaultValue={firstReference?.title} className="mt-2 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950" />
                </label>
                <label className="block text-sm font-medium">
                  Authors
                  <input name="referenceAuthors" defaultValue={firstReference?.authors.join(", ")} className="mt-2 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950" />
                </label>
                <label className="block text-sm font-medium">
                  Publisher
                  <input name="referencePublisher" defaultValue={firstReference?.publisher} className="mt-2 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950" />
                </label>
                <label className="block text-sm font-medium">
                  Published date
                  <input name="referencePublishedDate" defaultValue={firstReference?.publishedDate ?? ""} className="mt-2 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950" />
                </label>
                <label className="block text-sm font-medium">
                  Source type
                  <input name="referenceSourceType" defaultValue={firstReference?.sourceType ?? "report"} className="mt-2 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950" />
                </label>
                <label className="block text-sm font-medium">
                  URL
                  <input name="referenceUrl" defaultValue={firstReference?.url} className="mt-2 min-h-11 w-full rounded-md border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950" />
                </label>
                <label className="block text-sm font-medium lg:col-span-2">
                  APA citation
                  <textarea name="referenceApaCitation" defaultValue={firstReference?.apaCitation} className="mt-2 min-h-24 w-full rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-950" />
                </label>
                <label className="block text-sm font-medium lg:col-span-2">
                  Annotation
                  <textarea name="referenceAnnotation" defaultValue={firstReference?.annotation ?? ""} className="mt-2 min-h-20 w-full rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-950" />
                </label>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:col-span-2">
              <button className="inline-flex min-h-10 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950">
                <Check size={16} />
                Save course
              </button>
              <ButtonLink href="/admin" variant="secondary">Cancel</ButtonLink>
            </div>
          </form>
        </Panel>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Active users" value={`${users.length}`} detail="Registered accounts" />
        <StatCard label="Active courses" value={`${stats.publishedCourses}`} detail="Published catalog" />
        <StatCard label="Revenue" value={formatMoney(stats.monthlyRevenue)} detail="Monthly course sales" />
        <StatCard label="Pending" value={`${stats.pendingApprovals}`} detail="Course approvals" />
>>>>>>> 1c01f0308f5fafe3f3ca847d57554f19db9da16a
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Panel>
            <div className="mb-5 flex items-center gap-2">
              <ShieldAlert className="text-amber-600" size={20} />
              <h2 className="text-xl font-semibold">Course approval queue</h2>
            </div>
            <div className="space-y-4">
              {pending.map(({ course }) => (
                <div key={course.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{course.title}</p>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{course.description}</p>
                    </div>
                    <Badge tone="amber">{course.status.replace("_", " ")}</Badge>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <ButtonLink href={`/courses/${course.slug}`} variant="secondary">Preview</ButtonLink>
                    <form action="/api/admin/courses" method="post">
                      <input type="hidden" name="action" value="publish" />
                      <input type="hidden" name="courseId" value={course.id} />
                      <button className="inline-flex min-h-10 items-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white">
                        <Check size={16} />
                        Publish
                      </button>
                    </form>
                    <ButtonLink href={`/admin?edit=${course.id}`} variant="secondary">Edit</ButtonLink>
                  </div>
                </div>
              ))}
              {!pending.length ? (
                <p className="rounded-md bg-stone-50 p-3 text-sm text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300">No courses are waiting for approval.</p>
              ) : null}
            </div>
          </Panel>

          <Panel>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Edit3 className="text-cyan-700" size={20} />
                <h2 className="text-xl font-semibold">Course management</h2>
              </div>
              <ButtonLink href="/admin?new=course" variant="secondary">Add course</ButtonLink>
            </div>
            <div className="space-y-4">
              {courseRows.map(({ course, record }) => (
                <div key={course.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{course.title}</p>
                        <Badge tone={record.deletedAt ? "red" : course.status === "PUBLISHED" ? "green" : "amber"}>
                          {record.deletedAt ? "DELETED" : course.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                        {course.modules.length} modules, {getLessons(course).length} lessons, {course.references?.length ?? 0} references
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!record.deletedAt ? <ButtonLink href={`/courses/${course.slug}`} variant="secondary">Preview</ButtonLink> : null}
                      <ButtonLink href={`/admin?edit=${course.id}`} variant="secondary">Edit</ButtonLink>
                      {record.deletedAt ? (
                        <form action="/api/admin/courses" method="post">
                          <input type="hidden" name="action" value="restore" />
                          <input type="hidden" name="courseId" value={course.id} />
                          <button className="inline-flex min-h-10 items-center gap-2 rounded-md border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50">
                            <RotateCcw size={16} />
                            Restore
                          </button>
                        </form>
                      ) : (
                        <form action="/api/admin/courses" method="post">
                          <input type="hidden" name="action" value="delete" />
                          <input type="hidden" name="courseId" value={course.id} />
                          <button className="inline-flex min-h-10 items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700">
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {!pending.length ? (
                <p className="rounded-md bg-stone-50 p-3 text-sm text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300">No courses are waiting for approval.</p>
              ) : null}
            </div>
          </Panel>

          <Panel>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Edit3 className="text-cyan-700" size={20} />
                <h2 className="text-xl font-semibold">Course management</h2>
              </div>
              <ButtonLink href="/admin?new=course" variant="secondary">Add course</ButtonLink>
            </div>
            <div className="space-y-4">
              {courseRows.map(({ course, record }) => (
                <div key={course.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{course.title}</p>
                        <Badge tone={record.deletedAt ? "red" : course.status === "PUBLISHED" ? "green" : "amber"}>
                          {record.deletedAt ? "DELETED" : course.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                        {course.modules.length} modules, {getLessons(course).length} lessons, {course.references?.length ?? 0} references
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!record.deletedAt ? <ButtonLink href={`/courses/${course.slug}`} variant="secondary">Preview</ButtonLink> : null}
                      <ButtonLink href={`/admin?edit=${course.id}`} variant="secondary">Edit</ButtonLink>
                      {record.deletedAt ? (
                        <form action="/api/admin/courses" method="post">
                          <input type="hidden" name="action" value="restore" />
                          <input type="hidden" name="courseId" value={course.id} />
                          <button className="inline-flex min-h-10 items-center gap-2 rounded-md border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50">
                            <RotateCcw size={16} />
                            Restore
                          </button>
                        </form>
                      ) : (
                        <form action="/api/admin/courses" method="post">
                          <input type="hidden" name="action" value="delete" />
                          <input type="hidden" name="courseId" value={course.id} />
                          <button className="inline-flex min-h-10 items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700">
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
>>>>>>> 1c01f0308f5fafe3f3ca847d57554f19db9da16a
          </Panel>

          <Panel>
            <div className="mb-5 flex items-center gap-2">
              <UserCog className="text-cyan-700" size={20} />
              <h2 className="text-xl font-semibold">User management</h2>
            </div>
            <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-100 text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {dbUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Image src={user.avatarUrl} alt="" width={36} height={36} className="h-9 w-9 rounded-full object-cover" />
                          <div>
                            <p className="font-semibold">{user.name}</p>
                            <p className="text-zinc-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{roleLabel(user.role)}</td>
                      <td className="px-4 py-3">
                        <Badge tone={user.isActive ? "green" : "red"}>{user.isActive ? "Active" : "Suspended"}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <aside className="space-y-6">
          <Panel>
            <div className="flex items-center gap-2">
              <DollarSign className="text-emerald-600" size={20} />
              <h2 className="text-xl font-semibold">Revenue and payouts</h2>
            </div>
            <div className="mt-4 space-y-4">
              {visibleCourses.filter(({ course }) => course.priceCents > 0).map(({ course }) => (
                <div key={course.id}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span>{course.title}</span>
                    <span>{formatMoney(course.priceCents)}</span>
                  </div>
                  <ProgressBar value={course.status === "PUBLISHED" ? 72 : 18} />
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <h2 className="text-xl font-semibold">Featured categories</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {categories.map((category) => (
                <span key={category.id} className={`${category.color} rounded-md px-2 py-1 text-xs font-semibold`}>
                  {category.name}
                </span>
              ))}
            </div>
          </Panel>

          <Panel>
            <div className="flex items-center gap-2">
              <Settings className="text-zinc-600" size={20} />
              <h2 className="text-xl font-semibold">Global settings</h2>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              {[
                "Auth: Prisma sessions",
                "Database: local Docker Postgres",
                "References: APA 7 course sources",
                "Storage: local resource routes",
              ].map((item) => (
>>>>>>> 1c01f0308f5fafe3f3ca847d57554f19db9da16a
                <div key={item} className="rounded-lg bg-stone-50 p-3 dark:bg-zinc-950">
                  {item}
                </div>
              ))}
            </div>
          </Panel>
        </aside>
      </section>
    </PageShell>
  );
}
