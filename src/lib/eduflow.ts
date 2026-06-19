import {
  assignmentSubmissions,
  categories,
  certificates,
  courses,
  discussions,
  enrollments,
  notifications,
  quizAttempts,
  reviews,
  users,
} from "./mock-data";
import type {
  Course,
  CourseStatus,
  Enrollment,
  Lesson,
  Quiz,
  Role,
  User,
} from "./types";

export type CatalogFilters = {
  q?: string;
  category?: string;
  difficulty?: string;
  price?: "free" | "paid";
  sort?: "rating" | "duration" | "price";
};

export function formatMoney(cents: number) {
  if (cents === 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function getPublishedCourses() {
  return courses.filter((course) => course.status === "PUBLISHED");
}

export function filterCourses(filters: CatalogFilters) {
  const query = filters.q?.trim().toLowerCase();
  const result = getPublishedCourses().filter((course) => {
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

export function getCourseBySlug(slug: string) {
  return courses.find((course) => course.slug === slug);
}

export function getCourseById(courseId: string) {
  return courses.find((course) => course.id === courseId);
}

export function getCategory(categoryId: string) {
  return categories.find((category) => category.id === categoryId);
}

export function getUser(userId: string) {
  return users.find((user) => user.id === userId);
}

export function getInstructor(course: Course) {
  return getUser(course.lecturerId) as User;
}

export function getEnrollment(studentId: string, courseId: string) {
  return enrollments.find(
    (enrollment) =>
      enrollment.studentId === studentId && enrollment.courseId === courseId,
  );
}

export function getEnrollmentsForStudent(studentId: string) {
  return enrollments.filter((enrollment) => enrollment.studentId === studentId);
}

export function getLessons(course: Course) {
  return course.modules
    .flatMap((module) => module.lessons)
    .sort((a, b) => a.order - b.order);
}

export function getLesson(courseId: string, lessonId: string) {
  const course = getCourseById(courseId);
  if (!course) return undefined;
  return getLessons(course).find((lesson) => lesson.id === lessonId);
}

export function getResource(resourceId: string) {
  for (const course of courses) {
    for (const lesson of getLessons(course)) {
      const resource = lesson.resources.find((item) => item.id === resourceId);
      if (resource) return { course, lesson, resource };
    }
  }
  return undefined;
}

export function getFirstLesson(course: Course) {
  return getLessons(course)[0];
}

export function getNextLesson(course: Course, lessonId: string) {
  const lessons = getLessons(course);
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  return index >= 0 ? lessons[index + 1] : undefined;
}

export function getPreviousLesson(course: Course, lessonId: string) {
  const lessons = getLessons(course);
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  return index > 0 ? lessons[index - 1] : undefined;
}

export function canAccessLesson(
  course: Course,
  lesson: Lesson,
  enrollment?: Enrollment,
) {
  if (course.allowSkipAhead) return true;
  if (!enrollment) return lesson.order === 1;
  const lessons = getLessons(course);
  const currentIndex = lessons.findIndex((item) => item.id === lesson.id);
  const previousLessons = lessons.slice(0, currentIndex);
  return previousLessons.every((item) =>
    enrollment.completedLessonIds.includes(item.id),
  );
}

export function completionForCourse(course: Course, enrollment?: Enrollment) {
  if (!enrollment) return 0;
  const lessonCount = getLessons(course).length;
  if (lessonCount === 0) return 0;
  return Math.round((enrollment.completedLessonIds.length / lessonCount) * 100);
}

export function getQuizForLesson(course: Course, lessonId: string) {
  return course.quizzes.find((quiz) => quiz.lessonId === lessonId);
}

export function getAssignmentsForLesson(course: Course, lessonId: string) {
  return course.assignments.filter(
    (assignment) => assignment.lessonId === lessonId,
  );
}

export function scoreQuiz(
  quiz: Quiz,
  answers: Record<string, string>,
): {
  correctCount: number;
  totalQuestions: number;
  earnedPoints: number;
  possiblePoints: number;
  scorePercent: number;
  passed: boolean;
} {
  const possiblePoints = quiz.questions.reduce(
    (total, question) => total + question.points,
    0,
  );
  const earnedPoints = quiz.questions.reduce((total, question) => {
    const selected = question.choices.find(
      (choice) => choice.id === answers[question.id],
    );
    return selected?.isCorrect ? total + question.points : total;
  }, 0);
  const correctCount = quiz.questions.filter((question) => {
    const selected = question.choices.find(
      (choice) => choice.id === answers[question.id],
    );
    return selected?.isCorrect;
  }).length;
  const scorePercent = possiblePoints
    ? Math.round((earnedPoints / possiblePoints) * 100)
    : 0;

  return {
    correctCount,
    totalQuestions: quiz.questions.length,
    earnedPoints,
    possiblePoints,
    scorePercent,
    passed: scorePercent >= quiz.passScore,
  };
}

export function canIssueCertificate(enrollment?: Enrollment) {
  return Boolean(enrollment && enrollment.progressPercent === 100);
}

export function getCertificate(verificationId: string) {
  return certificates.find(
    (certificate) => certificate.verificationId === verificationId,
  );
}

export function getCourseReviews(courseId: string) {
  return reviews.filter((review) => review.courseId === courseId);
}

export function getLessonDiscussions(threadId: string) {
  return discussions.filter((post) => post.threadId === threadId);
}

export function getNotifications(userId: string) {
  return notifications.filter((notification) => notification.userId === userId);
}

export function getQuizAttempts(studentId: string) {
  return quizAttempts.filter((attempt) => attempt.studentId === studentId);
}

export function getSubmissionsForStudent(studentId: string) {
  return assignmentSubmissions.filter(
    (submission) => submission.studentId === studentId,
  );
}

export function getCoursesForLecturer(lecturerId: string) {
  return courses.filter((course) => course.lecturerId === lecturerId);
}

export function getCoursesForTa(taId: string) {
  return courses.filter((course) => course.taIds.includes(taId));
}

export function getCoursesByStatus(status: CourseStatus) {
  return courses.filter((course) => course.status === status);
}

export function platformStats() {
  const activeStudents = users.filter((user) => user.role === "STUDENT").length;
  const monthlyRevenue = enrollments.reduce((total, enrollment) => {
    const course = getCourseById(enrollment.courseId);
    return total + (course?.priceCents ?? 0);
  }, 0);
  const completionAverage =
    enrollments.reduce((total, enrollment) => total + enrollment.progressPercent, 0) /
    Math.max(enrollments.length, 1);

  return {
    activeStudents,
    publishedCourses: getPublishedCourses().length,
    monthlyRevenue,
    completionAverage: Math.round(completionAverage),
    pendingApprovals: getCoursesByStatus("PENDING_REVIEW").length,
  };
}

export function roleLabel(role: Role) {
  return {
    STUDENT: "Student",
    LECTURER: "Lecturer",
    TA: "Teaching Assistant",
    ADMIN: "Admin",
  }[role];
}
