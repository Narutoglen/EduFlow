import { NextResponse } from "next/server";
import { callAiService } from "@/lib/ai-client";
import { requireAiPrincipal, resolveLessonContent } from "@/lib/ai-session";

// BFF for summaries (contract §2). The browser sends only { lessonId }; the BFF resolves the
// principal + the lesson content it owns, then forwards the enriched request to ai-service.

export async function GET(request: Request) {
  const principal = await requireAiPrincipal();
  if (principal instanceof NextResponse) return principal;
  const url = new URL(request.url);
  const lessonId = url.searchParams.get("lessonId");
  const resourceId = url.searchParams.get("resourceId");
  if (!lessonId && !resourceId) {
    return badRequest("Provide lessonId or resourceId");
  }
  const qs = lessonId ? `lessonId=${encodeURIComponent(lessonId)}` : `resourceId=${encodeURIComponent(resourceId!)}`;
  const { status, data } = await callAiService<unknown>({
    method: "GET",
    path: `/api/v1/ai/summaries?${qs}`,
    principal,
  });
  return NextResponse.json(data, { status });
}

export async function POST(request: Request) {
  const principal = await requireAiPrincipal();
  if (principal instanceof NextResponse) return principal;
  const body = await request.json().catch(() => null);
  const lessonId: string | undefined = body?.lessonId;
  if (!lessonId) return badRequest("lessonId is required");

  const resolved = await resolveLessonContent(lessonId);
  if (!resolved) return notFound("Lesson not found");

  const { status, data } = await callAiService<unknown>({
    method: "POST",
    path: "/api/v1/ai/summaries",
    principal,
    body: {
      lessonId,
      courseId: resolved.courseId,
      title: resolved.title,
      content: resolved.content,
    },
  });
  return NextResponse.json(data, { status });
}

function badRequest(message: string) {
  return NextResponse.json({ error: { code: "BAD_REQUEST", message } }, { status: 400 });
}
function notFound(message: string) {
  return NextResponse.json({ error: { code: "NOT_FOUND", message } }, { status: 404 });
}
