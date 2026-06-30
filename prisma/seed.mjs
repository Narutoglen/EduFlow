import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const envPath = resolve(process.cwd(), ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

const connectionString = process.env.DATABASE_URL ?? process.env.NETLIFY_DB_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL or NETLIFY_DB_URL must be set.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const DEFAULT_VIDEO = "";
const DEFAULT_IMAGE = "/globe.svg";

const platformUsers = [
  {
    id: "usr-lecturer",
    email: "faculty@eduflow.local",
    name: "EduFlow Faculty",
    role: "LECTURER",
    bio: "Locked platform faculty record used for seeded course ownership.",
    institution: "EduFlow",
  },
  {
    id: "usr-ta",
    email: "support@eduflow.local",
    name: "EduFlow Learning Support",
    role: "TA",
    bio: "Locked support record used for seeded course assistance.",
    institution: "EduFlow Learning Support",
  },
];

const categories = [
  {
    id: "cat-ai",
    name: "AI and Data",
    slug: "ai-and-data",
    description: "Applied courses for data-informed learning teams.",
    color: "bg-cyan-100 text-cyan-900",
  },
  {
    id: "cat-pedagogy",
    name: "Teaching Practice",
    slug: "teaching-practice",
    description: "Inclusive, evidence-informed teaching workflows.",
    color: "bg-amber-100 text-amber-900",
  },
  {
    id: "cat-design",
    name: "Digital Design",
    slug: "digital-design",
    description: "Accessible assessment and learner experience design.",
    color: "bg-emerald-100 text-emerald-900",
  },
  {
    id: "cat-career",
    name: "Career Skills",
    slug: "career-skills",
    description: "Portfolio and workplace readiness for learners.",
    color: "bg-violet-100 text-violet-900",
  },
];

const referenceBank = {
  unescoGenAi: {
    id: "ref-unesco-genai",
    title: "Guidance for generative AI in education and research",
    authors: ["Miao, F.", "Holmes, W."],
    publisher: "UNESCO",
    publishedDate: "2023",
    url: "https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research",
    sourceType: "report",
    apaCitation:
      "Miao, F., & Holmes, W. (2023). Guidance for generative AI in education and research. UNESCO. https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research",
    annotation:
      "Used for human-centered policy, safety, and governance checkpoints for generative AI in learning.",
  },
  unescoTeacherAi: {
    id: "ref-unesco-ai-teachers",
    title: "AI competency framework for teachers",
    authors: ["UNESCO"],
    publisher: "UNESCO",
    publishedDate: "2024",
    url: "https://www.unesco.org/en/articles/ai-competency-framework-teachers",
    sourceType: "framework",
    apaCitation:
      "UNESCO. (2024). AI competency framework for teachers. https://www.unesco.org/en/articles/ai-competency-framework-teachers",
    annotation:
      "Supports teacher competencies in ethics, pedagogy, professional learning, and AI foundations.",
  },
  nistAiRmf: {
    id: "ref-nist-ai-rmf",
    title: "Artificial Intelligence Risk Management Framework (AI RMF 1.0)",
    authors: ["National Institute of Standards and Technology"],
    publisher: "National Institute of Standards and Technology",
    publishedDate: "2023",
    url: "https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10",
    sourceType: "framework",
    apaCitation:
      "National Institute of Standards and Technology. (2023). Artificial Intelligence Risk Management Framework (AI RMF 1.0). https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10",
    annotation:
      "Used for practical risk identification, monitoring, and accountability patterns in AI-enabled workflows.",
  },
  usEdAi: {
    id: "ref-us-ed-ai",
    title: "Artificial Intelligence and the future of teaching and learning",
    authors: ["U.S. Department of Education, Office of Educational Technology"],
    publisher: "U.S. Department of Education",
    publishedDate: "2023",
    url: "https://www.ed.gov/media/document/ai-reportpdf-43861.pdf",
    sourceType: "report",
    apaCitation:
      "U.S. Department of Education, Office of Educational Technology. (2023). Artificial intelligence and the future of teaching and learning: Insights and recommendations. https://www.ed.gov/media/document/ai-reportpdf-43861.pdf",
    annotation:
      "Supports teaching-and-learning recommendations for responsible AI adoption.",
  },
  ncesDataLiteracy: {
    id: "ref-nces-data-literacy",
    title: "Forum guide to data literacy",
    authors: ["National Forum on Education Statistics"],
    publisher: "National Center for Education Statistics",
    publishedDate: "2024",
    url: "https://nces.ed.gov/Pubs2024/NFES2024079.pdf",
    sourceType: "guide",
    apaCitation:
      "National Forum on Education Statistics. (2024). Forum guide to data literacy (NFES 2024-079). National Center for Education Statistics. https://nces.ed.gov/Pubs2024/NFES2024079.pdf",
    annotation:
      "Guides data literacy outcomes, stakeholder use cases, and responsible school data interpretation.",
  },
  kenyaOdpc: {
    id: "ref-kenya-odpc-education",
    title: "Guidance note for the education sector",
    authors: ["Office of the Data Protection Commissioner"],
    publisher: "Office of the Data Protection Commissioner, Kenya",
    publishedDate: "2023",
    url: "https://www.odpc.go.ke/wp-content/uploads/2024/02/ODPC-Guidance-Note-for-the-Education-Sector.pdf",
    sourceType: "guidance",
    apaCitation:
      "Office of the Data Protection Commissioner. (2023). Guidance note for the education sector. https://www.odpc.go.ke/wp-content/uploads/2024/02/ODPC-Guidance-Note-for-the-Education-Sector.pdf",
    annotation:
      "Adds Kenya-specific guidance for student data collection, use, retention, disclosure, and disposal.",
  },
  wcag22: {
    id: "ref-wcag-22",
    title: "Web Content Accessibility Guidelines (WCAG) 2.2",
    authors: ["World Wide Web Consortium"],
    publisher: "W3C",
    publishedDate: "2023",
    url: "https://www.w3.org/TR/WCAG22/",
    sourceType: "standard",
    apaCitation:
      "World Wide Web Consortium. (2023). Web Content Accessibility Guidelines (WCAG) 2.2. https://www.w3.org/TR/WCAG22/",
    annotation:
      "Supports accessible interaction, navigation, error handling, and digital content expectations.",
  },
  castUdl: {
    id: "ref-cast-udl",
    title: "The UDL guidelines",
    authors: ["CAST"],
    publisher: "CAST",
    publishedDate: "2024",
    url: "https://udlguidelines.cast.org/",
    sourceType: "guidelines",
    apaCitation:
      "CAST. (2024). The UDL guidelines. https://udlguidelines.cast.org/",
    annotation:
      "Supports inclusive learning design using multiple means of engagement, representation, and action.",
  },
  aeraTesting: {
    id: "ref-aera-testing-standards",
    title: "Standards for educational and psychological testing",
    authors: [
      "American Educational Research Association",
      "American Psychological Association",
      "National Council on Measurement in Education",
    ],
    publisher: "American Educational Research Association",
    publishedDate: "2014",
    url: "https://www.aera.net/publications/books/standards-for-educational-psychological-testing-2014-edition",
    sourceType: "standard",
    apaCitation:
      "American Educational Research Association, American Psychological Association, & National Council on Measurement in Education. (2014). Standards for educational and psychological testing. American Educational Research Association. https://www.aera.net/publications/books/standards-for-educational-psychological-testing-2014-edition",
    annotation:
      "Supports validity, fairness, reliability, and score-use principles for assessments.",
  },
  ncmeClassroom: {
    id: "ref-ncme-classroom-assessment",
    title: "Classroom Assessment Standards",
    authors: ["National Council on Measurement in Education"],
    publisher: "National Council on Measurement in Education",
    publishedDate: "2015",
    url: "https://ncme.org/involvement/committees/classroom-assessment/classroom-assessment-standards/",
    sourceType: "standard",
    apaCitation:
      "National Council on Measurement in Education. (2015). Classroom Assessment Standards. https://ncme.org/involvement/committees/classroom-assessment/classroom-assessment-standards/",
    annotation:
      "Supports classroom assessment foundations, use, quality, fairness, and feedback design.",
  },
  kenyaDlp: {
    id: "ref-kenya-dlp",
    title: "Digital Literacy Programme (DLP)",
    authors: ["Ministry of Information, Communications and the Digital Economy"],
    publisher: "Government of Kenya",
    publishedDate: "n.d.",
    url: "https://ict.go.ke/digital-literacy-programmedlp",
    sourceType: "program",
    apaCitation:
      "Ministry of Information, Communications and the Digital Economy. (n.d.). Digital Literacy Programme (DLP). Government of Kenya. https://ict.go.ke/digital-literacy-programmedlp",
    annotation:
      "Adds Kenya context for digital learning infrastructure and technology-enabled education goals.",
  },
};

const courses = [
  {
    id: "course-ai-teaching",
    slug: "ai-powered-teaching",
    title: "AI-Powered Teaching Studio",
    categoryId: "cat-ai",
    difficulty: "INTERMEDIATE",
    priceCents: 7900,
    rating: 4.8,
    reviewCount: 24,
    durationHours: 8.5,
    estimatedWeeklyHours: 3,
    status: "PUBLISHED",
    featured: true,
    allowSkipAhead: false,
    audience: "Teachers, lecturers, and curriculum teams adopting AI safely",
    description:
      "Plan adaptive lessons, design better assessments, and use generative AI tools responsibly inside real classrooms.",
    learningOutcomes: [
      "Design reviewed AI feedback workflows",
      "Write classroom-ready prompts for explanations and examples",
      "Set learner safeguards for responsible AI use",
    ],
    prerequisites: ["Basic lesson planning", "Comfort using browser-based tools"],
    tags: ["AI", "Assessment", "Instructional design"],
    modules: [
      {
        id: "mod-ai-1",
        title: "Responsible AI Foundations",
        lessons: [
          {
            id: "lesson-ai-1",
            title: "Where AI helps learning",
            durationMinutes: 22,
            content:
              "Map AI use cases to learner needs, classroom constraints, and human review points.",
            resources: [
              { id: "res-ai-1", title: "AI classroom checklist", type: "pdf" },
              { id: "res-ai-2", title: "Prompt bank", type: "slides" },
            ],
          },
          {
            id: "lesson-ai-2",
            title: "Prompting for explanations",
            durationMinutes: 31,
            content:
              "Create reusable prompt patterns for examples, misconceptions, and differentiated explanations.",
            resources: [{ id: "res-ai-3", title: "Differentiation prompts", type: "link" }],
          },
        ],
      },
      {
        id: "mod-ai-2",
        title: "Assessment and Feedback",
        lessons: [
          {
            id: "lesson-ai-3",
            title: "Rubrics that scale feedback",
            durationMinutes: 28,
            content:
              "Use rubric language to keep feedback fair, specific, and transparent for learners.",
            resources: [
              { id: "res-ai-4", title: "Rubric worksheet", type: "pdf" },
              { id: "res-ai-5", title: "Sample grading guide", type: "code" },
            ],
          },
        ],
      },
    ],
    references: [
      referenceBank.unescoGenAi,
      referenceBank.unescoTeacherAi,
      referenceBank.nistAiRmf,
      referenceBank.usEdAi,
    ],
    quiz: {
      id: "quiz-ai-1",
      lessonId: "lesson-ai-1",
      title: "Responsible AI Checkpoint",
      passScore: 70,
      randomized: true,
      questions: [
        {
          id: "q-ai-1",
          prompt: "Which practice keeps AI-assisted feedback most accountable?",
          type: "MCQ",
          points: 5,
          choices: [
            ["q-ai-1-a", "Let students receive raw AI output", false],
            ["q-ai-1-b", "Require educator review before feedback is released", true],
            ["q-ai-1-c", "Use one rubric for every subject", false],
          ],
        },
        {
          id: "q-ai-2",
          prompt: "AI tools should replace teacher judgment in high-stakes grading.",
          type: "TRUE_FALSE",
          points: 5,
          choices: [
            ["q-ai-2-a", "True", false],
            ["q-ai-2-b", "False", true],
          ],
        },
      ],
    },
    assignment: {
      id: "assign-ai-1",
      lessonId: "lesson-ai-3",
      title: "Design a reviewed AI feedback workflow",
      prompt:
        "Submit a one-page workflow showing how AI feedback is drafted, reviewed, edited, and returned to learners.",
      rubric: ["Clear learner outcome", "Human review checkpoint", "Specific feedback criteria"],
      maxScore: 100,
    },
  },
  {
    id: "course-data-literacy",
    slug: "data-literacy-for-schools",
    title: "Data Literacy for Schools",
    categoryId: "cat-ai",
    difficulty: "BEGINNER",
    priceCents: 0,
    rating: 4.9,
    reviewCount: 18,
    durationHours: 5,
    estimatedWeeklyHours: 2,
    status: "PUBLISHED",
    featured: true,
    allowSkipAhead: true,
    audience: "School leaders, analysts, and teachers building practical dashboards",
    description:
      "Turn school data into ethical, readable dashboards that support student interventions and better planning.",
    learningOutcomes: [
      "Read school data without overclaiming",
      "Build an intervention dashboard structure",
      "Add privacy notes to learner support workflows",
    ],
    prerequisites: ["Spreadsheet basics"],
    tags: ["Dashboards", "Ethics", "School operations"],
    modules: [
      {
        id: "mod-data-1",
        title: "Data Foundations",
        lessons: [
          {
            id: "lesson-data-1",
            title: "What school data can and cannot say",
            durationMinutes: 24,
            content:
              "Separate useful indicators from noisy signals while protecting student privacy.",
            resources: [{ id: "res-data-1", title: "Data ethics canvas", type: "pdf" }],
          },
          {
            id: "lesson-data-2",
            title: "Build a simple intervention dashboard",
            durationMinutes: 42,
            content:
              "Design dashboard fields, filters, and thresholds that classroom teams can act on.",
            resources: [{ id: "res-data-2", title: "Dashboard template", type: "slides" }],
          },
        ],
      },
    ],
    references: [referenceBank.ncesDataLiteracy, referenceBank.kenyaOdpc],
    quiz: {
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
          choices: [
            ["q-data-1-a", "True", true],
            ["q-data-1-b", "False", false],
          ],
        },
      ],
    },
    assignment: {
      id: "assign-data-1",
      lessonId: "lesson-data-2",
      title: "Sketch an intervention dashboard",
      prompt:
        "Upload or describe a dashboard wireframe with two filters, three indicators, and a privacy note.",
      rubric: ["Readable layout", "Actionable indicators", "Privacy-aware notes"],
      maxScore: 50,
    },
  },
  {
    id: "course-ux-assessment",
    slug: "ux-for-assessment-tools",
    title: "UX for Assessment Tools",
    categoryId: "cat-design",
    difficulty: "ADVANCED",
    priceCents: 11900,
    rating: 4.7,
    reviewCount: 11,
    durationHours: 6,
    estimatedWeeklyHours: 3,
    status: "PUBLISHED",
    featured: true,
    allowSkipAhead: true,
    audience: "Lecturers and learning designers improving assessment products",
    description:
      "Design assessment experiences learners can understand quickly, complete accessibly, and trust.",
    learningOutcomes: [
      "Reduce scoring ambiguity in assessments",
      "Write clearer rubric criteria",
      "Review learner-facing assessment flows",
    ],
    prerequisites: ["Assessment design experience"],
    tags: ["UX", "Assessment", "Accessibility"],
    modules: [
      {
        id: "mod-ux-1",
        title: "Assessment Product Basics",
        lessons: [
          {
            id: "lesson-ux-1",
            title: "Reduce scoring ambiguity",
            durationMinutes: 35,
            content:
              "Design prompts, rubrics, and review flows that reduce learner confusion.",
            resources: [{ id: "res-ux-1", title: "Assessment UX review checklist", type: "pdf" }],
          },
        ],
      },
    ],
    references: [referenceBank.wcag22, referenceBank.aeraTesting, referenceBank.ncmeClassroom],
  },
  {
    id: "course-inclusive-digital-teaching",
    slug: "inclusive-digital-teaching-practice",
    title: "Inclusive Digital Teaching Practice",
    categoryId: "cat-pedagogy",
    difficulty: "INTERMEDIATE",
    priceCents: 4900,
    rating: 4.8,
    reviewCount: 16,
    durationHours: 7,
    estimatedWeeklyHours: 3,
    status: "PUBLISHED",
    featured: true,
    allowSkipAhead: true,
    audience: "Teachers and program leads designing inclusive digital lessons",
    description:
      "Use UDL, accessibility standards, and Kenya digital learning context to make online and blended lessons easier to access.",
    learningOutcomes: [
      "Plan lessons with multiple means of engagement",
      "Audit learning materials for accessibility barriers",
      "Adapt digital teaching routines for low-resource classrooms",
    ],
    prerequisites: ["Basic digital teaching experience"],
    tags: ["Inclusion", "UDL", "Accessibility", "Kenya"],
    modules: [
      {
        id: "mod-inclusive-1",
        title: "Inclusive Digital Lesson Design",
        lessons: [
          {
            id: "lesson-inclusive-1",
            title: "Remove barriers before adding tools",
            durationMinutes: 32,
            content:
              "Identify barriers in content, interaction, language, connectivity, and assessment before selecting technology.",
            resources: [{ id: "res-inclusive-1", title: "Inclusive lesson audit", type: "pdf" }],
          },
          {
            id: "lesson-inclusive-2",
            title: "Design accessible digital routines",
            durationMinutes: 38,
            content:
              "Apply UDL and WCAG-informed checks to everyday lesson materials, instructions, and feedback loops.",
            resources: [{ id: "res-inclusive-2", title: "Accessibility quick checks", type: "slides" }],
          },
        ],
      },
    ],
    references: [referenceBank.castUdl, referenceBank.wcag22, referenceBank.kenyaDlp],
  },
  {
    id: "course-career-portfolio",
    slug: "career-ready-learning-portfolio",
    title: "Career-Ready Learning Portfolio",
    categoryId: "cat-career",
    difficulty: "BEGINNER",
    priceCents: 0,
    rating: 4.6,
    reviewCount: 13,
    durationHours: 4.5,
    estimatedWeeklyHours: 2,
    status: "PUBLISHED",
    featured: true,
    allowSkipAhead: true,
    audience: "Students and early-career professionals turning course work into evidence",
    description:
      "Build a clear portfolio that connects learning evidence, data-informed reflection, accessibility, and career storytelling.",
    learningOutcomes: [
      "Select portfolio evidence aligned to job or internship goals",
      "Write reflective case notes using credible data",
      "Present digital work accessibly and professionally",
    ],
    prerequisites: ["One completed project or course artifact"],
    tags: ["Portfolio", "Career readiness", "Reflection", "Accessibility"],
    modules: [
      {
        id: "mod-portfolio-1",
        title: "Portfolio Evidence and Story",
        lessons: [
          {
            id: "lesson-portfolio-1",
            title: "Choose evidence that proves growth",
            durationMinutes: 27,
            content:
              "Select artifacts, describe context, and connect evidence to skills employers or reviewers can understand.",
            resources: [{ id: "res-portfolio-1", title: "Portfolio evidence planner", type: "pdf" }],
          },
          {
            id: "lesson-portfolio-2",
            title: "Make portfolio pages accessible",
            durationMinutes: 30,
            content:
              "Use clear structure, alternative text, readable copy, and review checkpoints for portfolio pages.",
            resources: [{ id: "res-portfolio-2", title: "Accessible portfolio checklist", type: "slides" }],
          },
        ],
      },
    ],
    references: [referenceBank.ncesDataLiteracy, referenceBank.wcag22, referenceBank.kenyaDlp],
  },
];

