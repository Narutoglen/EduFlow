import { NextResponse } from "next/server";
import { emailAdapter } from "@/lib/adapters";
import { users } from "@/lib/mock-data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const provider = url.searchParams.get("provider") ?? "email";
  return NextResponse.json({
    provider,
    status: "mock-auth-ready",
    redirectTo: "/dashboard",
    strategy: "Auth.js-compatible demo session",
  });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await request.json()
    : Object.fromEntries((await request.formData()).entries());
  const email = String(payload.email ?? "");
  const user = users.find((item) => item.email === email) ?? users[0];
  const reset = email.includes("@");

  if (reset) {
    await emailAdapter.sendTransactionalEmail(
      user.email,
      "EduFlow account action",
      "A demo auth email was requested.",
    );
  }

  return NextResponse.json({
    user,
    accessToken: "demo.jwt.access",
    refreshToken: "demo.jwt.refresh",
    expiresIn: 3600,
  });
}
