import { NextResponse } from "next/server";
<<<<<<< HEAD
import { notifyAssignmentDeadlines } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
=======
import { requireApiRole } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
>>>>>>> 1676408760a8ccb2072fe64933b6be5d1efca3e9

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
<<<<<<< HEAD
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
=======

  const courseId = String(payload.courseId ?? "");
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, status: true, priceCents: true },
  });

  if (!course || course.status !== "PUBLISHED") {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Course not available for enrollment." } },
      { status: 404 },
    );
  }

  const enrollment = await prisma.enrollment.upsert({
    where: { studentId_courseId: { studentId: auth.id, courseId: course.id } },
    update: {},
    create: {
      studentId: auth.id,
      courseId: course.id,
      paid: course.priceCents === 0,
    },
    select: { id: true, paid: true, progressPercent: true },
  });
>>>>>>> 1676408760a8ccb2072fe64933b6be5d1efca3e9

  return NextResponse.json(
    {
      id: enrollment.id,
<<<<<<< HEAD
      courseId,
      studentId: student.id,
      status: "ENROLLED",
      progressPercent: enrollment.progressPercent,
      paid: enrollment.paid,
=======
      courseId: course.id,
      status: "ENROLLED",
      paid: enrollment.paid,
      progressPercent: enrollment.progressPercent,
>>>>>>> 1676408760a8ccb2072fe64933b6be5d1efca3e9
    },
    { status: 201 },
  );
}