async function clearLmsData() {
  await prisma.$transaction([
    prisma.payment.deleteMany(),
    prisma.moderationReport.deleteMany(),
    prisma.liveSession.deleteMany(),
    prisma.certificate.deleteMany(),
    prisma.announcement.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.review.deleteMany(),
    prisma.assignmentSubmission.deleteMany(),
    prisma.assignment.deleteMany(),
    prisma.quizAttempt.deleteMany(),
    prisma.quizChoice.deleteMany(),
    prisma.quizQuestion.deleteMany(),
    prisma.quiz.deleteMany(),
    prisma.lessonNote.deleteMany(),
    prisma.lessonProgress.deleteMany(),
    prisma.enrollment.deleteMany(),
    prisma.courseReference.deleteMany(),
    prisma.lessonResource.deleteMany(),
    prisma.discussionPost.deleteMany(),
    prisma.discussionThread.deleteMany(),
    prisma.lesson.deleteMany(),
    prisma.courseModule.deleteMany(),
    prisma.courseAssistant.deleteMany(),
    prisma.course.deleteMany(),
    prisma.category.deleteMany(),
    prisma.session.deleteMany(),
    prisma.user.deleteMany(),
    prisma.platformSetting.deleteMany(),
  ]);
}

async function seedPlatformUsers() {
  for (const user of platformUsers) {
    await prisma.user.create({
      data: {
        ...user,
        passwordHash: null,
        avatarUrl: DEFAULT_IMAGE,
        emailNotifications: false,
        socialLinks: [],
      },
    });
  }
}

