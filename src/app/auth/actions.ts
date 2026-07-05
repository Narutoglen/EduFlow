"use server";

import { redirect } from "next/navigation";
import {
  createUser,
  DuplicateEmailError,
  getUserByEmail,
  type AuthUser,
} from "@/lib/auth-store";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  clearSessionCookie,
  homeForRole,
  setSessionCookie,
} from "@/lib/session";

function safeNext(next: unknown): string | null {
  // Only allow same-site relative paths to avoid open redirects.
  if (typeof next === "string" && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return null;
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!email || !password) {
    redirect(`/auth/login?error=missing${next ? `&next=${encodeURIComponent(next)}` : ""}`);
  }

  let user: AuthUser | null;
  try {
    user = await getUserByEmail(email);
  } catch (error) {
    // Fail closed on a DB outage: show a generic "unavailable" message instead
    // of letting the raw driver error reach the user (OWASP A10).
    console.error("loginAction: auth database unavailable", error);
    redirect(`/auth/login?error=unavailable${next ? `&next=${encodeURIComponent(next)}` : ""}`);
  }
  if (!user || !user.isActive || !verifyPassword(password, user.passwordHash)) {
    redirect(`/auth/login?error=invalid${next ? `&next=${encodeURIComponent(next)}` : ""}`);
  }

  await setSessionCookie(user.id);
  redirect(next ?? homeForRole(user.role));
}

export async function registerAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || password.length < 8) {
    redirect("/auth/register?error=invalid");
  }

  // Keep redirect() out of the try blocks so its NEXT_REDIRECT control-flow
  // signal is never swallowed; only genuine failures (e.g. a DB outage) land in
  // the catch and surface a generic "unavailable" message (OWASP A10).
  let existing: AuthUser | null;
  try {
    existing = await getUserByEmail(email);
  } catch (error) {
    console.error("registerAction: auth database unavailable", error);
    redirect("/auth/register?error=unavailable");
  }
  if (existing) {
    redirect("/auth/register?error=exists");
  }

  let user: AuthUser;
  try {
    user = await createUser({
      name,
      email,
      role: "STUDENT",
      passwordHash: hashPassword(password),
    });
  } catch (error) {
    // A unique-constraint race (two signups at once) surfaces as a duplicate;
    // anything else is treated as a generic outage (OWASP A10).
    if (error instanceof DuplicateEmailError) {
      redirect("/auth/register?error=exists");
    }
    console.error("registerAction: registration failed", error);
    redirect("/auth/register?error=unavailable");
  }

  await setSessionCookie(user.id);
  redirect(homeForRole(user.role));
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/");
}

export async function requestResetAction(formData: FormData) {
  // Reset email delivery is not enabled in the demo environment. We always
  // respond the same way so the form never reveals whether an account exists.
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (email) {
    // In production this is where a signed reset token + email send would go.
  }
  redirect("/auth/reset?sent=1");
}
