import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/api-auth";
import { recordLessonProgress } from "@/lib/assessments";

// Personal notes export — requires a signed-in student (it is their own data).
export async function GET(request: Request) {
  const auth = await requireApiRole(["STUDENT"]);
  if (auth instanceof NextResponse) return auth;

  if (new URL(request.url).searchParams.get("export") === "notes") {
    return new Response("EduFlow lesson notes\n", {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": "attachment; filename=eduflow-notes.pdf",
      },
    });
  }
  return NextResponse.json({ status: "progress-service-ready" });
}

// Mark a lesson complete. The student comes from the session; progress is only
// recorded when they are enrolled in the lesson's course.
export async function POST(request: Request) {
  const auth = await requireApiRole(["STUDENT"]);
  if (auth instanceof NextResponse) return auth;

  const contentType = request.headers.get("content-type") ?? "";
  const isForm = !contentType.includes("application/json");
  const payload = isForm
    ? Object.fromEntries((await request.formData()).entries())
    : await request.json().catch(() => ({}));

  const lessonId = String(payload.lessonId ?? "");
  const courseId = String(payload.courseId ?? "");
  if (!lessonId) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "lessonId is required." } },
      { status: 400 },
    );
  }

  const result = await recordLessonProgress({ studentId: auth.id, lessonId });

  if (!result.ok) {
    if (isForm) {
      return NextResponse.redirect(new URL("/dashboard?flash=progress-error", request.url), 303);
    }
    return NextResponse.json({ error: { code: "FORBIDDEN", message: result.error } }, {
      status: result.status,
    });
  }

  if (isForm) {
    const back = courseId
      ? new URL(`/learn/${courseId}/${lessonId}`, request.url)
      : new URL("/dashboard", request.url);
    return NextResponse.redirect(back, 303);
  }

  return NextResponse.json({ lessonId, progressPercent: result.data.progressPercent });
}