async function seedCourses() {
  for (const category of categories) {
    await prisma.category.create({ data: category });
  }

  for (const course of courses) {
    await prisma.course.create({
      data: {
        id: course.id,
        slug: course.slug,
        title: course.title,
        description: course.description,
        thumbnailUrl: DEFAULT_IMAGE,
        trailerUrl: DEFAULT_VIDEO,
        categoryId: course.categoryId,
        lecturerId: "usr-lecturer",
        difficulty: course.difficulty,
        priceCents: course.priceCents,
        rating: course.rating,
        reviewCount: course.reviewCount,
        durationHours: course.durationHours,
        estimatedWeeklyHours: course.estimatedWeeklyHours,
        audience: course.audience,
        learningOutcomes: course.learningOutcomes,
        certificateEligible: true,
        prerequisites: course.prerequisites,
        tags: course.tags,
        status: course.status,
        allowSkipAhead: course.allowSkipAhead,
        featured: course.featured,
        publishedAt: new Date(),
      },
    });

    await prisma.courseAssistant.create({
      data: {
        courseId: course.id,
        userId: "usr-ta",
      },
    });

    const lessonIds = new Set(course.modules.flatMap((module) => module.lessons.map((lesson) => lesson.id)));
    for (const [moduleIndex, module] of course.modules.entries()) {
      await prisma.courseModule.create({
        data: {
          id: module.id,
          courseId: course.id,
          title: module.title,
          order: moduleIndex + 1,
        },
      });

      for (const [lessonIndex, lesson] of module.lessons.entries()) {
        await prisma.lesson.create({
          data: {
            id: lesson.id,
            moduleId: module.id,
            title: lesson.title,
            content: lesson.content,
            videoUrl: DEFAULT_VIDEO,
            durationMinutes: lesson.durationMinutes,
            order: lessonIndex + 1,
          },
        });
        await prisma.discussionThread.create({
          data: {
            id: `thread-${lesson.id}`,
            lessonId: lesson.id,
            title: `${lesson.title} discussion`,
          },
        });
        for (const resource of lesson.resources) {
          await prisma.lessonResource.create({
            data: {
              id: resource.id,
              lessonId: lesson.id,
              title: resource.title,
              type: resource.type,
              url: `/api/resources/${resource.id}`,
            },
          });
        }
      }
    }

    const firstLessonId = course.modules[0]?.lessons[0]?.id;
    for (const reference of course.references) {
      const lessonId = firstLessonId && lessonIds.has(firstLessonId) ? firstLessonId : null;
      await prisma.courseReference.create({
        data: {
          id: `${course.id}-${reference.id}`,
          courseId: course.id,
          lessonId,
          title: reference.title,
          authors: reference.authors,
          publisher: reference.publisher,
          publishedDate: reference.publishedDate,
          url: reference.url,
          accessedDate: new Date("2026-06-22T00:00:00.000Z"),
          sourceType: reference.sourceType,
          apaCitation: reference.apaCitation,
          annotation: reference.annotation,
        },
      });
    }

    if (course.quiz) {
      await prisma.quiz.create({
        data: {
          id: course.quiz.id,
          courseId: course.id,
          lessonId: course.quiz.lessonId,
          title: course.quiz.title,
          passScore: course.quiz.passScore,
          randomized: course.quiz.randomized,
        },
      });
      for (const [questionIndex, question] of course.quiz.questions.entries()) {
        await prisma.quizQuestion.create({
          data: {
            id: question.id,
            quizId: course.quiz.id,
            prompt: question.prompt,
            type: question.type,
            points: question.points,
            order: questionIndex + 1,
          },
        });
        for (const choice of question.choices) {
          await prisma.quizChoice.create({
            data: {
              id: choice[0],
              questionId: question.id,
              label: choice[1],
              isCorrect: choice[2],
            },
          });
        }
      }
    }

    if (course.assignment) {
      await prisma.assignment.create({
        data: {
          id: course.assignment.id,
          courseId: course.id,
          lessonId: course.assignment.lessonId,
          title: course.assignment.title,
          prompt: course.assignment.prompt,
          rubric: course.assignment.rubric,
          deadline: new Date("2026-07-15T00:00:00.000Z"),
          maxScore: course.assignment.maxScore,
        },
      });
    }
  }
}

async function seedSettings() {
  await prisma.platformSetting.create({
    data: {
      key: "integrations",
      value: {
        payments: "local-checkout",
        email: "console-email",
        storage: "local-dev-storage",
        video: "url-embed",
        auth: "prisma-session",
      },
    },
  });
}

async function main() {
  await clearLmsData();
  await seedPlatformUsers();
  await seedCourses();
  await seedSettings();
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
