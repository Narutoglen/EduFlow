// Server-only client for the EduFlow AI service (BFF layer).
// SECURITY: never import this into a client component. It reads AI_SERVICE_* secrets and mints the
// short-lived service token the ai-service verifies (see ai-service/app/core/security.py).
import "server-only";
import { createHmac } from "node:crypto";

import type { Role } from "./types";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://ai-service:8000";
const SECRET = process.env.AI_SERVICE_TOKEN_SECRET ?? "";
const AUDIENCE = process.env.AI_SERVICE_TOKEN_AUD ?? "ai-service";
const TOKEN_TTL_SECONDS = 300; // short-lived (secure-design review §A)

export type Principal = {
  userId: string;
  role: Role;
  enrolledCourseIds: string[];
  ownedCourseIds: string[];
};

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

/** Mint an HS256 JWT matching the ai-service verifier (sub, role, enrolled, owned, aud, exp). */
function mintServiceToken(p: Principal): string {
  if (!SECRET) throw new Error("AI_SERVICE_TOKEN_SECRET is not configured");
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    sub: p.userId,
    role: p.role,
    enrolled: p.enrolledCourseIds,
    owned: p.ownedCourseIds,
    aud: AUDIENCE,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
  };
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const signature = createHmac("sha256", SECRET).update(signingInput).digest("base64url");
  return `${signingInput}.${signature}`;
}

export type AiRequest = {
  method?: "GET" | "POST";
  path: string; // e.g. "/api/v1/ai/summaries"
  principal?: Principal;
  body?: unknown;
  headers?: Record<string, string>;
};

/** Server-side call into ai-service. Adds the bearer service token when a principal is supplied. */
export async function callAiService<T>({
  method = "GET",
  path,
  principal,
  body,
  headers = {},
}: AiRequest): Promise<{ status: number; data: T }> {
  const url = `${AI_SERVICE_URL}${path}`;
  const finalHeaders: Record<string, string> = { ...headers };
  if (principal) finalHeaders["authorization"] = `Bearer ${mintServiceToken(principal)}`;
  if (body !== undefined) finalHeaders["content-type"] = "application/json";

  const resp = await fetch(url, {
    method,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = (await resp.json().catch(() => null)) as T;
  return { status: resp.status, data };
}

/** Forward a multipart upload (e.g. audio) to ai-service with the bearer service token. */
export async function forwardMultipart<T>(
  path: string,
  form: FormData,
  principal: Principal,
): Promise<{ status: number; data: T }> {
  const resp = await fetch(`${AI_SERVICE_URL}${path}`, {
    method: "POST",
    headers: { authorization: `Bearer ${mintServiceToken(principal)}` },
    body: form,
    cache: "no-store",
  });
  const data = (await resp.json().catch(() => null)) as T;
  return { status: resp.status, data };
}
