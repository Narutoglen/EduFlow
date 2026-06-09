import type {
  AssignmentSubmission,
  Category,
  Certificate,
  Course,
  DiscussionPost,
  Enrollment,
  Notification,
  QuizAttempt,
  Review,
  Role,
  User,
} from "./types";

export const categories: Category[] = [
  { id: "cat-ai", name: "AI and Data", color: "bg-cyan-100 text-cyan-900" },
  { id: "cat-pedagogy", name: "Teaching Practice", color: "bg-amber-100 text-amber-900" },
  { id: "cat-design", name: "Digital Design", color: "bg-emerald-100 text-emerald-900" },
  { id: "cat-career", name: "Career Skills", color: "bg-violet-100 text-violet-900" },
];

export const users: User[] = [
  {
    id: "usr-student",
    name: "Amina Otieno",
    email: "amina@student.eduflow.test",
    role: "STUDENT",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
    bio: "Data analyst building a stronger portfolio through applied learning.",
    isActive: true,
    socialLinks: ["https://linkedin.com/in/amina"],
  },
  {
    id: "usr-lecturer",
    name: "Dr. Mateo Ruiz",
    email: "mateo@lecturer.eduflow.test",
    role: "LECTURER",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
    bio: "Learning designer and AI curriculum lead.",
    institution: "Nairobi Digital Institute",
    isActive: true,
    socialLinks: ["https://example.com/mateo"],
  },
  {
    id: "usr-ta",
    name: "Leah Kamau",
    email: "leah@ta.eduflow.test",
    role: "TA",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=160&q=80",
    bio: "Teaching assistant focused on feedback loops and learner support.",
    isActive: true,
    socialLinks: [],
  },
  {
    id: "usr-admin",
    name: "Noah Chen",
    email: "noah@admin.eduflow.test",
    role: "ADMIN",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=160&q=80",
    bio: "Platform operator for course quality, analytics, and safety.",
    isActive: true,
    socialLinks: [],
  },
  {
    id: "usr-review",
    name: "Priya Shah",
    email: "priya@student.eduflow.test",
    role: "STUDENT",
    avatarUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=160&q=80",
    bio: "Product manager learning AI facilitation.",
    isActive: true,
    socialLinks: [],
  },
];

