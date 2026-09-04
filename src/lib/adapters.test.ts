import { describe, expect, it } from "vitest";
import {
  certificateAdapter,
  emailAdapter,
  paymentAdapter,
  storageAdapter,
  videoAdapter,
} from "./adapters";

describe("Infrastructure Adapters", () => {
  describe("videoAdapter", () => {
    it("resolves YouTube provider for YouTube video URLs", () => {
      const result = videoAdapter.playbackUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
      expect(result.provider).toBe("YouTube");
      expect(result.url).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
      expect(result.speeds).toEqual([0.5, 1, 1.25, 1.5, 2]);
      expect(result.qualities).toEqual(["720p", "1080p"]);
    });

    it("resolves generic Video provider for direct video links", () => {
      const result = videoAdapter.playbackUrl("https://cdn.eduflow.local/lesson-1.mp4");
      expect(result.provider).toBe("Video");
      expect(result.url).toBe("https://cdn.eduflow.local/lesson-1.mp4");
    });

    it("handles missing or empty video URL with pending status", () => {
      const result = videoAdapter.playbackUrl("");
      expect(result.provider).toBe("Video pending");
      expect(result.url).toBe("");
    });
  });

  describe("paymentAdapter", () => {
    it("creates checkout session for paid course", async () => {
      const session = await paymentAdapter.createCheckoutSession({
        courseId: "course-ai-teaching",
        studentId: "usr-student",
      });

      expect(session.provider).toBe("checkout");
      expect(session.checkoutUrl).toContain("checkout=success");
      expect(session.amountCents).toBeGreaterThan(0);
      expect(session.mode).toBe("payment");
      expect(session.customerEmail).toBeDefined();
    });

    it("creates free enrollment session for 0-cent course", async () => {
      const session = await paymentAdapter.createCheckoutSession({
        courseId: "course-data-literacy",
        studentId: "usr-student",
      });

      expect(session.amountCents).toBe(0);
      expect(session.mode).toBe("free-enrollment");
    });
  });

  describe("storageAdapter", () => {
    it("creates encoded upload and public URLs for submissions", async () => {
      const result = await storageAdapter.createUploadUrl("student-assignment-1.pdf");
      expect(result.provider).toBe("submission-storage");
      expect(result.uploadUrl).toBe("/uploads/submissions/student-assignment-1.pdf");
      expect(result.publicUrl).toBe("/uploads/submissions/student-assignment-1.pdf");
    });

    it("escapes special characters in file names", async () => {
      const result = await storageAdapter.createUploadUrl("my submission & notes #1.txt");
      expect(result.uploadUrl).toBe("/uploads/submissions/my%20submission%20%26%20notes%20%231.txt");
    });
  });

  describe("certificateAdapter", () => {
    it("returns eligible and signed download URL for completed course (100% progress)", async () => {
      // In mock-data, usr-student is enrolled in course-data-literacy with 100% progress
      const result = await certificateAdapter.createCertificate("usr-student", "course-data-literacy");
      expect(result.provider).toBe("local-pdf-renderer");
      expect(result.eligible).toBe(true);
      expect(result.verificationId).toBeDefined();
      expect(result.downloadUrl).toContain("/api/certificates?verificationId=");
    });

    it("returns ineligible for incomplete course", async () => {
      // In mock-data, usr-student is enrolled in course-ai-teaching with 35% progress
      const result = await certificateAdapter.createCertificate("usr-student", "course-ai-teaching");
      expect(result.eligible).toBe(false);
      expect(result.verificationId).toBeNull();
      expect(result.downloadUrl).toBeNull();
    });
  });

  describe("emailAdapter", () => {
    it("queues transactional email to console in development", async () => {
      const result = await emailAdapter.sendTransactionalEmail(
        "student@eduflow.local",
        "Welcome to EduFlow",
        "Your account is confirmed.",
      );

      expect(result.to).toBe("student@eduflow.local");
      expect(result.subject).toBe("Welcome to EduFlow");
      expect(result.queued).toBe(true);
    });
  });
});
