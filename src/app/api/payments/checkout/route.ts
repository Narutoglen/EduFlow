import { NextResponse } from "next/server";
import { paymentAdapter } from "@/lib/adapters";
import { userForRole } from "@/lib/mock-data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const courseId = url.searchParams.get("courseId") ?? "course-data-literacy";
  const checkout = await paymentAdapter.createCheckoutSession({
    courseId,
    studentId: userForRole("STUDENT").id,
  });

  return NextResponse.json(checkout);
}

export async function POST(request: Request) {
  const payload = await request.json();
  const checkout = await paymentAdapter.createCheckoutSession({
    courseId: String(payload.courseId ?? ""),
    studentId: String(payload.studentId ?? userForRole("STUDENT").id),
  });

  return NextResponse.json(checkout);
}
