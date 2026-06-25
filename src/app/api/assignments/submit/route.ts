import { NextResponse } from "next/server";
import { storageAdapter } from "@/lib/adapters";
import { createUserNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

// Submit an assignment. The student is taken from the session and the write is
// gated by enrollment, so a tampered assignmentId cannot attach work to another
// course or another learner.
export async function POST(request: Request) {
<<<<<<< HEAD
  const auth = await requireApiRole(["STUDENT"]);
  if (auth instanceof NextResponse) return auth;
=======
  const contentType = request.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await request.json()
    : Object.fromEntries((await request.formData()).entries());
  const assignmentId = String(payload.assignmentId ?? "");
  const courseId = String(payload.courseId ?? "");
  const lessonId = String(payload.lessonId ?? "");
  const student = await requireRole("STUDENT");
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { course: true, lesson: true },
  });

  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  if (isForm) {
    return NextResponse.redirect(new URL("/achievements?flash=assignment-submitted", request.url), 303);
  }

<<<<<<< HEAD
  return NextResponse.json(
    { id: result.data.submissionId, assignmentId, status: result.data.status },
=======
  const upload = await storageAdapter.createUploadUrl(`${assignmentId}.txt`);
  const submission = await prisma.assignmentSubmission.create({
    data: {
      assignmentId,
      studentId: student.id,
      body: String(payload.body ?? ""),
      fileUrl: upload.publicUrl,
    },
  });
  await createUserNotification({
    userId: student.id,
    title: "Assignment submitted",
    body: `${assignment.title} was submitted for ${assignment.course.title}. Due date: ${assignment.deadline.toLocaleDateString("en-KE")}.`,
    kind: "assignment-submitted",
    emailSubject: `EduFlow assignment submitted: ${assignment.title}`,
    emailBody: [
      `Hi ${student.name},`,
      "",
      `Your assignment "${assignment.title}" for ${assignment.course.title} has been submitted.`,
      `Due date: ${assignment.deadline.toLocaleDateString("en-KE")}`,
      "You will receive another notification when feedback is available.",
    ].join("\n"),
  });

  if (!contentType.includes("application/json")) {
    return NextResponse.redirect(
      new URL(`/learn/${courseId}/${lessonId}?notice=assignment-submitted`, request.url),
      303,
    );
  }

  return NextResponse.json(
    {
      id: submission.id,
      assignmentId,
      studentId: student.id,
      status: "SUBMITTED",
      upload,
      submittedText: String(payload.body ?? ""),
    },
>>>>>>> 1c01f0308f5fafe3f3ca847d57554f19db9da16a
    { status: 201 },
  );
}
