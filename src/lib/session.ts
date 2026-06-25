<<<<<<< HEAD
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
=======
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import type { Role, User } from "./types";

export const SESSION_COOKIE = "eduflow_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

// Placeholder secrets that must never be used to sign sessions in production.
const INSECURE_SECRETS = new Set([
  "dev-insecure-session-secret",
  "change-me-to-a-32-byte-hex-secret",
]);

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=160&q=80";

/**
 * Resolve the signing secret, failing closed in production. Evaluated lazily (on
 * first sign/verify) rather than at import so a missing secret cannot break the
 * build — but a misconfigured production deployment refuses to mint sessions
 * instead of silently signing with a known-weak key (OWASP A02/A04).
 */
function resolveSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production") {
    if (!secret || INSECURE_SECRETS.has(secret)) {
      throw new Error(
        "SESSION_SECRET must be set to a strong, unique value in production.",
      );
    }
    return secret;
  }
  return secret ?? "dev-insecure-session-secret";
}

function sign(payload: string): string {
  return createHmac("sha256", resolveSecret()).update(payload).digest("base64url");
}

/** Create a signed, expiring session token: base64url(userId.expiry).signature */
export function createToken(userId: string): string {
  const expiresAt = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `${userId}.${expiresAt}`;
  const encoded = Buffer.from(payload).toString("base64url");
  return `${encoded}.${sign(payload)}`;
}

export function verifyToken(token: string | undefined): string | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  let payload: string;
  try {
    payload = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const [userId, expiresAt] = payload.split(".");
  if (!userId || !expiresAt) return null;
  if (Number(expiresAt) < Date.now()) return null;
  return userId;
}

/** Persist the session cookie. Must be called from a Server Action / Route Handler. */
export async function setSessionCookie(userId: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, createToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

type DbUser = {
  id: string;
  name: string;
  email: string;
>>>>>>> 1676408760a8ccb2072fe64933b6be5d1efca3e9
  role: Role;
  avatarUrl: string | null;
  bio: string | null;
  institution: string | null;
  isActive: boolean;
<<<<<<< HEAD
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
=======
  socialLinks: string[];
};

export function toUser(dbUser: DbUser): User {
  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    avatarUrl: dbUser.avatarUrl ?? DEFAULT_AVATAR,
    bio: dbUser.bio ?? "",
    institution: dbUser.institution ?? undefined,
    isActive: dbUser.isActive,
    socialLinks: dbUser.socialLinks ?? [],
  };
}

/** Read the current signed-in user from the session cookie, or null. */
export async function getSessionUser(): Promise<User | null> {
  const store = await cookies();
  const userId = verifyToken(store.get(SESSION_COOKIE)?.value);
  if (!userId) return null;
  try {
    const dbUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!dbUser || !dbUser.isActive) return null;
    return toUser(dbUser as DbUser);
  } catch (error) {
    // A transient DB outage or a stale session token shouldn't crash every
    // page render. Treat it as "not signed in" and let the route render its
    // logged-out state instead of throwing an unhandled server error.
    console.error("getSessionUser: failed to load user from database", error);
    return null;
  }
}

/** The landing route for a given role after sign-in. */
export function homeForRole(role: Role): string {
  switch (role) {
    case "LECTURER":
      return "/lecturer";
    case "TA":
      return "/ta";
    case "ADMIN":
      return "/admin";
    default:
      return "/dashboard";
  }
}

/** Require any signed-in user; redirect to login otherwise. */
export async function requireUser(nextPath?: string): Promise<User> {
  const user = await getSessionUser();
  if (!user) {
    redirect(nextPath ? `/auth/login?next=${encodeURIComponent(nextPath)}` : "/auth/login");
  }
  return user;
}

/** Require a signed-in user with one of the allowed roles. */
export async function requireRole(allowed: Role[]): Promise<User> {
  const user = await requireUser();
  if (!allowed.includes(user.role)) {
    redirect(homeForRole(user.role));
  }
  return user;
}
>>>>>>> 1676408760a8ccb2072fe64933b6be5d1efca3e9
