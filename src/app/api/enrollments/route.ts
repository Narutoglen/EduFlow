import { NextResponse } from "next/server";
import { getCourseById } from "@/lib/eduflow";
import { userForRole } from "@/lib/mock-data";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await request.json()
    : Object.fromEntries((await request.formData()).entries());
  const courseId = String(payload.courseId ?? "course-data-literacy");
  const course = getCourseById(courseId);
  const student = userForRole("STUDENT");

  return NextResponse.json(
    {
      id: `enrollment-${courseId}`,
      courseId,
      studentId: student.id,
      status: course ? "ENROLLED" : "COURSE_NOT_FOUND",
      progressPercent: 0,
      paid: course ? course.priceCents === 0 : false,
    },
    { status: course ? 201 : 404 },
  );
}
