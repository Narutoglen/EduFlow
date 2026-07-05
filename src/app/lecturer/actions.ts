"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recomputeEnrollmentGrade } from "@/lib/assessments";
import { canGradeCourseId } from "@/lib/authz";
import { parseCreateCourse, slugify } from "@/lib/courses";
import { isDbUnavailable } from "@/lib/db-fallback";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

// These actions write to Postgres. When it is offline (the zero-setup demo),
// they redirect to a clear "offline" notice instead of throwing a 500. redirect()
// is kept out of the try blocks so its NEXT_REDIRECT signal is never swallowed;
// only genuine DB-unavailable errors are caught (real query bugs still surface).

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

  let dbDown = false;
  let badCategory = false;
  let createdSlug = "";
  try {
    // Defend against a tampered category id from the client.
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      badCategory = true;
    } else {
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
      createdSlug = course.slug;
    }
  } catch (error) {
    if (!isDbUnavailable(error)) throw error;
    dbDown = true;
  }

  if (dbDown) redirect("/lecturer/courses/new?error=offline");
  if (badCategory) redirect("/lecturer/courses/new?error=category");

  revalidatePath("/lecturer");
  redirect(`/lecturer?created=${encodeURIComponent(createdSlug)}`);
}

export async function createAnnouncementAction(formData: FormData) {
  const lecturer = await requireRole(["LECTURER"]);
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const courseIdRaw = String(formData.get("courseId") ?? "").trim();

  if (!title || !body) {
    redirect("/lecturer?announce=invalid");
  }

  let dbDown = false;
  let invalidCourse = false;
  try {
    // Optionally target one of the lecturer's own courses; empty = all learners.
    let courseId: string | null = null;
    if (courseIdRaw) {
      const owned = await prisma.course.findFirst({
        where: { id: courseIdRaw, lecturerId: lecturer.id },
        select: { id: true },
      });
      if (!owned) {
        invalidCourse = true;
      } else {
        courseId = owned.id;
      }
    }
    if (!invalidCourse) {
      await prisma.announcement.create({
        data: { authorId: lecturer.id, title, body, courseId },
      });
    }
  } catch (error) {
    if (!isDbUnavailable(error)) throw error;
    dbDown = true;
  }

  if (dbDown) redirect("/lecturer?announce=offline");
  if (invalidCourse) redirect("/lecturer?announce=invalid");

  revalidatePath("/lecturer");
  redirect("/lecturer?announce=posted");
}

export async function gradeSubmissionAction(formData: FormData) {
  const grader = await requireRole(["LECTURER", "TA", "ADMIN"]);

  const submissionId = String(formData.get("submissionId") ?? "");
  if (!submissionId) {
    redirect("/lecturer/grading?grade=invalid");
  }

  let dbDown = false;
  let notFound = false;
  let forbidden = false;
  let outOfRange = false;
  try {
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      select: {
        studentId: true,
        assignment: { select: { courseId: true, maxScore: true } },
      },
    });
    if (!submission) {
      notFound = true;
    } else if (!(await canGradeCourseId(grader, submission.assignment.courseId))) {
      // Object-level authorization: the grader must own or assist this
      // submission's course. This stops a tampered submissionId from letting a
      // lecturer grade work in a course that isn't theirs.
      forbidden = true;
    } else {
      // Clamp the score into the assignment's valid range; ignore anything else.
      const rawScore = Number(formData.get("score"));
      const maxScore = submission.assignment.maxScore;
      if (!Number.isFinite(rawScore) || rawScore < 0 || rawScore > maxScore) {
        outOfRange = true;
      } else {
        const score = Math.round(rawScore);
        const feedback =
          String(formData.get("feedback") ?? "").trim().slice(0, 2000) || null;
        await prisma.assignmentSubmission.update({
          where: { id: submissionId },
          data: { score, feedback, status: "GRADED", gradedAt: new Date() },
        });
        await recomputeEnrollmentGrade(
          submission.studentId,
          submission.assignment.courseId,
        );
      }
    }
  } catch (error) {
    if (!isDbUnavailable(error)) throw error;
    dbDown = true;
  }

  if (dbDown) redirect("/lecturer/grading?grade=offline");
  if (notFound) redirect("/lecturer/grading?grade=missing");
  if (forbidden) redirect("/lecturer/grading?grade=forbidden");
  if (outOfRange) redirect("/lecturer/grading?grade=range");

  revalidatePath("/lecturer/grading");
  redirect("/lecturer/grading?grade=saved");
}
