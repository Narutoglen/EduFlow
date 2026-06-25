import { notFound } from "next/navigation";
import { getResourceFromDb } from "@/lib/course-data";

function fileSafe(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ resourceId: string }> },
) {
  const { resourceId } = await params;
  const match = await getResourceFromDb(resourceId);
  if (!match) notFound();

  const { course, lesson, resource } = match;
  const body = [
    resource.title,
    "",
    `Course: ${course.title}`,
    `Lesson: ${lesson.title}`,
    "",
    "Use this resource alongside the lesson workspace.",
  ].join("\n");
  const filename = `${fileSafe(resource.title)}.txt`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "content-disposition": `attachment; filename=${filename}`,
    },
  });
}
