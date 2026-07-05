import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/api-auth";
import { recordAssignmentSubmission } from "@/lib/assessments";
import { isDbUnavailable } from "@/lib/db-fallback";

const DB_OFFLINE = {
  error: { code: "SERVICE_UNAVAILABLE", message: "The database is offline. Try again once it is running." },
} as const;

// Submit an assignment. The student is taken from the session and the write is
// gated by enrollment, so a tampered assignmentId cannot attach work to another
// course or another learner.
export async function POST(request: Request) {
  const auth = await requireApiRole(["STUDENT"]);
  if (auth instanceof NextResponse) return auth;

  const contentType = request.headers.get("content-type") ?? "";
  const isForm = !contentType.includes("application/json");
  const payload = isForm
    ? Object.fromEntries((await request.formData()).entries())
    : await request.json().catch(() => ({}));

  const assignmentId = String(payload.assignmentId ?? "");
  const body = String(payload.body ?? "");
  if (!assignmentId) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "assignmentId is required." } },
      { status: 400 },
    );
  }

  let result: Awaited<ReturnType<typeof recordAssignmentSubmission>>;
  try {
    result = await recordAssignmentSubmission({ studentId: auth.id, assignmentId, body });
  } catch (error) {
    if (!isDbUnavailable(error)) throw error;
    if (isForm) {
      return NextResponse.redirect(new URL("/achievements?flash=offline", request.url), 303);
    }
    return NextResponse.json(DB_OFFLINE, { status: 503 });
  }

  if (!result.ok) {
    if (isForm) {
      return NextResponse.redirect(new URL("/achievements?flash=assignment-error", request.url), 303);
    }
    return NextResponse.json({ error: { code: "FORBIDDEN", message: result.error } }, {
      status: result.status,
    });
  }

  if (isForm) {
    return NextResponse.redirect(new URL("/achievements?flash=assignment-submitted", request.url), 303);
  }

  return NextResponse.json(
    { id: result.data.submissionId, assignmentId, status: result.data.status },
    { status: 201 },
  );
}
