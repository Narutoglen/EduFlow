import { getCourseById, getEnrollment, getUser } from "./eduflow";

export type CheckoutRequest = {
  courseId: string;
  studentId: string;
};

export const paymentAdapter = {
  async createCheckoutSession({ courseId, studentId }: CheckoutRequest) {
    const course = getCourseById(courseId);
    const student = getUser(studentId);
    return {
      provider: "checkout",
      checkoutUrl: `/courses/${course?.slug ?? ""}?checkout=success`,
      amountCents: course?.priceCents ?? 0,
      customerEmail: student?.email,
      mode: course?.priceCents ? "payment" : "free-enrollment",
    };
  },
};

export const emailAdapter = {
  async sendTransactionalEmail(to: string, subject: string, body: string) {
    const payload = {
      to,
      from: process.env.EMAIL_FROM ?? "EduFlow <no-reply@eduflow.local>",
      subject,
      body,
    };
    if (process.env.EMAIL_WEBHOOK_URL) {
      await fetch(process.env.EMAIL_WEBHOOK_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      console.info("[EduFlow email]", payload);
    }
    return {
      provider: process.env.EMAIL_WEBHOOK_URL ? "webhook-email" : "console-email",
      to,
      subject,
      body,
      queued: true,
    };
  },
};

export const storageAdapter = {
  async createUploadUrl(fileName: string) {
    return {
      provider: "submission-storage",
      uploadUrl: `/uploads/submissions/${encodeURIComponent(fileName)}`,
      publicUrl: `/uploads/submissions/${encodeURIComponent(fileName)}`,
    };
  },
};

export const videoAdapter = {
  playbackUrl(url: string) {
    return {
      provider: url ? (url.includes("youtube") ? "YouTube" : "Video") : "Video pending",
      url,
      qualities: ["720p", "1080p"],
      speeds: [0.5, 1, 1.25, 1.5, 2],
    };
  },
};

export const certificateAdapter = {
  async createCertificate(studentId: string, courseId: string) {
    const enrollment = getEnrollment(studentId, courseId);
    return {
      provider: "local-pdf-renderer",
      eligible: enrollment?.progressPercent === 100,
      downloadUrl:
        enrollment?.progressPercent === 100
          ? `/api/certificates?studentId=${studentId}&courseId=${courseId}`
          : null,
    };
  },
};
