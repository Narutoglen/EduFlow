import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { canGradeCourseId } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

// Certificate PDF download. Identity comes from the session; the client supplies
// only a verificationId. A learner may download their own certificate; teaching
// staff may download certificates for courses they own/assist. Any other request
// is refused — there is no studentId parameter to tamper with (fixes the prior
// IDOR where `?studentId=` let anyone download anyone's certificate).
export async function GET(request: Request) {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;
  const user = auth;

  const url = new URL(request.url);
  const verificationId = url.searchParams.get("verificationId") ?? "";
  if (!verificationId) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "verificationId is required." } },
      { status: 400 },
    );
  }

  const certificate = await prisma.certificate.findUnique({
    where: { verificationId },
    select: {
      issuedAt: true,
      studentId: true,
      courseId: true,
      student: { select: { name: true } },
      course: { select: { title: true } },
    },
  });
  if (!certificate) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Certificate not found." } },
      { status: 404 },
    );
  }

  const owns = certificate.studentId === user.id;
  const isStaff = owns ? false : await canGradeCourseId(user, certificate.courseId);
  if (!owns && !isStaff) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "You cannot download this certificate." } },
      { status: 403 },
    );
  }

  const body = [
    "EduFlow Certificate of Completion",
    `Student: ${certificate.student.name}`,
    `Course: ${certificate.course.title}`,
    `Issued: ${certificate.issuedAt.toISOString().slice(0, 10)}`,
    `Verification: ${verificationId}`,
  ].join("\n");

  return new Response(body, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": "attachment; filename=eduflow-certificate.pdf",
    },
  });
}