export const courses: Course[] = [
  {
    id: "course-ai-teaching",
    slug: "ai-powered-teaching",
    title: "AI-Powered Teaching Studio",
    description:
      "Plan adaptive lessons, design better assessments, and use generative AI tools responsibly inside real classrooms.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    trailerUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    categoryId: "cat-ai",
    difficulty: "Intermediate",
    priceCents: 7900,
    rating: 4.8,
    reviewCount: 128,
    durationHours: 8.5,
    prerequisites: ["Basic lesson planning", "Comfort using browser-based tools"],
    tags: ["AI", "Assessment", "Instructional design"],
    lecturerId: "usr-lecturer",
    taIds: ["usr-ta"],
    status: "PUBLISHED",
    allowSkipAhead: false,
    featured: true,
    modules: [
      {
        id: "mod-ai-1",
        title: "Responsible AI Foundations",
        order: 1,
        lessons: [
          {
            id: "lesson-ai-1",
            title: "Where AI helps learning",
            durationMinutes: 22,
            videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            content:
              "Map AI use cases to learner needs, classroom constraints, and human review points.",
            order: 1,
            forumThreadId: "thread-ai-1",
            resources: [
              { id: "res-ai-1", title: "AI classroom checklist", type: "pdf", url: "#" },
              { id: "res-ai-2", title: "Prompt bank", type: "slides", url: "#" },
            ],
          },
          {
            id: "lesson-ai-2",
            title: "Prompting for explanations",
            durationMinutes: 31,
            videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            content:
              "Create reusable prompt patterns for examples, misconceptions, and differentiated explanations.",
            order: 2,
            forumThreadId: "thread-ai-2",
            resources: [
              { id: "res-ai-3", title: "Differentiation prompts", type: "link", url: "#" },
            ],
          },
        ],
      },
      {
        id: "mod-ai-2",
        title: "Assessment and Feedback",
        order: 2,
        lessons: [
          {
            id: "lesson-ai-3",
            title: "Rubrics that scale feedback",
            durationMinutes: 28,
            videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            content:
              "Use rubric language to keep feedback fair, specific, and transparent for learners.",
            order: 3,
            forumThreadId: "thread-ai-3",
            resources: [
              { id: "res-ai-4", title: "Rubric worksheet", type: "pdf", url: "#" },
              { id: "res-ai-5", title: "Sample grading guide", type: "code", url: "#" },
            ],
          },
        ],
      },
    ],
    quizzes: [
      {
        id: "quiz-ai-1",
        title: "Responsible AI Checkpoint",
        lessonId: "lesson-ai-1",
        timeLimitMinutes: 12,
        passScore: 70,
        randomized: true,
        questions: [
          {
            id: "q-ai-1",
            prompt: "Which practice keeps AI-assisted feedback most accountable?",
            type: "MCQ",
            points: 5,
            choices: [
              { id: "q-ai-1-a", label: "Let students receive raw AI output", isCorrect: false },
              { id: "q-ai-1-b", label: "Require educator review before feedback is released", isCorrect: true },
              { id: "q-ai-1-c", label: "Use one rubric for every subject", isCorrect: false },
            ],
          },
          {
            id: "q-ai-2",
            prompt: "AI tools should replace teacher judgment in high-stakes grading.",
            type: "TRUE_FALSE",
            points: 5,
            choices: [
              { id: "q-ai-2-a", label: "True", isCorrect: false },
              { id: "q-ai-2-b", label: "False", isCorrect: true },
            ],
          },
        ],
      },
    ],
    assignments: [
      {
        id: "assign-ai-1",
        courseId: "course-ai-teaching",
        lessonId: "lesson-ai-3",
        title: "Design a reviewed AI feedback workflow",
        prompt:
          "Submit a one-page workflow showing how AI feedback is drafted, reviewed, edited, and returned to learners.",
        rubric: ["Clear learner outcome", "Human review checkpoint", "Specific feedback criteria"],
        deadline: "2026-07-15",
        maxScore: 100,
      },
    ],
  },
  {
    id: "course-data-literacy",
    slug: "data-literacy-for-schools",
    title: "Data Literacy for Schools",
    description:
      "Turn school data into ethical, readable dashboards that support student interventions and better planning.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    trailerUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    categoryId: "cat-ai",
    difficulty: "Beginner",
    priceCents: 0,
    rating: 4.6,
    reviewCount: 87,
    durationHours: 5,
    prerequisites: ["Spreadsheet basics"],
    tags: ["Dashboards", "Ethics", "School operations"],
    lecturerId: "usr-lecturer",
    taIds: ["usr-ta"],
    status: "PUBLISHED",
    allowSkipAhead: true,
    featured: true,
    modules: [
      {
        id: "mod-data-1",
        title: "Data Foundations",
        order: 1,
        lessons: [
          {
            id: "lesson-data-1",
            title: "What school data can and cannot say",
            durationMinutes: 24,
            videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            content:
              "Separate useful indicators from noisy signals while protecting student privacy.",
            order: 1,
            forumThreadId: "thread-data-1",
            resources: [
              { id: "res-data-1", title: "Data ethics canvas", type: "pdf", url: "#" },
            ],
          },
          {
            id: "lesson-data-2",
            title: "Build a simple intervention dashboard",
            durationMinutes: 42,
            videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            content:
              "Design dashboard fields, filters, and thresholds that classroom teams can act on.",
            order: 2,
            forumThreadId: "thread-data-2",
            resources: [
              { id: "res-data-2", title: "Dashboard template", type: "slides", url: "#" },
            ],
          },
        ],
      },
    ],
    quizzes: [
      {
        id: "quiz-data-1",
        title: "Data Use Basics",
        lessonId: "lesson-data-1",
        passScore: 75,
        randomized: false,
        questions: [
          {
            id: "q-data-1",
            prompt: "A dashboard should make learner support decisions easier to review.",
            type: "TRUE_FALSE",
            points: 10,
            choices: [
              { id: "q-data-1-a", label: "True", isCorrect: true },
              { id: "q-data-1-b", label: "False", isCorrect: false },
            ],
          },
        ],
      },
    ],
    assignments: [
      {
        id: "assign-data-1",
        courseId: "course-data-literacy",
        lessonId: "lesson-data-2",
        title: "Sketch an intervention dashboard",
        prompt:
          "Upload or describe a dashboard wireframe with two filters, three indicators, and a privacy note.",
        rubric: ["Readable layout", "Actionable indicators", "Privacy-aware notes"],
        deadline: "2026-07-04",
        maxScore: 50,
      },
    ],
  },
  {
    id: "course-ux-assessment",
    slug: "ux-for-assessment-tools",
    title: "UX for Assessment Tools",
    description:
      "A pending course that teaches lecturers to design assessment experiences learners can understand quickly.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=1200&q=80",
    trailerUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    categoryId: "cat-design",
    difficulty: "Advanced",
    priceCents: 11900,
    rating: 0,
    reviewCount: 0,
    durationHours: 6,
    prerequisites: ["Assessment design experience"],
    tags: ["UX", "Assessment", "Accessibility"],
    lecturerId: "usr-lecturer",
    taIds: [],
    status: "PENDING_REVIEW",
    allowSkipAhead: true,
    featured: false,
    modules: [
      {
        id: "mod-ux-1",
        title: "Assessment Product Basics",
        order: 1,
        lessons: [
          {
            id: "lesson-ux-1",
            title: "Reduce scoring ambiguity",
            durationMinutes: 35,
            videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            content: "Design prompts, rubrics, and review flows that reduce learner confusion.",
            order: 1,
            forumThreadId: "thread-ux-1",
            resources: [],
          },
        ],
      },
    ],
    quizzes: [],
    assignments: [],
  },
];

