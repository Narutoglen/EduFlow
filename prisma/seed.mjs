import { randomBytes, scryptSync } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Run with: node --env-file=.env prisma/seed.mjs",
  );
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

// Demo accounts — one per role. IDs match the seeded catalog content so the
// signed-in user immediately sees their courses, grades, and dashboards.
const DEMO_USERS = [
  {
    id: "usr-student",
    email: "amina@student.eduflow.test",
    name: "Amina Otieno",
    role: "STUDENT",
    password: "Student123!",
    bio: "Data analyst building a stronger portfolio through applied learning.",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
    socialLinks: ["https://linkedin.com/in/amina"],
  },
  {
    id: "usr-lecturer",
    email: "mateo@lecturer.eduflow.test",
    name: "Dr. Mateo Ruiz",
    role: "LECTURER",
    password: "Lecturer123!",
    institution: "Nairobi Digital Institute",
    bio: "Learning designer and AI curriculum lead.",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
    socialLinks: ["https://example.com/mateo"],
  },
  {
    id: "usr-ta",
    email: "leah@ta.eduflow.test",
    name: "Leah Kamau",
    role: "TA",
    password: "Assistant123!",
    bio: "Teaching assistant focused on feedback loops and learner support.",
    avatarUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=160&q=80",
    socialLinks: [],
  },
  {
    id: "usr-admin",
    email: "noah@admin.eduflow.test",
    name: "Noah Chen",
    role: "ADMIN",
    password: "Admin123!",
    bio: "Platform operator for course quality, analytics, and safety.",
    avatarUrl:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=160&q=80",
    socialLinks: [],
  },
  {
    id: "usr-review",
    email: "priya@student.eduflow.test",
    name: "Priya Shah",
    role: "STUDENT",
    password: "Student123!",
    bio: "Product manager learning AI facilitation.",
    avatarUrl:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=160&q=80",
    socialLinks: [],
  },
];

const CATEGORIES = [
  { name: "AI and Data", slug: "ai-and-data", color: "cyan", description: "Applied AI and data courses." },
  { name: "Teaching Practice", slug: "teaching-practice", color: "amber", description: "Modern pedagogy and facilitation." },
  { name: "Digital Design", slug: "digital-design", color: "emerald", description: "Design for learning experiences." },
  { name: "Career Skills", slug: "career-skills", color: "violet", description: "Skills that move careers forward." },
];

const YT = "https://www.youtube.com/embed/dQw4w9WgXcQ";

