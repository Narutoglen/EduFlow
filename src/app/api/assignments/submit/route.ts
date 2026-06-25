import { NextResponse } from "next/server";
<<<<<<< HEAD
import { storageAdapter } from "@/lib/adapters";
import { createUserNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
=======
import { requireApiRole } from "@/lib/api-auth";
import { recordAssignmentSubmission } from "@/lib/assessments";
>>>>>>> 1676408760a8ccb2072fe64933b6be5d1efca3e9

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
<<<<<<< HEAD
  const student = await requireRole("STUDENT");
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { course: true, lesson: true },
  });
=======
  const assignment = courses
    .flatMap((course) => course.assignments)
    .find((item) => item.id === assignmentId);
>>>>>>> 1c01f0308f5fafe3f3ca847d57554f19db9da16a
>>>>>>> 1676408760a8ccb2072fe64933b6be5d1efca3e9

  const contentType = request.headers.get("content-type") ?? "";
  const isForm = !contentType.includes("application/json");
  const payload = isForm
    ? Object.fromEntries((await request.formData()).entries())
    : await request.json().catch(() => ({}));

  const assignmentId = String(payload.assignmentId ?? "");
  const body = String(payload.body ?? "");
  if (!assignmentId) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "assignmentId is required." } },
      { status: 400 },
    );
  }

  const result = await recordAssignmentSubmission({ studentId: auth.id, assignmentId, body });

  if (!result.ok) {
    if (isForm) {
      return NextResponse.redirect(new URL("/achievements?flash=assignment-error", request.url), 303);
    }
    return NextResponse.json({ error: { code: "FORBIDDEN", message: result.error } }, {
      status: result.status,
    });
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
