import { userForRole } from "./mock-data";
import type { Role, User } from "./types";

export type DemoSession = {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  provider: "credentials" | "google";
};

export function createDemoSession(
  role: Role = "STUDENT",
  provider: DemoSession["provider"] = "credentials",
): DemoSession {
  const user = userForRole(role);

  return {
    user,
    accessToken: `demo.${role.toLowerCase()}.access`,
    refreshToken: `demo.${role.toLowerCase()}.refresh`,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    provider,
  };
}

export function requireRole(session: DemoSession, allowed: Role[]) {
  if (!allowed.includes(session.user.role)) {
    throw new Error(`Role ${session.user.role} is not allowed for this action.`);
  }
  return session.user;
}

export const authBoundary = {
  strategy: "Auth.js-compatible JWT sessions",
  providers: ["credentials", "google"],
  emailVerification: true,
  passwordReset: true,
  refreshTokens: true,
};
