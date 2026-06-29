import { NextResponse } from "next/server";
import { forwardMultipart } from "@/lib/ai-client";
import { requireAiPrincipal } from "@/lib/ai-session";

// BFF: forward recorded audio to ai-service (multipart). ai-service validates type/size, stores to a
// shared volume, and enqueues transcription (audio purged after). No secrets reach the browser.
export async function POST(request: Request) {
  const principal = await requireAiPrincipal();
  if (principal instanceof NextResponse) return principal;
  const form = await request.formData();
  if (!form.get("audio") || !form.get("courseId")) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "audio and courseId are required" } },
      { status: 400 },
    );
  }
  const { status, data } = await forwardMultipart<unknown>(
    "/api/v1/ai/assistant/voice",
    form,
    principal,
  );
  return NextResponse.json(data, { status });
}
