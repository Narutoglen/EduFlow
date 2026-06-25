import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { hashSessionToken, newSessionToken } from "./security";
import type { Role, User } from "./types";

export const SESSION_COOKIE = "eduflow_session";
const SESSION_DAYS = 7;
const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60;

const roleHomes: Record<Role, string> = {
  STUDENT: "/dashboard",
  LECTURER: "/lecturer",
  TA: "/ta",
  ADMIN: "/admin",
};

type DbUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl: string | null;
  bio: string | null;
  institution: string | null;
  isActive: boolean;
  emailNotifications?: boolean;
  socialLinks: string[];
};

export function toAppUser(user: DbUser): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl ?? "/globe.svg",
    bio: user.bio ?? "",
    institution: user.institution ?? undefined,
    isActive: user.isActive,
    emailNotifications: user.emailNotifications,
    socialLinks: user.socialLinks,
  };
}

export async function createUserSession(userId: string) {
  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);
  await prisma.session.create({
    data: {
      userId,
      refreshTokenHash: hashSessionToken(token),
      expiresAt,
    },
  });
  return { token, expiresAt };
}

export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
    maxAge: SESSION_MAX_AGE,
  };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.updateMany({
      where: {
        refreshTokenHash: hashSessionToken(token),
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { refreshTokenHash: hashSessionToken(token) },
    include: { user: true },
  });
  if (
    !session ||
    session.revokedAt ||
    session.expiresAt <= new Date() ||
    !session.user.isActive
  ) {
    return null;
  }
  return toAppUser(session.user as DbUser);
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  return user;
}

export async function requireRole(roles: Role | Role[]) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  const user = await requireUser();
  if (!allowed.includes(user.role)) redirect(roleHomes[user.role]);
  return user;
}

export function homeForRole(role: Role) {
  return roleHomes[role];
}
