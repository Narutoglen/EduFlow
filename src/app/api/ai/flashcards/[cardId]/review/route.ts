import { NextResponse } from "next/server";
import { callAiService } from "@/lib/ai-client";
import { requireAiPrincipal } from "@/lib/ai-session";

// BFF: record an SM-2 review (contract §3). ai-service enforces card ownership (anti-IDOR).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ cardId: string }> },
) {
  const principal = await requireAiPrincipal();
  if (principal instanceof NextResponse) return principal;
  const { cardId } = await params;
  const body = await request.json().catch(() => null);
  const grade = Number(body?.grade);
  if (!Number.isInteger(grade) || grade < 0 || grade > 5) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "grade must be an integer 0..5" } },
      { status: 400 },
    );
  }
  const principal = await getCurrentPrincipal();
  if (!principal) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Sign in to use AI tools" } },
      { status: 401 },
    );
  }
  const { status, data } = await callAiService<unknown>({
    method: "POST",
    path: `/api/v1/ai/flashcards/${encodeURIComponent(cardId)}/review`,
    principal,
    body: { grade },
  });
  return NextResponse.json(data, { status });
}
