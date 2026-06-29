import { NextResponse } from "next/server";
import { callAiService } from "@/lib/ai-client";
import { requireAiPrincipal } from "@/lib/ai-session";

// BFF: list the caller's deck for a lesson (contract §3).
export async function GET(request: Request) {
  const principal = await requireAiPrincipal();
  if (principal instanceof NextResponse) return principal;
  const lessonId = new URL(request.url).searchParams.get("lessonId");
  if (!lessonId) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "lessonId required" } }, { status: 400 });
  }
  const { status, data } = await callAiService<unknown>({
    method: "GET",
    path: `/api/v1/ai/flashcards?lessonId=${encodeURIComponent(lessonId)}`,
    principal,
  });
  return NextResponse.json(data, { status });
}
