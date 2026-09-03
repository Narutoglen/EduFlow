import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("Password Hashing & Verification (scrypt)", () => {
  it("generates a valid scrypt-formatted hash string", () => {
    const hash = hashPassword("super-secret-password-123");
    expect(hash).toMatch(/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
  });

  it("verifies a valid password against its own hash", () => {
    const password = "my-secure-password-!@#$%^";
    const hash = hashPassword(password);
    expect(verifyPassword(password, hash)).toBe(true);
  });

  it("rejects an incorrect password", () => {
    const hash = hashPassword("correct-password");
    expect(verifyPassword("wrong-password", hash)).toBe(false);
    expect(verifyPassword("CORRECT-PASSWORD", hash)).toBe(false); // case sensitivity
  });

  it("generates distinct salts and hashes for identical passwords", () => {
    const password = "reused-password-for-different-users";
    const hash1 = hashPassword(password);
    const hash2 = hashPassword(password);

    expect(hash1).not.toBe(hash2);
    expect(verifyPassword(password, hash1)).toBe(true);
    expect(verifyPassword(password, hash2)).toBe(true);
  });

  it("fails closed on null, undefined, or empty stored hashes", () => {
    expect(verifyPassword("password", null)).toBe(false);
    expect(verifyPassword("password", undefined)).toBe(false);
    expect(verifyPassword("password", "")).toBe(false);
  });

  it("fails closed on malformed or corrupted hashes", () => {
    expect(verifyPassword("password", "invalid-hash-string")).toBe(false);
    expect(verifyPassword("password", "bcrypt$salt$hash")).toBe(false);
    expect(verifyPassword("password", "scrypt$only-two-parts")).toBe(false);
    expect(verifyPassword("password", "scrypt$$")).toBe(false);
    expect(verifyPassword("password", "scrypt$1234$short")).toBe(false);
  });

  it("handles passwords with UTF-8 and special unicode characters", () => {
    const unicodePassword = "🔐Pässwörd!日本語123";
    const hash = hashPassword(unicodePassword);
    expect(verifyPassword(unicodePassword, hash)).toBe(true);
    expect(verifyPassword("🔐Pässwörd!日本語124", hash)).toBe(false);
  });

  it("handles empty string password hashing safely", () => {
    const hash = hashPassword("");
    expect(verifyPassword("", hash)).toBe(true);
    expect(verifyPassword("non-empty", hash)).toBe(false);
  });
});
