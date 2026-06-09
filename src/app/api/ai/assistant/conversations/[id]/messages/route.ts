import { NextResponse } from "next/server";
import { callAiService } from "@/lib/ai-client";
import { getCurrentPrincipal } from "@/lib/ai-session";

// BFF: messages in a conversation (contract §4). ai-service enforces ownership.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { status, data } = await callAiService<unknown>({
    method: "GET",
    path: `/api/v1/ai/assistant/conversations/${encodeURIComponent(id)}/messages`,
    principal: getCurrentPrincipal(),
  });
  return NextResponse.json(data, { status });
}
