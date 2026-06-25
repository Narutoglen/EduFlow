import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import type {
  Category,
  Course,
  CourseReference,
  CourseStatus,
  Enrollment,
  LessonResource,
  AssignmentSubmission,
  Notification,
  QuizAttempt,
  Quiz,
  User,
} from "./types";
import type { CatalogFilters } from "./eduflow";
import { toAppUser } from "./session";

const courseInclude = {
  category: true,
  lecturer: true,
  assistants: true,
  modules: {
    orderBy: { order: "asc" },
    include: {
      lessons: {
        orderBy: { order: "asc" },
        include: {
          resources: true,
          references: {
            orderBy: { title: "asc" },
          },
        },
      },
    },
  },
  quizzes: {
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { choices: true },
      },
    },
  },
  assignments: true,
  references: {
    orderBy: { title: "asc" },
  },
} satisfies Prisma.CourseInclude;

type CourseRecord = Prisma.CourseGetPayload<{ include: typeof courseInclude }>;

const difficultyLabel = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
} as const;

function categoryColor(slug: string) {
  return {
    "ai-and-data": "bg-cyan-100 text-cyan-900",
    "teaching-practice": "bg-amber-100 text-amber-900",
    "digital-design": "bg-emerald-100 text-emerald-900",
    "career-skills": "bg-violet-100 text-violet-900",
  }[slug] ?? "bg-zinc-100 text-zinc-900";
}

function mapReference(reference: CourseRecord["references"][number]): CourseReference {
  return {
    id: reference.id,
    courseId: reference.courseId,
    lessonId: reference.lessonId,
    title: reference.title,
    authors: reference.authors,
    publisher: reference.publisher,
    publishedDate: reference.publishedDate,
    url: reference.url,
    accessedDate: reference.accessedDate?.toISOString() ?? null,
    sourceType: reference.sourceType,
    apaCitation: reference.apaCitation,
    annotation: reference.annotation,
  };
}

function mapResource(resource: CourseRecord["modules"][number]["lessons"][number]["resources"][number]): LessonResource {
  return {
    id: resource.id,
    title: resource.title,
    type: resource.type as LessonResource["type"],
    url: resource.url,
  };
}

export function mapCourse(record: CourseRecord): Course {
  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    description: record.description,
    thumbnailUrl: record.thumbnailUrl ?? "/globe.svg",
    trailerUrl: record.trailerUrl ?? "",
    categoryId: record.categoryId,
    difficulty: difficultyLabel[record.difficulty],
    priceCents: record.priceCents,
    rating: record.rating,
    reviewCount: record.reviewCount,
    durationHours: record.durationHours,
    estimatedWeeklyHours: record.estimatedWeeklyHours,
    audience: record.audience,
    learningOutcomes: record.learningOutcomes,
    certificateEligible: record.certificateEligible,
    prerequisites: record.prerequisites,
    tags: record.tags,
    lecturerId: record.lecturerId,
    taIds: record.assistants.map((assistant) => assistant.userId),
    status: record.status as CourseStatus,
    allowSkipAhead: record.allowSkipAhead,
    featured: record.featured,
    references: record.references.map(mapReference),
    modules: record.modules.map((module) => ({
      id: module.id,
      title: module.title,
      order: module.order,
      lessons: module.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        durationMinutes: lesson.durationMinutes,
        videoUrl: lesson.videoUrl ?? "",
        content: lesson.content,
        resources: lesson.resources.map(mapResource),
        references: lesson.references.map(mapReference),
        order: lesson.order,
        forumThreadId: `thread-${lesson.id}`,
      })),
    })),
    quizzes: record.quizzes.map((quiz): Quiz => ({
      id: quiz.id,
      title: quiz.title,
      lessonId: quiz.lessonId,
      timeLimitMinutes: quiz.timeLimitMinutes ?? undefined,
      passScore: quiz.passScore,
      randomized: quiz.randomized,
      questions: quiz.questions.map((question) => ({
        id: question.id,
        prompt: question.prompt,
        type: question.type,
        points: question.points,
        choices: question.choices.map((choice) => ({
          id: choice.id,
          label: choice.label,
          isCorrect: choice.isCorrect,
        })),
      })),
    })),
    assignments: record.assignments.map((assignment) => ({
      id: assignment.id,
      courseId: assignment.courseId,
      lessonId: assignment.lessonId,
      title: assignment.title,
      prompt: assignment.prompt,
      rubric: Array.isArray(assignment.rubric) ? assignment.rubric.map(String) : [],
      deadline: assignment.deadline.toISOString().slice(0, 10),
      maxScore: assignment.maxScore,
    })),
  };
}

