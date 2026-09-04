import { describe, expect, it } from "vitest";
import { mintServiceToken, type Principal } from "./ai-client";

describe("AI Service Client & JWT Minter", () => {
  const samplePrincipal: Principal = {
    userId: "usr-student-42",
    role: "STUDENT",
    enrolledCourseIds: ["course-1", "course-2"],
    ownedCourseIds: [],
  };

  it("mints a valid three-part HS256 JWT string", () => {
    // Note: AI_SERVICE_TOKEN_SECRET may be set in .env or default in test
    process.env.AI_SERVICE_TOKEN_SECRET = "test-ai-token-secret-32-chars-long";
    process.env.AI_SERVICE_TOKEN_AUD = "ai-service";

    const token = mintServiceToken(samplePrincipal);
    const parts = token.split(".");
    expect(parts).toHaveLength(3);

    const [headerB64, payloadB64, signature] = parts;
    const header = JSON.parse(Buffer.from(headerB64, "base64url").toString());
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());

    expect(header).toEqual({ alg: "HS256", typ: "JWT" });
    expect(payload.sub).toBe("usr-student-42");
    expect(payload.role).toBe("STUDENT");
    expect(payload.enrolled).toEqual(["course-1", "course-2"]);
    expect(payload.owned).toEqual([]);
    expect(payload.aud).toBe("ai-service");
    expect(payload.exp).toBeGreaterThan(payload.iat);
    expect(signature).toBeDefined();
    expect(signature.length).toBeGreaterThan(20);
  });

  it("embeds lecturer owned courses in claims", () => {
    process.env.AI_SERVICE_TOKEN_SECRET = "test-ai-token-secret-32-chars-long";

    const lecturerPrincipal: Principal = {
      userId: "usr-lecturer-1",
      role: "LECTURER",
      enrolledCourseIds: [],
      ownedCourseIds: ["course-ai-101", "course-ai-102"],
    };

    const token = mintServiceToken(lecturerPrincipal);
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());

    expect(payload.sub).toBe("usr-lecturer-1");
    expect(payload.role).toBe("LECTURER");
    expect(payload.owned).toEqual(["course-ai-101", "course-ai-102"]);
  });

  it("throws error if AI_SERVICE_TOKEN_SECRET is missing", () => {
    const orig = process.env.AI_SERVICE_TOKEN_SECRET;
    delete process.env.AI_SERVICE_TOKEN_SECRET;

    expect(() => mintServiceToken(samplePrincipal)).toThrow("AI_SERVICE_TOKEN_SECRET is not configured");

    process.env.AI_SERVICE_TOKEN_SECRET = orig;
  });
});
