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
  const payload = await request.json();
  const student = await requireRole("STUDENT");
  const course = await prisma.course.findFirst({
    where: { id: String(payload.courseId ?? ""), deletedAt: null },
  });

  return NextResponse.json({
    provider: "checkout",
    checkoutUrl: `/courses/${course?.slug ?? ""}?checkout=success`,
    amountCents: course?.priceCents ?? 0,
    customerEmail: student.email,
    mode: course?.priceCents ? "payment" : "free-enrollment",
  });
}
