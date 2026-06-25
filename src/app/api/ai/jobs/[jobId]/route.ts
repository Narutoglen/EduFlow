import { NextResponse } from "next/server";
import { callAiService } from "@/lib/ai-client";
import { requireAiPrincipal } from "@/lib/ai-session";

// BFF for job polling (contract §6). Forwards to ai-service which enforces requester-only access.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
<<<<<<< HEAD
  const principal = await getCurrentPrincipal();
  if (!principal) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Sign in to use AI tools" } },
      { status: 401 },
    );
  }
=======
  const principal = await requireAiPrincipal();
  if (principal instanceof NextResponse) return principal;
>>>>>>> 1676408760a8ccb2072fe64933b6be5d1efca3e9
  const { status, data } = await callAiService<unknown>({
    method: "GET",
    path: `/api/v1/ai/jobs/${encodeURIComponent(jobId)}`,
    principal,
  });
  return NextResponse.json(data, { status });
}
