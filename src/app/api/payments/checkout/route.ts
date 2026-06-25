import { NextResponse } from "next/server";
<<<<<<< HEAD
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
=======
import { requireApiRole } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// Create a (mock) checkout session for the SIGNED-IN student. The studentId is
// taken from the session — never from the query string or body — so a caller
// cannot start a checkout on someone else's behalf. The course must exist.
async function checkoutForCourse(courseId: string, studentEmail: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { slug: true, priceCents: true },
  });
  if (!course) return null;
  return {
    provider: "mock-stripe",
    checkoutUrl: `/courses/${course.slug}?checkout=mock-success`,
    amountCents: course.priceCents,
    customerEmail: studentEmail,
    mode: course.priceCents > 0 ? "payment" : "free-enrollment",
  };
}

export async function GET(request: Request) {
  const auth = await requireApiRole(["STUDENT"]);
  if (auth instanceof NextResponse) return auth;

<<<<<<< HEAD
  const courseId = new URL(request.url).searchParams.get("courseId") ?? "";
  const checkout = await checkoutForCourse(courseId, auth.email);
  if (!checkout) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Course not found." } },
      { status: 404 },
    );
  }
  return NextResponse.json(checkout);
=======
  return NextResponse.redirect(new URL(checkout.checkoutUrl, request.url));
>>>>>>> 1c01f0308f5fafe3f3ca847d57554f19db9da16a
}

export async function POST(request: Request) {
  const auth = await requireApiRole(["STUDENT"]);
  if (auth instanceof NextResponse) return auth;

  const payload = await request.json().catch(() => ({}));
  const courseId = String(payload?.courseId ?? "");
  const checkout = await checkoutForCourse(courseId, auth.email);
  if (!checkout) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Course not found." } },
      { status: 404 },
    );
  }
  return NextResponse.json(checkout);
>>>>>>> 1676408760a8ccb2072fe64933b6be5d1efca3e9
}
