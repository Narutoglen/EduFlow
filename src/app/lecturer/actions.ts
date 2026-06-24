"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recomputeEnrollmentGrade } from "@/lib/assessments";
import { canGradeCourseId } from "@/lib/authz";
import { parseCreateCourse, slugify } from "@/lib/courses";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export async function createCourseAction(formData: FormData) {
  const lecturer = await requireRole(["LECTURER"]);

  const parsed = parseCreateCourse({
    title: formData.get("title"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    difficulty: formData.get("difficulty"),
    price: formData.get("price"),
  });

  if (!parsed.success) {
    redirect("/lecturer/courses/new?error=invalid");
  }

  const { title, description, categoryId, difficulty, priceCents } = parsed.data;

  // Defend against a tampered category id from the client.
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    redirect("/lecturer/courses/new?error=category");
  }

  // Derive a unique slug; append a short suffix only if the base collides.
  const base = slugify(title) || "course";
  let slug = base;
  if (await prisma.course.findUnique({ where: { slug } })) {
    slug = `${base}-${Math.random().toString(36).slice(2, 7)}`;
  }

  const course = await prisma.course.create({
    data: {
      slug,
      title,
      description,
      categoryId,
      difficulty,
      priceCents,
      status: "DRAFT",
      lecturerId: lecturer.id,
    },
  });

  revalidatePath("/lecturer");
  redirect(`/lecturer?created=${encodeURIComponent(course.slug)}`);
}

export async function createAnnouncementAction(formData: FormData) {
  const lecturer = await requireRole(["LECTURER"]);
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const courseIdRaw = String(formData.get("courseId") ?? "").trim();

  if (!title || !body) {
    redirect("/lecturer?announce=invalid");
  }

  // Optionally target one of the lecturer's own courses; empty = all learners.
  let courseId: string | null = null;
  if (courseIdRaw) {
    const owned = await prisma.course.findFirst({
      where: { id: courseIdRaw, lecturerId: lecturer.id },
      select: { id: true },
    });
    if (!owned) {
      redirect("/lecturer?announce=invalid");
    }
    courseId = owned.id;
  }

  await prisma.announcement.create({
    data: { authorId: lecturer.id, title, body, courseId },
  });

  revalidatePath("/lecturer");
  redirect("/lecturer?announce=posted");
}

export async function gradeSubmissionAction(formData: FormData) {
  const grader = await requireRole(["LECTURER", "TA", "ADMIN"]);

  const submissionId = String(formData.get("submissionId") ?? "");
  if (!submissionId) {
    redirect("/lecturer/grading?grade=invalid");
  }

  const submission = await prisma.assignmentSubmission.findUnique({
    where: { id: submissionId },
    select: {
      studentId: true,
      assignment: { select: { courseId: true, maxScore: true } },
    },
  });
  if (!submission) {
    redirect("/lecturer/grading?grade=missing");
  }

  // Object-level authorization: the grader must own or assist this submission's
  // course. This is what stops a tampered submissionId in the form from letting
  // a lecturer grade work in a course that isn't theirs.
  const allowed = await canGradeCourseId(grader, submission.assignment.courseId);
  if (!allowed) {
    redirect("/lecturer/grading?grade=forbidden");
  }

  // Clamp the score into the assignment's valid range; ignore anything else.
  const rawScore = Number(formData.get("score"));
  const maxScore = submission.assignment.maxScore;
  if (!Number.isFinite(rawScore) || rawScore < 0 || rawScore > maxScore) {
    redirect("/lecturer/grading?grade=range");
  }
  const score = Math.round(rawScore);
  const feedback = String(formData.get("feedback") ?? "").trim().slice(0, 2000) || null;

  await prisma.assignmentSubmission.update({
    where: { id: submissionId },
    data: { score, feedback, status: "GRADED", gradedAt: new Date() },
  });

  await recomputeEnrollmentGrade(submission.studentId, submission.assignment.courseId);

  revalidatePath("/lecturer/grading");
  redirect("/lecturer/grading?grade=saved");
}
