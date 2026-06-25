import { NextResponse } from "next/server";
import { callAiService } from "@/lib/ai-client";
import { getCurrentPrincipal } from "@/lib/ai-session";

// BFF: list the caller's deck for a lesson (contract §3).
export async function GET(request: Request) {
  const lessonId = new URL(request.url).searchParams.get("lessonId");
  if (!lessonId) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "lessonId required" } }, { status: 400 });
  }
  const principal = await getCurrentPrincipal();
  if (!principal) return unauthorized();
  const { status, data } = await callAiService<unknown>({
    method: "GET",
    path: `/api/v1/ai/flashcards?lessonId=${encodeURIComponent(lessonId)}`,
    principal,
  });
  return NextResponse.json(data, { status });
}

function unauthorized() {
  return NextResponse.json(
    { error: { code: "UNAUTHORIZED", message: "Sign in to use AI tools" } },
    { status: 401 },
  );
}
