import { NextResponse } from "next/server";
import { callAiService } from "@/lib/ai-client";
import { getCurrentPrincipal } from "@/lib/ai-session";

// BFF for job polling (contract §6). Forwards to ai-service which enforces requester-only access.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  const principal = getCurrentPrincipal();
  const { status, data } = await callAiService<unknown>({
    method: "GET",
    path: `/api/v1/ai/jobs/${encodeURIComponent(jobId)}`,
    principal,
  });
  return NextResponse.json(data, { status });
}
