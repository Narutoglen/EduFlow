import type { Course, Enrollment, User } from "./types";

export const REFUND_WINDOW_DAYS = 14;
export const MAX_REFUND_PROGRESS_PERCENT = 20;

export type EnrollmentEligibilityResult = {
  allowed: boolean;
  code?:
    | "OK"
    | "COURSE_UNAVAILABLE"
    | "USER_INACTIVE"
    | "ALREADY_ENROLLED"
    | "QUOTA_EXCEEDED"
    | "PREREQUISITES_NOT_MET";
  message?: string;
};

export type RefundCheckResult = {
  canRefund: boolean;
  code:
    | "ELIGIBLE"
    | "NOT_PAID"
    | "ALREADY_REFUNDED"
    | "WINDOW_EXPIRED"
    | "PROGRESS_TOO_HIGH"
    | "INVALID_ENROLLMENT";
  reason?: string;
  refundAmountCents?: number;
};

/**
 * Checks whether a student can enroll in a course based on status, capacity, and prerequisites.
 */
export function checkEnrollmentEligibility(params: {
  course: Course;
  student: User;
  isAlreadyEnrolled?: boolean;
  currentEnrollmentCount?: number;
  maxStudents?: number | null;
  completedCourseSlugsOrIds?: string[];
}): EnrollmentEligibilityResult {
  const { course, student, isAlreadyEnrolled = false, currentEnrollmentCount = 0 } = params;

  if (!student.isActive) {
    return {
      allowed: false,
      code: "USER_INACTIVE",
      message: "Your account is disabled. Please contact support.",
    };
  }

  if (course.status !== "PUBLISHED") {
    return {
      allowed: false,
      code: "COURSE_UNAVAILABLE",
      message: "This course is not published or currently accepting enrollments.",
    };
  }

  if (isAlreadyEnrolled) {
    return {
      allowed: false,
      code: "ALREADY_ENROLLED",
      message: "You are already enrolled in this course.",
    };
  }

  // Quota enforcement
  if (params.maxStudents != null && params.maxStudents > 0) {
    if (currentEnrollmentCount >= params.maxStudents) {
      return {
        allowed: false,
        code: "QUOTA_EXCEEDED",
        message: `Course capacity of ${params.maxStudents} students has been reached.`,
      };
    }
  }

  // Prerequisites check
  if (course.prerequisites && course.prerequisites.length > 0) {
    const completed = new Set(
      (params.completedCourseSlugsOrIds ?? []).map((s) => s.toLowerCase().trim()),
    );
    const missing = course.prerequisites.filter(
      (prereq) => !completed.has(prereq.toLowerCase().trim()),
    );

    if (missing.length > 0) {
      return {
        allowed: false,
        code: "PREREQUISITES_NOT_MET",
        message: `Please complete prerequisites first: ${missing.join(", ")}.`,
      };
    }
  }

  return { allowed: true, code: "OK" };
}

/**
 * Checks whether a paid course enrollment qualifies for a full refund.
 */
export function checkRefundEligibility(params: {
  enrollmentStartedAt: string | Date;
  progressPercent: number;
  paymentStatus: "PENDING" | "PAID" | "REFUNDED" | string;
  paymentAmountCents: number;
  currentDate?: Date;
}): RefundCheckResult {
  const {
    enrollmentStartedAt,
    progressPercent,
    paymentStatus,
    paymentAmountCents,
    currentDate = new Date(),
  } = params;

  if (paymentStatus === "REFUNDED") {
    return {
      canRefund: false,
      code: "ALREADY_REFUNDED",
      reason: "This payment has already been refunded.",
    };
  }

  if (paymentStatus !== "PAID") {
    return {
      canRefund: false,
      code: "NOT_PAID",
      reason: "Only completed payments can be refunded.",
    };
  }

  if (paymentAmountCents <= 0) {
    return {
      canRefund: false,
      code: "NOT_PAID",
      reason: "Free enrollments do not have refundable amounts.",
    };
  }

  const startMs = new Date(enrollmentStartedAt).getTime();
  if (Number.isNaN(startMs)) {
    return {
      canRefund: false,
      code: "INVALID_ENROLLMENT",
      reason: "Invalid enrollment start date.",
    };
  }

  const ageInDays = (currentDate.getTime() - startMs) / (1000 * 60 * 60 * 24);
  if (ageInDays > REFUND_WINDOW_DAYS) {
    return {
      canRefund: false,
      code: "WINDOW_EXPIRED",
      reason: `Refund window of ${REFUND_WINDOW_DAYS} days has expired (${Math.floor(ageInDays)} days elapsed).`,
    };
  }

  if (progressPercent >= MAX_REFUND_PROGRESS_PERCENT) {
    return {
      canRefund: false,
      code: "PROGRESS_TOO_HIGH",
      reason: `Course progress is ${progressPercent}%. Refunds are only available for progress under ${MAX_REFUND_PROGRESS_PERCENT}%.`,
    };
  }

  return {
    canRefund: true,
    code: "ELIGIBLE",
    refundAmountCents: paymentAmountCents,
  };
}

/**
 * Calculates net refund amount deducting optional administrative processing fee.
 */
export function calculateNetRefund(
  amountCents: number,
  feePercentage = 0,
): number {
  if (amountCents <= 0) return 0;
  const feeFraction = Math.max(0, Math.min(100, feePercentage)) / 100;
  const feeCents = Math.round(amountCents * feeFraction);
  return Math.max(0, amountCents - feeCents);
}