export async function getCategoriesFromDb(): Promise<Category[]> {
  const records = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return records.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    color: category.color?.startsWith("bg-")
      ? category.color
      : categoryColor(category.slug),
  }));
}

export async function getUsersFromDb(): Promise<User[]> {
  const records = await prisma.user.findMany({ orderBy: { name: "asc" } });
  return records.map((user) => toAppUser(user));
}

export async function getEnrollmentFromDb(studentId: string, courseId: string): Promise<Enrollment | undefined> {
  const record = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
    include: {
      course: { include: { modules: { include: { lessons: true } } } },
    },
  });
  if (!record) return undefined;
  const completed = await prisma.lessonProgress.findMany({
    where: { studentId, completed: true, lesson: { module: { courseId } } },
    orderBy: { updatedAt: "desc" },
  });
  const lessons = record.course.modules
    .flatMap((module) => module.lessons)
    .sort((a, b) => a.order - b.order);
  return {
    id: record.id,
    studentId,
    courseId,
    paid: record.paid,
    progressPercent: record.progressPercent,
    streakDays: record.streakDays,
    completedLessonIds: completed.map((item) => item.lessonId),
    gradePercent: record.gradePercent,
    lastAccessedLessonId: completed[0]?.lessonId ?? lessons[0]?.id ?? "",
    startedAt: record.startedAt.toISOString().slice(0, 10),
  };
}

export async function getEnrollmentsForStudentFromDb(studentId: string): Promise<Enrollment[]> {
  const records = await prisma.enrollment.findMany({
    where: { studentId },
    orderBy: { startedAt: "desc" },
  });
  const enrollments = await Promise.all(
    records.map((record) => getEnrollmentFromDb(studentId, record.courseId)),
  );
  return enrollments.filter((enrollment): enrollment is Enrollment => Boolean(enrollment));
}

export async function getNotificationsForUserFromDb(userId: string): Promise<Notification[]> {
  const records = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 12,
  });
  return records.map((notification) => ({
    id: notification.id,
    userId: notification.userId,
    title: notification.title,
    body: notification.body,
    kind: notification.kind as Notification["kind"],
    read: notification.read,
  }));
}

export async function getQuizAttemptsForStudentFromDb(studentId: string): Promise<QuizAttempt[]> {
  const records = await prisma.quizAttempt.findMany({
    where: { studentId },
    orderBy: { submittedAt: "desc" },
  });
  return records.map((attempt) => ({
    id: attempt.id,
    quizId: attempt.quizId,
    studentId: attempt.studentId,
    scorePercent: attempt.scorePercent,
    passed: attempt.passed,
    submittedAt: attempt.submittedAt.toISOString().slice(0, 10),
  }));
}

export async function getSubmissionsForStudentFromDb(studentId: string): Promise<AssignmentSubmission[]> {
  const records = await prisma.assignmentSubmission.findMany({
    where: { studentId },
    orderBy: { submittedAt: "desc" },
  });
  return records.map((submission) => ({
    id: submission.id,
    assignmentId: submission.assignmentId,
    studentId: submission.studentId,
    submittedAt: submission.submittedAt.toISOString().slice(0, 10),
    status: submission.status,
    score: submission.score ?? undefined,
    feedback: submission.feedback ?? undefined,
  }));
}

