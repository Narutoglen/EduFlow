import { describe, expect, it } from "vitest";
import {
  hashPassword,
  hashSessionToken,
  newSessionToken,
  verifyPassword,
} from "./security";

describe("password hashing (PBKDF2)", () => {
  it("verifies a password against its own hash", () => {
    const hash = hashPassword("correct horse battery staple");
    expect(verifyPassword("correct horse battery staple", hash)).toBe(true);
  });

  it("rejects the wrong password", () => {
    const hash = hashPassword("s3cret-pass");
    expect(verifyPassword("wrong-pass", hash)).toBe(false);
  });

  it("salts each hash so identical passwords differ", () => {
    const a = hashPassword("same-password");
    const b = hashPassword("same-password");
    expect(a).not.toBe(b);
    // ...but both still verify.
    expect(verifyPassword("same-password", a)).toBe(true);
    expect(verifyPassword("same-password", b)).toBe(true);
  });

  it("uses the documented pbkdf2 format", () => {
    const hash = hashPassword("x");
    expect(hash.startsWith("pbkdf2_sha256$120000$")).toBe(true);
    expect(hash.split("$")).toHaveLength(4);
  });

  it("fails closed on missing or malformed stored hashes", () => {
    expect(verifyPassword("x", null)).toBe(false);
    expect(verifyPassword("x", undefined)).toBe(false);
    expect(verifyPassword("x", "")).toBe(false);
    expect(verifyPassword("x", "not-a-valid-hash")).toBe(false);
    expect(verifyPassword("x", "bcrypt$1$salt$hash")).toBe(false);
  });
});

describe("session tokens", () => {
  it("mints unpredictable, unique tokens", () => {
    const tokens = new Set(Array.from({ length: 100 }, () => newSessionToken()));
    expect(tokens.size).toBe(100);
    // base64url, 32 random bytes -> 43 chars, no padding
    for (const token of tokens) {
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    }
  });

  it("hashes tokens deterministically (so stored hash matches on lookup)", () => {
    const token = newSessionToken();
    expect(hashSessionToken(token)).toBe(hashSessionToken(token));
  });

  it("never stores the raw token (hash differs from input and is hex sha-256)", () => {
    const token = newSessionToken();
    const hash = hashSessionToken(token);
    expect(hash).not.toBe(token);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
