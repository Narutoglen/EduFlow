import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/api-auth";
import { recordLessonProgress } from "@/lib/assessments";
import { prisma } from "@/lib/prisma";

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
  const isJson = contentType.includes("application/json");

  const auth = await requireApiRole(["STUDENT"]);
  if (auth instanceof NextResponse) return auth;
  const student = auth;

  const payload = isJson
    ? await request.json().catch(() => ({}))
    : Object.fromEntries((await request.formData()).entries());

  const courseId = String(payload.courseId ?? "").trim();
  const lessonId = String(payload.lessonId ?? "").trim();
  const returnTo = String(
    payload.returnTo ?? `/learn/${courseId}/${lessonId}?notice=progress-saved`,
  );

  if (!lessonId) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "lessonId is required." } },
      { status: 400 },
    );
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { select: { courseId: true } } },
  });

  if (!lesson || (courseId && lesson.module.courseId !== courseId)) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  const result = await recordLessonProgress({
    studentId: student.id,
    lessonId,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  if (!isJson) {
    return NextResponse.redirect(new URL(returnTo, request.url), 303);
  }

  return NextResponse.json({
    courseId: lesson.module.courseId,
    lessonId,
    courseFound: true,
    lessonFound: true,
    progressSynced: true,
    progressPercent: result.data.progressPercent,
    resumeFromSeconds: 0,
  });
}
