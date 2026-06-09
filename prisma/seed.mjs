import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.platformSetting.upsert({
    where: { key: "integrations" },
    update: {
      value: {
        payments: "mock-stripe",
        email: "console-email",
        storage: "local-dev-storage",
        video: "url-embed",
      },
    },
    create: {
      key: "integrations",
      value: {
        payments: "mock-stripe",
        email: "console-email",
        storage: "local-dev-storage",
        video: "url-embed",
      },
    },
  });

  const category = await prisma.category.upsert({
    where: { slug: "ai-and-data" },
    update: {},
    create: {
      name: "AI and Data",
      slug: "ai-and-data",
      description: "Applied courses for data-informed learning teams.",
      color: "cyan",
    },
  });

  const lecturer = await prisma.user.upsert({
    where: { email: "mateo@lecturer.eduflow.test" },
    update: {},
    create: {
      email: "mateo@lecturer.eduflow.test",
      name: "Dr. Mateo Ruiz",
      role: "LECTURER",
      institution: "Nairobi Digital Institute",
      bio: "Learning designer and AI curriculum lead.",
      emailVerifiedAt: new Date(),
    },
  });

  const student = await prisma.user.upsert({
    where: { email: "amina@student.eduflow.test" },
    update: {},
    create: {
      email: "amina@student.eduflow.test",
      name: "Amina Otieno",
      role: "STUDENT",
      bio: "Data analyst building a stronger portfolio through applied learning.",
      emailVerifiedAt: new Date(),
    },
  });

  const course = await prisma.course.upsert({
    where: { slug: "ai-powered-teaching" },
    update: {},
    create: {
      slug: "ai-powered-teaching",
      title: "AI-Powered Teaching Studio",
      description:
        "Plan adaptive lessons, design better assessments, and use generative AI tools responsibly.",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
      trailerUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      categoryId: category.id,
      lecturerId: lecturer.id,
      difficulty: "INTERMEDIATE",
      priceCents: 7900,
      status: "PUBLISHED",
      featured: true,
      tags: ["AI", "Assessment", "Instructional design"],
      prerequisites: ["Basic lesson planning"],
    },
  });

  const courseModule = await prisma.courseModule.upsert({
    where: { courseId_order: { courseId: course.id, order: 1 } },
    update: {},
    create: {
      courseId: course.id,
      title: "Responsible AI Foundations",
      order: 1,
    },
  });

  const lesson = await prisma.lesson.upsert({
    where: { moduleId_order: { moduleId: courseModule.id, order: 1 } },
    update: {},
    create: {
      moduleId: courseModule.id,
      title: "Where AI helps learning",
      content:
        "Map AI use cases to learner needs, classroom constraints, and human review points.",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      durationMinutes: 22,
      order: 1,
    },
  });

  await prisma.enrollment.upsert({
    where: { studentId_courseId: { studentId: student.id, courseId: course.id } },
    update: {},
    create: {
      studentId: student.id,
      courseId: course.id,
      paid: true,
      progressPercent: 67,
      streakDays: 9,
      gradePercent: 84,
    },
  });

  await prisma.lessonProgress.upsert({
    where: { studentId_lessonId: { studentId: student.id, lessonId: lesson.id } },
    update: { completed: true, watchedSeconds: 1200, lastPlaybackSecond: 1200 },
    create: {
      studentId: student.id,
      lessonId: lesson.id,
      completed: true,
      watchedSeconds: 1200,
      lastPlaybackSecond: 1200,
    },
  });
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
