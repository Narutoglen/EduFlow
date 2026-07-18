import { NextResponse } from "next/server";
import { isEnrolled } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("export") === "notes") {
    return new Response("EduFlow lesson notes\n", {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "content-disposition": "attachment; filename=eduflow-notes.txt",
      },
    });
  }

  return NextResponse.json({ status: "progress-service-ready" });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await request.json().catch(() => ({}))
    : Object.fromEntries((await request.formData()).entries());
  const courseId = String(payload.courseId ?? "");
  const lessonId = String(payload.lessonId ?? "");
  const returnTo = String(
    payload.returnTo ?? `/learn/${courseId}/${lessonId}?notice=progress-saved`,
  );
  const student = await requireRole("STUDENT");
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { include: { course: { include: { modules: { include: { lessons: true } } } } } } },
  });
  if (!lesson || lesson.module.courseId !== courseId || lesson.module.course.deletedAt) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  // Authz + payment-bypass guard: only an enrolled student may record progress.
  // Previously the enrollment was UPSERTed here, which let any signed-in student
  // self-enroll in any course (including paid ones) just by POSTing progress.
  // We now require a pre-existing enrollment and never create one from this path.
  if (!(await isEnrolled(student.id, courseId))) {
    return NextResponse.json(
      { error: "You are not enrolled in this course." },
      { status: 403 },
    );
  }

  await prisma.lessonProgress.upsert({
    where: { studentId_lessonId: { studentId: student.id, lessonId } },
    update: { completed: true, watchedSeconds: 0, lastPlaybackSecond: 0 },
    create: { studentId: student.id, lessonId, completed: true },
  });
  const lessons = lesson.module.course.modules.flatMap((module) => module.lessons);
  const completed = await prisma.lessonProgress.count({
    where: {
      studentId: student.id,
      completed: true,
      lessonId: { in: lessons.map((item) => item.id) },
    },
  });
  await prisma.enrollment.update({
    where: { studentId_courseId: { studentId: student.id, courseId } },
    data: {
      progressPercent: lessons.length ? Math.round((completed / lessons.length) * 100) : 0,
    },
  });

  if (!contentType.includes("application/json")) {
    return NextResponse.redirect(new URL(returnTo, request.url), 303);
  }

  return NextResponse.json({
    courseId,
    lessonId,
    courseFound: true,
    lessonFound: true,
    progressSynced: true,
    resumeFromSeconds: 0,
  });
}
