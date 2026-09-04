import { describe, expect, it } from "vitest";
import {
  PROTECTED_PAGE_PREFIXES,
  PUBLIC_API_PATHS,
  SESSION_COOKIE,
  tokenExpiry,
} from "../proxy";

describe("Edge Proxy Security & Routing Rules", () => {
  it("defines standard session cookie name", () => {
    expect(SESSION_COOKIE).toBe("eduflow_session");
  });

  it("identifies all sensitive protected page routes", () => {
    expect(PROTECTED_PAGE_PREFIXES).toContain("/dashboard");
    expect(PROTECTED_PAGE_PREFIXES).toContain("/achievements");
    expect(PROTECTED_PAGE_PREFIXES).toContain("/profile");
    expect(PROTECTED_PAGE_PREFIXES).toContain("/learn");
    expect(PROTECTED_PAGE_PREFIXES).toContain("/lecturer");
    expect(PROTECTED_PAGE_PREFIXES).toContain("/ta");
    expect(PROTECTED_PAGE_PREFIXES).toContain("/admin");
  });

  it("identifies all public unauthenticated API paths", () => {
    expect(PUBLIC_API_PATHS.has("/api/ai/health")).toBe(true);
    expect(PUBLIC_API_PATHS.has("/api/auth/register")).toBe(true);
    expect(PUBLIC_API_PATHS.has("/api/auth/session")).toBe(true);
    expect(PUBLIC_API_PATHS.has("/api/quizzes/submit")).toBe(false);
    expect(PUBLIC_API_PATHS.has("/api/progress")).toBe(false);
  });

  describe("tokenExpiry parser", () => {
    it("returns null for malformed or empty token strings", () => {
      expect(tokenExpiry("")).toBeNull();
      expect(tokenExpiry("not-a-valid-token")).toBeNull();
    });

    it("parses valid base64url encoded token expiration timestamp", () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600;
      const rawPayload = `usr_123.${futureTimestamp}`;
      const encodedPayload = Buffer.from(rawPayload).toString("base64url");
      const fakeToken = `${encodedPayload}.fakeSignature`;

      const parsed = tokenExpiry(fakeToken);
      expect(parsed).toBe(futureTimestamp);
    });

    it("handles padded and unpadded base64url inputs", () => {
      const timestamp = 1776543210;
      const payload = Buffer.from(`user-id-99.${timestamp}`).toString("base64url");
      const token = `${payload}.signature`;

      expect(tokenExpiry(token)).toBe(timestamp);
    });
  });
});
