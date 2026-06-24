import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/api-auth";
import { recordAssignmentSubmission } from "@/lib/assessments";

// Submit an assignment. The student is taken from the session and the write is
// gated by enrollment, so a tampered assignmentId cannot attach work to another
// course or another learner.
export async function POST(request: Request) {
<<<<<<< HEAD
  const auth = await requireApiRole(["STUDENT"]);
  if (auth instanceof NextResponse) return auth;
=======
  const contentType = request.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await request.json()
    : Object.fromEntries((await request.formData()).entries());
  const assignmentId = String(payload.assignmentId ?? "");
  const courseId = String(payload.courseId ?? "");
  const lessonId = String(payload.lessonId ?? "");
  const assignment = courses
    .flatMap((course) => course.assignments)
    .find((item) => item.id === assignmentId);
>>>>>>> 1c01f0308f5fafe3f3ca847d57554f19db9da16a

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

  const result = await recordAssignmentSubmission({ studentId: auth.id, assignmentId, body });

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

<<<<<<< HEAD
  return NextResponse.json(
    { id: result.data.submissionId, assignmentId, status: result.data.status },
=======
  const upload = await storageAdapter.createUploadUrl(`${assignmentId}.txt`);
  if (!contentType.includes("application/json")) {
    return NextResponse.redirect(
      new URL(`/learn/${courseId}/${lessonId}?notice=assignment-submitted`, request.url),
      303,
    );
  }

  return NextResponse.json(
    {
      id: `submission-${assignmentId}`,
      assignmentId,
      studentId: userForRole("STUDENT").id,
      status: "SUBMITTED",
      upload,
      submittedText: String(payload.body ?? ""),
    },
>>>>>>> 1c01f0308f5fafe3f3ca847d57554f19db9da16a
    { status: 201 },
  );
}
