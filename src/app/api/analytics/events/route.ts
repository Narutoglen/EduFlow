import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/api-auth";
import { recordAnalyticsEvent } from "@/lib/analytics";
import { isDbUnavailable } from "@/lib/db-fallback";

const DB_OFFLINE = {
  error: { code: "SERVICE_UNAVAILABLE", message: "The database is offline. Try again once it is running." },
} as const;

export async function POST(request: Request) {
  const auth = await requireApiRole(["STUDENT", "LECTURER", "TA", "ADMIN"]);
  if (auth instanceof NextResponse) return auth;

  const contentType = request.headers.get("content-type") ?? "";
  const isForm = !contentType.includes("application/json");
  const payload = isForm
    ? Object.fromEntries((await request.formData()).entries())
    : await request.json().catch(() => ({}));

  const eventType = String(payload.eventType ?? "").trim();
  if (!eventType) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "eventType is required." } },
      { status: 400 },
    );
  }

  const body = {
    eventType,
    lessonId: typeof payload.lessonId === "string" ? payload.lessonId || undefined : undefined,
    quizId: typeof payload.quizId === "string" ? payload.quizId || undefined : undefined,
    courseId: typeof payload.courseId === "string" ? payload.courseId || undefined : undefined,
    metadata: typeof payload.metadata === "object" && payload.metadata != null ? payload.metadata : undefined,
  };

  try {
    await recordAnalyticsEvent({
      ...body,
      studentId: auth.role === "STUDENT" ? auth.id : (typeof payload.studentId === "string" ? payload.studentId || undefined : undefined),
    });
  } catch (error) {
    if (!isDbUnavailable(error)) throw error;
    if (isForm) {
      return NextResponse.redirect(new URL("/dashboard?flash=offline", request.url), 303);
    }
    return NextResponse.json(DB_OFFLINE, { status: 503 });
  }

  if (isForm) {
    return NextResponse.redirect(new URL("/dashboard?flash=analytics-saved", request.url), 303);
  }

  return NextResponse.json({ ok: true });
}
