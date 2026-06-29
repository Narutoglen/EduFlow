import { NextResponse } from "next/server";
import { callAiService } from "@/lib/ai-client";
import { requireAiPrincipal } from "@/lib/ai-session";

// BFF: messages in a conversation (contract §4). ai-service enforces ownership.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const principal = await requireAiPrincipal();
  if (principal instanceof NextResponse) return principal;
  const { id } = await params;
  const { status, data } = await callAiService<unknown>({
    method: "GET",
    path: `/api/v1/ai/assistant/conversations/${encodeURIComponent(id)}/messages`,
    principal,
  });
  return NextResponse.json(data, { status });
}
