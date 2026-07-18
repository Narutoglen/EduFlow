import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const courseId = url.searchParams.get("courseId") ?? "course-data-literacy";
  await requireRole("STUDENT");
  const course = await prisma.course.findFirst({ where: { id: courseId, deletedAt: null } });

  return NextResponse.redirect(
    new URL(`/courses/${course?.slug ?? ""}?checkout=success`, request.url),
  );
}

export async function POST(request: Request) {
  // Guard body parsing so a malformed payload is a 400, not a 500.
  const payload = await request.json().catch(() => ({}));
  const student = await requireRole("STUDENT");
  const courseId = String((payload as Record<string, unknown>).courseId ?? "");
  if (!courseId) {
    return NextResponse.json({ error: "courseId is required" }, { status: 400 });
  }
  const course = await prisma.course.findFirst({
    where: { id: courseId, deletedAt: null },
  });
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  // Idempotency + atomicity: reuse an existing non-refunded Payment for this
  // (student, course) instead of creating a duplicate on retry, and create the
  // first one inside a transaction. Free courses are recorded as PAID; paid
  // courses start PENDING until a real PSP webhook confirms them (NEEDS HUMAN).
  const payment = await prisma.$transaction(async (tx) => {
    const existing = await tx.payment.findFirst({
      where: { courseId, studentId: student.id, status: { in: ["PENDING", "PAID"] } },
      orderBy: { createdAt: "desc" },
    });
    if (existing) return existing;
    return tx.payment.create({
      data: {
        courseId,
        studentId: student.id,
        provider: "checkout",
        amountCents: course.priceCents,
        status: course.priceCents === 0 ? "PAID" : "PENDING",
      },
    });
  });

  return NextResponse.json({
    provider: "checkout",
    paymentId: payment.id,
    status: payment.status,
    checkoutUrl: `/courses/${course.slug}?checkout=success`,
    amountCents: course.priceCents,
    customerEmail: student.email,
    mode: course.priceCents ? "payment" : "free-enrollment",
  });
}
