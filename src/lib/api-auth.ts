import "server-only";
import { NextResponse } from "next/server";
import { getSessionUser } from "./session";
import type { Role, User } from "./types";

// API-layer access control. Route handlers derive identity ONLY from the signed
// httpOnly session cookie (via getSessionUser) — never from query strings or the
// request body. This is the primary defense against URL/parameter tampering
// (OWASP A01: Broken Access Control). Helpers fail closed and return generic
// error bodies so no internal detail leaks (OWASP A10).

type AuthError = { code: "UNAUTHENTICATED" | "FORBIDDEN"; message: string };

function deny(status: 401 | 403, error: AuthError) {
  return NextResponse.json({ error }, { status });
}

/**
 * Require any signed-in user. Returns the `User` on success, or a 401
 * `NextResponse` the handler should return immediately:
 *
 *   const auth = await requireApiUser();
 *   if (auth instanceof NextResponse) return auth;
 *   const user = auth; // authenticated
 */
export async function requireApiUser(): Promise<User | NextResponse> {
  const user = await getSessionUser();
  if (!user) {
    return deny(401, { code: "UNAUTHENTICATED", message: "Sign in required." });
  }
  return user;
}

/** Require a signed-in user whose role is one of `allowed`; 401 anon, 403 wrong role. */
export async function requireApiRole(allowed: Role[]): Promise<User | NextResponse> {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;
  if (!allowed.includes(auth.role)) {
    return deny(403, { code: "FORBIDDEN", message: "You do not have access to this resource." });
  }
  return auth;
}
