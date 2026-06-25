import { NextResponse } from "next/server";
import { emailAdapter } from "@/lib/adapters";
import { prisma } from "@/lib/prisma";
import {
  clearSessionCookie,
  createUserSession,
  getCurrentUser,
  homeForRole,
  SESSION_COOKIE,
  sessionCookieOptions,
  toAppUser,
} from "@/lib/session";
import { verifyPassword } from "@/lib/security";

const roleLabels = {
  STUDENT: "Student",
  LECTURER: "Lecturer",
  TA: "Teaching Assistant",
  ADMIN: "Admin",
} as const;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const provider = url.searchParams.get("provider") ?? "email";
  const user = await getCurrentUser();
  if (url.searchParams.get("format") === "json") {
    return NextResponse.json({
      provider,
      status: "ready",
      user,
      redirectTo: user ? homeForRole(user.role) : "/auth/login",
      strategy: "prisma-session",
    });
  }
  if (provider === "google") {
    return NextResponse.redirect(
      new URL("/auth/login?notice=use-email", request.url),
      303,
    );
  }
  return NextResponse.redirect(
    new URL(user ? `${homeForRole(user.role)}?notice=signed-in` : "/auth/login", request.url),
    303,
  );
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await request.json()
    : Object.fromEntries((await request.formData()).entries());
  const email = String(payload.email ?? "");
  const password = String(payload.password ?? "");
  const intent = String(payload.intent ?? "login");
  if (intent === "logout") {
    await clearSessionCookie();
    if (!contentType.includes("application/json")) {
      const response = NextResponse.redirect(new URL("/auth/login?notice=signed-out", request.url), 303);
      response.cookies.delete(SESSION_COOKIE);
      return response;
    }
    const response = NextResponse.json({ signedOut: true });
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (intent === "reset") {
    await emailAdapter.sendTransactionalEmail(
      user?.email ?? email,
      "EduFlow account action",
      "A password reset email was requested.",
    );
    return NextResponse.redirect(
      new URL("/auth/login?notice=reset-sent", request.url),
      303,
    );
  }

  if (!user || !verifyPassword(password, user.passwordHash) || !user.isActive) {
    if (!contentType.includes("application/json")) {
      return NextResponse.redirect(
        new URL("/auth/login?notice=invalid", request.url),
        303,
      );
    }
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 },
    );
  }

  const session = await createUserSession(user.id);
  const appUser = toAppUser(user);

  if (!contentType.includes("application/json")) {
    const redirectTo = `${homeForRole(appUser.role)}?notice=signed-in`;
    const response = NextResponse.redirect(new URL(redirectTo, request.url), 303);
    response.cookies.set(SESSION_COOKIE, session.token, sessionCookieOptions(session.expiresAt));
    return response;
  }

  const response = NextResponse.json({
    user: {
      ...appUser,
      roleLabel: roleLabels[appUser.role],
    },
    expiresAt: session.expiresAt.toISOString(),
  });
  response.cookies.set(SESSION_COOKIE, session.token, sessionCookieOptions(session.expiresAt));
  return response;
}

export async function DELETE() {
  await clearSessionCookie();
  const response = NextResponse.json({ signedOut: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
