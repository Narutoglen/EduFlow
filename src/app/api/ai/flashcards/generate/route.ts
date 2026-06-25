import { NextResponse } from "next/server";
import { callAiService } from "@/lib/ai-client";
import { requireAiPrincipal, resolveLessonContent } from "@/lib/ai-session";

// BFF: generate a flashcard deck (contract §3). Browser sends { lessonId, count }; BFF enriches
// with the lesson content it owns before forwarding to ai-service.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const lessonId: string | undefined = body?.lessonId;
  const count = Number(body?.count ?? 10);
  if (!lessonId) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "lessonId required" } }, { status: 400 });
  }
  const resolved = await resolveLessonContent(lessonId);
  if (!resolved) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Lesson not found" } }, { status: 404 });
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
    path: "/api/v1/ai/flashcards/generate",
    principal,
    body: {
      lessonId,
      courseId: resolved.courseId,
      title: `${resolved.title} — Flashcards`,
      content: resolved.content,
      count: Number.isFinite(count) ? count : 10,
    },
  });
  return NextResponse.json(data, { status });
}
