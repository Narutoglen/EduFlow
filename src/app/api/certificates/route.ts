import { certificateAdapter } from "@/lib/adapters";
import { getCourseById, getUser } from "@/lib/eduflow";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const studentId = url.searchParams.get("studentId") ?? "";
  const courseId = url.searchParams.get("courseId") ?? "";
  const certificate = await certificateAdapter.createCertificate(studentId, courseId);
  const student = getUser(studentId);
  const course = getCourseById(courseId);

  if (!certificate.eligible) {
    return Response.json({ error: "Certificate not available" }, { status: 403 });
  }

  const body = [
    "EduFlow Certificate",
    `Student: ${student?.name}`,
    `Course: ${course?.title}`,
    "Verification: EDU-2026-DATA-9K2",
  ].join("\n");

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "content-disposition": "attachment; filename=eduflow-certificate.txt",
    },
  });
}
