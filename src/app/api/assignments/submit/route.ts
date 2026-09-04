import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/api-auth";
import { recordAssignmentSubmission } from "@/lib/assessments";
import { storageAdapter } from "@/lib/adapters";
import { createUserNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  const auth = await requireApiRole(["STUDENT"]);
  if (auth instanceof NextResponse) return auth;
  const student = auth;

  const payload = isJson
    ? await request.json().catch(() => ({}))
    : Object.fromEntries((await request.formData()).entries());

  const assignmentId = String(payload.assignmentId ?? "").trim();
  const courseId = String(payload.courseId ?? "").trim();
  const lessonId = String(payload.lessonId ?? "").trim();
  const body = String(payload.body ?? "").trim();

  if (!assignmentId) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "assignmentId is required." } },
      { status: 400 },
    );
  }

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { course: true, lesson: true },
  });

  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  const result = await recordAssignmentSubmission({
    studentId: student.id,
    assignmentId,
    body,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const upload = await storageAdapter.createUploadUrl(`${assignmentId}.txt`);

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

  if (!isJson) {
    return NextResponse.redirect(
      new URL(`/learn/${courseId || assignment.courseId}/${lessonId || assignment.lessonId}?notice=assignment-submitted`, request.url),
      303,
    );
  }

  return NextResponse.json(
    {
      id: result.data.submissionId,
      assignmentId,
      studentId: student.id,
      status: result.data.status,
      upload,
      submittedText: body,
    },
    { status: 201 },
  );
}