// Catalog content owned by the demo lecturer (usr-lecturer). IDs are stable so
// the seed is idempotent and matches the ids the rest of the app references.
const COURSES = [
  {
    id: "course-ai-teaching",
    slug: "ai-powered-teaching",
    title: "AI-Powered Teaching Studio",
    description:
      "Plan adaptive lessons, design better assessments, and use generative AI tools responsibly inside real classrooms.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    trailerUrl: YT,
    categorySlug: "ai-and-data",
    difficulty: "INTERMEDIATE",
    priceCents: 7900,
    prerequisites: ["Basic lesson planning", "Comfort using browser-based tools"],
    tags: ["AI", "Assessment", "Instructional design"],
    status: "PUBLISHED",
    allowSkipAhead: false,
    featured: true,
    publishedAt: new Date("2026-05-01"),
    modules: [
      {
        id: "mod-ai-1",
        title: "Responsible AI Foundations",
        order: 1,
        lessons: [
          { id: "lesson-ai-1", title: "Where AI helps learning", durationMinutes: 22, order: 1, content: "Map AI use cases to learner needs, classroom constraints, and human review points." },
          { id: "lesson-ai-2", title: "Prompting for explanations", durationMinutes: 31, order: 2, content: "Create reusable prompt patterns for examples, misconceptions, and differentiated explanations." },
        ],
      },
      {
        id: "mod-ai-2",
        title: "Assessment and Feedback",
        order: 2,
        lessons: [
          { id: "lesson-ai-3", title: "Rubrics that scale feedback", durationMinutes: 28, order: 1, content: "Use rubric language to keep feedback fair, specific, and transparent for learners." },
        ],
      },
    ],
    enrollments: [
      { id: "enroll-ai", studentId: "usr-student", paid: true, progressPercent: 67, streakDays: 9, gradePercent: 84, startedAt: new Date("2026-05-24") },
    ],
    assignments: [
      {
        id: "assign-ai-1",
        lessonId: "lesson-ai-3",
        title: "Design a reviewed AI feedback workflow",
        prompt: "Submit a one-page workflow showing how AI feedback is drafted, reviewed, edited, and returned to learners.",
        rubric: ["Clear learner outcome", "Human review checkpoint", "Specific feedback criteria"],
        deadline: new Date("2026-07-15"),
        maxScore: 100,
        submissions: [
          { id: "sub-ai-1", studentId: "usr-student", status: "GRADED", score: 88, feedback: "Strong workflow. Add one more learner consent note before rollout.", submittedAt: new Date("2026-06-06"), gradedAt: new Date("2026-06-07") },
        ],
      },
    ],
    quizzes: [
      {
        id: "quiz-ai-1",
        lessonId: "lesson-ai-1",
        title: "Responsible AI Checkpoint",
        timeLimitMinutes: 12,
        passScore: 70,
        randomized: true,
        questions: [
          {
            id: "q-ai-1",
            prompt: "Which practice keeps AI-assisted feedback most accountable?",
            type: "MCQ",
            points: 5,
            order: 1,
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
            order: 2,
            choices: [
              { id: "q-ai-2-a", label: "True", isCorrect: false },
              { id: "q-ai-2-b", label: "False", isCorrect: true },
            ],
          },
        ],
        attempts: [
          { id: "attempt-ai-1", studentId: "usr-student", answers: { "q-ai-1": "q-ai-1-b", "q-ai-2": "q-ai-2-b" }, scorePercent: 80, passed: true, submittedAt: new Date("2026-06-04") },
        ],
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
    trailerUrl: YT,
    categorySlug: "ai-and-data",
    difficulty: "BEGINNER",
    priceCents: 0,
    prerequisites: ["Spreadsheet basics"],
    tags: ["Dashboards", "Ethics", "School operations"],
    status: "PUBLISHED",
    allowSkipAhead: true,
    featured: true,
    publishedAt: new Date("2026-05-05"),
    modules: [
      {
        id: "mod-data-1",
        title: "Data Foundations",
        order: 1,
        lessons: [
          { id: "lesson-data-1", title: "What school data can and cannot say", durationMinutes: 24, order: 1, content: "Separate useful indicators from noisy signals while protecting student privacy." },
          { id: "lesson-data-2", title: "Build a simple intervention dashboard", durationMinutes: 42, order: 2, content: "Design dashboard fields, filters, and thresholds that classroom teams can act on." },
        ],
      },
    ],
    enrollments: [
      { id: "enroll-data", studentId: "usr-student", paid: true, progressPercent: 100, streakDays: 9, gradePercent: 92, startedAt: new Date("2026-05-12"), completedAt: new Date("2026-05-30") },
    ],
    assignments: [
      {
        id: "assign-data-1",
        lessonId: "lesson-data-2",
        title: "Sketch an intervention dashboard",
        prompt: "Upload or describe a dashboard wireframe with two filters, three indicators, and a privacy note.",
        rubric: ["Readable layout", "Actionable indicators", "Privacy-aware notes"],
        deadline: new Date("2026-07-04"),
        maxScore: 50,
        submissions: [
          { id: "sub-data-1", studentId: "usr-student", status: "GRADED", score: 46, feedback: "Clear indicators and a practical privacy statement.", submittedAt: new Date("2026-05-21"), gradedAt: new Date("2026-05-22") },
        ],
      },
    ],
    quizzes: [
      {
        id: "quiz-data-1",
        lessonId: "lesson-data-1",
        title: "Data Use Basics",
        passScore: 75,
        randomized: false,
        questions: [
          {
            id: "q-data-1",
            prompt: "A dashboard should make learner support decisions easier to review.",
            type: "TRUE_FALSE",
            points: 10,
            order: 1,
            choices: [
              { id: "q-data-1-a", label: "True", isCorrect: true },
              { id: "q-data-1-b", label: "False", isCorrect: false },
            ],
          },
        ],
        attempts: [
          { id: "attempt-data-1", studentId: "usr-student", answers: { "q-data-1": "q-data-1-a" }, scorePercent: 100, passed: true, submittedAt: new Date("2026-05-18") },
        ],
      },
    ],
    certificate: {
      id: "cert-data",
      verificationId: "EDU-2026-DATA-9K2",
      studentId: "usr-student",
      issuedAt: new Date("2026-05-23"),
    },
  },
  {
    id: "course-ux-assessment",
    slug: "ux-for-assessment-tools",
    title: "UX for Assessment Tools",
    description:
      "A pending course that teaches lecturers to design assessment experiences learners can understand quickly.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=1200&q=80",
    trailerUrl: YT,
    categorySlug: "digital-design",
    difficulty: "ADVANCED",
    priceCents: 11900,
    prerequisites: ["Assessment design experience"],
    tags: ["UX", "Assessment", "Accessibility"],
    status: "PENDING_REVIEW",
    allowSkipAhead: true,
    featured: false,
    publishedAt: null,
    modules: [
      {
        id: "mod-ux-1",
        title: "Assessment Product Basics",
        order: 1,
        lessons: [
          { id: "lesson-ux-1", title: "Reduce scoring ambiguity", durationMinutes: 35, order: 1, content: "Design prompts, rubrics, and review flows that reduce learner confusion." },
        ],
      },
    ],
    enrollments: [],
    assignments: [],
  },
];

async function main() {
  await prisma.platformSetting.upsert({
    where: { key: "integrations" },
    update: {
      value: { payments: "mock-stripe", email: "console-email", storage: "local-dev-storage", video: "url-embed" },
    },
    create: {
      key: "integrations",
      value: { payments: "mock-stripe", email: "console-email", storage: "local-dev-storage", video: "url-embed" },
    },
  });

  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, color: category.color, description: category.description },
      create: category,
    });
  }

  for (const user of DEMO_USERS) {
    const { password, ...fields } = user;
    const passwordHash = hashPassword(password);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: fields.name,
        role: fields.role,
        passwordHash,
        emailVerifiedAt: new Date(),
        avatarUrl: fields.avatarUrl,
        bio: fields.bio,
        institution: fields.institution ?? null,
        socialLinks: fields.socialLinks,
        isActive: true,
      },
      create: {
        id: fields.id,
        email: fields.email,
        name: fields.name,
        role: fields.role,
        passwordHash,
        emailVerifiedAt: new Date(),
        avatarUrl: fields.avatarUrl,
        bio: fields.bio,
        institution: fields.institution ?? null,
        socialLinks: fields.socialLinks,
        isActive: true,
      },
    });
  }

  // Catalog content (lecturer-owned courses + modules/lessons/enrollments/assignments).
  const categoryRows = await prisma.category.findMany();
  const categoryIdBySlug = Object.fromEntries(
    categoryRows.map((category) => [category.slug, category.id]),
  );

  for (const course of COURSES) {
    const { modules, enrollments, assignments, quizzes, certificate, categorySlug, ...fields } =
      course;
    const categoryId = categoryIdBySlug[categorySlug];
    const courseData = { ...fields, categoryId, lecturerId: "usr-lecturer" };
    await prisma.course.upsert({
      where: { id: course.id },
      update: courseData,
      create: courseData,
    });

    for (const courseModule of modules) {
      const { lessons, ...moduleFields } = courseModule;
      await prisma.courseModule.upsert({
        where: { id: courseModule.id },
        update: { title: moduleFields.title, order: moduleFields.order, courseId: course.id },
        create: { id: courseModule.id, title: moduleFields.title, order: moduleFields.order, courseId: course.id },
      });
      for (const lesson of lessons) {
        const lessonData = {
          title: lesson.title,
          content: lesson.content,
          videoUrl: YT,
          durationMinutes: lesson.durationMinutes,
          order: lesson.order,
          moduleId: courseModule.id,
        };
        await prisma.lesson.upsert({
          where: { id: lesson.id },
          update: lessonData,
          create: { id: lesson.id, ...lessonData },
        });
      }
    }

    for (const enrollment of enrollments) {
      const enrollmentData = {
        paid: enrollment.paid,
        progressPercent: enrollment.progressPercent,
        streakDays: enrollment.streakDays,
        gradePercent: enrollment.gradePercent,
        startedAt: enrollment.startedAt,
        completedAt: enrollment.completedAt ?? null,
      };
      await prisma.enrollment.upsert({
        where: { studentId_courseId: { studentId: enrollment.studentId, courseId: course.id } },
        update: enrollmentData,
        create: { id: enrollment.id, studentId: enrollment.studentId, courseId: course.id, ...enrollmentData },
      });
    }

    for (const assignment of assignments) {
      const { submissions, ...assignmentFields } = assignment;
      const assignmentData = {
        title: assignmentFields.title,
        prompt: assignmentFields.prompt,
        rubric: assignmentFields.rubric,
        deadline: assignmentFields.deadline,
        maxScore: assignmentFields.maxScore,
        courseId: course.id,
        lessonId: assignmentFields.lessonId,
      };
      await prisma.assignment.upsert({
        where: { id: assignment.id },
        update: assignmentData,
        create: { id: assignment.id, ...assignmentData },
      });
      for (const submission of submissions ?? []) {
        const submissionData = {
          status: submission.status,
          score: submission.score ?? null,
          feedback: submission.feedback ?? null,
          submittedAt: submission.submittedAt,
          gradedAt: submission.gradedAt ?? null,
        };
        await prisma.assignmentSubmission.upsert({
          where: { id: submission.id },
          update: submissionData,
          create: { id: submission.id, assignmentId: assignment.id, studentId: submission.studentId, ...submissionData },
        });
      }
    }

    for (const quiz of quizzes ?? []) {
      const { questions, attempts, ...quizFields } = quiz;
      const quizData = {
        title: quizFields.title,
        timeLimitMinutes: quizFields.timeLimitMinutes ?? null,
        passScore: quizFields.passScore,
        randomized: quizFields.randomized ?? false,
        courseId: course.id,
        lessonId: quizFields.lessonId,
      };
      await prisma.quiz.upsert({
        where: { id: quiz.id },
        update: quizData,
        create: { id: quiz.id, ...quizData },
      });
      for (const question of questions ?? []) {
        const { choices, ...questionFields } = question;
        const questionData = {
          prompt: questionFields.prompt,
          type: questionFields.type,
          points: questionFields.points,
          order: questionFields.order,
          quizId: quiz.id,
        };
        await prisma.quizQuestion.upsert({
          where: { id: question.id },
          update: questionData,
          create: { id: question.id, ...questionData },
        });
        for (const choice of choices ?? []) {
          const choiceData = { label: choice.label, isCorrect: choice.isCorrect, questionId: question.id };
          await prisma.quizChoice.upsert({
            where: { id: choice.id },
            update: choiceData,
            create: { id: choice.id, ...choiceData },
          });
        }
      }
      for (const attempt of attempts ?? []) {
        const attemptData = {
          answers: attempt.answers,
          scorePercent: attempt.scorePercent,
          passed: attempt.passed,
        };
        await prisma.quizAttempt.upsert({
          where: { id: attempt.id },
          update: attemptData,
          create: {
            id: attempt.id,
            quizId: quiz.id,
            studentId: attempt.studentId,
            submittedAt: attempt.submittedAt,
            ...attemptData,
          },
        });
      }
    }

    if (certificate) {
      const certificateData = {
        verificationId: certificate.verificationId,
        studentId: certificate.studentId,
        courseId: course.id,
        issuedAt: certificate.issuedAt,
        pdfUrl: certificate.pdfUrl ?? null,
      };
      await prisma.certificate.upsert({
        where: { id: certificate.id },
        update: certificateData,
        create: { id: certificate.id, ...certificateData },
      });
    }
  }

  const count = await prisma.user.count();
  const courseCount = await prisma.course.count();
  console.log(`Seeded ${DEMO_USERS.length} demo accounts (${count} users total).`);
  console.log(`Seeded ${COURSES.length} demo courses (${courseCount} courses total).`);
  console.log("Demo credentials:");
  for (const u of DEMO_USERS) {
    console.log(`  ${u.role.padEnd(8)} ${u.email}  /  ${u.password}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