export async function getCourseRecordsForAdmin() {
  return prisma.course.findMany({
    include: courseInclude,
    orderBy: [{ deletedAt: "asc" }, { updatedAt: "desc" }],
  });
}

export async function getCoursesForAdmin() {
  const records = await getCourseRecordsForAdmin();
  return records.map(mapCourse);
}

export async function getPublishedCoursesFromDb() {
  const records = await prisma.course.findMany({
    where: { status: "PUBLISHED", deletedAt: null },
    include: courseInclude,
    orderBy: [{ featured: "desc" }, { title: "asc" }],
  });
  return records.map(mapCourse);
}

export async function getCourseBySlugFromDb(slug: string) {
  const record = await prisma.course.findFirst({
    where: { slug, deletedAt: null },
    include: courseInclude,
  });
  return record ? mapCourse(record) : undefined;
}

export async function getCourseByIdFromDb(courseId: string) {
  const record = await prisma.course.findFirst({
    where: { id: courseId, deletedAt: null },
    include: courseInclude,
  });
  return record ? mapCourse(record) : undefined;
}

export async function filterCoursesFromDb(filters: CatalogFilters) {
  const query = filters.q?.trim().toLowerCase();
  const courses = await getPublishedCoursesFromDb();
  const result = courses.filter((course) => {
    const matchesQuery = query
      ? [course.title, course.description, ...course.tags].some((value) =>
          value.toLowerCase().includes(query),
        )
      : true;
    const matchesCategory = filters.category
      ? course.categoryId === filters.category
      : true;
    const matchesDifficulty = filters.difficulty
      ? course.difficulty === filters.difficulty
      : true;
    const matchesPrice =
      filters.price === "free"
        ? course.priceCents === 0
        : filters.price === "paid"
          ? course.priceCents > 0
          : true;
    return matchesQuery && matchesCategory && matchesDifficulty && matchesPrice;
  });

  return result.sort((a, b) => {
    if (filters.sort === "duration") return a.durationHours - b.durationHours;
    if (filters.sort === "price") return a.priceCents - b.priceCents;
    return b.rating - a.rating;
  });
}

export async function getResourceFromDb(resourceId: string) {
  const resource = await prisma.lessonResource.findUnique({
    where: { id: resourceId },
    include: {
      lesson: {
        include: {
          module: {
            include: {
              course: true,
            },
          },
        },
      },
    },
  });
  if (!resource || resource.lesson.module.course.deletedAt) return undefined;
  return {
    course: resource.lesson.module.course,
    lesson: resource.lesson,
    resource,
  };
}

export async function platformStatsFromDb() {
  const [activeStudents, publishedCourses, pendingApprovals, enrollments, paidCourses] =
    await Promise.all([
      prisma.user.count({ where: { role: "STUDENT", isActive: true } }),
      prisma.course.count({ where: { status: "PUBLISHED", deletedAt: null } }),
      prisma.course.count({ where: { status: "PENDING_REVIEW", deletedAt: null } }),
      prisma.enrollment.findMany({ select: { progressPercent: true, courseId: true } }),
      prisma.course.findMany({ select: { id: true, priceCents: true } }),
    ]);
  const priceByCourse = new Map(paidCourses.map((course) => [course.id, course.priceCents]));
  const monthlyRevenue = enrollments.reduce(
    (total, enrollment) => total + (priceByCourse.get(enrollment.courseId) ?? 0),
    0,
  );
  const completionAverage =
    enrollments.reduce((total, enrollment) => total + enrollment.progressPercent, 0) /
    Math.max(enrollments.length, 1);

  return {
    activeStudents,
    publishedCourses,
    enrollmentCount: enrollments.length,
    monthlyRevenue,
    completionAverage: Math.round(completionAverage),
    pendingApprovals,
  };
}
