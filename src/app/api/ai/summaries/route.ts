import { NextResponse } from "next/server";
import { callAiService } from "@/lib/ai-client";
import { requireAiPrincipal, resolveLessonContent } from "@/lib/ai-session";

// BFF for summaries (contract §2). The browser sends only { lessonId }; the BFF resolves the
// principal + the lesson content it owns, then forwards the enriched request to ai-service.

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lessonId = url.searchParams.get("lessonId");
  const resourceId = url.searchParams.get("resourceId");
  if (!lessonId && !resourceId) {
    return badRequest("Provide lessonId or resourceId");
  }
<<<<<<< HEAD
  const principal = await getCurrentPrincipal();
  if (!principal) return unauthorized();
=======
  const principal = await requireAiPrincipal();
  if (principal instanceof NextResponse) return principal;
>>>>>>> 1676408760a8ccb2072fe64933b6be5d1efca3e9
  const qs = lessonId ? `lessonId=${encodeURIComponent(lessonId)}` : `resourceId=${encodeURIComponent(resourceId!)}`;
  const { status, data } = await callAiService<unknown>({
    method: "GET",
    path: `/api/v1/ai/summaries?${qs}`,
    principal,
  });
  return NextResponse.json(data, { status });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const lessonId: string | undefined = body?.lessonId;
  if (!lessonId) return badRequest("lessonId is required");

  const resolved = await resolveLessonContent(lessonId);
  if (!resolved) return notFound("Lesson not found");

<<<<<<< HEAD
  const principal = await getCurrentPrincipal();
  if (!principal) return unauthorized();
=======
  const principal = await requireAiPrincipal();
  if (principal instanceof NextResponse) return principal;
>>>>>>> 1676408760a8ccb2072fe64933b6be5d1efca3e9
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
function unauthorized() {
  return NextResponse.json(
    { error: { code: "UNAUTHORIZED", message: "Sign in to use AI tools" } },
    { status: 401 },
  );
}
