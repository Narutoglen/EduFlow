import { NextResponse } from "next/server";
import { courses, userForRole } from "@/lib/mock-data";
import { storageAdapter } from "@/lib/adapters";

export async function POST(request: Request) {
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

  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

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
    { status: 201 },
  );
}
