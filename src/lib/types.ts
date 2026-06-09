export type Role = "STUDENT" | "LECTURER" | "TA" | "ADMIN";

export type CourseStatus = "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED";

export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export type ResourceType = "pdf" | "slides" | "code" | "link";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string;
  bio: string;
  institution?: string;
  isActive: boolean;
  socialLinks: string[];
};

export type Category = {
  id: string;
  name: string;
  color: string;
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
  order: number;
  forumThreadId: string;
};

export type Module = {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
};

export type QuizChoice = {
  id: string;
  label: string;
  isCorrect: boolean;
};

export type QuizQuestion = {
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

export type Assignment = {
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
  kind: "reply" | "grade" | "announcement" | "deadline";
  read: boolean;
};

export type Certificate = {
  id: string;
  verificationId: string;
  courseId: string;
  studentId: string;
  issuedAt: string;
};
