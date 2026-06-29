import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/api-auth";
import { notifyAssignmentDeadlines } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

// Enroll the SIGNED-IN student in a published course. The studentId is taken from
// the session, never the request, so a caller cannot enroll someone else. Free
// courses enroll immediately; paid courses are marked unpaid until checkout.
export async function POST(request: Request) {
  const auth = await requireApiRole(["STUDENT"]);
  if (auth instanceof NextResponse) return auth;

  const contentType = request.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await request.json().catch(() => ({}))
    : Object.fromEntries((await request.formData()).entries());
  const courseId = String(payload.courseId ?? "course-data-literacy");
  const course = await prisma.course.findFirst({ where: { id: courseId, deletedAt: null } });
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  const existing = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: auth.id, courseId } },
  });
  const enrollment = await prisma.enrollment.upsert({
    where: { studentId_courseId: { studentId: auth.id, courseId } },
    update: {},
    create: {
      studentId: auth.id,
      courseId,
      paid: course.priceCents === 0,
    },
  });
  if (!existing) {
    await notifyAssignmentDeadlines(auth.id, courseId);
  }

  return NextResponse.json(
    {
      id: enrollment.id,
      courseId,
      studentId: auth.id,
      status: "ENROLLED",
      progressPercent: enrollment.progressPercent,
      paid: enrollment.paid,
    },
    { status: 201 },
  );
}
