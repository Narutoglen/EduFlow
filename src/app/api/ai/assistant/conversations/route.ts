import { NextResponse } from "next/server";
import { callAiService } from "@/lib/ai-client";
import { getCurrentPrincipal } from "@/lib/ai-session";

// BFF: list the caller's conversations for a course (contract §4).
export async function GET(request: Request) {
  const courseId = new URL(request.url).searchParams.get("courseId");
  if (!courseId) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "courseId required" } }, { status: 400 });
  }
  const { status, data } = await callAiService<unknown>({
    method: "GET",
    path: `/api/v1/ai/assistant/conversations?courseId=${encodeURIComponent(courseId)}`,
    principal: getCurrentPrincipal(),
  });
  return NextResponse.json(data, { status });
}
