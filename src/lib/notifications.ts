import "server-only";

import { emailAdapter } from "./adapters";
import { prisma } from "./prisma";

type NotificationInput = {
  userId: string;
  title: string;
  body: string;
  kind: string;
  emailSubject?: string;
  emailBody?: string;
};

export async function createUserNotification({
  userId,
  title,
  body,
  kind,
  emailSubject,
  emailBody,
}: NotificationInput) {
  const [notification, user] = await Promise.all([
    prisma.notification.create({
      data: { userId, title, body, kind },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, emailNotifications: true },
    }),
  ]);

  if (user?.email && user.emailNotifications) {
    try {
      await emailAdapter.sendTransactionalEmail(
        user.email,
        emailSubject ?? title,
        emailBody ?? body,
      );
    } catch (error) {
      console.error("[EduFlow email failed]", error);
    }
  }

  return notification;
}

export async function notifyAssignmentDeadlines(userId: string, courseId: string) {
  const assignments = await prisma.assignment.findMany({
    where: { courseId },
    include: { course: true, lesson: true },
    orderBy: { deadline: "asc" },
  });

  await Promise.all(
    assignments.map((assignment) =>
      createUserNotification({
        userId,
        title: `Assignment due: ${assignment.title}`,
        body: `${assignment.course.title} has an assignment due on ${assignment.deadline.toLocaleDateString("en-KE")}.`,
        kind: "deadline",
        emailSubject: `EduFlow assignment due: ${assignment.title}`,
        emailBody: [
          `Course: ${assignment.course.title}`,
          `Lesson: ${assignment.lesson.title}`,
          `Due date: ${assignment.deadline.toLocaleDateString("en-KE")}`,
          "",
          "Sign in to EduFlow to review the assignment brief and submit your work.",
        ].join("\n"),
      }),
    ),
  );
}
