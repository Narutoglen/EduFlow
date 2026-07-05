import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/api-auth";
import { isDbUnavailable } from "@/lib/db-fallback";
import { prisma } from "@/lib/prisma";

const DB_OFFLINE = {
  error: { code: "SERVICE_UNAVAILABLE", message: "The database is offline. Try again once it is running." },
} as const;

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

  const courseId = String(payload.courseId ?? "");
  try {
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

    return NextResponse.json(
      {
        id: enrollment.id,
        courseId: course.id,
        status: "ENROLLED",
        paid: enrollment.paid,
        progressPercent: enrollment.progressPercent,
      },
      { status: 201 },
    );
  } catch (error) {
    if (!isDbUnavailable(error)) throw error;
    return NextResponse.json(DB_OFFLINE, { status: 503 });
  }
}
