export type Role = "STUDENT" | "LECTURER" | "TA" | "ADMIN";

export type CourseStatus = "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED";

type Difficulty = "Beginner" | "Intermediate" | "Advanced";

type ResourceType = "pdf" | "slides" | "code" | "link";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string;
  bio: string;
  institution?: string;
  isActive: boolean;
  emailNotifications?: boolean;
  socialLinks: string[];
};

export type Category = {
  id: string;
  name: string;
  slug?: string;
  color: string;
};

export type CourseReference = {
  id: string;
  courseId: string;
  lessonId?: string | null;
  title: string;
  authors: string[];
  publisher: string;
  publishedDate?: string | null;
  url: string;
  accessedDate?: string | null;
  sourceType: string;
  apaCitation: string;
  annotation?: string | null;
};

export type LessonResource = {
  id: string;
  title: string;
  type: ResourceType;
  url: string;
};

export type Lesson = {
  id: string;
  title: string;
  durationMinutes: number;
  videoUrl: string;
  content: string;
  resources: LessonResource[];
  references?: CourseReference[];
  order: number;
  forumThreadId: string;
};

type Module = {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
};

type QuizChoice = {
  id: string;
  label: string;
  isCorrect: boolean;
};

type QuizQuestion = {
  id: string;
  prompt: string;
  type: "MCQ" | "TRUE_FALSE";
  points: number;
  choices: QuizChoice[];
};

export type Quiz = {
  id: string;
  title: string;
  lessonId: string;
  timeLimitMinutes?: number;
  passScore: number;
  randomized: boolean;
  questions: QuizQuestion[];
};

type Assignment = {
  id: string;
  courseId: string;
  lessonId: string;
  title: string;
  prompt: string;
  rubric: string[];
  deadline: string;
  maxScore: number;
};

export type Course = {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  trailerUrl: string;
  categoryId: string;
  difficulty: Difficulty;
  priceCents: number;
  rating: number;
  reviewCount: number;
  durationHours: number;
  estimatedWeeklyHours: number;
  audience: string;
  learningOutcomes: string[];
  certificateEligible: boolean;
  prerequisites: string[];
  tags: string[];
  lecturerId: string;
  taIds: string[];
  status: CourseStatus;
  allowSkipAhead: boolean;
  featured: boolean;
  modules: Module[];
  quizzes: Quiz[];
  assignments: Assignment[];
  references?: CourseReference[];
};

export type Enrollment = {
  id: string;
  studentId: string;
  courseId: string;
  paid: boolean;
  progressPercent: number;
  streakDays: number;
  completedLessonIds: string[];
  gradePercent: number;
  lastAccessedLessonId: string;
  startedAt: string;
};

export type QuizAttempt = {
  id: string;
  quizId: string;
  studentId: string;
  scorePercent: number;
  passed: boolean;
  submittedAt: string;
};

export type AssignmentSubmission = {
  id: string;
  assignmentId: string;
  studentId: string;
  submittedAt: string;
  status: "SUBMITTED" | "GRADED";
  score?: number;
  feedback?: string;
};

export type DiscussionPost = {
  id: string;
  threadId: string;
  authorId: string;
  body: string;
  upvotes: number;
  isPinned: boolean;
  isAnswer: boolean;
  createdAt: string;
  replies: DiscussionPost[];
};

export type Review = {
  id: string;
  courseId: string;
  studentId: string;
  rating: number;
  body: string;
};

export type Notification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  kind:
    | "reply"
    | "grade"
    | "announcement"
    | "deadline"
    | "registration"
    | "assignment-submitted"
    | "exam-submitted"
    | "lecturer-application";
  read: boolean;
};

export type Certificate = {
  id: string;
  verificationId: string;
  courseId: string;
  studentId: string;
  issuedAt: string;
};
