"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isDbUnavailable } from "@/lib/db-fallback";
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

  // Approvals write to Postgres. Keep redirect() out of the try so its
  // NEXT_REDIRECT control-flow signal is never swallowed; a DB outage surfaces
  // as a clear "offline" notice rather than a 500 mid-demo.
  let result: "missing" | "ok" | "offline" = "offline";
  try {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      result = "missing";
    } else {
      await prisma.course.update({
        where: { id: courseId },
        data: {
          status,
          // Stamp publish time on first approval; clear it on rejection.
          publishedAt: status === "PUBLISHED" ? (course.publishedAt ?? new Date()) : null,
        },
      });
      result = "ok";
    }
  } catch (error) {
    if (!isDbUnavailable(error)) throw error;
    result = "offline";
  }

  if (result === "missing") redirect("/admin?review=missing");
  if (result === "offline") redirect("/admin?review=offline");

  revalidatePath("/admin");
  redirect(`/admin?review=${status === "PUBLISHED" ? "approved" : "rejected"}`);
}

export async function approveCourseAction(formData: FormData) {
  await setCourseStatus(formData, "PUBLISHED");
}

export async function rejectCourseAction(formData: FormData) {
  await setCourseStatus(formData, "REJECTED");
}
