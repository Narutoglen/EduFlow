import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/api-auth";
import { recordLessonProgress } from "@/lib/assessments";

// Personal notes export — requires a signed-in student (it is their own data).
export async function GET(request: Request) {
<<<<<<< HEAD
  const auth = await requireApiRole(["STUDENT"]);
  if (auth instanceof NextResponse) return auth;

  if (new URL(request.url).searchParams.get("export") === "notes") {
=======
  const url = new URL(request.url);
  if (url.searchParams.get("export") === "notes") {
>>>>>>> 1c01f0308f5fafe3f3ca847d57554f19db9da16a
    return new Response("EduFlow lesson notes\n", {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "content-disposition": "attachment; filename=eduflow-notes.txt",
      },
    });
  }
  return NextResponse.json({ status: "progress-service-ready" });
}

// Mark a lesson complete. The student comes from the session; progress is only
// recorded when they are enrolled in the lesson's course.
export async function POST(request: Request) {
<<<<<<< HEAD
  const auth = await requireApiRole(["STUDENT"]);
  if (auth instanceof NextResponse) return auth;
=======
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
>>>>>>> 1c01f0308f5fafe3f3ca847d57554f19db9da16a

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
