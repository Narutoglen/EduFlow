import { describe, expect, it } from "vitest";
import {
  canonicalizeCertificate,
  checkCertificateEligibility,
  createSignedCertificate,
  generateVerificationId,
  isCertificateExpired,
  signCertificatePayload,
  verifyCertificate,
  verifyCertificateSignature,
  type CertificatePayload,
  type SignedCertificate,
} from "./certificates";

describe("Cryptographic Certificate & Verification Engine", () => {
  const secretKey = "test-secret-key-for-eduflow-certs";
  const validPayload: CertificatePayload = {
    verificationId: "EDU-2026-AIT-7K9A",
    studentId: "student-42",
    studentName: "Ada Lovelace",
    courseId: "course-ai-teaching",
    courseTitle: "AI in Higher Education",
    instructorName: "Dr. Evelyn Reed",
    issuedAt: "2026-08-14",
    gradePercent: 95,
    expiresAt: null,
  };

  describe("Canonicalization & Signing", () => {
    it("canonicalizes certificate fields into a deterministic string", () => {
      const canonical = canonicalizeCertificate(validPayload);
      expect(canonical).toBe(
        "vId:EDU-2026-AIT-7K9A|sId:student-42|sName:Ada Lovelace|cId:course-ai-teaching|cTitle:AI in Higher Education|iName:Dr. Evelyn Reed|issued:2026-08-14|grade:95|exp:NONE",
      );
    });

    it("trims whitespace during canonicalization", () => {
      const paddedPayload: CertificatePayload = {
        ...validPayload,
        studentName: "  Ada Lovelace  ",
        courseTitle: "  AI in Higher Education ",
      };
      expect(canonicalizeCertificate(paddedPayload)).toBe(
        canonicalizeCertificate(validPayload),
      );
    });

    it("signs the canonical payload with HMAC-SHA256", () => {
      const signature = signCertificatePayload(validPayload, secretKey);
      expect(signature).toBeDefined();
      expect(typeof signature).toBe("string");
      expect(signature).toHaveLength(64); // 256 bits = 64 hex characters
    });

    it("produces deterministic signatures for identical payloads", () => {
      const sig1 = signCertificatePayload(validPayload, secretKey);
      const sig2 = signCertificatePayload(validPayload, secretKey);
      expect(sig1).toBe(sig2);
    });

    it("produces different signatures for different secret keys", () => {
      const sig1 = signCertificatePayload(validPayload, "key-1");
      const sig2 = signCertificatePayload(validPayload, "key-2");
      expect(sig1).not.toBe(sig2);
    });

    it("produces a complete SignedCertificate object", () => {
      const signed = createSignedCertificate(validPayload, secretKey);
      expect(signed.signature).toHaveLength(64);
      expect(signed.algorithm).toBe("HMAC-SHA256");
      expect(signed.verificationId).toBe(validPayload.verificationId);
      expect(signed.studentName).toBe("Ada Lovelace");
    });
  });

  describe("Signature Verification & Tamper Detection", () => {
    it("verifies a legitimate signed certificate as valid", () => {
      const signed = createSignedCertificate(validPayload, secretKey);
      const result = verifyCertificate(signed, secretKey);

      expect(result.isValid).toBe(true);
      expect(result.isTampered).toBe(false);
      expect(result.isExpired).toBe(false);
    });

    it("detects tampering when student name is modified", () => {
      const signed = createSignedCertificate(validPayload, secretKey);
      const tampered: SignedCertificate = {
        ...signed,
        studentName: "Impostor Learner",
      };

      const result = verifyCertificate(tampered, secretKey);
      expect(result.isValid).toBe(false);
      expect(result.isTampered).toBe(true);
      expect(result.reason).toContain("tampered");
    });

    it("detects tampering when studentId is modified", () => {
      const signed = createSignedCertificate(validPayload, secretKey);
      const tampered: SignedCertificate = {
        ...signed,
        studentId: "attacker-user-999",
      };

      const result = verifyCertificate(tampered, secretKey);
      expect(result.isValid).toBe(false);
      expect(result.isTampered).toBe(true);
    });

    it("detects tampering when course title is modified", () => {
      const signed = createSignedCertificate(validPayload, secretKey);
      const tampered: SignedCertificate = {
        ...signed,
        courseTitle: "Master of Advanced Data Science and Quantum Computing",
      };

      const result = verifyCertificate(tampered, secretKey);
      expect(result.isValid).toBe(false);
      expect(result.isTampered).toBe(true);
    });

    it("detects tampering when grade is modified", () => {
      const signed = createSignedCertificate(validPayload, secretKey);
      const tampered: SignedCertificate = {
        ...signed,
        gradePercent: 100, // changed from 95
      };

      const result = verifyCertificate(tampered, secretKey);
      expect(result.isValid).toBe(false);
      expect(result.isTampered).toBe(true);
    });

    it("detects tampering when issue date is modified", () => {
      const signed = createSignedCertificate(validPayload, secretKey);
      const tampered: SignedCertificate = {
        ...signed,
        issuedAt: "2020-01-01",
      };

      const result = verifyCertificate(tampered, secretKey);
      expect(result.isValid).toBe(false);
      expect(result.isTampered).toBe(true);
    });

    it("rejects verification when forged signature is provided", () => {
      const forged: SignedCertificate = {
        ...validPayload,
        signature: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        algorithm: "HMAC-SHA256",
      };

      const result = verifyCertificate(forged, secretKey);
      expect(result.isValid).toBe(false);
      expect(result.isTampered).toBe(true);
    });

    it("rejects verification when signature is truncated or invalid hex", () => {
      const truncated: SignedCertificate = {
        ...validPayload,
        signature: "short-signature",
        algorithm: "HMAC-SHA256",
      };

      expect(verifyCertificateSignature(validPayload, "invalid-sig", secretKey)).toBe(false);
      const result = verifyCertificate(truncated, secretKey);
      expect(result.isValid).toBe(false);
      expect(result.isTampered).toBe(true);
    });
  });

  describe("Expiration Handling", () => {
    it("handles certificates that do not expire", () => {
      expect(isCertificateExpired(null)).toBe(false);
      expect(isCertificateExpired(undefined)).toBe(false);
    });

    it("returns false for future expiration date", () => {
      const futureDate = "2099-12-31";
      expect(isCertificateExpired(futureDate, new Date("2026-08-14"))).toBe(false);
    });

    it("flags certificate as expired when reference date is past expiration", () => {
      const pastDate = "2025-01-01";
      const referenceDate = new Date("2026-08-14");
      expect(isCertificateExpired(pastDate, referenceDate)).toBe(true);

      const expiredCert = createSignedCertificate(
        { ...validPayload, expiresAt: pastDate },
        secretKey,
      );

      const result = verifyCertificate(expiredCert, secretKey, referenceDate);
      expect(result.isValid).toBe(false);
      expect(result.isExpired).toBe(true);
      expect(result.isTampered).toBe(false);
      expect(result.reason).toContain("expired");
    });
  });

  describe("Certificate Eligibility Rules", () => {
    it("allows certificate issuance when course progress is 100%", () => {
      const result = checkCertificateEligibility({
        progressPercent: 100,
        gradePercent: 85,
        minimumPassGrade: 70,
        certificateEligible: true,
      });
      expect(result.eligible).toBe(true);
    });

    it("rejects issuance when course progress is below 100%", () => {
      const result = checkCertificateEligibility({
        progressPercent: 99,
        gradePercent: 95,
        certificateEligible: true,
      });
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain("100% completion required");
    });

    it("rejects issuance when course is flagged not eligible for certificates", () => {
      const result = checkCertificateEligibility({
        progressPercent: 100,
        certificateEligible: false,
      });
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain("not eligible");
    });

    it("rejects issuance when grade is below the minimum required pass grade", () => {
      const result = checkCertificateEligibility({
        progressPercent: 100,
        gradePercent: 65,
        minimumPassGrade: 70,
        certificateEligible: true,
      });
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain("Minimum passing grade");
    });
  });

  describe("Verification ID Generator", () => {
    it("generates formatted verification IDs with correct year and course prefix", () => {
      const id = generateVerificationId("course-machine-learning", new Date("2026-05-10"));
      expect(id).toMatch(/^EDU-2026-MACHIN-[A-Z0-9]{4}$/);
    });

    it("pads short course names", () => {
      const id = generateVerificationId("ai", new Date("2026-01-01"));
      expect(id).toMatch(/^EDU-2026-AIXX-[A-Z0-9]{4}$/);
    });
  });
});
