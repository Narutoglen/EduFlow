import { NextResponse } from "next/server";
import { notifyAssignmentDeadlines } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await request.json()
    : Object.fromEntries((await request.formData()).entries());
  const courseId = String(payload.courseId ?? "course-data-literacy");
  const student = await requireRole("STUDENT");
  const course = await prisma.course.findFirst({ where: { id: courseId, deletedAt: null } });
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  const existing = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: student.id, courseId } },
  });
  const enrollment = await prisma.enrollment.upsert({
    where: { studentId_courseId: { studentId: student.id, courseId } },
    update: {},
    create: {
      studentId: student.id,
      courseId,
      paid: course.priceCents === 0,
    },
  });
  if (!existing) {
    await notifyAssignmentDeadlines(student.id, courseId);
  }

  return NextResponse.json(
    {
      id: enrollment.id,
      courseId,
      studentId: student.id,
      status: "ENROLLED",
      progressPercent: enrollment.progressPercent,
      paid: enrollment.paid,
    },
    { status: 201 },
  );
}
