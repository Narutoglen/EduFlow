import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Edge defense-in-depth gate (Next.js "proxy" convention, formerly middleware).
// This is a FAST pre-check, not the source of truth: it only confirms a
// non-expired session cookie is present and redirects/401s otherwise. The
// authoritative checks — HMAC signature verification, the active DB user lookup,
// and role enforcement — still run server-side in requireUser / requireRole /
// requireApiRole. We deliberately avoid node:crypto here so this stays
// compatible with the edge runtime.

const SESSION_COOKIE = "eduflow_session";

const PROTECTED_PAGE_PREFIXES = [
  "/dashboard",
  "/achievements",
  "/profile",
  "/learn",
  "/lecturer",
  "/ta",
  "/admin",
];

/** Best-effort read of the token's expiry (base64url(userId.expiresAt).sig). */
function tokenExpiry(token: string): number | null {
  try {
    const encoded = token.split(".")[0];
    if (!encoded) return null;
    const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "=");
    const payload = atob(padded); // "userId.expiresAt"
    const expiresAt = payload.split(".")[1];
    return expiresAt ? Number(expiresAt) : null;
  } catch {
    return null;
  }
}

function hasLiveSession(req: NextRequest): boolean {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  const exp = tokenExpiry(token);
  // If we can parse an expiry, require it in the future; if not, defer to the
  // server-side verifier rather than guessing.
  if (exp != null && exp < Date.now()) return false;
  return true;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const live = hasLiveSession(req);

  // API namespace: 401 without a session cookie. Health stays public.
  if (pathname.startsWith("/api/")) {
    if (pathname === "/api/ai/health") return NextResponse.next();
    if (!live) {
      return NextResponse.json(
        { error: { code: "UNAUTHENTICATED", message: "Sign in required." } },
        { status: 401 },
      );
    }
    return NextResponse.next();
  }

  // Protected pages: bounce anonymous visitors to login with a safe `next`.
  const isProtected = PROTECTED_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (isProtected && !live) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    url.search = `next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/achievements/:path*",
    "/profile/:path*",
    "/learn/:path*",
    "/lecturer/:path*",
    "/ta/:path*",
    "/admin/:path*",
    "/api/:path*",
  ],
};
