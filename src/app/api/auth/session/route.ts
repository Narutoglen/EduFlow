import { NextResponse } from "next/server";
import { emailAdapter } from "@/lib/adapters";
import { users } from "@/lib/mock-data";

const roleRedirects = {
  STUDENT: "/dashboard",
  LECTURER: "/lecturer",
  TA: "/ta",
  ADMIN: "/admin",
} as const;

const roleLabels = {
  STUDENT: "Student",
  LECTURER: "Lecturer",
  TA: "Teaching Assistant",
  ADMIN: "Admin",
} as const;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const provider = url.searchParams.get("provider") ?? "email";
  if (url.searchParams.get("format") === "json") {
    return NextResponse.json({
      provider,
      status: "ready",
      redirectTo: "/dashboard",
      strategy: "role session",
    });
  }
  return NextResponse.redirect(new URL("/dashboard?notice=signed-in", request.url));
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await request.json()
    : Object.fromEntries((await request.formData()).entries());
  const email = String(payload.email ?? "");
  const intent = String(payload.intent ?? "login");
  const user = users.find((item) => item.email === email) ?? users[0];

  if (intent === "reset") {
    await emailAdapter.sendTransactionalEmail(
      user.email,
      "EduFlow account action",
      "A password reset email was requested.",
    );
    return NextResponse.redirect(
      new URL("/auth/login?notice=reset-sent", request.url),
      303,
    );
  }

  if (!contentType.includes("application/json")) {
    const redirectTo = `${roleRedirects[user.role]}?notice=signed-in`;
    return NextResponse.redirect(new URL(redirectTo, request.url), 303);
  }

  return NextResponse.json({
    user: {
      ...user,
      roleLabel: roleLabels[user.role],
    },
    accessToken: "session.access",
    refreshToken: "session.refresh",
    expiresIn: 3600,
  });
}
