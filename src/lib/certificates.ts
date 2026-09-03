import { createHmac, timingSafeEqual } from "node:crypto";

export type CertificatePayload = {
  verificationId: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  instructorName?: string;
  issuedAt: string; // ISO 8601 YYYY-MM-DD
  gradePercent?: number;
  expiresAt?: string | null;
};

export type SignedCertificate = CertificatePayload & {
  signature: string;
  algorithm: "HMAC-SHA256";
};

export type CertificateVerificationResult = {
  isValid: boolean;
  isTampered: boolean;
  isExpired: boolean;
  reason?: string;
  payload?: CertificatePayload;
};

const DEFAULT_SECRET =
  process.env.CERTIFICATE_SIGNING_SECRET ||
  process.env.SESSION_SECRET ||
  "eduflow-cert-signing-key-v1-production-hermes";

/**
 * Creates a unique, structured verification identifier.
 * Format: `EDU-{YEAR}-{COURSE_CODE}-{RANDOM_HEX}`
 */
export function generateVerificationId(
  courseIdentifier: string,
  issueDate: Date = new Date(),
): string {
  const year = issueDate instanceof Date && !Number.isNaN(issueDate.getTime())
    ? issueDate.getUTCFullYear()
    : new Date().getUTCFullYear();
  const cleanCode = (courseIdentifier || "COURSE")
    .replace(/^course-/, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 6)
    .padEnd(4, "X");
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `EDU-${year}-${cleanCode}-${randomSuffix}`;
}

/**
 * Canonicalizes certificate payload into a deterministic string representation.
 */
export function canonicalizeCertificate(payload: CertificatePayload): string {
  const parts = [
    `vId:${(payload.verificationId ?? "").trim()}`,
    `sId:${(payload.studentId ?? "").trim()}`,
    `sName:${(payload.studentName ?? "").trim()}`,
    `cId:${(payload.courseId ?? "").trim()}`,
    `cTitle:${(payload.courseTitle ?? "").trim()}`,
    `iName:${(payload.instructorName ?? "").trim()}`,
    `issued:${(payload.issuedAt ?? "").slice(0, 10)}`,
    `grade:${payload.gradePercent != null && Number.isFinite(payload.gradePercent) ? Math.round(payload.gradePercent) : "NA"}`,
    `exp:${payload.expiresAt ? payload.expiresAt.slice(0, 10) : "NONE"}`,
  ];
  return parts.join("|");
}

/**
 * Generates an HMAC-SHA256 cryptographic signature for a certificate.
 */
export function signCertificatePayload(
  payload: CertificatePayload,
  secretKey: string = DEFAULT_SECRET,
): string {
  const canonical = canonicalizeCertificate(payload);
  return createHmac("sha256", secretKey).update(canonical).digest("hex");
}

/**
 * Creates a complete signed certificate object.
 */
export function createSignedCertificate(
  payload: CertificatePayload,
  secretKey: string = DEFAULT_SECRET,
): SignedCertificate {
  const signature = signCertificatePayload(payload, secretKey);
  return {
    ...payload,
    signature,
    algorithm: "HMAC-SHA256",
  };
}

/**
 * Verifies if the HMAC-SHA256 signature matches the certificate payload.
 */
export function verifyCertificateSignature(
  payload: CertificatePayload,
  signature: string,
  secretKey: string = DEFAULT_SECRET,
): boolean {
  if (!signature || typeof signature !== "string" || !/^[0-9a-fA-F]{64}$/.test(signature)) {
    return false;
  }
  try {
    const expected = signCertificatePayload(payload, secretKey);
    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expBuf.length) return false;
    return timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

/**
 * Checks if a certificate has passed its expiration date.
 */
export function isCertificateExpired(
  expiresAt?: string | null,
  referenceDate: Date = new Date(),
): boolean {
  if (!expiresAt) return false;
  const expTime = new Date(expiresAt).getTime();
  if (Number.isNaN(expTime)) return false;
  return expTime < referenceDate.getTime();
}

/**
 * Full verification check verifying cryptographic integrity, expiration, and payload format.
 */
export function verifyCertificate(
  signedCert: SignedCertificate,
  secretKey: string = DEFAULT_SECRET,
  referenceDate: Date = new Date(),
): CertificateVerificationResult {
  if (!signedCert || !signedCert.verificationId || !signedCert.signature) {
    return {
      isValid: false,
      isTampered: true,
      isExpired: false,
      reason: "Missing verification ID or signature.",
    };
  }

  const { signature, algorithm, ...payload } = signedCert;

  if (algorithm !== "HMAC-SHA256") {
    return {
      isValid: false,
      isTampered: true,
      isExpired: false,
      reason: "Unsupported signature algorithm.",
    };
  }

  const signatureMatches = verifyCertificateSignature(payload, signature, secretKey);
  if (!signatureMatches) {
    return {
      isValid: false,
      isTampered: true,
      isExpired: false,
      reason: "Signature mismatch. Certificate record has been tampered with or modified.",
      payload,
    };
  }

  const expired = isCertificateExpired(payload.expiresAt, referenceDate);
  if (expired) {
    return {
      isValid: false,
      isTampered: false,
      isExpired: true,
      reason: "Certificate has expired.",
      payload,
    };
  }

  return {
    isValid: true,
    isTampered: false,
    isExpired: false,
    payload,
  };
}

/**
 * Checks whether a learner is eligible for a course certificate.
 */
export function checkCertificateEligibility(params: {
  progressPercent: number;
  gradePercent?: number;
  minimumPassGrade?: number;
  certificateEligible?: boolean;
}): { eligible: boolean; reason?: string } {
  if (params.certificateEligible === false) {
    return { eligible: false, reason: "Course is not eligible for certificates." };
  }
  if (params.progressPercent < 100) {
    return {
      eligible: false,
      reason: `Course progress is ${params.progressPercent}%. 100% completion required.`,
    };
  }
  const minGrade = params.minimumPassGrade ?? 0;
  if (minGrade > 0 && (params.gradePercent ?? 0) < minGrade) {
    return {
      eligible: false,
      reason: `Grade is ${params.gradePercent ?? 0}%. Minimum passing grade is ${minGrade}%.`,
    };
  }
  return { eligible: true };
}
