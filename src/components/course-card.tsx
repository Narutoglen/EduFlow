import { Clock, Star, Users } from "lucide-react";
import Link from "next/link";
import { formatMoney, getCategory, getInstructor } from "@/lib/eduflow";
import type { Course } from "@/lib/types";
import { Badge, ProgressBar } from "./ui";

export function CourseCard({
  course,
  progress,
}: {
  course: Course;
  progress?: number;
}) {
  const category = getCategory(course.categoryId);
  const instructor = getInstructor(course);

  return (
    <article className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <Link href={`/courses/${course.slug}`} className="block">
        <img
          src={course.thumbnailUrl}
          alt=""
          className="h-44 w-full object-cover"
        />
      </Link>
      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <Badge tone="blue">{category?.name ?? "Course"}</Badge>
          <span className="text-sm font-semibold text-zinc-950 dark:text-white">
            {formatMoney(course.priceCents)}
          </span>
        </div>
        <div>
          <Link
            href={`/courses/${course.slug}`}
            className="text-lg font-semibold leading-7 text-zinc-950 hover:text-cyan-700 dark:text-white dark:hover:text-cyan-300"
          >
            {course.title}
          </Link>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            {course.description}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
          <span className="inline-flex items-center gap-1">
            <Star size={15} className="fill-amber-400 text-amber-400" />
            {course.rating || "New"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={15} />
            {course.durationHours}h
          </span>
          <span className="inline-flex items-center gap-1">
            <Users size={15} />
            {course.reviewCount} reviews
          </span>
        </div>
        <div className="flex items-center gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <img
            src={instructor.avatarUrl}
            alt=""
            className="h-9 w-9 rounded-full object-cover"
          />
          <div>
            <p className="text-sm font-medium text-zinc-950 dark:text-white">
              {instructor.name}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {course.difficulty}
            </p>
          </div>
        </div>
        {typeof progress === "number" ? (
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <ProgressBar value={progress} />
          </div>
        ) : null}
      </div>
    </article>
  );
}
