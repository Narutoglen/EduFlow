import { NextResponse } from "next/server";
import { callAiService } from "@/lib/ai-client";

// BFF health proxy: browser/ops hit /api/ai/health; we forward to ai-service liveness.
// No principal required for health. Keeps ai-service off the public internet (arch D2).
export async function GET() {
  try {
    const { status, data } = await callAiService<{ status: string }>({
      method: "GET",
      path: "/api/v1/health",
    });
    if (status === 200 && data?.status === "ok") {
      return NextResponse.json({ status: "ok", upstream: "ai-service" });
    }
    return NextResponse.json(
      { error: { code: "UPSTREAM_UNAVAILABLE", message: "ai-service not healthy" } },
      { status: 502 },
    );
  } catch {
    // Fail-closed, generic (A10:2025)
    return NextResponse.json(
      { error: { code: "UPSTREAM_UNAVAILABLE", message: "ai-service unreachable" } },
      { status: 502 },
    );
  }
}
