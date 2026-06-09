import { NextResponse } from "next/server";
import { callAiService } from "@/lib/ai-client";
import { getCurrentPrincipal } from "@/lib/ai-session";

// BFF: due cards for a study session (contract §3).
export async function GET(request: Request) {
  const url = new URL(request.url);
  const lessonId = url.searchParams.get("lessonId");
  const limit = url.searchParams.get("limit") ?? "20";
  if (!lessonId) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "lessonId required" } }, { status: 400 });
  }
  const { status, data } = await callAiService<unknown>({
    method: "GET",
    path: `/api/v1/ai/flashcards/due?lessonId=${encodeURIComponent(lessonId)}&limit=${encodeURIComponent(limit)}`,
    principal: getCurrentPrincipal(),
  });
  return NextResponse.json(data, { status });
}
