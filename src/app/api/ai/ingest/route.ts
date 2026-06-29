import { NextResponse } from "next/server";
import { callAiService } from "@/lib/ai-client";
import { getCourseLessons, requireAiPrincipal } from "@/lib/ai-session";

// BFF: ensure a course's lessons are embedded for RAG. Resolves lesson text (LMS-owned) and sends
// each lesson to ai-service ingest — no server-side URL fetch, so no SSRF surface here. Idempotent.
export async function POST(request: Request) {
  const principal = await requireAiPrincipal();
  if (principal instanceof NextResponse) return principal;
  const body = await request.json().catch(() => null);
  const courseId: string | undefined = body?.courseId;
  if (!courseId) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "courseId required" } }, { status: 400 });
  }
  const lessons = await getCourseLessons(courseId);
  if (lessons.length === 0) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Course not found" } }, { status: 404 });
  }
  const results = await Promise.all(
    lessons.map((l) =>
      callAiService<{ jobId?: string }>({
        method: "POST",
        path: "/api/v1/ai/ingest",
        principal,
        body: { courseId, lessonId: l.lessonId, title: l.title, content: l.content },
      }),
    ),
  );
  const accepted = results.filter((r) => r.status === 202 || r.status === 200).length;
  return NextResponse.json({ courseId, lessons: lessons.length, accepted });
}
