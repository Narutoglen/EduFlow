import { NextResponse } from "next/server";
import { getCourseById, getLesson } from "@/lib/eduflow";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("export") === "notes") {
    return new Response("EduFlow lesson notes PDF mock\n", {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": "attachment; filename=eduflow-notes.pdf",
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

  return NextResponse.json({
    courseId,
    lessonId,
    courseFound: Boolean(getCourseById(courseId)),
    lessonFound: Boolean(getLesson(courseId, lessonId)),
    progressSynced: true,
    resumeFromSeconds: 0,
  });
}
