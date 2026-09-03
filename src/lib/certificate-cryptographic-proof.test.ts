import { describe, it, expect } from "vitest";
import {
  signCertificate,
  verifyCertificateSignature,
  type CertificatePayload,
} from "./certificates";

describe("EduFlow Certificate Cryptographic Verification & Tamper Detection", () => {
  const basePayload: CertificatePayload = {
    verificationId: "EDU-2026-CS101-ABCD",
    studentId: "usr_alice",
    studentName: "Alice Walker",
    courseId: "course_cs101",
    courseTitle: "Introduction to Distributed Systems",
    issuedAt: "2026-05-01",
    gradePercent: 98,
    expiresAt: "2028-05-01",
  };

  it("successfully validates untampered certificate signatures", () => {
    const signed = signCertificate(basePayload, "secret_key_1");
    const verified = verifyCertificateSignature(signed, "secret_key_1");

    expect(verified.isValid).toBe(true);
    expect(verified.isTampered).toBe(false);
    expect(verified.isExpired).toBe(false);
    expect(verified.payload?.studentName).toBe("Alice Walker");
  });

  it("detects grade percent tampering", () => {
    const signed = signCertificate(basePayload, "secret_key_1");
    // Attacker modifies grade from 98 to 100
    const tampered = { ...signed, gradePercent: 100 };
    const result = verifyCertificateSignature(tampered, "secret_key_1");

    expect(result.isValid).toBe(false);
    expect(result.isTampered).toBe(true);
    expect(result.reason).toContain("tampered");
  });

  it("detects student name tampering", () => {
    const signed = signCertificate(basePayload, "secret_key_1");
    // Attacker changes student name
    const tampered = { ...signed, studentName: "Eve Mallory" };
    const result = verifyCertificateSignature(tampered, "secret_key_1");

    expect(result.isValid).toBe(false);
    expect(result.isTampered).toBe(true);
  });

  it("flags expired certificates even if cryptographic signature is valid", () => {
    const expiredPayload: CertificatePayload = {
      ...basePayload,
      expiresAt: "2020-01-01", // in past
    };
    const signed = signCertificate(expiredPayload, "secret_key_1");
    const result = verifyCertificateSignature(signed, "secret_key_1");

    expect(result.isValid).toBe(false);
    expect(result.isExpired).toBe(true);
  });
});
