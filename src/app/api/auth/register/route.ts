import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/security";
import {
  createUserSession,
  homeForRole,
  SESSION_COOKIE,
  sessionCookieOptions,
  toAppUser,
} from "@/lib/session";
import { createUserNotification } from "@/lib/notifications";

function value(payload: Record<string, FormDataEntryValue>, key: string) {
  return String(payload[key] ?? "").trim();
}

function isEmail(input: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
}

function redirectNotice(request: Request, notice: string) {
  return NextResponse.redirect(new URL(`/auth/register?notice=${notice}`, request.url), 303);
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await request.json()
    : Object.fromEntries((await request.formData()).entries());
  const intent = value(payload, "intent") || "student";

  if (intent === "lecturer-application") {
    const name = value(payload, "name");
    const email = value(payload, "email");
    const institution = value(payload, "institution");
    const topic = value(payload, "courseTopic");
    const adminUsers = await prisma.user.findMany({
      where: { role: "ADMIN", isActive: true },
      select: { id: true },
    });

    await Promise.all(
      adminUsers.map((admin) =>
        createUserNotification({
          userId: admin.id,
          title: "Lecturer application received",
          body: `${name || "A prospective lecturer"} applied with topic: ${topic || "Not specified"}.`,
          kind: "lecturer-application",
          emailSubject: "EduFlow lecturer application received",
          emailBody: [
            `Name: ${name || "Not provided"}`,
            `Email: ${email || "Not provided"}`,
            `Institution: ${institution || "Not provided"}`,
            `Course topic: ${topic || "Not provided"}`,
          ].join("\n"),
        }),
      ),
    );

    return redirectNotice(request, "lecturer-application");
  }

  const name = value(payload, "name");
  const email = value(payload, "email").toLowerCase();
  const password = value(payload, "password");
  const confirmPassword = value(payload, "confirmPassword");
  const institution = value(payload, "institution");
  const emailNotifications = value(payload, "emailNotifications") === "on";

  if (name.length < 2 || !isEmail(email) || password.length < 8 || password !== confirmPassword) {
    return redirectNotice(request, "invalid");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return redirectNotice(request, "email-exists");
  }

  const adminCount = await prisma.user.count({ where: { role: "ADMIN", isActive: true } });
  const role = adminCount === 0 ? "ADMIN" : "STUDENT";
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: hashPassword(password),
      role,
      institution: institution || null,
      avatarUrl: "/globe.svg",
      socialLinks: [],
      emailNotifications,
    },
  });

  await createUserNotification({
    userId: user.id,
    title: "Welcome to EduFlow",
    body:
      role === "ADMIN"
        ? "Your account is ready. Because this is the first active account, it has platform administrator access."
        : "Your learner account is ready. You can now enroll in courses and track your progress.",
    kind: "registration",
    emailSubject: "Welcome to EduFlow",
    emailBody: [
      `Hello ${user.name},`,
      "",
      role === "ADMIN"
        ? "Your EduFlow account has been created as the first platform administrator."
        : "Your EduFlow learner account has been created.",
      "Sign in any time to continue learning.",
    ].join("\n"),
  });

  const session = await createUserSession(user.id);
  const appUser = toAppUser(user);
  const response = contentType.includes("application/json")
    ? NextResponse.json({ user: appUser, redirectTo: homeForRole(appUser.role) }, { status: 201 })
    : NextResponse.redirect(
        new URL(`${homeForRole(appUser.role)}?notice=registered`, request.url),
        303,
      );
  response.cookies.set(SESSION_COOKIE, session.token, sessionCookieOptions(session.expiresAt));
  return response;
}
