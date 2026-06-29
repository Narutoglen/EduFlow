import { NextResponse } from "next/server";
import { callAiService } from "@/lib/ai-client";
import { getCourseLessonTitles, requireAiPrincipal } from "@/lib/ai-session";

// BFF: RAG question. Enriches with a lessonId->title map so citations carry titles. ai-service
// enforces course-scoped retrieval + conversation ownership.
export async function POST(request: Request) {
  const principal = await requireAiPrincipal();
  if (principal instanceof NextResponse) return principal;
  const body = await request.json().catch(() => null);
  const courseId: string | undefined = body?.courseId;
  const question: string | undefined = body?.question;
  if (!courseId || !question) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "courseId and question are required" } },
      { status: 400 },
    );
  }
  const { status, data } = await callAiService<unknown>({
    method: "POST",
    path: "/api/v1/ai/assistant/ask",
    principal,
    body: {
      courseId,
      question,
      conversationId: body?.conversationId ?? null,
      sourceAudioId: body?.sourceAudioId ?? null,
      titles: await getCourseLessonTitles(courseId),
    },
  });
  return NextResponse.json(data, { status });
}
