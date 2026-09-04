import { describe, expect, it } from "vitest";
import {
  calculateNetRefund,
  checkEnrollmentEligibility,
  checkRefundEligibility,
  MAX_REFUND_PROGRESS_PERCENT,
  REFUND_WINDOW_DAYS,
} from "./enrollments";
import type { Course, User } from "./types";

function createTestUser(overrides: Partial<User> = {}): User {
  return {
    id: "student-1",
    name: "Jane Learner",
    email: "jane@eduflow.local",
    role: "STUDENT",
    avatarUrl: "/globe.svg",
    bio: "Test student",
    isActive: true,
    socialLinks: [],
    ...overrides,
  };
}

function createTestCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: "course-test-1",
    slug: "modern-ai",
    title: "Modern AI & Deep Learning",
    description: "Introductory AI course",
    thumbnailUrl: "/thumb.jpg",
    trailerUrl: "",
    categoryId: "cat-ai",
    difficulty: "Beginner",
    priceCents: 4900,
    rating: 4.9,
    reviewCount: 30,
    durationHours: 6,
    estimatedWeeklyHours: 3,
    audience: "Students",
    learningOutcomes: ["Master neural nets"],
    certificateEligible: true,
    prerequisites: [],
    tags: ["ai", "python"],
    lecturerId: "lecturer-1",
    taIds: [],
    status: "PUBLISHED",
    allowSkipAhead: false,
    featured: true,
    modules: [],
    quizzes: [],
    assignments: [],
    ...overrides,
  };
}

