import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const courseId = url.searchParams.get("courseId") ?? "";
  const user = await getCurrentUser();

  if (!user) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("next", `/courses?checkout=${encodeURIComponent(courseId)}`);
    return NextResponse.redirect(loginUrl, 303);
  }

  if (user.role !== "STUDENT") {
    return NextResponse.redirect(new URL("/courses?notice=student-required", request.url), 303);
  }

  const course = await prisma.course.findFirst({
    where: { id: courseId, deletedAt: null },
  });

  if (!course) {
    return NextResponse.redirect(new URL("/courses?error=not-found", request.url), 303);
  }

  // Auto-enroll if free, or mark enrollment as paid
  await prisma.enrollment.upsert({
    where: { studentId_courseId: { studentId: user.id, courseId: course.id } },
    update: { paid: true },
    create: {
      studentId: user.id,
      courseId: course.id,
      paid: true,
    },
  });

  return NextResponse.redirect(
    new URL(`/courses/${course.slug}?checkout=success`, request.url),
    303,
  );
}

export async function POST(request: Request) {
  const auth = await requireApiRole(["STUDENT"]);
  if (auth instanceof NextResponse) return auth;
  const student = auth;

  const payload = await request.json().catch(() => ({}));
  const courseId = String(payload.courseId ?? "").trim();

  if (!courseId) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "courseId is required." } },
      { status: 400 },
    );
  }

  const course = await prisma.course.findFirst({
    where: { id: courseId, deletedAt: null },
  });

  if (!course) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Course not found." } },
      { status: 404 },
    );
  }

  const isFree = course.priceCents === 0;

  // Record payment entry in database for audit trail
  const payment = await prisma.payment.create({
    data: {
      courseId: course.id,
      studentId: student.id,
      provider: isFree ? "free-tier" : "stripe-mock",
      amountCents: course.priceCents,
      status: "PAID",
    },
  });

  // Ensure enrollment is activated
  await prisma.enrollment.upsert({
    where: { studentId_courseId: { studentId: student.id, courseId: course.id } },
    update: { paid: true },
    create: {
      studentId: student.id,
      courseId: course.id,
      paid: true,
    },
  });

  return NextResponse.json({
    provider: isFree ? "free-tier" : "stripe-mock",
    paymentId: payment.id,
    checkoutUrl: `/courses/${course.slug}?checkout=success`,
    amountCents: course.priceCents,
    customerEmail: student.email,
    mode: isFree ? "free-enrollment" : "payment",
    status: "PAID",
  });
}