export const enrollments: Enrollment[] = [
  {
    id: "enroll-ai",
    studentId: "usr-student",
    courseId: "course-ai-teaching",
    paid: true,
    progressPercent: 67,
    streakDays: 9,
    completedLessonIds: ["lesson-ai-1", "lesson-ai-2"],
    gradePercent: 84,
    lastAccessedLessonId: "lesson-ai-3",
    startedAt: "2026-05-24",
  },
  {
    id: "enroll-data",
    studentId: "usr-student",
    courseId: "course-data-literacy",
    paid: true,
    progressPercent: 100,
    streakDays: 9,
    completedLessonIds: ["lesson-data-1", "lesson-data-2"],
    gradePercent: 92,
    lastAccessedLessonId: "lesson-data-2",
    startedAt: "2026-05-12",
  },
];

export const quizAttempts: QuizAttempt[] = [
  {
    id: "attempt-ai-1",
    quizId: "quiz-ai-1",
    studentId: "usr-student",
    scorePercent: 80,
    passed: true,
    submittedAt: "2026-06-04",
  },
  {
    id: "attempt-data-1",
    quizId: "quiz-data-1",
    studentId: "usr-student",
    scorePercent: 100,
    passed: true,
    submittedAt: "2026-05-18",
  },
];

export const assignmentSubmissions: AssignmentSubmission[] = [
  {
    id: "sub-ai-1",
    assignmentId: "assign-ai-1",
    studentId: "usr-student",
    submittedAt: "2026-06-06",
    status: "GRADED",
    score: 88,
    feedback: "Strong workflow. Add one more learner consent note before rollout.",
  },
  {
    id: "sub-data-1",
    assignmentId: "assign-data-1",
    studentId: "usr-student",
    submittedAt: "2026-05-21",
    status: "GRADED",
    score: 46,
    feedback: "Clear indicators and a practical privacy statement.",
  },
];

export const discussions: DiscussionPost[] = [
  {
    id: "post-ai-1",
    threadId: "thread-ai-3",
    authorId: "usr-student",
    body: "How do you keep rubric feedback specific without making grading too slow?",
    upvotes: 12,
    isPinned: false,
    isAnswer: false,
    createdAt: "2026-06-05",
    replies: [
      {
        id: "post-ai-1-r1",
        threadId: "thread-ai-3",
        authorId: "usr-ta",
        body: "Start with 3 reusable evidence phrases per criterion, then customize one sentence for each learner.",
        upvotes: 18,
        isPinned: true,
        isAnswer: true,
        createdAt: "2026-06-05",
        replies: [],
      },
    ],
  },
  {
    id: "post-data-1",
    threadId: "thread-data-2",
    authorId: "usr-review",
    body: "Can the dashboard show attendance without revealing sensitive notes?",
    upvotes: 9,
    isPinned: false,
    isAnswer: true,
    createdAt: "2026-05-19",
    replies: [],
  },
];

export const reviews: Review[] = [
  {
    id: "review-ai-1",
    courseId: "course-ai-teaching",
    studentId: "usr-review",
    rating: 5,
    body: "The assignments made responsible AI feel practical instead of abstract.",
  },
  {
    id: "review-data-1",
    courseId: "course-data-literacy",
    studentId: "usr-student",
    rating: 5,
    body: "Useful for school teams that need dashboards people will actually use.",
  },
];

export const notifications: Notification[] = [
  {
    id: "note-1",
    userId: "usr-student",
    title: "Feedback posted",
    body: "Dr. Ruiz graded your AI feedback workflow.",
    kind: "grade",
    read: false,
  },
  {
    id: "note-2",
    userId: "usr-student",
    title: "Pinned answer",
    body: "Leah pinned an answer in Rubrics that scale feedback.",
    kind: "reply",
    read: false,
  },
  {
    id: "note-3",
    userId: "usr-lecturer",
    title: "Course awaiting review",
    body: "UX for Assessment Tools is in the admin approval queue.",
    kind: "announcement",
    read: true,
  },
];

export const certificates: Certificate[] = [
  {
    id: "cert-data",
    verificationId: "EDU-2026-DATA-9K2",
    courseId: "course-data-literacy",
    studentId: "usr-student",
    issuedAt: "2026-05-23",
  },
];

export function userForRole(role: Role) {
  return users.find((user) => user.role === role) ?? users[0];
}
