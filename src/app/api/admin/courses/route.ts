import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

function value(payload: Record<string, FormDataEntryValue>, key: string) {
  return String(payload[key] ?? "").trim();
}

function listValue(payload: Record<string, FormDataEntryValue>, key: string) {
  return value(payload, key)
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function cents(input: string) {
  const number = Number(input || "0");
  return Number.isFinite(number) ? Math.max(0, Math.round(number * 100)) : 0;
}

function enumValue<T extends string>(input: string, allowed: readonly T[], fallback: T) {
  return allowed.includes(input as T) ? (input as T) : fallback;
}

async function requireAdmin(request: Request) {
  const user = await getCurrentUser();
  if (user?.role === "ADMIN") return user;
  const acceptsJson = request.headers.get("accept")?.includes("application/json");
  if (acceptsJson) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  return NextResponse.redirect(new URL("/auth/login?notice=admin-required", request.url), 303);
}

async function resolveLecturerId(payload: Record<string, FormDataEntryValue>) {
  const lecturerId = value(payload, "lecturerId");
  if (lecturerId) return lecturerId;
  const lecturer = await prisma.user.findFirst({
    where: { role: "LECTURER", isActive: true },
    orderBy: { name: "asc" },
  });
  return lecturer?.id;
}

export async function POST(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const payload = Object.fromEntries((await request.formData()).entries());
  const action = value(payload, "action") || "create";
  const courseId = value(payload, "courseId");

  if (action === "delete" && courseId) {
    await prisma.course.update({
      where: { id: courseId },
      data: { deletedAt: new Date(), status: "REJECTED" },
    });
    return NextResponse.redirect(new URL("/admin?notice=course-deleted", request.url), 303);
  }

  if (action === "restore" && courseId) {
    await prisma.course.update({
      where: { id: courseId },
      data: { deletedAt: null, status: "DRAFT" },
    });
    return NextResponse.redirect(new URL("/admin?notice=course-restored", request.url), 303);
  }

  if (action === "publish" && courseId) {
    await prisma.course.update({
      where: { id: courseId },
      data: { status: "PUBLISHED", publishedAt: new Date(), deletedAt: null },
    });
    return NextResponse.redirect(new URL("/admin?notice=course-published", request.url), 303);
  }

  const title = value(payload, "title");
  const lecturerId = await resolveLecturerId(payload);
  if (!title || !lecturerId) {
    return NextResponse.redirect(new URL("/admin?notice=course-invalid", request.url), 303);
  }

  const slug = value(payload, "slug") || slugify(title);
  const status = enumValue(
    value(payload, "status"),
    ["DRAFT", "PENDING_REVIEW", "PUBLISHED", "REJECTED"] as const,
    "DRAFT",
  );
  const difficulty = enumValue(
    value(payload, "difficulty"),
    ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const,
    "BEGINNER",
  );
  const courseData = {
    slug,
    title,
    description: value(payload, "description"),
    thumbnailUrl: value(payload, "thumbnailUrl") || "/globe.svg",
    trailerUrl: value(payload, "trailerUrl") || "",
    categoryId: value(payload, "categoryId"),
    lecturerId,
    difficulty,
    status,
    priceCents: cents(value(payload, "price")),
    rating: Number(value(payload, "rating") || "0"),
    reviewCount: Number(value(payload, "reviewCount") || "0"),
    durationHours: Number(value(payload, "durationHours") || "0"),
    estimatedWeeklyHours: Number(value(payload, "estimatedWeeklyHours") || "0"),
    audience: value(payload, "audience"),
    learningOutcomes: listValue(payload, "learningOutcomes"),
    prerequisites: listValue(payload, "prerequisites"),
    tags: listValue(payload, "tags"),
    allowSkipAhead: value(payload, "allowSkipAhead") === "on",
    featured: value(payload, "featured") === "on",
    certificateEligible: value(payload, "certificateEligible") !== "off",
    publishedAt: status === "PUBLISHED" ? new Date() : null,
    deletedAt: null,
  };

  const savedCourse =
    action === "update" && courseId
      ? await prisma.course.update({ where: { id: courseId }, data: courseData })
      : await prisma.course.create({ data: courseData });

  const moduleTitle = value(payload, "moduleTitle");
  const lessonTitle = value(payload, "lessonTitle");
  let lessonId: string | undefined;
  if (moduleTitle && lessonTitle) {
    const courseModule = await prisma.courseModule.upsert({
      where: { courseId_order: { courseId: savedCourse.id, order: 1 } },
      update: { title: moduleTitle },
      create: { courseId: savedCourse.id, title: moduleTitle, order: 1 },
    });
    const lesson = await prisma.lesson.upsert({
      where: { moduleId_order: { moduleId: courseModule.id, order: 1 } },
      update: {
        title: lessonTitle,
        content: value(payload, "lessonContent"),
        durationMinutes: Number(value(payload, "lessonDurationMinutes") || "20"),
        videoUrl: value(payload, "lessonVideoUrl") || "",
      },
      create: {
        moduleId: courseModule.id,
        title: lessonTitle,
        content: value(payload, "lessonContent"),
        durationMinutes: Number(value(payload, "lessonDurationMinutes") || "20"),
        videoUrl: value(payload, "lessonVideoUrl") || "",
        order: 1,
      },
    });
    lessonId = lesson.id;

    const resourceTitle = value(payload, "resourceTitle");
    if (resourceTitle) {
      await prisma.lessonResource.upsert({
        where: { id: value(payload, "resourceId") || `${lesson.id}-resource-1` },
        update: {
          title: resourceTitle,
          type: value(payload, "resourceType") || "link",
          url: value(payload, "resourceUrl") || `/api/resources/${lesson.id}-resource-1`,
        },
        create: {
          id: value(payload, "resourceId") || `${lesson.id}-resource-1`,
          lessonId: lesson.id,
          title: resourceTitle,
          type: value(payload, "resourceType") || "link",
          url: value(payload, "resourceUrl") || `/api/resources/${lesson.id}-resource-1`,
        },
      });
    }
  }

  const referenceTitle = value(payload, "referenceTitle");
  if (referenceTitle) {
    await prisma.courseReference.upsert({
      where: { id: value(payload, "referenceId") || `${savedCourse.id}-ref-1` },
      update: {
        lessonId: lessonId ?? null,
        title: referenceTitle,
        authors: listValue(payload, "referenceAuthors"),
        publisher: value(payload, "referencePublisher"),
        publishedDate: value(payload, "referencePublishedDate") || null,
        url: value(payload, "referenceUrl"),
        accessedDate: new Date(),
        sourceType: value(payload, "referenceSourceType") || "report",
        apaCitation: value(payload, "referenceApaCitation"),
        annotation: value(payload, "referenceAnnotation") || null,
      },
      create: {
        id: value(payload, "referenceId") || `${savedCourse.id}-ref-1`,
        courseId: savedCourse.id,
        lessonId: lessonId ?? null,
        title: referenceTitle,
        authors: listValue(payload, "referenceAuthors"),
        publisher: value(payload, "referencePublisher"),
        publishedDate: value(payload, "referencePublishedDate") || null,
        url: value(payload, "referenceUrl"),
        accessedDate: new Date(),
        sourceType: value(payload, "referenceSourceType") || "report",
        apaCitation: value(payload, "referenceApaCitation"),
        annotation: value(payload, "referenceAnnotation") || null,
      },
    });
  }

  const notice = action === "update" ? "course-updated" : "course-created";
  return NextResponse.redirect(new URL(`/admin?notice=${notice}&edit=${savedCourse.id}`, request.url), 303);
}
