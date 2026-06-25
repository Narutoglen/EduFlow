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
  const principal = await getCurrentPrincipal();
  if (!principal) return unauthorized();
  const { status, data } = await callAiService<unknown>({
    method: "GET",
    path: `/api/v1/ai/flashcards/due?lessonId=${encodeURIComponent(lessonId)}&limit=${encodeURIComponent(limit)}`,
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
