import { NextResponse } from "next/server";
import { getCourseById, getLesson } from "@/lib/eduflow";

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
    ? await request.json()
    : Object.fromEntries((await request.formData()).entries());
  const courseId = String(payload.courseId ?? "");
  const lessonId = String(payload.lessonId ?? "");
  const returnTo = String(
    payload.returnTo ?? `/learn/${courseId}/${lessonId}?notice=progress-saved`,
  );

  if (!contentType.includes("application/json")) {
    return NextResponse.redirect(new URL(returnTo, request.url), 303);
  }

  return NextResponse.json({
    courseId,
    lessonId,
    courseFound: Boolean(getCourseById(courseId)),
    lessonFound: Boolean(getLesson(courseId, lessonId)),
    progressSynced: true,
    resumeFromSeconds: 0,
  });
}
