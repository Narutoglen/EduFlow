"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

async function setCourseStatus(
  formData: FormData,
  status: "PUBLISHED" | "REJECTED",
) {
  await requireRole(["ADMIN"]);
  const courseId = String(formData.get("courseId") ?? "");
  if (!courseId) {
    redirect("/admin?review=invalid");
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    redirect("/admin?review=missing");
  }

  await prisma.course.update({
    where: { id: courseId },
    data: {
      status,
      // Stamp publish time on first approval; clear it on rejection.
      publishedAt: status === "PUBLISHED" ? (course.publishedAt ?? new Date()) : null,
    },
  });

  revalidatePath("/admin");
  redirect(`/admin?review=${status === "PUBLISHED" ? "approved" : "rejected"}`);
}

export async function approveCourseAction(formData: FormData) {
  await setCourseStatus(formData, "PUBLISHED");
}

export async function rejectCourseAction(formData: FormData) {
  await setCourseStatus(formData, "REJECTED");
}