describe("Enrollment Quotas & Refund Policy Engine", () => {
  describe("Enrollment Eligibility & Quota Enforcement", () => {
    it("allows active student to enroll in an open published course", () => {
      const student = createTestUser();
      const course = createTestCourse();
      const result = checkEnrollmentEligibility({ course, student });

      expect(result.allowed).toBe(true);
      expect(result.code).toBe("OK");
    });

    it("rejects enrollment for disabled/inactive user accounts", () => {
      const inactiveStudent = createTestUser({ isActive: false });
      const course = createTestCourse();
      const result = checkEnrollmentEligibility({ course, student: inactiveStudent });

      expect(result.allowed).toBe(false);
      expect(result.code).toBe("USER_INACTIVE");
    });

    it("rejects enrollment in unpublished courses (DRAFT, PENDING_REVIEW, REJECTED)", () => {
      const student = createTestUser();
      const draftCourse = createTestCourse({ status: "DRAFT" });
      const pendingCourse = createTestCourse({ status: "PENDING_REVIEW" });
      const rejectedCourse = createTestCourse({ status: "REJECTED" });

      expect(checkEnrollmentEligibility({ course: draftCourse, student }).code).toBe("COURSE_UNAVAILABLE");
      expect(checkEnrollmentEligibility({ course: pendingCourse, student }).code).toBe("COURSE_UNAVAILABLE");
      expect(checkEnrollmentEligibility({ course: rejectedCourse, student }).code).toBe("COURSE_UNAVAILABLE");
    });

    it("rejects enrollment if student is already enrolled", () => {
      const student = createTestUser();
      const course = createTestCourse();
      const result = checkEnrollmentEligibility({
        course,
        student,
        isAlreadyEnrolled: true,
      });

      expect(result.allowed).toBe(false);
      expect(result.code).toBe("ALREADY_ENROLLED");
    });

    it("enforces course quota capacity limits", () => {
      const student = createTestUser();
      const cappedCourse = createTestCourse();

      // Under capacity: 45 / 50 -> Allowed
      expect(
        checkEnrollmentEligibility({
          course: cappedCourse,
          student,
          currentEnrollmentCount: 45,
          maxStudents: 50,
        }).allowed,
      ).toBe(true);

      // At capacity: 50 / 50 -> Rejected with QUOTA_EXCEEDED
      const atCapacity = checkEnrollmentEligibility({
        course: cappedCourse,
        student,
        currentEnrollmentCount: 50,
        maxStudents: 50,
      });
      expect(atCapacity.allowed).toBe(false);
      expect(atCapacity.code).toBe("QUOTA_EXCEEDED");

      // Over capacity: 51 / 50 -> Rejected
      expect(
        checkEnrollmentEligibility({
          course: cappedCourse,
          student,
          currentEnrollmentCount: 51,
          maxStudents: 50,
        }).code,
      ).toBe("QUOTA_EXCEEDED");
    });

    it("validates course prerequisites", () => {
      const student = createTestUser();
      const advancedCourse = createTestCourse({
        prerequisites: ["Python Fundamentals", "Calculus I"],
      });

      // Missing prerequisites -> Rejected
      const missingPrereqs = checkEnrollmentEligibility({
        course: advancedCourse,
        student,
        completedCourseSlugsOrIds: ["Python Fundamentals"], // missing Calculus I
      });
      expect(missingPrereqs.allowed).toBe(false);
      expect(missingPrereqs.code).toBe("PREREQUISITES_NOT_MET");
      expect(missingPrereqs.message).toContain("Calculus I");

      // All prerequisites completed -> Allowed
      const metPrereqs = checkEnrollmentEligibility({
        course: advancedCourse,
        student,
        completedCourseSlugsOrIds: ["python fundamentals", "calculus i"], // case-insensitive
      });
      expect(metPrereqs.allowed).toBe(true);
      expect(metPrereqs.code).toBe("OK");
    });
  });

  describe("Payment Refund Policy (checkRefundEligibility)", () => {
    const referenceDate = new Date("2026-08-14T12:00:00Z");

    it("approves refund within 14 days and progress under 20%", () => {
      const result = checkRefundEligibility({
        enrollmentStartedAt: new Date("2026-08-10T12:00:00Z"), // 4 days ago
        progressPercent: 10,
        paymentStatus: "PAID",
        paymentAmountCents: 4900,
        currentDate: referenceDate,
      });

      expect(result.canRefund).toBe(true);
      expect(result.code).toBe("ELIGIBLE");
      expect(result.refundAmountCents).toBe(4900);
    });

    it("approves refund for 0% progress on newly enrolled courses", () => {
      const result = checkRefundEligibility({
        enrollmentStartedAt: referenceDate,
        progressPercent: 0,
        paymentStatus: "PAID",
        paymentAmountCents: 9900,
        currentDate: referenceDate,
      });

      expect(result.canRefund).toBe(true);
      expect(result.code).toBe("ELIGIBLE");
    });

    it("approves refund at boundary (19% progress, 14 days elapsed)", () => {
      const fourteenDaysAgo = new Date(referenceDate.getTime() - 14 * 24 * 60 * 60 * 1000);
      const result = checkRefundEligibility({
        enrollmentStartedAt: fourteenDaysAgo,
        progressPercent: 19,
        paymentStatus: "PAID",
        paymentAmountCents: 4900,
        currentDate: referenceDate,
      });

      expect(result.canRefund).toBe(true);
      expect(result.code).toBe("ELIGIBLE");
    });

    it("rejects refund when progress is 20% or higher", () => {
      const result = checkRefundEligibility({
        enrollmentStartedAt: new Date("2026-08-12T12:00:00Z"),
        progressPercent: 20, // threshold
        paymentStatus: "PAID",
        paymentAmountCents: 4900,
        currentDate: referenceDate,
      });

      expect(result.canRefund).toBe(false);
      expect(result.code).toBe("PROGRESS_TOO_HIGH");
      expect(result.reason).toContain(`under ${MAX_REFUND_PROGRESS_PERCENT}%`);
    });

    it("rejects refund when refund window (14 days) has elapsed", () => {
      const fifteenDaysAgo = new Date(referenceDate.getTime() - 15 * 24 * 60 * 60 * 1000);
      const result = checkRefundEligibility({
        enrollmentStartedAt: fifteenDaysAgo,
        progressPercent: 5,
        paymentStatus: "PAID",
        paymentAmountCents: 4900,
        currentDate: referenceDate,
      });

      expect(result.canRefund).toBe(false);
      expect(result.code).toBe("WINDOW_EXPIRED");
      expect(result.reason).toContain(`${REFUND_WINDOW_DAYS} days has expired`);
    });

    it("rejects refund for payments that are not PAID (PENDING or FREE)", () => {
      expect(
        checkRefundEligibility({
          enrollmentStartedAt: referenceDate,
          progressPercent: 0,
          paymentStatus: "PENDING",
          paymentAmountCents: 4900,
          currentDate: referenceDate,
        }).code,
      ).toBe("NOT_PAID");

      expect(
        checkRefundEligibility({
          enrollmentStartedAt: referenceDate,
          progressPercent: 0,
          paymentStatus: "PAID",
          paymentAmountCents: 0, // free
          currentDate: referenceDate,
        }).code,
      ).toBe("NOT_PAID");
    });

    it("rejects refund if payment was already refunded", () => {
      const result = checkRefundEligibility({
        enrollmentStartedAt: referenceDate,
        progressPercent: 0,
        paymentStatus: "REFUNDED",
        paymentAmountCents: 4900,
        currentDate: referenceDate,
      });

      expect(result.canRefund).toBe(false);
      expect(result.code).toBe("ALREADY_REFUNDED");
    });
  });

  describe("Net Refund Calculations (calculateNetRefund)", () => {
    it("returns full amount when fee percentage is 0", () => {
      expect(calculateNetRefund(5000, 0)).toBe(5000);
    });

    it("deducts administrative fee percentage accurately", () => {
      // 5% fee on $50.00 (5000 cents) = 250 cents fee => 4750 cents net
      expect(calculateNetRefund(5000, 5)).toBe(4750);
    });

    it("handles zero and negative amounts safely", () => {
      expect(calculateNetRefund(0, 5)).toBe(0);
      expect(calculateNetRefund(-100, 5)).toBe(0);
    });

    it("clamps fee percentages between 0 and 100", () => {
      expect(calculateNetRefund(5000, 100)).toBe(0);
      expect(calculateNetRefund(5000, 150)).toBe(0); // clamped to 100%
      expect(calculateNetRefund(5000, -10)).toBe(5000); // clamped to 0%
    });
  });
});
