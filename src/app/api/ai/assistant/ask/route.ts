import { NextResponse } from "next/server";
import { callAiService } from "@/lib/ai-client";
import { getCourseLessonTitles, requireAiPrincipal } from "@/lib/ai-session";

// BFF: RAG question. Enriches with a lessonId->title map so citations carry titles. ai-service
// enforces course-scoped retrieval + conversation ownership.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const courseId: string | undefined = body?.courseId;
  const question: string | undefined = body?.question;
  if (!courseId || !question) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "courseId and question are required" } },
      { status: 400 },
    );
  }
<<<<<<< HEAD
  const principal = await getCurrentPrincipal();
  if (!principal) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Sign in to use AI tools" } },
      { status: 401 },
    );
  }
=======
  const principal = await requireAiPrincipal();
  if (principal instanceof NextResponse) return principal;
>>>>>>> 1676408760a8ccb2072fe64933b6be5d1efca3e9
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
